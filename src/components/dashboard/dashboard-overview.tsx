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
      accent: "text-teal-700 bg-teal-50",
    },
    {
      label: "Net profit",
      value: formatCurrency(snapshot.profit.net),
      detail: `${snapshot.profit.netMargin}% of revenue`,
      icon: Banknote,
      accent: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Overtime",
      value: `${snapshot.overtime.hours} hrs`,
      detail: `${snapshot.overtime.teamPercent}% of team`,
      icon: Clock3,
      accent: "text-amber-700 bg-amber-50",
    },
    {
      label: "Payment alerts",
      value: String(snapshot.payments.alerts.length),
      detail: "Requires attention",
      icon: Activity,
      accent: "text-red-700 bg-red-50",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm shadow-slate-200/60 backdrop-blur"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 truncate text-2xl font-bold tracking-normal text-slate-950">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{stat.detail}</p>
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
