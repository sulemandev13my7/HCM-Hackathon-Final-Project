const express = require("express");
const router = express.Router();
const {
  checkIn,
  checkOut,
  getAttendance,
  getTodayAttendance,
  getMyTodayAttendance,
} = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router.post(
  "/check-in",
  protect,
  authorize("employee", "hr"),
  logAudit("check_in", "attendance"),
  checkIn,
);
router.post(
  "/check-out",
  protect,
  authorize("employee", "hr"),
  logAudit("check_out", "attendance"),
  checkOut,
);
router.get("/", protect, getAttendance);
router.get("/today/me", protect, authorize("employee", "hr"), getMyTodayAttendance);
router.get("/today", protect, authorize("admin", "hr"), getTodayAttendance);

module.exports = router;
