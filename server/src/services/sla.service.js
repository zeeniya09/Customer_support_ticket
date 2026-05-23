const Ticket = require('../models/Ticket'); // MongoDB
const User = require('../models/sql/User'); // SQLite
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
    });

    if (overdueTickets.length === 0) return;

    // Fetch related users from SQL for notification purposes
    const userIds = new Set();
    overdueTickets.forEach(t => {
      if (t.customerId) userIds.add(t.customerId);
      if (t.assignedAgentId) userIds.add(t.assignedAgentId);
    });

    const users = await User.findAll({
      where: { id: Array.from(userIds) },
      attributes: ['id', 'name']
    });
    
    const userMap = users.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    for (const ticket of overdueTickets) {
      // Escalate priority if not already critical
      const priorities = ['low', 'medium', 'high', 'critical'];
      const currentIdx = priorities.indexOf(ticket.priority);

      if (currentIdx < priorities.length - 1) {
        ticket.priority = priorities[currentIdx + 1];
        // Recalculate SLA from now with new priority
        const hours = SLA_HOURS[ticket.priority];
        ticket.slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
        await ticket.save();

        // Create notification for assigned agent in MongoDB
        if (ticket.assignedAgentId) {
          const notification = await Notification.create({
            userId: ticket.assignedAgentId,
            type: 'ticket_escalated',
            message: `Ticket ${ticket.ticketId} escalated to ${ticket.priority} priority (SLA breach)`,
            link: `/tickets/${ticket._id}`,
          });

          if (io) {
            io.to(`user_${ticket.assignedAgentId}`).emit('notification:new', notification);
          }
        }

        // Log escalation in MongoDB
        await ActivityLog.create({
          userId: ticket.assignedAgentId || ticket.customerId,
          action: 'ticket_escalated',
          entity: 'Ticket',
          entityId: ticket.ticketId,
          metadata: { reason: 'SLA breach', newPriority: ticket.priority },
        });
      }
    }

    console.log(`⚠️  Processed ${overdueTickets.length} overdue ticket(s) for SLA validation`);
  } catch (error) {
    console.error('SLA escalation error:', error.message);
  }
};

module.exports = { checkAndEscalate };
