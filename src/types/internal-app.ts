import type { MetricSnapshot } from "@/types/metrics";

export type BiddestonApiJob = {
  id?: string | number | null;
  print_id?: string | number | null;
  customer_id?: string | number | null;
  company_name?: string | null;
  job_type?: string | null;
  subjob?: string | null;
  status?: string | null;
  job_completed?: string | number | null;
  archived?: string | number | null;
  description?: string | null;
  delivery_date_start?: string | null;
  delivery_date_end?: string | null;
};

export type BiddestonJobsResponse = {
  data?: BiddestonApiJob[];
  success?: boolean;
  error?: string;
};

export type InternalAppMetrics = Pick<MetricSnapshot, "deliveries">;

export type InternalAppFetchResult =
  | {
      ok: true;
      fetchedAt: string;
      jobCount: number;
      deliveryJobCount: number;
      metrics: InternalAppMetrics;
    }
  | {
      ok: false;
      status: "missing_credentials" | "failed";
      message: string;
    };
