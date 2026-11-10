import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { Field, PageHeading } from '../components/ui';
import { initials } from '../lib/text';
import type { Profile } from '../types';

export function AccountPage() {
  const { data, setData, toast }=useApp();
  const [tab,setTab]=useState<'info'|'security'>('info');
  const [profile,setProfile]=useState<Profile>(data.profile);
  const [passwords,setPasswords]=useState({current:'',next:'',confirm:''});
  return <section className="page"><PageHeading eyebrow="Không gian cá nhân" title="Tài khoản của bạn." subtitle="Quản lý thông tin và tùy chọn sử dụng." />
    <div className="profile-layout"><nav className="card profile-nav">
      <button className={`nav-item ${tab==='info'?'active':''}`} onClick={()=>setTab('info')}><Icon name="user" />Thông tin cá nhân</button>
      <button className={`nav-item ${tab==='security'?'active':''}`} onClick={()=>setTab('security')}><Icon name="lock" />Mật khẩu</button>
      <Link className="nav-item" to="/login"><Icon name="logout" />Xem trang đăng nhập</Link>
    </nav><section className="card profile-card">{tab==='info'?<>
      <h2>Thông tin cá nhân</h2><p className="text-small text-muted">Thông tin giúp cá nhân hóa trải nghiệm của bạn.</p>
      <div className="profile-avatar-row"><span className="avatar large-avatar">{initials(data.profile.name)}</span><div><strong style={{fontSize:12}}>{data.profile.name}</strong><p>Tài khoản minh họa trong bản thiết kế</p></div></div>
      <form onSubmit={e=>{e.preventDefault();setData(d=>({...d,profile}));toast('Đã lưu thông tin trên trình duyệt này.');}}>
        <div className="form-grid"><Field name="name" label="Họ và tên" value={profile.name} required onChange={name=>setProfile(p=>({...p,name}))} />
          <Field name="email" label="Email" type="email" required value={profile.email} onChange={email=>setProfile(p=>({...p,email}))} />
          <div className="field full"><label htmlFor="occupation">Bạn sử dụng Lạc Luật với vai trò</label><select id="occupation" value={profile.occupation} onChange={e=>setProfile(p=>({...p,occupation:e.target.value}))}>
            {['Người lao động','Sinh viên / người mới đi làm','Nhân sự / quản lý doanh nghiệp'].map(v=><option key={v}>{v}</option>)}
          </select></div>
        </div><div className="account-info-note"><Icon name="shield" />Thay đổi ở đây chỉ được lưu trên trình duyệt, không gửi lên máy chủ.</div>
        <div className="form-actions"><button className="btn primary"><Icon name="check" />Lưu thay đổi</button></div>
      </form>
    </>:<><h2>Đổi mật khẩu</h2><p className="text-small text-muted">Chỉ minh họa giao diện cho tài khoản email. Không có mật khẩu nào được lưu.</p>
      <form style={{marginTop:25,maxWidth:450,display:'grid',gap:17}} onSubmit={e=>{e.preventDefault();if(passwords.next!==passwords.confirm){toast('Hai mật khẩu mới chưa trùng nhau.');return;}setPasswords({current:'',next:'',confirm:''});toast('Đã hoàn tất bước minh họa. Không có mật khẩu nào được lưu.');}}>
        <Field name="currentPassword" label="Mật khẩu hiện tại" type="password" required value={passwords.current} onChange={current=>setPasswords(p=>({...p,current}))} />
        <Field name="newPassword" label="Mật khẩu mới" type="password" required minLength={8} value={passwords.next} onChange={next=>setPasswords(p=>({...p,next}))} />
        <Field name="confirmPassword" label="Nhập lại mật khẩu mới" type="password" required minLength={8} value={passwords.confirm} onChange={confirm=>setPasswords(p=>({...p,confirm}))} />
        <div className="form-actions"><button className="btn primary">Cập nhật mật khẩu</button></div>
      </form>
    </>}</section></div>
  </section>;
}
