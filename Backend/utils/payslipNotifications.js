const buildPayslipNotifications = (run, users, items) => {
  const userByEmployeeId = new Map(
    users.map((user) => [user.employeeId.toString(), user._id]),
  );

  return items.flatMap((item) => {
    const employeeId = item.employee?._id || item.employee;
    const user = userByEmployeeId.get(employeeId?.toString());
    if (!user) return [];

    return [
      {
        user,
        title: "Payslip available",
        message: `Your payslip for ${run.month}/${run.year} is available.`,
        type: "success",
        link: "/employee/payroll",
      },
    ];
  });
};

module.exports = { buildPayslipNotifications };
