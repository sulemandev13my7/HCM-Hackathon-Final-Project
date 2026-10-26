const dns = require("dns");
const path = require("path");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const confirmed = process.argv.includes("--yes");

(async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 20000,
  });

  const db = mongoose.connection.db;
  const collections = (
    await db.listCollections({}, { nameOnly: true }).toArray()
  )
    .map((collection) => collection.name)
    .filter((name) => !name.startsWith("system."));

  const counts = {};
  for (const name of collections) {
    counts[name] = await db.collection(name).countDocuments();
  }

  console.log(`database=${db.databaseName}`);
  console.log(`counts=${JSON.stringify(counts)}`);

  if (!confirmed) {
    console.log("No changes made. Re-run with --yes to reset the workspace.");
    await mongoose.disconnect();
    return;
  }

  for (const name of collections) {
    await db.collection(name).deleteMany({});
  }

  for (const name of collections) {
    const remaining = await db.collection(name).countDocuments();
    if (remaining !== 0) {
      throw new Error(`Reset verification failed for ${name}`);
    }
  }

  console.log("workspace_reset=true");
  console.log("Open /setup to create the next workspace.");
  await mongoose.disconnect();
})().catch(async (error) => {
  console.error(`RESET_ERROR ${error.message}`);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
