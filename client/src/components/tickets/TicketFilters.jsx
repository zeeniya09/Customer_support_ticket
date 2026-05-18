import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES } from '../../utils/constants';

export default function TicketFilters({ filters, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div style={{
      display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20,
      padding: 16, background: '#fff', borderRadius: 12,
      border: '1px solid var(--color-border)',
    }}>
      <select
        className="select"
        value={filters.status || ''}
        onChange={(e) => handleChange('status', e.target.value)}
        style={{ width: 160 }}
      >
        <option value="">All Statuses</option>
        {TICKET_STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace('_', ' ')}</option>
        ))}
      </select>

      <select
        className="select"
        value={filters.priority || ''}
        onChange={(e) => handleChange('priority', e.target.value)}
        style={{ width: 160 }}
      >
        <option value="">All Priorities</option>
        {TICKET_PRIORITIES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        className="select"
        value={filters.category || ''}
        onChange={(e) => handleChange('category', e.target.value)}
        style={{ width: 160 }}
      >
        <option value="">All Categories</option>
        {TICKET_CATEGORIES.map((c) => (
          <option key={c} value={c}>{c.replace('_', ' ')}</option>
        ))}
      </select>

      <input
        className="input"
        placeholder="Search…"
        value={filters.search || ''}
        onChange={(e) => handleChange('search', e.target.value)}
        style={{ width: 200 }}
      />
    </div>
  );
}
