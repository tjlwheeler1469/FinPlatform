// Client Home — radically simplified: Score · Future Income · Gap · Next Best Action + scenario tool.
import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Sparkles, Target, Sliders } from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { whatMovesTheNeedle } from "@/engine/retirementReadinessEngine";
import { computeReadinessCached } from "@/engine/readinessCache";
import ReadinessDial from "@/components/readiness/ReadinessDial";
import NumberRoll from "@/components/ui/NumberRoll";

const fmt = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

const ClientHome = () => {
  const clientId = getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  // Sliders for the "what if" tool
  const [retireAge, setRetireAge] = useState(client.retirement?.retirement_age || 67);
  const [contrib, setContrib] = useState(client.retirement?.annual_contributions || 0);

  const baseline = useMemo(() => computeReadinessCached(clientId, client, { numSims: 150 }), [clientId, client]);
  const nextBest = useMemo(() => whatMovesTheNeedle(client)[0], [client]);

  const scenario = useMemo(() => computeReadinessCached(`${clientId}:scenario`, {
    ...client,
    retirement: { ...client.retirement, retirement_age: retireAge, annual_contributions: contrib },
  }, { numSims: 100 }), [clientId, client, retireAge, contrib]);
  const delta = scenario.score - baseline.score;

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto p-4 space-y-5" data-testid="client-home">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744]">Hello, {client.profile?.first_name || client.profile?.name.split(" ")[0]}</h1>
            <p className="text-xs text-muted-foreground">Your retirement plan, at a glance · managed by {client.profile?.advisor || "your adviser"}</p>
          </div>
          <Badge variant="outline" className="bg-[#D4A84C]/10 border-[#D4A84C]/40 text-[#7a5d1f] self-start md:self-center">
            Updated just now
          </Badge>
        </div>

        {/* The 4 things that matter — everything else is noise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1 — Score */}
          <Card className="bg-gradient-to-br from-[#0f1d35] to-[#1a2744] text-white border-0">
            <CardContent className="p-6 flex items-center gap-6">
              <ReadinessDial score={baseline.score} size={160} testId="home-score-dial" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-white/60">Retirement Readiness</p>
                <p className="text-4xl font-bold mt-1">{baseline.score}<span className="text-white/40 text-lg">/100</span></p>
                <p className="text-sm text-white/80 mt-2">You're <span className="font-bold">{baseline.classification.label}</span> for retirement at age {client.retirement?.retirement_age}.</p>
              </div>
            </CardContent>
          </Card>

          {/* 2 — Future Income · 3 — Gap */}
          <div className="grid grid-cols-1 gap-5">
            <Card data-testid="home-future-income">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Future Income (real, /year)</p>
                <p className="text-4xl font-bold text-emerald-700 mt-1 tabular-nums">{fmt(baseline.outcome.sustainableIncome)}</p>
                <p className="text-xs text-muted-foreground mt-1">Against a target of {fmt(client.retirement?.retirement_spending || 0)}/yr.</p>
              </CardContent>
            </Card>
            <Card data-testid="home-gap" className={baseline.outcome.fundingGap > 0 ? "border-amber-300" : "border-emerald-300"}>
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Funding Gap</p>
                <p className={`text-4xl font-bold mt-1 tabular-nums ${baseline.outcome.fundingGap > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                  {baseline.outcome.fundingGap > 0 ? fmt(baseline.outcome.fundingGap) : "Fully funded"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {baseline.outcome.fundingGap > 0
                    ? `You'd need roughly ${fmt(baseline.inputs.requiredCapital)} to fully fund spend — gap shown is the shortfall today.`
                    : "You're on track to fund your target spend under the 4% rule."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 4 — Next Best Action */}
        {nextBest && (
          <Card className="border-[#D4A84C]/40 bg-[#D4A84C]/5" data-testid="home-next-action">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#D4A84C]/20 flex items-center justify-center flex-shrink-0">
                <Target className="h-5 w-5 text-[#7a5d1f]" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-[#7a5d1f]">Next Best Action</p>
                <h3 className="text-lg font-semibold text-[#1a2744] mt-0.5">{nextBest.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Projected readiness after change: <span className="font-bold text-emerald-700">{nextBest.score}</span> ({nextBest.uplift >= 0 ? "+" : ""}{nextBest.uplift} pts)
                </p>
              </div>
              <Button size="sm" className="bg-[#1a2744] hover:bg-[#0f1d35]" onClick={() => window.location.assign("/client-portal?tab=msgs")} data-testid="home-discuss-btn">
                Discuss with adviser
              </Button>
            </CardContent>
          </Card>
        )}

        {/* What if tool — live recalc */}
        <Card data-testid="home-whatif">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Sliders className="h-4 w-4 text-[#D4A84C]" /> What if…</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5"><Label>Retire at age</Label><span className="font-semibold tabular-nums">{retireAge}</span></div>
                  <Slider value={[retireAge]} min={55} max={75} step={1} onValueChange={(v) => setRetireAge(v[0])} data-testid="home-slider-age" />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5"><Label>Contribute /year</Label><span className="font-semibold tabular-nums">{fmt(contrib)}</span></div>
                  <Slider value={[contrib]} min={0} max={60000} step={1000} onValueChange={(v) => setContrib(v[0])} data-testid="home-slider-contrib" />
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">New score</p>
                <ReadinessDial score={scenario.score} size={140} testId="home-scenario-dial" />
                <div className={`mt-2 flex items-center gap-1 font-bold text-sm ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {delta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <NumberRoll
                    value={delta}
                    format={(v) => (v >= 0 ? "+" : "") + Math.round(v) + " pts vs today"}
                    testId="home-delta-roll"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  New income: <NumberRoll value={scenario.outcome.sustainableIncome} format={fmt} className="font-semibold text-emerald-700" testId="home-income-roll" />/yr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="border-muted">
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-[#D4A84C] flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Want the full picture? Visit <a href="/client-portal" className="font-semibold text-[#1a2744] hover:underline">your dashboard</a> for all your investments, budget, tax, and goals.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClientHome;
