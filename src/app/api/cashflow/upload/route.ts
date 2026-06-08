import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCashflowWorkbook } from "@/lib/services/excel";
import { replaceCashflowWeeks } from "@/lib/services/metrics";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a cashflow Excel file." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const weeks = parseCashflowWorkbook(buffer);
  const snapshot = await replaceCashflowWeeks(weeks);

  try {
    await prisma.cashflowUpload.create({
      data: {
        fileName: file.name,
        weekCount: weeks.length,
        parsedWeeks: weeks,
      },
    });
  } catch {
    // Keep the upload endpoint usable in local setup before DATABASE_URL is configured.
  }

  return NextResponse.json({
    cashflow: snapshot.cashflow,
    uploadedFile: file.name,
  });
}
