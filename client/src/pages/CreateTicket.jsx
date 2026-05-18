import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../utils/constants';

export default function CreateTicket() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/tickets', form);
      toast.success(`Ticket ${data.ticket.ticketId} created!`);

      // Upload attachment if provided
      if (file && data.ticket._id) {
        const formData = new FormData();
        formData.append('file', file);
        await API.post(`/tickets/${data.ticket._id}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate(`/tickets/${data.ticket._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Create New Ticket</h1>
        <p style={{ color: '#64748b', marginBottom: 32, fontSize: '0.9rem' }}>
          Describe your issue and we&apos;ll get back to you as soon as possible.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 32 }}>
            {/* Title */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600 }}>Title *</label>
              <input
                className="input"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief summary of your issue"
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600 }}>Description *</label>
              <textarea
                className="textarea"
                required
                rows={6}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Provide as much detail as possible to help us resolve your issue quickly…"
              />
            </div>

            {/* Category & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600 }}>Category</label>
                <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Auto-detect</option>
                  {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Leave blank for AI auto-detection</span>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600 }}>Priority</label>
                <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="">Auto-detect</option>
                  {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Leave blank for AI auto-detection</span>
              </div>
            </div>

            {/* File attachment */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600 }}>Attachment (optional)</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ fontSize: '0.85rem' }}
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.zip"
              />
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
