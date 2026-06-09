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
    <main className="min-h-screen bg-[linear-gradient(135deg,var(--page-gradient-start)_0%,var(--page-gradient-mid)_42%,var(--page-gradient-end)_100%)]">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-10 2xl:px-12">
        <header className="rounded-lg border border-surface/80 bg-surface/80 p-5 shadow-sm shadow-shadow-soft/50 backdrop-blur sm:flex sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
              Daily health check
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
              Business Intelligence Dashboard
            </h1>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:mt-0 sm:items-end">
            <div className="rounded-lg border border-border bg-surface-soft px-4 py-3 text-sm text-text-soft">
              Last updated <span className="font-semibold text-foreground">{lastUpdated}</span>
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
