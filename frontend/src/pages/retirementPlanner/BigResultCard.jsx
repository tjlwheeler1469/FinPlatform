// BigResultCard — prominent end-of-page result panel for the Retirement Planner.
// Renders the headline annual retirement income at very large size and four
// supporting metrics on the right. Drives the user's understanding that
// changing inputs changes this number.
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { fmt, fmtCompact, EYEBROW } from "./plannerHelpers";

export const BigResultCard = ({ computed, annualSpending, includeAgePension, confidence, yourAge }) => {
  const pillClass = computed.fundingStatus === "fully_funded"
    ? "border-[#1a2744] text-[#1a2744]"
    : computed.fundingStatus === "minor_gap"
    ? "border-[#D4A84C] text-[#8a6c1a]"
    : "border-slate-400 text-slate-600";
  const dotClass = computed.fundingStatus === "fully_funded"
    ? "bg-[#1a2744]"
    : computed.fundingStatus === "minor_gap"
    ? "bg-[#D4A84C]"
    : "bg-slate-400";
  const pillLabel = computed.fundingStatus === "fully_funded"
    ? "Fully funded"
    : computed.fundingStatus === "minor_gap"
    ? "Minor gap"
    : "Underfunded";

  return (
    <Card className="border-slate-200" data-testid="result-card">
      <CardContent className="p-8 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Headline */}
          <div>
            <p className={EYEBROW}>Result</p>
            <h2 className="font-serif text-2xl text-[#1a2744] mt-1.5">Your annual retirement income</h2>
            <p
              className="font-serif text-7xl md:text-8xl text-[#1a2744] mt-5 tabular-nums leading-none"
              data-testid="result-income"
            >
              {fmtCompact(computed.achievableSpending)}
            </p>
            <p className="text-sm text-slate-500 mt-4">
              per year in today's dollars · {computed.isCouple ? "couple" : "single"} ·
              {" "}{includeAgePension ? "incl. Age Pension" : "excl. Age Pension"} ·
              {" "}investment option {computed.option.label}
            </p>
            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] tracking-wide uppercase font-semibold ${pillClass}`}
                data-testid="result-status-pill"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
                {pillLabel}
              </span>
              <span className="text-xs text-slate-500 font-mono">{confidence}% confidence</span>
            </div>
          </div>

          {/* Right column — supporting metrics */}
          <div className="space-y-4 lg:border-l lg:border-slate-100 lg:pl-8">
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">Desired spending</p>
              <p className="font-serif text-2xl text-[#1a2744] mt-1 tabular-nums" data-testid="result-desired-spending">
                {fmtCompact(annualSpending)}
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">
                {computed.shortfall > 0 ? "Annual shortfall" : "Annual surplus"}
              </p>
              <p
                className={`font-serif text-2xl mt-1 tabular-nums ${computed.shortfall > 0 ? "text-rose-600" : "text-[#1a2744]"}`}
                data-testid="result-gap"
              >
                {computed.shortfall > 0 ? "−" : "+"}{fmtCompact(Math.abs(computed.shortfall))}
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">
                Super at retirement (median)
              </p>
              <p className="font-serif text-2xl text-[#1a2744] mt-1 tabular-nums" data-testid="result-super-at-retirement">
                {fmtCompact(computed.sim.portfolioAtRetirement)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">at age {computed.yearsToRetirement + yourAge}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">
                From super (4%) / Age pension
              </p>
              <p className="font-serif text-base text-[#1a2744] mt-1 tabular-nums">
                {fmt(computed.sustainableFromSuper)}
                {includeAgePension ? ` + ${fmt(computed.agePensionAnnual)}` : ""}
              </p>
            </div>
          </div>
        </div>

        {computed.shortfall > 0 && (
          <div
            className="mt-7 flex items-start gap-2 text-xs text-amber-700 bg-amber-50/60 border border-amber-200 rounded-lg p-3"
            data-testid="shortfall-hint"
          >
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              To close the gap of <span className="font-mono">{fmtCompact(computed.shortfall)}</span>,
              try adding {fmtCompact(Math.round(computed.shortfall / 0.04 / Math.max(1, computed.yearsToRetirement)))}/yr more
              in contributions, or pushing retirement back 2-3 years.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BigResultCard;
