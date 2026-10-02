const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const User = require('../models/User');

// GET /api/tickets/:id/comments
exports.getComments = async (req, res, next) => {
  try {
    const filter = { ticketId: req.params.id };

    // Customers should not see internal notes
    if (req.user.role === 'customer') {
      filter.isInternal = false;
    }

    const comments = await Comment.find(filter)
      .populate('authorId', 'name email avatar role')
      .sort({ createdAt: 1 });

    const populatedComments = comments.map(c => {
      const cObj = c.toObject();
      cObj.author = c.authorId;
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
    const userId = req.user._id || req.user.id;

    const comment = await Comment.create({
      ticketId: ticket._id,
      authorId: userId,
      body: req.body.body,
      isInternal,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('authorId', 'name email avatar role');

    const commentObj = populatedComment.toObject();
    commentObj.author = populatedComment.authorId;

    res.status(201).json({ message: 'Comment added', comment: commentObj });
  } catch (error) {
    next(error);
  }
};

