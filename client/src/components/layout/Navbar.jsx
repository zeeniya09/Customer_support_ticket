import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function Navbar() {
  const { user } = useContext(AuthContext);

  return (
    <header style={{
      height: 64, background: '#fff', borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', position: 'sticky', top: 0, zIndex: 40,
    }}>
      {/* Title / Brand info */}
      <div>
        <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Customer Support Portal
        </span>
      </div>

      {/* Right side user badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
            {user?.role}
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 14,
        }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

