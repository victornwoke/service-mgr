// src/middleware/sanitize.js
const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize request body fields to prevent XSS.
 * Use as middleware before controllers.
 */
const sanitizeBody = (fields = []) => {
  return (req, res, next) => {
    fields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = sanitizeHtml(req.body[field], {
          allowedTags: [],        // disallow all HTML
          allowedAttributes: {}   // no attributes
        });
      }
    });
    next();
  };
};

module.exports = { sanitizeBody };