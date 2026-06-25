import * as XLSX from "xlsx";

import type { ParsedCashflowWeek, ParsedProfit, ParsedInvoice } from "@/types/excel";

function parseAmount(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const textValue = String(value ?? "").trim();
  const isWrappedNegative = /^\(.+\)$/.test(textValue);
  const normalized = textValue.replace(/[$,\s()]/g, "");

  if (!normalized || normalized === "-") {
    return null;
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount)) {
    return null;
  }

  return isWrappedNegative ? -amount : amount;
}

function isBlankRow(row: unknown[]) {
  return row.every((value) => String(value ?? "").trim().length === 0);
}

function normalizeLabel(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function findAmountAfterLabel(row: unknown[], labelIndex: number) {
  for (const value of row.slice(labelIndex + 1)) {
    const amount = parseAmount(value);

    if (amount !== null) {
      return amount;
    }
  }

  return null;
}

function formatWeekLabel(value: unknown) {
  const label = String(value ?? "").trim();
  return label.length > 0 ? label : null;
}

function parseClientBudgetRows(rows: unknown[][]): ParsedCashflowWeek[] {
  const weekRow = rows.find((row) =>
    row.some((value) => String(value).toLowerCase().includes("week ended"))
  );
  const bankBalanceRow = rows.find((row) =>
    row.some((value) => String(value).toLowerCase().includes("bank balance"))
  );

  if (!weekRow || !bankBalanceRow) {
    return [];
  }

  const weekLabels = weekRow.map(formatWeekLabel).filter((label): label is string => Boolean(label));
  const bankBalanceLabelIndex = bankBalanceRow.findIndex((value) =>
    String(value).toLowerCase().includes("bank balance")
  );
  const bankBalances = bankBalanceRow
    .slice(Math.max(bankBalanceLabelIndex + 1, 0))
    .map(parseAmount)
    .filter((amount): amount is number => amount !== null);

  const labels = weekLabels
    .filter((label) => !label.toLowerCase().includes("week ended"))
    .slice(bankBalances.length > 4 ? 1 : 0);
  const amounts = bankBalances.slice(bankBalances.length > 4 ? 1 : 0);

  return amounts.slice(0, 4).map((amount, index) => ({
    label: labels[index] ? `Week ending ${labels[index]}` : `Week ${index + 1}`,
    amount,
  }));
}

function parseGenericCashflowRows(rows: Record<string, unknown>[]): ParsedCashflowWeek[] {
  return rows
    .map((row, index) => {
      const values = Object.values(row);
      const labelValue = values.find((value) => String(value).trim().length > 0);
      const amountValue = values.find((value) => parseAmount(value) !== null);
      const amount = parseAmount(amountValue);

      if (amount === null) {
        return null;
      }

      return {
        label: String(labelValue || `Week ${index + 1}`),
        amount,
      };
    })
    .filter((week): week is ParsedCashflowWeek => week !== null)
    .slice(0, 4);
}

function isKnownNonCashflowReport(rows: unknown[][]) {
  const reportText = rows
    .slice(0, 10)
    .flat()
    .map((value) => String(value ?? "").trim().toLowerCase())
    .join(" ");

  return reportText.includes("profit and loss report") || reportText.includes("unpaid invoices report");
}

export function parseCashflowWorkbook(buffer: Buffer): ParsedCashflowWeek[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    throw new Error("The uploaded workbook does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[firstSheet];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    blankrows: false,
    defval: "",
    header: 1,
    raw: false,
  });

  const clientBudgetWeeks = parseClientBudgetRows(rawRows);
  if (clientBudgetWeeks.length > 0) {
    return clientBudgetWeeks;
  }

  if (isKnownNonCashflowReport(rawRows)) {
    throw new Error("This file is not a cashflow workbook. Use the correct upload button.");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  const weeks = parseGenericCashflowRows(rows);

  if (weeks.length === 0) {
    throw new Error("No cashflow week values could be parsed from the workbook.");
  }

  return weeks;
}

export function parseProfitWorkbook(buffer: Buffer): ParsedProfit {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    throw new Error("The uploaded workbook does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[firstSheet];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    blankrows: false,
    defval: "",
    header: 1,
    raw: false,
  });

  let netProfit: number | null = null;
  let grossProfit: number | null = null;
  let revenue: number | null = null;

  for (const row of rawRows) {
    const labels = row.map(normalizeLabel);

    for (const [index, label] of labels.entries()) {
      if ((label === "total income" || label === "revenue") && revenue === null) {
        revenue = findAmountAfterLabel(row, index);
      }

      if (label === "net profit" && netProfit === null) {
        netProfit = findAmountAfterLabel(row, index);
      }

      if (label === "gross profit" && grossProfit === null) {
        grossProfit = findAmountAfterLabel(row, index);
      }
    }
  }

  if (revenue === null) {
    for (const row of rawRows) {
      const salesIndex = row.map(normalizeLabel).findIndex((label) => label === "sales");

      if (salesIndex !== -1) {
        revenue = findAmountAfterLabel(row, salesIndex);
        break;
      }
    }
  }

  if (netProfit === null || grossProfit === null || revenue === null) {
    throw new Error("Could not find Revenue, Net Profit, and Gross Profit values in the workbook.");
  }

  return { netProfit, grossProfit, revenue };
}

function parseMyobUnpaidInvoiceRows(rows: unknown[][]): ParsedInvoice[] {
  const invoices: ParsedInvoice[] = [];
  let currentCustomer = "";
  let invoiceNumberIndex = -1;
  let amountIndex = -1;
  let dueDateIndex = -1;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const firstCell = String(row[0] ?? "").trim();
    const normalizedFirstCell = firstCell.toLowerCase();
    const nextFirstCell = String(rows[rowIndex + 1]?.[0] ?? "").trim().toLowerCase();

    if (
      firstCell &&
      normalizedFirstCell !== "total" &&
      normalizedFirstCell !== "ageing percent" &&
      normalizedFirstCell !== "reference number" &&
      nextFirstCell === "reference number"
    ) {
      currentCustomer = firstCell;
      continue;
    }

    if (normalizedFirstCell === "reference number") {
      const labels = row.map(normalizeLabel);
      invoiceNumberIndex = 0;
      amountIndex = labels.findIndex((label) => label.includes("total due"));
      dueDateIndex = labels.findIndex((label) => label.includes("due date"));
      continue;
    }

    if (
      !currentCustomer ||
      isBlankRow(row) ||
      normalizedFirstCell === "total" ||
      normalizedFirstCell === "ageing percent"
    ) {
      continue;
    }

    const amount = amountIndex >= 0 ? parseAmount(row[amountIndex]) : null;
    const invoiceNumber = String(row[invoiceNumberIndex] ?? "").trim();
    const dueDate = dueDateIndex >= 0 ? String(row[dueDateIndex] ?? "").trim() : "";

    if (amount !== null && invoiceNumber && dueDate) {
      invoices.push({
        amount,
        customerName: currentCustomer,
        dueDate,
        invoiceNumber,
      });
    }
  }

  return invoices;
}

function parseGenericInvoiceRows(rows: Record<string, unknown>[]): ParsedInvoice[] {
  const invoices: ParsedInvoice[] = [];

  for (const row of rows) {
    const getVal = (keys: string[]) => {
      const foundKey = Object.keys(row).find((key) =>
        keys.some((searchKey) => key.toLowerCase().includes(searchKey))
      );

      return foundKey ? String(row[foundKey]).trim() : "";
    };

    const customerName = getVal(["customer", "client", "name"]);
    const amountStr = getVal(["amount", "total", "balance", "due"]);
    const dueDate = getVal(["due", "date"]);
    const invoiceNumber = getVal(["invoice", "inv", "number", "ref"]);
    const amount = parseAmount(amountStr);

    if (amount !== null && customerName) {
      invoices.push({
        customerName,
        amount,
        dueDate,
        invoiceNumber,
      });
    }
  }

  return invoices;
}

export function parseInvoicesWorkbook(buffer: Buffer): ParsedInvoice[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    throw new Error("The uploaded workbook does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[firstSheet];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    blankrows: false,
    defval: "",
    header: 1,
    raw: false,
  });
  const myobInvoices = parseMyobUnpaidInvoiceRows(rawRows);

  if (myobInvoices.length > 0) {
    return myobInvoices;
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });
  const invoices = parseGenericInvoiceRows(rows);

  if (invoices.length === 0) {
    throw new Error("No valid invoice rows could be parsed from the workbook.");
  }

  return invoices;
}
