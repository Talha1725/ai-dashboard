import type { ParsedCashflowWeek } from "@/lib/services/excel";

class ServerDOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  is2D = true;
  isIdentity = true;

  constructor(init?: string | number[]) {
    if (Array.isArray(init) && init.length >= 6) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = init;
      this.isIdentity =
        this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
    }
  }

  multiplySelf() {
    return this;
  }

  preMultiplySelf() {
    return this;
  }

  translateSelf() {
    return this;
  }

  scaleSelf() {
    return this;
  }

  rotateSelf() {
    return this;
  }

  invertSelf() {
    return this;
  }

  transformPoint(point: { x?: number; y?: number }) {
    return {
      x: point.x ?? 0,
      y: point.y ?? 0,
      z: 0,
      w: 1,
    };
  }
}

function ensurePdfServerGlobals() {
  if (!("DOMMatrix" in globalThis)) {
    Object.assign(globalThis, { DOMMatrix: ServerDOMMatrix });
  }
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
  const forecastLine = lines.find((line) => getWeekDates(line).length >= 4);

  if (forecastLine) {
    const forecastDates = getWeekDates(forecastLine);
    const forecastAmounts = getNumbers(forecastLine).slice(-forecastDates.length);

    return forecastAmounts.slice(0, 4).map((amount, index) => ({
      label: forecastDates[index] ? `Week ending ${forecastDates[index]}` : `Week ${index + 1}`,
      amount,
    }));
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
  ensurePdfServerGlobals();

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    isOffscreenCanvasSupported: false,
    useWorkerFetch: false,
  } as unknown as Parameters<typeof pdfjs.getDocument>[0]);
  const document = await loadingTask.promise;

  try {
    const pageTexts = await Promise.all(
      Array.from({ length: document.numPages }, async (_, index) => {
        const page = await document.getPage(index + 1);
        const content = await page.getTextContent();
        page.cleanup();

        return content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
      })
    );
    const weeks = parseCashflowText(pageTexts.join("\n"));

    if (weeks.length === 0) {
      throw new Error("No cashflow week values could be parsed from the PDF.");
    }

    return weeks;
  } finally {
    await loadingTask.destroy();
  }
}
