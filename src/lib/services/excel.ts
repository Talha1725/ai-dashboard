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
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  let netProfit: number | null = null;
  let grossProfit: number | null = null;
  let revenue: number | null = null;

  for (const row of rows) {
    const values = Object.values(row).map(v => String(v).trim().toLowerCase());
    const originalValues = Object.values(row);

    const revenueIndex = values.findIndex(v => v.includes("revenue") || v.includes("sales"));
    if (revenueIndex !== -1 && revenue === null) {
      const amountValue = originalValues.slice(revenueIndex + 1).find(v => parseAmount(v) !== null);
      if (amountValue !== undefined) revenue = parseAmount(amountValue);
    }

    const netProfitIndex = values.findIndex(v => v.includes("net profit"));
    if (netProfitIndex !== -1 && netProfit === null) {
      const amountValue = originalValues.slice(netProfitIndex + 1).find(v => parseAmount(v) !== null);
      if (amountValue !== undefined) netProfit = parseAmount(amountValue);
    }

    const grossProfitIndex = values.findIndex(v => v.includes("gross profit"));
    if (grossProfitIndex !== -1 && grossProfit === null) {
      const amountValue = originalValues.slice(grossProfitIndex + 1).find(v => parseAmount(v) !== null);
      if (amountValue !== undefined) grossProfit = parseAmount(amountValue);
    }
  }

  if (netProfit === null || grossProfit === null || revenue === null) {
    throw new Error("Could not find Revenue, Net Profit, and Gross Profit values in the workbook.");
  }

  return { netProfit, grossProfit, revenue };
}

export function parseInvoicesWorkbook(buffer: Buffer): ParsedInvoice[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    throw new Error("The uploaded workbook does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[firstSheet];
  
  // Use header: 1 to find where the actual headers start if needed, or assume first row are headers
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  const invoices: ParsedInvoice[] = [];

  for (const row of rows) {
    const getVal = (keys: string[]) => {
      const foundKey = Object.keys(row).find(k => keys.some(key => k.toLowerCase().includes(key)));
      return foundKey ? String(row[foundKey]).trim() : "";
    };

    const customerName = getVal(["customer", "client", "name"]);
    const amountStr = getVal(["amount", "total", "balance", "due"]);
    const dueDate = getVal(["due", "date"]);
    const invoiceNumber = getVal(["invoice", "inv", "number", "ref"]);

    const amount = parseAmount(amountStr);

    // If we have a valid amount and a customer name, treat it as a valid row
    if (amount !== null && customerName) {
      invoices.push({
        customerName,
        amount,
        dueDate,
        invoiceNumber,
      });
    }
  }

  if (invoices.length === 0) {
    throw new Error("No valid invoice rows could be parsed from the workbook.");
  }

  return invoices;
}

