import json
import re
from collections import Counter
from math import log
from pathlib import Path


CHUNKS_PATH = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "processed"
    / "45-2019-QH14-chunks-24-27.jsonl"
)


def tokenize(text):
    return re.findall(r"\w+", text.casefold())


def search_articles(query, top_k=3):
    query_terms = sorted(set(tokenize(query)))
    if not query_terms or top_k <= 0:
        return []

    with CHUNKS_PATH.open(encoding="utf-8") as input_file:
        chunks = [json.loads(line) for line in input_file if line.strip()]

    documents = [tokenize(chunk["text"]) for chunk in chunks]
    total_length = sum(len(words) for words in documents)
    if total_length == 0:
        return []

    word_counts = [Counter(words) for words in documents]
    document_count = len(documents)
    average_length = total_length / document_count
    k1 = 1.2
    b = 0.75

    term_weights = {}
    for term in query_terms:
        matching_documents = sum(term in counts for counts in word_counts)
        term_weights[term] = log(
            1 + (document_count - matching_documents + 0.5)
            / (matching_documents + 0.5)
        )

    results = []
    for chunk, words, counts in zip(chunks, documents, word_counts):
        length_factor = k1 * (1 - b + b * len(words) / average_length)
        score = 0.0

        for term in query_terms:
            frequency = counts[term]
            score += term_weights[term] * (
                frequency * (k1 + 1) / (frequency + length_factor)
            )

        if score > 0:
            results.append({**chunk, "score": score})

    results.sort(key=lambda result: result["score"], reverse=True)
    return results[:top_k]


if __name__ == "__main__":
    query = input("Search question: ")
    if not tokenize(query):
        raise SystemExit("Enter a search question.")

    results = search_articles(query)

    if not results:
        print("No matching articles.")

    for result in results:
        article = result["article_number"]
        score = result["score"]
        first_page = result["pdf_page_start"]
        last_page = result["pdf_page_end"]
        print(f"Article {article} | Score {score:.3f} | PDF pages {first_page}-{last_page}")