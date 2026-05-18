const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const commentController = require('../controllers/comment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTicketSchema, updateTicketSchema } = require('../validators/ticket.validator');
const { createCommentSchema } = require('../validators/comment.validator');
const upload = require('../middleware/upload');
const Attachment = require('../models/Attachment');
const ActivityLog = require('../models/ActivityLog');

// Ticket CRUD
router.get('/', authenticate, ticketController.getTickets);
router.post('/', authenticate, validate(createTicketSchema), ticketController.createTicket);
router.get('/:id', authenticate, ticketController.getTicket);
router.patch('/:id', authenticate, authorize('agent', 'admin'), validate(updateTicketSchema), ticketController.updateTicket);
router.post('/:id/assign', authenticate, authorize('admin'), ticketController.assignTicket);
router.post('/:id/rate', authenticate, authorize('customer'), ticketController.rateTicket);

// Comments
router.get('/:id/comments', authenticate, commentController.getComments);
router.post('/:id/comments', authenticate, validate(createCommentSchema), commentController.createComment);

// Attachments
router.post('/:id/attachments', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const attachment = await Attachment.create({
      ticket: req.params.id,
      uploader: req.user._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'attachment_uploaded',
      entity: 'Ticket',
      entityId: req.params.id,
    });

    res.status(201).json({ message: 'File uploaded', attachment });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
