const CompanySettings = require('../models/CompanySettings');

const SETTINGS_FIELDS = [
  'companyName',
  'industry',
  'companySize',
  'officeStartTime',
  'graceMinutes',
  'weekendDays',
  'halfDayHours',
  'officeLat',
  'officeLng',
  'officeRadius',
];

exports.getSettings = async (req, res) => {
  try {
    const settings = await CompanySettings.findById(req.companyId);
    if (!settings) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await CompanySettings.findById(req.companyId);
    if (!settings) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    for (const field of SETTINGS_FIELDS) {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
