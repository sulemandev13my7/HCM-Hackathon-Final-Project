const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  read: { type: Boolean, default: false },
  link: String
}, { timestamps: true });

notificationSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Notification', notificationSchema);
