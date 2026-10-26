const express = require("express");
const router = express.Router();
const {
  applyLeave,
  getLeaveRequests,
  cancelLeave,
  approveLeave,
  rejectLeave,
  getBalances,
} = require("../controllers/leaveController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router.post(
  "/apply",
  protect,
  authorize("employee", "hr"),
  logAudit("create", "leave"),
  applyLeave,
);
router.get("/", protect, getLeaveRequests);
router.get("/balances", protect, getBalances);
router.put(
  "/:id/cancel",
  protect,
  authorize("employee", "hr"),
  logAudit("cancel", "leave"),
  cancelLeave,
);
router.put(
  "/:id/approve",
  protect,
  authorize("hr"),
  logAudit("approve", "leave"),
  approveLeave,
);
router.put(
  "/:id/reject",
  protect,
  authorize("hr"),
  logAudit("reject", "leave"),
  rejectLeave,
);

module.exports = router;
