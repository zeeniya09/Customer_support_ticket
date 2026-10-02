const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const commentController = require('../controllers/comment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTicketSchema, updateTicketSchema } = require('../validators/ticket.validator');
const { createCommentSchema } = require('../validators/comment.validator');

// Ticket CRUD
router.get('/', authenticate, ticketController.getTickets);
router.post('/', authenticate, validate(createTicketSchema), ticketController.createTicket);
router.get('/:id', authenticate, ticketController.getTicket);
router.patch('/:id', authenticate, authorize('agent', 'admin'), validate(updateTicketSchema), ticketController.updateTicket);
router.post('/:id/assign', authenticate, authorize('admin', 'agent'), ticketController.assignTicket);
router.post('/:id/rate', authenticate, authorize('customer'), ticketController.rateTicket);

// Comments
router.get('/:id/comments', authenticate, commentController.getComments);
router.post('/:id/comments', authenticate, validate(createCommentSchema), commentController.createComment);

module.exports = router;
