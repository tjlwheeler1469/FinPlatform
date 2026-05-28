// Client Home — radically simplified: Score · Future Income · Gap · Next Best Action + scenario tool.
import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Target, Sliders } from "lucide-react";
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
      <PageShell
        eyebrow={`HELLO, ${(client.profile?.first_name || client.profile?.name?.split(" ")[0] || "").toUpperCase()}`}
        title="Your plan"
        accent={`is ${baseline.classification.label.toLowerCase()}`}
        subtitle={`The four things that matter right now — score, future income, gap, and the single next action that moves the needle. Managed by ${client.profile?.advisor || "your adviser"}.`}
        meta="UPDATED JUST NOW"
        metrics={[
          { label: "Readiness", value: `${baseline.score}`, hint: "0 – 100" },
          { label: "Future income", value: fmt(baseline.outcome.sustainableIncome), hint: "real / year" },
          { label: "Gap", value: baseline.outcome.fundingGap > 0 ? fmt(baseline.outcome.fundingGap) : "—", hint: baseline.outcome.fundingGap > 0 ? "shortfall today" : "fully funded" },
          { label: "Retire at", value: String(client.retirement?.retirement_age || 67), hint: "target age" },
        ]}
      >
      <div className="space-y-5" data-testid="client-home">

        {/* The 4 things that matter — everything else is noise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1 — Score */}
          <Card className="border-slate-200">
            <CardContent className="p-6 flex items-center gap-6">
              <ReadinessDial score={baseline.score} size={160} testId="home-score-dial" />
              <div className="flex-1">
                <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">Retirement readiness</p>
                <p className="font-serif text-4xl text-[#1a2744] mt-1 tabular-nums">{baseline.score}<span className="text-slate-400 text-lg font-sans font-normal">/100</span></p>
                <p className="text-sm text-slate-600 mt-2">You're <span className="font-semibold text-[#1a2744]">{baseline.classification.label}</span> for retirement at age {client.retirement?.retirement_age}.</p>
              </div>
            </CardContent>
          </Card>

          {/* 2 — Future Income · 3 — Gap */}
          <div className="grid grid-cols-1 gap-5">
            <Card data-testid="home-future-income" className="border-slate-200">
              <CardContent className="p-5">
                <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">Future income (real, /year)</p>
                <p className="font-serif text-4xl text-[#1a2744] mt-1 tabular-nums">{fmt(baseline.outcome.sustainableIncome)}</p>
                <p className="text-[11px] text-slate-500 mt-1">Against a target of {fmt(client.retirement?.retirement_spending || 0)}/yr.</p>
              </CardContent>
            </Card>
            <Card data-testid="home-gap" className="border-slate-200">
              <CardContent className="p-5">
                <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">Funding gap</p>
                <p className="font-serif text-4xl text-[#1a2744] mt-1 tabular-nums">
                  {baseline.outcome.fundingGap > 0 ? fmt(baseline.outcome.fundingGap) : "Fully funded"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
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
          <Card className="border-[#D4A84C]/40 bg-white" data-testid="home-next-action">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-[#D4A84C]/40 bg-white flex items-center justify-center flex-shrink-0">
                <Target className="h-4 w-4 text-[#D4A84C]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] tracking-[0.18em] uppercase text-[#8a6c1a] font-semibold">Next best action</p>
                <h3 className="font-serif text-lg text-[#1a2744] mt-0.5">{nextBest.label}</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Projected readiness after change: <span className="font-mono text-[#1a2744] font-semibold">{nextBest.score}</span> ({nextBest.uplift >= 0 ? "+" : ""}{nextBest.uplift} pts)
                </p>
              </div>
              <Button size="sm" variant="outline" className="border-[#1a2744] text-[#1a2744] hover:bg-[#1a2744] hover:text-white rounded-full" onClick={() => window.location.assign("/client-portal?tab=msgs")} data-testid="home-discuss-btn">
                Discuss with adviser
              </Button>
            </CardContent>
          </Card>
        )}

        {/* What if tool — live recalc */}
        <Card data-testid="home-whatif" className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2"><Sliders className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> What if…</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5"><Label className="text-[11px] tracking-wide text-slate-600">Retire at age</Label><span className="font-mono text-sm text-[#1a2744] tabular-nums">{retireAge}</span></div>
                  <Slider value={[retireAge]} min={55} max={75} step={1} onValueChange={(v) => setRetireAge(v[0])} data-testid="home-slider-age" />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5"><Label className="text-[11px] tracking-wide text-slate-600">Contribute /year</Label><span className="font-mono text-sm text-[#1a2744] tabular-nums">{fmt(contrib)}</span></div>
                  <Slider value={[contrib]} min={0} max={60000} step={1000} onValueChange={(v) => setContrib(v[0])} data-testid="home-slider-contrib" />
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg bg-white">
                <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">New score</p>
                <ReadinessDial score={scenario.score} size={140} testId="home-scenario-dial" />
                <div className="mt-2 flex items-center gap-1 font-mono text-sm text-[#1a2744]">
                  <span className="text-[#D4A84C]">{delta >= 0 ? "▲" : "▼"}</span>
                  <NumberRoll
                    value={delta}
                    format={(v) => (v >= 0 ? "+" : "") + Math.round(v) + " pts vs today"}
                    testId="home-delta-roll"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  New income: <NumberRoll value={scenario.outcome.sustainableIncome} format={fmt} className="font-mono font-semibold text-[#1a2744]" testId="home-income-roll" />/yr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="h-3.5 w-3.5 text-[#D4A84C] flex-shrink-0" strokeWidth={1.5} />
            <p className="text-[11px] text-slate-500 flex-1">
              Want the full readiness view on your phone? <a href="/client-readiness" className="font-semibold text-[#1a2744] hover:underline" data-testid="home-open-mobile-portal">Open mobile portal</a> · for investments &amp; goals use your <a href="/client-portal" className="font-semibold text-[#1a2744] hover:underline">dashboard</a>.
            </p>
          </CardContent>
        </Card>
      </div>
      </PageShell>
    </Layout>
  );
};

export default ClientHome;
