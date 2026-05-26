// ContributionPathCompare — APRA fund vs SMSF side-by-side comparison.
//
// Runs the same household contribution scenario through two paths:
//   1. APRA fund (e.g. AustralianSuper, REST) — 15% contributions tax,
//      ~15% earnings tax (with imputation credits), fund admin fee ~ 0.6% pa.
//   2. SMSF — 15% contributions tax, 15% earnings tax (same), but a fixed
//      annual admin fee (~ $2,200) and a one-off setup cost (~ $1,500) that
//      makes it materially expensive at low balances.
//
// Surfaces a single recommendation banner so the adviser doesn't have to
// reason from two separate calculator outputs.
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GitCompare, TrendingUp, AlertCircle, Sparkles } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);
const fmtPct = (v) => `${(v || 0).toFixed(2)}%`;

// Marginal tax rate (rough — adviser refines on the client's tax page).
const marginalRate = (salary) => {
  if (salary <= 18_200) return 0;
  if (salary <= 45_000) return 0.16;
  if (salary <= 135_000) return 0.30;
  if (salary <= 190_000) return 0.37;
  return 0.45;
};

const project = ({
  superBalance, contributionAnnual, returnRate, years, contributionsTaxRate,
  earningsTaxRate, adminFeeAnnual, fundFeeBps, setupFee = 0,
}) => {
  // Year-by-year forward projection
  let balance = superBalance - setupFee;
  let totalContribTax = 0;
  let totalAdminFees = 0;
  let totalFundFees = 0;
  let totalEarningsTax = 0;
  for (let y = 0; y < years; y++) {
    // Contribution arrives net of contributions tax
    const contribTaxThisYear = contributionAnnual * contributionsTaxRate;
    totalContribTax += contribTaxThisYear;
    balance += contributionAnnual - contribTaxThisYear;

    // Earnings on opening balance + half year's net contribution
    const grossEarnings = (balance + (contributionAnnual - contribTaxThisYear) / 2) * returnRate;
    const earningsTaxThisYear = grossEarnings * earningsTaxRate;
    totalEarningsTax += earningsTaxThisYear;
    balance += grossEarnings - earningsTaxThisYear;

    // Annual admin (SMSF) + fund management (% of balance)
    totalAdminFees += adminFeeAnnual;
    const fundFeeThisYear = balance * (fundFeeBps / 10_000);
    totalFundFees += fundFeeThisYear;
    balance -= adminFeeAnnual + fundFeeThisYear;
  }
  return {
    finalBalance: Math.max(balance, 0),
    totalContribTax: Math.round(totalContribTax),
    totalAdminFees: Math.round(totalAdminFees),
    totalFundFees: Math.round(totalFundFees),
    totalEarningsTax: Math.round(totalEarningsTax),
  };
};

const ContributionPathCompare = ({ defaults = {} }) => {
  const [salary, setSalary] = useState(defaults.salary || 200_000);
  const [age, setAge] = useState(defaults.age || 50);
  const [superBalance, setSuperBalance] = useState(defaults.superBalance || 850_000);
  const [annualContribution, setAnnualContribution] = useState(27_500);
  const [returnRate, setReturnRate] = useState(7.0);
  const horizon = Math.max(Math.min(67 - age, 30), 1);

  const apra = project({
    superBalance, contributionAnnual: annualContribution, returnRate: returnRate / 100, years: horizon,
    contributionsTaxRate: 0.15, earningsTaxRate: 0.15,
    adminFeeAnnual: 0, fundFeeBps: 60, setupFee: 0,
  });
  const smsf = project({
    superBalance, contributionAnnual: annualContribution, returnRate: returnRate / 100, years: horizon,
    contributionsTaxRate: 0.15, earningsTaxRate: 0.15,
    adminFeeAnnual: 2_200, fundFeeBps: 15, setupFee: 1_500,
  });

  const diff = apra.finalBalance - smsf.finalBalance;
  const apraWins = diff > 0;

  // Tax saving from salary sacrifice (same on both — clients keep this either way)
  const taxSavingAnnual = annualContribution * (marginalRate(salary) - 0.15);
  const totalTaxSaving = taxSavingAnnual * horizon;

  return (
    <Card data-testid="contribution-compare" className="border-l-4 border-[#D4A84C]">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-[#D4A84C]" />
          <div>
            <h3 className="text-sm font-bold text-[#1a2744]">Compare contribution paths</h3>
            <p className="text-[11px] text-muted-foreground">Same household inputs · APRA fund vs SMSF · {horizon}-year projection to age 67</p>
          </div>
        </div>

        {/* Shared inputs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div><Label className="text-[10px] uppercase">Household income</Label>
            <Input type="number" value={salary} onChange={(e) => setSalary(+e.target.value)} className="h-8 text-sm" data-testid="cmp-salary" /></div>
          <div><Label className="text-[10px] uppercase">Age</Label>
            <Input type="number" value={age} onChange={(e) => setAge(+e.target.value)} className="h-8 text-sm" data-testid="cmp-age" /></div>
          <div><Label className="text-[10px] uppercase">Super balance</Label>
            <Input type="number" value={superBalance} onChange={(e) => setSuperBalance(+e.target.value)} className="h-8 text-sm" data-testid="cmp-balance" /></div>
          <div><Label className="text-[10px] uppercase">Annual contribution</Label>
            <Input type="number" value={annualContribution} onChange={(e) => setAnnualContribution(+e.target.value)} className="h-8 text-sm" data-testid="cmp-contrib" /></div>
          <div><Label className="text-[10px] uppercase">Return %</Label>
            <Input type="number" step="0.1" value={returnRate} onChange={(e) => setReturnRate(+e.target.value)} className="h-8 text-sm" data-testid="cmp-return" /></div>
        </div>

        {/* Side-by-side cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="cmp-grid">
          <div className={`border rounded-lg p-4 ${apraWins ? "border-emerald-400 bg-emerald-50/40" : "border-slate-200 bg-white"}`} data-testid="cmp-apra">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#1a2744]">APRA Fund (e.g. AustralianSuper)</p>
              {apraWins && <Badge variant="outline" className="text-[9px] bg-emerald-100 border-emerald-400 text-emerald-800">RECOMMENDED</Badge>}
            </div>
            <p className="text-2xl font-bold text-[#1a2744]">{fmt(apra.finalBalance)}</p>
            <p className="text-[10px] text-muted-foreground">at age 67 ({horizon} years)</p>
            <div className="mt-3 space-y-1 text-[11px]">
              <Row label="Contributions tax (15%)" value={apra.totalContribTax} />
              <Row label="Earnings tax (~15%)" value={apra.totalEarningsTax} />
              <Row label="Admin fees" value={apra.totalAdminFees} />
              <Row label={`Fund mgmt fee (~${fmtPct(0.6)})`} value={apra.totalFundFees} />
            </div>
          </div>
          <div className={`border rounded-lg p-4 ${!apraWins ? "border-emerald-400 bg-emerald-50/40" : "border-slate-200 bg-white"}`} data-testid="cmp-smsf">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#1a2744]">Self-Managed Super (SMSF)</p>
              {!apraWins && <Badge variant="outline" className="text-[9px] bg-emerald-100 border-emerald-400 text-emerald-800">RECOMMENDED</Badge>}
            </div>
            <p className="text-2xl font-bold text-[#1a2744]">{fmt(smsf.finalBalance)}</p>
            <p className="text-[10px] text-muted-foreground">at age 67 ({horizon} years)</p>
            <div className="mt-3 space-y-1 text-[11px]">
              <Row label="Contributions tax (15%)" value={smsf.totalContribTax} />
              <Row label="Earnings tax (~15%)" value={smsf.totalEarningsTax} />
              <Row label="Admin fees ($2.2K/yr)" value={smsf.totalAdminFees} />
              <Row label="Fund mgmt fee (~0.15%)" value={smsf.totalFundFees} />
            </div>
          </div>
        </div>

        {/* Single recommendation banner */}
        <div className="rounded-lg border-2 border-[#D4A84C]/40 bg-[#D4A84C]/5 p-3 flex items-start gap-2" data-testid="cmp-recommendation">
          <Sparkles className="h-4 w-4 text-[#D4A84C] mt-0.5" />
          <div className="text-[12px] leading-relaxed">
            <strong className="text-[#1a2744]">Recommendation:</strong>{" "}
            {apraWins ? (
              <>For this household ({fmt(salary)} HHI · {fmt(superBalance)} balance), the <strong>APRA fund path</strong> ends up <strong className="text-emerald-700">{fmt(Math.abs(diff))} ahead</strong> over {horizon} years — the SMSF fixed admin overhead ($2,200/yr × {horizon} = {fmt(2200 * horizon)}) outweighs the fund-fee savings at this balance.</>
            ) : (
              <>For this household ({fmt(salary)} HHI · {fmt(superBalance)} balance), the <strong>SMSF path</strong> finishes <strong className="text-emerald-700">{fmt(Math.abs(diff))} ahead</strong> over {horizon} years — fund-fee savings ({fmt(apra.totalFundFees - smsf.totalFundFees)}) outweigh the fixed SMSF admin cost ({fmt(2200 * horizon)}).</>
            )}
            <span className="block text-muted-foreground text-[10.5px] mt-1.5">
              Either way, the salary-sacrifice saves <strong>{fmt(taxSavingAnnual)}/year</strong> in personal income tax ({fmt(totalTaxSaving)} over {horizon} years) versus contributing post-tax — true on both paths.
            </span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Indicative model only — assumes a flat 15% contributions tax + 15% earnings tax, no Div 293 surcharge, and constant fees. Refine via the calculators above for a strategy-level SOA.
        </p>
      </CardContent>
    </Card>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono">{fmt(value)}</span>
  </div>
);

export default ContributionPathCompare;
