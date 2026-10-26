const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const PayrollRun = require("../models/PayrollRun");
const User = require("../models/User");
const Announcement = require("../models/Announcement");
const Department = require("../models/Department");
const { startOfMonth } = require("date-fns");
const mongoose = require("mongoose");
const CompanySettings = require("../models/CompanySettings");
const Holiday = require("../models/Holiday");
const SalaryStructure = require("../models/SalaryStructure");
const LeaveBalance = require("../models/LeaveBalance");
const { isValidDateRange } = require("../utils/dateTime");
const { buildDashboardAnalytics } = require("../utils/dashboardAnalytics");
const {
  buildEmployeeDashboardMetrics,
} = require("../utils/dashboardCalculations");

exports.getAdminDashboard = async (req, res) => {
  return getAnalyticsDashboard(req, res);
};

exports.getHRDashboard = async (req, res) => {
  return getAnalyticsDashboard(req, res);
};

const getAnalyticsDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const defaultStart = `${today.slice(0, 7)}-01`;
    const startDate = req.query.startDate || defaultStart;
    const endDate = req.query.endDate || today;
    const departmentId = req.query.departmentId || "";
    if (!isValidDateRange(startDate, endDate)) {
      return res.status(422).json({ message: "Invalid dashboard date range" });
    }
    if (departmentId && !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(422).json({ message: "Invalid department filter" });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const endExclusive = new Date(`${endDate}T00:00:00.000Z`);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    const employeeQuery = {
      joinDate: { $lt: endExclusive },
      $or: [
        { terminationDate: { $exists: false } },
        { terminationDate: null },
        { terminationDate: { $gte: start } },
      ],
    };
    if (departmentId) employeeQuery.department = departmentId;

    const [employees, settings, holidays, departments] = await Promise.all([
      Employee.find(employeeQuery).populate("department", "name"),
      CompanySettings.findOne(),
      Holiday.find({
        isActive: true,
        date: { $gte: start, $lt: endExclusive },
      }),
      Department.find({}, "name").sort({ name: 1 }),
    ]);
    const employeeIds = employees.map((employee) => employee._id);
    const yearStart = Number(startDate.slice(0, 4));
    const yearEnd = Number(endDate.slice(0, 4));
    const [attendance, leaves, salaryStructures, payrollRuns, leaveBalances] =
      await Promise.all([
        employeeIds.length
          ? Attendance.find({
              employee: { $in: employeeIds },
              date: { $gte: start, $lt: endExclusive },
            })
          : [],
        employeeIds.length
          ? LeaveRequest.find({
              employee: { $in: employeeIds },
              startDate: { $lt: endExclusive },
              endDate: { $gte: start },
            })
              .populate("leaveType", "name")
              .populate("employee", "firstName lastName department")
          : [],
        employeeIds.length
          ? SalaryStructure.find({
              employee: { $in: employeeIds },
              isActive: true,
            })
          : [],
        PayrollRun.find({
          status: "finalized",
          year: { $gte: yearStart, $lte: yearEnd },
        }).populate("items.employee", "department"),
        employeeIds.length
          ? LeaveBalance.find({
              employee: { $in: employeeIds },
              year: Number(endDate.slice(0, 4)),
            }).populate("leaveType", "name")
          : [],
      ]);

    const analytics = buildDashboardAnalytics({
      startDate,
      endDate,
      weekendDays: settings?.weekendDays || [0, 6],
      holidayDates: holidays.map((holiday) => holiday.date),
      employees,
      attendance,
      leaves,
      salaryStructures,
      payrollRuns,
      leaveBalances,
    });
    res.json({
      ...analytics,
      filters: { startDate, endDate, departmentId },
      departments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployeeDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.employeeId)
      return res.status(400).json({ message: "No employee record linked" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceToday = await Attendance.findOne({
      employee: user.employeeId,
      date: today,
    });

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const year = today.getFullYear();
    const LeaveBalance = require("../models/LeaveBalance");
    const [
      weekAttendance,
      monthlyAttendance,
      balances,
      finalizedRuns,
      announcements,
    ] = await Promise.all([
      Attendance.find({
        employee: user.employeeId,
        date: { $gte: startOfWeek, $lte: today },
      }),
      Attendance.find({
        employee: user.employeeId,
        date: { $gte: startOfMonth(today), $lte: today },
      }),
      LeaveBalance.find({ employee: user.employeeId, year }).populate(
        "leaveType",
      ),
      PayrollRun.find({
        status: "finalized",
        "items.employee": user.employeeId,
      })
        .sort({ year: -1, month: -1 })
        .limit(1),
      Announcement.find({
        isActive: true,
        targetRoles: { $in: ["employee"] },
      })
        .sort({ createdAt: -1 })
        .limit(3),
    ]);
    const metrics = buildEmployeeDashboardMetrics({
      employeeId: user.employeeId,
      weeklyAttendance: weekAttendance,
      monthlyAttendance,
      finalizedRuns,
    });

    res.json({
      attendanceToday,
      hoursThisWeek: metrics.hoursThisWeek,
      lateCountThisMonth: metrics.lateCountThisMonth,
      lastPayslip: metrics.lastPayslip,
      leaveBalances: balances,
      announcements,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
