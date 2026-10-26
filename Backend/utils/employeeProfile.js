const Employee = require("../models/Employee");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveType = require("../models/LeaveType");
const User = require("../models/User");
const { generateEmployeeId } = require("./employeeId");

const ensureEmployeeProfile = async (user) => {
  let employee = null;
  if (user.employeeId) {
    employee = await Employee.findById(user.employeeId);
  }
  if (!employee) {
    employee = await Employee.findOne({ email: user.email });
  }
  if (!employee) {
    employee = await Employee.create({
      employeeId: await generateEmployeeId(),
      firstName: user.firstName || "HR",
      lastName: user.lastName || "Team",
      email: user.email,
      joinDate: new Date(),
      employmentType: "full-time",
      status: "active",
    });
  }

  const leaveTypes = await LeaveType.find({ isActive: true });
  const year = new Date().getFullYear();
  await Promise.all(
    leaveTypes.map((leaveType) =>
      LeaveBalance.updateOne(
        { employee: employee._id, year, leaveType: leaveType._id },
        {
          $setOnInsert: {
            quota: leaveType.quota,
            used: 0,
            remaining: leaveType.quota,
          },
        },
        { upsert: true },
      ),
    ),
  );

  const latestUser = await User.findById(user._id);
  if (
    latestUser &&
    (!latestUser.employeeId ||
      latestUser.employeeId.toString() !== employee._id.toString())
  ) {
    latestUser.employeeId = employee._id;
    await latestUser.save();
  }

  return employee;
};

module.exports = { ensureEmployeeProfile };
