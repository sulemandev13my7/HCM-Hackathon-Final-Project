const multer = require("multer");

const MAX_CSV_BYTES = 1024 * 1024;
const CSV_MIME_TYPES = new Set([
  "application/csv",
  "application/octet-stream",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
]);

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_CSV_BYTES,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const fileName = String(file.originalname || "").toLowerCase();
    if (!fileName.endsWith(".csv") || !CSV_MIME_TYPES.has(file.mimetype)) {
      const error = new Error("Upload a CSV file up to 1 MB");
      error.statusCode = 415;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

module.exports = { csvUpload, MAX_CSV_BYTES };
