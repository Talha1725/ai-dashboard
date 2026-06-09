import type { ReactNode } from "react";

type DashboardHeaderProps = {
  lastUpdated: string;
  children: ReactNode;
};

export function DashboardHeader({ lastUpdated, children }: DashboardHeaderProps) {
  return (
    <header className="dashboard-glass-panel w-full rounded-lg border p-4 backdrop-blur sm:p-5 lg:flex lg:items-end lg:justify-between lg:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--primary)]">
          Daily health check
        </p>
        <h1 className="mt-2 max-w-full break-words text-3xl font-bold tracking-normal text-[color:var(--foreground)] sm:text-4xl">
          Business Intelligence Dashboard
        </h1>
      </div>
      <DashboardActionPanel lastUpdated={lastUpdated}>{children}</DashboardActionPanel>
    </header>
  );
}

function DashboardActionPanel({
  lastUpdated,
  children,
}: {
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5 flex w-full min-w-0 flex-col gap-3 lg:mt-0 lg:w-auto lg:min-w-[360px] lg:items-stretch">
      <div className="dashboard-soft-panel w-full rounded-lg border px-4 py-3 text-sm text-[color:var(--text-soft)]">
        <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--text-subtle)]">
          Last updated
        </span>
        <span className="mt-1 block truncate font-semibold text-[color:var(--foreground)]">
          {lastUpdated}
        </span>
      </div>
      <div className="grid w-full min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto]">
        {children}
      </div>
    </div>
  );
}
