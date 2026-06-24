import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse } from "@/lib/auth/guard";
import { uploadInvoicesFile } from "@/features/dashboard/services/invoices.service";
import { InvoicesUploadError } from "@/features/dashboard/types/invoices.types";

export async function uploadInvoicesController(request: NextRequest) {
  const { response } = await requireAuthResponse(request);

  if (response) {
    return response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload an unpaid invoices Excel file." }, { status: 400 });
  }

  try {
    const result = await uploadInvoicesFile(file);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InvoicesUploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Unable to process the invoices file." },
      { status: 500 }
    );
  }
}
