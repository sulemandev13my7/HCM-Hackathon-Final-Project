const { isValidDateRange } = require("./dateTime");

const isValidCorrectionRequest = ({ date, checkIn, checkOut, reason = "" }) => {
  if (
    !isValidDateRange(date, date) ||
    typeof reason !== "string" ||
    !reason.trim() ||
    (!checkIn && !checkOut)
  ) {
    return false;
  }

  return [checkIn, checkOut]
    .filter(Boolean)
    .every((value) => Number.isFinite(new Date(value).getTime()));
};

module.exports = { isValidCorrectionRequest };
