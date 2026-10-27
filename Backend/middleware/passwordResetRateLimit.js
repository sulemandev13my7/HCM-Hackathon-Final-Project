const rateLimit = require("express-rate-limit");

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many password reset attempts. Please try again in 15 minutes.",
  },
});

module.exports = passwordResetLimiter;
