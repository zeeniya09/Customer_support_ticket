const Comment = require('../models/Comment'); // MongoDB
const Ticket = require('../models/sql/Ticket'); // MySQL
const User = require('../models/sql/User'); // MySQL
const Notification = require('../models/Notification'); // MongoDB
const ActivityLog = require('../models/ActivityLog'); // MongoDB

// GET /api/tickets/:id/comments
exports.getComments = async (req, res, next) => {
  try {
    const filter = { ticketId: req.params.id };

    // Customers should not see internal notes
    if (req.user.role === 'customer') {
      filter.isInternal = false;
    }

    const comments = await Comment.find(filter).sort({ createdAt: 1 });

    // Polyglot Persistence: Cross-DB Fetching Authors
    // Extract unique author IDs
    const authorIds = [...new Set(comments.map(c => c.authorId))];
    
    // Fetch users natively from MySQL
    const users = await User.findAll({ 
      where: { id: authorIds },
      attributes: ['id', 'name', 'email', 'avatar', 'role']
    });
    
    const userMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});

    // Attach MySQL user objects to MongoDB comment results
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
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Customers can't create internal notes
    const isInternal = req.user.role !== 'customer' && req.body.isInternal === true;

    // Create NoSQL Comment mapped to MySQL Ticket ID
    const comment = await Comment.create({
      ticketId: ticket.id,
      authorId: req.user.id,
      body: req.body.body,
      isInternal,
    });

    const author = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email', 'avatar', 'role'] });
    const populatedObj = comment.toObject();
    populatedObj.author = author;

    await ActivityLog.create({
      userId: req.user.id,
      action: 'comment_added',
      entity: 'Ticket',
      entityId: ticket.id,
    });

    // Notify the other party
    const notifyUserId =
      req.user.role === 'customer' ? ticket.assignedAgentId : ticket.customerId;

    if (notifyUserId && !isInternal) {
      await Notification.create({
        userId: notifyUserId,
        type: 'ticket_commented',
        message: `New comment on ticket ${ticket.ticketId}`,
        link: `/tickets/${ticket.id}`,
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`ticket_${ticket.id}`).emit('ticket:commented', {
        ticketId: ticket.id,
        comment: populatedObj,
      });
    }

    res.status(201).json({ message: 'Comment added', comment: populatedObj });
  } catch (error) {
    next(error);
  }
};
