const Ticket = require('../models/Ticket'); // Now MongoDB
const User = require('../models/sql/User'); // Still SQL
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { calculateSLADeadline } = require('../config/sla');
const { detectCategory, detectPriority } = require('../services/ai.service');
const { sendEmail, emailTemplates } = require('../services/email.service');

// GET /api/tickets
exports.getTickets = async (req, res, next) => {
  try {
    const { status, priority, category, assignedAgent, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Customers see only their own tickets
    if (req.user.role === 'customer') {
      filter.customerId = req.user.id;
    }

    // Agents see only their assigned tickets
    if (req.user.role === 'agent') {
      filter.assignedAgentId = req.user.id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedAgent && req.user.role === 'admin') filter.assignedAgentId = parseInt(assignedAgent);
    
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Ticket.countDocuments(filter),
    ]);

    // Polyglot Join: Fetch User info from SQL for each ticket
    const userIds = new Set();
    tickets.forEach(t => {
      if (t.customerId) userIds.add(t.customerId);
      if (t.assignedAgentId) userIds.add(t.assignedAgentId);
    });

    const users = await User.findAll({
      where: { id: Array.from(userIds) },
      attributes: ['id', 'name', 'email', 'avatar']
    });

    const userMap = users.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    const populatedTickets = tickets.map(t => {
      const ticketObj = t.toObject();
      ticketObj.customer = userMap[t.customerId] || null;
      ticketObj.assignedAgent = userMap[t.assignedAgentId] || null;
      return ticketObj;
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
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Customers can only see their own tickets
    if (
      req.user.role === 'customer' &&
      ticket.customerId !== req.user.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch related Users from SQL
    const userIds = [ticket.customerId];
    if (ticket.assignedAgentId) userIds.push(ticket.assignedAgentId);

    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'name', 'email', 'avatar']
    });

    const userMap = users.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    const ticketObj = ticket.toObject();
    ticketObj.customer = userMap[ticket.customerId] || null;
    ticketObj.assignedAgent = userMap[ticket.assignedAgentId] || null;

    res.json({ ticket: ticketObj });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets
exports.createTicket = async (req, res, next) => {
  try {
    let { title, description, category, priority } = req.body;

    // AI auto-detect
    if (!category) category = detectCategory(title, description);
    if (!priority) priority = detectPriority(title, description);

    const slaDeadline = calculateSLADeadline(priority);
    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const ticket = await Ticket.create({
      ticketId,
      title,
      description,
      category,
      priority,
      customerId: req.user.id,
      slaDeadline,
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: 'ticket_created',
      entity: 'Ticket',
      entityId: ticket.ticketId, // Using the business ID for logging
    });

    // Email notification
    const tmpl = emailTemplates.ticketCreated(ticket);
    sendEmail({ to: req.user.email, ...tmpl });

    // Real-time broadcast
    const io = req.app.get('io');
    if (io) io.emit('ticket:updated', { action: 'created', ticket });

    res.status(201).json({ message: 'Ticket created', ticket });
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
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
        ticket[key] = req.body[key];
      }
    }

    if (updates.priority && updates.priority !== ticket.priority) {
      ticket.slaDeadline = calculateSLADeadline(updates.priority);
    }

    await ticket.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'ticket_updated',
      entity: 'Ticket',
      entityId: ticket.ticketId,
      metadata: updates,
    });

    // Notify customer
    if (ticket.customerId) {
      await Notification.create({
        userId: ticket.customerId,
        type: 'ticket_updated',
        message: `Your ticket ${ticket.ticketId} has been updated`,
        link: `/tickets/${ticket._id}`,
      });
    }

    const io = req.app.get('io');
    if (io) io.emit('ticket:updated', { action: 'updated', ticket });

    res.json({ message: 'Ticket updated', ticket });
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

    ticket.assignedAgentId = parseInt(agentId);
    if (ticket.status === 'open') ticket.status = 'in_progress';
    await ticket.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'ticket_assigned',
      entity: 'Ticket',
      entityId: ticket.ticketId,
      metadata: { agentId },
    });

    // Notify agent
    await Notification.create({
      userId: agentId,
      type: 'ticket_assigned',
      message: `Ticket ${ticket.ticketId} has been assigned to you`,
      link: `/tickets/${ticket._id}`,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${agentId}`).emit('notification:new', {
        message: `New ticket assigned: ${ticket.ticketId}`,
      });
      io.emit('ticket:updated', { action: 'assigned', ticket });
    }

    res.json({ message: 'Ticket assigned', ticket });
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

    if (ticket.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Only the ticket creator can rate' });
    }

    if (!['resolved', 'closed'].includes(ticket.status)) {
      return res.status(400).json({ message: 'Can only rate resolved or closed tickets' });
    }

    ticket.satisfaction = { rating, feedback: feedback || '' };
    await ticket.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'rating_submitted',
      entity: 'Ticket',
      entityId: ticket.ticketId,
      metadata: { rating, feedback },
    });

    res.json({ message: 'Rating submitted', ticket });
  } catch (error) {
    next(error);
  }
};
