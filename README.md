# Vietnam Labor Law RAG

Xem [hướng dẫn thử endpoint answer với Ollama](docs/answer-ollama.md) để chạy câu trả lời kèm nguồn bằng model local.

Bản demo tìm kiếm bằng BM25 trên Điều 24–27 của Bộ luật Lao động số 45/2019/QH14.

## Chạy thử

Mở terminal tại thư mục gốc dự án và chạy:

```cmd
python -X utf8 scripts/search_bm25.py
```

Nhập `thử việc bao nhiêu ngày`. Kết quả đầu tiên dự kiến là Điều 25, trang PDF 11–12.

Nguồn dữ liệu: [Bản Công báo Chính phủ](https://congbao.chinhphu.vn/detail/tai-ve?id=30232&slug=45-2019-qh14).

## Chạy giao diện Lạc Luật và API

Mở repo ở nhánh có thư mục `frontend/` và `backend/`. FastAPI gọi bộ BM25 trong `scripts/` của repo và đọc dữ liệu từ `data/processed/`. Dùng Python 3.12 và Node.js 20.19 trở lên trong nhánh 20 hoặc 22.12 trở lên.

Trong PowerShell thứ nhất, từ thư mục gốc của repo, chạy:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
$env:RETRIEVAL_MODE = 'b'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Giữ terminal đó mở. Mở PowerShell thứ hai ở thư mục gốc và chạy:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Nhập **thử việc bao nhiêu ngày**, bấm **Tìm nguồn** và mở Điều 25 để xem nội dung cùng trang PDF 11–12. [Tìm điều luật](http://127.0.0.1:5173/#/search-demo)

Trong Swagger, thử `GET /health`, rồi gửi `{"query":"thử việc bao nhiêu ngày","top_k":1}` tới `POST /api/v1/search`. Dùng `unit_id` trong kết quả để gọi `GET /api/v1/sources/{unit_id}`. [Swagger](http://127.0.0.1:8001/docs)

Để chạy kiểm thử tích hợp, giữ hai dịch vụ đang chạy. Mở PowerShell thứ ba ở thư mục gốc và chạy:

```powershell
cd backend
.\.venv\Scripts\python.exe -B -X utf8 .\check_live_bm25.py
```
