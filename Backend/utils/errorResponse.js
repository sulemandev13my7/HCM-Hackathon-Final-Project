const buildErrorResponse = (error, nodeEnv) => {
  if (nodeEnv === "development") {
    return {
      message: "Something went wrong!",
      error: error.message,
    };
  }

  return { message: "Internal server error" };
};

module.exports = { buildErrorResponse };
