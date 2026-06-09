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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d9f3ed_0,#f7fafc_34%,#eef3f8_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-lg border border-white/80 bg-white/80 p-5 shadow-sm shadow-slate-200/70 backdrop-blur sm:flex sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-700">
              Daily health check
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
              Business Intelligence Dashboard
            </h1>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:mt-0 sm:items-end">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Last updated <span className="font-semibold text-slate-950">{lastUpdated}</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <CashflowUploadButton />
              <LogoutButton />
            </div>
          </div>
        </header>

        <DashboardOverview snapshot={snapshot} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
