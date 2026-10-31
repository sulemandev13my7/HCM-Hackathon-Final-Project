const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    designation: { type: mongoose.Schema.Types.ObjectId, ref: "Designation" },
    joinDate: { type: Date, required: true },
    terminationDate: Date,
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract"],
      default: "full-time",
    },
    status: {
      type: String,
      enum: ["active", "probation", "terminated", "resigned"],
      default: "active",
    },
    emergencyContact: { name: String, phone: String, relation: String },
  },
  { timestamps: true },
);

employeeSchema.index({ company: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ company: 1, email: 1 }, { unique: true });
employeeSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Employee", employeeSchema);
