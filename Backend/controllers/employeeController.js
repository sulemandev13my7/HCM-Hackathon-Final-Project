const Employee = require("../models/Employee");
const User = require("../models/User");
const SalaryStructure = require("../models/SalaryStructure");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveType = require("../models/LeaveType");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const { generateTemporaryPassword } = require("../utils/temporaryPassword");
const { calculateSalaryComponents } = require("../utils/salaryCalculations");
const { generateEmployeeId } = require("../utils/employeeId");
const { parsePagination } = require("../utils/pagination");
const { runInTransaction } = require("../utils/transactions");
const { escapeCsvValue } = require("../utils/csv");
const {
  PASSWORD_REQUIREMENT,
  isValidNewPassword,
} = require("../utils/passwordPolicy");

exports.getAllEmployees = async (req, res) => {
  try {
    const { search, department, status } = req.query;
    const { page, limit } = parsePagination(req.query.page, req.query.limit, {
      defaultLimit: 200,
      maxLimit: 500,
    });
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }
    if (department) query.department = department;
    if (status) query.status = status;

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate("department")
        .populate("designation")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Employee.countDocuments(query),
    ]);

    res.json({
      employees,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("department")
      .populate("designation");
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployee360 = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("department")
      .populate("designation");
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const [salaryHistory, attendance, leaveRequests, user] = await Promise.all([
      SalaryStructure.find({ employee: employee._id }).sort({
        effectiveDate: -1,
      }),
      Attendance.find({ employee: employee._id }).sort({ date: -1 }).limit(10),
      LeaveRequest.find({ employee: employee._id })
        .populate("leaveType", "name")
        .sort({ createdAt: -1 })
        .limit(10),
      User.findOne({ employeeId: employee._id }),
    ]);
    const salary = salaryHistory.find((entry) => entry.isActive) || null;

    res.json({
      employee,
      salary,
      salaryHistory,
      attendance,
      leaveRequests,
      user: user ? { email: user.email, isActive: user.isActive } : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEmployeeSalary = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    let components;
    try {
      components = calculateSalaryComponents(req.body.basic);
    } catch (error) {
      return res.status(422).json({ message: error.message });
    }

    const currentSalary = await SalaryStructure.findOne({
      employee: employee._id,
      isActive: true,
    });
    const effectiveDate = req.body.effectiveDate
      ? new Date(`${req.body.effectiveDate}T00:00:00.000Z`)
      : new Date();
    if (Number.isNaN(effectiveDate.getTime())) {
      return res.status(422).json({ message: "Invalid effective date" });
    }

    if (
      currentSalary &&
      effectiveDate.toISOString().slice(0, 10) <
        currentSalary.effectiveDate.toISOString().slice(0, 10)
    ) {
      return res.status(422).json({
        message: "Effective date must be later than the current salary record",
      });
    }

    const salary = await SalaryStructure.create({
      employee: employee._id,
      ...components,
      effectiveDate,
      isActive: true,
    });
    if (currentSalary) {
      currentSalary.isActive = false;
      await currentSalary.save();
    }
    res.status(currentSalary ? 200 : 201).json(salary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { email, password, basicSalary, ...empData } = req.body;

    if (password && !isValidNewPassword(password)) {
      return res.status(400).json({ message: PASSWORD_REQUIREMENT });
    }

    const existingEmp = await Employee.findOne({ email });
    if (existingEmp) {
      return res
        .status(400)
        .json({ message: "Employee with this email already exists" });
    }

    const tempPassword = password || generateTemporaryPassword();
    const employee = await runInTransaction(async (session) => {
      const employeeId = await generateEmployeeId(session);
      const employeeData = { ...empData, email, employeeId };
      if (!employeeData.department) delete employeeData.department;
      if (!employeeData.designation) delete employeeData.designation;

      const created = await Employee.create(employeeData, { session });
      await User.create(
        [
          {
            email,
            password: tempPassword,
            role: "employee",
            employeeId: created._id,
            firstName: empData.firstName,
            lastName: empData.lastName,
            mustChangePassword: true,
          },
        ],
        { session },
      );

      if (basicSalary) {
        const basic = Number(basicSalary);
        const hra = basic * 0.4;
        const medicalAllowance = basic * 0.1;
        const gross = basic * 1.5;
        await SalaryStructure.create(
          [
            {
              employee: created._id,
              basic,
              hra,
              medicalAllowance,
              gross,
              isActive: true,
            },
          ],
          { session },
        );
      }

      const leaveTypes = await LeaveType.find({ isActive: true }).session(
        session,
      );
      const year = new Date().getFullYear();
      if (leaveTypes.length) {
        await LeaveBalance.insertMany(
          leaveTypes.map((leaveType) => ({
            employee: created._id,
            year,
            leaveType: leaveType._id,
            quota: leaveType.quota,
            used: 0,
            remaining: leaveType.quota,
          })),
          { session },
        );
      }

      return created;
    });

    await employee.populate("department designation");
    res.status(201).json({
      employee,
      tempPassword,
      message: "Employee created successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.department === "") updates.department = null;
    if (updates.designation === "") updates.designation = null;
    const employee = await Employee.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    })
      .populate("department")
      .populate("designation");
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("department")
      .populate("designation");
    const header =
      "EmployeeID,FirstName,LastName,Email,Phone,Department,Designation,JoinDate,Status";
    const rows = employees.map((emp) =>
      [
        emp.employeeId,
        emp.firstName,
        emp.lastName,
        emp.email,
        emp.phone || "",
        emp.department?.name || "",
        emp.designation?.title || "",
        emp.joinDate ? emp.joinDate.toISOString().split("T")[0] : "",
        emp.status,
      ]
        .map(escapeCsvValue)
        .join(","),
    );
    res.header("Content-Type", "text/csv");
    res.attachment("employees.csv");
    res.send([header, ...rows].join("\n") + "\n");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.employeeId)
      return res.status(400).json({ message: "No employee record linked" });

    const employee = await Employee.findByIdAndUpdate(
      user.employeeId,
      { phone: req.body.phone, address: req.body.address },
      { new: true },
    ).populate("department designation");

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMeEmployee = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.employeeId)
      return res.status(400).json({ message: "No employee record linked" });

    const employee = await Employee.findById(user.employeeId).populate(
      "department designation",
    );
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
