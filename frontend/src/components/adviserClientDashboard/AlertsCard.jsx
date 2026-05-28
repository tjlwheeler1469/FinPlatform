import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const AlertsCard = ({ alerts }) => (
  <Card className="border-slate-200" data-testid="card-alerts">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Alerts &amp; exceptions
        </p>
        <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">{alerts.filter(a => a.level !== "green").length} active</span>
      </div>
      <div className="space-y-1">
        {alerts.map((a, i) => {
          const dotColor = { green: "bg-emerald-500", yellow: "bg-amber-500", red: "bg-rose-500" }[a.level];
          return (
            <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0" data-testid={`alert-item-${i}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dotColor} mt-2 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a2744] leading-snug">{a.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{a.detail}</p>
              </div>
              <span className="text-[10px] tracking-wide text-slate-500 font-mono uppercase">{a.delta}</span>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);
