import * as XLSX from "xlsx";

export type ParsedCashflowWeek = {
  label: string;
  amount: number;
};

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
