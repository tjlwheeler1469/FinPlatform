import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { PillButton } from "@/components/PageShell";
import { Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { projectRetirement } from "@/components/ScenarioEngine";
import { fmt, mapSimulationToSliders } from "./_utils";

export const EmbeddedScenarioCard = ({ client, baseConfidence, simulation, applyTrigger = 0, seed }) => {
  const liquidAssets = useMemo(() =>
    client.assets.filter(a => ["Super", "Shares", "Managed Fund", "Cash", "Trust Portfolio"].includes(a.type))
      .reduce((s, a) => s + a.value, 0),
  [client]);

  const [retireAge, setRetireAge] = useState(client.retirement.retirement_age);
  const [annualSpend, setAnnualSpend] = useState(client.retirement.retirement_spending);
  const [annualContrib, setAnnualContrib] = useState(client.retirement.annual_contributions);
  const [volatility, setVolatility] = useState(12);

  useEffect(() => {
    if (!applyTrigger || !simulation) return;
    const next = mapSimulationToSliders(
      simulation,
      { retireAge, annualSpend, annualContrib, volatility },
      client
    );
    if (!next) return;
    if (next.retireAge !== retireAge) setRetireAge(next.retireAge);
    if (next.annualSpend !== annualSpend) setAnnualSpend(next.annualSpend);
    if (next.annualContrib !== annualContrib) setAnnualContrib(next.annualContrib);
    if (next.volatility !== volatility) setVolatility(next.volatility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTrigger]);

  const scenario = useMemo(() => {
    const yearsToRet = Math.max(1, retireAge - client.profile.age);
    const result = projectRetirement({
      currentPortfolio: liquidAssets,
      annualContributions: annualContrib,
      annualSpending: annualSpend,
      yearsToRetirement: yearsToRet,
      expectedReturn: 0.065,
      volatility: volatility / 100,
      inflationRate: 0.03,
      seed,
    });
    return { ...result, yearsToRet };
  }, [liquidAssets, retireAge, annualSpend, annualContrib, volatility, client.profile.age, seed]);

  const delta = scenario.confidence - baseConfidence;

  return (
    <Card className="border-slate-200" data-testid="card-scenario-engine">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Live scenario
          </p>
          <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">Monte Carlo · 500 sims</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 mb-5">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-serif text-4xl text-[#1a2744] tabular-nums" data-testid="scenario-confidence">{scenario.confidence}%</span>
            <span className="text-[10px] tracking-wide uppercase text-slate-500">confidence</span>
            {delta !== 0 && (
              <span className={`ml-auto text-xs font-mono flex items-center gap-0.5 ${delta > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {delta > 0 ? "+" : ""}{delta}% vs current
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Portfolio at retirement · <span className="font-mono text-[#1a2744]">{fmt(scenario.portfolioAtRetirement)}</span></p>
        </div>

        {simulation && (
          <div className="mb-5 rounded-xl border border-[#D4A84C]/40 bg-white p-4" data-testid="with-strategy-projection">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] tracking-[0.16em] uppercase text-[#8a6c1a] font-semibold">With strategy</p>
              <span className="text-[10px] tracking-wide uppercase font-mono text-[#8a6c1a]">{simulation.headline?.slice(0, 36)}</span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              {Number.isFinite(simulation.scoreDelta) && (
                <span className="font-serif text-2xl text-[#1a2744] tabular-nums">
                  {Math.min(100, Math.max(0, baseConfidence + simulation.scoreDelta))}%
                </span>
              )}
              <span className="text-[10px] tracking-wide uppercase text-slate-500">projected confidence</span>
              {Number.isFinite(simulation.financialImpact) && simulation.financialImpact !== 0 && (
                <span className="ml-auto font-mono text-sm text-emerald-600">
                  {simulation.financialImpact >= 0 ? "+" : "−"}{fmt(Math.abs(simulation.financialImpact))} lifetime
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Click <span className="font-semibold text-[#1a2744]">Apply simulation</span> on the banner to push these into the sliders below.</p>
          </div>
        )}

        <div className="space-y-4">
          <div data-testid="slider-retire-age">
            <div className="flex justify-between mb-2">
              <label className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Retirement age</label>
              <span className="font-mono text-xs text-[#1a2744]">{retireAge}</span>
            </div>
            <Slider min={55} max={75} step={1} value={[retireAge]} onValueChange={(v) => setRetireAge(v[0])} />
          </div>
          <div data-testid="slider-spending">
            <div className="flex justify-between mb-2">
              <label className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Retirement spending</label>
              <span className="font-mono text-xs text-[#1a2744]">{fmt(annualSpend)}/yr</span>
            </div>
            <Slider min={50000} max={500000} step={5000} value={[annualSpend]} onValueChange={(v) => setAnnualSpend(v[0])} />
          </div>
          <div data-testid="slider-contributions">
            <div className="flex justify-between mb-2">
              <label className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Annual contributions</label>
              <span className="font-mono text-xs text-[#1a2744]">{fmt(annualContrib)}/yr</span>
            </div>
            <Slider min={0} max={300000} step={5000} value={[annualContrib]} onValueChange={(v) => setAnnualContrib(v[0])} />
          </div>
          <div data-testid="slider-volatility">
            <div className="flex justify-between mb-2">
              <label className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Portfolio volatility (σ)</label>
              <span className="font-mono text-xs text-[#1a2744]">
                {volatility}% · {volatility <= 8 ? "Conservative" : volatility <= 14 ? "Balanced" : volatility <= 18 ? "Growth" : "Aggressive"}
              </span>
            </div>
            <Slider min={4} max={24} step={1} value={[volatility]} onValueChange={(v) => setVolatility(v[0])} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-5">
          <PillButton variant="ghost" data-testid="preset-retire-65" className="!justify-center"
            onClick={() => { setRetireAge(65); setAnnualSpend(client.retirement.retirement_spending); setAnnualContrib(client.retirement.annual_contributions); }}>
            Retire @ 65
          </PillButton>
          <PillButton variant="ghost" data-testid="preset-retire-67" className="!justify-center"
            onClick={() => { setRetireAge(67); setAnnualSpend(client.retirement.retirement_spending); setAnnualContrib(client.retirement.annual_contributions); }}>
            Retire @ 67
          </PillButton>
        </div>
      </CardContent>
    </Card>
  );
};
