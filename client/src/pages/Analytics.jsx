import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Loader from '../components/ui/Loader';
import API from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { STATUS_COLORS, PRIORITY_COLORS } from '../utils/constants';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, agentRes] = await Promise.all([
          API.get('/analytics/overview'),
          API.get('/analytics/agents'),
        ]);
        setData(overviewRes.data);
        setAgents(agentRes.data.agentStats);
      } catch (e) { /* */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;
  if (!data) return <DashboardLayout><p>Failed to load analytics</p></DashboardLayout>;

  const { overview, byCategory, byPriority, perDay } = data;

  const categoryData = byCategory.map((c) => ({ name: c._id?.replace('_', ' ') || 'N/A', value: c.count }));
  const priorityData = byPriority.map((p) => ({ name: p._id || 'N/A', value: p.count }));

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>Analytics Dashboard</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Tickets', value: overview.totalTickets, color: '#3b82f6' },
          { label: 'Open', value: overview.openTickets, color: '#f59e0b' },
          { label: 'In Progress', value: overview.inProgressTickets, color: '#8b5cf6' },
          { label: 'Resolved', value: overview.resolvedTickets, color: '#10b981' },
          { label: 'Avg Satisfaction', value: `${overview.avgSatisfaction}/5`, color: '#f59e0b' },
          { label: 'Total Ratings', value: overview.totalRatings, color: '#06b6d4' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: 20, borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Tickets by Category */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Tickets by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData} cx="50%" cy="50%" outerRadius={100}
                dataKey="value" nameKey="name" label={(entry) => entry.name}
              >
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tickets by Priority */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Tickets by Priority</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[entry.name] || COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tickets Over Time */}
      <div className="card" style={{ padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Tickets Created (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={perDay}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorCount)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Agent Performance */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Agent Performance</h3>
        {agents.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No agent data available</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Agent</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Assigned</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Resolved</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Resolution Rate</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{a.agentName}</td>
                    <td style={{ textAlign: 'center', padding: '10px 12px' }}>{a.totalAssigned}</td>
                    <td style={{ textAlign: 'center', padding: '10px 12px' }}>{a.resolved}</td>
                    <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 9999,
                        background: a.resolutionRate >= 80 ? '#d1fae5' : a.resolutionRate >= 50 ? '#fef3c7' : '#fee2e2',
                        color: a.resolutionRate >= 80 ? '#065f46' : a.resolutionRate >= 50 ? '#92400e' : '#991b1b',
                        fontWeight: 600, fontSize: '0.8rem',
                      }}>{a.resolutionRate}%</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 12px', color: '#f59e0b', fontWeight: 600 }}>
                      {a.avgRating ? `${a.avgRating} ★` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
