import type { DeliveryJob } from "@/types/metrics";
import type {
  BiddestonApiJob,
  BiddestonJobsResponse,
  InternalAppFetchResult,
  InternalAppMetrics,
} from "@/types/internal-app";

const JOBS_TABLE = "jobs";
const JOBS_ACTION = "list";
const JOBS_RECORD_LIMIT = 100;
const MAX_DELIVERY_JOBS = 6;
const DELIVERY_WINDOW_DAYS = 7;
const API_TIMEOUT_MS = 10000;

function getInternalAppConfig() {
  const baseUrl = process.env.INTERNAL_APP_API_BASE_URL;
  const apiKey = process.env.INTERNAL_APP_API_KEY;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return { apiKey, baseUrl };
}

function getJobsUrl(baseUrl: string) {
  const url = new URL(baseUrl);

  url.searchParams.set("table", JOBS_TABLE);
  url.searchParams.set("action", JOBS_ACTION);
  url.searchParams.set("records", String(JOBS_RECORD_LIMIT));
  url.searchParams.set("skip", "0");

  return url;
}

function parseDeliveryDate(job: BiddestonApiJob) {
  const rawDate = job.delivery_date_end ?? job.delivery_date_start;

  if (!rawDate) {
    return null;
  }

  const date = new Date(rawDate.replace(" ", "T"));

  return Number.isNaN(date.getTime()) ? null : date;
}

function isActiveJob(job: BiddestonApiJob) {
  return String(job.archived ?? "0") !== "1" && String(job.job_completed ?? "0") !== "1";
}

function isWithinDeliveryWindow(date: Date, now: Date) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfWindow = new Date(startOfToday);
  endOfWindow.setDate(endOfWindow.getDate() + DELIVERY_WINDOW_DAYS);
  endOfWindow.setHours(23, 59, 59, 999);

  return date >= startOfToday && date <= endOfWindow;
}

function getDueLabel(date: Date, now: Date) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfDueDate = new Date(date);
  startOfDueDate.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.round(
    (startOfDueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue <= 0) {
    return "Today";
  }

  if (daysUntilDue === 1) {
    return "Tomorrow";
  }

  return `In ${daysUntilDue} days`;
}

function getJobId(job: BiddestonApiJob) {
  const rawId = job.print_id ?? job.id;

  return rawId ? `JOB-${rawId}` : "JOB";
}

function getJobStage(job: BiddestonApiJob) {
  return job.status || job.subjob || job.job_type || "Scheduled";
}

function mapJobsToDeliveries(jobs: BiddestonApiJob[], now = new Date()): DeliveryJob[] {
  return jobs
    .map((job) => ({ job, deliveryDate: parseDeliveryDate(job) }))
    .filter((entry): entry is { job: BiddestonApiJob; deliveryDate: Date } => {
      if (!entry.deliveryDate) {
        return false;
      }

      return isActiveJob(entry.job) && isWithinDeliveryWindow(entry.deliveryDate, now);
    })
    .sort((first, second) => first.deliveryDate.getTime() - second.deliveryDate.getTime())
    .slice(0, MAX_DELIVERY_JOBS)
    .map(({ job, deliveryDate }) => ({
      id: getJobId(job),
      customer: job.company_name || "Unknown customer",
      due: getDueLabel(deliveryDate, now),
      stage: getJobStage(job),
    }));
}

export async function fetchInternalAppMetrics(): Promise<InternalAppMetrics | null> {
  const result = await fetchInternalAppMetricsResult();

  return result.ok ? result.metrics : null;
}

export async function fetchInternalAppMetricsResult(): Promise<InternalAppFetchResult> {
  const config = getInternalAppConfig();

  if (!config) {
    return {
      ok: false,
      status: "missing_credentials",
      message: "Internal app API credentials are missing.",
    };
  }

  try {
    const response = await fetch(getJobsUrl(config.baseUrl), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Auth-Token": config.apiKey,
      },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: "failed",
        message: `Internal app API returned HTTP ${response.status}.`,
      };
    }

    const payload = (await response.json()) as BiddestonJobsResponse;

    if (!payload.success || !Array.isArray(payload.data)) {
      return {
        ok: false,
        status: "failed",
        message: payload.error || "Internal app API returned an invalid jobs response.",
      };
    }

    const jobs = mapJobsToDeliveries(payload.data);

    return {
      ok: true,
      fetchedAt: new Date().toISOString(),
      jobCount: payload.data.length,
      deliveryJobCount: jobs.length,
      metrics: {
        deliveries: {
          status: jobs.length > 0 ? "warning" : "good",
          source: "Internal app",
          jobs,
        },
      },
    };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      message: error instanceof Error ? error.message : "Internal app API request failed.",
    };
  }
}
