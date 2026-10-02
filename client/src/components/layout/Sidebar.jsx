import { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  HiOutlineTicket, HiOutlinePlusCircle, HiOutlineChartBar,
  HiOutlineBookOpen, HiOutlineUsers, HiOutlineCog, HiOutlineLogout,
  HiOutlineHome,
} from 'react-icons/hi';

const navLinks = {
  customer: [
    { to: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
    { to: '/tickets/new', icon: HiOutlinePlusCircle, label: 'New Ticket' },
  ],
  agent: [
    { to: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
  ],
  admin: [
    { to: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
    { to: '/tickets/new', icon: HiOutlinePlusCircle, label: 'New Ticket' },
    { to: '/users', icon: HiOutlineUsers, label: 'Users' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role?.trim().replace(/^["']|["']+$/g, '').toLowerCase();
  const links = navLinks[role] || navLinks.customer;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: 260,
      minHeight: '100vh',
      background: 'var(--color-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50,
    }}>
      {/* Brand */}
      <div style={{ padding: '0 24px', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 16,
          }}>S</div>
          <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: 18 }}>SupportDesk</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', borderRadius: 8, marginBottom: 4,
                color: active ? '#fff' : '#94a3b8',
                background: active ? 'var(--color-sidebar-hover)' : 'transparent',
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                transition: 'var(--transition)',
              }}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '0 12px' }}>
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: 'var(--color-sidebar-hover)',
          marginBottom: 8,
        }}>
          <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'capitalize' }}>{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', borderRadius: 8, width: '100%',
            background: 'transparent', border: 'none',
            color: '#94a3b8', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: 500,
            transition: 'var(--transition)',
          }}
        >
          <HiOutlineLogout size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
