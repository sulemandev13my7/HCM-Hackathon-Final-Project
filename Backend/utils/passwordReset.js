const crypto = require("node:crypto");

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const PASSWORD_RESET_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

const hashPasswordResetToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

const isValidPasswordResetToken = (token) =>
  typeof token === "string" && PASSWORD_RESET_TOKEN_PATTERN.test(token);

const createPasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  };
};

module.exports = {
  PASSWORD_RESET_TTL_MS,
  createPasswordResetToken,
  hashPasswordResetToken,
  isValidPasswordResetToken,
};
