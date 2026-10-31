const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const leaveTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quota: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: true },
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

leaveTypeSchema.index({ company: 1, name: 1 }, { unique: true });
leaveTypeSchema.plugin(tenantPlugin);

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
