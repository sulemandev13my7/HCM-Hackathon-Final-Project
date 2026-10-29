const parsePagination = (
  pageValue,
  limitValue,
  { defaultLimit = 30, maxLimit = 100 } = {},
) => {
  const parsedPage = Number.parseInt(pageValue, 10);
  const parsedLimit = Number.parseInt(limitValue, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, maxLimit)
      : defaultLimit;

  return { page, limit };
};

module.exports = { parsePagination };
