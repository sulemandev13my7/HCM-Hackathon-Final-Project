const test = require("node:test");
const assert = require("node:assert/strict");

const { getTenantId, runWithTenant } = require("../config/tenantContext");
const { isTransactionUnsupported } = require("../utils/transactions");
const tenantPlugin = require("../utils/tenantPlugin");
const authController = require("../controllers/authController");

const tenantModels = {
  AiLog: require("../models/AiLog"),
  Announcement: require("../models/Announcement"),
  Attendance: require("../models/Attendance"),
  AttendanceCorrection: require("../models/AttendanceCorrection"),
  AuditLog: require("../models/AuditLog"),
  Department: require("../models/Department"),
  Designation: require("../models/Designation"),
  Employee: require("../models/Employee"),
  Holiday: require("../models/Holiday"),
  LeaveBalance: require("../models/LeaveBalance"),
  LeaveRequest: require("../models/LeaveRequest"),
  LeaveType: require("../models/LeaveType"),
  Notification: require("../models/Notification"),
  PayrollRun: require("../models/PayrollRun"),
  SalaryStructure: require("../models/SalaryStructure"),
};

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("tenant context isolates concurrent asynchronous work", async () => {
  const seen = [];
  await Promise.all(
    ["company-a", "company-b", "company-c"].map((companyId) =>
      runWithTenant(companyId, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        seen.push(getTenantId());
      }),
    ),
  );

  assert.deepEqual(seen.sort(), ["company-a", "company-b", "company-c"]);
});

test("tenant context does not leak outside its callback", async () => {
  assert.equal(getTenantId(), null);
  const inside = await runWithTenant("company-a", async () => getTenantId());
  assert.equal(inside, "company-a");
  assert.equal(getTenantId(), null);
});

test("every tenant-owned model requires a company reference", () => {
  for (const [name, model] of Object.entries(tenantModels)) {
    const company = model.schema.path("company");
    assert.ok(company, `${name} must have a company path`);
    assert.equal(company.options.required, true, `${name} company is required`);
    assert.equal(
      company.options.ref,
      "CompanySettings",
      `${name} company must reference CompanySettings`,
    );
  }
});

test("tenant query scope intersects an explicit company filter", () => {
  const requestedCompany = "507f1f77bcf86cd799439011";
  const activeCompany = "507f1f77bcf86cd799439012";
  const query = {
    filter: { company: requestedCompany, name: "Finance" },
    getFilter() {
      return this.filter;
    },
    setQuery(filter) {
      this.filter = filter;
    },
  };

  runWithTenant(activeCompany, () => tenantPlugin.addTenantFilter(query));

  assert.deepEqual(query.filter, {
    $and: [
      { company: requestedCompany, name: "Finance" },
      { company: activeCompany },
    ],
  });
});

test("tenant aggregation scope is added even when the pipeline has a company match", () => {
  const requestedCompany = "507f1f77bcf86cd799439011";
  const activeCompany = "507f1f77bcf86cd799439012";
  const pipeline = [{ $match: { company: requestedCompany } }];

  tenantPlugin.addTenantMatch(pipeline, activeCompany);

  assert.equal(pipeline.length, 2);
  assert.equal(String(pipeline[0].$match.company), activeCompany);
  assert.deepEqual(pipeline[1], { $match: { company: requestedCompany } });
});

test("tenant aggregation keeps $geoNear first and scopes its query", () => {
  const pipeline = [{ $geoNear: { near: { type: "Point", coordinates: [0, 0] } } }];
  const activeCompany = "507f1f77bcf86cd799439012";

  tenantPlugin.addTenantMatch(pipeline, activeCompany);

  assert.equal(pipeline.length, 1);
  assert.equal(String(pipeline[0].$geoNear.query.company), activeCompany);
});

test("tenant updates cannot change the company owner", () => {
  const query = {
    update: {
      $set: { name: "Finance", company: "attacker-company" },
      $rename: { departmentId: "company", companyId: "companyId" },
    },
    getUpdate() {
      return this.update;
    },
    getOptions() {
      return {};
    },
    setUpdate(update) {
      this.update = update;
    },
  };

  tenantPlugin.sanitizeTenantUpdate(query, "active-company");

  assert.deepEqual(query.update, {
    $set: { name: "Finance" },
    $rename: { companyId: "companyId" },
  });
});

test("tenant update pipelines are rejected", () => {
  assert.throws(
    () =>
      tenantPlugin.sanitizeTenantUpdate(
        {
          getUpdate: () => [{ $set: { company: "other" } }],
        },
        "active-company",
      ),
    /update pipelines are not supported/i,
  );
});

test("tenant replacement writes keep the authenticated company", () => {
  const query = {
    replacement: { name: "Finance", company: "attacker-company" },
    getUpdate() {
      return this.replacement;
    },
    setUpdate(replacement) {
      this.replacement = replacement;
    },
  };

  tenantPlugin.sanitizeReplacement(query, "active-company");

  assert.deepEqual(query.replacement, {
    name: "Finance",
    company: "active-company",
  });
});

test("transaction fallback recognises standalone retryable-write errors", () => {
  assert.equal(
    isTransactionUnsupported(
      new Error(
        "This MongoDB deployment does not support retryable writes. Please add retryWrites=false to your connection string.",
      ),
    ),
    true,
  );
  assert.equal(isTransactionUnsupported(new Error("duplicate key")), false);
});

test("signup rejects missing workspace fields without persistence", async () => {
  const res = response();
  await authController.signup({ body: { companyName: "" } }, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /company name/i);
});

test("signup requires the workspace owner's first name", async () => {
  const res = response();
  await authController.signup(
    {
      body: {
        companyName: "Acme Workspace",
        email: "admin@acme.test",
        password: "StrongPassword123!",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /first name/i);
});

test("signup rejects weak passwords without persistence", async () => {
  const res = response();
  await authController.signup(
    {
      body: {
        companyName: "Acme Workspace",
        firstName: "Ayesha",
        email: "admin@acme.test",
        password: "weak",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /12 characters/i);
});

test("signup validates email format before persistence", async () => {
  const res = response();
  await authController.signup(
    {
      body: {
        companyName: "Acme Workspace",
        firstName: "Ayesha",
        email: "not-an-email",
        password: "StrongPassword123!",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /valid work email/i);
});

test("public setup status never asks for first-run takeover", async () => {
  const res = response();
  await authController.checkFirstRun({}, res);

  assert.deepEqual(res.body, {
    needsSetup: false,
    setupComplete: true,
    signupEnabled: true,
  });
});
