"use client";

import * as React from "react";
import { Upload, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { appToast } from "@/lib/toast";
import type { ApiErrorResponse, CashflowUploadResponse } from "@/types/cashflow";

export function CashflowUploadButton() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/cashflow/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      throw new Error(body?.error ?? "Unable to upload cashflow file.");
    }

    return response.json() as Promise<CashflowUploadResponse>;
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadFile(file);
      appToast.success("Cashflow updated.", {
        description: `${result.uploadedFile} was uploaded successfully.`,
      });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload cashflow file.";
      appToast.error("Cashflow upload failed", { description: message });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="default"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {isUploading ? "Uploading..." : "Upload cashflow"}
      </Button>
    </>
  );
}
