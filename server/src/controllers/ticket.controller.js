const Ticket = require('../models/Ticket');
const User = require('../models/User');

// GET /api/tickets
exports.getTickets = async (req, res, next) => {
  try {
    const { status, priority, category, assignedAgent, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    const userId = req.user._id || req.user.id;

    // Customers see only their own tickets
    if (req.user.role === 'customer') {
      filter.customerId = userId;
    }

    // Agents see only their assigned tickets
    if (req.user.role === 'agent') {
      filter.assignedAgentId = userId;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedAgent && req.user.role === 'admin') filter.assignedAgentId = assignedAgent;
    
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('customerId', 'name email avatar role')
        .populate('assignedAgentId', 'name email avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Ticket.countDocuments(filter),
    ]);

    const populatedTickets = tickets.map(t => {
      const tObj = t.toObject();
      tObj.customer = t.customerId;
      tObj.assignedAgent = t.assignedAgentId;
      return tObj;
    });

    res.json({
      tickets: populatedTickets,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets/:id
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customerId', 'name email avatar role')
      .populate('assignedAgentId', 'name email avatar role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const ticketCustId = ticket.customerId?._id?.toString() || ticket.customerId?.toString();

    // Customers can only see their own tickets
    if (req.user.role === 'customer' && ticketCustId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const ticketObj = ticket.toObject();
    ticketObj.customer = ticket.customerId;
    ticketObj.assignedAgent = ticket.assignedAgentId;

    res.json({ ticket: ticketObj });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets
exports.createTicket = async (req, res, next) => {
  try {
    let { title, description, category = 'general_inquiry', priority = 'medium' } = req.body;
    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const userId = req.user._id || req.user.id;

    const ticket = await Ticket.create({
      ticketId,
      title,
      description,
      category,
      priority,
      customerId: userId,
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'name email avatar role');

    res.status(201).json({ message: 'Ticket created', ticket: populatedTicket });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tickets/:id
exports.updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const allowedUpdates = ['title', 'description', 'category', 'priority', 'status'];

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        ticket[key] = req.body[key];
      }
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'name email avatar role')
      .populate('assignedAgentId', 'name email avatar role');

    res.json({ message: 'Ticket updated', ticket: updatedTicket });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets/:id/assign
exports.assignTicket = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.assignedAgentId = agentId || req.user._id;
    if (ticket.status === 'open') ticket.status = 'in_progress';
    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'name email avatar role')
      .populate('assignedAgentId', 'name email avatar role');

    res.json({ message: 'Ticket assigned', ticket: updatedTicket });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets/:id/rate
exports.rateTicket = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const ticketCustId = ticket.customerId.toString();

    if (ticketCustId !== userId) {
      return res.status(403).json({ message: 'Only the ticket creator can rate' });
    }

    if (!['resolved', 'closed'].includes(ticket.status)) {
      return res.status(400).json({ message: 'Can only rate resolved or closed tickets' });
    }

    ticket.satisfaction = { rating, feedback: feedback || '' };
    await ticket.save();

    res.json({ message: 'Rating submitted', ticket });
  } catch (error) {
    next(error);
  }
};

