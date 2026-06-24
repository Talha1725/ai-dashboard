import "server-only";

import { Prisma, RefreshSource, RefreshStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseInvoicesWorkbook } from "@/lib/services/excel";
import { replaceInvoices } from "@/lib/services/metrics";
import { InvoicesUploadError } from "@/features/dashboard/types/invoices.types";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXCEL_EXTENSIONS = [".xlsx", ".xls"];
const ALLOWED_EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream",
  "",
];

function isExcelFile(file: File) {
  const normalizedName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXCEL_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension)
  );
  const hasValidMimeType = ALLOWED_EXCEL_MIME_TYPES.includes(file.type);

  return hasValidExtension && hasValidMimeType;
}

async function logInvoicesUpload({
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
        source: RefreshSource.INVOICES_EXCEL,
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

function validateInvoicesFile(file: File) {
  if (!file.name) {
    throw new InvoicesUploadError("Upload a named unpaid invoices file.");
  }

  if (file.size <= 0) {
    throw new InvoicesUploadError("The uploaded file is empty.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new InvoicesUploadError("File must be 5MB or smaller.");
  }

  if (!isExcelFile(file)) {
    throw new InvoicesUploadError("Upload a valid .xlsx or .xls file.");
  }
}

export async function uploadInvoicesFile(file: File) {
  validateInvoicesFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const invoicesData = parseInvoicesWorkbook(buffer);
    const snapshot = await replaceInvoices(invoicesData);

    await prisma.invoicesUpload.create({
      data: {
        fileName: file.name,
        invoiceCount: invoicesData.length,
        parsedData: invoicesData as any,
      },
    });

    await logInvoicesUpload({
      status: RefreshStatus.SUCCESS,
      message: `Invoices upload processed successfully.`,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        invoiceCount: invoicesData.length,
      },
    });

    return {
      paymentAlerts: snapshot.payments.alerts,
      uploadedFile: file.name,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process the invoices file.";

    await logInvoicesUpload({
      status: RefreshStatus.FAILED,
      message,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
      },
    });

    if (error instanceof InvoicesUploadError) {
      throw error;
    }

    throw new InvoicesUploadError(message);
  }
}
