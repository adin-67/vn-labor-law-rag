import json
from pathlib import Path


pages_path = Path("data/processed/45-2019-QH14-pages.jsonl")
output_path = Path("data/processed/45-2019-QH14-chunks.jsonl")

article_groups = [
    ((7,), (13, 14), "Điều 15. Nguyên tắc giao kết hợp đồng lao động"),
    ((11, 12), (24, 25, 26, 27), "Mục 2"),
]


def extract_group(pages, page_numbers, article_numbers, stop_heading):
    source_lines = []

    for page_number in page_numbers:
        page_text = pages[page_number - 1]["text"]
        lines = [line.strip() for line in page_text.splitlines() if line.strip()]
        for line in lines[2:]:
            source_lines.append((page_number, line))

    boundaries = []
    for article_number in article_numbers:
        prefix = f"Điều {article_number}. "
        start = next(
            index
            for index, (_, line) in enumerate(source_lines)
            if line.startswith(prefix)
        )
        boundaries.append(start)

    group_end = next(
        index
        for index, (_, line) in enumerate(source_lines)
        if line == stop_heading
    )
    boundaries.append(group_end)

    chunks = []
    for index, article_number in enumerate(article_numbers):
        start = boundaries[index]
        end = boundaries[index + 1]
        article_lines = source_lines[start:end]
        page_start, heading = article_lines[0]
        page_end = article_lines[-1][0]

        chunks.append({
            "document_id": "45/2019/QH14",
            "article_number": article_number,
            "article_title": heading.split(". ", 1)[1],
            "source_file": pages[page_start - 1]["source_file"],
            "pdf_page_start": page_start,
            "pdf_page_end": page_end,
            "text": "\n".join(line for _, line in article_lines),
        })

    return chunks


with pages_path.open(encoding="utf-8") as input_file:
    pages = [json.loads(line) for line in input_file]

chunks = []
for page_numbers, article_numbers, stop_heading in article_groups:
    chunks.extend(extract_group(pages, page_numbers, article_numbers, stop_heading))

with output_path.open("w", encoding="utf-8") as output_file:
    for chunk in chunks:
        output_file.write(json.dumps(chunk, ensure_ascii=False) + "\n")

print(f"Saved {len(chunks)} chunks to {output_path}")