const User = require('../models/User');
const CompanySettings = require('../models/CompanySettings');
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, tv: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

// Check if first run setup needed
exports.checkFirstRun = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    const settings = await CompanySettings.findOne();
    res.json({
      needsSetup: adminCount === 0,
      setupComplete: settings?.setupComplete || false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// First run setup - create company and admin
exports.firstRunSetup = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const { companyName, adminEmail, adminPassword, firstName, lastName } = req.body;
    const normalizedCompanyName = String(companyName || '').trim();
    const normalizedEmail = String(adminEmail || '').trim().toLowerCase();

    if (!normalizedCompanyName || !normalizedEmail || !adminPassword) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid admin email' });
    }

    if (!isValidNewPassword(adminPassword)) {
      return res.status(400).json({
        message: PASSWORD_REQUIREMENT
      });
    }

    // Create company settings
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({
        companyName: normalizedCompanyName,
        setupComplete: true
      });
    } else {
      settings.companyName = normalizedCompanyName;
      settings.setupComplete = true;
      await settings.save();
    }

    // Create admin user
    const admin = await User.create({
      email: normalizedEmail,
      password: adminPassword,
      role: 'admin',
      firstName,
      lastName,
      mustChangePassword: false
    });

    setSessionCookie(res, generateToken(admin));

    res.status(201).json({
      message: 'Setup completed successfully',
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

    user.lastLogin = new Date();
    await user.save();

    setSessionCookie(res, generateToken(user));

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        mustChangePassword: user.mustChangePassword
      }
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
    const user = await User.findById(req.user.id).select('-password').populate('employeeId');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
