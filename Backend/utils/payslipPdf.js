const PDFDocument = require("pdfkit");

const createPayslipPdf = (run, employee, item) =>
  new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.fontSize(20).text("PAYSLIP", { align: "center" });
    document.moveDown();
    document.fontSize(11).text(`Period: ${run.month}/${run.year}`);
    document.text(
      `Employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`,
    );
    document.text(`Working days: ${run.workingDays}`);
    document.moveDown();
    document.fontSize(14).text("Earnings");
    document.fontSize(11).text(`Basic salary: Rs ${item.basic}`);
    document.text(`Gross pay: Rs ${item.gross}`);
    document.moveDown();
    document.fontSize(14).text("Deductions");
    document.fontSize(11).text(`Absent days: ${item.absentDays || 0}`);
    document.text(`Unpaid leave days: ${item.unpaidLeaveDays || 0}`);
    document.text(`Half days: ${item.halfDays || 0}`);
    document.text(`Tax: Rs ${item.tax || 0}`);
    document.text(`Total deductions: Rs ${item.deductions || 0}`);
    document.moveDown();
    document.fontSize(16).text(`Net pay: Rs ${item.netPay}`);
    document.end();
  });

module.exports = { createPayslipPdf };
