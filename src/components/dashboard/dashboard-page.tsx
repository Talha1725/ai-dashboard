import { LogoutButton } from "@/components/auth/logout-button";
import { CashflowCard } from "@/components/dashboard/cashflow-card";
import { CashflowUploadButton } from "@/components/dashboard/cashflow-upload-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
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
      <div className="mx-auto flex w-full min-w-0 max-w-none flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5 lg:gap-5 lg:px-5 xl:px-6 2xl:px-8">
        <DashboardHeader lastUpdated={lastUpdated}>
          <CashflowUploadButton className="w-full" />
          <LogoutButton className="w-full lg:w-auto" />
        </DashboardHeader>

        <DashboardOverview snapshot={snapshot} />

        <section className="grid w-full min-w-0 grid-cols-1 justify-items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:gap-5">
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
