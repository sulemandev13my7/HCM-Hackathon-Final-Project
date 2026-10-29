const PayrollRun = require("../models/PayrollRun");
const SalaryStructure = require("../models/SalaryStructure");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const CompanySettings = require("../models/CompanySettings");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Holiday = require("../models/Holiday");
const {
  calculateWorkingDays,
  calculateEmploymentWorkingDays,
  calculatePresentDays,
  calculatePayrollAttendance,
  calculatePayrollAmounts,
  parsePayrollPeriod,
} = require("../utils/payrollCalculations");
const { createPayslipPdf } = require("../utils/payslipPdf");
const { buildPayslipNotifications } = require("../utils/payslipNotifications");

exports.getMyPayslips = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.employeeId)
      return res.status(400).json({ message: "No employee record linked" });

    const runs = await PayrollRun.find({ status: "finalized" }).sort({
      year: -1,
      month: -1,
    });
    const payslips = [];

    for (let run of runs) {
      const item = run.items.find(
        (i) => i.employee.toString() === user.employeeId.toString(),
      );
      if (item) {
        payslips.push({
          runId: run._id,
          month: run.month,
          year: run.year,
          netPay: item.netPay,
          gross: item.gross,
        });
      }
    }

    res.json(payslips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPayrollRun = async (req, res) => {
  try {
    const period = parsePayrollPeriod(req.body?.month, req.body?.year);
    if (!period) {
      return res.status(422).json({
        message: "Month must be 1-12 and year must be between 1900 and 9999",
      });
    }
    const { month, year } = period;

    const existing = await PayrollRun.findOne({ month, year });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Payroll run already exists for this month" });
    }

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));
    const [settings, holidays] = await Promise.all([
      CompanySettings.findOne(),
      Holiday.find({
        isActive: true,
        date: { $gte: monthStart, $lt: nextMonthStart },
      }),
    ]);
    const holidayDates = holidays.map((holiday) =>
      holiday.date.toISOString().slice(0, 10),
    );
    const workingDays = calculateWorkingDays(
      year,
      month,
      holidayDates,
      settings?.weekendDays || [0, 6],
    );

    const employees = await Employee.find({
      $or: [
        { status: { $in: ["active", "probation"] } },
        { terminationDate: { $gte: monthStart, $lt: nextMonthStart } },
      ],
    });
    const employeeIds = employees.map((employee) => employee._id);

    const [salaries, attendanceRecords, leaveRequests] = await Promise.all([
      SalaryStructure.find({
        employee: { $in: employeeIds },
        isActive: true,
      }).lean(),
      Attendance.find({
        employee: { $in: employeeIds },
        date: { $gte: monthStart, $lt: nextMonthStart },
      }).lean(),
      LeaveRequest.find({
        employee: { $in: employeeIds },
        status: "approved",
        startDate: { $lt: nextMonthStart },
        endDate: { $gte: monthStart },
      })
        .populate("leaveType")
        .lean(),
    ]);

    const salaryByEmployee = new Map();
    salaries.forEach((salary) => {
      if (!salaryByEmployee.has(String(salary.employee))) {
        salaryByEmployee.set(String(salary.employee), salary);
      }
    });
    const attendanceByEmployee = new Map();
    attendanceRecords.forEach((record) => {
      const key = String(record.employee);
      if (!attendanceByEmployee.has(key)) attendanceByEmployee.set(key, []);
      attendanceByEmployee.get(key).push(record);
    });
    const leavesByEmployee = new Map();
    leaveRequests.forEach((leave) => {
      const key = String(leave.employee);
      if (!leavesByEmployee.has(key)) leavesByEmployee.set(key, []);
      leavesByEmployee.get(key).push(leave);
    });

    const items = [];

    for (let emp of employees) {
      const employeeKey = String(emp._id);
      const salary = salaryByEmployee.get(employeeKey);
      if (!salary) continue;

      const employmentWorkingDays = calculateEmploymentWorkingDays(
        year,
        month,
        emp.joinDate,
        emp.terminationDate,
        holidayDates,
        settings?.weekendDays || [0, 6],
      );
      if (employmentWorkingDays === 0) continue;

      const attendance = attendanceByEmployee.get(employeeKey) || [];
      const approvedLeaves = leavesByEmployee.get(employeeKey) || [];
      const { absentDays, unpaidLeaveDays, halfDays, lateCount } =
        calculatePayrollAttendance({
          year,
          month,
          attendance,
          approvedLeaves,
          holidayDates,
          weekendDays: settings?.weekendDays || [0, 6],
          employmentStartDate: emp.joinDate,
          employmentEndDate: emp.terminationDate,
        });

      const fullMonthGross = salary.gross || salary.basic * 1.5;
      const amounts = calculatePayrollAmounts({
        fullMonthGross,
        workingDays,
        employmentWorkingDays,
        absentDays,
        unpaidLeaveDays,
        halfDays,
        lateCount,
      });

      items.push({
        employee: emp._id,
        basic: salary.basic,
        gross: amounts.gross,
        employmentWorkingDays,
        absentDays,
        unpaidLeaveDays,
        halfDays,
        lateCount,
        latePenaltyDays: amounts.latePenaltyDays,
        deductions: amounts.deductions,
        tax: amounts.tax,
        netPay: amounts.netPay,
        presentDays: calculatePresentDays(
          employmentWorkingDays,
          absentDays,
          unpaidLeaveDays,
          halfDays,
        ),
      });
    }

    const totalGross = items.reduce((sum, i) => sum + i.gross, 0);
    const totalNet = items.reduce((sum, i) => sum + i.netPay, 0);

    const payrollRun = await PayrollRun.create({
      month,
      year,
      workingDays,
      items,
      totalGross,
      totalNet,
      createdBy: req.user.id,
      status: "draft",
    });

    await payrollRun.populate("items.employee createdBy");
    res.status(201).json(payrollRun);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPayrollRuns = async (req, res) => {
  try {
    const runs = await PayrollRun.find()
      .populate("createdBy finalizedBy")
      .sort({ year: -1, month: -1 });
    res.json(runs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPayrollRun = async (req, res) => {
  try {
    const run = await PayrollRun.findById(req.params.id).populate(
      "items.employee createdBy finalizedBy",
    );
    if (!run) return res.status(404).json({ message: "Payroll run not found" });
    res.json(run);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.finalizePayroll = async (req, res) => {
  try {
    const run = await PayrollRun.findById(req.params.id);
    if (!run) return res.status(404).json({ message: "Payroll run not found" });
    if (run.status === "finalized")
      return res.status(400).json({ message: "Already finalized" });

    run.status = "finalized";
    run.finalizedBy = req.user.id;
    run.finalizedAt = new Date();
    await run.save();

    const users = await User.find(
      { employeeId: { $in: run.items.map((item) => item.employee) } },
      "_id employeeId",
    );
    const notifications = buildPayslipNotifications(run, users, run.items);
    if (notifications.length) await Notification.insertMany(notifications);

    res.json({ message: "Payroll finalized", run });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPayslip = async (req, res) => {
  try {
    const run = await PayrollRun.findById(req.params.runId).populate(
      "items.employee",
    );
    if (!run) return res.status(404).json({ message: "Payroll run not found" });
    if (run.status !== "finalized")
      return res.status(400).json({ message: "Payroll not finalized" });

    const user = await User.findById(req.user.id);
    let item;

    if (req.user.role === "employee") {
      item = run.items.find(
        (i) => i.employee._id.toString() === user.employeeId.toString(),
      );
    } else {
      item = run.items.find(
        (i) => i.employee._id.toString() === req.params.employeeId,
      );
    }

    if (!item) return res.status(404).json({ message: "Payslip not found" });

    res.json({
      run: { month: run.month, year: run.year },
      employee: item.employee,
      earnings: { basic: item.basic, gross: item.gross },
      deductions: {
        absent: item.absentDays || 0,
        unpaidLeave: item.unpaidLeaveDays || 0,
        halfDays: item.halfDays || 0,
        tax: item.tax || 0,
        total: item.deductions || 0,
      },
      netPay: item.netPay,
      workingDays: run.workingDays,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPayslipPdf = async (req, res) => {
  try {
    const run = await PayrollRun.findById(req.params.runId).populate(
      "items.employee",
    );
    if (!run) return res.status(404).json({ message: "Payroll run not found" });
    if (run.status !== "finalized")
      return res.status(400).json({ message: "Payroll not finalized" });

    const user = await User.findById(req.user.id);
    if (req.user.role === "employee" && !user?.employeeId) {
      return res.status(400).json({ message: "No employee record linked" });
    }
    const employeeId =
      req.user.role === "employee"
        ? user.employeeId.toString()
        : req.params.employeeId;
    const item = run.items.find(
      (entry) => entry.employee._id.toString() === employeeId,
    );
    if (!item) return res.status(404).json({ message: "Payslip not found" });

    const pdf = await createPayslipPdf(run, item.employee, item);
    res
      .type("application/pdf")
      .attachment(`payslip_${run.year}_${run.month}.pdf`)
      .send(pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
