"use client";

import * as React from "react";
import { Upload, Loader2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { appToast } from "@/lib/toast";

export function ProfitUploadButton({ className }: { className?: string }) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/profit/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? "Unable to upload profit file.");
    }

    return response.json();
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
      appToast.success("Profit & Loss updated.", {
        description: `${result.uploadedFile} was uploaded successfully.`,
      });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload profit file.";
      appToast.error("Profit upload failed", { description: message });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className={`flex gap-2 ${className || ""}`}>
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
        className="flex-1"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {isUploading ? "Uploading..." : "Upload P&L"}
      </Button>
      <Button
        type="button"
        variant="outline"
        title="Download P&L Template"
        onClick={() => {
          window.location.href = "/templates/profit_template.xlsx";
        }}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
