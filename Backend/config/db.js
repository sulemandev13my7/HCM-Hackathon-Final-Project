const mongoose = require('mongoose');
const dns = require('dns');

const connect = (uri) => mongoose.connect(uri);

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hcm-lite';
  const configuredDns = (process.env.DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (configuredDns.length) {
    dns.setServers(configuredDns);
  }

  try {
    const conn = await connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const srvDnsFailure =
      error.code === 'ECONNREFUSED' && uri.startsWith('mongodb+srv://');

    if (srvDnsFailure && !configuredDns.length) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn = await connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return;
      } catch (retryError) {
        console.error(`Error: ${retryError.message}`);
        process.exit(1);
      }
    }

    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
