const AttendanceCorrection = require("../models/AttendanceCorrection");
const User = require("../models/User");
const {
  isValidCorrectionRequest,
} = require("../utils/attendanceCorrectionValidation");
const { ensureEmployeeProfile } = require("../utils/employeeProfile");

const resolveEmployeeId = async (user) => {
  if (user.employeeId) return user.employeeId;
  if (user.role !== "hr") return null;
  const employee = await ensureEmployeeProfile(user);
  return employee?._id || null;
};

exports.requestCorrection = async (req, res) => {
  try {
    if (!isValidCorrectionRequest(req.body)) {
      return res.status(422).json({
        message: "Provide a valid date, reason, and check-in or check-out time",
      });
    }

    const user = await User.findById(req.user.id);
    const employeeId = await resolveEmployeeId(user);
    if (!employeeId)
      return res.status(400).json({ message: "No employee record linked" });

    const correction = await AttendanceCorrection.create({
      employee: employeeId,
      date: req.body.date,
      requestedCheckIn: req.body.checkIn,
      requestedCheckOut: req.body.checkOut,
      reason: req.body.reason,
      requestedBy: user._id,
    });

    res.status(201).json(correction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCorrections = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "employee") {
      const user = await User.findById(req.user.id);
      const employeeId = await resolveEmployeeId(user);
      if (!employeeId) {
        return res.status(400).json({ message: "No employee record linked" });
      }
      query.employee = employeeId;
    }
    const corrections = await AttendanceCorrection.find(query)
      .populate("employee requestedBy reviewedBy")
      .sort({ createdAt: -1 });
    res.json(corrections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveCorrection = async (req, res) => {
  try {
    const correction = await AttendanceCorrection.findById(
      req.params.id,
    ).populate("employee");
    if (!correction)
      return res.status(404).json({ message: "Correction not found" });
    if (correction.status !== "pending")
      return res.status(400).json({ message: "Already processed" });

    const Attendance = require("../models/Attendance");
    const date = new Date(correction.date);
    date.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employee: correction.employee._id,
      date,
    });
    if (!attendance) {
      attendance = await Attendance.create({
        employee: correction.employee._id,
        date,
        checkIn: correction.requestedCheckIn
          ? new Date(correction.requestedCheckIn)
          : undefined,
        checkOut: correction.requestedCheckOut
          ? new Date(correction.requestedCheckOut)
          : undefined,
        status: "present",
      });
    } else {
      if (correction.requestedCheckIn)
        attendance.checkIn = new Date(correction.requestedCheckIn);
      if (correction.requestedCheckOut)
        attendance.checkOut = new Date(correction.requestedCheckOut);
      await attendance.save();
    }

    correction.status = "approved";
    correction.reviewedBy = req.user.id;
    correction.reviewedAt = new Date();
    correction.reviewComment = req.body.comment || "";
    await correction.save();

    res.json({ message: "Correction approved", correction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectCorrection = async (req, res) => {
  try {
    const correction = await AttendanceCorrection.findById(req.params.id);
    if (!correction)
      return res.status(404).json({ message: "Correction not found" });
    if (correction.status !== "pending")
      return res.status(400).json({ message: "Already processed" });

    correction.status = "rejected";
    correction.reviewedBy = req.user.id;
    correction.reviewedAt = new Date();
    correction.reviewComment = req.body.comment || "";
    await correction.save();

    res.json({ message: "Correction rejected", correction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
