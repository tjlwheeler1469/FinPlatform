import { Card, CardContent } from "@/components/ui/card";
import { PillButton } from "@/components/PageShell";
import { Play, Zap, X } from "lucide-react";
import { fmt } from "./_utils";

export const SimulationBanner = ({ simulation, onApply, onClear }) => (
  <Card className="border border-[#D4A84C]/40 bg-white" data-testid="simulation-banner">
    <CardContent className="p-4">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="h-8 w-8 rounded-full border border-[#D4A84C] bg-white flex items-center justify-center flex-shrink-0">
          <Play className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-[260px]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] tracking-[0.16em] font-semibold uppercase text-[#8a6c1a]">Simulating from mission control</p>
            {simulation.urgency && (
              <span className="text-[10px] tracking-wide uppercase font-mono text-[#8a6c1a]">· {simulation.urgency}</span>
            )}
          </div>
          <p className="font-serif text-base text-[#1a2744] mt-1" data-testid="simulation-headline">{simulation.headline}</p>
          {simulation.message && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{simulation.message}</p>}
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          {Number.isFinite(simulation.scoreDelta) && (
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Confidence Δ</p>
              <p className={`font-serif text-lg tabular-nums ${simulation.scoreDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`} data-testid="simulation-score-delta">
                {simulation.scoreDelta >= 0 ? "+" : ""}{simulation.scoreDelta} pts
              </p>
            </div>
          )}
          {Number.isFinite(simulation.financialImpact) && simulation.financialImpact !== 0 && (
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Financial impact</p>
              <p className={`font-serif text-lg tabular-nums ${simulation.financialImpact >= 0 ? "text-emerald-600" : "text-rose-600"}`} data-testid="simulation-financial-impact">
                {simulation.financialImpact >= 0 ? "+" : "−"}{fmt(Math.abs(simulation.financialImpact))}
              </p>
            </div>
          )}
          {Number.isFinite(simulation.impactScore) && (
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Priority</p>
              <p className="font-serif text-lg text-[#1a2744] tabular-nums">{simulation.impactScore}</p>
            </div>
          )}
        </div>
        <PillButton variant="primary" onClick={onApply} data-testid="apply-simulation" className="!bg-[#D4A84C] !text-[#1a2744] hover:!bg-[#b8902a]">
          <Zap className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Apply simulation
        </PillButton>
        <PillButton variant="ghost" onClick={onClear} data-testid="clear-simulation">
          <X className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Clear
        </PillButton>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">Adjust the Live Scenario sliders below to test this strategy. Use Apply or Generate Advice from Mission Control once satisfied.</p>
    </CardContent>
  </Card>
);
