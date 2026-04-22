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
        <Card key={type}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>{type}</span>
              <span className="text-xs text-muted-foreground">{fmt(list.reduce((s, x) => s + x.value, 0))}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {list.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.entity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{fmt(a.value)}</p>
                  {a.change !== undefined && (
                    <p className={`text-[11px] ${a.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{a.change >= 0 ? "+" : ""}{a.change.toFixed(1)}%</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <p className="text-[11px] text-center text-muted-foreground py-2 flex items-center justify-center gap-1.5"><Lock className="h-3 w-3" />View only — contact your adviser to adjust holdings</p>
    </div>
  );
};

export default InvestmentsTab;
