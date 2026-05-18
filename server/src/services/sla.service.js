const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { SLA_HOURS } = require('../config/sla');

/**
 * Check for tickets approaching or past SLA deadline and escalate.
 * Intended to be run on a periodic interval (e.g. every 15 minutes).
 */
const checkAndEscalate = async (io) => {
  try {
    const now = new Date();

    // Find open/in_progress tickets past SLA deadline
    const overdueTickets = await Ticket.find({
      status: { $in: ['open', 'in_progress'] },
      slaDeadline: { $lte: now },
    }).populate('customer assignedAgent');

    for (const ticket of overdueTickets) {
      // Escalate priority if not already critical
      let escalated = false;
      const priorities = ['low', 'medium', 'high', 'critical'];
      const currentIdx = priorities.indexOf(ticket.priority);

      if (currentIdx < priorities.length - 1) {
        ticket.priority = priorities[currentIdx + 1];
        // Recalculate SLA from now with new priority
        const hours = SLA_HOURS[ticket.priority];
        ticket.slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
        await ticket.save();
        escalated = true;
      }

      // Create notification for assigned agent
      if (ticket.assignedAgent) {
        const notification = await Notification.create({
          user: ticket.assignedAgent._id,
          type: 'ticket_escalated',
          message: `Ticket ${ticket.ticketId} has been escalated to ${ticket.priority} priority (SLA breach)`,
          link: `/tickets/${ticket._id}`,
        });

        // Emit real-time notification
        if (io) {
          io.to(`user_${ticket.assignedAgent._id}`).emit('notification:new', notification);
        }
      }

      // Log escalation
      await ActivityLog.create({
        user: ticket.assignedAgent?._id || ticket.customer._id,
        action: 'ticket_escalated',
        entity: 'Ticket',
        entityId: ticket._id,
        metadata: { reason: 'SLA breach', newPriority: ticket.priority },
      });
    }

    if (overdueTickets.length > 0) {
      console.log(`⚠️  Escalated ${overdueTickets.length} overdue ticket(s)`);
    }
  } catch (error) {
    console.error('SLA escalation error:', error.message);
  }
};

module.exports = { checkAndEscalate };
