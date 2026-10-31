const Employee = require("../models/Employee");
const User = require("../models/User");
const Department = require("../models/Department");
const Designation = require("../models/Designation");
const SalaryStructure = require("../models/SalaryStructure");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveType = require("../models/LeaveType");
const { csvUpload } = require("../middleware/csvUpload");
const { parseCsvBuffer } = require("../utils/csv");
const { runInTransaction } = require("../utils/transactions");
const { generateTemporaryPassword } = require("../utils/temporaryPassword");
const {
  validateEmployeeImportRow,
} = require("../utils/employeeImportValidation");

const loadLookups = async () => {
  const [departments, designations, existingEmployees] = await Promise.all([
    Department.find().lean(),
    Designation.find().lean(),
    Employee.find({}, "email employeeId").lean(),
  ]);

  return {
    departments,
    designations,
    existingEmployees,
    deptMap: Object.fromEntries(
      departments.map((item) => [item.name.toLowerCase(), item._id]),
    ),
    desigMap: Object.fromEntries(
      designations.map((item) => [item.title.toLowerCase(), item._id]),
    ),
    departmentNames: new Set(departments.map((item) => item.name.toLowerCase())),
    designationTitles: new Set(
      designations.map((item) => item.title.toLowerCase()),
    ),
    existingEmails: new Set(
      existingEmployees.map((item) => item.email.toLowerCase()),
    ),
    existingEmployeeIds: new Set(
      existingEmployees.map((item) => item.employeeId.toLowerCase()),
    ),
  };
};

const validateRows = (rows, lookups) => {
  const errors = [];
  const invalidRows = new Set();
  const seenEmails = new Set();
  const seenEmployeeIds = new Set();

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const rowErrors = validateEmployeeImportRow(row, rowNum, {
      departmentNames: lookups.departmentNames,
      designationTitles: lookups.designationTitles,
      existingEmails: lookups.existingEmails,
      existingEmployeeIds: lookups.existingEmployeeIds,
      seenEmails,
      seenEmployeeIds,
    });

    if (rowErrors.length) {
      errors.push(...rowErrors);
      invalidRows.add(rowNum);
      return;
    }

    seenEmails.add(row.email.trim().toLowerCase());
    if (row.employeeId) {
      seenEmployeeIds.add(row.employeeId.trim().toLowerCase());
    }
  });

  return { errors, invalidRows, seenEmails, seenEmployeeIds };
};

exports.importDryRun = [
  csvUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const rows = await parseCsvBuffer(req.file.buffer);
      const lookups = await loadLookups();
      const { errors, invalidRows } = validateRows(rows, lookups);

      res.json({
        totalRows: rows.length,
        validRows: rows.length - invalidRows.size,
        errors,
        preview: rows.slice(0, 5),
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({ message: error.message });
    }
  },
];

exports.importCommit = [
  csvUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const rows = await parseCsvBuffer(req.file.buffer);
      const lookups = await loadLookups();
      const { errors, invalidRows, seenEmails, seenEmployeeIds } = validateRows(
        rows,
        lookups,
      );
      const leaveTypes = await LeaveType.find({ isActive: true }).lean();
      const year = new Date().getFullYear();
      let nextEmployeeNumber = lookups.existingEmployees.length + 1;
      let created = 0;
      const credentials = [];

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const rowNum = index + 2;
        if (invalidRows.has(rowNum)) continue;

        let employeeId = row.employeeId?.trim();
        if (!employeeId) {
          do {
            employeeId = `EMP${String(nextEmployeeNumber++).padStart(5, "0")}`;
          } while (lookups.existingEmployeeIds.has(employeeId.toLowerCase()));
        }
        lookups.existingEmployeeIds.add(employeeId.toLowerCase());
        if (row.employeeId) seenEmployeeIds.add(employeeId.toLowerCase());

        const tempPassword = generateTemporaryPassword();

        try {
          await runInTransaction(async (session) => {
            const employee = await Employee.create(
              [
                {
                  employeeId,
                  firstName: row.firstName,
                  lastName: row.lastName,
                  email: row.email,
                  phone: row.phone || "",
                  department: row.department
                    ? lookups.deptMap[row.department.toLowerCase()]
                    : null,
                  designation: row.designation
                    ? lookups.desigMap[row.designation.toLowerCase()]
                    : null,
                  joinDate: new Date(`${row.joinDate}T00:00:00.000Z`),
                  status: "active",
                },
              ],
              { session },
            );

            await User.create(
              [
                {
                  email: row.email,
                  password: tempPassword,
                  role: "employee",
                  company: req.companyId,
                  employeeId: employee[0]._id,
                  firstName: row.firstName,
                  lastName: row.lastName,
                  mustChangePassword: true,
                },
              ],
              { session },
            );

            if (row.basicSalary && Number(row.basicSalary) > 0) {
              const basic = Number(row.basicSalary);
              await SalaryStructure.create(
                [
                  {
                    employee: employee[0]._id,
                    basic,
                    hra: basic * 0.4,
                    medicalAllowance: basic * 0.1,
                    gross: basic * 1.5,
                    isActive: true,
                  },
                ],
                { session },
              );
            }

            if (leaveTypes.length) {
              await LeaveBalance.insertMany(
                leaveTypes.map((leaveType) => ({
                  employee: employee[0]._id,
                  year,
                  leaveType: leaveType._id,
                  quota: leaveType.quota,
                  used: 0,
                  remaining: leaveType.quota,
                })),
                { session },
              );
            }
          });

          created++;
          credentials.push({
            email: row.email,
            password: tempPassword,
            employeeId,
          });
        } catch (error) {
          seenEmails.delete(row.email.trim().toLowerCase());
          errors.push({
            row: rowNum,
            field: "row",
            message: error.message,
          });
        }
      }

      res.json({
        message: `${created} employees created`,
        credentials,
        errors,
        skipped: rows.length - created,
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({ message: error.message });
    }
  },
];
