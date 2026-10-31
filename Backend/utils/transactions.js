const mongoose = require("mongoose");

const TRANSACTION_UNSUPPORTED_PATTERN =
  /transaction numbers are only allowed|replica set|mongos|does not support transactions|does not support retryable writes/i;

const isTransactionUnsupported = (error) =>
  TRANSACTION_UNSUPPORTED_PATTERN.test(String(error?.message || ""));

const runInTransaction = async (work) => {
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      return work(null);
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = { isTransactionUnsupported, runInTransaction };
