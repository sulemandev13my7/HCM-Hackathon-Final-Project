const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REQUIREMENT =
  "Password must be at least 12 characters and include upper and lowercase letters, a number, and a symbol";

const isValidNewPassword = (password) =>
  typeof password === "string" &&
  password.length >= PASSWORD_MIN_LENGTH &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENT,
  isValidNewPassword,
};
