const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const aiLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userRole: String,
  query: String,
  toolsUsed: [String],
  response: String,
  tokens: Number,
  duration: Number
}, { timestamps: true });

aiLogSchema.plugin(tenantPlugin);

module.exports = mongoose.model('AiLog', aiLogSchema);
