const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const designationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

designationSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Designation', designationSchema);
