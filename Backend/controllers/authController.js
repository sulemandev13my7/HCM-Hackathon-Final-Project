const User = require('../models/User');
const CompanySettings = require('../models/CompanySettings');
const LeaveType = require('../models/LeaveType');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  hashPasswordResetToken,
  isValidPasswordResetToken,
} = require('../utils/passwordReset');
const {
  PASSWORD_REQUIREMENT,
  isValidNewPassword,
} = require('../utils/passwordPolicy');
const {
  clearSessionCookie,
  setSessionCookie,
} = require('../utils/sessionCookie');
const { runInTransaction } = require('../utils/transactions');
const { runWithTenant } = require('../config/tenantContext');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_LEAVE_TYPES = [
  { name: 'Annual', quota: 20, isPaid: true, description: 'Planned annual leave' },
  { name: 'Sick', quota: 10, isPaid: true, description: 'Medical and recovery leave' },
  { name: 'Casual', quota: 10, isPaid: true, description: 'Short personal leave' },
  { name: 'Unpaid', quota: 0, isPaid: false, description: 'Leave without pay' },
];

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, tv: user.tokenVersion || 0, cid: user.company },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

const publicUser = (user, company) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  firstName: user.firstName,
  lastName: user.lastName,
  employeeId: user.employeeId,
  mustChangePassword: user.mustChangePassword,
  company: user.company,
  companyName: company?.companyName || '',
});

const createWorkspace = async ({
  companyName,
  firstName,
  lastName,
  email,
  password,
  industry,
  companySize,
}) => {
  const normalizedCompanyName = String(companyName || '').trim();
  const normalizedFirstName = String(firstName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedCompanyName || !normalizedFirstName || !normalizedEmail || !password) {
    const error = new Error('Please provide company name, first name, email and password');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedCompanyName.length > 80) {
    const error = new Error('Company name must be 80 characters or fewer');
    error.statusCode = 400;
    throw error;
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    const error = new Error('Please provide a valid work email');
    error.statusCode = 400;
    throw error;
  }

  if (!isValidNewPassword(password)) {
    const error = new Error(PASSWORD_REQUIREMENT);
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  return runInTransaction(async (session) => {
    const [company] = await CompanySettings.create(
      [
        {
          companyName: normalizedCompanyName,
          industry: String(industry || '').trim(),
          companySize: String(companySize || '').trim(),
          setupComplete: true,
        },
      ],
      { session },
    );

    const [admin] = await User.create(
      [
        {
          email: normalizedEmail,
          password,
          role: 'admin',
          company: company._id,
          firstName: normalizedFirstName,
          lastName: String(lastName || '').trim(),
          mustChangePassword: false,
        },
      ],
      { session },
    );

    company.owner = admin._id;
    await company.save({ session });

    await runWithTenant(company._id, () =>
      LeaveType.insertMany(
        DEFAULT_LEAVE_TYPES.map((leaveType) => ({
          ...leaveType,
          company: company._id,
        })),
        { session },
      ),
    );

    return { admin, company };
  });
};

exports.checkFirstRun = async (req, res) => {
  res.json({ needsSetup: false, setupComplete: true, signupEnabled: true });
};

exports.signup = async (req, res) => {
  try {
    const { admin, company } = await createWorkspace(req.body);

    setSessionCookie(res, generateToken(admin));

    res.status(201).json({
      message: 'Workspace created successfully',
      user: publicUser(admin, company),
    });
  } catch (error) {
    const status = error.statusCode || (error.code === 11000 ? 409 : 500);
    const message =
      error.code === 11000
        ? 'An account with this email already exists'
        : error.message;
    res.status(status).json({ message });
  }
};

exports.firstRunSetup = async (req, res) => {
  req.body = {
    ...req.body,
    email: req.body.email || req.body.adminEmail,
    password: req.body.password || req.body.adminPassword,
  };
  return exports.signup(req, res);
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: normalizedEmail }).populate('employeeId');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const company = await CompanySettings.findById(user.company);
    if (!company) {
      return res.status(401).json({ message: 'Workspace is no longer available' });
    }

    user.lastLogin = new Date();
    await user.save();

    setSessionCookie(res, generateToken(user));

    res.json({
      user: publicUser(user, company)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!isValidNewPassword(newPassword)) {
      return res.status(400).json({
        message: PASSWORD_REQUIREMENT
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password required' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password incorrect' });
      }
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    setSessionCookie(res, generateToken(user));

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete a password reset using an admin-issued one-time link
exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!isValidPasswordResetToken(token)) {
      return res.status(400).json({
        message: 'This password reset link is invalid or has expired'
      });
    }

    if (!isValidNewPassword(newPassword)) {
      return res.status(400).json({
        message: PASSWORD_REQUIREMENT
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate(
      {
        passwordResetTokenHash: hashPasswordResetToken(token),
        passwordResetExpiresAt: { $gt: new Date() },
        isActive: true
      },
      {
        $set: {
          password: passwordHash,
          mustChangePassword: false,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null
        },
        $inc: { tokenVersion: 1 }
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!user) {
      return res.status(400).json({
        message: 'This password reset link is invalid or has expired'
      });
    }

    clearSessionCookie(res);

    res.json({
      message: 'Password reset successfully. Sign in with your new password.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = (req, res) => {
  clearSessionCookie(res);
  res.json({ message: 'Signed out' });
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('employeeId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const company = await CompanySettings.findById(user.company);
    res.json({
      ...user.toObject(),
      companyName: company?.companyName || '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
