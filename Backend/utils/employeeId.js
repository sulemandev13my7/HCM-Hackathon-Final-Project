const Employee = require("../models/Employee");

const generateEmployeeId = async () => {
  let sequence = (await Employee.countDocuments()) + 1;
  while (
    await Employee.exists({ employeeId: `EMP${String(sequence).padStart(5, "0")}` })
  ) {
    sequence += 1;
  }
  return `EMP${String(sequence).padStart(5, "0")}`;
};

module.exports = { generateEmployeeId };
