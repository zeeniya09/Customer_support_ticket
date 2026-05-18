import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Loader from '../components/ui/Loader';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineUsers } from 'react-icons/hi';
import { formatDate } from '../utils/helpers';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (search) params.set('search', search);
      params.set('limit', '100');
      const { data } = await API.get(`/users?${params}`);
      setUsers(data.users);
    } catch (e) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter, search]);

  const changeRole = async (userId, newRole) => {
    try {
      await API.patch(`/users/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch (err) { toast.error('Failed to update role'); }
  };

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>
        <HiOutlineUsers style={{ verticalAlign: 'middle', marginRight: 8 }} />User Management
      </h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input className="input" placeholder="Search by name or email…" value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <select className="select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--color-border)' }}>
              {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: 13,
                    }}>{u.name?.charAt(0).toUpperCase()}</div>
                    {u.name}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select className="select" value={u.role} onChange={(e) => changeRole(u._id, e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}>
                    <option value="customer">Customer</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="badge" style={{ background: u.isActive ? '#d1fae5' : '#fee2e2',
                    color: u.isActive ? '#065f46' : '#991b1b' }}>{u.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem' }}>{formatDate(u.createdAt)}</td>
                <td style={{ padding: '12px 16px' }}>—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
