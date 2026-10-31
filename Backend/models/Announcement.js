const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetRoles: [{ type: String, enum: ['admin', 'hr', 'employee'] }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

announcementSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Announcement', announcementSchema);
