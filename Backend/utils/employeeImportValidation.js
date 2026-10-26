const { isValidDateRange } = require("./dateTime");

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const validateEmployeeImportRow = (row, rowNumber, options) => {
  const errors = [];
  const addError = (field, reason) =>
    errors.push({ row: rowNumber, field, reason });
  const firstName = String(row.firstName ?? "").trim();
  const lastName = String(row.lastName ?? "").trim();
  const email = normalize(row.email);
  const employeeId = normalize(row.employeeId);
  const joinDate = String(row.joinDate ?? "").trim();

  if (!firstName) addError("firstName", "First name is required");
  if (!lastName) addError("lastName", "Last name is required");
  if (!email) {
    addError("email", "Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    addError("email", "Invalid email format");
  } else if (
    options.existingEmails.has(email) ||
    options.seenEmails.has(email)
  ) {
    addError("email", "Email already exists");
  }

  if (
    employeeId &&
    (options.existingEmployeeIds.has(employeeId) ||
      options.seenEmployeeIds.has(employeeId))
  ) {
    addError("employeeId", "Employee ID already exists");
  }

  if (!joinDate) {
    addError("joinDate", "Join date is required");
  } else if (!isValidDateRange(joinDate, joinDate)) {
    addError("joinDate", "Join date must be a valid ISO date (YYYY-MM-DD)");
  }

  const department = normalize(row.department);
  if (department && !options.departmentNames.has(department)) {
    addError("department", "Unknown department");
  }

  const designation = normalize(row.designation);
  if (designation && !options.designationTitles.has(designation)) {
    addError("designation", "Unknown designation");
  }

  const salaryValue = String(row.basicSalary ?? "").trim();
  if (
    salaryValue &&
    (!Number.isFinite(Number(salaryValue)) || Number(salaryValue) <= 0)
  ) {
    addError("basicSalary", "Salary must be greater than 0");
  }

  return errors;
};

module.exports = { validateEmployeeImportRow };
