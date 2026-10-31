const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CompanySettings = require('../models/CompanySettings');
const { SESSION_COOKIE_NAME } = require('../utils/sessionCookie');
const { runWithTenant } = require('../config/tenantContext');

exports.protect = async (req, res, next) => {
  let token;
  if (req.cookies?.[SESSION_COOKIE_NAME]) {
    token = req.cookies[SESSION_COOKIE_NAME];
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    if ((decoded.tv || 0) !== (req.user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session has expired' });
    }
    if (!req.user.company) {
      return res.status(401).json({ message: 'Workspace is no longer available' });
    }
    if (decoded.cid && String(decoded.cid) !== String(req.user.company)) {
      return res.status(401).json({ message: 'Session has expired' });
    }

    req.companyId = req.user.company;
    return runWithTenant(req.user.company, next);
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
};

exports.checkSetup = async (req, res, next) => {
  const companyId = req.companyId || req.user?.company;
  const settings = companyId
    ? await CompanySettings.findById(companyId)
    : null;
  if (!settings || !settings.setupComplete) {
    return res.status(400).json({ message: 'Workspace setup is not complete.' });
  }
  next();
};
