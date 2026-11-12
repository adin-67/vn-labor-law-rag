# Chạy endpoint answer với Ollama

Nhánh `feature/ollama-answer` bổ sung gọi model từ khung `POST /api/v1/answer`. Model trả JSON có câu trả lời và các mã nguồn. API đối chiếu mã với đúng các nguồn vừa truy xuất rồi trả nội dung nguồn gốc trong `citations`.

## Khởi động

Trên máy Huy, mở Ollama ở terminal riêng.

```powershell
cd 'E:\Capstone1\archive\lightrag-study'
$env:OLLAMA_HOST = '127.0.0.1:11436'
$env:OLLAMA_MODELS = "$PWD\models"
$env:OLLAMA_NO_CLOUD = '1'
.\runtime\ollama.exe serve
```

Trong thư mục `backend` của repo nhóm, dùng môi trường Python đã cài các thư viện trong `requirements-lock.txt`.

```powershell
$env:RETRIEVAL_MODE = 'b'
$env:OLLAMA_MODEL = 'qwen2.5:3b'
$env:OLLAMA_BASE_URL = 'http://127.0.0.1:11436'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Nếu Ollama cài trên máy khác dùng cổng mặc định 11434, đổi `OLLAMA_BASE_URL` thành `http://127.0.0.1:11434`. Model cần được tải sẵn trên máy chạy Ollama.

Trong Swagger, chọn `POST /api/v1/answer` và gửi lần lượt các JSON dưới đây. [Swagger](http://127.0.0.1:8001/docs)

```json
{"query":"tiền lương thử việc"}
```

```json
{"query":"Mật khẩu wifi"}
```

```json
{"query":"Vợ tôi mang thai thì tôi được nghỉ bao lâu?"}
```

## Kết quả thực tế trên máy Huy

| Câu hỏi | HTTP | Phản hồi quan sát được |
| --- | --- | --- |
| Tiền lương thử việc | 200 | `answered`, nói mức 85% theo nguồn được đưa vào, trích dẫn Điều 26 ở trang PDF 12. |
| Mật khẩu wifi | 200 | `insufficient_evidence`, nguồn rỗng. Lần này bộ truy xuất trả rỗng nên model không được gọi. |
| Vợ tôi mang thai thì tôi được nghỉ bao lâu? | 200 | `insufficient_evidence`, nguồn rỗng. Model giải thích chưa có thông tin về thời gian nghỉ cho tình huống này trong nguồn đã gửi. |

Đã thử thêm cấu hình địa chỉ model không kết nối được. API trả 503 với mã `answer_unavailable`.

## Kiểm tra lỗi

Từ thư mục backend, chạy kiểm tra với các phản hồi Ollama được kiểm soát.

```powershell
.\.venv\Scripts\python.exe -X utf8 check_answers.py
```

Bộ kiểm tra gồm mã trích dẫn không tồn tại, trạng thái không khớp danh sách nguồn, phản hồi rỗng/dang dở, model không kết nối được, timeout và thiếu cấu hình model. Kết quả nguyên văn của model được xác nhận lại bằng phép thử HTTP với model thật như bảng trên.

| Tình huống | Kết quả |
| --- | --- |
| Có nguồn nhưng chưa đặt `OLLAMA_MODEL` | 503, `answer_not_configured` |
| Không gọi được Ollama hoặc model không tồn tại | 503, `answer_unavailable` |
| Model quá thời gian chờ | 504, `answer_timeout` |
| JSON hoặc mã trích dẫn không hợp lệ | 502, `invalid_answer` |

Các phép thử dùng model `qwen2.5:3b` và snapshot `bm25-35210a46dc4d3cdc`. Mã trích dẫn được kiểm tra thuộc bộ nguồn truy xuất. Việc mỗi câu giải thích có thật sự được điều luật hỗ trợ vẫn cần A và B đánh giá trên bộ câu hỏi. Giao diện chat hiện dùng dữ liệu mẫu, endpoint answer được thử qua Swagger hoặc HTTP.
