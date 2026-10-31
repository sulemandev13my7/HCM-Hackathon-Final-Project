const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

holidaySchema.plugin(tenantPlugin);

module.exports = mongoose.model('Holiday', holidaySchema);
