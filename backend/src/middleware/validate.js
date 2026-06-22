const { validationResult } = require('express-validator');
const logger = require('../config/logger');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    // Log validation errors for debugging
    logger.warn('[validate] Validation failed:', JSON.stringify(formatted));
    logger.warn('[validate] Request body:', JSON.stringify(req.body));

    return res.status(400).json({
      success: false,
      message: formatted.map(e => e.message).join('. '),
      errors: formatted,
    });
  }
  next();
};

module.exports = validate;
