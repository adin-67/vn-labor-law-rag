# Bàn giao kiểm tra API và Ollama

Kiểm tra từ nhánh `test/api-only-bm25`, xuất phát từ main `f9e05a6`. Bản main đã có `--api-only` và snapshot theo nội dung file. Nhánh này bổ sung đối chiếu BM25 trực tiếp với API cùng câu hỏi và `top_k=1`, kiểm tra nguyên văn/trang và ca `Mật khẩu wifi`.

## Chạy kiểm tra API trên máy khác

Từ thư mục gốc repo, chuẩn bị môi trường một lần.

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
$env:RETRIEVAL_MODE = 'b'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Trong terminal thứ hai, từ thư mục backend, chạy:

```powershell
.\.venv\Scripts\python.exe -X utf8 check_live_bm25.py --api-only
```

Giữ React tắt để thử chế độ API độc lập. Lệnh hiện có 28 điều kiện kiểm tra. Chạy không có `--api-only` sẽ kiểm tra thêm trang React. Nếu dùng `B_REPO_PATH`, đặt cùng biến đó ở cả terminal máy chủ và terminal kiểm thử.

## Kết quả đã quan sát

- Bộ cũ, Điều 24–27, được nạp vào máy chủ mới qua `B_REPO_PATH`. Health báo `mode=b`, snapshot `bm25-5ec8bca73a3084c0`. Tìm Điều 25 rồi mở nguồn trả đúng nguyên văn và trang PDF 11–12, cùng snapshot.
- Bộ mở rộng, Điều 13–14 và 24–27, có snapshot `bm25-35210a46dc4d3cdc`. Cả 28 điều kiện qua với chỉ FastAPI đang chạy. Hai câu hỏi mới đưa Điều 13 và Điều 14 lên đầu, trang PDF 7, khớp BM25 trực tiếp.
- `Mật khẩu wifi` trả kết quả tìm kiếm rỗng. Điều 25 vẫn mở đúng nguồn.
- `POST /api/v1/answer` với câu thử việc trả HTTP 503 và mã `answer_not_configured`. Với câu Wi-Fi, trả HTTP 200, `insufficient_evidence` và `citations=[]`. Đây là hành vi của khung answer ở main hiện tại.

## Ollama đã chạy trên máy Huy

Máy chủ thử nghiệm tại `http://127.0.0.1:11436`. Model tạo câu trả lời là `qwen2.5:3b`, digest `357c53fb659c5076de1d65ccb0b397446227b71a42be9d1603d46168015c9e4b`. Model embedding đã có là `bge-m3:latest`.

Lệnh mở máy chủ trên máy Huy:

```powershell
cd 'E:\Capstone1\archive\lightrag-study'
$env:OLLAMA_HOST = '127.0.0.1:11436'
$env:OLLAMA_MODELS = "$PWD\models"
$env:OLLAMA_NO_CLOUD = '1'
.\runtime\ollama.exe serve
```

Máy đã chạy được Ollama có thể gọi REST bằng lệnh dưới đây. Nếu dùng Ollama cài thông thường, đổi URL về cổng đang dùng trên máy đó. Chạy từ thư mục gốc repo.

```powershell
$rows = Get-Content -Encoding utf8 'data/processed/45-2019-QH14-chunks.jsonl' | ForEach-Object { $_ | ConvertFrom-Json }
$article = ($rows | Where-Object article_number -eq 26).text
$body = @{
    model = 'qwen2.5:3b'
    stream = $false
    prompt = "Chỉ dựa vào đoạn nguồn dưới đây, trả lời ngắn bằng tiếng Việt và nêu số điều.`nNguồn từ bản gốc năm 2019:`n$article`nCâu hỏi: Theo đoạn nguồn, lương thử việc tối thiểu bằng bao nhiêu phần trăm lương công việc?"
    options = @{ temperature = 0; num_predict = 160 }
    keep_alive = '5m'
} | ConvertTo-Json -Depth 4
$reply = Invoke-RestMethod -Uri 'http://127.0.0.1:11436/api/generate' -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 180
$reply.response
```

Trong lần gọi thực tế, phản hồi bắt đầu bằng **“Theo đoạn nguồn, lương thử việc tối thiểu phải bằng 85% lương công việc.”** và nêu Điều 26. Ollama trả `done=true`, thời gian tổng khoảng 4,92 giây. Đoạn nguồn được gửi kèm trong prompt. Phép thử xác nhận model nhận yêu cầu và sinh câu trả lời tiếng Việt trên máy Huy.

Bước tiếp theo của B là nối model vào khung answer rồi cùng C thử ba câu hỏi đã thống nhất. Bản ghi này báo kết quả thử trực tiếp Ollama và tra cứu API, chưa xác nhận chất lượng ba câu hỏi của endpoint answer sau khi nối model.
