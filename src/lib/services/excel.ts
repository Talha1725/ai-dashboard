import * as XLSX from "xlsx";

export type ParsedCashflowWeek = {
  label: string;
  amount: number;
};

export function parseCashflowWorkbook(buffer: Buffer): ParsedCashflowWeek[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    throw new Error("The uploaded workbook does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  const weeks = rows
    .map((row, index) => {
      const values = Object.values(row);
      const labelValue = values.find((value) => String(value).trim().length > 0);
      const amountValue = values.find((value) => {
        if (typeof value === "number") {
          return Number.isFinite(value);
        }

        const normalized = String(value).replace(/[$,\s]/g, "");
        return normalized.length > 0 && Number.isFinite(Number(normalized));
      });

      const amount =
        typeof amountValue === "number"
          ? amountValue
          : Number(String(amountValue ?? "").replace(/[$,\s]/g, ""));

      if (!Number.isFinite(amount)) {
        return null;
      }

      return {
        label: String(labelValue || `Week ${index + 1}`),
        amount,
      };
    })
    .filter((week): week is ParsedCashflowWeek => week !== null)
    .slice(0, 4);

  if (weeks.length === 0) {
    throw new Error("No cashflow week values could be parsed from the workbook.");
  }

  return weeks;
}
