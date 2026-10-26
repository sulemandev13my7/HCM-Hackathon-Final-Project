const express = require("express");
const router = express.Router();
const {
  requestCorrection,
  getCorrections,
  approveCorrection,
  rejectCorrection,
} = require("../controllers/attendanceCorrectionController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router.post(
  "/request",
  protect,
  authorize("employee", "hr"),
  logAudit("request", "attendance_correction"),
  requestCorrection,
);
router.get("/", protect, getCorrections);
router.put(
  "/:id/approve",
  protect,
  authorize("hr"),
  logAudit("approve", "attendance_correction"),
  approveCorrection,
);
router.put(
  "/:id/reject",
  protect,
  authorize("hr"),
  logAudit("reject", "attendance_correction"),
  rejectCorrection,
);

module.exports = router;
