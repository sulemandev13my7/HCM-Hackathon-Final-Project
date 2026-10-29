const crypto = require("node:crypto");

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,128}$/;

const requestContext = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  req.id =
    typeof incoming === "string" && REQUEST_ID_PATTERN.test(incoming)
      ? incoming
      : crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
};

module.exports = requestContext;
