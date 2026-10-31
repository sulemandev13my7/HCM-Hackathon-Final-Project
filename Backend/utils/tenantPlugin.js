const mongoose = require("mongoose");
const { getTenantId } = require("../config/tenantContext");

const addTenantFilter = (query) => {
  const tenantId = getTenantId();
  if (!tenantId) return;

  const filter = query.getFilter() || {};
  query.setQuery({
    $and: [filter, { company: tenantId }],
  });
};

const sanitizeUpdate = (query, tenantId) => {
  const update = query.getUpdate();
  if (!update || Array.isArray(update)) return;

  const hasOperators = Object.keys(update).some((key) => key.startsWith("$"));
  const normalized = hasOperators ? { ...update } : { $set: { ...update } };

  const isCompanyPath = (path) =>
    path === "company" || path.startsWith("company.");

  for (const [operator, values] of Object.entries(normalized)) {
    if (!values || typeof values !== "object" || Array.isArray(values)) continue;

    const safeValues = { ...values };
    for (const [path, value] of Object.entries(safeValues)) {
      if (
        isCompanyPath(path) ||
        (operator === "$rename" && typeof value === "string" && isCompanyPath(value))
      ) {
        delete safeValues[path];
      }
    }
    if (Object.keys(safeValues).length) normalized[operator] = safeValues;
    else delete normalized[operator];
  }

  if (query.getOptions().upsert) {
    normalized.$setOnInsert = {
      ...(normalized.$setOnInsert || {}),
      company: tenantId,
    };
  }

  query.setUpdate(normalized);
};

const addTenantMatch = (pipeline, tenantId) => {
  const tenantMatch = { company: new mongoose.Types.ObjectId(tenantId) };
  if (pipeline[0]?.$geoNear) {
    const geoNear = pipeline[0].$geoNear;
    geoNear.query = geoNear.query
      ? { $and: [geoNear.query, tenantMatch] }
      : tenantMatch;
    return;
  }
  pipeline.unshift({ $match: tenantMatch });
};

const assertSupportedUpdate = (update) => {
  if (Array.isArray(update)) {
    throw new Error("Tenant-scoped update pipelines are not supported");
  }
};

const sanitizeTenantUpdate = (query, tenantId) => {
  assertSupportedUpdate(query.getUpdate());
  sanitizeUpdate(query, tenantId);
};

const sanitizeReplacement = (query, tenantId) => {
  const replacement = query.getUpdate();
  if (!replacement || Array.isArray(replacement)) return;
  query.setUpdate({ ...replacement, company: tenantId });
};

const tenantPlugin = (schema) => {
  schema.add({
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanySettings",
      required: true,
      index: true,
    },
  });

  schema.pre("validate", function () {
    const tenantId = getTenantId();
    if (tenantId) this.company = tenantId;
  });

  schema.pre("insertMany", function (docs) {
    const tenantId = getTenantId();
    if (!tenantId) return;

    const items = Array.isArray(docs) ? docs : [docs];
    items.filter(Boolean).forEach((doc) => {
      doc.company = tenantId;
    });
  });

  schema.pre(/^find/, function () {
    addTenantFilter(this);
  });

  schema.pre(/^update/, function () {
    addTenantFilter(this);
    const tenantId = getTenantId();
    if (!tenantId) return;
    sanitizeTenantUpdate(this, tenantId);
  });

  schema.pre(/^findOneAndUpdate$/, function () {
    const tenantId = getTenantId();
    if (tenantId) sanitizeTenantUpdate(this, tenantId);
  });

  schema.pre(/^(replaceOne|findOneAndReplace)$/, function () {
    addTenantFilter(this);
    const tenantId = getTenantId();
    if (tenantId) sanitizeReplacement(this, tenantId);
  });

  schema.pre(/^delete/, function () {
    addTenantFilter(this);
  });

  schema.pre(/^count/, function () {
    addTenantFilter(this);
  });

  schema.pre("distinct", function () {
    addTenantFilter(this);
  });

  schema.pre("exists", function () {
    addTenantFilter(this);
  });

  schema.pre("aggregate", function () {
    const tenantId = getTenantId();
    if (!tenantId) return;

    addTenantMatch(this.pipeline(), tenantId);
  });
};

module.exports = tenantPlugin;
module.exports.addTenantFilter = addTenantFilter;
module.exports.addTenantMatch = addTenantMatch;
module.exports.sanitizeUpdate = sanitizeUpdate;
module.exports.assertSupportedUpdate = assertSupportedUpdate;
module.exports.sanitizeReplacement = sanitizeReplacement;
module.exports.sanitizeTenantUpdate = sanitizeTenantUpdate;
