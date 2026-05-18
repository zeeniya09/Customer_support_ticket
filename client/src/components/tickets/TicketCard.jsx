import { Link } from 'react-router-dom';
import { truncate, timeAgo } from '../../utils/helpers';

export default function TicketCard({ ticket }) {
  return (
    <Link
      to={`/tickets/${ticket._id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div className="card" style={{ padding: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{ticket.ticketId}</span>
            <h3 style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 600 }}>{ticket.title}</h3>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
            <span className={`badge badge-${ticket.status}`}>{ticket.status?.replace('_', ' ')}</span>
          </div>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 12px', lineHeight: 1.5 }}>
          {truncate(ticket.description, 120)}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>{ticket.category}</span>
          <div style={{ display: 'flex', gap: 16 }}>
            {ticket.assignedAgent && (
              <span>Agent: {ticket.assignedAgent.name || 'Assigned'}</span>
            )}
            <span>{timeAgo(ticket.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
