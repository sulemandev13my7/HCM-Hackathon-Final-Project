const express = require("express");
const router = express.Router();
const {
  checkFirstRun,
  firstRunSetup,
  signup,
  login,
  changePassword,
  resetPasswordWithToken,
  getMe,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");
const { loginLimiter, signupLimiter } = require("../middleware/authRateLimit");
const passwordResetLimiter = require("../middleware/passwordResetRateLimit");

router.get("/check-setup", checkFirstRun);
router.post("/setup", signupLimiter, firstRunSetup);
router.post("/signup", signupLimiter, signup);
router.post("/logout", logout);
router.post("/login", loginLimiter, login);
router.post("/reset-password", passwordResetLimiter, resetPasswordWithToken);
router.put(
  "/change-password",
  protect,
  logAudit("change_password", "user"),
  changePassword,
);
router.get("/me", protect, getMe);

module.exports = router;
