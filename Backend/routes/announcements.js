const express = require("express");
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
} = require("../controllers/announcementController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router
  .route("/")
  .get(protect, getAnnouncements)
  .post(
    protect,
    authorize("admin", "hr"),
    logAudit("create", "announcement"),
    createAnnouncement,
  );

module.exports = router;
