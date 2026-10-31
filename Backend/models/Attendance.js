const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: Date,
  checkOut: Date,
  status: { type: String, enum: ['present', 'late', 'half_day', 'absent', 'on_leave', 'missing_checkout'], default: 'present' },
  isLate: { type: Boolean, default: false },
  hoursWorked: { type: Number, default: 0 },
  source: { type: String, enum: ['web', 'camera'], default: 'web' },
  location: { lat: Number, lng: Number },
  remarks: String
}, { timestamps: true });

attendanceSchema.index({ company: 1, employee: 1, date: 1 }, { unique: true });
attendanceSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Attendance', attendanceSchema);
