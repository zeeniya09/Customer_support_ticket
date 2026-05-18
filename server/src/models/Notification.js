const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'ticket_assigned',
        'ticket_updated',
        'ticket_commented',
        'ticket_resolved',
        'ticket_escalated',
        'sla_warning',
        'general',
      ],
      default: 'general',
    },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
