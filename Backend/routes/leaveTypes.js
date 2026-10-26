const express = require("express");
const router = express.Router();
const {
  getAll,
  create,
  update,
  delete: deleteLeaveType,
} = require("../controllers/leaveTypeController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router
  .route("/")
  .get(protect, getAll)
  .post(protect, authorize("admin"), logAudit("create", "leave_type"), create);

router
  .route("/:id")
  .put(protect, authorize("admin"), logAudit("update", "leave_type"), update)
  .delete(
    protect,
    authorize("admin"),
    logAudit("delete", "leave_type"),
    deleteLeaveType,
  );

module.exports = router;
