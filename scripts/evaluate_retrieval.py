import json
from pathlib import Path

from scripts.search_bm25 import search_articles


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CASES_PATH = PROJECT_ROOT / "data" / "eval" / "retrieval_cases.jsonl"


def main():
    in_scope_count = 0
    out_of_scope_count = 0
    top1_hits = 0
    top3_hits = 0
    out_of_scope_with_candidates = 0

    with CASES_PATH.open(encoding="utf-8") as cases_file:
        for line in cases_file:
            if not line.strip():
                continue

            case = json.loads(line)
            expected_article = case["expected_article"]

            results = search_articles(case["query"], top_k=3)
            found_articles = [result["article_number"] for result in results]

            print(
                f"{case['id']} | Expected: {expected_article} "
                f"| Retrieved: {found_articles}"
            )

            if expected_article is None:
                out_of_scope_count += 1
                if found_articles:
                    out_of_scope_with_candidates += 1
                continue

            in_scope_count += 1
            if found_articles and found_articles[0] == expected_article:
                top1_hits += 1
            if expected_article in found_articles:
                top3_hits += 1

    print()
    print(f"Top 1: {top1_hits}/{in_scope_count}")
    print(f"Top 3: {top3_hits}/{in_scope_count}")
    print(
        "Out-of-scope cases with candidates: "
        f"{out_of_scope_with_candidates}/{out_of_scope_count}"
    )


if __name__ == "__main__":
    main()