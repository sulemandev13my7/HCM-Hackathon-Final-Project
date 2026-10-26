const AuditLog = require("../models/AuditLog");
const { sanitizeAuditData } = require("../utils/auditSerialization");

const auditModels = {
  user: require("../models/User"),
  employee: require("../models/Employee"),
  attendance_correction: require("../models/AttendanceCorrection"),
  leave: require("../models/LeaveRequest"),
  payroll_run: require("../models/PayrollRun"),
  company_settings: require("../models/CompanySettings"),
  department: require("../models/Department"),
  designation: require("../models/Designation"),
  leave_type: require("../models/LeaveType"),
  holiday: require("../models/Holiday"),
  announcement: require("../models/Announcement"),
};

exports.logAudit = (action, entity) => {
  return async (req, res, next) => {
    try {
      const model = auditModels[entity];
      if (model && req.params.id) {
        req.auditBefore = await model.findById(req.params.id).lean();
      } else if (entity === "company_settings") {
        req.auditBefore = await model.findOne().lean();
      }
    } catch {
      req.auditBefore = undefined;
    }

    const originalSend = res.json;
    res.json = function (data) {
      if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
        const safeData = sanitizeAuditData(data);
        AuditLog.create({
          actor: req.user._id,
          actorRole: req.user.role,
          action,
          entity,
          entityId: safeData?._id || safeData?.id || req.params.id,
          before: sanitizeAuditData(req.auditBefore),
          after: safeData,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        }).catch((err) => console.error("Audit log error:", err));
      }
      originalSend.call(res, data);
    };
    next();
  };
};
