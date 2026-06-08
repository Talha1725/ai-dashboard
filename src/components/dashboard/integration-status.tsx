const integrations = ["MYOB", "Connect Team", "Internal app", "Excel upload"];

export function IntegrationStatus() {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
      <h2 className="text-base font-semibold">Integration Status</h2>
      <div className="mt-5 space-y-3 text-sm">
        {integrations.map((source) => (
          <div key={source} className="flex items-center justify-between gap-4">
            <span className="text-slate-300">{source}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white">
              Ready
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
