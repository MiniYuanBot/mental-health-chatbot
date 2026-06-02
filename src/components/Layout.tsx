import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { clearAuth, getProfile } from '../utils/storage';

const navItems = [
  { path: '/home', label: '首页' },
  { path: '/chat', label: 'AI 陪伴' },
  { path: '/report', label: '趋势报告' },
  { path: '/resources', label: '资源推荐' },
  { path: '/profile', label: '匿名设置' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [profile, setProfileState] = useState(getProfile());

  useEffect(() => {
    function refreshProfile() {
      setProfileState(getProfile());
    }
    window.addEventListener('profile-updated', refreshProfile);
    return () => window.removeEventListener('profile-updated', refreshProfile);
  }, []);

  function logout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => navigate('/home')} role="button" tabIndex={0}>
          <span className="brand-mark">PKU</span>
          <span>
            <strong>心晴陪伴</strong>
            <small>AI 情绪支持 Demo</small>
          </span>
        </div>
        <nav className="desktop-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/home'}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-actions">
          <span className="nickname">{profile.nickname}</span>
          <button className="ghost-button" onClick={logout}>
            退出
          </button>
        </div>
      </header>
      <main className="page-wrap">{children}</main>
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/home'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
