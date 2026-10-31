const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const CompanySettings = require('../models/CompanySettings');
const User = require('../models/User');
const { ensureEmployeeProfile } = require('../utils/employeeProfile');
const { validateCameraLocation } = require('../utils/attendanceLocation');
const { parsePagination } = require('../utils/pagination');

const isWeekend = (date, weekendDays = [0, 6]) => {
  return weekendDays.includes(date.getDay());
};

const resolveEmployee = async (user) => {
  if (user.employeeId) return user.employeeId;
  if (user.role !== 'hr') return null;
  const employee = await ensureEmployeeProfile(user);
  return employee?._id || null;
};

exports.checkIn = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = await resolveEmployee(user);
    if (!employeeId) return res.status(400).json({ message: 'No employee record linked' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await Attendance.findOne({ employee: employeeId, date: today });
    if (existing && existing.checkIn) {
      return res.status(409).json({ message: 'Already checked in for today' });
    }

    const settings = await CompanySettings.findById(req.companyId);
    const source = req.body.source === 'camera' ? 'camera' : 'web';
    let cameraLocation;
    if (source === 'camera') {
      const validation = validateCameraLocation({
        settings,
        location: req.body.location,
      });
      if (validation.error) {
        return res.status(422).json({ message: validation.error });
      }
      if (
        req.body.faceDetectionSupported === true &&
        req.body.faceDetected !== true
      ) {
        return res.status(422).json({
          message: 'A single clear face is required for camera check-in.',
        });
      }
      cameraLocation = validation.location;
    }

    const now = new Date();
    const officeStart = settings?.officeStartTime || '09:00';
    const [startHour, startMin] = officeStart.split(':').map(Number);
    const graceMin = settings?.graceMinutes || 15;
    
    const officeStartTime = new Date(today);
    officeStartTime.setHours(startHour, startMin + graceMin, 0, 0);
    
    let status = 'present';
    if (now > officeStartTime) {
      status = 'late';
    }

    let attendance;
    if (existing) {
      existing.checkIn = now;
      existing.status = status;
      existing.isLate = status === 'late';
      existing.source = source;
      if (cameraLocation) existing.location = cameraLocation;
      attendance = await existing.save();
    } else {
      attendance = await Attendance.create({
        employee: employeeId,
        date: today,
        checkIn: now,
        status,
        isLate: status === 'late',
        source,
        ...(cameraLocation ? { location: cameraLocation } : {}),
      });
    }

    res.json({ message: 'Checked in successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = await resolveEmployee(user);
    if (!employeeId) return res.status(400).json({ message: 'No employee record linked' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'No check-in record found for today' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out' });
    }

    const settings = await CompanySettings.findById(req.companyId);
    const now = new Date();
    attendance.checkOut = now;
    
    const hoursWorked = (now - attendance.checkIn) / (1000 * 60 * 60);
    attendance.hoursWorked = Math.round(hoursWorked * 100) / 100;
    
    const halfDayHours = settings?.halfDayHours || 5;
    if (hoursWorked < halfDayHours) {
      attendance.status = 'half_day';
    }
    
    await attendance.save();
    res.json({ message: 'Checked out successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const { page, limit } = parsePagination(req.query.page, req.query.limit, {
      defaultLimit: 30,
      maxLimit: 100,
    });
    const query = {};
    
    if (req.user.role === 'employee' || req.query.mine === 'true') {
      const user = await User.findById(req.user.id);
      const ownEmployeeId = await resolveEmployee(user);
      if (!ownEmployeeId) {
        return res.status(400).json({ message: 'No employee record linked' });
      }
      query.employee = ownEmployeeId;
    } else if (employeeId) {
      query.employee = employeeId;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('employee')
      .sort({ date: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);
    res.json({ attendance, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.find({ date: today }).populate('employee');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyTodayAttendance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = await resolveEmployee(user);
    if (!employeeId) {
      return res.status(400).json({ message: 'No employee record linked' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    }).populate('employee');
    const settings = await CompanySettings.findById(req.companyId);

    res.json({
      attendance,
      settings: settings
        ? {
            officeStartTime: settings.officeStartTime,
            graceMinutes: settings.graceMinutes,
            halfDayHours: settings.halfDayHours,
            officeRadius: settings.officeRadius,
            officeConfigured:
              Number.isFinite(Number(settings.officeLat)) &&
              Number.isFinite(Number(settings.officeLng)),
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
