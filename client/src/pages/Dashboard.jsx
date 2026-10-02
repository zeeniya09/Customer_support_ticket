import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import TicketCard from '../components/tickets/TicketCard';
import TicketFilters from '../components/tickets/TicketFilters';
import Loader from '../components/ui/Loader';
import API from '../api/axios';
import {
  HiOutlineTicket, HiOutlineClock, HiOutlineCheckCircle,
  HiOutlinePlusCircle, HiOutlineTrendingUp,
} from 'react-icons/hi';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const role = user?.role?.trim().replace(/^["']|["']+$/g, '').toLowerCase();

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const { data } = await API.get(`/tickets?${params.toString()}`);
      setTickets(data.tickets);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    fetchTickets().finally(() => setLoading(false));
  }, [filters]);

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length;

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
            {role === 'admin' ? 'Admin Dashboard' : role === 'agent' ? 'Agent Dashboard' : 'My Tickets'}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Welcome back, {user?.name}</p>
        </div>
        {(role === 'customer' || role === 'admin') && (
          <Link to="/tickets/new" className="btn btn-primary">
            <HiOutlinePlusCircle size={20} />
            New Ticket
          </Link>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={HiOutlineTicket} label="Total Tickets" value={tickets.length} color="#3b82f6" />
        <StatCard icon={HiOutlineClock} label="Open" value={openCount} color="#f59e0b" />
        <StatCard icon={HiOutlineTrendingUp} label="In Progress" value={inProgressCount} color="#8b5cf6" />
        <StatCard icon={HiOutlineCheckCircle} label="Resolved" value={resolvedCount} color="#10b981" />
      </div>

      {/* Filters */}
      <TicketFilters filters={filters} onChange={setFilters} />

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <HiOutlineTicket size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>No tickets found</p>
          <p style={{ fontSize: '0.85rem' }}>
            {role === 'customer' ? 'Create your first ticket to get started!' : 'No tickets match your filters.'}
          </p>
        </div>
      ) : (
        tickets.map((ticket) => <TicketCard key={ticket._id} ticket={ticket} />)
      )}
    </DashboardLayout>
  );
}

