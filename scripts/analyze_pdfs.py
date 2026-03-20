from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDFS_DIR = ROOT / "docs" / "pdfs"

QUESTION_RE = re.compile(
    r"((?:[1-9]|[1-4]\d|50)\.\s.*?)(?=(?:[1-9]|[1-4]\d|50)\.\s|$)",
    re.S,
)


@dataclass
class PdfReport:
    name: str
    page_count: int
    answer_page_length: int
    body_length: int
    detected_numbers: list[int]
    split_ok: bool


def clean_page(text: str) -> str:
    text = text.replace("\xa0", " ")
    lines = text.splitlines()
    if len(lines) >= 2 and lines[1].startswith("- "):
        lines = lines[2:]
    return "\n".join(lines).strip()


def extract_body_text(pdf_path: Path) -> tuple[str, str, int]:
    reader = PdfReader(str(pdf_path))
    pages = [page.extract_text() or "" for page in reader.pages]
    answer_text = clean_page(pages[0]) if pages else ""
    body_text = "\n".join(clean_page(text) for text in pages[1:])
    return answer_text, body_text, len(reader.pages)


def analyze_pdf(pdf_path: Path) -> PdfReport:
    answer_text, body_text, page_count = extract_body_text(pdf_path)
    matches = QUESTION_RE.findall(body_text)
    detected_numbers = [
        int(re.match(r"(\d+)\.", match).group(1))
        for match in matches
        if re.match(r"(\d+)\.", match)
    ]
    split_ok = detected_numbers == list(range(1, 51))
    return PdfReport(
        name=pdf_path.name,
        page_count=page_count,
        answer_page_length=len(answer_text),
        body_length=len(body_text),
        detected_numbers=detected_numbers,
        split_ok=split_ok,
    )


def summarize_failures(report: PdfReport) -> str:
    if report.split_ok:
        return "ok"
    head = ",".join(map(str, report.detected_numbers[:10]))
    return f"detected={len(report.detected_numbers)} head=[{head}]"


def main() -> None:
    pdf_files = sorted(PDFS_DIR.glob("*.pdf"))
    if not pdf_files:
        raise SystemExit("No PDF files found under docs/pdfs/")

    reports = [analyze_pdf(pdf_path) for pdf_path in pdf_files]

    print("PDF extraction probe")
    print(f"files={len(reports)}")
    print()

    for report in reports:
        print(
            f"{report.name}: "
            f"pages={report.page_count}, "
            f"answer_len={report.answer_page_length}, "
            f"body_len={report.body_length}, "
            f"split={summarize_failures(report)}"
        )

    success_count = sum(1 for report in reports if report.split_ok)
    print()
    print(f"strict_question_split_success={success_count}/{len(reports)}")
    print()

    sample_path = pdf_files[-1]
    answer_text, body_text, _ = extract_body_text(sample_path)
    print(f"[sample] {sample_path.name} page1")
    print(answer_text[:300])
    print()
    print(f"[sample] {sample_path.name} page2+")
    print(body_text[:1000])


if __name__ == "__main__":
    main()
