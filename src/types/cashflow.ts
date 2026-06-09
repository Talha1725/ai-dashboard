import type { MetricSnapshot } from "@/types/metrics";

export type CashflowUploadResult = {
  cashflow: MetricSnapshot["cashflow"];
  uploadedFile: string;
};

export type CashflowUploadResponse = {
  uploadedFile: string;
};

export type ApiErrorResponse = {
  error?: string;
};
