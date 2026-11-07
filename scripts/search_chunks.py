import json 
from pathlib import Path

chunks_path = Path("data/processed/45-2019-QH14-chunks-24-27.jsonl")
with chunks_path.open(encoding="utf-8") as input_file:
    chunks = [json.loads(line) for line in input_file]
    query = input("Search phrase: ")
    normalized_query = " ".join(query.lower().split())
    if not normalized_query:
        raise SystemExit("Enter a search phrase.")
    found = False

    for chunk in chunks:
        normalized_text = " ".join(chunk["text"].lower().split())
        if normalized_query in normalized_text:
            found = True
            article = chunk["article_number"]
            first_page = chunk["pdf_page_start"]
            last_page = chunk["pdf_page_end"]
            print(f"Article {article} | PDF pages {first_page}-{last_page}")
            print(chunk["text"])

if not found:
    print("No matching articles.")