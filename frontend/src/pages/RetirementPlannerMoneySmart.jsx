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

const SECTION_CLASS = "rounded-2xl border border-slate-200 bg-white p-6";
const SECTION_HEAD = "font-serif text-2xl text-[#1a2744] mb-1";
const SECTION_SUB  = "text-sm text-slate-500 mb-5";
const EYEBROW      = "text-[10px] tracking-[0.18em] uppercase text-[#D4A84C] font-semibold mb-2";

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
    };
  }
  const prof = client.profile || {};
  const ret  = client.retirement || {};
  const assets = client.assets || [];

  // Itemize super into separate rows preserving entity for spouse detection.
  const superAssets = assets.filter((a) => a.type === "Super" || a.type === "SMSF");
  const superAccounts = superAssets.length > 0
    ? superAssets.map((a, i) => ({
        id: `${a.name || "super"}-${i}`,
        name: a.name || a.type || "Super account",
        value: a.value || 0,
        owner: (a.entity || "").toLowerCase().includes("spouse") || (a.entity || "").toLowerCase().includes("partner") ? "partner" : "you",
      }))
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

  // Couple detection — household income heuristic + partner age presence.
  const isCouple = !!prof.partner_name || !!prof.partner_age || (prof.incomeHousehold && prof.personal_income && prof.incomeHousehold > prof.personal_income);

  return {
    relationship: isCouple ? "couple" : "single",
    yourAge: prof.age || ret.current_age || 50,
    yourGender: (prof.gender || "male").toLowerCase().startsWith("f") ? "female" : "male",
    retireAge: ret.retirement_age || prof.retirement_age || 67,
    homeowner: prof.homeowner !== false,
    partnerAge: prof.partner_age || (prof.age ? prof.age - 2 : 48),
    partnerGender: (prof.partner_gender || "female").toLowerCase().startsWith("m") ? "male" : "female",
    yourSalary: prof.personal_income || Math.round((prof.incomeHousehold || 0) / (isCouple ? 1.6 : 1)) || 95000,
    partnerSalary: prof.partner_income || Math.round((prof.incomeHousehold || 0) - (prof.personal_income || 0)) || 0,
    superAccounts,
    otherAssets,
    taxableIncome: prof.personal_income || prof.incomeHousehold || 0,
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
  const [annualSpending, setAnnualSpending] = useState(0);
  useEffect(() => {
    if (annualSpending === 0) {
      setAnnualSpending(relationship === "couple" ? ASFA.couple_comfortable : ASFA.single_comfortable);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ Step 6 — Advanced (collapsible) ============
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inflationPct, setInflationPct] = useState(2.5);
  const [lifeExpectancyOverride, setLifeExpectancyOverride] = useState(0);

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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6" data-testid="retirement-planner-page">
      {/* ===== Left: Input sections ===== */}
      <div className="space-y-5">

        {clientName && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#D4A84C]/40 bg-white p-4" data-testid="client-data-banner">
            <Users className="h-4 w-4 text-[#D4A84C]" />
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#8a6c1a] font-semibold">Pre-populated from client record</p>
              <p className="text-sm text-[#1a2744]">All fields below reflect the <span className="font-semibold">{clientName}</span> household. Edit anything to model what-ifs — the underlying client record is unchanged.</p>
            </div>
          </div>
        )}

        {/* ----- Step 1 — About you ----- */}
        <section className={SECTION_CLASS} data-testid="section-about-you">
          <p className={EYEBROW}>Step 1</p>
          <h2 className={SECTION_HEAD}>About you</h2>
          <p className={SECTION_SUB}>Tell us a little about yourself — your age, when you plan to retire, and whether you own your home.</p>
          <div className="space-y-5">
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
        </section>

        {/* ----- Step 1b — Partner ----- */}
        {computed.isCouple && (
          <section className={SECTION_CLASS} data-testid="section-about-partner">
            <p className={EYEBROW}>Step 1b</p>
            <h2 className={SECTION_HEAD}>About your partner</h2>
            <p className={SECTION_SUB}>Their age and gender help estimate how long the household income needs to last.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Partner age" value={partnerAge} onChange={setPartnerAge} suffix="years" testid="input-partner-age" min={18} max={80} />
              <div className="space-y-1.5">
                <Label className="text-[11px] tracking-wide text-slate-600">Partner gender</Label>
                <Segment options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} value={partnerGender} onChange={setPartnerGender} testid="seg-partner-gender" />
              </div>
            </div>
          </section>
        )}

        {/* ----- Step 2 — Income ----- */}
        <section className={SECTION_CLASS} data-testid="section-income">
          <p className={EYEBROW}>Step 2</p>
          <h2 className={SECTION_HEAD}>Your income</h2>
          <p className={SECTION_SUB}>Your current gross annual salary{computed.isCouple ? " and your partner's" : ""} — used to project employer super contributions and tax saved.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Your gross annual salary" value={yourSalary} onChange={setYourSalary} prefix="$" testid="input-your-salary" />
            {computed.isCouple && <Field label="Partner's gross annual salary" value={partnerSalary} onChange={setPartnerSalary} prefix="$" testid="input-partner-salary" />}
            <Field label="Your taxable income" value={taxableIncome} onChange={setTaxableIncome} prefix="$" testid="input-taxable-income" hint="Drives marginal rate & Div 293 calcs" />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <Toggle label="Include the Age Pension in my retirement income" hint="Assumes you'll meet residency, age, and means tests at retirement." checked={includeAgePension} onChange={setIncludeAgePension} testid="toggle-age-pension" />
            <span className="ml-auto">Marginal rate · <span className="font-mono text-[#1a2744]">{computed.marginalPct.toFixed(0)}%</span></span>
          </div>
        </section>

        {/* ----- Step 3 — Itemized super ----- */}
        <section className={SECTION_CLASS} data-testid="section-super">
          <p className={EYEBROW}>Step 3</p>
          <h2 className={SECTION_HEAD}>Your super</h2>
          <p className={SECTION_SUB}>Every super account in the household, each editable. Add or remove rows to match the real structure — the projection uses the live total.</p>

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

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
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
        </section>

        {/* ----- Step 4 — Other assets, contribution strategy, fees & investment option ----- */}
        <section className={SECTION_CLASS} data-testid="section-other">
          <p className={EYEBROW}>Step 4</p>
          <h2 className={SECTION_HEAD}>Other assets, savings &amp; contribution strategy</h2>
          <p className={SECTION_SUB}>Anything else you'll draw on in retirement, plus the contribution mix, fund fees, and investment option that drive your projection.</p>

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
        </section>

        {/* ----- Step 5 — Spending ----- */}
        <section className={SECTION_CLASS} data-testid="section-spending">
          <p className={EYEBROW}>Step 5</p>
          <h2 className={SECTION_HEAD}>Your spending in retirement</h2>
          <p className={SECTION_SUB}>How much you want to spend each year in retirement (today's dollars). The ASFA Retirement Standard is a useful starting point.</p>
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

        {/* ----- Step 6 — Advanced (collapsible) ----- */}
        <section className={SECTION_CLASS} data-testid="section-advanced">
          <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="w-full flex items-center justify-between gap-4" data-testid="toggle-advanced">
            <div className="text-left">
              <p className={EYEBROW}>Step 6 · Optional</p>
              <h2 className={SECTION_HEAD}>Advanced assumptions</h2>
              <p className="text-sm text-slate-500">Inflation, life expectancy. The investment-return and fee defaults sit in Step 4 above.</p>
            </div>
            {showAdvanced ? <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />}
          </button>
          {showAdvanced && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Inflation (CPI)" value={inflationPct} onChange={setInflationPct} suffix="% p.a." step={0.1} testid="input-inflation" />
              <Field label="Life expectancy override" value={lifeExpectancyOverride} onChange={setLifeExpectancyOverride} suffix="years" testid="input-life-exp" hint={`Leave 0 to use ABS default (${computed.yourLifeExp})`} />
            </div>
          )}
        </section>

        <p className="text-[11px] text-slate-400 leading-relaxed px-2 pb-4">
          Projections use MoneySmart methodology: nominal returns less fees and inflation, projected over your time-to-retirement and life expectancy, drawn down at a sustainable rate. Age Pension is estimated on the assets test only and assumes you'll meet eligibility at retirement.
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

            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnTrack ? "bg-emerald-500" : confidence >= 60 ? "bg-amber-500" : "bg-rose-500"}`} />
              <span className="font-mono text-[#1a2744]">{confidence}% confidence</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{isOnTrack ? "On track" : confidence >= 60 ? "Monitor" : "At risk"}</span>
            </div>

            <div className="h-[180px] mt-5 -mx-1" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={50} minHeight={180}>
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
              <div className="flex justify-between text-xs"><span className="text-slate-500">From super (4% rule)</span><span className="font-mono text-[#1a2744]">{fmt(computed.sustainableFromSuper)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">From Age Pension</span><span className="font-mono text-[#1a2744]">{includeAgePension ? fmt(computed.agePensionAnnual) : "—"}</span></div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-100"><span className="text-slate-600 font-medium">Desired spending</span><span className="font-mono text-[#1a2744]">{fmt(annualSpending)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">{computed.shortfall > 0 ? "Shortfall" : "Surplus"}</span><span className={`font-mono ${computed.shortfall > 0 ? "text-rose-600" : "text-emerald-600"}`}>{computed.shortfall > 0 ? "−" : "+"}{fmt(Math.abs(computed.shortfall))}</span></div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className={EYEBROW}>Super at retirement (median)</p>
              <p className="font-serif text-2xl text-[#1a2744] tabular-nums" data-testid="result-super-at-retirement">{fmtCompact(computed.sim.portfolioAtRetirement)}</p>
              <p className="text-[10px] text-slate-400 mt-1">P10 → P90 band: {fmtCompact(computed.sim.p10AtLifeEnd)} → {fmtCompact(computed.sim.p90AtLifeEnd)} at age {computed.yourLifeExp}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-500">Household contributions / yr</span><span className="font-mono text-[#1a2744]">{fmt(computed.annualGrossContrib)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total fees over horizon (est.)</span><span className="font-mono text-[#1a2744]">{fmtCompact(computed.totalFeesPaid)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Investment option</span><span className="font-mono text-[#1a2744]">{computed.option.label} · {computed.option.nominal}%</span></div>
            </div>

            {computed.shortfall > 0 && (
              <div className="mt-5 flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50/60 border border-amber-200 rounded-lg p-3">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>To close the gap of <span className="font-mono">{fmtCompact(computed.shortfall)}</span>, try adding {fmtCompact(Math.round(computed.shortfall / 0.04 / Math.max(1, computed.yearsToRetirement)))}/yr more in contributions, or pushing retirement back 2-3 years.</span>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-[10px] text-slate-400 text-center mt-3">Updates live as you change inputs · MoneySmart-aligned methodology</p>
      </aside>
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
