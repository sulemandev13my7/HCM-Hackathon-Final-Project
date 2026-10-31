const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true, maxlength: 80 },
  slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  industry: { type: String, trim: true, maxlength: 60 },
  companySize: { type: String, trim: true, maxlength: 30 },
  officeStartTime: { type: String, default: '09:00' },
  graceMinutes: { type: Number, default: 15 },
  weekendDays: { type: [Number], default: [0, 6] }, // 0 Sunday, 6 Saturday
  halfDayHours: { type: Number, default: 5 },
  officeLat: Number,
  officeLng: Number,
  officeRadius: { type: Number, default: 150 }, // meters
  setupComplete: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
