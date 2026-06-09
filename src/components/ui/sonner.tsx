"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: "border-border bg-card text-card-foreground",
          title: "font-semibold",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
