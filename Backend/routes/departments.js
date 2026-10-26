const express = require("express");
const router = express.Router();
const {
  getAll,
  create,
  update,
  delete: deleteDept,
} = require("../controllers/deptController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router
  .route("/")
  .get(protect, authorize("admin", "hr"), getAll)
  .post(protect, authorize("admin"), logAudit("create", "department"), create);

router
  .route("/:id")
  .put(protect, authorize("admin"), logAudit("update", "department"), update)
  .delete(
    protect,
    authorize("admin"),
    logAudit("delete", "department"),
    deleteDept,
  );

module.exports = router;
