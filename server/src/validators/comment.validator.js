const Joi = require('joi');

const createCommentSchema = {
  body: Joi.object({
    body: Joi.string().min(1).max(5000).required(),
    isInternal: Joi.boolean().optional(),
  }),
};

module.exports = { createCommentSchema };
