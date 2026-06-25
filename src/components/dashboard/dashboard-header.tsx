import type { ReactNode } from "react";

type DashboardHeaderProps = {
  lastUpdated: string;
  children: ReactNode;
};

export function DashboardHeader({ lastUpdated, children }: DashboardHeaderProps) {
  return (
    <header className="dashboard-glass-panel w-full rounded-lg border p-4 backdrop-blur sm:p-5 flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--primary)]">
            Daily health check
          </p>
          <h1 className="mt-2 max-w-full break-words text-3xl font-bold tracking-normal text-[color:var(--foreground)] sm:text-4xl">
            Business Intelligence Dashboard
          </h1>
        </div>
        <div className="dashboard-soft-panel rounded-lg border px-4 py-2.5 text-sm text-[color:var(--text-soft)] lg:min-w-[250px] shrink-0">
          <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--text-subtle)]">
            Last updated
          </span>
          <span className="mt-0.5 block truncate font-semibold text-[color:var(--foreground)]">
            {lastUpdated}
          </span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 items-center justify-between w-full">
        {children}
      </div>
    </header>
  );
}
