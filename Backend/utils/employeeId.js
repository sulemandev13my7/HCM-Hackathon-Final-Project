const Employee = require("../models/Employee");

const generateEmployeeId = async (session) => {
  let countQuery = Employee.countDocuments();
  if (session) countQuery = countQuery.session(session);
  let sequence = (await countQuery) + 1;

  while (true) {
    const employeeId = `EMP${String(sequence).padStart(5, "0")}`;
    let existsQuery = Employee.exists({ employeeId });
    if (session) existsQuery = existsQuery.session(session);
    if (!(await existsQuery)) return employeeId;
    sequence += 1;
  }
};

module.exports = { generateEmployeeId };
