const Employee = require("../models/Employee");
const User = require("../models/User");
const Department = require("../models/Department");
const Designation = require("../models/Designation");
const SalaryStructure = require("../models/SalaryStructure");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveType = require("../models/LeaveType");
const csv = require("csv-parser");
const fs = require("fs");
const multer = require("multer");
const { generateTemporaryPassword } = require("../utils/temporaryPassword");
const {
  validateEmployeeImportRow,
} = require("../utils/employeeImportValidation");

const upload = multer({ dest: "uploads/" });

// Dry run CSV import
exports.importDryRun = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const results = [];
      const errors = [];
      const [departments, designations, existingEmployees] = await Promise.all([
        Department.find(),
        Designation.find(),
        Employee.find({}, "email employeeId"),
      ]);
      const departmentNames = new Set(
        departments.map((d) => d.name.toLowerCase()),
      );
      const designationTitles = new Set(
        designations.map((d) => d.title.toLowerCase()),
      );
      const existingEmails = new Set(
        existingEmployees.map((e) => e.email.toLowerCase()),
      );
      const existingEmployeeIds = new Set(
        existingEmployees.map((e) => e.employeeId.toLowerCase()),
      );
      const seenEmails = new Set();
      const seenEmployeeIds = new Set();

      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("error", (error) => {
          fs.rmSync(req.file.path, { force: true });
          res.status(400).json({ message: error.message });
        })
        .on("end", async () => {
          const invalidRows = new Set();
          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const rowNum = i + 2;
            const rowErrors = validateEmployeeImportRow(row, rowNum, {
              departmentNames,
              designationTitles,
              existingEmails,
              existingEmployeeIds,
              seenEmails,
              seenEmployeeIds,
            });
            if (rowErrors.length) {
              errors.push(...rowErrors);
              invalidRows.add(rowNum);
              continue;
            }
            seenEmails.add(row.email.trim().toLowerCase());
            if (row.employeeId)
              seenEmployeeIds.add(row.employeeId.trim().toLowerCase());
          }

          fs.rmSync(req.file.path, { force: true });
          res.json({
            totalRows: results.length,
            validRows: results.length - invalidRows.size,
            errors,
            preview: results.slice(0, 5),
          });
        });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];

// Commit CSV import
exports.importCommit = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const results = [];
      const [departments, designations, existingEmployees] = await Promise.all([
        Department.find(),
        Designation.find(),
        Employee.find({}, "email employeeId"),
      ]);
      const deptMap = {};
      const desigMap = {};
      departments.forEach((d) => {
        deptMap[d.name.toLowerCase()] = d._id;
      });
      designations.forEach((d) => {
        desigMap[d.title.toLowerCase()] = d._id;
      });
      const departmentNames = new Set(
        departments.map((d) => d.name.toLowerCase()),
      );
      const designationTitles = new Set(
        designations.map((d) => d.title.toLowerCase()),
      );
      const existingEmails = new Set(
        existingEmployees.map((e) => e.email.toLowerCase()),
      );
      const existingEmployeeIds = new Set(
        existingEmployees.map((e) => e.employeeId.toLowerCase()),
      );
      const seenEmails = new Set();
      const seenEmployeeIds = new Set();
      let nextEmployeeNumber = existingEmployees.length + 1;

      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("error", (error) => {
          fs.rmSync(req.file.path, { force: true });
          res.status(400).json({ message: error.message });
        })
        .on("end", async () => {
          let created = 0;
          const credentials = [];
          const errors = [];

          for (let index = 0; index < results.length; index++) {
            const row = results[index];
            const rowNum = index + 2;
            const rowErrors = validateEmployeeImportRow(row, rowNum, {
              departmentNames,
              designationTitles,
              existingEmails,
              existingEmployeeIds,
              seenEmails,
              seenEmployeeIds,
            });
            if (rowErrors.length) {
              errors.push(...rowErrors);
              continue;
            }
            seenEmails.add(row.email.trim().toLowerCase());
            try {
              let employeeId = row.employeeId?.trim();
              if (!employeeId) {
                do {
                  employeeId = `EMP${String(nextEmployeeNumber++).padStart(5, "0")}`;
                } while (existingEmployeeIds.has(employeeId.toLowerCase()));
              }
              existingEmployeeIds.add(employeeId.toLowerCase());
              if (row.employeeId) seenEmployeeIds.add(employeeId.toLowerCase());

              const employee = await Employee.create({
                employeeId,
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                phone: row.phone || "",
                department: row.department
                  ? deptMap[row.department.toLowerCase()]
                  : null,
                designation: row.designation
                  ? desigMap[row.designation.toLowerCase()]
                  : null,
                joinDate: new Date(`${row.joinDate}T00:00:00.000Z`),
                status: "active",
              });

              const tempPassword = generateTemporaryPassword();
              await User.create({
                email: row.email,
                password: tempPassword,
                role: "employee",
                employeeId: employee._id,
                firstName: row.firstName,
                lastName: row.lastName,
                mustChangePassword: true,
              });

              if (row.basicSalary && Number(row.basicSalary) > 0) {
                const basic = Number(row.basicSalary);
                const gross = basic * 1.5;
                await SalaryStructure.create({
                  employee: employee._id,
                  basic,
                  hra: basic * 0.4,
                  medicalAllowance: basic * 0.1,
                  gross,
                  isActive: true,
                });
              }

              const leaveTypes = await LeaveType.find({ isActive: true });
              const year = new Date().getFullYear();
              for (let lt of leaveTypes) {
                await LeaveBalance.create({
                  employee: employee._id,
                  year,
                  leaveType: lt._id,
                  quota: lt.quota,
                  used: 0,
                  remaining: lt.quota,
                });
              }

              created++;
              credentials.push({
                email: row.email,
                password: tempPassword,
                employeeId,
              });
            } catch (e) {
              console.error(e);
            }
          }

          fs.rmSync(req.file.path, { force: true });
          res.json({
            message: `${created} employees created`,
            credentials,
            errors,
          });
        });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];
