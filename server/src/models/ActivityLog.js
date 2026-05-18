const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'ticket_created',
        'ticket_updated',
        'ticket_assigned',
        'ticket_resolved',
        'ticket_closed',
        'ticket_escalated',
        'comment_added',
        'attachment_uploaded',
        'user_registered',
        'user_role_changed',
        'kb_article_created',
        'kb_article_updated',
        'rating_submitted',
      ],
    },
    entity: { type: String, required: true }, // e.g. 'Ticket', 'User'
    entityId: { type: Number, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
