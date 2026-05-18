const Ticket = require('../models/sql/Ticket');
const User = require('../models/sql/User');
const Notification = require('../models/Notification'); // MongoDB
const ActivityLog = require('../models/ActivityLog'); // MongoDB
const { calculateSLADeadline } = require('../config/sla');
const { detectCategory, detectPriority } = require('../services/ai.service');
const { sendEmail, emailTemplates } = require('../services/email.service');
const { Op } = require('sequelize');

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
    if (assignedAgent && req.user.role === 'admin') filter.assignedAgentId = assignedAgent;
    if (search) {
      filter[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const [tickets, total] = await Promise.all([
      Ticket.findAll({
        where: filter,
        include: [
          { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'assignedAgent', attributes: ['id', 'name', 'email'] }
        ],
        order: [['createdAt', 'DESC']],
        offset: offset,
        limit: parseInt(limit),
      }),
      Ticket.count({ where: filter }),
    ]);

    res.json({
      tickets,
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
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'assignedAgent', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

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

    res.json({ ticket });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets
exports.createTicket = async (req, res, next) => {
  try {
    let { title, description, category, priority } = req.body;

    // AI auto-detect if not provided
    if (!category) category = detectCategory(title, description);
    if (!priority) priority = detectPriority(title, description);

    const slaDeadline = calculateSLADeadline(priority);

    // Generate ticket ID
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const ticketIdStr = `TKT-${randomNum}`;

    const ticket = await Ticket.create({
      ticketId: ticketIdStr,
      title,
      description,
      category,
      priority,
      customerId: req.user.id,
      slaDeadline,
    });

    // Cross-DB write: Save log to MongoDB tracking the MySQL ticket
    await ActivityLog.create({
      userId: req.user.id,
      action: 'ticket_created',
      entity: 'Ticket',
      entityId: ticket.id,
    });

    // Email notification
    const tmpl = emailTemplates.ticketCreated(ticket);
    sendEmail({ to: req.user.email, ...tmpl });

    // Real-time broadcast
    const io = req.app.get('io');
    if (io) io.emit('ticket:updated', { action: 'created', ticket });

    // Fetch eager loaded version to pass to frontend cleanly
    const fullTicket = await Ticket.findByPk(ticket.id, {
      include: [{ model: User, as: 'customer', attributes: ['id', 'name', 'email'] }]
    });

    res.status(201).json({ message: 'Ticket created', ticket: fullTicket });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tickets/:id
exports.updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
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

    // Recalculate SLA if priority changes
    if (updates.priority && updates.priority !== ticket.priority) {
      ticket.slaDeadline = calculateSLADeadline(updates.priority);
      updates.slaDeadline = ticket.slaDeadline;
    }

    await ticket.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'ticket_updated',
      entity: 'Ticket',
      entityId: ticket.id,
      metadata: updates,
    });

    // Notify customer in MongoDB
    if (ticket.customerId) {
      await Notification.create({
        userId: ticket.customerId,
        type: 'ticket_updated',
        message: `Your ticket ${ticket.ticketId} has been updated`,
        link: `/tickets/${ticket.id}`,
      });
    }

    const fullTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignedAgent', attributes: ['id', 'name', 'email'] }
      ]
    });

    const io = req.app.get('io');
    if (io) io.emit('ticket:updated', { action: 'updated', ticket: fullTicket });

    res.json({ message: 'Ticket updated', ticket: fullTicket });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets/:id/assign
exports.assignTicket = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.assignedAgentId = agentId;
    if (ticket.status === 'open') ticket.status = 'in_progress';
    await ticket.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'ticket_assigned',
      entity: 'Ticket',
      entityId: ticket.id,
      metadata: { agentId },
    });

    // Notify agent using MongoDB
    await Notification.create({
      userId: agentId,
      type: 'ticket_assigned',
      message: `Ticket ${ticket.ticketId} has been assigned to you`,
      link: `/tickets/${ticket.id}`,
    });

    const fullTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name'] },
        { model: User, as: 'assignedAgent', attributes: ['id', 'name'] }
      ]
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${agentId}`).emit('notification:new', {
        message: `New ticket assigned: ${ticket.ticketId}`,
      });
      io.emit('ticket:updated', { action: 'assigned', ticket: fullTicket });
    }

    res.json({ message: 'Ticket assigned', ticket: fullTicket });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets/:id/rate
exports.rateTicket = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Only the ticket creator can rate' });
    }

    if (!['resolved', 'closed'].includes(ticket.status)) {
      return res.status(400).json({ message: 'Can only rate resolved or closed tickets' });
    }

    ticket.satisfactionRating = rating;
    ticket.satisfactionFeedback = feedback || '';
    await ticket.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'rating_submitted',
      entity: 'Ticket',
      entityId: ticket.id,
      metadata: { rating, feedback },
    });

    res.json({ message: 'Rating submitted', ticket });
  } catch (error) {
    next(error);
  }
};
