import type { ParsedCashflowWeek } from "@/lib/services/excel";

type PdfParseResult = {
  text: string;
};

type PdfPageData = {
  getTextContent(options: {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
  }): Promise<{
    items: Array<{ str?: string }>;
  }>;
};

type PdfParse = (
  buffer: Buffer,
  options: {
    pagerender(pageData: PdfPageData): Promise<string>;
  }
) => Promise<PdfParseResult>;

function parseAmount(value: string) {
  const normalized = value.replace(/[$,\s]/g, "");
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : null;
}

function getNumbers(line: string) {
  return [...line.matchAll(/-?\$?\d+(?:,\d{3})*(?:\.\d+)?/g)]
    .map((match) => parseAmount(match[0]))
    .filter((amount): amount is number => amount !== null);
}

function getWeekDates(text: string) {
  return [...text.matchAll(/\b\d{1,2}\/\d{2}\/\d{4}\b/g)].map((match) => match[0]);
}

function splitCompactAmountsFromRight(value: string, count: number) {
  const normalized = value.replace(/[$,\s,]/g, "");
  const results: number[][] = [];

  function visit(remaining: string, amounts: number[]) {
    if (results.length > 0) {
      return;
    }

    if (amounts.length === count) {
      if (remaining.length === 0) {
        results.push([...amounts].reverse());
      }

      return;
    }

    const slotsLeft = count - amounts.length;
    for (let decimalLength = 2; decimalLength >= 1; decimalLength -= 1) {
      for (let integerLength = 1; integerLength <= 6; integerLength += 1) {
        const tokenLength = integerLength + 1 + decimalLength;

        if (remaining.length < tokenLength) {
          continue;
        }

        const token = remaining.slice(-tokenLength);

        if (!/^\d+\.\d+$/.test(token) || token.startsWith("0")) {
          continue;
        }

        const prefix = remaining.slice(0, -tokenLength);
        const minimumRemainingLength = Math.max(slotsLeft - 1, 0) * 3;

        if (prefix.length < minimumRemainingLength) {
          continue;
        }

        const amount = Number(token);

        if (Number.isFinite(amount)) {
          visit(prefix, [...amounts, amount]);
        }
      }
    }
  }

  visit(normalized, []);

  return results[0] ?? [];
}

function parseForecastLine(line: string): ParsedCashflowWeek[] {
  const forecastDates = getWeekDates(line);

  if (forecastDates.length < 4) {
    return [];
  }

  const tail = line.slice(line.lastIndexOf(forecastDates.at(-1) ?? "") + (forecastDates.at(-1)?.length ?? 0));
  const compactRows = tail
    .split(/\n|\r/)
    .map((row) => row.trim())
    .filter(Boolean);
  const lastNumericRow = compactRows.findLast((row) => /^\d/.test(row));
  const amounts =
    lastNumericRow && getNumbers(lastNumericRow).length < forecastDates.length
      ? splitCompactAmountsFromRight(lastNumericRow, forecastDates.length)
      : getNumbers(line).slice(-forecastDates.length);

  return amounts.slice(0, 4).map((amount, index) => ({
    label: forecastDates[index] ? `Week ending ${forecastDates[index]}` : `Week ${index + 1}`,
    amount,
  }));
}

function parseCashflowText(text: string): ParsedCashflowWeek[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const forecastLineIndex = lines.findIndex((line) => getWeekDates(line).length >= 4);

  if (forecastLineIndex >= 0) {
    const forecastLineWeeks = parseForecastLine(lines[forecastLineIndex]);

    if (forecastLineWeeks.length > 0) {
      return forecastLineWeeks;
    }

    const forecastBlock = lines.slice(forecastLineIndex, forecastLineIndex + 24).join("\n");
    const forecastWeeks = parseForecastLine(forecastBlock);

    if (forecastWeeks.length > 0) {
      return forecastWeeks;
    }
  }

  const dates = getWeekDates(text);
  const bankBalanceLine = lines.find((line) => /^bank balance\b/i.test(line));
  const currentBankBalance = bankBalanceLine ? getNumbers(bankBalanceLine)[0] : null;

  const numericRows = lines
    .map((line) => getNumbers(line))
    .filter((numbers) => numbers.length >= 4 && numbers.some((amount) => amount !== 0));
  const futureBalances = numericRows.at(-1) ?? [];

  const hasCurrentWeek = currentBankBalance !== null && dates.length > futureBalances.length;
  const forecastDates = hasCurrentWeek ? dates.slice(1) : dates;

  return futureBalances.slice(0, 4).map((amount, index) => ({
    label: forecastDates[index] ? `Week ending ${forecastDates[index]}` : `Week ${index + 1}`,
    amount,
  }));
}

export async function parseCashflowPdf(buffer: Buffer): Promise<ParsedCashflowWeek[]> {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const pdfParse = require("pdf-parse") as PdfParse;
  const result = await pdfParse(buffer, {
    pagerender: async (pageData) => {
      const content = await pageData.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      });

      return content.items.map((item) => item.str ?? "").join(" ");
    },
  });
  const weeks = parseCashflowText(result.text);

  if (weeks.length === 0) {
    throw new Error("No cashflow week values could be parsed from the PDF.");
  }

  return weeks;
}
