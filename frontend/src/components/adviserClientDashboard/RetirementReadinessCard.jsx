import { Card, CardContent } from "@/components/ui/card";
import { PillButton } from "@/components/PageShell";
import { Gauge, Sparkles } from "lucide-react";
import { fmt } from "./_utils";

export const RetirementReadinessCard = ({ confidence, surplus, topRisk, onImprove }) => {
  const tone = confidence >= 85 ? "emerald" : confidence >= 70 ? "amber" : "rose";
  const dotColor = { emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500" }[tone];
  const ringColor = { emerald: "#10b981", amber: "#f59e0b", rose: "#f43f5e" }[tone];
  const statusLabel = tone === "emerald" ? "On track" : tone === "amber" ? "Monitor" : "At risk";

  return (
    <Card className="border-slate-200" data-testid="card-retirement-readiness">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Retirement readiness
          </p>
          <span className="flex items-center gap-1.5 text-[10px] tracking-wide uppercase text-slate-600 font-semibold">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {statusLabel}
          </span>
        </div>
        <div className="flex items-end gap-5">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={ringColor} strokeWidth="6"
                strokeDasharray={`${(confidence / 100) * 264} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-2xl text-[#1a2744] tabular-nums" data-testid="confidence-score">{confidence}%</span>
              <span className="text-[9px] tracking-wide uppercase text-slate-500">confidence</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Success probability</p>
              <p className="font-serif text-lg text-[#1a2744] mt-0.5 tabular-nums">{confidence}%</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">{surplus >= 0 ? "Surplus" : "Shortfall"}</p>
              <p className={`font-serif text-base mt-0.5 tabular-nums ${surplus >= 0 ? "text-[#1a2744]" : "text-rose-600"}`}>{fmt(Math.abs(surplus))}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold mb-1">Top risk driver</p>
          <p className="text-sm text-slate-700 mb-3 leading-snug">{topRisk}</p>
          <PillButton variant="primary" className="w-full !justify-center" onClick={onImprove} data-testid="btn-improve-outcome">
            <Sparkles className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Improve outcome
          </PillButton>
        </div>
      </CardContent>
    </Card>
  );
};
