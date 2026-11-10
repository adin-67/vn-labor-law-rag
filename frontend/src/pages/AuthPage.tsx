import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Brand, Field, GoogleIcon, PreviewTag } from '../components/ui';
import { Icon } from '../components/Icon';

export function AuthPage({ mode }: { mode: 'login'|'register'|'forgot' }) {
  const register=mode==='register', forgot=mode==='forgot';
  const {openDialog,setData,toast}=useApp();
  const navigate=useNavigate();
  const [email,setEmail]=useState(''), [password,setPassword]=useState(''), [show,setShow]=useState(false);
  useEffect(()=>{document.title=`${register?'Đăng ký':forgot?'Khôi phục mật khẩu':'Đăng nhập'} · Lạc Luật`;},[register,forgot]);
  const google=<button type="button" className="btn google-btn" onClick={()=>openDialog({type:'google'})}><GoogleIcon /><span>{register?'Đăng ký bằng Google':'Tiếp tục với Google'}</span></button>;
  return <main className="auth-layout page-fade"><section className="auth-art"><Brand />
    <div className="auth-art-copy"><div className="eyebrow" style={{color:'#9b5b51'}}>Pháp luật gần hơn với cuộc sống</div><h1>Hiểu đúng hôm nay.<br /><em>An tâm ngày mai.</em></h1><p>Một không gian để hỏi, tìm hiểu và đối chiếu những quyền lợi trong công việc của bạn.</p></div>
    <div className="auth-proof"><Icon name="shield" />Giải thích rõ ràng. Căn cứ để bạn kiểm chứng.</div>
  </section><section className="auth-main"><div className="auth-preview"><PreviewTag /></div><div className={`auth-box ${register?'google-register':''}`}>
    <div className="eyebrow">Chào mừng đến với Lạc Luật</div><h2>{forgot?'Lấy lại mật khẩu.':register?'Bắt đầu cùng Lạc Luật.':'Rất vui được gặp lại bạn.'}</h2>
    <p>{forgot?'Nhập email để xem bước tiếp theo trong bản thiết kế.':register?'Dùng tài khoản Google để lưu cuộc trò chuyện và những tài liệu của bạn.':'Đăng nhập để tiếp tục cuộc trò chuyện và xem lại những điều đã lưu.'}</p>
    {!forgot&&<div className="auth-tabs"><Link to="/login" className={!register?'active':''}>Đăng nhập</Link><Link to="/register" className={register?'active':''}>Đăng ký</Link></div>}
    {register?<div className="google-register-content">{google}<p className="google-register-caption">Một tài khoản cho mọi cuộc trò chuyện.<br />Không cần tạo mật khẩu mới.</p>
      <div className="auth-account-benefits"><span><Icon name="chat" />Xem lại những điều đã trao đổi</span><span><Icon name="file" />Lưu và tiếp tục soạn mẫu đơn</span></div>
    </div>:<>
      {!forgot&&<>{google}<div className="auth-divider"><span>hoặc đăng nhập bằng email</span></div></>}
      <form onSubmit={e=>{e.preventDefault();if(forgot){openDialog({type:'forgot'});return;}setData(d=>({...d,profile:{...d.profile,email}}));navigate('/chat');toast('Bạn đang khám phá giao diện bằng tài khoản minh họa.');}}>
        <Field name="email" label="Địa chỉ email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
        {!forgot&&<><div className="field"><label htmlFor="auth-password">Mật khẩu</label><div className="password-wrap"><input id="auth-password" name="password" type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={8} placeholder="Ít nhất 8 ký tự" required autoComplete="off" />
          <button type="button" className="icon-btn" onClick={()=>setShow(v=>!v)} aria-label={show?'Ẩn mật khẩu':'Hiện mật khẩu'} aria-pressed={show}><Icon name="eye" /></button></div></div>
          <div className="auth-options"><label className="check-label"><input type="checkbox" />Ghi nhớ đăng nhập</label><Link to="/forgot">Quên mật khẩu?</Link></div>
        </>}
        <button className="btn primary">{forgot?'Xem bước khôi phục':'Đăng nhập bản xem trước'}<Icon name="arrow" /></button>
      </form>
    </>}
    <Link className="auth-demo-link" to="/chat">{forgot?'Quay về không gian hỏi đáp':'Khám phá giao diện trước'} →</Link>
    <p className="auth-footer">{register?'Bản xem trước giao diện · Google OAuth chưa được kết nối.':<>Bản thiết kế tương tác · chưa có xác thực thật.<br />Vui lòng dùng thông tin minh họa, không nhập mật khẩu đang sử dụng.</>}</p>
  </div></section></main>;
}
