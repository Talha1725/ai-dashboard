import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, "..", "public", "templates");

if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// 1. Generate Profit & Loss Template
const profitData = [
  ["Profit & Loss Statement", ""],
  ["", ""],
  ["Revenue", "100000"],
  ["Cost of Goods Sold", "40000"],
  ["Gross Profit", "60000"],
  ["", ""],
  ["Operating Expenses", "20000"],
  ["Net Profit", "40000"],
];

const profitWs = XLSX.utils.aoa_to_sheet(profitData);
const profitWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(profitWb, profitWs, "P&L");
XLSX.writeFile(profitWb, path.join(templatesDir, "profit_template.xlsx"));

// 2. Generate Unpaid Invoices Template
const invoicesData = [
  ["Customer Name", "Amount", "Due Date", "Invoice Number"],
  ["Acme Corp", "5000", "2024-06-30", "INV-1001"],
  ["Stark Industries", "12500", "2024-07-15", "INV-1002"],
  ["Wayne Enterprises", "300", "2024-06-25", "INV-1003"],
];

const invoicesWs = XLSX.utils.aoa_to_sheet(invoicesData);
const invoicesWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(invoicesWb, invoicesWs, "Invoices");
XLSX.writeFile(invoicesWb, path.join(templatesDir, "invoices_template.xlsx"));

console.log("Templates generated successfully in public/templates!");
