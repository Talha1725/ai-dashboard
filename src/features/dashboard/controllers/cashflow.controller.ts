import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse } from "@/lib/auth/guard";
import { uploadCashflowFile } from "@/features/dashboard/services/cashflow.service";

export async function uploadCashflowController(request: NextRequest) {
  const { response } = await requireAuthResponse(request);

  if (response) {
    return response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a cashflow Excel file." }, { status: 400 });
  }

  const result = await uploadCashflowFile(file);

  return NextResponse.json(result);
}
