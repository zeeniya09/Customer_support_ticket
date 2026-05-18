/**
 * Validate request body/params/query using a Joi schema.
 * @param {Object} schema - Joi schema object with optional body, params, query keys
 */
const validate = (schema) => {
  return (req, res, next) => {
    const targets = ['body', 'params', 'query'];
    const errors = [];

    for (const target of targets) {
      if (schema[target]) {
        const { error } = schema[target].validate(req[target], {
          abortEarly: false,
          stripUnknown: true,
        });
        if (error) {
          errors.push(
            ...error.details.map((d) => ({
              field: d.path.join('.'),
              message: d.message,
            }))
          );
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    next();
  };
};

module.exports = validate;
