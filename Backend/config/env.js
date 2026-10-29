const PRODUCTION_DB_PATTERN = /(mongodb\+srv:\/\/|\.mongodb\.net)/i;

const isProductionDatabase = (uri) =>
  PRODUCTION_DB_PATTERN.test(String(uri || ""));

const validateEnv = () => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const mongoUri = process.env.MONGO_URI || "";

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  if (nodeEnv === "production") {
    if (!mongoUri) {
      throw new Error("MONGO_URI is required in production");
    }
    if (process.env.JWT_SECRET.length < 32) {
      console.warn(
        "JWT_SECRET is shorter than 32 characters; rotate it to a stronger secret.",
      );
    }
    return;
  }

  if (
    isProductionDatabase(mongoUri) &&
    process.env.ALLOW_PRODUCTION_DB_IN_DEVELOPMENT !== "true"
  ) {
    throw new Error(
      "Refusing to start: MONGO_URI points at a production Atlas database while NODE_ENV is not production. Use a local database or set ALLOW_PRODUCTION_DB_IN_DEVELOPMENT=true explicitly.",
    );
  }
};

module.exports = { isProductionDatabase, validateEnv };
