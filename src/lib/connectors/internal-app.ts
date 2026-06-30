import type { DeliveryJob } from "@/types/metrics";
import type {
  BiddestonApiJob,
  BiddestonApiJobTime,
  BiddestonJobTimesResponse,
  BiddestonJobsResponse,
  InternalAppFetchResult,
  InternalAppMetrics,
} from "@/types/internal-app";

const JOBS_TABLE = "jobs";
const JOB_TIMES_TABLE = "job_times";
const JOBS_ACTION = "list";
const JOBS_RECORD_LIMIT = 100;
const JOB_TIMES_RECORD_LIMIT = 500;
const MAX_DELIVERY_JOBS = 6;
const DELIVERY_WINDOW_DAYS = 7;
const API_TIMEOUT_MS = 10000;
const NORMAL_WEEKLY_HOURS = 38;
const NORMAL_DAY_START_HOUR = 6;
const NORMAL_DAY_END_HOUR = 16;
const DEFAULT_LABOUR_RATE = 140;

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

function getJobTimesUrl(baseUrl: string, searchTerm: string) {
  const url = new URL(baseUrl);

  url.searchParams.set("table", JOB_TIMES_TABLE);
  url.searchParams.set("action", JOBS_ACTION);
  url.searchParams.set("records", String(JOB_TIMES_RECORD_LIMIT));
  url.searchParams.set("skip", "0");

  if (searchTerm) {
    url.searchParams.set("qs", searchTerm);
  }

  return url;
}

function getMonthSearchTerms(now: Date) {
  const weekStart = getStartOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return Array.from(
    new Set(
      [weekStart, weekEnd].map((date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      )
    )
  );
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

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number(String(value ?? "").trim());

  return Number.isFinite(parsed) ? parsed : null;
}

function parseJobTimeDate(dateValue: string | null | undefined, timeValue: string | null | undefined) {
  if (!dateValue || !timeValue) {
    return null;
  }

  const date = new Date(`${dateValue}T${timeValue}`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;

  start.setDate(start.getDate() - daysFromMonday);
  start.setHours(0, 0, 0, 0);

  return start;
}

function isWithinCurrentWeek(date: Date, now: Date) {
  const weekStart = getStartOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return date >= weekStart && date < weekEnd;
}

function isBreakEntry(jobTime: BiddestonApiJobTime) {
  const type = String(jobTime.type ?? "").trim().toLowerCase();

  return type.includes("lunch break") || type.includes("rest break");
}

function getPersonName(jobTime: BiddestonApiJobTime) {
  return `${jobTime.firstname ?? ""} ${jobTime.surname ?? ""}`.trim() || "Unknown";
}

function getHoursBetween(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
}

function getWeekdayOvertimeHours(start: Date, end: Date) {
  const normalStart = new Date(start);
  normalStart.setHours(NORMAL_DAY_START_HOUR, 0, 0, 0);

  const normalEnd = new Date(start);
  normalEnd.setHours(NORMAL_DAY_END_HOUR, 0, 0, 0);

  const overlapStart = new Date(Math.max(start.getTime(), normalStart.getTime()));
  const overlapEnd = new Date(Math.min(end.getTime(), normalEnd.getTime()));
  const normalHours = Math.max(0, getHoursBetween(overlapStart, overlapEnd));
  const totalHours = getHoursBetween(start, end);

  return Math.max(0, totalHours - normalHours);
}

function getEntryOvertimeHours(start: Date, end: Date) {
  const day = start.getDay();

  if (day === 0 || day === 5 || day === 6) {
    return getHoursBetween(start, end);
  }

  return getWeekdayOvertimeHours(start, end);
}

function mapJobTimesToOvertime(jobTimes: BiddestonApiJobTime[], now = new Date()): InternalAppMetrics["overtime"] | null {
  const people = new Map<string, { totalHours: number; overtimeHours: number; labourRateTotal: number; rateCount: number }>();

  for (const jobTime of jobTimes) {
    if (isBreakEntry(jobTime)) {
      continue;
    }

    const start = parseJobTimeDate(jobTime.start_date, jobTime.start_time);
    const end = parseJobTimeDate(jobTime.end_date, jobTime.end_time);

    if (!start || !end || !isWithinCurrentWeek(start, now)) {
      continue;
    }

    const workedHours = parseNumber(jobTime.worked_hours) ?? getHoursBetween(start, end);
    const overtimeHours = getEntryOvertimeHours(start, end);
    const labourRate = parseNumber(jobTime.labour_rate);
    const personName = getPersonName(jobTime);
    const current = people.get(personName) ?? {
      totalHours: 0,
      overtimeHours: 0,
      labourRateTotal: 0,
      rateCount: 0,
    };

    current.totalHours += workedHours;
    current.overtimeHours += Math.min(overtimeHours, workedHours);

    if (labourRate !== null) {
      current.labourRateTotal += labourRate;
      current.rateCount += 1;
    }

    people.set(personName, current);
  }

  if (people.size === 0) {
    return {
      status: "good",
      source: "Internal app",
      hours: 0,
      teamPercent: 0,
      costImpact: 0,
    };
  }

  let overtimeHours = 0;
  let overtimePeople = 0;
  let costImpact = 0;

  for (const person of people.values()) {
    const weeklyOvertime = Math.max(0, person.totalHours - NORMAL_WEEKLY_HOURS);
    const personOvertime = Math.max(person.overtimeHours, weeklyOvertime);
    const labourRate = person.rateCount > 0 ? person.labourRateTotal / person.rateCount : DEFAULT_LABOUR_RATE;

    if (personOvertime > 0) {
      overtimePeople += 1;
    }

    overtimeHours += personOvertime;
    costImpact += personOvertime * labourRate;
  }

  const roundedHours = Math.round(overtimeHours * 10) / 10;

  return {
    status: roundedHours > 0 ? "warning" : "good",
    source: "Internal app",
    hours: roundedHours,
    teamPercent: Math.round((overtimePeople / people.size) * 100),
    costImpact: Math.round(costImpact),
  };
}

async function fetchJson<T>(url: URL, apiKey: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Auth-Token": apiKey,
    },
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Internal app API returned HTTP ${response.status}.`);
  }

  return response.json() as Promise<T>;
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
    const now = new Date();
    const payload = await fetchJson<BiddestonJobsResponse>(getJobsUrl(config.baseUrl), config.apiKey);
    const jobTimesResults = await Promise.allSettled(
      getMonthSearchTerms(now).map((searchTerm) =>
        fetchJson<BiddestonJobTimesResponse>(getJobTimesUrl(config.baseUrl, searchTerm), config.apiKey)
      )
    );

    if (!payload.success || !Array.isArray(payload.data)) {
      return {
        ok: false,
        status: "failed",
        message: payload.error || "Internal app API returned an invalid jobs response.",
      };
    }

    const jobs = mapJobsToDeliveries(payload.data, now);
    const jobTimes = jobTimesResults.flatMap((result) =>
      result.status === "fulfilled" && result.value.success && Array.isArray(result.value.data)
        ? result.value.data
        : []
    );
    const hasJobTimesResponse = jobTimesResults.some(
      (result) =>
        result.status === "fulfilled" && result.value.success && Array.isArray(result.value.data)
    );
    const overtime = hasJobTimesResponse ? mapJobTimesToOvertime(jobTimes, now) : null;

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
        ...(overtime ? { overtime } : {}),
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
