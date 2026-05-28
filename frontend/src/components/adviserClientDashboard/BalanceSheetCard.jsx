import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Briefcase, Home, PiggyBank, Building2 } from "lucide-react";
import { fmt } from "./_utils";

export const BalanceSheetCard = ({ client, totals }) => {
  const byType = useMemo(() => {
    const grouped = {};
    client.assets.forEach(a => {
      const key = a.type === "Super" ? "Super / Pensions" :
        (a.type === "Trust Portfolio" || a.entity === "Trust") ? "Trusts / Entities" :
        a.type === "Cash" ? "Cash" :
        a.type === "Property" ? "Property" :
        (a.type === "Shares" || a.type === "Managed Fund") ? "Investments" : "Other";
      grouped[key] = (grouped[key] || 0) + a.value;
    });
    return grouped;
  }, [client]);

  const iconMap = { "Super / Pensions": PiggyBank, "Trusts / Entities": Building2, Property: Home, Investments: TrendingUp, Cash: DollarSign, Other: Briefcase };
  const maxVal = Math.max(...Object.values(byType), 1);

  return (
    <Card className="border-slate-200" data-testid="card-balance-sheet">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Household financial map</p>
            <p className="font-serif text-2xl text-[#1a2744] mt-1 tabular-nums">{fmt(totals.netWorth)}<span className="text-sm text-slate-500 font-sans font-normal ml-2">net worth</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Assets · liabilities</p>
            <p className="text-xs text-slate-700 font-mono mt-1">{fmt(totals.grossAssets)} · {fmt(totals.totalLiabilities)}</p>
          </div>
        </div>
        <div className="space-y-3">
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, val]) => {
            const Icon = iconMap[type] || Briefcase;
            return (
              <div key={type} className="flex items-center gap-3" data-testid={`asset-row-${type.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                <div className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-[#1a2744]" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-slate-600">{type}</span>
                    <span className="font-mono text-xs text-[#1a2744]">{fmt(val)}</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4A84C] rounded-full transition-all" style={{ width: `${(val / maxVal) * 100}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
          <div>
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Income</p>
            <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">{fmt(client.profile.incomeHousehold)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Expenses</p>
            <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">{fmt(client.profile.expensesAnnual)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Liabilities</p>
            <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">{fmt(totals.totalLiabilities)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
