const { Readable } = require("node:stream");
const csv = require("csv-parser");

const MAX_CSV_ROWS = 500;

const parseCsvBuffer = (buffer, { maxRows = MAX_CSV_ROWS } = {}) =>
  new Promise((resolve, reject) => {
    const rows = [];
    let settled = false;
    const text = Buffer.from(buffer || "").toString("utf8").replace(/^\uFEFF/, "");
    const stream = Readable.from(text);
    const parser = csv();

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    parser
      .on("data", (row) => {
        if (settled) return;
        if (rows.length >= maxRows) {
          const error = new Error(`CSV files are limited to ${maxRows} rows`);
          error.statusCode = 413;
          fail(error);
          parser.destroy();
          return;
        }
        rows.push(row);
      })
      .on("error", fail)
      .on("end", () => {
        if (settled) return;
        settled = true;
        resolve(rows);
      });

    stream.on("error", fail);
    stream.pipe(parser);
  });

const escapeCsvValue = (value) => {
  const text = String(value ?? "");
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(guarded)
    ? `"${guarded.replace(/"/g, '""')}"`
    : guarded;
};

module.exports = { MAX_CSV_ROWS, escapeCsvValue, parseCsvBuffer };
