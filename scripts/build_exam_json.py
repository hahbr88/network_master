from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDFS_DIR = ROOT / "docs" / "pdfs"
OUTPUT_PATH = ROOT / "generated" / "exams.json"

CHOICE_MARKERS = ["\u2460", "\u2461", "\u2462", "\u2463"]
ANSWER_ROW_MARKERS = [
    "12345678910",
    "11121314151617181920",
    "21222324252627282930",
    "31323334353637383940",
    "41424344454647484950",
]
SUBJECT_RANGES = [
    (1, 17, "TCP/IP"),
    (18, 27, "네트워크일반"),
    (28, 45, "NOS"),
    (46, 50, "네트워크운용기기"),
]


def clean_page(text: str) -> str:
    text = text.replace("\xa0", " ")
    lines = text.splitlines()
    if len(lines) >= 2 and lines[1].startswith("- "):
        lines = lines[2:]
    return "\n".join(lines).strip()


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n")
    # PDF 줄바꿈 때문에 한글 단어가 중간에서 끊긴 경우를 먼저 복원한다.
    text = re.sub(r"(?<=[가-힣])\s*\n\s*(?=[가-힣])", "", text)
    return re.sub(r"\s+", " ", text).strip()


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


def build_exam(pdf_path: Path) -> dict[str, object]:
    pages = extract_pages(pdf_path)
    if len(pages) < 2:
        raise ValueError(f"PDF has too few pages: {pdf_path.name}")

    metadata = parse_metadata(pdf_path, pages[0])
    answers = parse_answers(pages[0])
    body_text = "\n".join(pages[1:])
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
    pdf_files = sorted(PDFS_DIR.glob("*.pdf"))
    if not pdf_files:
        raise SystemExit("No PDF files found under docs/pdfs/")

    exams = [build_exam(pdf_path) for pdf_path in pdf_files]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(exams, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Wrote {len(exams)} exams to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
