import "server-only";

import { Prisma, RefreshSource, RefreshStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseProfitWorkbook } from "@/lib/services/excel";
import { replaceProfit } from "@/lib/services/metrics";
import { ProfitUploadError } from "@/features/dashboard/types/profit.types";

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

async function logProfitUpload({
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
        source: RefreshSource.PROFIT_EXCEL,
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

function validateProfitFile(file: File) {
  if (!file.name) {
    throw new ProfitUploadError("Upload a named profit and loss file.");
  }

  if (file.size <= 0) {
    throw new ProfitUploadError("The uploaded file is empty.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ProfitUploadError("File must be 5MB or smaller.");
  }

  if (!isExcelFile(file)) {
    throw new ProfitUploadError("Upload a valid .xlsx or .xls file.");
  }
}

export async function uploadProfitFile(file: File) {
  validateProfitFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const profitData = parseProfitWorkbook(buffer);
    const snapshot = await replaceProfit(profitData);

    await prisma.profitUpload.create({
      data: {
        fileName: file.name,
        netProfit: profitData.netProfit,
        grossProfit: profitData.grossProfit,
      },
    });

    await logProfitUpload({
      status: RefreshStatus.SUCCESS,
      message: `Profit upload processed successfully.`,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
      },
    });

    return {
      profit: snapshot.profit,
      uploadedFile: file.name,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process the profit file.";

    await logProfitUpload({
      status: RefreshStatus.FAILED,
      message,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
      },
    });

    if (error instanceof ProfitUploadError) {
      throw error;
    }

    throw new ProfitUploadError(message);
  }
}
