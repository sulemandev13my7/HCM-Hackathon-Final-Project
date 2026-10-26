const express = require("express");
const router = express.Router();
const {
  getAll,
  create,
  update,
  delete: deleteDesig,
} = require("../controllers/desigController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router
  .route("/")
  .get(protect, authorize("admin", "hr"), getAll)
  .post(protect, authorize("admin"), logAudit("create", "designation"), create);

router
  .route("/:id")
  .put(protect, authorize("admin"), logAudit("update", "designation"), update)
  .delete(
    protect,
    authorize("admin"),
    logAudit("delete", "designation"),
    deleteDesig,
  );

module.exports = router;
