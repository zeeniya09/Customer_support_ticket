const Joi = require('joi');

const createTicketSchema = {
  body: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(5000).required(),
    category: Joi.string()
      .valid('billing', 'technical', 'general', 'account', 'bug', 'feature_request', 'other')
      .optional(),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'critical')
      .optional(),
  }),
};

const updateTicketSchema = {
  body: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).max(5000).optional(),
    category: Joi.string()
      .valid('billing', 'technical', 'general', 'account', 'bug', 'feature_request', 'other')
      .optional(),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'critical')
      .optional(),
    status: Joi.string()
      .valid('open', 'in_progress', 'resolved', 'closed')
      .optional(),
  }),
};

module.exports = { createTicketSchema, updateTicketSchema };
