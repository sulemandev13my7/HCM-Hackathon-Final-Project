const parseDate = (value) => {
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00.000Z`)
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid date");
  }

  return date;
};

const startOfUTCDay = (value = new Date()) => {
  const date = parseDate(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

const toUTCDateOnly = (value) => startOfUTCDay(value);

const isValidDateRange = (startDate, endDate) => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    !datePattern.test(startDate) ||
    !datePattern.test(endDate)
  ) {
    return false;
  }

  try {
    const start = toUTCDateOnly(startDate);
    const end = toUTCDateOnly(endDate);
    return (
      start.toISOString().slice(0, 10) === startDate &&
      end.toISOString().slice(0, 10) === endDate &&
      start <= end
    );
  } catch {
    return false;
  }
};

const endOfUTCDayExclusive = (value) => {
  const endExclusive = startOfUTCDay(value);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return endExclusive;
};

const getUTCDateRange = (startDate, endDate) => {
  const start = startOfUTCDay(startDate);
  const endExclusive = endOfUTCDayExclusive(endDate);
  return { start, endExclusive };
};

const getUTCMonthRange = (year, month) => ({
  start: new Date(Date.UTC(year, month - 1, 1)),
  endExclusive: new Date(Date.UTC(year, month, 1)),
});

module.exports = {
  startOfUTCDay,
  toUTCDateOnly,
  isValidDateRange,
  endOfUTCDayExclusive,
  getUTCDateRange,
  getUTCMonthRange,
};
