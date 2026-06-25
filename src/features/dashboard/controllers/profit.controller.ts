import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse } from "@/lib/auth/guard";
import { uploadProfitFile } from "@/features/dashboard/services/profit.service";
import { ProfitUploadError } from "@/features/dashboard/types/profit.types";

export async function uploadProfitController(request: NextRequest) {
  const { response } = await requireAuthResponse(request);

  if (response) {
    return response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a profit and loss Excel file." }, { status: 400 });
  }

  try {
    const result = await uploadProfitFile(file);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ProfitUploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Unable to process the profit file." },
      { status: 500 }
    );
  }
}
