const express = require("express");
const router = express.Router();
const {
  importDryRun,
  importCommit,
} = require("../controllers/employeeImportController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router.post("/dry-run", protect, authorize("hr"), importDryRun);
router.post(
  "/commit",
  protect,
  authorize("hr"),
  logAudit("import", "employee"),
  importCommit,
);

module.exports = router;
