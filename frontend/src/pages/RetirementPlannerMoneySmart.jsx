// Retirement Planner — MoneySmart-style linear flow, client-data aware.
//
// Flow (top-to-bottom on left column, sticky Results on right):
//   Step 1  · About you (relationship, ages, gender, homeowner)
//   Step 1b · About your partner (couple-only)
//   Step 2  · Income (salary, partner salary, age pension toggle)
//   Step 3  · Your super — ITEMIZED (each super account editable + add row + SG rate)
//   Step 4  · Other assets, savings & contribution strategy
//             · 4a Itemized other liquid assets (cash/shares/managed/etc.)
//             · 4b Contribution strategy (salary sac, personal deductible, after-tax, spouse)
//             · 4c Fund fees (admin flat + admin % + investment %)
//             · 4d Investment option preset (cash → high growth)
//   Step 5  · Spending in retirement (ASFA presets)
//   Step 6  · Advanced assumptions (collapsible)
//
// When the planner is accessed via /dashboard → Retirement tab with a
// client selected, all fields auto-populate from CLIENT_DATA[clientId] but
// remain editable (what-if scenarios don't mutate the client record).

import { useState, useMemo, useCallback, useEffect } from "react";
import Layout from "@/components/Layout";
import { PageShell, PillButton } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Info, Plus, Trash2, Lightbulb, AlertCircle, Users } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { toast } from "sonner";
import { projectRetirement } from "@/lib/retirementEngine";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";

const fmt = (v) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const fmtCompact = (v) => {
  if (!v) return "$0";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return fmt(v);
};

// 2025 ASFA Retirement Standard (annual, today's $).
const ASFA = {
  single_modest: 33_134,
  single_comfortable: 52_383,
  couple_modest: 47_731,
  couple_comfortable: 73_875,
};

// 2025 Age Pension single/couple maxima + asset-test thresholds.
const AGE_PENSION = {
  single_max: 29_754,
  couple_max: 44_855,
  asset_free_single: 314_000,
  asset_free_couple: 470_000,
  taper_per_1k: 78,
};

const estimateAgePension = (relationship, assessableAssets) => {
  const max = relationship === "couple" ? AGE_PENSION.couple_max : AGE_PENSION.single_max;
  const threshold = relationship === "couple" ? AGE_PENSION.asset_free_couple : AGE_PENSION.asset_free_single;
  if (assessableAssets <= threshold) return max;
  const overK = (assessableAssets - threshold) / 1000;
  return Math.max(0, max - overK * AGE_PENSION.taper_per_1k);
};

const marginalRate = (taxableIncome) => {
  if (taxableIncome <= 18200) return 0;
  if (taxableIncome <= 45000) return 0.16 + 0.02;
  if (taxableIncome <= 135000) return 0.30 + 0.02;
  if (taxableIncome <= 190000) return 0.37 + 0.02;
  return 0.45 + 0.02;
};

// MoneySmart investment-option presets (nominal return p.a., before fees & inflation).
const INVESTMENT_OPTIONS = [
  { key: "cash",         label: "Cash",         nominal: 3.5, desc: "Lowest risk · cash deposits, term deposits" },
  { key: "conservative", label: "Conservative", nominal: 4.5, desc: "20% growth assets · low risk" },
  { key: "moderate",     label: "Moderate",     nominal: 5.5, desc: "50% growth assets · medium-low risk" },
  { key: "balanced",     label: "Balanced",     nominal: 6.5, desc: "70% growth assets · medium risk (default)" },
  { key: "growth",       label: "Growth",       nominal: 7.5, desc: "85% growth assets · medium-high risk" },
  { key: "high_growth",  label: "High Growth",  nominal: 8.5, desc: "100% growth assets · high risk" },
];

const SECTION_CLASS = "rounded-2xl border border-slate-200 bg-white";
const SECTION_HEAD = "font-serif text-xl text-[#1a2744] leading-tight";
const SECTION_SUB  = "text-xs text-slate-500 mt-0.5";
const EYEBROW      = "text-[10px] tracking-[0.18em] uppercase text-[#D4A84C] font-semibold";

// Collapsible section wrapper — header always visible, body toggles.
// Sections collapse by default; first one opens automatically.
const Section = ({ eyebrow, title, sub, open, onToggle, testid, children }) => (
  <section className={SECTION_CLASS} data-testid={testid}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 p-5 hover:bg-slate-50/40 transition-colors rounded-2xl"
      data-testid={`${testid}-toggle`}
    >
      <div className="text-left">
        <p className={EYEBROW}>{eyebrow}</p>
        <h2 className={`${SECTION_HEAD} mt-1`}>{title}</h2>
        {sub && <p className={SECTION_SUB}>{sub}</p>}
      </div>
      {open
        ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
        : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />}
    </button>
    {open && (
      <div className="px-5 pb-5 -mt-1 border-t border-slate-100 pt-4">
        {children}
      </div>
    )}
  </section>
);

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

const Segment = ({ options, value, onChange, testid }) => (
  <div className="inline-flex rounded-full border border-slate-200 bg-white p-1" data-testid={testid}>
    {options.map((opt) => (
      <button
        key={String(opt.value)}
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

// Itemized asset row — name + value editable, with delete button.
const AssetRow = ({ item, onChange, onRemove, prefix = "$", testid }) => (
  <div className="grid grid-cols-[1fr_180px_36px] gap-2 items-center" data-testid={testid}>
    <Input
      type="text"
      value={item.name}
      onChange={(e) => onChange({ ...item, name: e.target.value })}
      placeholder="Account / asset name"
      className="h-9 text-sm border-slate-300 rounded-lg"
      data-testid={`${testid}-name`}
    />
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>
      <Input
        type="number"
        value={item.value}
        onChange={(e) => onChange({ ...item, value: Number(e.target.value) })}
        className="h-9 text-sm border-slate-300 rounded-lg pl-7 text-right"
        data-testid={`${testid}-value`}
      />
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="h-9 w-9 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors"
      data-testid={`${testid}-remove`}
      title="Remove"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  </div>
);

// Pull client data from CLIENT_DATA into the planner-friendly default shape.
// Falls back to MoneySmart-style anonymous defaults when no client is active.
const buildDefaultsFromClient = (client) => {
  if (!client) {
    return {
      relationship: "single",
      yourAge: 40,
      yourGender: "male",
      retireAge: 67,
      homeowner: true,
      partnerAge: 38,
      partnerGender: "female",
      yourSalary: 95000,
      partnerSalary: 75000,
      superAccounts: [{ id: "default-super", name: "Your super", value: 180000, owner: "you" }],
      otherAssets: [{ id: "default-cash", name: "Savings", value: 50000, type: "Cash" }],
      taxableIncome: 95000,
      annualSpending: 0,
    };
  }
  const prof = client.profile || {};
  const ret  = client.retirement || {};
  const assets = client.assets || [];
  const budget = client.budget || {};

  // EXPLICIT relationship field — falls back to legacy heuristic only when missing.
  const isCouple = prof.relationship
    ? prof.relationship === "couple"
    : !!prof.partner_first_name || !!prof.partner_age;

  // Itemize super into separate rows. Honour the explicit `member` field when
  // present (preferred) — fall back to entity-name substring heuristic otherwise.
  const superAssets = assets.filter((a) => a.type === "Super" || a.type === "SMSF");
  const superAccounts = superAssets.length > 0
    ? superAssets.map((a, i) => {
        let owner = a.member;
        if (!owner) {
          const ent = (a.entity || "").toLowerCase();
          owner = ent.includes("spouse") || ent.includes("partner") ? "partner" : "you";
        }
        return {
          id: `${a.name || "super"}-${i}`,
          name: a.name || a.type || "Super account",
          value: a.value || 0,
          owner,
        };
      })
    : [{ id: "client-super-default", name: `${prof.first_name || "Client"} super`, value: 0, owner: "you" }];

  // Itemize non-super liquid assets (excludes principal home for Age Pension assets test).
  const liquidTypes = ["Cash", "Shares", "Managed Fund", "Bonds", "Alternatives", "Trust Portfolio"];
  const otherAssets = assets
    .filter((a) => liquidTypes.includes(a.type))
    .map((a, i) => ({ id: `${a.type}-${i}`, name: a.name || a.type, value: a.value || 0, type: a.type }));

  // Investment property (separate from home).
  const investmentProps = assets.filter((a) => a.type === "Property" && !(a.is_home || a.principal_residence));
  for (const ip of investmentProps) {
    otherAssets.push({ id: `prop-${otherAssets.length}`, name: ip.name || "Investment property", value: ip.value || 0, type: "Property" });
  }
  if (otherAssets.length === 0) {
    otherAssets.push({ id: "default-cash", name: "Savings", value: 0, type: "Cash" });
  }

  // ----- Budget integration -----
  // Salary auto-syncs to (Budget.monthlyIncome × 12) when budget is present, else
  // falls back to personal_income or split household income.
  const annualIncomeFromBudget = budget.monthlyIncome ? Math.round(budget.monthlyIncome * 12) : null;
  const yourSalary = prof.personal_income || annualIncomeFromBudget || prof.incomeHousehold || 95000;
  const partnerSalary = isCouple ? (prof.partner_income || Math.round((prof.incomeHousehold || 0) - (prof.personal_income || 0)) || 0) : 0;

  // Annual spending auto-syncs to (Budget.monthlyExpenses × 12) when present, else
  // falls back to retirement.retirement_spending or expensesAnnual.
  const annualSpendingFromBudget = budget.monthlyExpenses ? Math.round(budget.monthlyExpenses * 12) : null;
  const annualSpending = ret.retirement_spending || annualSpendingFromBudget || prof.expensesAnnual || 0;

  return {
    relationship: isCouple ? "couple" : "single",
    yourAge: prof.age || ret.current_age || 50,
    yourGender: (prof.gender || "male").toLowerCase().startsWith("f") ? "female" : "male",
    retireAge: ret.retirement_age || prof.retirement_age || prof.retirementAge || 67,
    homeowner: prof.homeowner !== false,
    partnerAge: prof.partner_age || (prof.age ? prof.age - 2 : 48),
    partnerGender: (prof.partner_gender || "female").toLowerCase().startsWith("m") ? "male" : "female",
    yourSalary,
    partnerSalary,
    superAccounts,
    otherAssets,
    taxableIncome: prof.personal_income || yourSalary,
    annualSpending,
  };
};

const RetirementPlanner = ({ embedded = false, clientId: propClientId }) => {
  // -----------------------------------------------------------
  // Hydrate from client record (if a client is selected)
  // -----------------------------------------------------------
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || null;
  const defaults = useMemo(() => buildDefaultsFromClient(client), [clientId, client]);

  // ============ Step 1 — About you ============
  const [relationship, setRelationship] = useState(defaults.relationship);
  const [yourAge, setYourAge] = useState(defaults.yourAge);
  const [yourGender, setYourGender] = useState(defaults.yourGender);
  const [retireAge, setRetireAge] = useState(defaults.retireAge);
  const [homeowner, setHomeowner] = useState(defaults.homeowner);

  // ============ Step 1b — Partner ============
  const [partnerAge, setPartnerAge] = useState(defaults.partnerAge);
  const [partnerGender, setPartnerGender] = useState(defaults.partnerGender);

  // ============ Step 2 — Income ============
  const [yourSalary, setYourSalary] = useState(defaults.yourSalary);
  const [partnerSalary, setPartnerSalary] = useState(defaults.partnerSalary);
  const [includeAgePension, setIncludeAgePension] = useState(true);
  const [taxableIncome, setTaxableIncome] = useState(defaults.taxableIncome || defaults.yourSalary);

  // ============ Step 3 — Itemized super ============
  const [superAccounts, setSuperAccounts] = useState(defaults.superAccounts);
  const [yourSgRate, setYourSgRate] = useState(12);

  // ============ Step 4 — Other assets, contribution strategy, fees, option ============
  const [otherAssets, setOtherAssets] = useState(defaults.otherAssets);
  const [salarySacrifice, setSalarySacrifice] = useState(0);
  const [personalDeductible, setPersonalDeductible] = useState(0);
  const [afterTaxContrib, setAfterTaxContrib] = useState(0);
  const [spouseContrib, setSpouseContrib] = useState(0);
  const [partnerSalarySac, setPartnerSalarySac] = useState(0);
  const [adminFeeDollar, setAdminFeeDollar] = useState(78);
  const [adminFeePct, setAdminFeePct] = useState(0.15);
  const [investmentFeePct, setInvestmentFeePct] = useState(0.50);
  const [investmentOption, setInvestmentOption] = useState("balanced");
  const [propertyRental, setPropertyRental] = useState(0);

  // ============ Step 5 — Spending ============
  const [annualSpending, setAnnualSpending] = useState(defaults.annualSpending || (defaults.relationship === "couple" ? ASFA.couple_comfortable : ASFA.single_comfortable));

  // ============ Step 6 — Advanced ============
  const [inflationPct, setInflationPct] = useState(2.5);
  const [lifeExpectancyOverride, setLifeExpectancyOverride] = useState(0);

  // ============ Section open/collapse state ============
  // First section open by default; rest collapsed to keep the page short.
  const [openSection, setOpenSection] = useState("about");
  const [showAnnualised, setShowAnnualised] = useState(true);   // Expanded by default — user requested annual drawdown table at bottom.
  const toggle = (key) => setOpenSection((o) => o === key ? null : key);

  // Keep taxableIncome aligned to salary if user hasn't manually drifted.
  useEffect(() => {
    if (Math.abs(taxableIncome - yourSalary) < 500) setTaxableIncome(yourSalary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yourSalary]);

  // -----------------------------------------------------------
  // Itemized list helpers
  // -----------------------------------------------------------
  const addSuperAccount = () => setSuperAccounts((arr) => [...arr, {
    id: `super-${Date.now()}`, name: "New super account", value: 0,
    owner: relationship === "couple" && arr.filter((x) => x.owner === "you").length >= 1 ? "partner" : "you",
  }]);
  const removeSuperAccount = (id) => setSuperAccounts((arr) => arr.filter((x) => x.id !== id));
  const updateSuperAccount = (id, next) => setSuperAccounts((arr) => arr.map((x) => x.id === id ? next : x));

  const addOtherAsset = () => setOtherAssets((arr) => [...arr, { id: `asset-${Date.now()}`, name: "New asset", value: 0, type: "Cash" }]);
  const removeOtherAsset = (id) => setOtherAssets((arr) => arr.filter((x) => x.id !== id));
  const updateOtherAsset = (id, next) => setOtherAssets((arr) => arr.map((x) => x.id === id ? next : x));

  // -----------------------------------------------------------
  // Engine
  // -----------------------------------------------------------
  const computed = useMemo(() => {
    const isCouple = relationship === "couple";

    // Totals from itemized lists
    const yourSuperBalance = superAccounts.filter((a) => a.owner === "you").reduce((s, a) => s + (a.value || 0), 0);
    const partnerSuperBalance = isCouple ? superAccounts.filter((a) => a.owner === "partner").reduce((s, a) => s + (a.value || 0), 0) : 0;
    const householdSuperBalance = yourSuperBalance + partnerSuperBalance;
    const otherAssetsTotal = otherAssets.reduce((s, a) => s + (a.value || 0), 0);
    const householdLiquidAssets = householdSuperBalance + otherAssetsTotal;

    // Annual contributions
    const employerContribAnnual = (yourSalary * yourSgRate) / 100;
    const partnerEmployerContrib = isCouple ? (partnerSalary * yourSgRate) / 100 : 0;
    const concessionalCap = 30000;
    const totalConcessional = employerContribAnnual + salarySacrifice + personalDeductible;
    const partnerConcessional = partnerEmployerContrib + (isCouple ? partnerSalarySac : 0);

    // Net concessional contribs (after 15% contribs tax) + non-concessional
    const yourNetConcessional = totalConcessional * 0.85;
    const partnerNetConcessional = partnerConcessional * 0.85;
    const ncc = afterTaxContrib + spouseContrib;
    const annualGrossContrib = yourNetConcessional + partnerNetConcessional + ncc;

    // Tax saved + Div 293
    const mr = marginalRate(taxableIncome);
    const concessionalVoluntary = salarySacrifice + personalDeductible;
    const taxSaved = Math.max(0, concessionalVoluntary * (mr - 0.15));
    const div293Applicable = (taxableIncome + concessionalVoluntary) > 250000;
    const div293Cost = div293Applicable ? Math.min(concessionalVoluntary, 250000) * 0.15 : 0;

    // Investment return
    const option = INVESTMENT_OPTIONS.find((o) => o.key === investmentOption) || INVESTMENT_OPTIONS[3];
    const nominalReturn = option.nominal / 100;
    const totalFeesPct = adminFeePct + investmentFeePct;
    const netReturn = nominalReturn - (totalFeesPct / 100);

    // Life expectancy
    const baseLifeExpectancy = { male: 84, female: 87 };
    const yourLifeExp = lifeExpectancyOverride > 0 ? lifeExpectancyOverride : baseLifeExpectancy[yourGender];
    const yearsInRetirement = Math.max(1, yourLifeExp - retireAge);
    const yearsToRetirement = Math.max(0, retireAge - yourAge);

    // Monte Carlo projection (driven by the merged inputs)
    const sim = projectRetirement({
      currentPortfolio: householdLiquidAssets,
      annualContributions: annualGrossContrib + propertyRental,
      annualSpending: annualSpending - (includeAgePension ? estimateAgePension(relationship, householdLiquidAssets * 0.6) : 0),
      yearsToRetirement,
      yearsInRetirement,
      expectedReturn: netReturn,
      volatility: 0.11,
      inflationRate: inflationPct / 100,
      numSims: 500,
      seed: 42,
    });

    // Year-by-year projection chart driven by the same inputs (deterministic)
    const projection = [];
    let balance = householdLiquidAssets;
    for (let y = 0; y <= yearsToRetirement; y++) {
      const adminPctFee = balance * (adminFeePct / 100);
      const totalAnnualAdminFee = adminFeeDollar + adminPctFee;
      balance -= totalAnnualAdminFee;
      projection.push({ age: yourAge + y, balance: Math.round(Math.max(0, balance)) });
      balance = balance * (1 + netReturn) + annualGrossContrib - (div293Applicable ? div293Cost : 0) + propertyRental;
    }

    // Total fees over horizon (rough cumulative)
    const totalFeesPaid = projection.reduce((acc, p, i) => {
      if (i === 0) return acc;
      const prev = projection[i - 1].balance;
      return acc + adminFeeDollar + (prev * adminFeePct) / 100 + (prev * investmentFeePct) / 100;
    }, 0);

    // Age pension on median portfolio at retirement
    const assessableAtRetirement = sim.portfolioAtRetirement * 0.6;
    const agePensionAnnual = includeAgePension ? estimateAgePension(relationship, assessableAtRetirement) : 0;

    // 4% rule sustainable from super + age pension
    const sustainableFromSuper = sim.portfolioAtRetirement * 0.04;
    const projectedIncome = sustainableFromSuper + agePensionAnnual;
    const shortfall = annualSpending - projectedIncome;
    // Headline number — what the household can ACTUALLY spend each year. This
    // ties spending → result so the headline visibly responds when the user
    // drags the desired-spending slider down: if they ask for less than what
    // their portfolio can produce, the headline drops to the asked-for level.
    const achievableSpending = Math.min(projectedIncome, annualSpending);
    const fundingStatus = shortfall <= 0 ? "fully_funded" : shortfall < annualSpending * 0.15 ? "minor_gap" : "underfunded";

    // ------------------------------------------------------------------
    // Annualised year-by-year projection table (accumulation phase only).
    // Each row covers one full year: starting balance → returns + contribs
    // → fees → ending balance. Drawdown phase (post-retirement) appended
    // below with negative net flow.
    // ------------------------------------------------------------------
    const annualisedTable = [];
    {
      let bal = householdLiquidAssets;
      for (let i = 0; i < yearsToRetirement; i++) {
        const ageNow = yourAge + i;
        const opening = bal;
        const grossReturn = bal * nominalReturn;
        const feesPaid = adminFeeDollar + bal * (totalFeesPct / 100);
        const netReturn$ = grossReturn - feesPaid;
        const contribs = annualGrossContrib + propertyRental - (div293Applicable ? div293Cost : 0);
        const closing = Math.max(0, opening + netReturn$ + contribs);
        annualisedTable.push({
          age: ageNow,
          phase: "Accumulation",
          opening: Math.round(opening),
          contribs: Math.round(contribs),
          returnPct: nominalReturn * 100,
          netReturn: Math.round(netReturn$),
          fees: Math.round(feesPaid),
          withdraw: 0,
          closing: Math.round(closing),
        });
        bal = closing;
      }
      // Drawdown phase — uses the achievable spending (incl. age pension)
      for (let i = 0; i < Math.min(yearsInRetirement, 25); i++) {
        const ageNow = retireAge + i;
        const opening = bal;
        const grossReturn = bal * nominalReturn;
        const feesPaid = adminFeeDollar + bal * (totalFeesPct / 100);
        const netReturn$ = grossReturn - feesPaid;
        const withdrawNet = Math.max(0, annualSpending - agePensionAnnual);
        const closing = Math.max(0, opening + netReturn$ - withdrawNet);
        annualisedTable.push({
          age: ageNow,
          phase: "Drawdown",
          opening: Math.round(opening),
          contribs: 0,
          returnPct: nominalReturn * 100,
          netReturn: Math.round(netReturn$),
          fees: Math.round(feesPaid),
          withdraw: Math.round(withdrawNet),
          closing: Math.round(closing),
        });
        bal = closing;
        if (bal <= 0) break;
      }
    }

    return {
      isCouple,
      yourSuperBalance, partnerSuperBalance,
      householdSuperBalance, otherAssetsTotal, householdLiquidAssets,
      employerContribAnnual, partnerEmployerContrib,
      totalConcessional, partnerConcessional, concessionalCap, ncc,
      annualGrossContrib,
      capUsedPct: Math.min(100, (totalConcessional / concessionalCap) * 100),
      taxSaved, div293Applicable, div293Cost, marginalPct: mr * 100,
      yourLifeExp, yearsInRetirement, yearsToRetirement,
      option, netReturn, totalFeesPaid: Math.round(totalFeesPaid),
      projection,
      sim, chartData: sim.trajectory.map((t) => ({ year: yourAge + t.year, median: Math.round(t.p50), low: Math.round(t.p10), high: Math.round(t.p90) })),
      agePensionAnnual, sustainableFromSuper, projectedIncome, shortfall,
      achievableSpending, fundingStatus, annualisedTable,
    };
  }, [
    relationship, yourAge, yourGender, retireAge,
    partnerAge, partnerGender,
    yourSalary, partnerSalary, includeAgePension, taxableIncome,
    superAccounts, yourSgRate,
    otherAssets, salarySacrifice, personalDeductible, afterTaxContrib, spouseContrib, partnerSalarySac,
    adminFeeDollar, adminFeePct, investmentFeePct, investmentOption, propertyRental,
    annualSpending, inflationPct, lifeExpectancyOverride,
  ]);

  const applyAsfa = useCallback((preset) => setAnnualSpending(ASFA[preset]), []);

  const suggestOptimal = useCallback(() => {
    const room = Math.max(0, computed.concessionalCap - computed.employerContribAnnual - personalDeductible);
    const div293Room = Math.max(0, 250000 - taxableIncome - computed.employerContribAnnual - personalDeductible);
    const optimal = Math.round(Math.max(0, Math.min(room, div293Room)));
    setSalarySacrifice(optimal);
    toast.success(`Suggested ${fmt(optimal)} salary sacrifice — fills cap, avoids Div 293.`, { duration: 5000 });
  }, [computed.concessionalCap, computed.employerContribAnnual, personalDeductible, taxableIncome]);

  const confidence = computed.sim.confidence;
  const isOnTrack = confidence >= 75;
  const clientName = client?.profile?.name || null;

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------
  const body = (
    <div className="space-y-5" data-testid="retirement-planner-page">
      {clientName && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#D4A84C]/40 bg-white p-4" data-testid="client-data-banner">
          <Users className="h-4 w-4 text-[#D4A84C]" />
          <div className="flex-1">
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#8a6c1a] font-semibold">Pre-populated from client record</p>
            <p className="text-sm text-[#1a2744]">All fields below reflect the <span className="font-semibold">{clientName}</span> household — including their budgeted income and expenses. Edit anything to model what-ifs; the underlying record is unchanged.</p>
          </div>
        </div>
      )}

      {/* ===== Questions: stacked top-down (accordion) ===== */}
      <div className="space-y-5">
        <Section
          eyebrow="Step 1"
          title="About you"
          sub="Tell us a little about yourself — your age, when you plan to retire, and whether you own your home."
          open={openSection === "about"}
          onToggle={() => toggle("about")}
          testid="section-about-you"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Label className="text-[11px] tracking-wide text-slate-600 w-32 flex-shrink-0">Relationship</Label>
              <Segment options={[{ value: "single", label: "Single" }, { value: "couple", label: "Couple" }]} value={relationship} onChange={setRelationship} testid="seg-relationship" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Your age" value={yourAge} onChange={setYourAge} suffix="years" testid="input-your-age" min={18} max={75} />
              <Field label="Planned retirement age" value={retireAge} onChange={setRetireAge} suffix="years" testid="input-retire-age" min={Math.max(yourAge + 1, 55)} max={80} />
              <div className="space-y-1.5">
                <Label className="text-[11px] tracking-wide text-slate-600">Gender (for life expectancy)</Label>
                <Segment options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} value={yourGender} onChange={setYourGender} testid="seg-your-gender" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] tracking-wide text-slate-600">Homeowner</Label>
                <Segment options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]} value={homeowner} onChange={setHomeowner} testid="seg-homeowner" />
              </div>
            </div>
          </div>
        </Section>

        {/* ----- Step 1b — Partner ----- */}
        {computed.isCouple && (
          <Section
            eyebrow="Step 1b"
            title="About your partner"
            sub="Their age and gender help estimate how long the household income needs to last."
            open={openSection === "partner"}
            onToggle={() => toggle("partner")}
            testid="section-about-partner"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Partner age" value={partnerAge} onChange={setPartnerAge} suffix="years" testid="input-partner-age" min={18} max={80} />
              <div className="space-y-1.5">
                <Label className="text-[11px] tracking-wide text-slate-600">Partner gender</Label>
                <Segment options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} value={partnerGender} onChange={setPartnerGender} testid="seg-partner-gender" />
              </div>
            </div>
          </Section>
        )}

        {/* ----- Step 2 — Income ----- */}
        <Section
          eyebrow="Step 2"
          title="Your income"
          sub={`Your current gross annual salary${computed.isCouple ? " and your partner's" : ""} — used to project employer super contributions and tax saved.`}
          open={openSection === "income"}
          onToggle={() => toggle("income")}
          testid="section-income"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Your gross annual salary" value={yourSalary} onChange={setYourSalary} prefix="$" testid="input-your-salary" />
            {computed.isCouple && <Field label="Partner's gross annual salary" value={partnerSalary} onChange={setPartnerSalary} prefix="$" testid="input-partner-salary" />}
            <Field label="Your taxable income" value={taxableIncome} onChange={setTaxableIncome} prefix="$" testid="input-taxable-income" hint="Drives marginal rate & Div 293 calcs" />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <Toggle label="Include the Age Pension in my retirement income" hint="Assumes you'll meet residency, age, and means tests at retirement." checked={includeAgePension} onChange={setIncludeAgePension} testid="toggle-age-pension" />
            <span className="ml-auto">Marginal rate · <span className="font-mono text-[#1a2744]">{computed.marginalPct.toFixed(0)}%</span></span>
          </div>
        </Section>

        {/* ----- Step 3 — Itemized super ----- */}
        <Section
          eyebrow="Step 3"
          title="Your super"
          sub="Every super account in the household, each editable. Add or remove rows to match the real structure — the projection uses the live total."
          open={openSection === "super"}
          onToggle={() => toggle("super")}
          testid="section-super"
        >
          {/* Super accounts list */}
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_180px_36px] gap-2 text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">
              <span>Account name</span>
              <span className="text-right">Balance</span>
              <span />
            </div>
            {superAccounts.map((s) => (
              <div key={s.id} className="space-y-1.5" data-testid={`super-row-${s.id}`}>
                <AssetRow item={s} onChange={(next) => updateSuperAccount(s.id, next)} onRemove={() => removeSuperAccount(s.id)} testid={`super-${s.id}`} />
                {computed.isCouple && (
                  <div className="flex items-center gap-2 pl-1">
                    <span className="text-[10px] text-slate-400">Owner:</span>
                    <Segment
                      options={[{ value: "you", label: "You" }, { value: "partner", label: "Partner" }]}
                      value={s.owner}
                      onChange={(v) => updateSuperAccount(s.id, { ...s, owner: v })}
                      testid={`super-owner-${s.id}`}
                    />
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={addSuperAccount} className="text-xs text-[#D4A84C] hover:text-[#8a6c1a] flex items-center gap-1 font-semibold" data-testid="add-super-account">
              <Plus className="h-3.5 w-3.5" /> Add another super account
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
            <Field label="Employer SG rate" value={yourSgRate} onChange={setYourSgRate} suffix="%" step={0.5} testid="input-sg-rate" min={0} max={15} hint="2025-26 = 12%" />
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Your super total</p>
                <p className="font-serif text-xl text-[#1a2744] mt-0.5 tabular-nums" data-testid="your-super-total">{fmt(computed.yourSuperBalance)}</p>
              </div>
              {computed.isCouple && (
                <div>
                  <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Partner super total</p>
                  <p className="font-serif text-xl text-[#1a2744] mt-0.5 tabular-nums" data-testid="partner-super-total">{fmt(computed.partnerSuperBalance)}</p>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ----- Step 4 — Other assets, contribution strategy, fees & investment option ----- */}
        <Section
          eyebrow="Step 4"
          title="Other assets, savings & contribution strategy"
          sub="Anything else you'll draw on in retirement, plus the contribution mix, fund fees, and investment option that drive your projection."
          open={openSection === "other"}
          onToggle={() => toggle("other")}
          testid="section-other"
        >

          {/* 4a — Itemized other liquid assets */}
          <div className="mb-7">
            <h3 className="text-sm font-semibold text-[#1a2744] mb-2">Other assets</h3>
            <p className="text-[11px] text-slate-500 mb-3">Cash, shares, managed funds, investment property, bonds, alternatives — anything outside super.</p>
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_180px_36px] gap-2 text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">
                <span>Asset name</span>
                <span className="text-right">Value</span>
                <span />
              </div>
              {otherAssets.map((a) => (
                <AssetRow key={a.id} item={a} onChange={(next) => updateOtherAsset(a.id, next)} onRemove={() => removeOtherAsset(a.id)} testid={`other-${a.id}`} />
              ))}
              <button type="button" onClick={addOtherAsset} className="text-xs text-[#D4A84C] hover:text-[#8a6c1a] flex items-center gap-1 font-semibold" data-testid="add-other-asset">
                <Plus className="h-3.5 w-3.5" /> Add another asset
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Net investment property rental" value={propertyRental} onChange={setPropertyRental} prefix="$" suffix="/ yr" testid="input-property-rental" hint="After expenses + tax" />
              <div className="flex items-end justify-end">
                <div className="text-right">
                  <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Other assets total</p>
                  <p className="font-serif text-xl text-[#1a2744] mt-0.5 tabular-nums" data-testid="other-assets-total">{fmt(computed.otherAssetsTotal)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4b — Contribution strategy */}
          <div className="mb-7 pt-5 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-[#1a2744] mb-2">Contribution strategy</h3>
            <p className="text-[11px] text-slate-500 mb-4">Voluntary contributions on top of the compulsory employer SG. Pre-tax (salary sacrifice / personal deductible) sits inside the concessional cap. After-tax is non-concessional.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Salary sacrifice" value={salarySacrifice} onChange={setSalarySacrifice} prefix="$" suffix="/ yr" testid="input-salary-sac" hint="Pre-tax voluntary" />
              <Field label="Personal deductible" value={personalDeductible} onChange={setPersonalDeductible} prefix="$" suffix="/ yr" testid="input-personal-deductible" hint="Concessional (notice of intent)" />
              <Field label="After-tax (non-concessional)" value={afterTaxContrib} onChange={setAfterTaxContrib} prefix="$" suffix="/ yr" testid="input-after-tax" />
              <Field label="Spouse contribution" value={spouseContrib} onChange={setSpouseContrib} prefix="$" suffix="/ yr" testid="input-spouse" hint="Potential $540 tax offset" />
              {computed.isCouple && (
                <Field label="Partner salary sacrifice" value={partnerSalarySac} onChange={setPartnerSalarySac} prefix="$" suffix="/ yr" testid="input-partner-salsac" />
              )}
            </div>

            {/* Concessional usage */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600">Concessional cap usage</span>
                <span className="font-mono text-[#1a2744]">{fmt(computed.totalConcessional)} / {fmt(computed.concessionalCap)}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all ${computed.capUsedPct > 100 ? "bg-rose-500" : "bg-[#D4A84C]"}`} style={{ width: `${Math.min(100, computed.capUsedPct)}%` }} />
              </div>
              {computed.div293Applicable && (
                <div className="mt-3 flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50/60 border border-amber-200 rounded-lg p-2.5" data-testid="div293-warning">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>Division 293 applies — additional 15% tax on concessional contributions because total assessable income exceeds $250k. Estimated extra: <span className="font-mono">{fmt(computed.div293Cost)}</span>/yr.</span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[11px] text-slate-500">Estimated tax saved · <span className="font-mono text-[#1a2744]">{fmt(computed.taxSaved)}</span>/yr</p>
                <PillButton variant="ghost" onClick={suggestOptimal} data-testid="btn-suggest-optimal" className="!text-[#8a6c1a] !border-[#D4A84C]/40 hover:!bg-[#D4A84C]/10">
                  <Lightbulb className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Suggest optimal
                </PillButton>
              </div>
            </div>
          </div>

          {/* 4c — Fund fees */}
          <div className="mb-7 pt-5 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-[#1a2744] mb-2">Fund fees</h3>
            <p className="text-[11px] text-slate-500 mb-4">The fees your fund charges. Defaults reflect an industry-fund median.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Admin fee (flat)" value={adminFeeDollar} onChange={setAdminFeeDollar} prefix="$" suffix="/ yr" testid="input-admin-flat" />
              <Field label="Admin fee (%)" value={adminFeePct} onChange={setAdminFeePct} suffix="%" step={0.05} testid="input-admin-pct" />
              <Field label="Investment fee (%)" value={investmentFeePct} onChange={setInvestmentFeePct} suffix="%" step={0.05} testid="input-invest-pct" hint="Indirect cost ratio" />
            </div>
          </div>

          {/* 4d — Investment option */}
          <div className="pt-5 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-[#1a2744] mb-2">Investment option</h3>
            <p className="text-[11px] text-slate-500 mb-4">Higher-growth options have higher expected returns but also higher short-term volatility.</p>
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
          </div>
        </Section>

        {/* ----- Step 5 — Spending ----- */}
        <Section
          eyebrow="Step 5"
          title="Your spending in retirement"
          sub="How much you want to spend each year in retirement (today's dollars). The ASFA Retirement Standard is a useful starting point."
          open={openSection === "spending"}
          onToggle={() => toggle("spending")}
          testid="section-spending"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Desired annual spending" value={annualSpending} onChange={setAnnualSpending} prefix="$" testid="input-spending" />
            <div className="hidden md:block" />
          </div>
          <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold mb-2.5">ASFA Retirement Standard · 2025</p>
          <div className="grid grid-cols-2 gap-2">
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
                  className={`text-left rounded-xl border p-3 transition-all ${selected ? "border-[#1a2744] bg-slate-50 ring-1 ring-[#1a2744]/20" : "border-slate-200 bg-white hover:border-slate-400"}`}
                  data-testid={`asfa-${p.key}`}
                >
                  <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500">{p.label}</p>
                  <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">{fmt(p.value)}</p>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ----- Step 6 — Advanced ----- */}
        <Section
          eyebrow="Step 6 · Optional"
          title="Advanced assumptions"
          sub="Inflation, life expectancy. The investment-return and fee defaults sit in Step 4 above."
          open={openSection === "advanced"}
          onToggle={() => toggle("advanced")}
          testid="section-advanced"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Inflation (CPI)" value={inflationPct} onChange={setInflationPct} suffix="% p.a." step={0.1} testid="input-inflation" />
            <Field label="Life expectancy override" value={lifeExpectancyOverride} onChange={setLifeExpectancyOverride} suffix="years" testid="input-life-exp" hint={`Leave 0 to use ABS default (${computed.yourLifeExp})`} />
          </div>
        </Section>

        <p className="text-[11px] text-slate-400 leading-relaxed px-2 pb-2">
          Projections use MoneySmart methodology: nominal returns less fees and inflation, projected over your time-to-retirement and life expectancy, drawn down at a sustainable rate. Age Pension is estimated on the assets test only and assumes you'll meet eligibility at retirement.
        </p>
      </div>

      {/* ===== Bottom: BIG result card — large headline, on-brand ===== */}
      <Card className="border-slate-200" data-testid="result-card">
        <CardContent className="p-8 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
            {/* Headline */}
            <div>
              <p className={EYEBROW}>Result</p>
              <h2 className="font-serif text-2xl text-[#1a2744] mt-1.5">Your annual retirement income</h2>
              <p className="font-serif text-7xl md:text-8xl text-[#1a2744] mt-5 tabular-nums leading-none" data-testid="result-income">
                {fmtCompact(computed.achievableSpending)}
              </p>
              <p className="text-sm text-slate-500 mt-4">
                per year in today's dollars · {computed.isCouple ? "couple" : "single"} · {includeAgePension ? "incl. Age Pension" : "excl. Age Pension"} · investment option {computed.option.label}
              </p>
              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] tracking-wide uppercase font-semibold ${computed.fundingStatus === "fully_funded" ? "border-[#1a2744] text-[#1a2744]" : computed.fundingStatus === "minor_gap" ? "border-[#D4A84C] text-[#8a6c1a]" : "border-slate-400 text-slate-600"}`} data-testid="result-status-pill">
                  <span className={`h-1.5 w-1.5 rounded-full ${computed.fundingStatus === "fully_funded" ? "bg-[#1a2744]" : computed.fundingStatus === "minor_gap" ? "bg-[#D4A84C]" : "bg-slate-400"}`} />
                  {computed.fundingStatus === "fully_funded" ? "Fully funded" : computed.fundingStatus === "minor_gap" ? "Minor gap" : "Underfunded"}
                </span>
                <span className="text-xs text-slate-500 font-mono">{confidence}% confidence</span>
              </div>
            </div>
            {/* Right side — supporting numbers */}
            <div className="space-y-4 lg:border-l lg:border-slate-100 lg:pl-8">
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">Desired spending</p>
                <p className="font-serif text-2xl text-[#1a2744] mt-1 tabular-nums" data-testid="result-desired-spending">{fmtCompact(annualSpending)}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">{computed.shortfall > 0 ? "Annual shortfall" : "Annual surplus"}</p>
                <p className={`font-serif text-2xl mt-1 tabular-nums ${computed.shortfall > 0 ? "text-rose-600" : "text-[#1a2744]"}`} data-testid="result-gap">
                  {computed.shortfall > 0 ? "−" : "+"}{fmtCompact(Math.abs(computed.shortfall))}
                </p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">Super at retirement (median)</p>
                <p className="font-serif text-2xl text-[#1a2744] mt-1 tabular-nums" data-testid="result-super-at-retirement">{fmtCompact(computed.sim.portfolioAtRetirement)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">at age {computed.yearsToRetirement + yourAge}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">From super (4%) / Age pension</p>
                <p className="font-serif text-base text-[#1a2744] mt-1 tabular-nums">
                  {fmt(computed.sustainableFromSuper)}{includeAgePension ? ` + ${fmt(computed.agePensionAnnual)}` : ""}
                </p>
              </div>
            </div>
          </div>

          {computed.shortfall > 0 && (
            <div className="mt-7 flex items-start gap-2 text-xs text-amber-700 bg-amber-50/60 border border-amber-200 rounded-lg p-3" data-testid="shortfall-hint">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>To close the gap of <span className="font-mono">{fmtCompact(computed.shortfall)}</span>, try adding {fmtCompact(Math.round(computed.shortfall / 0.04 / Math.max(1, computed.yearsToRetirement)))}/yr more in contributions, or pushing retirement back 2-3 years.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Projection trajectory chart ===== */}
      <Card className="border-slate-200" data-testid="results-panel">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div>
              <p className={EYEBROW}>Projection</p>
              <h3 className="font-serif text-xl text-[#1a2744] leading-tight">Portfolio trajectory</h3>
              <p className="text-xs text-slate-500 mt-0.5">Monte Carlo · 500 simulations</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnTrack ? "bg-emerald-500" : confidence >= 60 ? "bg-amber-500" : "bg-rose-500"}`} />
              <span className="font-mono text-[#1a2744]">{confidence}% confidence</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{isOnTrack ? "On track" : confidence >= 60 ? "Monitor" : "At risk"}</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[280px] mt-5 -mx-1" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50} minHeight={240}>
              <AreaChart data={computed.chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bandHi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4A84C" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#D4A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={55} />
                <Tooltip formatter={(v) => fmt(v)} labelFormatter={(v) => `Age ${v}`} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }} />
                <Area type="monotone" dataKey="high" stackId="band" stroke="none" fill="url(#bandHi)" />
                <Area type="monotone" dataKey="median" stroke="#1a2744" strokeWidth={2} fill="none" name="Median" />
                <ReferenceLine x={retireAge} stroke="#D4A84C" strokeDasharray="3 3" label={{ value: "Retire", position: "top", fill: "#D4A84C", fontSize: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ===== Annual drawdown / portfolio breakdown table ===== */}
      <Card className="border-slate-200" data-testid="annualised-table-card">
        <button
          type="button"
          onClick={() => setShowAnnualised((v) => !v)}
          className="w-full flex items-center justify-between gap-4 p-5 hover:bg-slate-50/40 transition-colors rounded-2xl text-left"
          data-testid="toggle-annualised"
        >
          <div>
            <p className={EYEBROW}>Annual drawdown · breakdown</p>
            <h3 className="font-serif text-xl text-[#1a2744] leading-tight mt-1">Year-by-year portfolio &amp; drawdown table</h3>
            <p className="text-xs text-slate-500 mt-0.5">{computed.annualisedTable.length} years · accumulation → drawdown · option {computed.option.label}{showAnnualised ? "" : " · click to expand"}</p>
          </div>
          {showAnnualised
            ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
            : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />}
        </button>
        {showAnnualised && (
          <div className="px-5 pb-5 -mt-1 border-t border-slate-100 pt-4">
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm" data-testid="annualised-table">
                <thead>
                  <tr className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <th className="text-left px-2 py-2.5">Age</th>
                    <th className="text-left px-2 py-2.5">Phase</th>
                    <th className="text-right px-2 py-2.5">Opening</th>
                    <th className="text-right px-2 py-2.5">Contribs</th>
                    <th className="text-right px-2 py-2.5">Net return</th>
                    <th className="text-right px-2 py-2.5">Fees</th>
                    <th className="text-right px-2 py-2.5">Drawdown</th>
                    <th className="text-right px-2 py-2.5">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {computed.annualisedTable.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${row.phase === "Drawdown" ? "bg-[#D4A84C]/[0.04]" : ""}`} data-testid={`annualised-row-${i}`}>
                      <td className="px-2 py-2 font-mono text-[#1a2744]">{row.age}</td>
                      <td className="px-2 py-2 text-slate-600">
                        <span className={`text-[10px] tracking-wide uppercase font-semibold ${row.phase === "Accumulation" ? "text-[#1a2744]" : "text-[#8a6c1a]"}`}>{row.phase}</span>
                      </td>
                      <td className="px-2 py-2 font-mono text-[#1a2744] text-right">{fmtCompact(row.opening)}</td>
                      <td className="px-2 py-2 font-mono text-[#1a2744] text-right">{row.contribs ? `+${fmtCompact(row.contribs)}` : "—"}</td>
                      <td className="px-2 py-2 font-mono text-[#1a2744] text-right">{row.netReturn >= 0 ? "+" : ""}{fmtCompact(row.netReturn)}</td>
                      <td className="px-2 py-2 font-mono text-slate-500 text-right">−{fmtCompact(row.fees)}</td>
                      <td className="px-2 py-2 font-mono text-slate-500 text-right">{row.withdraw ? `−${fmtCompact(row.withdraw)}` : "—"}</td>
                      <td className="px-2 py-2 font-mono text-[#1a2744] text-right font-semibold">{fmtCompact(row.closing)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">
                    <td colSpan="3" className="px-2 pt-3">Total contributions (accumulation)</td>
                    <td className="px-2 pt-3 text-right font-mono">
                      +{fmtCompact(computed.annualisedTable.filter((r) => r.phase === "Accumulation").reduce((s, r) => s + r.contribs, 0))}
                    </td>
                    <td colSpan="2" className="px-2 pt-3 text-right">Total drawdown</td>
                    <td className="px-2 pt-3 text-right font-mono">
                      −{fmtCompact(computed.annualisedTable.filter((r) => r.phase === "Drawdown").reduce((s, r) => s + r.withdraw, 0))}
                    </td>
                    <td className="px-2 pt-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  return embedded ? body : (
    <Layout>
      <PageShell
        eyebrow="CALCULATOR · RETIREMENT"
        title="Retirement planner"
        accent="will i have enough?"
        subtitle="Project your retirement income — your super accounts, the Age Pension, contribution strategy, fund fees, and any other savings — all in one MoneySmart-aligned flow. Edit any field and the results recalculate instantly."
        meta="MONEYSMART · METHODOLOGY ALIGNED"
        metrics={[
          { label: "Achievable spending", value: fmtCompact(computed.achievableSpending) },
          { label: "Desired spending", value: fmtCompact(annualSpending) },
          { label: "Confidence", value: `${confidence}%` },
          { label: "Years to retirement", value: String(computed.yearsToRetirement) },
        ]}
      >
        {body}
      </PageShell>
    </Layout>
  );
};

export default RetirementPlanner;
