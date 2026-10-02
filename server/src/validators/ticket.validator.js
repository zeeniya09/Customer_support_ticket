const Joi = require('joi');

const CATEGORIES = ['technical', 'billing', 'account', 'general'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES   = ['open', 'in_progress', 'resolved', 'closed'];

const createTicketSchema = {
  body: Joi.object({
    title:       Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(5000).required(),
    category:    Joi.string().valid(...CATEGORIES).optional(),
    priority:    Joi.string().valid(...PRIORITIES).optional(),
  }),
};

const updateTicketSchema = {
  body: Joi.object({
    title:       Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).max(5000).optional(),
    category:    Joi.string().valid(...CATEGORIES).optional(),
    priority:    Joi.string().valid(...PRIORITIES).optional(),
    status:      Joi.string().valid(...STATUSES).optional(),
  }),
};

module.exports = { createTicketSchema, updateTicketSchema };
