const sensitiveField = /password|token|secret|api[-_]?key|authorization/i;

const sanitizeAuditData = (value) => {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date || Buffer.isBuffer(value) || value._bsontype) {
    return value;
  }
  if (typeof value.toObject === "function") {
    return sanitizeAuditData(value.toObject());
  }
  if (Array.isArray(value)) return value.map(sanitizeAuditData);

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !sensitiveField.test(key))
      .map(([key, entry]) => [key, sanitizeAuditData(entry)]),
  );
};

module.exports = { sanitizeAuditData };
