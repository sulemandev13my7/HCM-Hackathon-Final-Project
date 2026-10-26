const crypto = require("node:crypto");

const generateTemporaryPassword = () => crypto.randomBytes(24).toString("hex");

module.exports = { generateTemporaryPassword };
