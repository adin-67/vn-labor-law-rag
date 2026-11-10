import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../components/ChatMessage';
import { Icon } from '../components/Icon';
import { PageHeading } from '../components/ui';
import { initials } from '../lib/text';
import { adminConversations, conversationDate } from '../lib/conversations';

function searchable(text: string) {
  return text.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/đ/g,'d');
}

export function AdminConversationsPage() {
  const { data } = useApp();
  const [params,setParams] = useSearchParams();
  const all = adminConversations(data);
  const users = [...new Map(all.map(t=>[t.owner.id,t.owner])).values()];
  const q = params.get('q') ?? '', user = params.get('user') ?? '';
  const query = searchable(q.trim());
  const conversations = all.filter(t => (!user || t.owner.id === user)
    && searchable(`${t.owner.name} ${t.owner.email} ${t.title} ${t.preview} ${t.messages.map(m=>m.role==='user'?m.text:'').join(' ')}`).includes(query));
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key,value); else next.delete(key);
    setParams(next,{replace:true});
  }
  return <section className="page admin-conversations-page">
    <PageHeading eyebrow="Theo dõi hội thoại theo người dùng" title="Lịch sử hội thoại." subtitle="Tìm cuộc trò chuyện và xem lại nội dung người dùng đã trao đổi với hệ thống." />
    <div className="stats-grid">
      <Summary title="Cuộc hội thoại" value={all.length} note="Bao gồm hội thoại mẫu và hồ sơ hiện tại" icon="chat" />
      <Summary title="Người dùng" value={users.length} note="Có ít nhất một cuộc hội thoại" icon="users" />
      <Summary title="Tin nhắn" value={all.reduce((n,t)=>n+t.messages.length,0)} note="Câu hỏi và phản hồi của hệ thống" icon="history" />
    </div>
    <div className="admin-history-note"><Icon name="info" /><p>Bản xem trước gồm hội thoại của hồ sơ hiện tại và ví dụ của người dùng mẫu. Quản trị viên xem nội dung ở chế độ chỉ đọc.</p></div>
    <section className="card table-card">
      <div className="table-toolbar admin-history-toolbar">
        <div className="search-field"><Icon name="search" /><input type="search" aria-label="Tìm hội thoại người dùng" placeholder="Tìm tên, email hoặc hội thoại…" value={q} onChange={e=>filter('q',e.target.value)} /></div>
        <div className="admin-user-filter"><label htmlFor="conversation-user">Người dùng</label><select id="conversation-user" aria-label="Lọc theo người dùng" value={user} onChange={e=>filter('user',e.target.value)}>
          <option value="">Tất cả người dùng</option>{users.map(u=><option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}
        </select></div>
      </div>
      <div className="table-scroll"><table className="admin-conversations-table"><thead><tr><th>NGƯỜI DÙNG</th><th>HỘI THOẠI</th><th>TIN NHẮN</th><th>CẬP NHẬT</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>
        {conversations.length ? conversations.map(t=><tr key={t.id}>
          <td><div className="admin-owner"><span className="avatar">{initials(t.owner.name)}</span><div><strong>{t.owner.name}</strong><small>{t.owner.email}</small><span className="admin-source-label">{t.sample?'Người dùng mẫu':'Hồ sơ hiện tại'}</span></div></div></td>
          <td><Link className="admin-conversation-title" to={`/admin/conversations/${t.id}${params.size?`?${params}`:''}`}>{t.title}</Link><p className="admin-conversation-preview">{t.preview}</p></td>
          <td><span className="admin-message-count">{t.messages.length}</span></td><td>{conversationDate(t)}</td>
          <td><Link className="btn small" to={`/admin/conversations/${t.id}${params.size?`?${params}`:''}`} aria-label={`Xem hội thoại: ${t.title}`}>Xem chi tiết <Icon name="arrow" /></Link></td>
        </tr>) : <tr><td colSpan={5}><div className="admin-history-empty"><Icon name="search" /><h2>Không tìm thấy hội thoại</h2><p>Thử từ khóa khác hoặc bỏ bộ lọc người dùng.</p><button className="btn" onClick={()=>setParams({},{replace:true})}>Xóa bộ lọc</button></div></td></tr>}
      </tbody></table></div><div className="table-footer"><span>{conversations.length} / {all.length} hội thoại</span><span>Mới nhất trước</span></div>
    </section>
  </section>;
}

export function AdminConversationDetail() {
  const { id } = useParams();
  const { search } = useLocation();
  const { data } = useApp();
  const thread = adminConversations(data).find(t=>t.id===id);
  const back = `/admin/conversations${search}`;
  if (!thread) return <section className="page"><Link className="back-link" to={back}><Icon name="back" />Lịch sử hội thoại</Link><div className="card admin-history-empty"><Icon name="chat" /><h1>Không tìm thấy hội thoại</h1><p>Hội thoại không có trong dữ liệu hiện tại hoặc đã được người dùng xóa.</p><Link className="btn" to={back}>Quay lại danh sách</Link></div></section>;
  return <section className="page admin-conversation-detail">
    <Link className="back-link" to={back}><Icon name="back" />Lịch sử hội thoại</Link>
    <PageHeading eyebrow="Chi tiết cuộc trò chuyện" title={thread.title} subtitle={`Cập nhật: ${conversationDate(thread)} · ${thread.messages.length} tin nhắn`} action={<span className="tag gray admin-readonly"><Icon name="lock" />Chỉ xem</span>} />
    <section className="card admin-conversation-owner" aria-label="Thông tin người dùng">
      <span className="avatar">{initials(thread.owner.name)}</span><div><span className="admin-owner-label">Người dùng</span><h2>{thread.owner.name}</h2><p>{thread.owner.email}</p></div>
      <span className="tag gray">{thread.sample?'Người dùng mẫu':'Hồ sơ hiện tại'}</span>
    </section>
    <div className="admin-conversation-transcript" aria-label="Nội dung hội thoại">
      {thread.messages.length ? thread.messages.map((message,index)=><ChatMessage key={`${thread.id}-${index}`} message={message} topic={thread.title} readOnly />)
        : <p className="admin-history-empty">Hội thoại chưa có tin nhắn.</p>}
    </div>
    <p className="admin-transcript-footer"><Icon name="lock" />Chế độ xem lịch sử · không thể gửi thêm tin nhắn hoặc chỉnh sửa nội dung tại đây.</p>
  </section>;
}

function Summary({title,value,note,icon}: {title:string;value:number;note:string;icon:string}) {
  return <article className="card stat-card"><span>{title}</span><strong>{String(value).padStart(2,'0')}</strong><small>{note}</small><Icon name={icon} /></article>;
}
