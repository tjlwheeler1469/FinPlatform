import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { fmt } from "./utils";

const InvestmentsTab = ({ client }) => {
  const grouped = useMemo(() => client.assets.reduce((acc, a) => {
    (acc[a.type] = acc[a.type] || []).push(a);
    return acc;
  }, {}), [client]);

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([type, list]) => (
        <Card key={type} className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">{type}</span>
              <span className="font-mono text-[11px] text-slate-500">{fmt(list.reduce((s, x) => s + x.value, 0))}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {list.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                <div>
                  <p className="font-medium text-[#1a2744]">{a.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{a.entity}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[#1a2744]">{fmt(a.value)}</p>
                  {a.change !== undefined && (
                    <p className={`text-[11px] mt-0.5 ${a.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{a.change >= 0 ? "+" : ""}{a.change.toFixed(1)}%</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <p className="text-[11px] text-center text-slate-400 py-2 flex items-center justify-center gap-1.5"><Lock className="h-3 w-3" />View only — contact your adviser to adjust holdings</p>
    </div>
  );
};

export default InvestmentsTab;
