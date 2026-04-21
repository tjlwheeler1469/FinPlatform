// MarketsStrip — compact live markets widget for firm dashboard and client dashboard.
// Single source so both places show the same numbers.
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

const MARKETS = [
  { label: "ASX 200", value: "7,856", change: 0.42, dir: "up" },
  { label: "S&P 500", value: "5,821", change: 0.28, dir: "up" },
  { label: "AUD/USD", value: "0.6545", change: -0.15, dir: "down" },
  { label: "RBA Cash", value: "4.10%", change: 0, dir: "flat" },
  { label: "10Y Bond", value: "4.32%", change: 0.04, dir: "up" },
  { label: "Gold (USD)", value: "$3,142", change: 0.67, dir: "up" },
];

const MarketsStrip = ({ compact = false, title = "Markets" }) => (
  <Card data-testid="markets-strip">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-[#1a2744]" />
        <p className="text-xs font-semibold text-[#1a2744] uppercase tracking-wide">{title}</p>
        <Badge variant="outline" className="text-[9px] ml-1">Live</Badge>
        <p className="ml-auto text-[10px] text-muted-foreground">Last updated {new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
      <div className={`grid ${compact ? "grid-cols-3" : "grid-cols-3 md:grid-cols-6"} gap-2`}>
        {MARKETS.slice(0, compact ? 3 : 6).map((m) => (
          <div key={m.label} className="p-2 rounded bg-gray-50 text-center" data-testid={`market-${m.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
            <p className="text-sm font-bold text-[#1a2744]">{m.value}</p>
            <p className={`text-[10px] flex items-center justify-center gap-0.5 ${m.dir === "up" ? "text-emerald-600" : m.dir === "down" ? "text-rose-600" : "text-muted-foreground"}`}>
              {m.dir === "up" && <ArrowUpRight className="h-2.5 w-2.5" />}
              {m.dir === "down" && <ArrowDownRight className="h-2.5 w-2.5" />}
              {m.dir === "flat" ? "unchanged" : `${m.change >= 0 ? "+" : ""}${m.change.toFixed(2)}%`}
            </p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default MarketsStrip;
