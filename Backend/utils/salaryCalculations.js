const calculateSalaryComponents = (basicInput) => {
  const basic = Number(basicInput);
  if (!Number.isFinite(basic)) {
    throw new TypeError("Basic salary must be a valid number");
  }
  if (basic <= 0) {
    throw new RangeError("Basic salary must be greater than zero");
  }

  const hra = basic * 0.4;
  const medicalAllowance = basic * 0.1;
  const otherAllowances = 0;

  return {
    basic,
    hra,
    medicalAllowance,
    otherAllowances,
    gross: basic + hra + medicalAllowance + otherAllowances,
  };
};

module.exports = { calculateSalaryComponents };
