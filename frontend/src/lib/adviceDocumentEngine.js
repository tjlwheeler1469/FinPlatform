// SOA / ROA Template Engine — ASIC-style letter format
// =====================================================
// Produces a narrative "letter to the client" document that mirrors the ASIC
// worked examples (INFO 267 for SOA · INFO 266 for ROA) rather than the old
// "corporate glossy brochure" style.
//
// Key design principles (from ASIC):
//  - Plain English narrative, short paragraphs, numbered recommendations
//  - Inline small tables only where data is genuinely tabular (fees, cover,
//    comparisons) — never decorative
//  - Letterhead + "About this document" + "Your reasons for seeking advice"
//    + "What my advice does not cover" + "Overview of my recommendations"
//    + "Your current situation" + "My advice and why it's appropriate"
//    + "Things you need to know" + "Advice fees and conflicts"
//    + "Cooling-off" + "Next steps"
//  - ROA is a 2-3 page follow-up referencing the prior SOA

import { calculateTax, getMarginalRate, CGT_REFORM_DATE, NG_REFORM_DATE, TRUST_REFORM_DATE } from "@/lib/auTax";
import { projectRetirement } from "@/lib/retirementEngine";
import { computeReadiness } from "@/engine/retirementReadinessEngine";

// ----- 2026-27 Budget rule helpers -----
const HAS_INVESTMENT_PROPERTY = (client) =>
  (client.assets || []).some((a) => a.type === "Property" && /invest|rental/i.test(a.name || ""));

const INVESTMENT_PROPERTY_VALUE = (client) =>
  (client.assets || [])
    .filter((a) => a.type === "Property" && /invest|rental/i.test(a.name || ""))
    .reduce((s, a) => s + (a.value || 0), 0);

const INVESTMENT_LOANS_VALUE = (client) =>
  (client.liabilities || [])
    .filter((l) => /invest/i.test(l.name || ""))
    .reduce((s, l) => s + (l.value || l.balance || 0), 0);

const HAS_FAMILY_TRUST = (client) =>
  (client.assets || []).some((a) => /trust/i.test(a.entity || "") || /trust/i.test(a.name || ""));

const daysUntil = (date) => Math.max(0, Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24)));

// ---------- formatters ----------
export const formatCurrency = (v) => `$${Math.round(v || 0).toLocaleString()}`;
export const formatToday = () =>
  new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

const stableSeed = (s) => {
  const str = String(s || "default");
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h || 1;
};

const docRef = (prefix, clientId) =>
  `${prefix}-${new Date().getFullYear()}-${(clientId || "XXXX").slice(0, 6).toUpperCase()}-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;

// ---------- SOA section builders (letter format) ----------

// Letterhead — client & adviser identity, licence info, document date.
const soaLetterhead = (client, adviser, ref) => ({
  id: "letterhead",
  type: "letterhead",
  title: "Statement of Advice",
  client: { name: client.name, address: client.profile.address || "" },
  date: formatToday(),
  adviser: {
    name: adviser.name,
    ar_number: adviser.arNumber || "AR 000000",
    phone: adviser.phone || "(03) 9000 0000",
    email: adviser.email || `${(adviser.name || "adviser").toLowerCase().replace(/\s+/g, ".")}@halcyonwealth.com.au`,
    address: adviser.address || "Level 40, 101 Collins Street, Melbourne VIC 3000",
  },
  licensee: {
    name: adviser.dealerGroup || "Halcyon Wealth Pty Ltd",
    afsl: adviser.licenseNumber || "AFSL 384359",
    phone: adviser.licenseePhone || "1300 000 000",
    email: "compliance@halcyonwealth.com.au",
  },
  reference: ref,
});

const soaAbout = (client, meetingDate) => ({
  id: "about",
  type: "paragraph",
  heading: "About this document",
  paragraphs: [
    `This Statement of Advice (SOA) sets out my advice to you after our discussions on ${meetingDate} about your financial circumstances.`,
    `This advice is current for 30 days from the date of this document, after which time it will expire. You should not rely on this advice after 30 days without contacting me to discuss any changes to your circumstances.`,
  ],
});

const soaReasons = (client) => ({
  id: "reasons",
  type: "paragraph",
  heading: "Your reasons for seeking advice",
  paragraphs: [
    `During our meetings we discussed your desire to plan for a comfortable retirement, grow your long-term wealth, and protect your family against unexpected events. You asked me to prepare tailored advice across the following areas:`,
  ],
  bullets: (client.profile.advice_areas && client.profile.advice_areas.length > 0
    ? client.profile.advice_areas
    : ["retirement strategy and superannuation", "investment portfolio construction and rebalancing", "personal risk protection (life, TPD, income protection)", "cash-flow, tax and estate-planning considerations"]
  ),
});

// 2026-27 Budget "Tax law changes" callout — only inserted when the projection
// crosses 1 July 2027 OR the client has Budget-affected holdings.
const soaTaxLawCallout = (client) => {
  const hasInvProp = HAS_INVESTMENT_PROPERTY(client);
  const hasTrust = HAS_FAMILY_TRUST(client);
  const dCgt = daysUntil(CGT_REFORM_DATE);
  const dTrust = daysUntil(TRUST_REFORM_DATE);
  const bullets = [];
  if (hasInvProp) {
    bullets.push(`From 1 July 2027 (${dCgt} days away) — the 50% CGT discount is being replaced by cost-base indexation plus a 30% minimum tax. Existing dwellings purchased after 12 May 2026 lose negative gearing against wages from 1 July 2027 (losses will only offset other residential income). New builds keep both incentives.`);
  }
  if (hasTrust) {
    bullets.push(`From 1 July 2028 (${dTrust} days away) — a 30% minimum tax will apply to distributions from discretionary trusts. Non-corporate beneficiaries receive a non-refundable credit; corporate beneficiaries do not. Testamentary trusts existing at announcement are excluded.`);
  }
  bullets.push(`Working Australians Tax Offset (WATO) of up to $250 begins 1 July 2027, lifting the effective tax-free threshold to $19,985.`);

  return {
    id: "tax-law-changes",
    type: "callout",
    heading: "Important tax law changes effective during this plan's horizon",
    intro: `The 2026–27 Federal Budget introduced material changes that affect how I have modelled your plan. These changes are reflected in every projection and recommendation in this document.`,
    bullets,
    footer: `Source: 2026–27 Federal Budget (announced 12 May 2026 19:30 AEST) — Tax explainers on negative gearing, CGT and discretionary trusts.`,
  };
};

const soaScopeOut = () => ({
  id: "scope-out",
  type: "paragraph",
  heading: "What my advice does not cover",
  paragraphs: [
    `My advice does not extend to matters outside my authorisation, including direct property transactions, credit advice (lending), taxation returns, or legal drafting of wills and powers of attorney. Where relevant I will refer you to a suitably qualified specialist.`,
    `Specific legal or accounting advice should be obtained from your solicitor or registered tax agent.`,
  ],
});

const soaOverviewOfAdvice = (recommendations) => ({
  id: "overview",
  type: "paragraph",
  heading: "Overview of my recommendations",
  paragraphs: [
    `Having considered your goals, circumstances and attitude to risk, I recommend:`,
  ],
  numbered: recommendations.map((r, i) => `${r.title}${r.amount ? ` — ${formatCurrency(r.amount)}` : ""}`),
});

const soaCurrentSituation = (client) => {
  const totalAssets = (client.assets || []).reduce((s, a) => s + (a.value || 0), 0);
  const totalLiab = (client.liabilities || []).reduce((s, l) => s + (l.value || l.balance || 0), 0);
  return {
    id: "current-situation",
    type: "situation",
    heading: "Your current situation",
    paragraphs: [
      `You are ${client.profile.age} years old, ${(client.profile.marital_status || client.profile.status || "married").toLowerCase()}${client.profile.dependents ? ` with ${client.profile.dependents} dependant${client.profile.dependents > 1 ? "s" : ""}` : ""}. You are employed as ${client.profile.occupation || "an employee"}${client.profile.employer ? ` with ${client.profile.employer}` : ""}, earning approximately ${formatCurrency(client.profile.incomeHousehold)} per year (household).`,
      `Your household expenses are approximately ${formatCurrency(client.profile.expensesAnnual)} per year, leaving an estimated annual surplus of ${formatCurrency((client.profile.incomeHousehold || 0) - (client.profile.expensesAnnual || 0))}.`,
    ],
    keyFigures: [
      { label: "Total assets", value: formatCurrency(totalAssets) },
      { label: "Total liabilities", value: formatCurrency(totalLiab) },
      { label: "Net worth", value: formatCurrency(totalAssets - totalLiab) },
      { label: "Risk profile", value: client.profile.riskProfile || "Balanced" },
      { label: "Target retirement age", value: String(client.retirement.retirement_age) },
      { label: "Years to retirement", value: String(Math.max(0, client.retirement.retirement_age - client.profile.age)) },
    ],
  };
};

const soaMyAdvice = (client, scenario, recommendations) => ({
  id: "my-advice",
  type: "advice-detail",
  heading: "My advice and why it is appropriate for your circumstances",
  paragraphs: [
    `I have considered your personal circumstances, goals and risk profile and believe the following recommendations will help you move towards a sustainable retirement while protecting your current lifestyle.`,
    `Based on our modelling, your current trajectory delivers a retirement confidence of ${scenario.confidence}% with a projected portfolio of ${formatCurrency(scenario.portfolioAtRetirement)} at age ${client.retirement.retirement_age}. Implementing these recommendations is modelled to improve your confidence and provide greater resilience against market downturns close to retirement.`,
  ],
  recommendations: recommendations.map((r, i) => ({
    n: i + 1,
    title: r.title,
    rationale: r.rationale,
    impact: r.impact,
    risks: r.risks || [],
    cost: r.cost || 0,
  })),
});

const soaThingsYouNeedToKnow = () => ({
  id: "things-you-need-to-know",
  type: "paragraph",
  heading: "Things you need to know",
  paragraphs: [
    `Implementation timing: Do not cancel any existing financial products until replacement products are in force. A short overlap protects you against claim-gaps if you need to rely on them.`,
    `Projections: All figures above are projections based on assumptions about investment returns, inflation, tax law and your personal circumstances. Actual results will differ. Past performance is not a reliable indicator of future returns.`,
    `Superannuation rules: Contributions beyond the concessional cap ($30,000 p.a. from 1 July 2024) may attract additional tax. Division 293 tax applies if your income plus low-tax super contributions exceeds $250,000.`,
    `Insurance: Recommendations depend on accurate underwriting. You must disclose all material matters to the insurer — failure to do so may result in a claim being declined.`,
    `Cooling-off period: You can cancel any new financial product within 14 days of purchase under the Corporations Act.`,
  ],
});

const soaFeesTable = (client, fees) => {
  const ongoing = fees.ongoing || 4400;
  return {
    id: "fees",
    type: "fees-table",
    heading: "Advice fees and conflicts of interest",
    paragraphs: [
      `The fees for this advice are set out in the table below. All amounts include GST where applicable.`,
    ],
    rows: [
      ["Initial advice (this document)", formatCurrency(fees.advice || 4950)],
      ["Implementation fee", formatCurrency(fees.implementation || 2500)],
      ["Ongoing service fee (per year)", formatCurrency(ongoing)],
    ],
    conflicts: [
      `I do not receive commissions from investment or superannuation products. Life insurance commissions (where applicable) are disclosed in the product-specific annexure.`,
      `Halcyon Wealth Pty Ltd is owned independently of the product issuers recommended in this document.`,
    ],
  };
};

const soaNextSteps = () => ({
  id: "next-steps",
  type: "paragraph",
  heading: "Next steps",
  paragraphs: [
    `Please read this document carefully along with the Product Disclosure Statement (PDS) and Financial Services Guide (FSG) provided separately.`,
    `If you wish to proceed, please sign the Authority to Proceed at the end of this document and return it to me. I will then arrange implementation, including account openings, product applications and any rebalancing trades.`,
    `If anything is unclear, please contact me — I will happily talk you through each recommendation before you decide.`,
  ],
});

const soaAuthority = (client, adviser) => ({
  id: "authority",
  type: "authority",
  heading: "Authority to Proceed",
  paragraphs: [
    `By signing below, I acknowledge that I have read, understood and accept the advice contained in this Statement of Advice, and authorise ${adviser.name} (${adviser.arNumber || "AR 000000"}) of ${adviser.dealerGroup || "Halcyon Wealth Pty Ltd"} (${adviser.licenseNumber || "AFSL 384359"}) to proceed with the recommendations.`,
  ],
  signatures: [
    { role: "Client", name: client.name, date: "_________________" },
    { role: "Adviser", name: adviser.name, date: formatToday() },
  ],
});

// ---------- ROA section builders (ASIC INFO 266 format) ----------
// ROA is a shorter follow-up letter referencing the prior SOA.

const roaLetterhead = (client, adviser, ref) => ({
  ...soaLetterhead(client, adviser, ref),
  title: "Record of Advice",
});

const roaAbout = (client, meetingDate, priorSoaDate) => ({
  id: "about",
  type: "paragraph",
  heading: "About this document",
  paragraphs: [
    `This Record of Advice (ROA) records the advice I have provided to you today, ${formatToday()}, following our discussion on ${meetingDate}.`,
    `This ROA is a follow-up to your Statement of Advice dated ${priorSoaDate || "the prior SOA on file"}, and should be read together with that document. The information about my authorisation, fees and conflicts of interest in that SOA continues to apply.`,
  ],
});

const roaReasons = () => ({
  id: "reasons",
  type: "paragraph",
  heading: "Reasons for this advice",
  paragraphs: [
    `We met to review your progress against your plan, your changing circumstances, and market movements since our last review. We agreed that some adjustments are appropriate to keep you on track to your goals.`,
  ],
});

const roaChanges = (recommendations) => ({
  id: "changes",
  type: "paragraph",
  heading: "Changes I recommend",
  paragraphs: [`Based on our discussion, I recommend the following changes:`],
  numbered: recommendations.map((r, i) => `${r.title}${r.amount ? ` — ${formatCurrency(r.amount)}` : ""}`),
});

const roaWhyAppropriate = (recommendations) => ({
  id: "why-appropriate",
  type: "advice-detail",
  heading: "Why these changes are appropriate",
  paragraphs: [
    `These changes sit within the strategy set out in your SOA and do not alter the scope or risk profile of that advice.`,
  ],
  recommendations: recommendations.map((r, i) => ({
    n: i + 1,
    title: r.title,
    rationale: r.rationale,
    impact: r.impact,
    risks: r.risks || [],
    cost: r.cost || 0,
  })),
});

const roaFees = (fees) => ({
  id: "fees",
  type: "fees-table",
  heading: "Fees for this advice",
  paragraphs: [
    `The fees below apply to this ROA only. They are covered by your ongoing service agreement or charged in addition, as marked.`,
  ],
  rows: [
    ["Advice fee for this ROA", formatCurrency((fees.advice || 4950) * 0.4)],
    ["Implementation fee", formatCurrency((fees.implementation || 2500) * 0.5)],
  ],
  conflicts: [
    `The fees in your SOA continue to apply. No additional conflicts of interest apply to this ROA.`,
  ],
});

const roaThingsYouNeedToKnow = () => ({
  id: "things-you-need-to-know",
  type: "paragraph",
  heading: "Things you need to know",
  paragraphs: [
    `This ROA is confined to the changes described above. All other matters covered in your SOA continue to apply.`,
    `You may request a copy of this ROA at any time within 7 years of the date above.`,
    `You can cancel any new product within a 14-day cooling-off period.`,
  ],
});

const roaAuthority = (client, adviser) => soaAuthority(client, adviser);

// ---------- Default recommendation sets ----------

const defaultSoaRecs = (client, scenario) => {
  const margRate = getMarginalRate(client.profile.incomeHousehold || 0);
  // Concessional cap = $30,000 p.a. (2024-25 onward, unchanged in 2026-27 Budget).
  // Estimate current concessional contributions: 11.5% SG of household income
  // plus any explicit annual_contributions tagged as salary-sacrifice (we
  // approximate using 11.5% SG as the floor).
  const CONCESSIONAL_CAP = 30_000;
  const sgFloor = Math.min((client.profile.incomeHousehold || 0) * 0.115, CONCESSIONAL_CAP);
  const concessionalRoom = Math.max(0, CONCESSIONAL_CAP - sgFloor);
  const yearsToRet = Math.max(1, client.retirement.retirement_age - client.profile.age);
  const hasInvProp = HAS_INVESTMENT_PROPERTY(client);
  const invPropValue = INVESTMENT_PROPERTY_VALUE(client);
  const invLoans = INVESTMENT_LOANS_VALUE(client);
  const recs = [];

  recs.push({
    title: "Maximise concessional super contributions via salary sacrifice",
    amount: concessionalRoom,
    rationale: `The concessional cap is $${CONCESSIONAL_CAP.toLocaleString()} p.a. (unchanged in the 2026–27 Budget). Estimated SG contributions of $${Math.round(sgFloor).toLocaleString()} leave approximately $${Math.round(concessionalRoom).toLocaleString()} of unused cap each year. Salary-sacrificing this amount into super reduces marginal-rate tax (currently ${(margRate * 100).toFixed(0)}%) and replaces it with a 15% contributions tax. Over ${yearsToRet} years this compounds inside super.`,
    impact: `Estimated annual tax saving of ${formatCurrency(concessionalRoom * (margRate - 0.15))}. From 1 July 2027 the new Working Australians Tax Offset (WATO) reduces tax by up to $250 — already reflected in the projection.`,
    risks: ["Funds locked in super until preservation age (age 60)", "Division 293 if income exceeds $250,000"],
    cost: 0,
  });

  // Budget 2026-27 — Investment property recommendation
  if (hasInvProp) {
    recs.push({
      title: "Review your investment-property position ahead of the 1 July 2027 CGT & negative-gearing changes",
      amount: invPropValue,
      rationale: `You hold investment property worth approximately ${formatCurrency(invPropValue)} with associated loans of ${formatCurrency(invLoans)}. From 1 July 2027 the 50% CGT discount is replaced by cost-base indexation + 30% minimum tax for existing dwellings, and negative gearing against wages is phased out for properties purchased after 12 May 2026. Properties HELD at the 12 May 2026 announcement are grandfathered and remain eligible for the 50% discount and full negative gearing. We should:\n  · Crystallise the 1 July 2027 cost-base position for each property (valuation or apportionment formula).\n  · Model the CGT swing under "sell pre vs sell post 1 July 2027" for each holding.\n  · Decide whether to retain, dispose of, or convert any property to your main residence ahead of the transition.`,
      impact: `Avoids an avoidable 30% minimum-tax floor on future gains and preserves negative gearing entitlements where eligible.`,
      risks: ["Disposing pre-1 Jul 2027 triggers CGT now (vs deferral)", "Market timing", "Stamp duty + transaction costs on restructure"],
      cost: 2200,
    });
  }

  recs.push({
    title: `Rebalance to your ${client.profile.riskProfile || "Balanced"} target allocation`,
    rationale: `Your portfolio has drifted from the target allocation agreed at our last review. Rebalancing locks in gains in over-weight sectors and re-deploys to under-weight ones, reducing concentration risk and restoring the risk/return profile you signed up to.`,
    impact: `Projected retirement confidence increase of ~3-5 percentage points and modest lifetime portfolio uplift.`,
    risks: ["Triggers small CGT events on the rebalance trades", "Short-term tracking error against the existing mix"],
    cost: 950,
  });

  // Budget 2026-27 — Trust recommendation
  if (HAS_FAMILY_TRUST(client)) {
    recs.push({
      title: "Prepare your discretionary trust for the 1 July 2028 minimum-tax regime",
      rationale: `From 1 July 2028 a 30% minimum tax applies to discretionary-trust distributions. Non-corporate beneficiaries receive a non-refundable credit but corporate beneficiaries do not. The Budget provides 3-year rollover relief from 1 July 2027 to restructure out of discretionary trusts into companies or fixed trusts where appropriate. We will:\n  · Map your projected distributions and identify the marginal-rate uplift.\n  · Review whether a company structure (30% flat + franking) is more efficient than retaining the discretionary trust.\n  · Confirm any testamentary-trust assets existing at announcement remain excluded.`,
      impact: `Avoids an unnecessary marginal tax uplift on adult-beneficiary distributions and uses the 3-year rollover window strategically.`,
      risks: ["Restructure costs (legal + accounting + possible CGT)", "Loss of streaming flexibility post-restructure"],
      cost: 4500,
    });
  }

  recs.push({
    title: "Review and right-size your personal insurances",
    rationale: `Adequate Life, TPD and Income Protection cover protects your plan against shock events. Holding some cover inside super (where appropriate) can be cost-effective. I will run a personal insurance needs analysis using the multiples method and compare 3 providers.`,
    impact: `Closes your identified protection gap and preserves the retirement plan against premature loss of income or life.`,
    risks: ["Underwriting may impose loadings or exclusions", "Policy terms differ across providers"],
    cost: 1500,
  });

  recs.push({
    title: "Update estate-planning documents",
    rationale: `I recommend you review your Will, Enduring Power of Attorney and Binding Death Benefit Nomination with a qualified estate lawyer. These documents should be refreshed every 3-5 years or after any major life event.`,
    impact: `Reduces the risk of intestacy, family conflict and unintended tax outcomes at death.`,
    risks: ["Requires ongoing review", "Independent legal advice required"],
    cost: 0,
  });
  return recs;
};

const defaultRoaRecs = (client) => [
  {
    title: "Top up concessional contributions to the $30,000 cap",
    rationale: `Based on your YTD contributions there is approximately $6,000 of concessional cap remaining this financial year. Topping this up before 30 June secures the tax benefit for FY26.`,
    impact: `Reduces FY26 taxable income and uplifts super by ${formatCurrency(6000)}.`,
    cost: 0,
  },
  {
    title: "Rebalance equities back to target",
    rationale: `Australian equities have drifted ~6% over target while cash has drifted under. A small rebalance trade restores the intended allocation.`,
    impact: `Locks in gains and reduces concentration risk.`,
    cost: 650,
  },
];

// ---------- Public entry point ----------

export const buildAdviceDocument = ({
  docType = "soa",
  client,
  adviser = {
    name: "James Mitchell",
    licenseNumber: "AFSL 384359",
    arNumber: "AR 000000",
    dealerGroup: "Halcyon Wealth Pty Ltd",
    phone: "(03) 9000 0000",
    email: "james.mitchell@halcyonwealth.com.au",
    address: "Level 40, 101 Collins Street, Melbourne VIC 3000",
  },
  recommendations,
  meetingDate,
  priorSoaDate,
  fees = { advice: 4950, implementation: 2500, ongoing: 4400 },
}) => {
  if (!client) throw new Error("buildAdviceDocument: client required");

  // Normalise heterogeneous client shapes so downstream sections don't crash.
  const cId = client.client_id || client.profile?.user_id || client.id || "client";
  const cName = client.name || client.profile?.name || "Client";
  const totalAssets = (client.assets || []).reduce((s, a) => s + (a.value || 0), 0);
  const totalLiab = (client.liabilities || []).reduce((s, l) => s + (l.value || l.balance || 0), 0);
  const cNetWorth = client.netWorth ?? (totalAssets - totalLiab);

  const cView = {
    ...client,
    client_id: cId,
    name: cName,
    netWorth: cNetWorth,
    profile: {
      ...(client.profile || {}),
      age: client.profile?.age ?? client.retirement?.current_age ?? 50,
      marital_status: client.profile?.marital_status || client.profile?.status,
      dependents: client.profile?.dependents ?? client.profile?.children,
      occupation: client.profile?.occupation,
      riskProfile: client.profile?.riskProfile || "Balanced",
      incomeHousehold: client.profile?.incomeHousehold || 0,
      expensesAnnual: client.profile?.expensesAnnual || 0,
      advice_areas: client.profile?.advice_areas,
    },
  };

  // Deterministic per-client seed so every screen shows the same number.
  const seed = stableSeed(cId);
  const liquid = (cView.assets || [])
    .filter((a) => /super|share|managed|cash|trust portfolio/i.test(a.type))
    .reduce((s, a) => s + (a.value || 0), 0);
  const scenario = projectRetirement({
    currentPortfolio: liquid,
    annualContributions: cView.retirement.annual_contributions,
    annualSpending: cView.retirement.retirement_spending,
    yearsToRetirement: Math.max(1, cView.retirement.retirement_age - cView.profile.age),
    yearsInRetirement: Math.max(1, (cView.retirement.life_expectancy || 92) - cView.retirement.retirement_age),
    seed,
  });
  const readiness = computeReadiness(cView);

  const mDate = meetingDate || formatToday();
  const ref = docRef(docType.toUpperCase(), cId);

  let sections;
  if (docType === "roa") {
    const recs = recommendations || defaultRoaRecs(cView);
    sections = [
      roaLetterhead(cView, adviser, ref),
      roaAbout(cView, mDate, priorSoaDate),
      roaReasons(),
      roaChanges(recs),
      roaWhyAppropriate(recs),
      roaThingsYouNeedToKnow(),
      roaFees(fees),
      roaAuthority(cView, adviser),
    ];
  } else {
    const recs = recommendations || defaultSoaRecs(cView, scenario);
    sections = [
      soaLetterhead(cView, adviser, ref),
      soaAbout(cView, mDate),
      soaReasons(cView),
      soaTaxLawCallout(cView),
      soaScopeOut(),
      soaOverviewOfAdvice(recs),
      soaCurrentSituation(cView),
      soaMyAdvice(cView, scenario, recs),
      soaThingsYouNeedToKnow(),
      soaFeesTable(cView, fees),
      soaNextSteps(),
      soaAuthority(cView, adviser),
    ];
  }

  return {
    docType,
    documentRef: ref,
    client: { id: cId, name: cName, email: cView.profile.email },
    adviser,
    asAt: formatToday(),
    sections,
    scenario,
    readiness,
  };
};
