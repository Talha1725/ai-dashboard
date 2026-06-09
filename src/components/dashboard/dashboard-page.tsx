import { LogoutButton } from "@/components/auth/logout-button";
import { CashflowCard } from "@/components/dashboard/cashflow-card";
import { CashflowUploadButton } from "@/components/dashboard/cashflow-upload-button";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DeliveriesCard } from "@/components/dashboard/deliveries-card";
import { IntegrationStatus } from "@/components/dashboard/integration-status";
import { OvertimeCard } from "@/components/dashboard/overtime-card";
import { PaymentsCard } from "@/components/dashboard/payments-card";
import { ProfitCard } from "@/components/dashboard/profit-card";
import { formatSnapshotDate } from "@/lib/formatters";
import type { DashboardPageProps } from "@/types/metrics";

export function DashboardPage({ snapshot }: DashboardPageProps) {
  const lastUpdated = formatSnapshotDate(snapshot.refreshedAt);

  return (
    <main className="dashboard-page-bg min-h-screen">
      <div className="mx-auto flex w-full max-w-none flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5 lg:gap-5 lg:px-5 xl:px-6 2xl:px-8">
        <header className="dashboard-glass-panel rounded-lg border p-4 backdrop-blur sm:p-5 lg:flex lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--primary)]">
              Daily health check
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-[color:var(--foreground)] sm:text-4xl">
              Business Intelligence Dashboard
            </h1>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:mt-0 sm:items-end">
            <div className="dashboard-soft-panel rounded-lg border px-4 py-3 text-sm text-[color:var(--text-soft)]">
              Last updated <span className="font-semibold text-[color:var(--foreground)]">{lastUpdated}</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <CashflowUploadButton />
              <LogoutButton />
            </div>
          </div>
        </header>

        <DashboardOverview snapshot={snapshot} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:gap-5">
          <CashflowCard cashflow={snapshot.cashflow} />
          <ProfitCard profit={snapshot.profit} />
          <OvertimeCard overtime={snapshot.overtime} />
          <DeliveriesCard deliveries={snapshot.deliveries} />
          <PaymentsCard payments={snapshot.payments} />
          <IntegrationStatus integrations={snapshot.integrations} />
        </section>
      </div>
    </main>
  );
}
