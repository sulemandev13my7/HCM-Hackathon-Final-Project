const express = require("express");
const router = express.Router();
const {
  createHR,
  getUsers,
  resetPassword,
  toggleUserStatus,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router.route("/").get(protect, authorize("admin"), getUsers);
router.post(
  "/hr",
  protect,
  authorize("admin"),
  logAudit("create", "user"),
  createHR,
);
router.put(
  "/:id/reset-password",
  protect,
  authorize("admin"),
  logAudit("reset_password", "user"),
  resetPassword,
);
router.put(
  "/:id/toggle-status",
  protect,
  authorize("admin"),
  logAudit("update_status", "user"),
  toggleUserStatus,
);

module.exports = router;
