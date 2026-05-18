const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'billing',
        'technical',
        'general',
        'account',
        'bug',
        'feature_request',
        'other',
      ],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    slaDeadline: { type: Date },
    satisfaction: {
      rating: { type: Number, min: 1, max: 5, default: null },
      feedback: { type: String, default: '' },
    },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

// Auto-generate ticketId before save
ticketSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Index for search and filtering
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ customer: 1 });
ticketSchema.index({ assignedAgent: 1 });
ticketSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Ticket', ticketSchema);
