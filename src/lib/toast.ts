"use client";

import { toast } from "sonner";
import type { ToastOptions } from "@/types/toast";

export const appToast = {
  success(message: string, options?: ToastOptions) {
    toast.success(message, options);
  },
  error(message: string, options?: ToastOptions) {
    toast.error(message, options);
  },
};
