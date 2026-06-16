import "server-only";

import { Prisma, RefreshSource, RefreshStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseCashflowWorkbook } from "@/lib/services/excel";
import { parseCashflowPdf } from "@/lib/services/pdf";
import { replaceCashflowWeeks } from "@/lib/services/metrics";
import {
  CashflowUploadError,
} from "@/features/dashboard/types/cashflow.types";
import type { CashflowUploadResult } from "@/types/cashflow";

const MAX_CASHFLOW_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXCEL_EXTENSIONS = [".xlsx", ".xls"];
const ALLOWED_PDF_EXTENSIONS = [".pdf"];
const ALLOWED_EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream",
  "",
];
const ALLOWED_PDF_MIME_TYPES = ["application/pdf", "application/octet-stream", ""];

function isExcelFile(file: File) {
  const normalizedName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXCEL_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension)
  );
  const hasValidMimeType = ALLOWED_EXCEL_MIME_TYPES.includes(file.type);

  return hasValidExtension && hasValidMimeType;
}

function isPdfFile(file: File) {
  const normalizedName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_PDF_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension)
  );
  const hasValidMimeType = ALLOWED_PDF_MIME_TYPES.includes(file.type);

  return hasValidExtension && hasValidMimeType;
}

function getCashflowFileKind(file: File) {
  if (isExcelFile(file)) {
    return "Excel";
  }

  if (isPdfFile(file)) {
    return "PDF";
  }

  return null;
}

async function logCashflowUpload({
  status,
  message,
  metadata,
}: {
  status: RefreshStatus;
  message?: string;
  metadata?: Prisma.InputJsonObject;
}) {
  try {
    await prisma.sourceRefreshLog.create({
      data: {
        source: RefreshSource.CASHFLOW_EXCEL,
        status,
        message,
        endedAt: new Date(),
        metadata,
      },
    });
  } catch {
    // Logging should never block the upload flow.
  }
}

function validateCashflowFile(file: File) {
  if (!file.name) {
    throw new CashflowUploadError("Upload a named cashflow file.");
  }

  if (file.size <= 0) {
    throw new CashflowUploadError("The uploaded cashflow file is empty.");
  }

  if (file.size > MAX_CASHFLOW_FILE_SIZE_BYTES) {
    throw new CashflowUploadError("Cashflow file must be 5MB or smaller.");
  }

  if (!getCashflowFileKind(file)) {
    throw new CashflowUploadError("Upload a valid .xlsx, .xls, or .pdf cashflow file.");
  }
}

export async function uploadCashflowFile(file: File): Promise<CashflowUploadResult> {
  validateCashflowFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileKind = getCashflowFileKind(file);

  try {
    const weeks =
      fileKind === "PDF" ? await parseCashflowPdf(buffer) : parseCashflowWorkbook(buffer);
    const snapshot = await replaceCashflowWeeks(weeks);

    await prisma.cashflowUpload.create({
      data: {
        fileName: file.name,
        weekCount: weeks.length,
        parsedWeeks: weeks,
      },
    });

    await logCashflowUpload({
      status: RefreshStatus.SUCCESS,
      message: `Cashflow ${fileKind} upload processed successfully.`,
      metadata: {
        fileName: file.name,
        fileKind,
        fileSize: file.size,
        weekCount: weeks.length,
      },
    });

    return {
      cashflow: snapshot.cashflow,
      uploadedFile: file.name,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process the cashflow file.";

    await logCashflowUpload({
      status: RefreshStatus.FAILED,
      message,
      metadata: {
        fileName: file.name,
        fileKind,
        fileSize: file.size,
      },
    });

    if (error instanceof CashflowUploadError) {
      throw error;
    }

    throw new CashflowUploadError(message);
  }
}
