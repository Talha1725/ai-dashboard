import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { PDFParse } from "pdf-parse";
import type { ParsedCashflowWeek } from "@/lib/services/excel";

let isWorkerConfigured = false;

function configurePdfWorker() {
  if (isWorkerConfigured) {
    return;
  }

  const require = createRequire(import.meta.url);
  const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  const workerData = readFileSync(workerPath).toString("base64");

  PDFParse.setWorker(`data:text/javascript;base64,${workerData}`);
  isWorkerConfigured = true;
}

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

function parseCashflowText(text: string): ParsedCashflowWeek[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
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
  configurePdfWorker();

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const weeks = parseCashflowText(result.text);

    if (weeks.length === 0) {
      throw new Error("No cashflow week values could be parsed from the PDF.");
    }

    return weeks;
  } finally {
    await parser.destroy();
  }
}
