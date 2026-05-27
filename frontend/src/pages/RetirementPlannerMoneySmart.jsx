// Retirement Planner — MoneySmart-style linear flow.
// Five vertically-stacked sections (About you · About your partner · Your income
// · Your super · Your spending · Advanced assumptions) with a sticky Results
// panel on the right showing the projected annual retirement income, Age
// Pension component, super balance trajectory and confidence band.
//
// Power-user features (multi-entity, CGT, scenarios) live behind the
// "Advanced workbench" link → /retirement-planner-workbench.

import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { PageShell, PillButton } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, ChevronRight, ArrowUpRight, Info } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { projectRetirement } from "@/lib/retirementEngine";

const fmt = (v) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const fmtCompact = (v) => {
  if (!v) return "$0";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return fmt(v);
};

// 2025 ASFA Retirement Standard (annual, in today's dollars) — for the
// "What do retirees spend" presets.
const ASFA = {
  single_modest: 33_134,
  single_comfortable: 52_383,
  couple_modest: 47_731,
  couple_comfortable: 73_875,
};

// 2025 Age Pension single/couple maxima + asset test thresholds — used by the
// simplified Age Pension estimator (homeowner column only — MoneySmart's
// default assumption).
const AGE_PENSION = {
  single_max: 29_754,                  // $1,144.40 × 26
  couple_max: 44_855,                  // $862.60 × 2 × 26
  asset_free_single: 314_000,
  asset_free_couple: 470_000,
  taper_per_1k: 78,                    // $3 / fortnight per $1k over threshold = $78/yr
};

// Simple Age Pension estimate from assessable assets (excludes principal home).
const estimateAgePension = (relationship, assessableAssets) => {
  const max = relationship === "couple" ? AGE_PENSION.couple_max : AGE_PENSION.single_max;
  const threshold = relationship === "couple" ? AGE_PENSION.asset_free_couple : AGE_PENSION.asset_free_single;
  if (assessableAssets <= threshold) return max;
  const overK = (assessableAssets - threshold) / 1000;
  const reduction = overK * AGE_PENSION.taper_per_1k;
  return Math.max(0, max - reduction);
};

const SECTION_CLASS = "rounded-2xl border border-slate-200 bg-white p-6";
const SECTION_HEAD = "font-serif text-2xl text-[#1a2744] mb-1";
const SECTION_SUB  = "text-sm text-slate-500 mb-5";
const EYEBROW      = "text-[10px] tracking-[0.18em] uppercase text-[#D4A84C] font-semibold mb-2";

const Field = ({ label, value, onChange, prefix, suffix, step = 1, testid, hint, min, max, type = "number" }) => (
  <div className="space-y-1.5">
    <Label className="text-[11px] tracking-wide text-slate-600">{label}</Label>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>}
      <Input
        type={type}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className={`h-10 text-sm border-slate-300 rounded-lg ${prefix ? "pl-7" : ""} ${suffix ? "pr-12" : ""}`}
        data-testid={testid}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">{suffix}</span>}
    </div>
    {hint && <p className="text-[10px] text-slate-400 leading-snug">{hint}</p>}
  </div>
);

// Segmented control (e.g. Single / Couple, Male / Female).
const Segment = ({ options, value, onChange, testid }) => (
  <div className="inline-flex rounded-full border border-slate-200 bg-white p-1" data-testid={testid}>
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`px-4 py-1.5 text-xs rounded-full transition-all ${value === opt.value ? "bg-[#1a2744] text-white" : "text-slate-600 hover:text-[#1a2744]"}`}
        data-testid={`${testid}-${opt.value}`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const Toggle = ({ label, checked, onChange, hint, testid }) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#1a2744] mt-0.5" data-testid={testid} />
    <span>
      <span className="text-sm text-slate-700">{label}</span>
      {hint && <span className="block text-[10px] text-slate-400 mt-0.5">{hint}</span>}
    </span>
  </label>
);

const RetirementPlanner = ({ embedded = false }) => {
  // ============ Section 1 — About you ============
  const [relationship, setRelationship] = useState("single"); // single | couple
  const [yourAge, setYourAge] = useState(40);
  const [yourGender, setYourGender] = useState("male");       // male | female (for life expectancy)
  const [retireAge, setRetireAge] = useState(67);
  const [homeowner, setHomeowner] = useState(true);

  // ============ Section 2 — About your partner ============
  const [partnerAge, setPartnerAge] = useState(38);
  const [partnerGender, setPartnerGender] = useState("female");

  // ============ Section 3 — Your income ============
  const [yourSalary, setYourSalary] = useState(95000);
  const [partnerSalary, setPartnerSalary] = useState(75000);
  const [includeAgePension, setIncludeAgePension] = useState(true);

  // ============ Section 4 — Your super ============
  const [yourSuper, setYourSuper] = useState(180000);
  const [yourSgRate, setYourSgRate] = useState(12);
  const [yourSalarySac, setYourSalarySac] = useState(0);
  const [yourAfterTax, setYourAfterTax] = useState(0);
  const [partnerSuper, setPartnerSuper] = useState(140000);
  const [partnerSalarySac, setPartnerSalarySac] = useState(0);

  // ============ Section 5 — Other savings ============
  const [otherSavings, setOtherSavings] = useState(50000);
  const [propertyValue, setPropertyValue] = useState(0);
  const [propertyRental, setPropertyRental] = useState(0);

  // ============ Section 6 — Spending in retirement ============
  const [annualSpending, setAnnualSpending] = useState(0);
  // Default: ASFA Comfortable for the relationship type.
  useMemo(() => {
    if (annualSpending === 0) {
      setAnnualSpending(relationship === "couple" ? ASFA.couple_comfortable : ASFA.single_comfortable);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ Section 7 — Advanced assumptions ============
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expectedReturnPct, setExpectedReturnPct] = useState(6.5);
  const [inflationPct, setInflationPct] = useState(2.5);
  const [feesPct, setFeesPct] = useState(0.85);
  const [lifeExpectancyOverride, setLifeExpectancyOverride] = useState(0);

  // -----------------------------------------------------------
  // Derived values + Monte Carlo projection
  // -----------------------------------------------------------
  const computed = useMemo(() => {
    const isCouple = relationship === "couple";
    const householdSuperBalance = yourSuper + (isCouple ? partnerSuper : 0);
    const householdLiquidAssets = householdSuperBalance + otherSavings;
    const employerContribAnnual = (yourSalary * yourSgRate) / 100;
    const partnerEmployerContrib = isCouple ? (partnerSalary * yourSgRate) / 100 : 0;
    const householdAnnualContributions =
      employerContribAnnual + yourSalarySac + yourAfterTax +
      partnerEmployerContrib + (isCouple ? partnerSalarySac : 0);

    // Life expectancy defaults (ABS 2020-22 life tables, simplified)
    const baseLifeExpectancy = {
      male: 84,
      female: 87,
    };
    const yourLifeExp = lifeExpectancyOverride > 0 ? lifeExpectancyOverride : baseLifeExpectancy[yourGender];
    const yearsInRetirement = Math.max(1, yourLifeExp - retireAge);
    const yearsToRetirement = Math.max(0, retireAge - yourAge);

    // Real return after fees
    const realReturn = (expectedReturnPct - inflationPct - feesPct) / 100;
    const nominalReturn = expectedReturnPct / 100;
    const volatility = 0.11; // sensible default for balanced

    // Monte Carlo projection
    const sim = projectRetirement({
      currentPortfolio: householdLiquidAssets,
      annualContributions: householdAnnualContributions,
      annualSpending: annualSpending - (includeAgePension ? estimateAgePension(relationship, householdLiquidAssets * 0.6) : 0),
      yearsToRetirement,
      yearsInRetirement,
      expectedReturn: nominalReturn,
      volatility,
      inflationRate: inflationPct / 100,
      numSims: 500,
      seed: 42, // deterministic so chart doesn't dance as user types
    });

    // Trajectory split into accumulation + drawdown
    const chartData = sim.trajectory.map((t) => ({
      year: yourAge + t.year,
      median: Math.round(t.p50),
      low: Math.round(t.p10),
      high: Math.round(t.p90),
      phase: t.phase,
    }));

    // Age Pension estimate based on median portfolio at retirement
    const assessableAtRetirement = (sim.portfolioAtRetirement) * 0.6; // rough — excludes home, deems other assets
    const agePensionAnnual = includeAgePension ? estimateAgePension(relationship, assessableAtRetirement) : 0;

    // Sustainable income (4% rule on median balance at retirement) + age pension
    const sustainableFromSuper = sim.portfolioAtRetirement * 0.04;
    const projectedIncome = sustainableFromSuper + agePensionAnnual;

    // Shortfall vs desired spending
    const shortfall = annualSpending - projectedIncome;

    return {
      isCouple,
      householdSuperBalance,
      householdLiquidAssets,
      employerContribAnnual,
      partnerEmployerContrib,
      householdAnnualContributions,
      yourLifeExp,
      yearsInRetirement,
      yearsToRetirement,
      realReturn,
      sim,
      chartData,
      agePensionAnnual,
      sustainableFromSuper,
      projectedIncome,
      shortfall,
    };
  }, [
    relationship, yourAge, yourGender, retireAge, partnerAge, partnerGender,
    yourSalary, partnerSalary, includeAgePension,
    yourSuper, yourSgRate, yourSalarySac, yourAfterTax, partnerSuper, partnerSalarySac,
    otherSavings, propertyValue, propertyRental,
    annualSpending, expectedReturnPct, inflationPct, feesPct, lifeExpectancyOverride,
  ]);

  const applyAsfa = useCallback((preset) => {
    setAnnualSpending(ASFA[preset]);
  }, []);

  const confidence = computed.sim.confidence;
  const isOnTrack = confidence >= 75;

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------
  const body = (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6" data-testid="retirement-planner-page">
          {/* ===== Left: Input sections ===== */}
          <div className="space-y-5">

            {/* ----- Section 1 — About you ----- */}
            <section className={SECTION_CLASS} data-testid="section-about-you">
              <p className={EYEBROW}>Step 1</p>
              <h2 className={SECTION_HEAD}>About you</h2>
              <p className={SECTION_SUB}>Tell us a little about yourself — your age, when you plan to retire, and whether you own your home.</p>

              <div className="space-y-5">
                <div className="flex items-center gap-4 flex-wrap">
                  <Label className="text-[11px] tracking-wide text-slate-600 w-32 flex-shrink-0">Relationship</Label>
                  <Segment
                    options={[{ value: "single", label: "Single" }, { value: "couple", label: "Couple" }]}
                    value={relationship} onChange={setRelationship} testid="seg-relationship"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Your age" value={yourAge} onChange={setYourAge} suffix="years" testid="input-your-age" min={18} max={75} />
                  <Field label="Planned retirement age" value={retireAge} onChange={setRetireAge} suffix="years" testid="input-retire-age" min={Math.max(yourAge + 1, 55)} max={80} />
                  <div className="space-y-1.5">
                    <Label className="text-[11px] tracking-wide text-slate-600">Gender (for life expectancy)</Label>
                    <Segment
                      options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]}
                      value={yourGender} onChange={setYourGender} testid="seg-your-gender"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] tracking-wide text-slate-600">Homeowner</Label>
                    <Segment
                      options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]}
                      value={homeowner} onChange={setHomeowner} testid="seg-homeowner"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ----- Section 2 — About your partner (conditional) ----- */}
            {computed.isCouple && (
              <section className={SECTION_CLASS} data-testid="section-about-partner">
                <p className={EYEBROW}>Step 1b</p>
                <h2 className={SECTION_HEAD}>About your partner</h2>
                <p className={SECTION_SUB}>Their age and gender help us estimate how long the household income needs to last.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Partner age" value={partnerAge} onChange={setPartnerAge} suffix="years" testid="input-partner-age" min={18} max={80} />
                  <div className="space-y-1.5">
                    <Label className="text-[11px] tracking-wide text-slate-600">Partner gender</Label>
                    <Segment
                      options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]}
                      value={partnerGender} onChange={setPartnerGender} testid="seg-partner-gender"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ----- Section 3 — Your income ----- */}
            <section className={SECTION_CLASS} data-testid="section-income">
              <p className={EYEBROW}>Step 2</p>
              <h2 className={SECTION_HEAD}>Your income</h2>
              <p className={SECTION_SUB}>Your current gross annual salary{computed.isCouple ? " and your partner's" : ""} — used to project your employer's super contributions.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Your gross annual salary" value={yourSalary} onChange={setYourSalary} prefix="$" testid="input-your-salary" />
                {computed.isCouple && (
                  <Field label="Partner's gross annual salary" value={partnerSalary} onChange={setPartnerSalary} prefix="$" testid="input-partner-salary" />
                )}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Toggle
                  label="Include the Age Pension in my retirement income"
                  hint="Assumes you'll meet the residency, age, and means tests at retirement."
                  checked={includeAgePension}
                  onChange={setIncludeAgePension}
                  testid="toggle-age-pension"
                />
              </div>
            </section>

            {/* ----- Section 4 — Your super ----- */}
            <section className={SECTION_CLASS} data-testid="section-super">
              <p className={EYEBROW}>Step 3</p>
              <h2 className={SECTION_HEAD}>Your super</h2>
              <p className={SECTION_SUB}>Your current balance and any voluntary contributions on top of your employer's compulsory super.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Your current super balance" value={yourSuper} onChange={setYourSuper} prefix="$" testid="input-your-super" />
                <Field label="Employer SG rate" value={yourSgRate} onChange={setYourSgRate} suffix="%" step={0.5} testid="input-sg-rate" min={0} max={15} hint="2025-26 = 12%" />
                <Field label="Salary sacrifice (you)" value={yourSalarySac} onChange={setYourSalarySac} prefix="$" suffix="/ yr" testid="input-your-salsac" hint="Pre-tax voluntary" />
                <Field label="After-tax contributions (you)" value={yourAfterTax} onChange={setYourAfterTax} prefix="$" suffix="/ yr" testid="input-your-aftertax" hint="Non-concessional" />
                {computed.isCouple && (
                  <>
                    <Field label="Partner's super balance" value={partnerSuper} onChange={setPartnerSuper} prefix="$" testid="input-partner-super" />
                    <Field label="Partner salary sacrifice" value={partnerSalarySac} onChange={setPartnerSalarySac} prefix="$" suffix="/ yr" testid="input-partner-salsac" />
                  </>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                <span>Household contributions / year</span>
                <span className="font-mono text-[#1a2744] text-sm">{fmt(computed.householdAnnualContributions)}</span>
                <span className="ml-auto">Household super balance</span>
                <span className="font-mono text-[#1a2744] text-sm">{fmt(computed.householdSuperBalance)}</span>
              </div>
            </section>

            {/* ----- Section 5 — Other savings ----- */}
            <section className={SECTION_CLASS} data-testid="section-other">
              <p className={EYEBROW}>Step 4</p>
              <h2 className={SECTION_HEAD}>Other assets &amp; savings</h2>
              <p className={SECTION_SUB}>Anything else you'll draw on in retirement — shares, term deposits, investment property.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Other liquid savings &amp; shares" value={otherSavings} onChange={setOtherSavings} prefix="$" testid="input-other-savings" />
                <Field label="Investment property value" value={propertyValue} onChange={setPropertyValue} prefix="$" testid="input-property-value" />
                <Field label="Net rental income" value={propertyRental} onChange={setPropertyRental} prefix="$" suffix="/ yr" testid="input-property-rental" />
              </div>
            </section>

            {/* ----- Section 6 — Spending in retirement ----- */}
            <section className={SECTION_CLASS} data-testid="section-spending">
              <p className={EYEBROW}>Step 5</p>
              <h2 className={SECTION_HEAD}>Your spending in retirement</h2>
              <p className={SECTION_SUB}>How much you want to spend each year in retirement (today's dollars). The ASFA Retirement Standard gives a useful starting point.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <Field label="Desired annual spending" value={annualSpending} onChange={setAnnualSpending} prefix="$" testid="input-spending" />
                <div className="hidden md:block" />
              </div>

              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold mb-3">ASFA Retirement Standard · 2025</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: "single_modest", label: "Single · Modest", value: ASFA.single_modest },
                  { key: "single_comfortable", label: "Single · Comfortable", value: ASFA.single_comfortable },
                  { key: "couple_modest", label: "Couple · Modest", value: ASFA.couple_modest },
                  { key: "couple_comfortable", label: "Couple · Comfortable", value: ASFA.couple_comfortable },
                ].map((p) => {
                  const selected = annualSpending === p.value;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyAsfa(p.key)}
                      className={`text-left rounded-xl border p-3.5 transition-all ${selected ? "border-[#1a2744] bg-slate-50 ring-1 ring-[#1a2744]/20" : "border-slate-200 bg-white hover:border-slate-400"}`}
                      data-testid={`asfa-${p.key}`}
                    >
                      <p className="text-[11px] tracking-[0.16em] uppercase text-slate-500">{p.label}</p>
                      <p className="font-serif text-lg text-[#1a2744] mt-0.5 tabular-nums">{fmt(p.value)}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ----- Section 7 — Advanced assumptions (collapsible) ----- */}
            <section className={SECTION_CLASS} data-testid="section-advanced">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full flex items-center justify-between gap-4"
                data-testid="toggle-advanced"
              >
                <div className="text-left">
                  <p className={EYEBROW}>Step 6 · Optional</p>
                  <h2 className={SECTION_HEAD}>Advanced assumptions</h2>
                  <p className="text-sm text-slate-500">Investment return, inflation, fees, life expectancy. Defaults reflect MoneySmart's published assumptions.</p>
                </div>
                {showAdvanced ? <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />}
              </button>

              {showAdvanced && (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Investment return (nominal)" value={expectedReturnPct} onChange={setExpectedReturnPct} suffix="% p.a." step={0.1} testid="input-return" hint="Before fees, before inflation" />
                  <Field label="Inflation (CPI)" value={inflationPct} onChange={setInflationPct} suffix="% p.a." step={0.1} testid="input-inflation" />
                  <Field label="Total fees" value={feesPct} onChange={setFeesPct} suffix="% p.a." step={0.05} testid="input-fees" hint="Admin + investment + advice" />
                  <Field label="Life expectancy override" value={lifeExpectancyOverride} onChange={setLifeExpectancyOverride} suffix="years" testid="input-life-exp" hint={`Leave 0 to use ABS default (${computed.yourLifeExp})`} />
                </div>
              )}
            </section>

            {/* Adviser deep link */}
            <Link
              to="/retirement-planner-workbench"
              className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-5 hover:border-[#D4A84C] hover:bg-amber-50/30 transition-all group"
              data-testid="link-advanced-workbench"
            >
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">For advisers</p>
                <p className="text-sm font-semibold text-[#1a2744] mt-1">Open the advanced retirement workbench</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Multi-entity, CGT, scenario stacks, Monte Carlo bands, market assumptions.</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-[#D4A84C] transition-colors" />
            </Link>

            <p className="text-[11px] text-slate-400 leading-relaxed px-2 pb-4">
              These estimates use MoneySmart methodology: nominal returns less fees and inflation, projected over your time-to-retirement and life expectancy, drawn down at a sustainable rate. Age Pension is estimated on the assets test only and assumes you'll meet eligibility at retirement.
            </p>
          </div>

          {/* ===== Right: Sticky Results panel ===== */}
          <aside className="lg:sticky lg:top-6 self-start" data-testid="results-panel">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <p className={EYEBROW}>Result</p>
                <h3 className="font-serif text-xl text-[#1a2744] leading-tight">Annual retirement income</h3>
                <p className="font-serif text-4xl text-[#1a2744] mt-3 tabular-nums" data-testid="result-income">{fmtCompact(computed.projectedIncome)}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  in today's dollars · {computed.isCouple ? "couple" : "single"} · {includeAgePension ? "incl. Age Pension" : "excl. Age Pension"}
                </p>

                {/* Confidence dot */}
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnTrack ? "bg-emerald-500" : confidence >= 60 ? "bg-amber-500" : "bg-rose-500"}`} />
                  <span className="font-mono text-[#1a2744]">{confidence}% confidence</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{isOnTrack ? "On track" : confidence >= 60 ? "Monitor" : "At risk"}</span>
                </div>

                <div className="h-[180px] mt-5 -mx-1">
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <AreaChart data={computed.chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bandHi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D4A84C" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#D4A84C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="year" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} width={45} />
                      <Tooltip formatter={(v) => fmt(v)} labelFormatter={(v) => `Age ${v}`} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }} />
                      <Area type="monotone" dataKey="high" stackId="band" stroke="none" fill="url(#bandHi)" />
                      <Area type="monotone" dataKey="median" stroke="#1a2744" strokeWidth={2} fill="none" name="Median" />
                      <ReferenceLine x={retireAge} stroke="#D4A84C" strokeDasharray="3 3" label={{ value: "Retire", position: "top", fill: "#D4A84C", fontSize: 9 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2.5 mt-5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">From super (4% rule)</span>
                    <span className="font-mono text-[#1a2744]">{fmt(computed.sustainableFromSuper)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">From Age Pension</span>
                    <span className="font-mono text-[#1a2744]">{includeAgePension ? fmt(computed.agePensionAnnual) : "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="text-slate-600 font-medium">Desired spending</span>
                    <span className="font-mono text-[#1a2744]">{fmt(annualSpending)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{computed.shortfall > 0 ? "Shortfall" : "Surplus"}</span>
                    <span className={`font-mono ${computed.shortfall > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {computed.shortfall > 0 ? "−" : "+"}{fmt(Math.abs(computed.shortfall))}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className={EYEBROW}>Super at retirement (median)</p>
                  <p className="font-serif text-2xl text-[#1a2744] tabular-nums" data-testid="result-super-at-retirement">{fmtCompact(computed.sim.portfolioAtRetirement)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">P10 → P90 band: {fmtCompact(computed.sim.p10AtLifeEnd)} → {fmtCompact(computed.sim.p90AtLifeEnd)} at age {computed.yourLifeExp}</p>
                </div>

                {computed.shortfall > 0 && (
                  <div className="mt-5 flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50/60 border border-amber-200 rounded-lg p-3">
                    <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>To close the gap of <span className="font-mono">{fmtCompact(computed.shortfall)}</span>, try adding {fmtCompact(Math.round(computed.shortfall / 0.04 / Math.max(1, computed.yearsToRetirement)))}/yr more in contributions, or pushing retirement back 2-3 years.</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <p className="text-[10px] text-slate-400 text-center mt-3">
              Updates live as you change inputs · MoneySmart-aligned methodology
            </p>
          </aside>
        </div>
  );

  return embedded ? body : (
    <Layout>
      <PageShell
        eyebrow="CALCULATOR · RETIREMENT"
        title="Retirement planner"
        accent="will i have enough?"
        subtitle="Project your retirement income — your super, the Age Pension, and any other savings — using the same methodology as the MoneySmart retirement planner. Edit any field and the results recalculate instantly."
        meta="MONEYSMART · METHODOLOGY ALIGNED"
        metrics={[
          { label: "Annual income at retirement", value: fmtCompact(computed.projectedIncome) },
          { label: "Confidence", value: `${confidence}%` },
          { label: "Years to retirement", value: String(computed.yearsToRetirement) },
          { label: "Years in retirement", value: String(computed.yearsInRetirement) },
        ]}
      >
        {body}
      </PageShell>
    </Layout>
  );
};

export default RetirementPlanner;
