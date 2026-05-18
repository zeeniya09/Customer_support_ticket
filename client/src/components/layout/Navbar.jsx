import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import API from '../../api/axios';
import { HiOutlineBell, HiOutlineSearch } from 'react-icons/hi';
import { timeAgo } from '../../utils/helpers';

export default function Navbar() {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await API.get('/notifications?limit=10');
        setNotifications(data.notifications);
        setUnread(data.unreadCount);
      } catch (e) { /* ignore */ }
    };
    fetchNotifications();
  }, []);

  // Real-time notifications
  useEffect(() => {
    if (!socket) return;
    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnread((prev) => prev + 1);
    };
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket]);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) { /* ignore */ }
  };

  return (
    <header style={{
      height: 64, background: '#fff', borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', position: 'sticky', top: 0, zIndex: 40,
    }}>
      {/* Search */}
      <div style={{ position: 'relative', width: 340 }}>
        <HiOutlineSearch size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          className="input"
          placeholder="Search tickets, users, articles…"
          style={{ paddingLeft: 38, height: 40 }}
        />
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }} ref={panelRef}>
        {/* Notification bell */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          style={{
            position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, borderRadius: 8,
          }}
        >
          <HiOutlineBell size={22} color="#64748b" />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 18, height: 18, borderRadius: '50%',
              background: '#ef4444', color: '#fff',
              fontSize: '0.65rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{unread > 9 ? '9+' : unread}</span>
          )}
        </button>

        {/* Notification dropdown */}
        {showPanel && (
          <div style={{
            position: 'absolute', top: 56, right: 32,
            width: 360, maxHeight: 400, overflowY: 'auto',
            background: '#fff', borderRadius: 12,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            border: '1px solid var(--color-border)',
            zIndex: 100, animation: 'fadeIn 0.2s ease-out',
          }}>
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} style={{
                  background: 'none', border: 'none', color: 'var(--color-primary)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                }}>Mark all read</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map((n, i) => (
                <div key={n._id || i} style={{
                  padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
                  background: n.read ? 'transparent' : '#f0f9ff',
                  cursor: 'pointer',
                }}>
                  <div style={{ fontSize: '0.85rem', marginBottom: 4 }}>{n.message}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{timeAgo(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Avatar */}
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
