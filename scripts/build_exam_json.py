from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    from google import genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None

try:
    from google.genai import errors as genai_errors
except ImportError:  # pragma: no cover - optional dependency
    genai_errors = None

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDFS_DIR = ROOT / "docs" / "pdfs"
OUTPUT_PATH = ROOT / "generated" / "exams.json"
DOTENV_PATH = ROOT / ".env"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
DEFAULT_EXPLANATION_CACHE_PATH = ROOT / "generated" / "choice_explanations_cache.json"

CHOICE_MARKERS = ["\u2460", "\u2461", "\u2462", "\u2463"]
ANSWER_ROW_MARKERS = [
    "12345678910",
    "11121314151617181920",
    "21222324252627282930",
    "31323334353637383940",
    "41424344454647484950",
]
CHOICE_EXPLANATION_SCHEMA = {
    "type": "object",
    "properties": {
        "answerExplanation": {"type": "string"},
        "choiceExplanations": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 4,
            "maxItems": 4,
        },
    },
    "required": ["answerExplanation", "choiceExplanations"],
}
BATCH_CHOICE_EXPLANATION_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "examId": {"type": "string"},
                    "number": {"type": "integer"},
                    "answerExplanation": {"type": "string"},
                    "choiceExplanations": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 4,
                        "maxItems": 4,
                    },
                },
                "required": ["examId", "number", "answerExplanation", "choiceExplanations"],
            },
        }
    },
    "required": ["items"],
}
SUBJECT_RANGES = [
    (1, 17, "TCP/IP"),
    (18, 27, "네트워크일반"),
    (28, 45, "NOS"),
    (46, 50, "네트워크운용기기"),
]
BODY_TEXT_REPAIRS = {
    "net2_20210228.pdf": [
        (
            "① ServerName MaxClients\n③ KeepAlive ④ DocumentRoot",
            "① ServerName ② MaxClients\n③ KeepAlive ④ DocumentRoot",
        ),
    ]
}


@dataclass
class GeminiApiKeyEntry:
    name: str
    value: str


class GeminiClientPool:
    def __init__(self, api_keys: list[GeminiApiKeyEntry]) -> None:
        if not api_keys:
            raise ValueError("At least one Gemini API key is required")
        self.api_keys = api_keys
        self.index = 0
        self.client = self._build_client(self.api_keys[self.index].value)

    def _build_client(self, api_key: str) -> Any:
        return genai.Client(api_key=api_key)

    @property
    def current_key_name(self) -> str:
        return self.api_keys[self.index].name

    @property
    def key_count(self) -> int:
        return len(self.api_keys)

    def rotate(self) -> bool:
        if self.index + 1 >= len(self.api_keys):
            return False
        self.index += 1
        self.client = self._build_client(self.api_keys[self.index].value)
        return True


def clean_page(text: str) -> str:
    text = text.replace("\xa0", " ")
    lines = text.splitlines()
    if (
        len(lines) >= 2
        and lines[0].startswith("건시스템 http://www.gunsys.com")
        and re.fullmatch(r"- \d+ -", lines[1].strip())
    ):
        lines = lines[2:]
    return "\n".join(lines).strip()


def apply_body_text_repairs(pdf_path: Path, body_text: str) -> str:
    repaired = body_text
    for before, after in BODY_TEXT_REPAIRS.get(pdf_path.name, []):
        repaired = repaired.replace(before, after)
    return repaired


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n")
    # PDF 줄바꿈 때문에 한글 단어가 중간에서 끊긴 경우를 먼저 복원한다.
    text = re.sub(r"(?<=[가-힣])\s*\n\s*(?=[가-힣])", "", text)
    # 콘솔 출력 예제는 PDF 추출 시 줄바꿈이 자주 사라져 한 줄로 붙는다.
    # ping 출력에서 확인되는 고정 패턴만 먼저 줄바꿈으로 복원한다.
    text = re.sub(r"([?!.])\s*(?=(?:[A-Z]:\\>|[A-Za-z0-9_.-]+>ping\b))", r"\1\n", text)
    text = re.sub(
        r"\s*(ping\s+[A-Za-z0-9_.-]+\s+\[\d{1,3}(?:\.\d{1,3}){3}\])",
        r"\n\1",
        text,
    )
    text = re.sub(r"(?<=사용:)\s*(?=\d{1,3}(?:\.\d{1,3}){3}의 응답:)", "\n", text)
    text = re.sub(r"\s*(\d{1,3}(?:\.\d{1,3}){3}의 응답:)", r"\n\1", text)
    text = re.sub(r"\s*(\d{1,3}(?:\.\d{1,3}){3}에 대한 Ping 통계:)", r"\n\1", text)
    text = re.sub(r"\s*(패킷:\s*보냄)", r"\n\1", text)
    text = re.sub(r"\s*(왕복 시간\(밀리초\):)", r"\n\1", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    return text.strip()


def extract_pages(pdf_path: Path) -> list[str]:
    reader = PdfReader(str(pdf_path))
    return [clean_page(page.extract_text() or "") for page in reader.pages]


def parse_metadata(pdf_path: Path, first_page: str) -> dict[str, object]:
    date_digits = re.search(r"(\d{8})", pdf_path.stem)
    date_iso = None
    if date_digits:
        raw = date_digits.group(1)
        date_iso = f"{raw[:4]}-{raw[4:6]}-{raw[6:8]}"

    round_match = re.search(r"\((\d{4})\.(\d{1,2})\.(\d{1,2})\.\s*(\d+)회\)", first_page)
    round_number = int(round_match.group(4)) if round_match else None

    return {
        "examId": pdf_path.stem.replace("net2_", ""),
        "title": "네트워크관리사 2급 필기",
        "examDate": date_iso,
        "round": round_number,
        "sourceFile": f"docs/pdfs/{pdf_path.name}",
    }


def parse_answers(first_page: str) -> list[int]:
    compact = re.sub(r"\s+", "", first_page)
    start = compact.find(ANSWER_ROW_MARKERS[0])
    end = compact.find("합격점수")
    if start < 0 or end < 0:
        raise ValueError("Could not locate answer table boundaries")

    answer_block = compact[start:end]
    answers: list[int] = []

    for index, marker in enumerate(ANSWER_ROW_MARKERS):
        marker_start = answer_block.find(marker)
        if marker_start < 0:
            raise ValueError(f"Missing answer row marker: {marker}")

        if index + 1 < len(ANSWER_ROW_MARKERS):
            next_start = answer_block.find(
                ANSWER_ROW_MARKERS[index + 1], marker_start + len(marker)
            )
        else:
            next_start = len(answer_block)

        if next_start < 0:
            raise ValueError("Could not locate next answer row marker")

        chunk = answer_block[marker_start + len(marker) : next_start]
        runs = re.findall(r"[1-4]{5,}", chunk)
        if not runs:
            raise ValueError(f"Could not extract answers from chunk: {chunk[:80]}")

        row = max(runs, key=len)[:10]
        answers.extend(int(value) for value in row)

    if len(answers) != 50:
        raise ValueError(f"Expected 50 answers, got {len(answers)}")

    return answers


def has_all_choices(segment: str) -> bool:
    position = 0
    for marker in CHOICE_MARKERS:
        choice_pos = segment.find(marker, position)
        if choice_pos < 0:
            return False
        position = choice_pos + 1
    return True


def split_question_segments(body_text: str) -> list[str]:
    current_start = body_text.find("1. ")
    if current_start < 0:
        raise ValueError("Could not find question 1")

    starts = [current_start]

    for next_number in range(2, 51):
        search_from = current_start + 1
        next_start = -1

        while True:
            candidate = body_text.find(f"{next_number}. ", search_from)
            if candidate < 0:
                raise ValueError(f"Could not find question {next_number}")
            if has_all_choices(body_text[current_start:candidate]):
                next_start = candidate
                break
            search_from = candidate + 1

        starts.append(next_start)
        current_start = next_start

    segments = []
    for index, start in enumerate(starts):
        end = starts[index + 1] if index + 1 < len(starts) else len(body_text)
        segments.append(body_text[start:end].strip())

    if len(segments) != 50:
        raise ValueError(f"Expected 50 question segments, got {len(segments)}")

    return segments


def parse_question_segment(segment: str, answer: int) -> dict[str, object]:
    number_match = re.match(r"(\d+)\.\s*", segment)
    if not number_match:
        raise ValueError(f"Question number missing: {segment[:80]}")

    number = int(number_match.group(1))
    body = segment[number_match.end() :]

    positions = []
    search_from = 0
    for marker in CHOICE_MARKERS:
        marker_pos = body.find(marker, search_from)
        if marker_pos < 0:
            raise ValueError(f"Choice marker missing in question {number}")
        positions.append(marker_pos)
        search_from = marker_pos + 1

    question_text = normalize_text(body[: positions[0]])
    choices = []
    for index, marker_pos in enumerate(positions):
        content_start = marker_pos + 1
        content_end = positions[index + 1] if index + 1 < len(positions) else len(body)
        choices.append(normalize_text(body[content_start:content_end]))

    if len(choices) != 4:
        raise ValueError(f"Question {number} does not have 4 choices")

    if answer < 1 or answer > 4:
        raise ValueError(f"Question {number} has invalid answer: {answer}")

    return {
        "number": number,
        "subject": find_subject(number),
        "question": question_text,
        "choices": choices,
        "answer": answer,
        "answerText": choices[answer - 1],
    }


def find_subject(number: int) -> str:
    for start, end, subject in SUBJECT_RANGES:
        if start <= number <= end:
            return subject
    raise ValueError(f"Question number out of range: {number}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build exam JSON from PDFs and optionally add Gemini explanations."
    )
    parser.add_argument(
        "--with-choice-explanations",
        action="store_true",
        help="Ask Gemini for an explanation of each choice and the correct answer.",
    )
    parser.add_argument(
        "--apply-explanation-cache",
        action="store_true",
        help="Apply cached Gemini explanations to exams.json without making API requests.",
    )
    parser.add_argument(
        "--gemini-model",
        default=os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL),
        help=f"Gemini model to use. Default: {DEFAULT_GEMINI_MODEL}",
    )
    parser.add_argument(
        "--explanation-cache",
        type=Path,
        default=Path(
            os.getenv(
                "GEMINI_EXPLANATION_CACHE",
                str(DEFAULT_EXPLANATION_CACHE_PATH),
            )
        ),
        help="Path to the JSON cache file for Gemini explanations.",
    )
    parser.add_argument(
        "--requests-per-minute",
        type=float,
        default=float(os.getenv("GEMINI_REQUESTS_PER_MINUTE", "0")),
        help="Throttle Gemini requests. Use 5 for the current free-tier limit.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=int(os.getenv("GEMINI_BATCH_SIZE", "5")),
        help="Number of questions to send in one Gemini request.",
    )
    return parser.parse_args()


def load_dotenv_if_present(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return

    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue
        os.environ[key] = value.strip().strip("\"'")


def load_explanation_cache(cache_path: Path) -> dict[str, Any]:
    if not cache_path.exists():
        return {}
    return json.loads(cache_path.read_text(encoding="utf-8"))


def save_explanation_cache(cache_path: Path, cache: dict[str, Any]) -> None:
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def write_exams_json(exams: list[dict[str, object]]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(exams, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def load_existing_explanations(output_path: Path) -> dict[tuple[str, int], dict[str, object]]:
    if not output_path.exists():
        return {}

    exams = json.loads(output_path.read_text(encoding="utf-8"))
    restored: dict[tuple[str, int], dict[str, object]] = {}

    for exam in exams:
        exam_id = str(exam.get("examId"))
        for question in exam.get("questions", []):
            answer_explanation = question.get("answerExplanation")
            choice_explanations = question.get("choiceExplanations")
            if not isinstance(answer_explanation, str):
                continue
            if not isinstance(choice_explanations, list) or len(choice_explanations) != 4:
                continue

            restored[(exam_id, int(question["number"]))] = {
                "answerExplanation": answer_explanation.strip(),
                "choiceExplanations": [str(item).strip() for item in choice_explanations],
            }

    return restored


def collect_gemini_api_keys() -> list[GeminiApiKeyEntry]:
    keys: list[GeminiApiKeyEntry] = []
    seen: set[str] = set()

    def add_key(name: str, value: str | None) -> None:
        if value is None:
            return
        cleaned = value.strip()
        if not cleaned or cleaned in seen:
            return
        seen.add(cleaned)
        keys.append(GeminiApiKeyEntry(name=name, value=cleaned))

    add_key("GEMINI_API_KEY", os.getenv("GEMINI_API_KEY"))
    add_key("GOOGLE_API_KEY", os.getenv("GOOGLE_API_KEY"))

    indexed_keys: list[tuple[int, str, str]] = []
    for name, value in os.environ.items():
        match = re.fullmatch(r"GEMINI_API_KEY(\d+)", name)
        if match and value.strip():
            indexed_keys.append((int(match.group(1)), name, value))
    for _index, name, value in sorted(indexed_keys, key=lambda item: item[0]):
        add_key(name, value)

    raw_key_list = os.getenv("GEMINI_API_KEYS", "")
    if raw_key_list.strip():
        for index, value in enumerate(raw_key_list.split(","), start=1):
            add_key(f"GEMINI_API_KEYS[{index}]", value)

    return keys


def ensure_gemini_client_pool() -> GeminiClientPool:
    if genai is None:
        raise SystemExit(
            "Choice explanations require google-genai. Install it first: pip install google-genai"
        )
    api_keys = collect_gemini_api_keys()
    if not api_keys:
        raise SystemExit(
            "Choice explanations require at least one Gemini API key. Set GEMINI_API_KEY, GOOGLE_API_KEY, GEMINI_API_KEY1..N, or GEMINI_API_KEYS."
        )
    return GeminiClientPool(api_keys)


def build_choice_explanation_prompt(exam: dict[str, object], question: dict[str, object]) -> str:
    choices = question["choices"]
    choice_lines = [
        f"{index}. {choice}"
        for index, choice in enumerate(choices, start=1)
    ]
    return "\n".join(
        [
            "다음 객관식 문제를 한국어로 해설해 주세요.",
            "출력은 스키마에 맞춘 JSON만 반환하세요.",
            f"시험 ID: {exam['examId']}",
            f"과목: {question['subject']}",
            f"문항 번호: {question['number']}",
            f"문제: {question['question']}",
            "선택지:",
            *choice_lines,
            f"정답 번호: {question['answer']}",
            f"정답 내용: {question['answerText']}",
            "요구사항:",
            "- answerExplanation: 정답이 왜 맞는지 2~4문장으로 설명",
            "- choiceExplanations: 4개 항목, 각 선택지가 왜 맞거나 틀린지 한두 문장씩 설명",
            "- 확실하지 않으면 추정이라고 밝히고, 문제/선택지에 근거해서만 설명",
        ]
    )


def build_batch_choice_explanation_prompt(
    work_items: list[tuple[dict[str, object], dict[str, object], str]]
) -> str:
    lines = [
        "다음 객관식 문제 여러 개를 한국어로 해설해 주세요.",
        "출력은 스키마에 맞춘 JSON만 반환하세요.",
        "items 배열에는 입력 문항 수와 같은 수의 결과를 넣으세요.",
        "각 결과에는 examId, number, answerExplanation, choiceExplanations(4개)를 포함하세요.",
        "examId와 number는 각 입력 문항과 정확히 일치해야 합니다.",
        "확실하지 않으면 추정이라고 밝히고, 문제/선택지에 근거해서만 설명하세요.",
        "",
    ]

    for exam, question, _cache_key in work_items:
        lines.extend(
            [
                f"[문항 {question['number']}]",
                f"시험 ID: {exam['examId']}",
                f"과목: {question['subject']}",
                f"문제: {question['question']}",
                "선택지:",
                *[
                    f"{index}. {choice}"
                    for index, choice in enumerate(question["choices"], start=1)
                ],
                f"정답 번호: {question['answer']}",
                f"정답 내용: {question['answerText']}",
                "요구사항:",
                "- answerExplanation: 정답이 왜 맞는지 2~4문장으로 설명",
                "- choiceExplanations: 4개 항목, 각 선택지가 왜 맞거나 틀린지 한두 문장씩 설명",
                "",
            ]
        )

    return "\n".join(lines).strip()


def make_explanation_cache_key(exam_id: str, question: dict[str, object]) -> str:
    payload = {
        "examId": exam_id,
        "number": question["number"],
        "question": question["question"],
        "choices": question["choices"],
        "answer": question["answer"],
        "answerText": question["answerText"],
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def restore_explanations_from_previous_output(
    exams: list[dict[str, object]],
    previous_explanations: dict[tuple[str, int], dict[str, object]],
    cache: dict[str, Any],
) -> int:
    restored_count = 0

    for exam in exams:
        exam_id = str(exam["examId"])
        for question in exam["questions"]:
            if question.get("answerExplanation") and question.get("choiceExplanations"):
                continue

            restored = previous_explanations.get((exam_id, int(question["number"])))
            if restored is None:
                continue

            question.update(restored)
            cache[make_explanation_cache_key(exam_id, question)] = restored
            restored_count += 1

    return restored_count


def prune_explanation_cache(
    exams: list[dict[str, object]],
    cache: dict[str, Any],
) -> dict[str, Any]:
    valid_keys = {
        make_explanation_cache_key(str(exam["examId"]), question)
        for exam in exams
        for question in exam["questions"]
        if question.get("answerExplanation") and question.get("choiceExplanations")
    }
    return {key: value for key, value in cache.items() if key in valid_keys}


def request_choice_explanations(
    client: Any,
    model: str,
    exam: dict[str, object],
    question: dict[str, object],
) -> dict[str, object]:
    response = client.models.generate_content(
        model=model,
        contents=build_choice_explanation_prompt(exam, question),
        config={
            "response_mime_type": "application/json",
            "response_json_schema": CHOICE_EXPLANATION_SCHEMA,
            "temperature": 0.2,
        },
    )
    data = json.loads(response.text)
    explanations = data.get("choiceExplanations")
    if not isinstance(explanations, list) or len(explanations) != 4:
        raise ValueError(
            f"Gemini returned invalid choice explanations for question {question['number']}"
        )
    if not isinstance(data.get("answerExplanation"), str):
        raise ValueError(
            f"Gemini returned an invalid answer explanation for question {question['number']}"
        )
    return {
        "answerExplanation": data["answerExplanation"].strip(),
        "choiceExplanations": [str(item).strip() for item in explanations],
    }


def request_choice_explanations_batch(
    client: Any,
    model: str,
    work_items: list[tuple[dict[str, object], dict[str, object], str]],
) -> dict[str, dict[str, object]]:
    response = client.models.generate_content(
        model=model,
        contents=build_batch_choice_explanation_prompt(work_items),
        config={
            "response_mime_type": "application/json",
            "response_json_schema": BATCH_CHOICE_EXPLANATION_SCHEMA,
            "temperature": 0.2,
        },
    )
    data = json.loads(response.text)
    raw_items = data.get("items")
    if not isinstance(raw_items, list) or len(raw_items) != len(work_items):
        raise ValueError(
            f"Gemini returned {len(raw_items) if isinstance(raw_items, list) else 'invalid'} batch items, expected {len(work_items)}"
        )

    expected_keys = {
        (str(exam["examId"]), int(question["number"]))
        for exam, question, _ in work_items
    }
    parsed_by_key: dict[tuple[str, int], dict[str, object]] = {}
    for item in raw_items:
        if not isinstance(item, dict):
            raise ValueError("Gemini returned an invalid batch explanation item")
        exam_id = item.get("examId")
        number = item.get("number")
        explanations = item.get("choiceExplanations")
        answer_explanation = item.get("answerExplanation")
        key = (str(exam_id), number)
        if not isinstance(exam_id, str) or not isinstance(number, int) or key not in expected_keys:
            raise ValueError(f"Gemini returned an unexpected question id: {exam_id} Q{number}")
        if not isinstance(answer_explanation, str):
            raise ValueError(
                f"Gemini returned an invalid answer explanation for question {exam_id} Q{number}"
            )
        if not isinstance(explanations, list) or len(explanations) != 4:
            raise ValueError(
                f"Gemini returned invalid choice explanations for question {exam_id} Q{number}"
            )
        parsed_by_key[key] = {
            "answerExplanation": answer_explanation.strip(),
            "choiceExplanations": [str(value).strip() for value in explanations],
        }

    if len(parsed_by_key) != len(work_items):
        raise ValueError("Gemini batch response did not contain unique results for every question")

    results: dict[str, dict[str, object]] = {}
    for exam, question, cache_key in work_items:
        key = (str(exam["examId"]), int(question["number"]))
        if key not in parsed_by_key:
            raise ValueError(f"Gemini batch response omitted question {key[0]} Q{key[1]}")
        results[cache_key] = parsed_by_key[key]
    return results


def is_gemini_batch_validation_error(error: Exception) -> bool:
    if not isinstance(error, ValueError):
        return False
    text = str(error)
    return text.startswith("Gemini returned") or text.startswith("Gemini batch response")


def is_gemini_quota_error(error: Exception) -> bool:
    if genai_errors is not None and isinstance(error, genai_errors.ClientError):
        code = getattr(error, "code", None)
        status = str(getattr(error, "status", ""))
        message = str(getattr(error, "message", ""))
        return (
            code == 429
            or "RESOURCE_EXHAUSTED" in status
            or "quota" in message.lower()
            or "rate limit" in message.lower()
        )

    text = str(error)
    lowered = text.lower()
    return (
        "429" in text
        or "RESOURCE_EXHAUSTED" in text
        or "quota" in lowered
        or "rate limit" in lowered
    )


def is_gemini_temporary_error(error: Exception) -> bool:
    if genai_errors is not None and isinstance(error, genai_errors.ServerError):
        code = getattr(error, "code", None)
        status = str(getattr(error, "status", ""))
        message = str(getattr(error, "message", ""))
        return (
            code in {500, 502, 503, 504}
            or "UNAVAILABLE" in status
            or "high demand" in message.lower()
        )

    text = str(error)
    lowered = text.lower()
    return (
        "500" in text
        or "502" in text
        or "503" in text
        or "504" in text
        or "UNAVAILABLE" in text
        or "high demand" in lowered
    )


def build_resume_command(args: argparse.Namespace) -> str:
    command = ["sh", "scripts/run_python.sh", "scripts/build_exam_json.py", "--with-choice-explanations"]
    if args.gemini_model != DEFAULT_GEMINI_MODEL:
        command.extend(["--gemini-model", args.gemini_model])
    if args.explanation_cache != DEFAULT_EXPLANATION_CACHE_PATH:
        command.extend(["--explanation-cache", str(args.explanation_cache)])
    if args.requests_per_minute > 0:
        command.extend(["--requests-per-minute", f"{args.requests_per_minute:g}"])
    if args.batch_size != 5:
        command.extend(["--batch-size", str(args.batch_size)])
    return " ".join(command)


def build_quota_resume_message(
    args: argparse.Namespace,
    *,
    stopped_at: str | None = None,
    used_key_name: str | None = None,
) -> str:
    cache = load_explanation_cache(args.explanation_cache)
    pdf_files = sorted(PDFS_DIR.glob("*.pdf"))
    total_questions = len(pdf_files) * 50
    completed = len(cache)
    remaining = max(total_questions - completed, 0)

    lines = ["Gemini API 할당량 또는 요청 제한에 도달했습니다."]
    if stopped_at:
        lines.append(f"중단 지점: {stopped_at}")
    if used_key_name:
        lines.append(f"마지막으로 사용한 키: {used_key_name}")
    lines.extend(
        [
            f"현재까지 캐시에 저장된 해설 수: {completed}",
            f"남은 미생성 문항 수(추정): {remaining}",
            f"캐시 파일: {args.explanation_cache}",
            "할당량이 초기화된 뒤 아래 명령을 다시 실행하면 캐시부터 이어서 진행합니다.",
            build_resume_command(args),
        ]
    )
    return "\n".join(lines)


def iter_question_work_items(exams: list[dict[str, object]]) -> list[tuple[dict[str, object], dict[str, object]]]:
    items: list[tuple[dict[str, object], dict[str, object]]] = []
    for exam in exams:
        for question in exam["questions"]:
            items.append((exam, question))
    return items


def chunk_work_items(
    work_items: list[tuple[dict[str, object], dict[str, object], str]],
    batch_size: int,
) -> list[list[tuple[dict[str, object], dict[str, object], str]]]:
    if batch_size <= 0:
        raise ValueError("batch_size must be greater than 0")
    return [
        work_items[index : index + batch_size]
        for index in range(0, len(work_items), batch_size)
    ]


def request_choice_explanations_batch_with_rotation(
    client_pool: GeminiClientPool,
    model: str,
    batch: list[tuple[dict[str, object], dict[str, object], str]],
) -> dict[str, dict[str, object]]:
    temporary_retry_count = 0
    max_temporary_retries_per_key = 6

    while True:
        try:
            return request_choice_explanations_batch(
                client_pool.client,
                model,
                batch,
            )
        except Exception as error:
            if is_gemini_batch_validation_error(error):
                if len(batch) == 1:
                    raise
                print(
                    "Gemini batch response validation failed; "
                    f"falling back to per-question requests for {len(batch)} item(s)."
                )
                results: dict[str, dict[str, object]] = {}
                for exam, question, cache_key in batch:
                    results[cache_key] = request_choice_explanations_with_rotation(
                        client_pool,
                        model,
                        exam,
                        question,
                    )
                return results
            if is_gemini_temporary_error(error):
                temporary_retry_count += 1
                wait_seconds = min(5 * temporary_retry_count, 30)
                print(
                    "Gemini temporary overload on "
                    f"{client_pool.current_key_name}; retrying in {wait_seconds}s."
                )
                time.sleep(wait_seconds)

                if temporary_retry_count >= 2:
                    overloaded_key = client_pool.current_key_name
                    if client_pool.rotate():
                        temporary_retry_count = 0
                        print(
                            "Temporary overload persisted; rotating key: "
                            f"{overloaded_key} -> {client_pool.current_key_name}"
                        )
                        continue

                if temporary_retry_count >= max_temporary_retries_per_key:
                    raise error

                continue

            if not is_gemini_quota_error(error):
                raise
            exhausted_key = client_pool.current_key_name
            if not client_pool.rotate():
                raise error
            print(
                f"키 제한 도달: {exhausted_key} -> {client_pool.current_key_name} 로 전환합니다."
            )


def request_choice_explanations_with_rotation(
    client_pool: GeminiClientPool,
    model: str,
    exam: dict[str, object],
    question: dict[str, object],
) -> dict[str, object]:
    temporary_retry_count = 0
    max_temporary_retries_per_key = 6

    while True:
        try:
            return request_choice_explanations(
                client_pool.client,
                model,
                exam,
                question,
            )
        except Exception as error:
            if is_gemini_temporary_error(error):
                temporary_retry_count += 1
                wait_seconds = min(5 * temporary_retry_count, 30)
                print(
                    "Gemini temporary overload on "
                    f"{client_pool.current_key_name}; retrying in {wait_seconds}s."
                )
                time.sleep(wait_seconds)

                if temporary_retry_count >= 2:
                    overloaded_key = client_pool.current_key_name
                    if client_pool.rotate():
                        temporary_retry_count = 0
                        print(
                            "Temporary overload persisted; rotating key: "
                            f"{overloaded_key} -> {client_pool.current_key_name}"
                        )
                        continue

                if temporary_retry_count >= max_temporary_retries_per_key:
                    raise error

                continue

            if not is_gemini_quota_error(error):
                raise
            exhausted_key = client_pool.current_key_name
            if not client_pool.rotate():
                raise error
            print(
                f"키 제한 도달: {exhausted_key} -> {client_pool.current_key_name} 로 전환합니다."
            )


def enrich_exam_with_choice_explanations(
    exam: dict[str, object],
    cache: dict[str, Any],
) -> tuple[int, int]:
    exam_id = str(exam["examId"])
    missing_count = 0
    cached_count = 0
    for question in exam["questions"]:
        cache_key = make_explanation_cache_key(exam_id, question)
        cached = cache.get(cache_key)
        if cached is None:
            missing_count += 1
        else:
            cached_count += 1
            question.update(cached)
    return missing_count, cached_count


def build_exam(pdf_path: Path) -> dict[str, object]:
    pages = extract_pages(pdf_path)
    if len(pages) < 2:
        raise ValueError(f"PDF has too few pages: {pdf_path.name}")

    metadata = parse_metadata(pdf_path, pages[0])
    answers = parse_answers(pages[0])
    body_text = apply_body_text_repairs(pdf_path, "\n".join(pages[1:]))
    segments = split_question_segments(body_text)
    questions = [
        parse_question_segment(segment, answers[index])
        for index, segment in enumerate(segments)
    ]

    numbers = [question["number"] for question in questions]
    if numbers != list(range(1, 51)):
        raise ValueError(f"Question numbers are not sequential in {pdf_path.name}")

    return {
        **metadata,
        "questionCount": len(questions),
        "questions": questions,
    }


def main() -> None:
    load_dotenv_if_present(DOTENV_PATH)
    args = parse_args()
    previous_explanations = load_existing_explanations(OUTPUT_PATH)
    pdf_files = sorted(PDFS_DIR.glob("*.pdf"))
    if not pdf_files:
        raise SystemExit("No PDF files found under docs/pdfs/")

    exams = [build_exam(pdf_path) for pdf_path in pdf_files]

    if args.apply_explanation_cache:
        cache = load_explanation_cache(args.explanation_cache)
        applied_count = 0
        missing_count = 0
        for exam in exams:
            missing, cached = enrich_exam_with_choice_explanations(exam, cache)
            applied_count += cached
            missing_count += missing
        restored_count = restore_explanations_from_previous_output(
            exams,
            previous_explanations,
            cache,
        )
        write_exams_json(exams)
        print(
            f"Applied cached explanations: {applied_count}, still missing: {missing_count}"
        )
        if restored_count:
            print(f"Restored explanations from previous output: {restored_count}")
        cache = prune_explanation_cache(exams, cache)
        save_explanation_cache(args.explanation_cache, cache)

    if args.with_choice_explanations:
        cache = load_explanation_cache(args.explanation_cache)
        min_interval_seconds = (
            60.0 / args.requests_per_minute if args.requests_per_minute > 0 else 0.0
        )
        if args.batch_size <= 0:
            raise SystemExit("--batch-size must be greater than 0")
        pending_items = []
        for exam, question in iter_question_work_items(exams):
            cache_key = make_explanation_cache_key(str(exam["examId"]), question)
            if cache_key not in cache:
                pending_items.append((exam, question, cache_key))
        pending_batches = chunk_work_items(pending_items, args.batch_size)

        print(
            f"Preparing Gemini explanations for {len(pending_items)} uncached questions "
            f"in {len(pending_batches)} requests"
        )
        if min_interval_seconds > 0:
            print(
                f"Rate limit enabled: {args.requests_per_minute:g} requests/minute "
                f"({min_interval_seconds:.1f}s between requests)"
            )
        print(f"Batch size: {args.batch_size} questions/request")
        client_pool = ensure_gemini_client_pool()
        print(
            f"Loaded {client_pool.key_count} Gemini API key(s). Starting with {client_pool.current_key_name}."
        )

        last_request_at = 0.0
        total_batches = len(pending_batches)
        for index, batch in enumerate(pending_batches, start=1):
            if min_interval_seconds > 0 and last_request_at > 0:
                elapsed = time.monotonic() - last_request_at
                remaining = min_interval_seconds - elapsed
                if remaining > 0:
                    time.sleep(remaining)

            first_exam, first_question, _ = batch[0]
            last_exam, last_question, _ = batch[-1]
            print(
                f"[{index}/{total_batches}] requesting explanations for "
                f"{first_exam['examId']} Q{first_question['number']} -> "
                f"{last_exam['examId']} Q{last_question['number']}"
            )
            try:
                batch_results = request_choice_explanations_batch_with_rotation(
                    client_pool,
                    args.gemini_model,
                    batch,
                )
            except Exception as error:
                save_explanation_cache(args.explanation_cache, cache)
                if is_gemini_quota_error(error):
                    raise SystemExit(
                        build_quota_resume_message(
                            args,
                            stopped_at=(
                                f"{first_exam['examId']} Q{first_question['number']} -> "
                                f"{last_exam['examId']} Q{last_question['number']}"
                            ),
                            used_key_name=client_pool.current_key_name,
                        )
                    )
                raise
            last_request_at = time.monotonic()
            for exam, question, cache_key in batch:
                cached = batch_results[cache_key]
                cache[cache_key] = cached
                question.update(cached)
            save_explanation_cache(args.explanation_cache, cache)
            write_exams_json(exams)

        if not pending_batches:
            print("All explanations were already available in cache")

        for exam in exams:
            missing_count, _cached_count = enrich_exam_with_choice_explanations(exam, cache)
            if missing_count:
                raise SystemExit(
                    f"Missing {missing_count} explanations in cache for exam {exam['examId']}"
                )
        cache = prune_explanation_cache(exams, cache)
        save_explanation_cache(args.explanation_cache, cache)

    write_exams_json(exams)

    print(f"Wrote {len(exams)} exams to {OUTPUT_PATH}")
    if args.with_choice_explanations:
        print(f"Wrote explanation cache to {args.explanation_cache}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        if is_gemini_quota_error(error):
            sys.exit(build_quota_resume_message(parse_args()))
        raise
