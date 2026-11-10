# Đánh giá truy xuất BM25

Bản đánh giá sử dụng thuật toán và dữ liệu từ commit `fee28ef`.
Kho dữ liệu demo gồm Điều 24–27 của Bộ luật Lao động số 45/2019/QH14.

## Cách chạy

Từ thư mục gốc dự án, chạy
`.venv\Scripts\python.exe -X utf8 -m scripts.evaluate_retrieval`.

## Kết quả

| Chỉ số | Kết quả |
| --- | --- |
| Điều kỳ vọng đứng đầu trong các ca trong phạm vi | 8/8 |
| Điều kỳ vọng nằm trong ba kết quả đầu | 8/8 |
| Ca ngoài phạm vi vẫn trả về đoạn ứng viên | 3/4 |

`OUT01` trả về danh sách rỗng. `OUT02`, `OUT03` và `OUT04`
đều trả về đoạn ứng viên dù kho dữ liệu demo chưa đủ căn cứ trả lời.

Ví dụ, `OUT02` hỏi về bảo hiểm xã hội trong thời gian thử việc.
BM25 trả về Điều 25, 26 và 27. Các đoạn có từ khóa liên quan
đến thử việc, nhưng chưa cung cấp căn cứ để trả lời về bảo hiểm xã hội.

Kết quả 8/8 chỉ áp dụng cho tám câu trong phạm vi của bộ kiểm thử này.
Việc chatbot trả lời đúng, trích dẫn đúng và báo thiếu căn cứ
sẽ được kiểm tra riêng khi tích hợp.