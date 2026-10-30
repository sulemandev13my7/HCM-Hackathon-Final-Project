const { isProduction } = require("../config/env");

const SESSION_COOKIE_NAME = "hcm_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_MS,
});

const setSessionCookie = (res, token) => {
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
};

const clearSessionCookie = (res) => {
  const { maxAge, ...options } = sessionCookieOptions();
  res.clearCookie(SESSION_COOKIE_NAME, options);
};

module.exports = {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  setSessionCookie,
};
