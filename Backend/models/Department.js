const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

departmentSchema.index({ company: 1, name: 1 }, { unique: true });
departmentSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Department', departmentSchema);
