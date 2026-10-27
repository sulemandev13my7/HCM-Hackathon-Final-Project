const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { buildAIEndpoint } = require("../utils/aiEndpoint");
const aiService = require("../ai/aiService");
const Department = require("../models/Department");
const Employee = require("../models/Employee");
const {
  calculateWorkingDays,
  calculatePresentDays,
  isLateAttendance,
  getMissingSalaryEmployees,
  calculatePayrollAttendance,
  calculateEmploymentWorkingDays,
  calculatePayrollAmounts,
  calculateAnnualTax,
  parsePayrollPeriod,
} = require("../utils/payrollCalculations");
const {
  startOfUTCDay,
  toUTCDateOnly,
  endOfUTCDayExclusive,
  getUTCMonthRange,
  isValidDateRange,
} = require("../utils/dateTime");
const { buildErrorResponse } = require("../utils/errorResponse");
const { generateTemporaryPassword } = require("../utils/temporaryPassword");
const {
  createPasswordResetToken,
  hashPasswordResetToken,
  isValidPasswordResetToken,
  PASSWORD_RESET_TTL_MS,
} = require("../utils/passwordReset");
const {
  canUseAITool,
  filterAIToolsForRole,
} = require("../ai/aiToolPermissions");
const leaveController = require("../controllers/leaveController");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");
const { createPayslipPdf } = require("../utils/payslipPdf");
const {
  buildEmployeeDashboardMetrics,
} = require("../utils/dashboardCalculations");
const { buildDashboardAnalytics } = require("../utils/dashboardAnalytics");
const {
  validateEmployeeImportRow,
} = require("../utils/employeeImportValidation");
const { sanitizeAuditData } = require("../utils/auditSerialization");
const { buildPayslipNotifications } = require("../utils/payslipNotifications");
const { calculateSalaryComponents } = require("../utils/salaryCalculations");
const { canDeactivateUser } = require("../utils/userAccess");
const {
  isValidCorrectionRequest,
} = require("../utils/attendanceCorrectionValidation");
const payrollRouter = require("../routes/payroll");
const PayrollRun = require("../models/PayrollRun");
const payrollController = require("../controllers/payrollController");
const {
  distanceInMeters,
  validateCameraLocation,
} = require("../utils/attendanceLocation");
const { ensureEmployeeProfile } = require("../utils/employeeProfile");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveType = require("../models/LeaveType");

test("buildAIEndpoint appends the OpenRouter chat completions path", () => {
  assert.equal(
    buildAIEndpoint("https://openrouter.ai/api/v1"),
    "https://openrouter.ai/api/v1/chat/completions",
  );
});

test("buildAIEndpoint does not duplicate an existing chat completions path", () => {
  assert.equal(
    buildAIEndpoint("https://openrouter.ai/api/v1/chat/completions/"),
    "https://openrouter.ai/api/v1/chat/completions",
  );
});

test("calculateWorkingDays excludes weekends and supplied holidays", () => {
  assert.equal(calculateWorkingDays(2025, 1, ["2025-01-01", "2025-01-31"]), 21);
});

test("calculateWorkingDays uses the configured weekend days", () => {
  assert.equal(calculateWorkingDays(2025, 1, [], [5, 6]), 22);
});

test("calculatePresentDays deducts half of each half day", () => {
  assert.equal(calculatePresentDays(22, 1, 2, 1), 18.5);
});

test("production error responses omit internal error details", () => {
  assert.deepEqual(
    buildErrorResponse(new Error("database credentials"), "production"),
    { message: "Internal server error" },
  );
});

test("development error responses include diagnostic details", () => {
  assert.deepEqual(
    buildErrorResponse(new Error("database unavailable"), "development"),
    {
      message: "Something went wrong!",
      error: "database unavailable",
    },
  );
});

test("employees can use only self-scoped AI tools", () => {
  assert.equal(canUseAITool("employee", "get_attendance_summary"), true);
  assert.equal(canUseAITool("employee", "get_my_leave_balance"), true);
  assert.equal(canUseAITool("employee", "get_headcount"), false);
  assert.equal(canUseAITool("employee", "search_employees"), false);
  assert.equal(canUseAITool("employee", "get_payroll_summary"), false);
  assert.deepEqual(
    filterAIToolsForRole("employee", [
      { function: { name: "get_attendance_summary" } },
      { function: { name: "get_headcount" } },
    ]).map((tool) => tool.function.name),
    ["get_attendance_summary"],
  );
});

test("HR and admins can use supported company AI tools", () => {
  assert.equal(canUseAITool("admin", "search_employees"), true);
  assert.equal(canUseAITool("hr", "get_headcount"), true);
  assert.equal(canUseAITool("guest", "get_headcount"), false);
});

test("AI headcount resolves a department name before counting employees", async () => {
  const originalFindOne = Department.findOne;
  const originalCountDocuments = Employee.countDocuments;
  let countQuery;

  Department.findOne = async (query) => {
    assert.equal(
      new RegExp(query.name.$regex, query.name.$options).test(
        "Demo Engineering",
      ),
      true,
    );
    assert.equal(query.name.$options, "i");
    return { _id: "department-1" };
  };
  Employee.countDocuments = async (query) => {
    countQuery = query;
    return 1;
  };

  try {
    const result = await aiService.executeTool(
      "get_headcount",
      { departmentName: "Demo Engineering" },
      { role: "hr" },
    );

    assert.deepEqual(result, { count: 1, scope: "hr" });
    assert.deepEqual(countQuery, {
      status: { $in: ["active", "probation"] },
      department: "department-1",
    });
  } finally {
    Department.findOne = originalFindOne;
    Employee.countDocuments = originalCountDocuments;
  }
});

test("AI headcount does not return company-wide totals for unknown departments", async () => {
  const originalFindOne = Department.findOne;
  const originalCountDocuments = Employee.countDocuments;
  let countCalled = false;

  Department.findOne = async () => null;
  Employee.countDocuments = async () => {
    countCalled = true;
    return 1;
  };

  try {
    const result = await aiService.executeTool(
      "get_headcount",
      { departmentName: "Unknown" },
      { role: "hr" },
    );

    assert.deepEqual(result, { error: "Department not found" });
    assert.equal(countCalled, false);
  } finally {
    Department.findOne = originalFindOne;
    Employee.countDocuments = originalCountDocuments;
  }
});

test("Admin can deactivate HR and employee accounts but not Admin accounts or self", () => {
  assert.equal(canDeactivateUser("admin-1", "admin-1", "admin"), false);
  assert.equal(canDeactivateUser("admin-1", "admin-2", "admin"), false);
  assert.equal(canDeactivateUser("admin-1", "hr-1", "hr"), true);
  assert.equal(canDeactivateUser("admin-1", "employee-1", "employee"), true);
});

test("temporary passwords use 192 bits of hexadecimal randomness", () => {
  const password = generateTemporaryPassword();
  assert.match(password, /^[A-Fa-f0-9]{48}$/);
});

test("password reset tokens are random, hashed, and expire after 30 minutes", () => {
  const first = createPasswordResetToken();
  const second = createPasswordResetToken();

  assert.match(first.token, /^[a-f0-9]{64}$/);
  assert.notEqual(first.token, second.token);
  assert.equal(first.tokenHash, hashPasswordResetToken(first.token));
  assert.equal(isValidPasswordResetToken(first.token), true);
  assert.equal(isValidPasswordResetToken("short-token"), false);
  assert.equal(isValidPasswordResetToken(undefined), false);
  assert.ok(first.expiresAt.getTime() >= Date.now() + PASSWORD_RESET_TTL_MS - 1000);
});

test("a valid reset token atomically sets a new password and is consumed", async (t) => {
  const { token } = createPasswordResetToken();
  let query;
  let update;
  t.mock.method(User, "findOneAndUpdate", (filter, changes) => {
    query = filter;
    update = changes;
    return { _id: "user-1" };
  });
  const response = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  await authController.resetPasswordWithToken(
    { body: { token, newPassword: "NewPassword!123" } },
    response,
  );

  assert.equal(response.statusCode, undefined);
  assert.match(response.body.message, /reset successfully/i);
  assert.equal(query.passwordResetTokenHash, hashPasswordResetToken(token));
  assert.ok(query.passwordResetExpiresAt.$gt instanceof Date);
  assert.equal(query.isActive, true);
  assert.notEqual(update.$set.password, "NewPassword!123");
  assert.match(update.$set.password, /^\$2[aby]\$/);
  assert.equal(update.$set.mustChangePassword, false);
  assert.equal(update.$set.passwordResetTokenHash, null);
  assert.equal(update.$set.passwordResetExpiresAt, null);
});

test("malformed reset tokens are rejected without a database lookup", async (t) => {
  const findOne = t.mock.method(User, "findOne", async () => null);
  const response = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  await authController.resetPasswordWithToken(
    { body: { token: "bad-token", newPassword: "NewPassword!123" } },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /invalid or has expired/i);
  assert.equal(findOne.mock.callCount(), 0);
});

test("HR account creation rejects weak passwords before database access", async (t) => {
  const findOne = t.mock.method(User, "findOne", async () => null);
  const response = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  await userController.createHR(
    {
      body: {
        email: "HR@Example.com",
        password: "short",
        firstName: "New",
        lastName: "HR",
      },
    },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /at least 8/);
  assert.equal(findOne.mock.callCount(), 0);
});

test("UTC date-only parsing is independent of the server timezone", () => {
  assert.equal(
    toUTCDateOnly("2025-01-31").toISOString(),
    "2025-01-31T00:00:00.000Z",
  );
  assert.equal(
    startOfUTCDay("2025-01-01T23:30:00-08:00").toISOString(),
    "2025-01-02T00:00:00.000Z",
  );
});

test("UTC payroll month range ends at the next month's start", () => {
  const range = getUTCMonthRange(2025, 1);
  assert.equal(range.start.toISOString(), "2025-01-01T00:00:00.000Z");
  assert.equal(range.endExclusive.toISOString(), "2025-02-01T00:00:00.000Z");
});

test("UTC end-of-day boundaries are exclusive at the next midnight", () => {
  assert.equal(
    endOfUTCDayExclusive("2025-01-31").toISOString(),
    "2025-02-01T00:00:00.000Z",
  );
});

test("leave date ranges require valid ISO dates in chronological order", () => {
  assert.equal(isValidDateRange("2025-04-01", "2025-04-02"), true);
  assert.equal(isValidDateRange("2025-04-02", "2025-04-01"), false);
  assert.equal(isValidDateRange("2025-02-30", "2025-03-01"), false);
  assert.equal(isValidDateRange("not-a-date", "2025-04-01"), false);
});

test("late attendance remains countable after its status becomes half-day", () => {
  assert.equal(isLateAttendance({ status: "half_day", isLate: true }), true);
  assert.equal(isLateAttendance({ status: "late", isLate: false }), true);
  assert.equal(isLateAttendance({ status: "half_day", isLate: false }), false);
});

test("payroll identifies active employees without salary structures", () => {
  const employees = [
    {
      _id: "employee-1",
      employeeId: "EMP001",
      firstName: "A",
      lastName: "One",
    },
    {
      _id: "employee-2",
      employeeId: "EMP002",
      firstName: "B",
      lastName: "Two",
    },
  ];
  const salaryStructures = [{ employee: "employee-1" }];

  assert.deepEqual(getMissingSalaryEmployees(employees, salaryStructures), [
    { id: "employee-2", employeeId: "EMP002", name: "B Two" },
  ]);
});

test("payroll counts unrecorded working days as absent but excludes approved leave", () => {
  assert.deepEqual(
    calculatePayrollAttendance({
      year: 2025,
      month: 4,
      attendance: [{ date: "2025-04-01", status: "present" }],
      approvedLeaves: [
        {
          startDate: "2025-04-02",
          endDate: "2025-04-02",
          leaveType: { name: "Annual" },
        },
      ],
    }),
    { absentDays: 20, unpaidLeaveDays: 0, halfDays: 0, lateCount: 0 },
  );
});

test("payroll counts only in-month working days from overlapping unpaid leave", () => {
  assert.deepEqual(
    calculatePayrollAttendance({
      year: 2025,
      month: 4,
      attendance: [],
      approvedLeaves: [
        {
          startDate: "2025-03-31",
          endDate: "2025-04-04",
          leaveType: { name: "Unpaid" },
        },
      ],
      holidayDates: ["2025-04-03"],
    }),
    { absentDays: 18, unpaidLeaveDays: 3, halfDays: 0, lateCount: 0 },
  );
});

test("payroll prorates employment days for mid-month joiners and leavers", () => {
  assert.equal(
    calculateEmploymentWorkingDays(2025, 4, "2025-04-02", "2025-04-04", [
      "2025-04-03",
    ]),
    2,
  );
});

test("payroll calculates full absence deductions and monthly tax from annual gross", () => {
  assert.deepEqual(
    calculatePayrollAmounts({
      fullMonthGross: 180000,
      workingDays: 22,
      employmentWorkingDays: 22,
      absentDays: 22,
      unpaidLeaveDays: 0,
      halfDays: 0,
      lateCount: 0,
    }),
    {
      gross: 180000,
      deductions: 180000,
      tax: 14500,
      netPay: -14500,
      latePenaltyDays: 0,
    },
  );
  assert.equal(calculateAnnualTax(2160000), 174000);
});

test("payroll prorates gross and tax and includes unpaid, half-day, and late deductions", () => {
  assert.deepEqual(
    calculatePayrollAmounts({
      fullMonthGross: 180000,
      workingDays: 22,
      employmentWorkingDays: 11,
      absentDays: 0,
      unpaidLeaveDays: 1,
      halfDays: 1,
      lateCount: 3,
    }),
    {
      gross: 90000,
      deductions: 16364,
      tax: 7250,
      netPay: 66386,
      latePenaltyDays: 0.5,
    },
  );
});

test("payroll tax follows every annual gross slab", () => {
  assert.deepEqual(
    [600000, 900000, 1200000, 1800000, 2400000, 3000000, 3600000, 4200000].map(
      calculateAnnualTax,
    ),
    [0, 15000, 30000, 120000, 210000, 360000, 510000, 720000],
  );
});

test("payroll periods accept numeric form values and reject invalid months or years", () => {
  assert.deepEqual(parsePayrollPeriod("10", "2026"), {
    month: 10,
    year: 2026,
  });
  for (const period of [
    { month: 0, year: 2026 },
    { month: 13, year: 2026 },
    { month: 1.5, year: 2026 },
    { month: 1, year: 1899 },
    { month: "invalid", year: 2026 },
  ]) {
    assert.equal(parsePayrollPeriod(period.month, period.year), null);
  }
});

test("payroll creation returns 422 before database access for an invalid period", async () => {
  const response = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  await payrollController.createPayrollRun(
    { body: { month: "13", year: "2026" }, user: { id: "hr-1" } },
    response,
  );

  assert.equal(response.statusCode, 422);
  assert.match(response.body.message, /Month must be 1-12/);
});

test("finalized payroll runs cannot be finalized again", async () => {
  const originalFindById = PayrollRun.findById;
  const run = {
    status: "finalized",
    save: async function () {
      this.saved = true;
    },
  };
  const response = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  PayrollRun.findById = async () => run;

  try {
    await payrollController.finalizePayroll(
      { params: { id: "run-1" }, user: { id: "admin-1" } },
      response,
    );
    assert.equal(response.statusCode, 400);
    assert.equal(run.saved, undefined);
  } finally {
    PayrollRun.findById = originalFindById;
  }
});

test("payslip JSON routes reject unauthenticated requests", async () => {
  const app = express();
  app.use("/payroll", payrollRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  try {
    const { port } = server.address();
    for (const path of [
      "/payroll/000000000000000000000001/payslip",
      "/payroll/000000000000000000000001/payslip/000000000000000000000002",
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`);
      assert.equal(response.status, 401);
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("employee payslip lookup ignores another employee ID and returns only self data", async () => {
  const originalFindById = PayrollRun.findById;
  const originalUserFindById = User.findById;
  const run = {
    status: "finalized",
    month: 10,
    year: 2026,
    workingDays: 22,
    items: [
      { employee: { _id: "employee-own" }, netPay: 1000 },
      { employee: { _id: "employee-other" }, netPay: 9000 },
    ],
  };
  PayrollRun.findById = () => ({ populate: async () => run });
  User.findById = async () => ({ employeeId: "employee-own" });
  const response = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  try {
    await payrollController.getPayslip(
      {
        user: { id: "user-own", role: "employee" },
        params: { runId: "run-1", employeeId: "employee-other" },
      },
      response,
    );
    assert.equal(response.statusCode, undefined);
    assert.equal(response.body.employee._id, "employee-own");
    assert.equal(response.body.netPay, 1000);
  } finally {
    PayrollRun.findById = originalFindById;
    User.findById = originalUserFindById;
  }
});

test("employee dashboard metrics stay scoped to the employee's own records", () => {
  assert.deepEqual(
    buildEmployeeDashboardMetrics({
      employeeId: "employee-1",
      weeklyAttendance: [{ hoursWorked: 8 }, { hoursWorked: 7.5 }],
      monthlyAttendance: [
        { status: "late", isLate: false },
        { status: "half_day", isLate: true },
        { status: "present", isLate: false },
      ],
      finalizedRuns: [
        {
          _id: "run-newer",
          month: 5,
          year: 2025,
          status: "finalized",
          items: [
            {
              employee: "employee-1",
              gross: 150000,
              netPay: 120000,
            },
          ],
        },
        {
          _id: "run-older",
          month: 4,
          year: 2025,
          status: "finalized",
          items: [
            {
              employee: "employee-1",
              gross: 140000,
              netPay: 110000,
            },
          ],
        },
      ],
    }),
    {
      hoursThisWeek: 15.5,
      lateCountThisMonth: 2,
      lastPayslip: {
        runId: "run-newer",
        month: 5,
        year: 2025,
        gross: 150000,
        netPay: 120000,
      },
    },
  );
});

test("dashboard analytics apply working-day, leave, and department filters consistently", () => {
  const metrics = buildDashboardAnalytics({
    startDate: "2025-04-01",
    endDate: "2025-04-03",
    weekendDays: [0, 6],
    holidayDates: [],
    employees: [
      {
        _id: "employee-1",
        firstName: "Alex",
        lastName: "One",
        department: { _id: "dept-1", name: "Engineering" },
        gender: "other",
        joinDate: "2025-04-01",
        status: "active",
      },
      {
        _id: "employee-2",
        firstName: "Sam",
        lastName: "Two",
        department: { _id: "dept-2", name: "Sales" },
        gender: "female",
        joinDate: "2025-04-01",
        status: "active",
      },
    ],
    attendance: [
      { employee: "employee-1", date: "2025-04-01", status: "present" },
      { employee: "employee-1", date: "2025-04-02", status: "late" },
      { employee: "employee-2", date: "2025-04-02", status: "absent" },
    ],
    leaves: [
      {
        employee: "employee-2",
        startDate: "2025-04-03",
        endDate: "2025-04-03",
        workingDays: 1,
        status: "approved",
        leaveType: { _id: "leave-1", name: "Annual" },
      },
    ],
    salaryStructures: [
      { employee: "employee-1", gross: 120 },
      { employee: "employee-2", gross: 240 },
    ],
    payrollRuns: [
      {
        month: 4,
        year: 2025,
        status: "finalized",
        items: [
          { employee: "employee-1", gross: 100, netPay: 90 },
          { employee: "employee-2", gross: 200, netPay: 180 },
        ],
      },
    ],
    leaveBalances: [
      { leaveType: { name: "Annual" }, used: 2, quota: 14 },
      { leaveType: { name: "Sick" }, used: 1, quota: 8 },
    ],
  });

  assert.equal(metrics.kpis.totalEmployees, 2);
  assert.equal(metrics.kpis.attendanceRate, 40);
  assert.equal(metrics.kpis.payrollCost, 300);
  assert.equal(metrics.kpis.averageSalary, 180);
  assert.equal(metrics.absenteeismByDepartment.length, 2);
  assert.deepEqual(metrics.leaveByType, [{ name: "Annual", approvedDays: 1 }]);
  assert.deepEqual(metrics.leaveUtilization, [
    { name: "Annual", used: 2, quota: 14, utilizationRate: 14.3 },
    { name: "Sick", used: 1, quota: 8, utilizationRate: 12.5 },
  ]);
});

test("salary updates derive HRA, medical allowance, and gross from basic pay", () => {
  assert.deepEqual(calculateSalaryComponents(100000), {
    basic: 100000,
    hra: 40000,
    medicalAllowance: 10000,
    otherAllowances: 0,
    gross: 150000,
  });
  assert.throws(() => calculateSalaryComponents(0), /greater than zero/);
  assert.throws(() => calculateSalaryComponents("invalid"), /valid number/);
});

test("employee import accepts valid rows and rejects duplicate codes and invalid fields", () => {
  const validationOptions = {
    departmentNames: new Set(["engineering"]),
    designationTitles: new Set(["developer"]),
    existingEmails: new Set(["existing@example.com"]),
    existingEmployeeIds: new Set(["emp00001"]),
    seenEmails: new Set(),
    seenEmployeeIds: new Set(),
  };

  assert.deepEqual(
    validateEmployeeImportRow(
      {
        firstName: "Alex",
        lastName: "Employee",
        email: "alex@example.com",
        employeeId: "EMP00002",
        joinDate: "2025-04-01",
        department: "Engineering",
        designation: "Developer",
        basicSalary: "100000",
      },
      2,
      validationOptions,
    ),
    [],
  );

  const errors = validateEmployeeImportRow(
    {
      firstName: "Sam",
      lastName: "Employee",
      email: "existing@example.com",
      employeeId: "EMP00001",
      joinDate: "2025-02-30",
      department: "Unknown",
      designation: "Unknown",
      basicSalary: "0",
    },
    3,
    validationOptions,
  );

  assert.deepEqual(
    errors.map((error) => error.field),
    [
      "email",
      "employeeId",
      "joinDate",
      "department",
      "designation",
      "basicSalary",
    ],
  );
});

test("audit snapshots redact credential fields at every nesting level", () => {
  assert.deepEqual(
    sanitizeAuditData({
      email: "person@example.com",
      passwordHash: "hashed",
      tempPassword: "temporary",
      nested: [{ accessToken: "token", displayName: "Person" }],
    }),
    {
      email: "person@example.com",
      nested: [{ displayName: "Person" }],
    },
  );
});

test("employees can cancel only their own pending leave requests", async () => {
  const originalUserFindById = User.findById;
  const originalLeaveFindById = LeaveRequest.findById;
  const leaveRequest = {
    employee: "employee-1",
    status: "pending",
    save: async function () {
      this.saved = true;
    },
  };
  const response = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  User.findById = async () => ({ employeeId: "employee-1" });
  LeaveRequest.findById = async () => leaveRequest;

  try {
    await leaveController.cancelLeave(
      { user: { id: "user-1" }, params: { id: "leave-1" } },
      response,
    );

    assert.equal(response.statusCode, undefined);
    assert.equal(leaveRequest.status, "cancelled");
    assert.equal(leaveRequest.saved, true);
  } finally {
    User.findById = originalUserFindById;
    LeaveRequest.findById = originalLeaveFindById;
  }
});

test("employees cannot cancel another employee's leave request", async () => {
  const originalUserFindById = User.findById;
  const originalLeaveFindById = LeaveRequest.findById;
  const leaveRequest = {
    employee: "employee-2",
    status: "pending",
  };
  const response = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  User.findById = async () => ({ employeeId: "employee-1" });
  LeaveRequest.findById = async () => leaveRequest;

  try {
    await leaveController.cancelLeave(
      { user: { id: "user-1" }, params: { id: "leave-2" } },
      response,
    );

    assert.equal(response.statusCode, 404);
    assert.equal(leaveRequest.status, "pending");
  } finally {
    User.findById = originalUserFindById;
    LeaveRequest.findById = originalLeaveFindById;
  }
});

test("employees cannot cancel approved leave requests", async () => {
  const originalUserFindById = User.findById;
  const originalLeaveFindById = LeaveRequest.findById;
  const leaveRequest = {
    employee: "employee-1",
    status: "approved",
  };
  const response = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  User.findById = async () => ({ employeeId: "employee-1" });
  LeaveRequest.findById = async () => leaveRequest;

  try {
    await leaveController.cancelLeave(
      { user: { id: "user-1" }, params: { id: "leave-3" } },
      response,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(leaveRequest.status, "approved");
  } finally {
    User.findById = originalUserFindById;
    LeaveRequest.findById = originalLeaveFindById;
  }
});

test("payroll finalization creates notifications only for employees with accounts", () => {
  assert.deepEqual(
    buildPayslipNotifications(
      { month: 4, year: 2025 },
      [
        { _id: "user-1", employeeId: "employee-1" },
        { _id: "user-2", employeeId: "employee-2" },
      ],
      [{ employee: "employee-1" }, { employee: "employee-3" }],
    ),
    [
      {
        user: "user-1",
        title: "Payslip available",
        message: "Your payslip for 4/2025 is available.",
        type: "success",
        link: "/employee/payroll",
      },
    ],
  );
});

test("attendance correction requests require valid date, reason, and at least one time", () => {
  assert.equal(
    isValidCorrectionRequest({
      date: "2025-04-01",
      checkIn: "2025-04-01T08:00:00.000Z",
      reason: "Forgot to check in",
    }),
    true,
  );
  assert.equal(
    isValidCorrectionRequest({
      date: "2025-02-30",
      checkIn: "invalid",
      reason: "",
    }),
    false,
  );
  assert.equal(
    isValidCorrectionRequest({ date: "2025-04-01", reason: "Correction" }),
    false,
  );
});

test("payslip PDF generation returns a valid PDF document", async () => {
  const pdf = await createPayslipPdf(
    { month: 4, year: 2025, workingDays: 22 },
    { firstName: "Alex", lastName: "Employee", employeeId: "EMP00001" },
    {
      basic: 100000,
      gross: 150000,
      absentDays: 1,
      unpaidLeaveDays: 2,
      halfDays: 1,
      deductions: 25000,
      tax: 5000,
      netPay: 120000,
    },
  );

  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
});

test("distanceInMeters measures nearby coordinates accurately", () => {
  const origin = { lat: 24.8607, lng: 67.0011 };
  const nearby = { lat: 24.8707, lng: 67.0011 };

  assert.equal(distanceInMeters(origin, origin), 0);
  const distance = distanceInMeters(origin, nearby);
  assert.ok(distance > 1100 && distance < 1125);
});

test("camera location validation enforces office radius, GPS accuracy, and configuration", () => {
  const settings = {
    officeLat: 24.8607,
    officeLng: 67.0011,
    officeRadius: 150,
  };

  const inside = validateCameraLocation({
    settings,
    location: { lat: 24.8611, lng: 67.0011, accuracy: 10 },
  });
  assert.equal(inside.location.lat, 24.8611);
  assert.ok(inside.distance <= 150);

  const outside = validateCameraLocation({
    settings,
    location: { lat: 24.8711, lng: 67.0011, accuracy: 10 },
  });
  assert.match(outside.error, /limited to 150m/);

  const inaccurate = validateCameraLocation({
    settings,
    location: { lat: 24.8611, lng: 67.0011, accuracy: 150 },
  });
  assert.match(inaccurate.error, /accuracy is too low/);

  const unconfigured = validateCameraLocation({
    settings: {},
    location: { lat: 24.8611, lng: 67.0011, accuracy: 10 },
  });
  assert.match(unconfigured.error, /not configured/);

  const missingLocation = validateCameraLocation({ settings });
  assert.match(missingLocation.error, /Location access is required/);
});

test("ensureEmployeeProfile reuses a linked employee and seeds missing leave balances", async (t) => {
  const employee = {
    _id: { toString: () => "employee-1" },
    email: "hr@example.com",
  };
  const savedUser = {
    _id: "user-1",
    email: "hr@example.com",
    employeeId: null,
    save: t.mock.fn(async () => {}),
  };
  t.mock.method(Employee, "findById", async () => employee);
  t.mock.method(LeaveType, "find", async () => [
    { _id: "leave-type-1", quota: 15 },
  ]);
  const updateBalance = t.mock.method(
    LeaveBalance,
    "updateOne",
    async () => ({ acknowledged: true }),
  );
  t.mock.method(User, "findById", async () => savedUser);

  const result = await ensureEmployeeProfile({
    _id: "user-1",
    email: "hr@example.com",
    employeeId: "employee-1",
  });

  assert.equal(result, employee);
  assert.equal(updateBalance.mock.callCount(), 1);
  const [filter, update, options] = updateBalance.mock.calls[0].arguments;
  assert.equal(filter.employee, employee._id);
  assert.equal(filter.leaveType, "leave-type-1");
  assert.equal(update.$setOnInsert.remaining, 15);
  assert.deepEqual(options, { upsert: true });
  assert.equal(savedUser.employeeId, employee._id);
  assert.equal(savedUser.save.mock.callCount(), 1);
});

test("ensureEmployeeProfile creates an employee record for a new HR user", async (t) => {
  const user = {
    _id: "user-2",
    email: "new.hr@example.com",
    firstName: "New",
    lastName: "HR",
    employeeId: null,
  };
  t.mock.method(Employee, "findOne", async () => null);
  t.mock.method(Employee, "countDocuments", async () => 0);
  t.mock.method(Employee, "exists", async () => false);
  const createEmployee = t.mock.method(Employee, "create", async (payload) => ({
    ...payload,
    _id: "employee-2",
  }));
  t.mock.method(LeaveType, "find", async () => []);
  const updateBalance = t.mock.method(
    LeaveBalance,
    "updateOne",
    async () => ({ acknowledged: true }),
  );
  t.mock.method(User, "findById", async () => null);

  const result = await ensureEmployeeProfile(user);

  assert.equal(result._id, "employee-2");
  assert.equal(createEmployee.mock.callCount(), 1);
  const created = createEmployee.mock.calls[0].arguments[0];
  assert.equal(created.employeeId, "EMP00001");
  assert.equal(created.email, "new.hr@example.com");
  assert.equal(created.firstName, "New");
  assert.equal(created.lastName, "HR");
  assert.equal(created.status, "active");
  assert.equal(updateBalance.mock.callCount(), 0);
});
