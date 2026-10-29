require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { validateEnv } = require("./config/env");
const apiLimiter = require("./middleware/apiRateLimit");
const requestContext = require("./middleware/requestContext");
const { buildErrorResponse } = require("./utils/errorResponse");

validateEnv();

const app = express();

if (
  process.env.TRUST_PROXY === "1" ||
  process.env.TRUST_PROXY === "true" ||
  process.env.RENDER ||
  process.env.NODE_ENV === "production"
) {
  app.set("trust proxy", 1);
}

// Connect DB
connectDB();

const normalizeOrigin = (value) => {
  const trimmed = String(value).trim();
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
};

const configuredOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGINS,
]
  .filter(Boolean)
  .flatMap((value) => String(value).split(","))
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = [
  ...new Set([
    ...configuredOrigins,
    "http://localhost:5173",
    "http://localhost:5174",
  ]),
];

const requireTrustedOrigin = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
    next();
    return;
  }

  res.status(403).json({ message: "Request origin is not allowed" });
};

// Middleware
app.disable("x-powered-by");
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    maxAge: 600,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(requestContext);
morgan.token("request-id", (req) => req.id);
app.use(
  morgan(
    process.env.NODE_ENV === "production"
      ? ':remote-addr - :request-id ":method :url" :status :response-time ms'
      : "dev",
  ),
);
app.use(requireTrustedOrigin);
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/departments", require("./routes/departments"));
app.use("/api/designations", require("./routes/designations"));
app.use("/api/leave-types", require("./routes/leaveTypes"));
app.use("/api/holidays", require("./routes/holidays"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api/employees/import", require("./routes/employeeImport"));
app.use("/api/attendance", require("./routes/attendance"));
app.use(
  "/api/attendance-corrections",
  require("./routes/attendanceCorrections"),
);
app.use("/api/leave", require("./routes/leave"));
app.use("/api/payroll", require("./routes/payroll"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/audit-logs", require("./routes/auditLogs"));

app.get("/api/health", async (req, res) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    res.status(503).json({
      status: "degraded",
      message: "Database connection is not ready",
    });
    return;
  }

  try {
    await mongoose.connection.db.admin().ping();
    res.json({ status: "ok", database: "ok", message: "HCM Lite API running" });
  } catch {
    res.status(503).json({
      status: "degraded",
      message: "Database ping failed",
    });
  }
});

app.use((err, req, res, next) => {
  if (err.name === "MulterError" || err.code === "LIMIT_FILE_SIZE") {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Uploaded file is larger than 1 MB"
          : err.message,
    });
    return;
  }

  if (err.type === "entity.parse.failed") {
    res.status(400).json({ message: "Request body contains invalid JSON" });
    return;
  }

  const status =
    err.statusCode ||
    (String(err.message || "").includes("not allowed by CORS") ? 403 : 500);
  if (status >= 500) {
    console.error(err.stack);
    return res
      .status(status)
      .json(buildErrorResponse(err, process.env.NODE_ENV));
  }

  res.status(status).json({ message: err.message || "Request failed" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
