"""Kiểm tra FastAPI và Vite đang chạy trên localhost bằng dữ liệu BM25 của B."""

import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


API = "http://127.0.0.1:8001"
FRONTEND = "http://127.0.0.1:5173"


def request(url, *, body=None, method=None, headers=None):
    headers = dict(headers or {})
    if body is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(body).encode("utf-8")
    req = Request(url, data=body, method=method, headers=headers)
    try:
        response = urlopen(req, timeout=8)
    except HTTPError as error:
        response = error
    except URLError as error:
        raise RuntimeError(f"Không kết nối được {url}. Kiểm tra PowerShell đang chạy dịch vụ.") from error
    with response:
        payload = response.read()
        if response.headers.get_content_type() == "application/json":
            payload = json.loads(payload)
        return response.status, payload, response.headers


def check(condition, message):
    if not condition:
        raise AssertionError(message)
    print(f"PASS | {message}")


def main():
    code, health, _ = request(f"{API}/health")
    check(code == 200 and health.get("retrieval_ready") is True and health.get("mode") == "b",
          "FastAPI chạy ở chế độ b, dùng BM25 thật")
    snapshot = health["snapshot_id"]
    check(request(f"{API}/docs")[0] == 200, "Trang Swagger phản hồi HTTP 200")
    check(request(f"{FRONTEND}/")[0] == 200, "Trang React phản hồi HTTP 200")

    cases = (
        ("thỏa thuận nội dung thử việc trong hợp đồng lao động", "24", (11, 11)),
        ("thử việc bao nhiêu ngày", "25", (11, 12)),
        ("tiền lương thử việc", "26", (12, 12)),
        ("thông báo kết quả thử việc", "27", (12, 12)),
    )
    for query, article, pages in cases:
        code, result, _ = request(f"{API}/api/v1/search", body={"query": query, "top_k": 1})
        check(code == 200 and result.get("mode") == "b" and result.get("snapshot_id") == snapshot
              and result.get("status") == "ok" and len(result.get("results", [])) == 1
              and result["results"][0]["article"] == article,
              f"Tìm '{query}' → Điều {article}, top_k = 1")
        row = result["results"][0]
        unit_id = quote(row["unit_id"], safe="")
        code, response, _ = request(f"{API}/api/v1/sources/{unit_id}")
        check(code == 200 and response.get("mode") == "b" and response.get("snapshot_id") == snapshot
              and response.get("source") == row and (row["page_from"], row["page_to"]) == pages
              and row["text"].strip() and row["source_url"],
              f"Mở đúng Điều {article}, trang PDF {pages[0]}–{pages[1]}")

    for query in ("xyzqxyzq", "tien luong thu viec"):
        code, result, _ = request(f"{API}/api/v1/search", body={"query": query})
        check(code == 200 and result.get("status") == "no_results" and result.get("results") == [],
              f"'{query}' trả danh sách rỗng")
    for body, label in (({"query": "  "}, "Câu hỏi rỗng"), ({"query": "thử việc", "top_k": 0}, "top_k ngoài phạm vi")):
        code, _, _ = request(f"{API}/api/v1/search", body=body)
        check(code == 422, f"{label} trả HTTP 422")
    code, result, _ = request(f"{API}/api/v1/sources/khong-co-ma-nay")
    check(code == 404 and result.get("detail", {}).get("code") == "source_not_found",
          "Mã nguồn không tồn tại trả HTTP 404")
    code, _, headers = request(f"{API}/api/v1/search", method="OPTIONS", headers={
        "Origin": FRONTEND,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    check(code == 200 and headers.get("Access-Control-Allow-Origin") == FRONTEND,
          "CORS cho phép React gọi API")
    print(f"Hoàn tất kiểm tra HTTP trên bộ dữ liệu {snapshot}.")


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, RuntimeError) as error:
        raise SystemExit(f"FAIL | {error}") from None
