import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const integrations = ["MYOB", "Connect Team", "Internal app", "Excel upload"];

export function IntegrationStatus() {
  return (
    <Card className="border-slate-800 bg-slate-950 text-white">
      <CardHeader>
        <CardTitle>Integration Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {integrations.map((source) => (
          <div key={source} className="flex items-center justify-between gap-4">
            <span className="text-slate-300">{source}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white">
              Ready
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
