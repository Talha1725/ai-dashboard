import { formatCurrency, metricSnapshot } from "@/lib/metrics";
import type { Status } from "@/types/metrics";

const statusStyles: Record<Status, string> = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  alert: "border-rose-200 bg-rose-50 text-rose-800",
};

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function MetricCard({
  title,
  source,
  status,
  children,
}: {
  title: string;
  source: string;
  status: Status;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            {source}
          </p>
        </div>
        <StatusPill status={status} />
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function CashflowChart() {
  const maxAmount = Math.max(...metricSnapshot.cashflow.weeks.map((week) => week.amount));

  return (
    <div className="space-y-4">
      {metricSnapshot.cashflow.weeks.map((week) => (
        <div key={week.label} className="grid grid-cols-[72px_1fr_88px] items-center gap-3">
          <span className="text-sm font-medium text-slate-600">{week.label}</span>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600"
              style={{ width: `${(week.amount / maxAmount) * 100}%` }}
            />
          </div>
          <span className="text-right text-sm font-semibold text-slate-950">
            {formatCurrency(week.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

function OvertimeDial() {
  const percentage = metricSnapshot.overtime.teamPercent;

  return (
    <div className="flex items-center gap-5">
      <div
        className="grid size-32 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#d97706 ${percentage * 3.6}deg, #f1f5f9 0deg)`,
        }}
      >
        <div className="grid size-24 place-items-center rounded-full bg-white text-center">
          <div>
            <div className="text-3xl font-bold text-slate-950">
              {metricSnapshot.overtime.hours}
            </div>
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              hours
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-600">{percentage}% of team in overtime</p>
        <p className="mt-2 text-2xl font-bold text-slate-950">
          +{formatCurrency(metricSnapshot.overtime.costImpact)}
        </p>
        <p className="text-sm text-slate-500">cost impact this week</p>
      </div>
    </div>
  );
}

export default function Home() {
  const lastUpdated = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(metricSnapshot.refreshedAt));

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-700">
              Daily health check
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
              Business Intelligence Dashboard
            </h1>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Last updated <span className="font-semibold text-slate-950">{lastUpdated}</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Cashflow Forecast"
            source={metricSnapshot.cashflow.source}
            status={metricSnapshot.cashflow.status}
          >
            <CashflowChart />
          </MetricCard>

          <MetricCard
            title="Monthly Profit"
            source={metricSnapshot.profit.source}
            status={metricSnapshot.profit.status}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Net profit</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">
                  {formatCurrency(metricSnapshot.profit.net)}
                </p>
                <p className="text-sm font-medium text-emerald-700">
                  {metricSnapshot.profit.netMargin}% of revenue
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Gross profit</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">
                  {formatCurrency(metricSnapshot.profit.gross)}
                </p>
                <p className="text-sm font-medium text-emerald-700">
                  {metricSnapshot.profit.grossMargin}% of revenue
                </p>
              </div>
            </div>
          </MetricCard>

          <MetricCard
            title="Weekly Overtime"
            source={metricSnapshot.overtime.source}
            status={metricSnapshot.overtime.status}
          >
            <OvertimeDial />
          </MetricCard>

          <MetricCard
            title="Jobs Close To Delivery"
            source={metricSnapshot.deliveries.source}
            status={metricSnapshot.deliveries.status}
          >
            <div className="space-y-3">
              {metricSnapshot.deliveries.jobs.map((job) => (
                <div
                  key={job.id}
                  className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{job.customer}</p>
                    <p className="text-sm text-slate-500">
                      {job.id} · {job.stage}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-amber-700">{job.due}</p>
                </div>
              ))}
            </div>
          </MetricCard>

          <MetricCard
            title="Payment Alerts"
            source={metricSnapshot.payments.source}
            status={metricSnapshot.payments.status}
          >
            <div className="space-y-3">
              {metricSnapshot.payments.alerts.map((alert) => (
                <div
                  key={`${alert.customer}-${alert.amount}`}
                  className="rounded-md border border-rose-200 bg-rose-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-950">{alert.customer}</p>
                    <p className="text-sm font-bold text-rose-800">
                      {formatCurrency(alert.amount)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm font-medium capitalize text-rose-700">
                    {alert.priority} · {alert.due}
                  </p>
                </div>
              ))}
            </div>
          </MetricCard>

          <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
            <h2 className="text-base font-semibold">Integration Status</h2>
            <div className="mt-5 space-y-3 text-sm">
              {["MYOB", "Connect Team", "Internal app", "Excel upload"].map((source) => (
                <div key={source} className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">{source}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white">
                    Stub ready
                  </span>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
