import json
from pathlib import  Path
import pymupdf

pdf_path = Path("data/raw/2019_993 + 994_45-2019-QH14.pdf")
output_path = Path("data/processed/45-2019-QH14-pages.jsonl")

output_path.parent.mkdir(parents=True, exist_ok=True)
empty_pages = []

with pymupdf.open(pdf_path) as document:
    page_count = len(document)
    with output_path.open("w", encoding="utf-8") as output_file:
        for page_number, page in enumerate(document, start=1):
            page_text = page.get_text().strip()
            if not page_text:
                empty_pages.append(page_number)
            record = {
                "source_file": pdf_path.name,
                "pdf_page": page_number,
                "text": page_text,
            }
            output_file.write(json.dumps(record, ensure_ascii=False) + "\n")
print(f"Exported {page_count} pages to {output_path}")
print(f"Pages without text: {empty_pages}")