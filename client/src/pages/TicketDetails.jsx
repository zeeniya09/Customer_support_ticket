import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Loader from '../components/ui/Loader';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { formatDate, timeAgo } from '../utils/helpers';
import { TICKET_STATUSES, TICKET_PRIORITIES } from '../utils/constants';
import { HiOutlinePaperAirplane } from 'react-icons/hi';

export default function TicketDetails() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const userRole = user?.role?.trim().replace(/^["']|["']+$/g, '').toLowerCase();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketRes, commentsRes] = await Promise.all([
          API.get(`/tickets/${id}`),
          API.get(`/tickets/${id}/comments`),
        ]);
        const ticketData = ticketRes.data.ticket;
        const customer = ticketData?.customer || ticketData?.customerId;
        const assigned = ticketData?.assignedAgent || ticketData?.assignedAgentId;
        setTicket({
          ...ticketData,
          customer: customer || ticketData?.customer,
          assignedAgent: assigned || ticketData?.assignedAgent,
        });
        setComments(commentsRes.data.comments);

        if (userRole === 'admin') {
          const agentRes = await API.get('/users?role=agent&limit=100');
          setAgents(agentRes.data.users || []);
        }
      } catch (e) {
        toast.error('Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, userRole]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await API.post(`/tickets/${id}/comments`, { body: newComment, isInternal });
      setNewComment('');
      // Re-fetch comments
      const { data } = await API.get(`/tickets/${id}/comments`);
      setComments(data.comments);
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const { data } = await API.patch(`/tickets/${id}`, { status });
      const customer = data.ticket.customer || data.ticket.customerId;
      const assigned = data.ticket.assignedAgent || data.ticket.assignedAgentId;
      setTicket((prev) => ({
        ...prev,
        ...data.ticket,
        customer: customer || prev?.customer || prev?.customerId,
        assignedAgent: assigned || prev?.assignedAgent || prev?.assignedAgentId,
      }));
      toast.success(`Status changed to ${status.replace('_', ' ')}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async (agentId) => {
    try {
      const { data } = await API.post(`/tickets/${id}/assign`, { agentId });
      const customer = data.ticket.customer || data.ticket.customerId;
      const assigned = data.ticket.assignedAgent || data.ticket.assignedAgentId;
      setTicket((prev) => ({
        ...prev,
        ...data.ticket,
        customer: customer || prev?.customer || prev?.customerId,
        assignedAgent: assigned || prev?.assignedAgent || prev?.assignedAgentId,
      }));
      toast.success('Agent assigned');
    } catch (err) {
      toast.error('Failed to assign agent');
    }
  };

  const handleRate = async () => {
    if (!rating) return;
    try {
      await API.post(`/tickets/${id}/rate`, { rating, feedback });
      toast.success('Thank you for your feedback!');
      setTicket((prev) => ({ ...prev, satisfaction: { rating, feedback } }));
    } catch (err) {
      toast.error('Failed to submit rating');
    }
  };

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;
  if (!ticket) return <DashboardLayout><p>Ticket not found</p></DashboardLayout>;

  const canUpdate = userRole === 'agent' || userRole === 'admin';
  const canRate = userRole === 'customer' && ['resolved', 'closed'].includes(ticket.status) && !ticket.satisfaction?.rating;

  return (
    <DashboardLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, maxWidth: 1100 }}>
        {/* Main content */}
        <div>
          {/* Ticket header */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{ticket.ticketId}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
                <span className={`badge badge-${ticket.status}`}>{ticket.status?.replace('_', ' ')}</span>
              </div>
            </div>
            <h1 style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 700 }}>{ticket.title}</h1>
            <p style={{ color: '#475569', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
          </div>

          {/* Comments */}
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
            Comments ({comments.length})
          </h2>

          {comments.map((c) => (
            <div
              key={c._id}
              className="animate-slideIn"
              style={{
                padding: 16,
                marginBottom: 12,
                borderRadius: 12,
                background: c.isInternal ? '#fffbeb' : '#fff',
                border: `1px solid ${c.isInternal ? '#fde68a' : 'var(--color-border)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: c.author?.role === 'agent' ? '#dbeafe' : c.author?.role === 'admin' ? '#f3e8ff' : '#e0f2fe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13, color: c.author?.role === 'agent' ? '#1d4ed8' : '#7c3aed',
                  }}>
                    {c.author?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.author?.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 8, textTransform: 'capitalize' }}>{c.author?.role}</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{timeAgo(c.createdAt)}</span>
              </div>
              {c.isInternal && <span style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: 600, marginBottom: 4, display: 'block' }}>🔒 Internal Note</span>}
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: '#334155' }}>
                {c.body}
              </p>
            </div>
          ))}

          {/* Comment form */}
          <form onSubmit={handleComment} style={{ marginTop: 20 }}>
            <textarea
              className="textarea"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              rows={3}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              {canUpdate && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#64748b', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                  Internal note
                </label>
              )}
              <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                <HiOutlinePaperAirplane size={16} /> Send
              </button>
            </div>
          </form>

          {/* Rating */}
          {canRate && (
            <div className="card" style={{ padding: 24, marginTop: 24 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Rate your experience</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: star <= rating ? '#f59e0b' : '#e2e8f0', fontSize: 28,
                    }}
                  >★</button>
                ))}
              </div>
              <textarea
                className="textarea"
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Additional feedback (optional)"
              />
              <button onClick={handleRate} className="btn btn-success" style={{ marginTop: 12 }}>Submit Rating</button>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div>
          <div className="card" style={{ padding: 20, position: 'sticky', top: 88 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: '#475569' }}>Ticket Details</h3>

            <InfoRow label="Status">
              {canUpdate ? (
                <select className="select" value={ticket.status} onChange={(e) => handleStatusChange(e.target.value)} style={{ fontSize: '0.8rem', padding: '6px 10px' }}>
                  {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              ) : (
                <span className={`badge badge-${ticket.status}`}>{ticket.status?.replace('_', ' ')}</span>
              )}
            </InfoRow>

            <InfoRow label="Priority">
              {canUpdate ? (
                <select className="select" value={ticket.priority} onChange={async (e) => {
                  try {
                    const { data } = await API.patch(`/tickets/${id}`, { priority: e.target.value });
                    const customer = data.ticket.customer || data.ticket.customerId;
                    const assigned = data.ticket.assignedAgent || data.ticket.assignedAgentId;
                    setTicket((prev) => ({
                      ...prev,
                      ...data.ticket,
                      customer: customer || prev?.customer || prev?.customerId,
                      assignedAgent: assigned || prev?.assignedAgent || prev?.assignedAgentId,
                    }));
                  } catch (err) { toast.error('Failed'); }
                }} style={{ fontSize: '0.8rem', padding: '6px 10px' }}>
                  {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
              )}
            </InfoRow>

            <InfoRow label="Category"><span style={{ textTransform: 'capitalize' }}>{ticket.category?.replace('_', ' ')}</span></InfoRow>
            <InfoRow label="Customer">{(ticket.customer?.name || ticket.customerId?.name) || '—'}</InfoRow>

            <InfoRow label="Assigned Agent">
              {userRole === 'admin' ? (
                <select
                  className="select"
                  value={ticket.assignedAgent?._id || ticket.assignedAgentId?._id || ticket.assignedAgent || ticket.assignedAgentId || ''}
                  onChange={(e) => handleAssign(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              ) : (
                <span>{(ticket.assignedAgent?.name || ticket.assignedAgentId?.name) || 'Unassigned'}</span>
              )}
            </InfoRow>

            <InfoRow label="Created">{formatDate(ticket.createdAt)}</InfoRow>
            <InfoRow label="Updated">{formatDate(ticket.updatedAt)}</InfoRow>

            {ticket.satisfaction?.rating && (
              <InfoRow label="Rating">
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{'★'.repeat(ticket.satisfaction.rating)}{'☆'.repeat(5 - ticket.satisfaction.rating)}</span>
              </InfoRow>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{children}</span>
    </div>
  );
}
