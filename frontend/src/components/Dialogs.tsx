import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Field, GoogleIcon, IconButton } from './ui';
import { initials } from '../lib/text';
import { Icon } from './Icon';

function Modal({ title, children, actions, className='' }: { title: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  const {closeDialog}=useApp(); const ref=useRef<HTMLElement>(null);
  useEffect(()=>{
    const previous=document.activeElement;
    const oldOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const focusable=()=>Array.from(ref.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),textarea,select')??[]).filter(el=>el.offsetParent!==null);
    (ref.current?.querySelector<HTMLElement>('input,textarea,select')??focusable()[0])?.focus();
    function keydown(event: KeyboardEvent) {
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeDialog();}
      if(event.key==='Tab'){
        const nodes=focusable(), first=nodes[0],last=nodes[nodes.length-1];
        if(!first)return;
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    }
    window.addEventListener('keydown',keydown,true);
    return ()=>{document.body.style.overflow=oldOverflow;window.removeEventListener('keydown',keydown,true);if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};
  },[closeDialog]);
  return createPortal(<div id="overlay-root"><div className="modal-shade" onClick={e=>{if(e.target===e.currentTarget)closeDialog();}}>
    <section ref={ref} className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-head"><h2 id="modal-title">{title}</h2><IconButton icon="close" label="Đóng cửa sổ" onClick={closeDialog} /></header><div className="modal-body">{children}</div>{actions&&<footer className="modal-actions">{actions}</footer>}</section>
  </div></div>,document.body);
}
export function Dialogs() {
  const {dialog,closeDialog}=useApp();
  const location=useLocation();
  useEffect(()=>{closeDialog();},[location.pathname,closeDialog]);
  if(!dialog)return null;
  if(dialog.type==='rename')return <RenameDialog key={dialog.id} id={dialog.id} />;
  if(dialog.type==='delete')return <DeleteDialog id={dialog.id} />;
  if(dialog.type==='feedback')return <FeedbackDialog topic={dialog.topic} />;
  if(dialog.type==='upload')return <UploadDialog />;
  if(dialog.type==='google')return <GoogleDialog />;
  if(dialog.type==='citation')return <CitationDialog />;
  const content={
    help:{title:'Một bản thiết kế để cùng hình dung',body:<><p>Lạc Luật là giao diện đồ án hỏi đáp pháp luật lao động. Màu chủ đạo <strong>#A62B31</strong>, nền sáng và họa tiết trống đồng Đông Sơn màu vàng ở giữa.</p><p style={{marginTop:12}}>Bạn có thể thử chat mẫu, mở trích dẫn, tạo đơn, lưu lịch sử và chuyển sang không gian quản trị. Nội dung được lưu cục bộ; chưa có AI, đăng nhập hoặc dịch vụ máy chủ thật.</p></>},
    scope:{title:'Phạm vi hỏi đáp',body:<><p>Bản thiết kế tập trung vào hợp đồng lao động, thử việc, tiền lương, nghỉ phép và chấm dứt hợp đồng.</p><p style={{marginTop:12}}>Trong phiên bản hoàn chỉnh, câu trả lời cần dựa trên kho dữ liệu đã được kiểm tra và nêu rõ căn cứ, phiên bản sử dụng.</p></>},
    forgot:{title:'Đã nhận yêu cầu minh họa',body:<p>Trong sản phẩm hoàn chỉnh, hướng dẫn khôi phục sẽ được gửi đến email đã đăng ký. Bản thiết kế hiện không gửi email.</p>},
  };
  const item=content[dialog.type];
  return <Modal title={item.title} actions={<>{dialog.type!=='scope'&&<Link className="btn" to="/login" onClick={closeDialog}>Xem trang đăng nhập</Link>}<button className="btn primary" onClick={closeDialog}>Đã hiểu</button></>}>{item.body}</Modal>;
}
function CitationDialog() {
  const {closeDialog}=useApp();
  return <Modal title="Căn cứ để bạn đối chiếu" className="citation-modal" actions={<button className="btn primary" onClick={closeDialog}><Icon name="check" />Đã đối chiếu</button>}>
    <p className="law-caption">Bộ luật Lao động · 45/2019/QH14</p><div className="law-article"><h3>Điều 26. Tiền lương thử việc</h3><p>Tiền lương của người lao động trong thời gian thử việc do hai bên thỏa thuận nhưng ít nhất phải bằng 85% mức lương của công việc đó.</p></div>
    <div className="law-surrounding"><h3>Đọc trong ngữ cảnh</h3><p>Điều 25 đề cập thời gian thử việc; Điều 27 đề cập kết thúc thời gian thử việc. Bạn cần đối chiếu thêm các điều kiện liên quan trước khi áp dụng.</p></div>
    <div className="source-info">Trích đoạn mẫu từ bản gốc năm 2019 phục vụ thiết kế giao diện. Thông tin hiệu lực và phiên bản cần được kiểm tra trước khi sử dụng.<a href="https://datafiles.chinhphu.vn/cpp/files/vbpq/2019/12/45.signed.pdf" target="_blank" rel="noopener noreferrer">Mở bản gốc tại Cổng Chính phủ <Icon name="external" /></a></div>
  </Modal>;
}
function RenameDialog({id}: {id: string}) {
  const {data,setData,closeDialog,toast}=useApp();
  const [name,setName]=useState(data.threads.find(t=>t.id===id)?.title??'');
  return <Modal title="Đổi tên cuộc trò chuyện" actions={<><button className="btn" onClick={closeDialog}>Hủy</button><button className="btn primary" type="submit" form="rename-form">Lưu tên</button></>}>
    <form id="rename-form" onSubmit={e=>{e.preventDefault();if(!name.trim())return;setData(d=>({...d,threads:d.threads.map(t=>t.id===id?{...t,title:name.trim().slice(0,100)}:t)}));closeDialog();toast('Đã đổi tên cuộc trò chuyện.');}}><Field name="title" label="Tên cuộc trò chuyện" value={name} required onChange={setName} /></form>
  </Modal>;
}
function DeleteDialog({id}: {id: string}) {
  const {setData,closeDialog,toast}=useApp(); const navigate=useNavigate(); const {pathname}=useLocation();
  return <Modal title="Xóa cuộc trò chuyện?" actions={<><button className="btn" onClick={closeDialog}>Giữ lại</button><button className="btn danger" onClick={()=>{setData(d=>({...d,threads:d.threads.filter(t=>t.id!==id)}));closeDialog();if(pathname===`/chat/${id}`)navigate('/chat');toast('Đã xóa cuộc trò chuyện.');}}>Xóa cuộc trò chuyện</button></>}><p>Cuộc trò chuyện này sẽ được xóa khỏi dữ liệu bản xem trước trên trình duyệt.</p></Modal>;
}
function FeedbackDialog({topic}: {topic: string}) {
  const {setData,closeDialog,toast}=useApp();const [text,setText]=useState(''),[type,setType]=useState('Cần giải thích thêm');
  return <Modal title="Góp ý để câu trả lời rõ hơn" actions={<><button className="btn" onClick={closeDialog}>Hủy</button><button className="btn primary" type="submit" form="feedback-form">Gửi góp ý</button></>}>
    <p style={{marginBottom:18}}>Chọn nội dung bạn muốn góp ý. Phản hồi trong bản xem trước chỉ lưu trên trình duyệt.</p>
    <form id="feedback-form" onSubmit={e=>{e.preventDefault();if(!text.trim())return;setData(d=>({...d,feedback:[{id:crypto.randomUUID(),text:text.trim(),type,topic,date:new Date().toLocaleDateString('vi-VN')},...d.feedback]}));closeDialog();toast('Đã lưu góp ý trên trình duyệt này.');}}>
      <div className="field"><label htmlFor="feedback-type">Loại phản hồi</label><select id="feedback-type" value={type} onChange={e=>setType(e.target.value)}>{['Cần giải thích thêm','Căn cứ chưa phù hợp','Trích dẫn có vấn đề','Trải nghiệm sử dụng'].map(v=><option key={v}>{v}</option>)}</select></div>
      <Field name="text" label="Nội dung góp ý" type="textarea" required value={text} onChange={setText} placeholder="Điều gì có thể được cải thiện?" />
    </form>
  </Modal>;
}
function GoogleDialog() {
  const {data,closeDialog,toast}=useApp();const navigate=useNavigate();
  return <Modal title="Tiếp tục với Google" actions={<><button className="btn" onClick={closeDialog}>Đóng</button><button className="btn primary" onClick={()=>{closeDialog();navigate('/chat');toast('Đang xem thử bằng hồ sơ mẫu; chưa đăng nhập Google.');}}>Xem thử với hồ sơ mẫu <Icon name="arrow" /></button></>}>
    <div className="google-preview-mark"><GoogleIcon /></div><p>Đây là bản xem trước luồng đăng nhập bằng Google. Khi triển khai, bạn sẽ chọn tài khoản trên trang xác thực của Google.</p>
    <div className="google-account-preview"><span className="avatar">{initials(data.profile.name)}</span><span><strong>{data.profile.name}</strong><small>{data.profile.email}</small></span><span className="tag gray">Tài khoản mẫu</span></div>
    <p>Chế độ này chỉ mở giao diện bằng hồ sơ mẫu, không kết nối tài khoản Google.</p>
  </Modal>;
}
function UploadDialog() {
  const {setData,closeDialog,toast}=useApp();
  const [file,setFile]=useState<File|null>(null),[title,setTitle]=useState(''),[number,setNumber]=useState('');
  return <Modal title="Thêm tài liệu pháp luật" actions={<><button className="btn" onClick={closeDialog}>Hủy</button><button className="btn primary" type="submit" form="upload-form">Thêm vào danh sách mẫu</button></>}>
    <p style={{marginBottom:20}}>Chọn tài liệu để xem quy trình tiếp nhận. Bản xem trước chỉ lưu thông tin tệp, không tải nội dung lên máy chủ.</p>
    <form id="upload-form" onSubmit={e=>{e.preventDefault();if(!file){toast('Chọn một tệp trước khi thêm.');return;}if(!/\.(pdf|docx?)$/i.test(file.name)){toast('Chỉ nhận PDF, DOC hoặc DOCX.');return;}if(file.size>50*1024*1024){toast('Tệp mẫu cần nhỏ hơn 50 MB.');return;}if(!title.trim()||!number.trim())return;
      setData(d=>({...d,docs:[{id:`doc-${crypto.randomUUID()}`,title:title.trim(),number:number.trim(),type:file.name.split('.').pop()!.toUpperCase(),status:'Chờ kiểm tra',date:new Date().toLocaleDateString('vi-VN'),size:`${(file.size/1024/1024).toFixed(1)} MB`,note:'Chỉ lưu thông tin tệp · chưa xử lý nội dung'},...d.docs]}));closeDialog();toast('Đã thêm thông tin tài liệu vào danh sách mẫu.');}}>
      <label className="upload-drop" htmlFor="doc-file"><Icon name="upload" /><strong>Chọn tài liệu từ máy tính</strong><small>PDF, DOC hoặc DOCX · tối đa 50 MB</small><input className="sr-only" id="doc-file" type="file" accept=".pdf,.doc,.docx" onChange={e=>setFile(e.target.files?.[0]??null)} /></label>
      <p style={{margin:'12px 0',fontSize:10}}>{file?`${file.name} · ${(file.size/1024/1024).toFixed(1)} MB`:''}</p>
      <Field name="title" label="Tên văn bản" value={title} onChange={setTitle} required placeholder="Ví dụ: Bộ luật Lao động" />
      <Field name="number" label="Số hiệu văn bản" value={number} onChange={setNumber} required placeholder="Ví dụ: 45/2019/QH14" />
    </form>
  </Modal>;
}
