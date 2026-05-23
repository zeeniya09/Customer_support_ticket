const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['billing', 'technical_issue', 'account_access', 'feature_request', 'general_inquiry', 'uncategorized'],
      default: 'uncategorized',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed', 'escalated'],
      default: 'open',
    },
    // Polyglot link: References SQL User internal ID (Number)
    customerId: {
      type: Number,
      required: true,
      index: true,
    },
    assignedAgentId: {
      type: Number,
      index: true,
    },
    slaDeadline: {
      type: Date,
    },
    satisfaction: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ category: 1 });

// Full-text search index for search functionality
ticketSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Ticket', ticketSchema);
