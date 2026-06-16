import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse } from "@/lib/auth/guard";
import { uploadCashflowFile } from "@/features/dashboard/services/cashflow.service";
import { CashflowUploadError } from "@/features/dashboard/types/cashflow.types";

export async function uploadCashflowController(request: NextRequest) {
  const { response } = await requireAuthResponse(request);

  if (response) {
    return response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a cashflow Excel or PDF file." }, { status: 400 });
  }

  try {
    const result = await uploadCashflowFile(file);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CashflowUploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Unable to process the cashflow file." },
      { status: 500 }
    );
  }
}
