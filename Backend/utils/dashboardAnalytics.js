const { isLateAttendance } = require("./payrollCalculations");

const dateKey = (value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return new Date(value).toISOString().slice(0, 10);
};

const refId = (value) => {
  const id = value?._id || value;
  return id == null ? null : id.toString();
};

const roundPercent = (value, total) =>
  total ? Math.round((value / total) * 1000) / 10 : 0;

const buildDashboardAnalytics = ({
  startDate,
  endDate,
  weekendDays = [0, 6],
  holidayDates = [],
  employees,
  attendance,
  leaves,
  salaryStructures,
  payrollRuns,
  leaveBalances = [],
}) => {
  const startKey = dateKey(startDate);
  const endKey = dateKey(endDate);
  const weekends = new Set(weekendDays);
  const holidays = new Set(holidayDates.map(dateKey));
  const employeeById = new Map(
    employees.map((employee) => [refId(employee._id), employee]),
  );
  const workingDates = [];

  for (
    let current = new Date(`${startKey}T00:00:00.000Z`);
    dateKey(current) <= endKey;
    current.setUTCDate(current.getUTCDate() + 1)
  ) {
    const currentKey = dateKey(current);
    if (!weekends.has(current.getUTCDay()) && !holidays.has(currentKey)) {
      workingDates.push(currentKey);
    }
  }

  const approvedLeaves = leaves.filter((leave) => leave.status === "approved");
  const attendanceByEmployeeDate = new Map();
  for (const record of attendance) {
    const employeeId = refId(record.employee);
    if (!employeeId) continue;
    attendanceByEmployeeDate.set(
      `${employeeId}:${dateKey(record.date)}`,
      record,
    );
  }

  const departmentMetrics = new Map();
  const ensureDepartment = (employee) => {
    const departmentId = refId(employee.department) || "unassigned";
    const departmentName = employee.department?.name || "Unassigned";
    if (!departmentMetrics.has(departmentId)) {
      departmentMetrics.set(departmentId, {
        departmentId,
        departmentName,
        employeeCount: 0,
        expectedDays: 0,
        presentWeight: 0,
        absentDays: 0,
        lateCount: 0,
      });
    }
    return departmentMetrics.get(departmentId);
  };

  const isEmployedOn = (employee, key) => {
    const joined = employee.joinDate ? dateKey(employee.joinDate) : startKey;
    const terminated = employee.terminationDate
      ? dateKey(employee.terminationDate)
      : null;
    if (!terminated && ["terminated", "resigned"].includes(employee.status)) {
      return false;
    }
    return joined <= key && (!terminated || terminated >= key);
  };

  let expectedDays = 0;
  let presentWeight = 0;
  let absentDays = 0;
  let lateCount = 0;
  let presentToday = 0;
  let lateToday = 0;
  let onLeaveToday = 0;
  const attendanceTrendByDate = new Map();
  const lateByEmployee = new Map();
  const genderDistribution = new Map();
  const tenureDistribution = new Map([
    ["Under 1 year", 0],
    ["1-3 years", 0],
    ["3+ years", 0],
  ]);
  const activeAtStart = employees.filter((employee) =>
    isEmployedOn(employee, startKey),
  );
  const activeAtEnd = employees.filter((employee) =>
    isEmployedOn(employee, endKey),
  );
  const exits = employees.filter((employee) => {
    if (!employee.terminationDate) return false;
    const terminated = dateKey(employee.terminationDate);
    return terminated >= startKey && terminated <= endKey;
  }).length;

  for (const employee of employees) {
    const department = ensureDepartment(employee);
    const gender = employee.gender || "unspecified";
    genderDistribution.set(gender, (genderDistribution.get(gender) || 0) + 1);

    if (isEmployedOn(employee, endKey) && employee.joinDate) {
      const years =
        (new Date(`${endKey}T00:00:00.000Z`) -
          new Date(`${dateKey(employee.joinDate)}T00:00:00.000Z`)) /
        (365.25 * 24 * 60 * 60 * 1000);
      const band =
        years < 1 ? "Under 1 year" : years < 3 ? "1-3 years" : "3+ years";
      tenureDistribution.set(band, tenureDistribution.get(band) + 1);
    }

    if (isEmployedOn(employee, endKey)) department.employeeCount++;

    for (const day of workingDates) {
      if (!isEmployedOn(employee, day)) continue;
      const approvedLeave = approvedLeaves.find((leave) => {
        if (refId(leave.employee) !== refId(employee._id)) return false;
        return dateKey(leave.startDate) <= day && dateKey(leave.endDate) >= day;
      });
      if (approvedLeave) {
        if (day === endKey) onLeaveToday++;
        continue;
      }

      expectedDays++;
      department.expectedDays++;
      const record = attendanceByEmployeeDate.get(
        `${refId(employee._id)}:${day}`,
      );
      const status = record?.status;
      const weight = ["present", "late", "missing_checkout"].includes(status)
        ? 1
        : status === "half_day"
          ? 0.5
          : 0;
      presentWeight += weight;
      department.presentWeight += weight;
      if (weight === 0) {
        absentDays++;
        department.absentDays++;
      }
      if (record && isLateAttendance(record)) {
        lateCount++;
        department.lateCount++;
        const employeeId = refId(employee._id);
        const lateEntry = lateByEmployee.get(employeeId) || {
          employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
          department: employee.department?.name || "Unassigned",
          count: 0,
        };
        lateEntry.count++;
        lateByEmployee.set(employeeId, lateEntry);
      }

      if (day === endKey) {
        if (weight > 0) presentToday++;
        if (record && isLateAttendance(record)) lateToday++;
      }
    }
  }

  for (const record of attendance) {
    const day = dateKey(record.date);
    if (day < startKey || day > endKey) continue;
    const trend = attendanceTrendByDate.get(day) || {
      date: day,
      present: 0,
      late: 0,
      halfDay: 0,
      absent: 0,
    };
    if (record.status === "half_day") trend.halfDay++;
    else if (record.status === "absent") trend.absent++;
    else if (record.status === "late" || isLateAttendance(record)) {
      trend.late++;
      trend.present++;
    } else if (["present", "missing_checkout"].includes(record.status)) {
      trend.present++;
    }
    attendanceTrendByDate.set(day, trend);
  }

  const leaveDaysByType = new Map();
  for (const leave of approvedLeaves) {
    const employeeId = refId(leave.employee);
    const employee = employeeById.get(employeeId);
    if (!employee) continue;
    let approvedDays = 0;
    for (const day of workingDates) {
      if (
        day >= dateKey(leave.startDate) &&
        day <= dateKey(leave.endDate) &&
        isEmployedOn(employee, day)
      ) {
        approvedDays++;
      }
    }
    if (!approvedDays) continue;
    const leaveName = leave.leaveType?.name || "Other";
    const current = leaveDaysByType.get(leaveName) || 0;
    leaveDaysByType.set(leaveName, current + approvedDays);
  }

  const activeIds = new Set(activeAtEnd.map((employee) => refId(employee._id)));
  const salaryByEmployee = new Map();
  for (const salary of salaryStructures) {
    const employeeId = refId(salary.employee);
    if (activeIds.has(employeeId)) salaryByEmployee.set(employeeId, salary);
  }
  const salaryValues = [...salaryByEmployee.values()].map(
    (salary) => salary.gross || salary.basic * 1.5,
  );
  const averageSalary = salaryValues.length
    ? Math.round(
        salaryValues.reduce((total, value) => total + value, 0) /
          salaryValues.length,
      )
    : 0;

  const payrollByDepartment = new Map();
  let payrollCost = 0;
  let payrollNet = 0;
  for (const run of payrollRuns) {
    if (run.status !== "finalized") continue;
    const runMonth = `${run.year}-${String(run.month).padStart(2, "0")}-01`;
    if (runMonth < startKey || runMonth > endKey) continue;
    for (const item of run.items || []) {
      const employeeId = refId(item.employee);
      const employee = employeeById.get(employeeId);
      if (!employee) continue;
      const gross = item.gross || 0;
      const netPay = item.netPay || 0;
      payrollCost += gross;
      payrollNet += netPay;
      const department = employee.department?.name || "Unassigned";
      const current = payrollByDepartment.get(department) || {
        department,
        gross: 0,
        net: 0,
      };
      current.gross += gross;
      current.net += netPay;
      payrollByDepartment.set(department, current);
    }
  }

  const pendingLeaves = leaves.filter(
    (leave) => leave.status === "pending",
  ).length;
  const averageHeadcount = (activeAtStart.length + activeAtEnd.length) / 2;
  const attritionRate = averageHeadcount
    ? Math.round((exits / averageHeadcount) * 1000) / 10
    : 0;
  const byDepartment = [...departmentMetrics.values()]
    .map((department) => ({
      ...department,
      attendanceRate: roundPercent(
        department.presentWeight,
        department.expectedDays,
      ),
      absenteeismRate: roundPercent(
        department.absentDays,
        department.expectedDays,
      ),
    }))
    .sort((a, b) => a.departmentName.localeCompare(b.departmentName));

  const attendanceRate = roundPercent(presentWeight, expectedDays);
  const overallAbsenteeismRate = roundPercent(absentDays, expectedDays);
  const leaveByType = [...leaveDaysByType.entries()]
    .map(([name, approvedDays]) => ({ name, approvedDays }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const utilizationByType = new Map();
  for (const balance of leaveBalances) {
    const name = balance.leaveType?.name || "Other";
    const current = utilizationByType.get(name) || {
      name,
      used: 0,
      quota: 0,
    };
    current.used += balance.used || 0;
    current.quota += balance.quota || 0;
    utilizationByType.set(name, current);
  }

  return {
    kpis: {
      totalEmployees: activeAtEnd.length,
      headcountAtStart: activeAtStart.length,
      attritionYtd: attritionRate,
      payrollCost,
      payrollNet,
      averageSalary,
      presentToday,
      lateToday,
      onLeaveToday,
      pendingLeaves,
      attendanceRate,
      absenteeismRate: overallAbsenteeismRate,
    },
    attendanceTrend: [...attendanceTrendByDate.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    absenteeismByDepartment: byDepartment,
    employeesByDepartment: byDepartment.map(
      ({ departmentId, departmentName, employeeCount }) => ({
        departmentId,
        departmentName,
        employeeCount,
      }),
    ),
    payrollByDepartment: [...payrollByDepartment.values()],
    leaveByType,
    leaveUtilization: [...utilizationByType.values()].map((leaveType) => ({
      ...leaveType,
      utilizationRate: roundPercent(leaveType.used, leaveType.quota),
    })),
    topLateComers: [...lateByEmployee.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    genderDistribution: [...genderDistribution.entries()].map(
      ([gender, count]) => ({ gender, count }),
    ),
    tenureDistribution: [...tenureDistribution.entries()].map(
      ([tenure, count]) => ({ tenure, count }),
    ),
  };
};

module.exports = { buildDashboardAnalytics };
