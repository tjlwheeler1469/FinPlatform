// SimpleInvestments — 5-section calm template for the client's investments.
// Answers: How is the portfolio doing? What's overweight/underweight? What should I do?
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, Home, Briefcase, PiggyBank, DollarSign,
  ArrowRight, Sparkles, PieChart,
} from "lucide-react";
import { CLIENT_DATA, getActiveClientId, computeClientTotals } from "@/data/clientData";

const fmt = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

const ICONS = {
  Property: Home, Super: PiggyBank, Shares: TrendingUp, "Managed Fund": Briefcase,
  "Trust Portfolio": Briefcase, Cash: DollarSign,
};

const SimpleInvestments = ({ clientId: propClientId, embedded = false }) => {
  const navigate = useNavigate();
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const totals = computeClientTotals(clientId);

  // Aggregate by type
  const byType = useMemo(() => {
    const grouped = {};
    client.assets.forEach(a => {
      const key = a.type === "Super" ? "Super"
        : (a.type === "Shares" || a.type === "Managed Fund" || a.type === "Trust Portfolio") ? "Investments"
        : a.type === "Property" ? "Property"
        : a.type === "Cash" ? "Cash"
        : "Other";
      grouped[key] = (grouped[key] || 0) + a.value;
    });
    return grouped;
  }, [client]);

  // Weighted average return (performance)
  const ytdReturn = useMemo(() => {
    const total = client.assets.reduce((s, a) => s + a.value, 0);
    if (!total) return 0;
    const weighted = client.assets.reduce((s, a) => s + a.value * (a.change || 0), 0);
    return weighted / total;
  }, [client]);

  // Biggest allocation ≠ first rebalance target
  const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const biggest = sorted[0];
  const gross = totals.grossAssets;
  const biggestPct = gross ? (biggest[1] / gross) * 100 : 0;

  // Drift (picked from rebalancing data if present)
  const drift = (client.rebalancing || []).reduce((best, r) => {
    if (Math.abs(r.diff || 0) > Math.abs(best.diff || 0)) return r;
    return best;
  }, { diff: 0 });

  const topAction = Math.abs(drift.diff || 0) > 5
    ? { title: `Rebalance ${drift.asset}`, detail: `${drift.diff > 0 ? "Over" : "Under"}-weight by ${Math.abs(drift.diff)}%`, impact: 42_000, route: "/portfolio-analyzer" }
    : biggestPct > 40
    ? { title: "Diversify concentration", detail: `${biggest[0]} is ${biggestPct.toFixed(0)}% of portfolio — consider reducing`, impact: 28_000, route: "/portfolio-analyzer" }
    : { title: "Stay the course", detail: "Allocation is well-balanced — small contributions will compound.", impact: 0, route: "/portfolio-analyzer" };

  const statusTone = ytdReturn >= 5 ? "emerald" : ytdReturn >= 0 ? "amber" : "rose";

  return (
    <div className={embedded ? "" : "max-w-3xl mx-auto py-10 px-4"} data-testid="simple-investments">
      <div className="space-y-8">
        {/* SECTION 1 — Hero: Portfolio value + YTD */}
        <div className="text-center" data-testid="investments-hero">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-2">Portfolio Value</p>
          <h1 className="text-5xl font-bold text-[#1a2744] leading-none">{fmt(gross)}</h1>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              statusTone === "emerald" ? "bg-emerald-100 text-emerald-700" :
              statusTone === "amber" ? "bg-amber-100 text-amber-700" :
              "bg-rose-100 text-rose-700"
            }`}>
              {ytdReturn >= 0 ? "↑" : "↓"} {Math.abs(ytdReturn).toFixed(1)}% YTD
            </span>
            <span className="text-sm text-muted-foreground">·  Risk {client.profile.riskProfile}</span>
          </div>
        </div>

        {/* SECTION 2 — Allocation visual (simple bars) */}
        <Card data-testid="investments-allocation">
          <CardContent className="p-6">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-4">Asset allocation</p>
            <div className="space-y-3">
              {sorted.map(([type, val]) => {
                const Icon = ICONS[type] || Briefcase;
                const pct = (val / gross) * 100;
                return (
                  <div key={type} className="flex items-center gap-3" data-testid={`alloc-${type.toLowerCase()}`}>
                    <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-[#1a2744]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-800">{type}</span>
                        <span className="text-sm font-bold text-[#1a2744]">{fmt(val)} <span className="text-[10px] text-muted-foreground">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 — Top action */}
        <Card className="border border-[#D4A84C]/40 bg-[#D4A84C]/5" data-testid="investments-action">
          <CardContent className="p-5 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[#8a6d2a] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] text-[#8a6d2a] uppercase tracking-wide font-semibold mb-1">What to do next</p>
              <p className="text-base font-semibold text-[#1a2744]">{topAction.title}</p>
              <p className="text-xs text-gray-600 mt-1">{topAction.detail}</p>
            </div>
            {topAction.impact > 0 && (
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-muted-foreground uppercase">Impact</p>
                <p className="text-xl font-bold text-emerald-700">{fmt(topAction.impact)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 4 — Top 3 holdings (compact, just names) */}
        <div data-testid="investments-top-holdings">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-3">Top holdings</p>
          <div className="space-y-2">
            {client.assets.slice(0, 3).map((a, i) => (
              <Card key={i} className="border border-gray-200" data-testid={`holding-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#1a2744]/5 flex items-center justify-center flex-shrink-0">
                    {(() => { const Icon = ICONS[a.type] || Briefcase; return <Icon className="h-5 w-5 text-[#1a2744]" />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2744] truncate">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground">{a.type}{a.entity ? ` · ${a.entity}` : ""}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#1a2744]">{fmt(a.value)}</p>
                    {a.change !== undefined && (
                      <p className={`text-[11px] font-semibold ${a.change >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {a.change >= 0 ? "+" : ""}{a.change.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 5 — Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2" data-testid="investments-cta">
          <Button size="lg" className="bg-[#1a2744] hover:bg-[#1a2744]/90 text-base px-8"
            onClick={() => navigate(topAction.route)}
            data-testid="investments-primary-cta">
            <PieChart className="h-4 w-4 mr-2" /> Rebalance
          </Button>
          <Button size="lg" variant="outline" className="text-base px-6"
            onClick={() => toast.success("Scenario opened — switch to Retirement tab to see impact")}
            data-testid="investments-scenario-cta">
            <TrendingUp className="h-4 w-4 mr-2" /> Run scenario
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleInvestments;
