# Thử nghiệm LightRAG và BGE-M3

Thử nghiệm độc lập sử dụng cùng bộ sáu điều luật (13, 14, 24–27) với BM25. BGE-M3 tạo vector 1.024 chiều. Qwen qua Ollama hỗ trợ trích xuất thực thể, quan hệ và từ khóa. Các script chạy độc lập với FastAPI và React.

## Chạy trên Windows PowerShell

Từ thư mục gốc của repo, mở Ollama và chạy các lệnh sau. Nếu Ollama chạy ở cổng riêng, đặt địa chỉ cho cả CLI và các script, ví dụ `$env:OLLAMA_HOST = '127.0.0.1:11436'` và `$env:LIGHTRAG_OLLAMA_URL = 'http://127.0.0.1:11436'` trong terminal chạy thử. Mặc định các script dùng cổng 11434.

```powershell
cd .\experiments\lightrag
ollama pull bge-m3:latest
ollama pull qwen3:4b-instruct-2507-q4_K_M
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -X utf8 .\check_embedding.py
.\.venv\Scripts\python.exe -X utf8 .\index_articles.py
.\.venv\Scripts\python.exe -X utf8 .\query_articles.py --mode naive
.\.venv\Scripts\python.exe -X utf8 .\query_articles.py --mode hybrid
```

Nhập cùng một câu cho mỗi chế độ, ví dụ **Lúc thử việc được trả bao nhiêu phần trăm lương?** Chế độ `naive` tìm đoạn theo vector. Chế độ `hybrid` dùng thực thể và quan hệ của đồ thị để lấy ngữ cảnh liên quan. Script in thứ tự đoạn luật và trang PDF để đối chiếu. Bước truy vấn này chỉ kiểm tra truy xuất nguồn.

Chỉ mục được sinh vào `storage_<hash>` dựa trên nội dung JSONL trong repo. Chạy lại bước lập chỉ mục khi bộ dữ liệu thay đổi. Script kiểm tra bộ sáu điều đã nêu để giữ phạm vi thí nghiệm.
