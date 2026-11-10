import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Brand, IconButton, PreviewTag } from './ui';
import { initials } from '../lib/text';
import { Icon } from './Icon';

export function Layout() {
  const { pathname } = useLocation();
  const { data, openDialog } = useApp();
  const admin = pathname.startsWith('/admin');
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [small, setSmall] = useState(() => matchMedia('(max-width:800px)').matches);
  const menuButton = useRef<HTMLButtonElement>(null);
  const title = admin ? pathname.startsWith('/admin/conversations')
    ? pathname === '/admin/conversations' ? 'Lịch sử hội thoại' : 'Chi tiết hội thoại'
    : pathname === '/admin/data' ? 'Dữ liệu pháp luật' : 'Kiểm tra tài liệu'
    : pathname === '/search-demo' ? 'Tìm điều luật'
    : pathname.startsWith('/templates') ? 'Tạo đơn theo mẫu' : pathname === '/account' ? 'Tài khoản' : 'Hỏi đáp pháp luật';

  useEffect(() => {
    setSearch(''); setMobileOpen(false); window.scrollTo(0,0);
    document.title = `${title} · Lạc Luật`;
  }, [pathname, title]);
  useEffect(() => {
    const media = matchMedia('(max-width:800px)');
    const update = () => setSmall(media.matches);
    media.addEventListener('change',update);
    return () => media.removeEventListener('change',update);
  }, []);
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && mobileOpen) { setMobileOpen(false); menuButton.current?.focus(); }
    }
    window.addEventListener('keydown',escape);
    return () => window.removeEventListener('keydown',escape);
  }, [mobileOpen]);

  const threads = data.threads.filter(t => `${t.title} ${t.preview}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  return <div className="app-shell">
    {mobileOpen && small && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
    <aside id="main-navigation" className={`sidebar ${mobileOpen ? 'open' : ''}`} aria-label="Điều hướng chính" inert={small && !mobileOpen}>
      <Brand />
      {!admin && <Link to="/chat" className="new-chat"><Icon name="plus" />Trò chuyện mới</Link>}
      <div className="nav-label">{admin ? 'Không gian quản trị' : 'Không gian của bạn'}</div>
      <nav className="nav-group">{admin ? <>
        <NavItem to="/admin/data" label="Dữ liệu pháp luật" icon="database" />
        <NavItem to="/admin/conversations" label="Lịch sử hội thoại" icon="history" />
      </> : <>
        <NavItem to="/chat" label="Hỏi đáp pháp luật" icon="chat" />
        <NavItem to="/search-demo" label="Tìm điều luật" icon="search" />
        <NavItem to="/templates" label="Tạo mẫu đơn" icon="file" />
      </>}</nav>
      {admin ? <div className="sidebar-spacer" /> : <section className="sidebar-history" aria-label="Lịch sử trò chuyện">
        <div className="history-section-heading"><h2>Lịch sử trò chuyện</h2><span aria-label={`${data.threads.length} cuộc trò chuyện`}>{data.threads.length}</span></div>
        <div className="sidebar-search"><Icon name="search" />
          <input type="search" placeholder="Tìm cuộc trò chuyện" aria-label="Tìm cuộc trò chuyện" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="sidebar-history-list">{threads.length ? threads.map(t => <div key={t.id} className={`sidebar-thread ${pathname === `/chat/${t.id}` ? 'selected' : ''}`}>
          <Link className="sidebar-thread-link" to={`/chat/${t.id}`} title={t.title} aria-current={pathname === `/chat/${t.id}` ? 'page' : undefined}>
            <Icon name="chat" /><span>{t.title}</span>
          </Link>
          <div className="sidebar-thread-actions">
            <IconButton icon="edit" label={`Đổi tên: ${t.title}`} onClick={() => openDialog({type:'rename',id:t.id})} />
            <IconButton icon="trash" label={`Xóa: ${t.title}`} onClick={() => openDialog({type:'delete',id:t.id})} />
          </div>
        </div>) : <p className="sidebar-history-empty" role="status">Chưa có cuộc trò chuyện phù hợp.</p>}</div>
      </section>}
      <div className="sidebar-foot"><span className="avatar">{initials(data.profile.name)}</span>
        <Link to="/account" className="account-link"><div className="account-label">{data.profile.name}</div><div className="account-sub">{admin ? 'Quản trị viên' : 'Tài khoản cá nhân'}</div></Link>
        <Link to={admin ? '/chat' : '/admin/data'} className="switch-mode" title="Chuyển không gian trong bản xem trước">{admin ? 'Người dùng' : 'Quản trị'}</Link>
      </div>
    </aside>
    <main className="main"><header className="topbar"><div className="topbar-inner">
      <button type="button" ref={menuButton} className="icon-btn mobile-menu" aria-label="Mở điều hướng" aria-controls="main-navigation" aria-expanded={small && mobileOpen} onClick={() => setMobileOpen(v => !v)}><Icon name="menu" /></button>
      <div className="breadcrumb"><span>{admin ? 'Quản trị' : 'Không gian của bạn'}</span><Icon name="chevron" /><b>{title}</b></div>
    </div><div className="top-actions"><PreviewTag /><IconButton icon="help" label="Thông tin bản thiết kế" onClick={() => openDialog({type:'help'})} />
      <Link to="/account" className="avatar top-avatar" aria-label="Tài khoản">{initials(data.profile.name)}</Link>
    </div></header><div className="page-fade"><Outlet /></div></main>
  </div>;
}

function NavItem({ to, label, icon }: { to: string; label: string; icon: string }) {
  return <NavLink to={to} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><Icon name={icon} /><span>{label}</span></NavLink>;
}
