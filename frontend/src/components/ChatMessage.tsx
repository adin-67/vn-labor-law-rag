import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';
import { IconButton } from './ui';
import type { AnswerKind, Message } from '../types';

export function ChatMessage({ message, topic, onSample, readOnly=false }: { message: Message; topic: string; onSample?: () => void; readOnly?: boolean }) {
  const { openDialog, toast } = useApp();
  const [liked, setLiked] = useState(false);
  const answer = useRef<HTMLDivElement>(null);
  if (message.role === 'user') return <div className="user-message">{message.text}</div>;
  async function copy() {
    try {await navigator.clipboard.writeText(answer.current?.innerText ?? '');toast('Đã sao chép nội dung mẫu.');}
    catch {toast('Trình duyệt chưa cấp quyền sao chép. Bạn có thể chọn nội dung để sao chép.');}
  }
  return <>
    <div className="assistant-label"><span className="assistant-logo">✺</span>Lạc Luật<span className="tag gray">Minh họa</span></div>
    <div className="assistant-message"><div ref={answer} className="answer-content"><Answer kind={message.kind} onSample={onSample} readOnly={readOnly} /></div>
      {!readOnly && <div className="answer-actions">
        <IconButton icon="copy" label="Sao chép câu trả lời" onClick={copy} />
        <IconButton icon="thumb" label="Đánh giá hữu ích" pressed={liked} onClick={() => {setLiked(true);toast('Đã ghi nhận đánh giá hữu ích trong bản xem trước.');}} />
        <IconButton icon="flag" label="Góp ý câu trả lời" onClick={() => openDialog({type:'feedback',topic})} />
        <span className="answer-note">Nội dung mẫu · hãy đối chiếu căn cứ</span>
      </div>}
      {!readOnly && message.kind === 'wage' && <div className="followups"><button className="followup" onClick={() => openDialog({type:'citation'})}>Xem Điều 26 <Icon name="arrow" /></button><Link className="followup" to="/templates">Khám phá mẫu đơn <Icon name="arrow" /></Link></div>}
    </div>
  </>;
}

function Answer({ kind, onSample, readOnly }: { kind: AnswerKind; onSample?: () => void; readOnly: boolean }) {
  const { openDialog } = useApp();
  if (kind === 'wage') return <>
    <p>Với dữ kiện trong tình huống mẫu, mức lương thử việc <strong>9 triệu đồng/tháng chưa đáp ứng tỷ lệ tối thiểu.</strong></p>
    <div className="answer-summary">Theo <strong>Điều 26 Bộ luật Lao động 2019</strong>, tiền lương thử việc do hai bên thỏa thuận nhưng ít nhất bằng <strong>85% mức lương của công việc đó.</strong></div>
    <p>Cách tính với mức lương công việc 12 triệu đồng/tháng:</p>
    <ul className="answer-list"><li>Tỷ lệ đang trả: 9.000.000 ÷ 12.000.000 = <strong>75%</strong>.</li><li>Mức tối thiểu: 12.000.000 × 85% = <strong>10.200.000 đồng/tháng</strong>.</li><li>Chênh lệch so với mức tối thiểu: <strong>1.200.000 đồng/tháng</strong>.</li></ul>
    <button className="citation-card" onClick={() => openDialog({type:'citation'})}><span className="citation-symbol"><Icon name="file" /></span><span><strong>[1] Điều 26 · Tiền lương thử việc</strong><small>Bộ luật Lao động · 45/2019/QH14</small></span><Icon name="external" /></button>
    <p>Phần giải thích này chỉ xét tỷ lệ lương trong tình huống minh họa, theo bản gốc năm 2019. Cần kiểm tra phiên bản và hiệu lực trước khi áp dụng.</p>
  </>;
  if (kind === 'notice') return <>
    <p>Mình cần một vài thông tin để xác định trường hợp của bạn, thay vì áp dụng một thời hạn chung.</p>
    <div className="answer-summary"><strong>Bạn đang trong thời gian thử việc hay đã làm chính thức?</strong><br />Hợp đồng của bạn là không xác định thời hạn hay có thời hạn? Nếu có thời hạn, thời hạn hợp đồng là bao lâu?</div>
    <p>Bạn cũng có thể bổ sung công việc đang làm, lý do nghỉ và ngày nghỉ dự kiến. Những dữ kiện này giúp lựa chọn căn cứ phù hợp.</p>
    <p className="text-muted">Đây là câu hỏi làm rõ trong bản thiết kế. Hệ thống chưa tạo kết luận pháp lý cho tình huống này.</p>
  </>;
  if (kind === 'leave') return <>
    <p>Bạn muốn <strong>tìm hiểu quy định nghỉ phép</strong> hay <strong>chuẩn bị đơn xin nghỉ phép</strong>?</p>
    <div className="answer-summary">Để tìm quy định phù hợp, bạn có thể bổ sung thời gian đã làm việc, loại công việc và khoảng thời gian dự định nghỉ.</div>
    <p>Nếu bạn đã thống nhất lịch nghỉ, có thể bắt đầu từ mẫu đơn và kiểm tra thông tin trước khi xuất file.</p>
    {!readOnly && <Link className="btn" to="/templates/leave"><Icon name="file" />Tạo đơn xin nghỉ phép <Icon name="arrow" /></Link>}
  </>;
  return <>
    <p>Mình đã ghi nhận câu hỏi của bạn.</p>
    <div className="answer-summary"><strong>Đây là bản xem trước giao diện, chưa kết nối mô hình AI.</strong><br />Bạn có thể thử các tình huống mẫu về lương thử việc, thông tin trước khi nghỉ việc hoặc tạo đơn nghỉ phép.</div>
    <p>Trong sản phẩm hoàn chỉnh, hệ thống sẽ tìm căn cứ, hỏi bổ sung dữ kiện khi cần và cung cấp phần giải thích có trích dẫn.</p>
    {!readOnly && <div className="followups"><button className="followup" onClick={onSample}>Thử tình huống lương thử việc</button><Link className="followup" to="/templates">Tạo đơn theo mẫu</Link></div>}
  </>;
}
