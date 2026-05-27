// Superannuation Contribution Calculator — MoneySmart-style linear flow.
// Layout: left column = scrollable input sections (You & super fund, Your super,
// Fund fees, Investment option, Compare to alt fund); right column = sticky
// Results panel with projected balance + chart + fees breakdown.

import { useState, useMemo, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { PageShell, PillButton } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lightbulb, ChevronRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const fmt = (v) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const fmtCompact = (v) => {
  if (!v) return "$0";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return fmt(v);
};

// MoneySmart investment-option presets (real return after inflation & default fees).
const INVESTMENT_OPTIONS = [
  { key: "cash",        label: "Cash",        nominal: 3.5,  desc: "Lowest risk · cash deposits, term deposits" },
  { key: "conservative", label: "Conservative", nominal: 4.5, desc: "20% growth assets · low risk" },
  { key: "moderate",    label: "Moderate",    nominal: 5.5,  desc: "50% growth assets · medium-low risk" },
  { key: "balanced",    label: "Balanced",    nominal: 6.5,  desc: "70% growth assets · medium risk (default)" },
  { key: "growth",      label: "Growth",      nominal: 7.5,  desc: "85% growth assets · medium-high risk" },
  { key: "high_growth", label: "High Growth", nominal: 8.5,  desc: "100% growth assets · high risk" },
];

// 2024-25 marginal-tax bracket helper (incl. Medicare 2%).
const marginalRate = (taxableIncome) => {
  if (taxableIncome <= 18200) return 0;
  if (taxableIncome <= 45000) return 0.16 + 0.02;
  if (taxableIncome <= 135000) return 0.30 + 0.02;
  if (taxableIncome <= 190000) return 0.37 + 0.02;
  return 0.45 + 0.02;
};

const SECTION_CLASS = "rounded-2xl border border-slate-200 bg-white p-6";
const SECTION_HEAD = "font-serif text-2xl text-[#1a2744] mb-1";
const SECTION_SUB  = "text-sm text-slate-500 mb-5";
const EYEBROW      = "text-[10px] tracking-[0.18em] uppercase text-[#D4A84C] font-semibold mb-2";

// Compact labelled number field with prefix/suffix.
const Field = ({ label, value, onChange, prefix, suffix, step = 1, testid, hint, min, max }) => (
  <div className="space-y-1.5">
    <Label className="text-[11px] tracking-wide text-slate-600">{label}</Label>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>}
      <Input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-10 text-sm border-slate-300 rounded-lg ${prefix ? "pl-7" : ""} ${suffix ? "pr-12" : ""}`}
        data-testid={testid}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">{suffix}</span>}
    </div>
    {hint && <p className="text-[10px] text-slate-400 leading-snug">{hint}</p>}
  </div>
);

const ContributionCalculator = ({ embedded = false }) => {
  // ============ Section 1 — You & your super fund ============
  const [age, setAge] = useState(45);
  const [retireAge, setRetireAge] = useState(67);
  const [salary, setSalary] = useState(120000);
  const [sgRate, setSgRate] = useState(12);                 // SG % (defaults to 12% per the post-2025 schedule)
  const [taxableIncome, setTaxableIncome] = useState(120000);

  // ============ Section 2 — Your super ============
  const [superBalance, setSuperBalance] = useState(350000);
  const [salarySacrifice, setSalarySacrifice] = useState(0); // before-tax voluntary
  const [personalDeductible, setPersonalDeductible] = useState(0);
  const [afterTaxContrib, setAfterTaxContrib] = useState(0); // NCC
  const [spouseContrib, setSpouseContrib] = useState(0);

  // ============ Section 3 — Fund fees ============
  const [adminFeeDollar, setAdminFeeDollar] = useState(78);
  const [adminFeePct, setAdminFeePct] = useState(0.15);
  const [investmentFeePct, setInvestmentFeePct] = useState(0.50);

  // ============ Section 4 — Investment option ============
  const [investmentOption, setInvestmentOption] = useState("balanced");

  // ============ Section 5 — Compare to alternative fund ============
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [altAdminFeeDollar, setAltAdminFeeDollar] = useState(120);
  const [altAdminFeePct, setAltAdminFeePct] = useState(0.30);
  const [altInvestmentFeePct, setAltInvestmentFeePct] = useState(0.85);

  // -----------------------------------------------------------
  // Engine — pure JS, runs live as inputs change.
  // -----------------------------------------------------------
  const calc = useMemo(() => {
    const employerContribution = (salary * sgRate) / 100;
    const totalConcessional = employerContribution + salarySacrifice + personalDeductible;
    const concessionalCap = 30000;
    const ncc = afterTaxContrib + spouseContrib;
    const nccCap = 120000;

    const option = INVESTMENT_OPTIONS.find((o) => o.key === investmentOption) || INVESTMENT_OPTIONS[3];
    const grossReturn = option.nominal / 100;

    const mr = marginalRate(taxableIncome);
    // Tax saved by salary sacrifice (and personal deductible) — contributions taxed at 15% instead of marginal.
    const concessionalVoluntary = salarySacrifice + personalDeductible;
    const taxSaved = Math.max(0, concessionalVoluntary * (mr - 0.15));
    const div293Applicable = (taxableIncome + concessionalVoluntary) > 250000;
    const div293Cost = div293Applicable ? Math.min(concessionalVoluntary, 250000) * 0.15 : 0;

    const yearsToRetirement = Math.max(0, retireAge - age);

    // Project balance year-by-year applying fees + after-tax contributions.
    const project = (adminD, adminP, investP) => {
      const data = [];
      let balance = superBalance;
      const netConcessional = totalConcessional * 0.85; // 15% contributions tax
      const annualGrossContrib = netConcessional + ncc;
      const netReturn = grossReturn - (investP / 100);

      for (let y = 0; y <= yearsToRetirement; y++) {
        // Fees applied at start of year
        const adminPctFee = balance * (adminP / 100);
        const totalFees = adminD + adminPctFee;
        balance -= totalFees;
        data.push({
          age: age + y,
          balance: Math.round(balance),
          contributions: Math.round((annualGrossContrib + (div293Applicable ? -div293Cost : 0)) * y),
        });
        balance = balance * (1 + netReturn) + annualGrossContrib - (div293Applicable ? div293Cost : 0);
      }
      // total fees over horizon (rough)
      const totalFeesPaid = data.reduce((sum, _, i) => {
        if (i === 0) return sum;
        const b = data[i - 1].balance;
        return sum + adminD + (b * adminP) / 100 + (b * investP) / 100;
      }, 0);
      return {
        projection: data,
        balanceAtRetirement: data[data.length - 1]?.balance || superBalance,
        totalFees: Math.round(totalFeesPaid),
      };
    };

    const yourFund = project(adminFeeDollar, adminFeePct, investmentFeePct);
    const altFund = compareEnabled ? project(altAdminFeeDollar, altAdminFeePct, altInvestmentFeePct) : null;

    return {
      employerContribution,
      totalConcessional,
      concessionalCap,
      capUsedPct: Math.min(100, (totalConcessional / concessionalCap) * 100),
      ncc,
      nccCap,
      taxSaved,
      div293Applicable,
      div293Cost,
      yearsToRetirement,
      yourFund,
      altFund,
      option,
      marginalPct: mr * 100,
    };
  }, [
    age, retireAge, salary, sgRate, taxableIncome, superBalance, salarySacrifice, personalDeductible,
    afterTaxContrib, spouseContrib, adminFeeDollar, adminFeePct, investmentFeePct, investmentOption,
    compareEnabled, altAdminFeeDollar, altAdminFeePct, altInvestmentFeePct,
  ]);

  // "Suggest optimal" — fill concessional cap, avoid Div 293.
  const suggestOptimal = useCallback(() => {
    const room = Math.max(0, calc.concessionalCap - calc.employerContribution - personalDeductible);
    const div293Room = Math.max(0, 250000 - taxableIncome - calc.employerContribution - personalDeductible);
    const optimal = Math.round(Math.max(0, Math.min(room, div293Room)));
    setSalarySacrifice(optimal);
    toast.success(
      `Suggested ${fmt(optimal)} salary sacrifice — fills concessional cap, stays below Div 293.`,
      { duration: 5000 },
    );
  }, [calc.concessionalCap, calc.employerContribution, personalDeductible, taxableIncome]);

  // Keep taxableIncome roughly aligned to salary if user hasn't manually drifted.
  useEffect(() => {
    if (Math.abs(taxableIncome - salary) < 500) setTaxableIncome(salary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salary]);

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------
  const content = (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6" data-testid="contribution-calculator">
      {/* ===== Left: Input sections ===== */}
      <div className="space-y-5">
        {/* Section 1 */}
        <section className={SECTION_CLASS} data-testid="section-you-fund">
          <p className={EYEBROW}>Step 1</p>
          <h2 className={SECTION_HEAD}>You &amp; your super fund</h2>
          <p className={SECTION_SUB}>Tell us about yourself and how much you earn — we'll work out your employer's contribution automatically.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Current age" value={age} onChange={setAge} suffix="years" testid="input-age" min={18} max={75} />
            <Field label="Retirement age" value={retireAge} onChange={setRetireAge} suffix="years" testid="input-retire-age" min={age + 1} max={80} />
            <Field label="Gross annual salary" value={salary} onChange={setSalary} prefix="$" testid="input-salary" min={0} />
            <Field label="Taxable income" value={taxableIncome} onChange={setTaxableIncome} prefix="$" testid="input-taxable" hint="Used for tax calcs" />
            <Field label="Employer SG rate" value={sgRate} onChange={setSgRate} suffix="%" step={0.5} testid="input-sg-rate" min={0} max={15} hint="2025-26 = 12%" />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
            <span>Employer contribution</span>
            <span className="font-mono text-[#1a2744] text-sm">{fmt(calc.employerContribution)} / yr</span>
            <span className="ml-auto">Marginal rate · <span className="font-mono text-[#1a2744]">{calc.marginalPct.toFixed(0)}%</span></span>
          </div>
        </section>

        {/* Section 2 */}
        <section className={SECTION_CLASS} data-testid="section-your-super">
          <p className={EYEBROW}>Step 2</p>
          <h2 className={SECTION_HEAD}>Your super</h2>
          <p className={SECTION_SUB}>Your current balance and any extra contributions you're making on top of employer super.</p>

          <Field label="Current super balance" value={superBalance} onChange={setSuperBalance} prefix="$" testid="input-balance" />

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[#1a2744] mb-3">Before-tax contributions</h3>
            <p className="text-[11px] text-slate-500 mb-3">Salary sacrifice and personal deductible contributions are taxed at 15% in your fund instead of your marginal rate.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Salary sacrifice" value={salarySacrifice} onChange={setSalarySacrifice} prefix="$" suffix="/ yr" testid="input-salary-sac" hint="Pre-tax voluntary" />
              <Field label="Personal deductible" value={personalDeductible} onChange={setPersonalDeductible} prefix="$" suffix="/ yr" testid="input-personal-deductible" hint="Concessional (notice of intent)" />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[#1a2744] mb-3">After-tax contributions</h3>
            <p className="text-[11px] text-slate-500 mb-3">Made from already-taxed money. Bring-forward of up to 3 years available.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Non-concessional" value={afterTaxContrib} onChange={setAfterTaxContrib} prefix="$" suffix="/ yr" testid="input-after-tax" />
              <Field label="Spouse contribution" value={spouseContrib} onChange={setSpouseContrib} prefix="$" suffix="/ yr" testid="input-spouse" hint="Potential $540 offset" />
            </div>
          </div>

          {/* Concessional usage bar */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600">Concessional cap usage</span>
              <span className="font-mono text-[#1a2744]">{fmt(calc.totalConcessional)} / {fmt(calc.concessionalCap)}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${calc.capUsedPct > 100 ? "bg-rose-500" : "bg-[#D4A84C]"}`} style={{ width: `${Math.min(100, calc.capUsedPct)}%` }} />
            </div>
            {calc.div293Applicable && (
              <div className="mt-3 flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50/60 border border-amber-200 rounded-lg p-2.5">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>Division 293 applies — additional 15% tax on concessional contributions because total assessable income exceeds $250k. Estimated extra tax: <span className="font-mono">{fmt(calc.div293Cost)}</span> / yr.</span>
              </div>
            )}
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[11px] text-slate-500">Estimated tax saved by salary sacrifice: <span className="font-mono text-emerald-600">{fmt(calc.taxSaved)}</span> / yr</p>
              <PillButton variant="ghost" onClick={suggestOptimal} data-testid="btn-suggest-optimal" className="!text-[#8a6c1a] !border-[#D4A84C]/40 hover:!bg-[#D4A84C]/10">
                <Lightbulb className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Suggest optimal
              </PillButton>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className={SECTION_CLASS} data-testid="section-fund-fees">
          <p className={EYEBROW}>Step 3</p>
          <h2 className={SECTION_HEAD}>Fund fees</h2>
          <p className={SECTION_SUB}>The fees your fund charges. Defaults reflect an industry-fund median.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Admin fee (flat)" value={adminFeeDollar} onChange={setAdminFeeDollar} prefix="$" suffix="/ yr" testid="input-admin-flat" />
            <Field label="Admin fee (%)" value={adminFeePct} onChange={setAdminFeePct} suffix="%" step={0.05} testid="input-admin-pct" />
            <Field label="Investment fee (%)" value={investmentFeePct} onChange={setInvestmentFeePct} suffix="%" step={0.05} testid="input-invest-pct" hint="Indirect cost ratio" />
          </div>
        </section>

        {/* Section 4 */}
        <section className={SECTION_CLASS} data-testid="section-investment-option">
          <p className={EYEBROW}>Step 4</p>
          <h2 className={SECTION_HEAD}>Investment option</h2>
          <p className={SECTION_SUB}>Higher-growth options have higher expected returns but also higher short-term volatility.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {INVESTMENT_OPTIONS.map((opt) => {
              const selected = investmentOption === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setInvestmentOption(opt.key)}
                  className={`text-left rounded-xl border p-4 transition-all ${selected ? "border-[#1a2744] bg-slate-50 ring-1 ring-[#1a2744]/20" : "border-slate-200 bg-white hover:border-slate-400"}`}
                  data-testid={`opt-${opt.key}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#1a2744]">{opt.label}</span>
                    <span className="font-mono text-xs text-[#D4A84C]">{opt.nominal}% p.a.</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 5 */}
        <section className={SECTION_CLASS} data-testid="section-compare">
          <p className={EYEBROW}>Step 5</p>
          <h2 className={SECTION_HEAD}>Compare to another fund</h2>
          <p className={SECTION_SUB}>See how a different fee structure affects your final balance.</p>
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input type="checkbox" checked={compareEnabled} onChange={(e) => setCompareEnabled(e.target.checked)} className="h-4 w-4 accent-[#1a2744]" data-testid="toggle-compare" />
            <span className="text-sm text-slate-700">Compare against an alternative fund</span>
          </label>
          {compareEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Alt admin fee (flat)" value={altAdminFeeDollar} onChange={setAltAdminFeeDollar} prefix="$" suffix="/ yr" testid="alt-admin-flat" />
              <Field label="Alt admin fee (%)" value={altAdminFeePct} onChange={setAltAdminFeePct} suffix="%" step={0.05} testid="alt-admin-pct" />
              <Field label="Alt investment fee (%)" value={altInvestmentFeePct} onChange={setAltInvestmentFeePct} suffix="%" step={0.05} testid="alt-invest-pct" />
            </div>
          )}
        </section>

        {/* Disclaimer */}
        <p className="text-[11px] text-slate-400 leading-relaxed px-2 pb-4">
          These projections are estimates only and assume contributions, fees and returns remain constant in real terms. Actual returns will vary year-to-year and fees are deducted from your balance.
        </p>
      </div>

      {/* ===== Right: Sticky Results panel ===== */}
      <aside className="lg:sticky lg:top-6 self-start" data-testid="results-panel">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <p className={EYEBROW}>Result</p>
            <h3 className="font-serif text-xl text-[#1a2744] leading-tight">Balance at age {retireAge}</h3>
            <p className="font-serif text-4xl text-[#1a2744] mt-3 tabular-nums" data-testid="result-balance">{fmtCompact(calc.yourFund.balanceAtRetirement)}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              in <span className="font-mono">{calc.yearsToRetirement}</span> years · {calc.option.label.toLowerCase()} option
            </p>

            <div className="h-[180px] mt-5 -mx-1">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <AreaChart data={calc.yourFund.projection} margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4A84C" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#D4A84C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="age" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip formatter={(v) => fmt(v)} labelFormatter={(v) => `Age ${v}`} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }} />
                  <Area type="monotone" dataKey="balance" stroke="#D4A84C" strokeWidth={2} fill="url(#balGold)" name="Your fund" />
                  <ReferenceLine x={retireAge} stroke="#1a2744" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5 mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total fees paid (est.)</span>
                <span className="font-mono text-[#1a2744]">{fmtCompact(calc.yourFund.totalFees)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Annual tax saved (salary sac)</span>
                <span className="font-mono text-emerald-600">{fmt(calc.taxSaved)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total concessional contrib</span>
                <span className="font-mono text-[#1a2744]">{fmt(calc.totalConcessional)} / yr</span>
              </div>
            </div>

            {calc.altFund && (
              <div className="mt-4 pt-4 border-t border-slate-100" data-testid="alt-fund-summary">
                <p className={EYEBROW}>Alternative fund</p>
                <p className="font-serif text-2xl text-[#1a2744] tabular-nums">{fmtCompact(calc.altFund.balanceAtRetirement)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-500">Difference</span>
                  {(() => {
                    const diff = calc.yourFund.balanceAtRetirement - calc.altFund.balanceAtRetirement;
                    const color = diff >= 0 ? "text-emerald-600" : "text-rose-600";
                    return (
                      <span className={`font-mono text-xs ${color}`}>
                        {diff >= 0 ? "+" : "−"}{fmtCompact(Math.abs(diff))}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-[10px] text-slate-400 text-center mt-3">
          Updates live as you change inputs · 2024-25 caps
        </p>
      </aside>
    </div>
  );

  return embedded ? content : (
    <Layout>
      <PageShell
        eyebrow="CALCULATOR · SUPERANNUATION"
        title="Contribution calculator"
        accent="how much will you have at retirement?"
        subtitle="Project your super balance to retirement, compare fees between funds, and find the salary-sacrifice level that maximises tax saved without breaching Division 293."
        meta="MONEYSMART · METHODOLOGY ALIGNED"
        metrics={[
          { label: "Balance at retirement", value: fmtCompact(calc.yourFund.balanceAtRetirement) },
          { label: "Years to retire", value: String(calc.yearsToRetirement) },
          { label: "Tax saved / yr", value: fmt(calc.taxSaved) },
          { label: "Option", value: calc.option.label },
        ]}
      >
        {content}
      </PageShell>
    </Layout>
  );
};

export default ContributionCalculator;
