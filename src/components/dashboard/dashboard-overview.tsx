import { Activity, Banknote, Clock3, WalletCards } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { DashboardOverviewProps } from "@/types/metrics";

export function DashboardOverview({ snapshot }: DashboardOverviewProps) {
  const finalCashflowWeek = snapshot.cashflow.weeks.at(-1);
  const stats = [
    {
      label: "4-week cashflow",
      value: finalCashflowWeek ? formatCurrency(finalCashflowWeek.amount) : "Unavailable",
      detail: finalCashflowWeek?.label ?? "Excel upload",
      icon: WalletCards,
      accent: "text-primary bg-success-soft",
    },
    {
      label: "Net profit",
      value: formatCurrency(snapshot.profit.net),
      detail: `${snapshot.profit.netMargin}% of revenue`,
      icon: Banknote,
      accent: "text-success bg-success-soft",
    },
    {
      label: "Overtime",
      value: `${snapshot.overtime.hours} hrs`,
      detail: `${snapshot.overtime.teamPercent}% of team`,
      icon: Clock3,
      accent: "text-warning bg-warning-soft",
    },
    {
      label: "Payment alerts",
      value: String(snapshot.payments.alerts.length),
      detail: "Requires attention",
      icon: Activity,
      accent: "text-danger bg-danger-soft",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-surface/85 p-4 shadow-sm shadow-shadow-soft/50 backdrop-blur"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-subtle">
                  {stat.label}
                </p>
                <p className="mt-2 truncate text-2xl font-bold tracking-normal text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-text-subtle">{stat.detail}</p>
              </div>
              <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${stat.accent}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
