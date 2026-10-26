const express = require("express");
const router = express.Router();
const {
  getAll,
  create,
  update,
  delete: deleteHoliday,
} = require("../controllers/holidayController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router
  .route("/")
  .get(protect, getAll)
  .post(protect, authorize("admin"), logAudit("create", "holiday"), create);

router
  .route("/:id")
  .put(protect, authorize("admin"), logAudit("update", "holiday"), update)
  .delete(
    protect,
    authorize("admin"),
    logAudit("delete", "holiday"),
    deleteHoliday,
  );

module.exports = router;
