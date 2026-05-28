import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Target, AlertTriangle, Activity, TrendingUp, Calendar, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const TodaysPrioritiesCard = () => {
  const navigate = useNavigate();
  const items = [
    { count: 3, label: "clients below 75% confidence", tone: "rose", icon: AlertTriangle, to: "/retirement-control-center", testid: "priority-confidence" },
    { count: 2, label: "urgent risks", tone: "amber", icon: Activity, to: "/budget-exposure", testid: "priority-risks" },
    { count: 1, label: "rebalance pending", tone: "amber", icon: TrendingUp, to: "/portfolio-rebalancing", testid: "priority-rebalance" },
    { count: 4, label: "reviews due this week", tone: "slate", icon: Calendar, to: "/adviser-compliance", testid: "priority-reviews" },
  ];
  return (
    <Card className="border-slate-200" data-testid="card-priorities">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Today's priorities
          </p>
          <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">{new Date().toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
        <div className="space-y-1">
          {items.map((item, i) => {
            const dotColor = { rose: "bg-rose-500", amber: "bg-amber-500", slate: "bg-slate-400" }[item.tone];
            return (
              <button
                key={i}
                type="button"
                onClick={() => navigate(item.to)}
                className="w-full flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors text-left -mx-1 px-1 rounded focus:outline-none focus:ring-2 focus:ring-[#D4A84C]"
                data-testid={item.testid}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />
                <item.icon className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                <span className="font-serif text-xl text-[#1a2744] tabular-nums">{item.count}</span>
                <span className="text-sm text-slate-700 flex-1">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              </button>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100" data-testid="markets-strip">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Markets
            </p>
            <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono ml-auto">Live</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg border border-slate-200 bg-white text-center" data-testid="market-asx">
              <p className="text-[10px] tracking-wide uppercase text-slate-500">ASX 200</p>
              <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">7,856</p>
              <p className="text-[10px] text-emerald-600 flex items-center justify-center gap-0.5 font-mono"><ArrowUpRight className="h-2.5 w-2.5" />0.42%</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white text-center" data-testid="market-aud">
              <p className="text-[10px] tracking-wide uppercase text-slate-500">AUD/USD</p>
              <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">0.6545</p>
              <p className="text-[10px] text-rose-600 flex items-center justify-center gap-0.5 font-mono"><ArrowDownRight className="h-2.5 w-2.5" />0.15%</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white text-center" data-testid="market-rba">
              <p className="text-[10px] tracking-wide uppercase text-slate-500">RBA Rate</p>
              <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">4.35%</p>
              <p className="text-[10px] text-slate-500 font-mono">unchanged</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
