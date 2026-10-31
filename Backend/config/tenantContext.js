const { AsyncLocalStorage } = require("node:async_hooks");

const storage = new AsyncLocalStorage();

const runWithTenant = (companyId, fn) =>
  storage.run({ companyId: String(companyId) }, fn);

const getTenantId = () => storage.getStore()?.companyId || null;

module.exports = { getTenantId, runWithTenant };
