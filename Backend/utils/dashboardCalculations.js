const { isLateAttendance } = require("./payrollCalculations");

const buildEmployeeDashboardMetrics = ({
  employeeId,
  weeklyAttendance,
  monthlyAttendance,
  finalizedRuns,
}) => {
  const employeeKey = employeeId.toString();
  const hoursThisWeek = weeklyAttendance.reduce(
    (total, record) => total + (record.hoursWorked || 0),
    0,
  );
  const sortedRuns = [...finalizedRuns].sort(
    (a, b) => b.year - a.year || b.month - a.month,
  );
  let lastPayslip = null;

  for (const run of sortedRuns) {
    if (run.status !== "finalized") continue;
    const item = run.items.find((entry) => {
      const itemEmployeeId = entry.employee?._id || entry.employee;
      return itemEmployeeId?.toString() === employeeKey;
    });

    if (item) {
      lastPayslip = {
        runId: run._id,
        month: run.month,
        year: run.year,
        gross: item.gross,
        netPay: item.netPay,
      };
      break;
    }
  }

  return {
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
    lateCountThisMonth: monthlyAttendance.filter(isLateAttendance).length,
    lastPayslip,
  };
};

module.exports = { buildEmployeeDashboardMetrics };
