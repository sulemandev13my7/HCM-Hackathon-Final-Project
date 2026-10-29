const test = require("node:test");
const assert = require("node:assert/strict");
const { isProductionDatabase } = require("../config/env");
const {
  PASSWORD_REQUIREMENT,
  isValidNewPassword,
} = require("../utils/passwordPolicy");
const { escapeCsvValue, parseCsvBuffer } = require("../utils/csv");
const { parsePagination } = require("../utils/pagination");

test("production database detection recognises Atlas hostnames", () => {
  assert.equal(
    isProductionDatabase("mongodb+srv://user:pass@cluster.mongodb.net/db"),
    true,
  );
  assert.equal(isProductionDatabase("mongodb://127.0.0.1:27017/hcm"), false);
  assert.equal(isProductionDatabase(""), false);
});

test("password policy requires 12 characters and mixed character classes", () => {
  assert.equal(isValidNewPassword("Short1!"), false);
  assert.equal(isValidNewPassword("alllowercase1!"), false);
  assert.equal(isValidNewPassword("ALLUPPERCASE1!"), false);
  assert.equal(isValidNewPassword("NoNumberHere!"), false);
  assert.equal(isValidNewPassword("NoSymbolHere1"), false);
  assert.equal(isValidNewPassword("ValidPass123!"), true);
  assert.match(PASSWORD_REQUIREMENT, /at least 12/);
});

test("CSV values escape quotes, commas and spreadsheet formulas", () => {
  assert.equal(escapeCsvValue("plain"), "plain");
  assert.equal(escapeCsvValue("a,b"), '"a,b"');
  assert.equal(escapeCsvValue('He said "hi"'), '"He said ""hi"""');
  assert.equal(escapeCsvValue("=cmd()"), "'=cmd()");
  assert.equal(escapeCsvValue("@import"), "'@import");
});

test("CSV parser strips BOM and enforces the row limit", async () => {
  const rows = await parseCsvBuffer(
    Buffer.from("\uFEFFfirstName,lastName\nAda,Lovelace\n"),
  );
  assert.deepEqual(rows, [{ firstName: "Ada", lastName: "Lovelace" }]);

  await assert.rejects(
    parseCsvBuffer(Buffer.from("a\n1\n2\n3\n"), { maxRows: 2 }),
    /limited to 2 rows/,
  );
});

test("pagination clamps invalid and oversized limits", () => {
  assert.deepEqual(parsePagination(undefined, undefined), {
    page: 1,
    limit: 30,
  });
  assert.deepEqual(parsePagination("-4", "5000", { maxLimit: 100 }), {
    page: 1,
    limit: 100,
  });
  assert.deepEqual(parsePagination("3", "25"), { page: 3, limit: 25 });
});
