const isLateAttendance = (attendance) =>
  attendance.isLate === true || attendance.status === "late";

const getMissingSalaryEmployees = (employees, salaryStructures) => {
  const salariedEmployeeIds = new Set(
    salaryStructures.map((salary) => salary.employee.toString()),
  );

  return employees
    .filter((employee) => !salariedEmployeeIds.has(employee._id.toString()))
    .map((employee) => ({
      id: employee._id,
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`.trim(),
    }));
};

const calculateWorkingDays = (
  year,
  month,
  holidayDates = [],
  weekendDays = [0, 6],
) => {
  const holidays = new Set(holidayDates);
  const weekends = new Set(weekendDays);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const dateKey = date.toISOString().slice(0, 10);

    if (!weekends.has(date.getUTCDay()) && !holidays.has(dateKey)) {
      workingDays++;
    }
  }

  return workingDays;
};

const calculateEmploymentWorkingDays = (
  year,
  month,
  joinDate,
  terminationDate,
  holidayDates = [],
  weekendDays = [0, 6],
) => {
  const holidays = new Set(holidayDates);
  const weekends = new Set(weekendDays);
  const startDate = joinDate ? toDateKey(joinDate) : null;
  const endDate = terminationDate ? toDateKey(terminationDate) : null;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const dateKey = date.toISOString().slice(0, 10);

    if (
      (startDate && dateKey < startDate) ||
      (endDate && dateKey > endDate) ||
      weekends.has(date.getUTCDay()) ||
      holidays.has(dateKey)
    ) {
      continue;
    }

    workingDays++;
  }

  return workingDays;
};

const calculatePresentDays = (
  workingDays,
  absentDays,
  unpaidLeaveDays,
  halfDays,
) => {
  return workingDays - absentDays - unpaidLeaveDays - halfDays * 0.5;
};

const calculateAnnualTax = (annualGross) => {
  if (annualGross <= 600000) return 0;
  if (annualGross <= 1200000) return (annualGross - 600000) * 0.05;
  if (annualGross <= 2400000)
    return 30000 + (annualGross - 1200000) * 0.15;
  if (annualGross <= 3600000)
    return 210000 + (annualGross - 2400000) * 0.25;
  return 510000 + (annualGross - 3600000) * 0.35;
};

const parsePayrollPeriod = (monthValue, yearValue) => {
  const parseInteger = (value) => {
    if (
      typeof value !== "number" &&
      !(typeof value === "string" && /^\d+$/.test(value.trim()))
    ) {
      return null;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  };

  const month = parseInteger(monthValue);
  const year = parseInteger(yearValue);
  if (month === null || month < 1 || month > 12) return null;
  if (year === null || year < 1900 || year > 9999) return null;

  return { month, year };
};

const calculatePayrollAmounts = ({
  fullMonthGross,
  workingDays,
  employmentWorkingDays,
  absentDays,
  unpaidLeaveDays,
  halfDays,
  lateCount,
}) => {
  const employmentRatio = employmentWorkingDays / (workingDays || 1);
  const perDay = fullMonthGross / (workingDays || 1);
  const latePenaltyDays =
    lateCount >= 3 ? Math.floor(lateCount / 3) * 0.5 : 0;
  const gross = fullMonthGross * employmentRatio;
  const deductions = Math.round(
    perDay *
      (absentDays + unpaidLeaveDays + 0.5 * halfDays + latePenaltyDays),
  );
  const tax = Math.round(
    (calculateAnnualTax(fullMonthGross * 12) / 12) * employmentRatio,
  );

  return {
    gross,
    deductions,
    tax,
    netPay: Math.round(gross - deductions - tax),
    latePenaltyDays,
  };
};

const toDateKey = (value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Date(value).toISOString().slice(0, 10);
};

const calculatePayrollAttendance = ({
  year,
  month,
  attendance,
  approvedLeaves,
  holidayDates = [],
  weekendDays = [0, 6],
  employmentStartDate,
  employmentEndDate,
}) => {
  const attendanceByDate = new Map(
    attendance.map((record) => [toDateKey(record.date), record]),
  );
  const holidays = new Set(holidayDates);
  const weekends = new Set(weekendDays);
  const totals = {
    absentDays: 0,
    unpaidLeaveDays: 0,
    halfDays: 0,
    lateCount: 0,
  };
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const dateKey = date.toISOString().slice(0, 10);
    if (weekends.has(date.getUTCDay()) || holidays.has(dateKey)) continue;
    if (
      (employmentStartDate && dateKey < toDateKey(employmentStartDate)) ||
      (employmentEndDate && dateKey > toDateKey(employmentEndDate))
    ) {
      continue;
    }

    const record = attendanceByDate.get(dateKey);
    const leave = approvedLeaves.find(
      (request) =>
        toDateKey(request.startDate) <= dateKey &&
        toDateKey(request.endDate) >= dateKey,
    );

    if (leave?.leaveType?.name === "Unpaid") {
      totals.unpaidLeaveDays++;
    } else if (!leave && (!record || record.status === "absent")) {
      totals.absentDays++;
    }

    if (record?.status === "half_day") totals.halfDays++;
    if (record && isLateAttendance(record)) totals.lateCount++;
  }

  return totals;
};

module.exports = {
  calculateWorkingDays,
  calculateEmploymentWorkingDays,
  calculatePresentDays,
  isLateAttendance,
  getMissingSalaryEmployees,
  calculatePayrollAttendance,
  calculateAnnualTax,
  parsePayrollPeriod,
  calculatePayrollAmounts,
};
