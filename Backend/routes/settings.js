const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router
  .route("/")
  .get(protect, authorize("admin", "hr"), getSettings)
  .put(
    protect,
    authorize("admin"),
    logAudit("update", "company_settings"),
    updateSettings,
  );

module.exports = router;
