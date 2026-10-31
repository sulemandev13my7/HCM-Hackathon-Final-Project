const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const attendanceCorrectionSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  requestedCheckIn: Date,
  requestedCheckOut: Date,
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewComment: String,
  reviewedAt: Date
}, { timestamps: true });

attendanceCorrectionSchema.plugin(tenantPlugin);

module.exports = mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);
