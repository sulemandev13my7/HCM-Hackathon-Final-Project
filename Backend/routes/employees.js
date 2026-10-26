const express = require("express");
const router = express.Router();
const {
  getAllEmployees,
  getEmployee,
  getEmployee360,
  createEmployee,
  updateEmployee,
  updateEmployeeSalary,
  exportCSV,
  updateMe,
  getMeEmployee,
} = require("../controllers/employeeController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router
  .route("/")
  .get(protect, authorize("admin", "hr"), getAllEmployees)
  .post(
    protect,
    authorize("hr"),
    logAudit("create", "employee"),
    createEmployee,
  );

router.get("/me", protect, authorize("employee"), getMeEmployee);
router.put(
  "/me/update",
  protect,
  authorize("employee"),
  logAudit("update_profile", "employee"),
  updateMe,
);
router.get("/export", protect, authorize("hr"), exportCSV);
router.get("/:id", protect, authorize("admin", "hr"), getEmployee);
router.get("/:id/360", protect, authorize("admin", "hr"), getEmployee360);
router.put(
  "/:id/salary",
  protect,
  authorize("hr"),
  logAudit("update_salary", "employee"),
  updateEmployeeSalary,
);
router.put(
  "/:id",
  protect,
  authorize("hr"),
  logAudit("update", "employee"),
  updateEmployee,
);

module.exports = router;
