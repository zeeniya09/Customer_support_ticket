const Ticket = require('../models/Ticket'); // MongoDB
const User = require('../models/sql/User'); // SQL
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// GET /api/tickets/:id/comments
exports.getComments = async (req, res, next) => {
  try {
    const filter = { ticketId: req.params.id };

    // Customers should not see internal notes
    if (req.user.role === 'customer') {
      filter.isInternal = false;
    }

    const comments = await Comment.find(filter).sort({ createdAt: 1 });

    // Polyglot Join: Fetch User info from SQL
    const authorIds = [...new Set(comments.map(c => c.authorId))];
    const users = await User.findAll({
      where: { id: authorIds },
      attributes: ['id', 'name', 'email', 'avatar', 'role']
    });
    
    const userMap = users.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    const populatedComments = comments.map(c => {
      const cObj = c.toObject();
      cObj.author = userMap[c.authorId] || null;
      return cObj;
    });

    res.json({ comments: populatedComments });
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
      ticketId: ticket._id, // Now using Mongo ID
      authorId: req.user.id,
      body: req.body.body,
      isInternal,
    });

    // Populate for response
    const author = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email', 'avatar', 'role'] });
    const commentObj = comment.toObject();
    commentObj.author = author;

    await ActivityLog.create({
      userId: req.user.id,
      action: 'comment_added',
      entity: 'Ticket',
      entityId: ticket.ticketId,
    });

    // Notify the other party
    const notifyUserId =
      req.user.role === 'customer' ? ticket.assignedAgentId : ticket.customerId;

    if (notifyUserId && !isInternal) {
      await Notification.create({
        userId: notifyUserId,
        type: 'ticket_commented',
        message: `New comment on ticket ${ticket.ticketId}`,
        link: `/tickets/${ticket._id}`,
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`ticket_${ticket._id}`).emit('ticket:commented', {
        ticketId: ticket._id,
        comment: commentObj,
      });
    }

    res.status(201).json({ message: 'Comment added', comment: commentObj });
  } catch (error) {
    next(error);
  }
};
