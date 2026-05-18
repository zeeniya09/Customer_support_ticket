const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// GET /api/tickets/:id/comments
exports.getComments = async (req, res, next) => {
  try {
    const filter = { ticket: req.params.id };

    // Customers should not see internal notes
    if (req.user.role === 'customer') {
      filter.isInternal = false;
    }

    const comments = await Comment.find(filter)
      .populate('author', 'name email avatar role')
      .sort({ createdAt: 1 });

    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets/:id/comments
exports.createComment = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Customers can't create internal notes
    const isInternal = req.user.role !== 'customer' && req.body.isInternal === true;

    const comment = await Comment.create({
      ticket: ticket._id,
      author: req.user._id,
      body: req.body.body,
      isInternal,
    });

    await comment.populate('author', 'name email avatar role');

    await ActivityLog.create({
      user: req.user._id,
      action: 'comment_added',
      entity: 'Ticket',
      entityId: ticket._id,
    });

    // Notify the other party
    const notifyUserId =
      req.user.role === 'customer' ? ticket.assignedAgent : ticket.customer;

    if (notifyUserId && !isInternal) {
      await Notification.create({
        user: notifyUserId,
        type: 'ticket_commented',
        message: `New comment on ticket ${ticket.ticketId}`,
        link: `/tickets/${ticket._id}`,
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`ticket_${ticket._id}`).emit('ticket:commented', {
        ticketId: ticket._id,
        comment,
      });
    }

    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    next(error);
  }
};
