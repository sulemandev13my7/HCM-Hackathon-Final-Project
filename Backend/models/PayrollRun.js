const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const payrollRunSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    status: { type: String, enum: ["draft", "finalized"], default: "draft" },
    workingDays: { type: Number, required: true },
    items: [
      {
        employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        basic: Number,
        gross: Number,
        employmentWorkingDays: Number,
        absentDays: Number,
        unpaidLeaveDays: Number,
        halfDays: Number,
        deductions: Number,
        tax: Number,
        netPay: Number,
        presentDays: Number,
      },
    ],
    totalGross: Number,
    totalNet: Number,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    finalizedAt: Date,
  },
  { timestamps: true },
);

payrollRunSchema.index(
  { company: 1, month: 1, year: 1 },
  { unique: true },
);
payrollRunSchema.plugin(tenantPlugin);

module.exports = mongoose.model("PayrollRun", payrollRunSchema);
