import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { fmt } from "./_utils";

export const OpportunitiesCard = ({ opportunities, onAction }) => (
  <Card className="border-slate-200" data-testid="card-opportunities">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Opportunities
        </p>
        <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">{fmt(opportunities.reduce((s, o) => s + o.impact, 0))} potential</span>
      </div>
      <div className="space-y-1">
        {opportunities.map((o, i) => (
          <button key={i}
            className="w-full text-left flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors -mx-1 px-1 rounded"
            onClick={() => onAction(o)} data-testid={`opportunity-item-${i}`}>
            <div className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
              <o.icon className="h-3.5 w-3.5 text-[#1a2744]" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1a2744] leading-snug">{o.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{o.detail}</p>
            </div>
            <span className="font-mono text-sm text-[#1a2744] whitespace-nowrap">{fmt(o.impact)}</span>
          </button>
        ))}
      </div>
    </CardContent>
  </Card>
);
