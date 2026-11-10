import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { ChatMessage } from '../components/ChatMessage';
import { IconButton } from '../components/ui';

const samples = {
  wage: 'Lương công việc của tôi là 12 triệu đồng/tháng. Công ty trả lương thử việc 9 triệu đồng thì có phù hợp không?',
  notice: 'Tôi muốn nghỉ việc. Cần cung cấp thông tin gì để xác định thời gian báo trước?',
  leave: 'Tôi muốn tìm hiểu về quyền nghỉ phép và tạo đơn xin nghỉ phép.',
};
const starters = [
  { kind: 'wage', icon: 'wallet', title: 'Lương & thử việc', text: 'Lương thử việc của tôi được tính như thế nào?' },
  { kind: 'notice', icon: 'briefcase', title: 'Hợp đồng & nghỉ việc', text: 'Tôi cần chuẩn bị gì trước khi nghỉ việc?' },
  { kind: 'leave', icon: 'calendar', title: 'Nghỉ phép & ngày nghỉ', text: 'Tìm hiểu quyền nghỉ phép và tạo đơn theo mẫu.' },
] as const;

export function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, sendMessage, pendingThreadId, openDialog, toast } = useApp();
  const [question, setQuestion] = useState('');
  const thread = data.threads.find(t => t.id === id);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (thread) end.current?.scrollIntoView({block:'end',behavior:'smooth'}); }, [thread?.messages.length, thread?.id, pendingThreadId]);

  function send(text: string) {
    const nextId = sendMessage(text, thread?.id);
    if (nextId) { setQuestion(''); navigate(`/chat/${nextId}`); }
  }
  return <div className="chat-page">
    {thread ? <section className="chat-thread">
      <div className="thread-top"><Icon name="chat" />{thread.title}<span style={{marginLeft:'auto'}}>Nội dung minh họa</span></div>
      {thread.messages.map((message,index) => <ChatMessage key={`${thread.id}-${index}`} message={message} topic={thread.title} onSample={() => send(samples.wage)} />)}
      {pendingThreadId === thread.id && <div className="typing" role="status" aria-label="Đang chuẩn bị nội dung mẫu"><span /><span /><span /></div>}
    </section> : <section className="chat-welcome">
      <div className="welcome-marker">Đồng hành cùng bạn trong công việc</div>
      <h1>Hiểu quyền của bạn.<br /><em>An tâm mỗi quyết định.</em></h1>
      <p className="welcome-description">Từ một câu hỏi nhỏ đến những quyết định quan trọng. Tìm hiểu pháp luật lao động với lời giải thích dễ hiểu và căn cứ để bạn tự mình đối chiếu.</p>
      <div className="starter-grid">{starters.map(s => <button key={s.kind} className="starter-card" onClick={() => send(samples[s.kind])} disabled={!!pendingThreadId}>
        <span className="topic-icon"><Icon name={s.icon} /></span><Icon name="arrow" /><strong>{s.title}</strong><p>{s.text}</p>
      </button>)}</div>
      <div className="welcome-bottom">
        <span className="welcome-benefit"><Icon name="shield" />Giải thích rõ ràng</span>
        <span className="welcome-benefit"><Icon name="book" />Nguồn để kiểm chứng</span>
        <span className="welcome-benefit"><Icon name="user" />Bạn luôn là người quyết định</span>
      </div>
    </section>}
    <div className="composer-wrap" ref={end}><form className="composer" onSubmit={e => {e.preventDefault();send(question);}}>
      <label className="sr-only" htmlFor="chat-input">Nhập câu hỏi pháp luật</label>
      <textarea id="chat-input" value={question} onChange={e => setQuestion(e.target.value)} maxLength={3000} placeholder="Bạn đang gặp vấn đề gì trong công việc?" required
        onKeyDown={e => {if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {e.preventDefault();send(question);}}} />
      <div className="composer-bottom"><div className="composer-tools">
        <IconButton icon="attach" label="Đính kèm tài liệu" onClick={() => toast('Bản thiết kế chưa xử lý tài liệu đính kèm trong hội thoại.')} />
        <span className="composer-separator" />
        <button type="button" className="text-action" onClick={() => openDialog({type:'scope'})}><Icon name="book" />Pháp luật lao động</button>
        <span className="text-action"><Icon name="shield" />Có căn cứ đối chiếu</span>
      </div><button className="send-btn" type="submit" disabled={!!pendingThreadId || !question.trim()} aria-label="Gửi câu hỏi"><Icon name="send" /></button></div>
    </form><p className="composer-footer">Câu trả lời trong bản xem trước là nội dung mẫu. Luôn đối chiếu nguồn trước khi sử dụng.</p></div>
  </div>;
}

