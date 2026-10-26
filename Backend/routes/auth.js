const express = require("express");
const router = express.Router();
const {
  checkFirstRun,
  firstRunSetup,
  login,
  changePassword,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router.get("/check-setup", checkFirstRun);
router.post("/setup", firstRunSetup);
router.post("/login", login);
router.put(
  "/change-password",
  protect,
  logAudit("change_password", "user"),
  changePassword,
);
router.get("/me", protect, getMe);

module.exports = router;
