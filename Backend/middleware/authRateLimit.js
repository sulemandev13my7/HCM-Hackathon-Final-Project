const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many sign-in attempts. Please try again in 15 minutes.",
  },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many workspaces created from this network. Try again later.",
  },
});

module.exports = loginLimiter;
module.exports.loginLimiter = loginLimiter;
module.exports.signupLimiter = signupLimiter;
