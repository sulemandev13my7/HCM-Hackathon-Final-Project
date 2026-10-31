const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: String,
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: String,
  before: mongoose.Schema.Types.Mixed,
  after: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

auditLogSchema.plugin(tenantPlugin);

module.exports = mongoose.model('AuditLog', auditLogSchema);
