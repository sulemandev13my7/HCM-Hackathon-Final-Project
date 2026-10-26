const express = require("express");
const router = express.Router();
const {
  createPayrollRun,
  getPayrollRuns,
  getPayrollRun,
  finalizePayroll,
  getPayslip,
  getPayslipPdf,
  getMyPayslips,
} = require("../controllers/payrollController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router
  .route("/")
  .get(protect, authorize("admin", "hr"), getPayrollRuns)
  .post(
    protect,
    authorize("hr"),
    logAudit("create", "payroll_run"),
    createPayrollRun,
  );

router.get("/my/payslips", protect, authorize("employee"), getMyPayslips);
router.get("/:runId/payslip/:employeeId/pdf", protect, getPayslipPdf);
router.get("/:runId/payslip.pdf", protect, getPayslipPdf);
router.get("/:id", protect, authorize("admin", "hr"), getPayrollRun);
router.put(
  "/:id/finalize",
  protect,
  authorize("admin"),
  logAudit("finalize", "payroll_run"),
  finalizePayroll,
);
router.get("/:runId/payslip", protect, getPayslip);
router.get("/:runId/payslip/:employeeId", protect, getPayslip);

module.exports = router;
