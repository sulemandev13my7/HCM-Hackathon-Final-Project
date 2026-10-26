const User = require("../models/User");
const Employee = require("../models/Employee");
const SalaryStructure = require("../models/SalaryStructure");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveType = require("../models/LeaveType");
const bcrypt = require("bcryptjs");
const { generateTemporaryPassword } = require("../utils/temporaryPassword");
const { canDeactivateUser } = require("../utils/userAccess");
const { ensureEmployeeProfile } = require("../utils/employeeProfile");

exports.createHR = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hr = await User.create({
      email,
      password,
      role: "hr",
      firstName,
      lastName,
      mustChangePassword: true,
    });

    await ensureEmployeeProfile(hr);

    res.status(201).json({
      message: "HR user created",
      user: {
        id: hr._id,
        email: hr.email,
        role: hr.role,
        firstName: hr.firstName,
        lastName: hr.lastName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("employeeId")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const tempPassword = generateTemporaryPassword();
    user.password = tempPassword;
    user.mustChangePassword = true;
    await user.save();

    res
      .set("Cache-Control", "no-store")
      .json({ message: "Password reset", tempPassword });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!canDeactivateUser(req.user.id, user._id, user.role)) {
      return res
        .status(403)
        .json({ message: "This account cannot be deactivated" });
    }

    user.isActive = !user.isActive;
    await user.save();
    res.json({
      message: `User ${user.isActive ? "activated" : "deactivated"}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
