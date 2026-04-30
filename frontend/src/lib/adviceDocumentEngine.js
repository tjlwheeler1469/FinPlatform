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

import { calculateTax, getMarginalRate } from "@/lib/auTax";
import { projectRetirement } from "@/lib/retirementEngine";
import { computeReadiness } from "@/engine/retirementReadinessEngine";

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
  const concessionalRoom = Math.max(0, 30_000 - 12_000);
  const yearsToRet = Math.max(1, client.retirement.retirement_age - client.profile.age);
  return [
    {
      title: "Maximise concessional super contributions via salary sacrifice",
      amount: concessionalRoom,
      rationale: `You currently have approximately ${formatCurrency(concessionalRoom)} of unused concessional cap each year. Salary-sacrificing this amount into super reduces your marginal-rate tax (currently ${(margRate * 100).toFixed(0)}%) and replaces it with a 15% contributions tax. Over ${yearsToRet} years this represents a material tax saving compounding inside super.`,
      impact: `Estimated annual tax saving of ${formatCurrency(concessionalRoom * (margRate - 0.15))}.`,
      risks: ["Funds locked in super until preservation age (age 60)", "Division 293 if income exceeds $250,000"],
      cost: 0,
    },
    {
      title: `Rebalance to your ${client.profile.riskProfile || "Balanced"} target allocation`,
      rationale: `Your portfolio has drifted from the target allocation agreed at our last review. Rebalancing locks in gains in over-weight sectors and re-deploys to under-weight ones, reducing concentration risk and restoring the risk/return profile you signed up to.`,
      impact: `Projected retirement confidence increase of ~3-5 percentage points and modest lifetime portfolio uplift.`,
      risks: ["Triggers small CGT events on the rebalance trades", "Short-term tracking error against the existing mix"],
      cost: 950,
    },
    {
      title: "Review and right-size your personal insurances",
      rationale: `Adequate Life, TPD and Income Protection cover protects your plan against shock events. Holding some cover inside super (where appropriate) can be cost-effective. I will run a personal insurance needs analysis using the multiples method and compare 3 providers.`,
      impact: `Closes your identified protection gap and preserves the retirement plan against premature loss of income or life.`,
      risks: ["Underwriting may impose loadings or exclusions", "Policy terms differ across providers"],
      cost: 1500,
    },
    {
      title: "Update estate-planning documents",
      rationale: `I recommend you review your Will, Enduring Power of Attorney and Binding Death Benefit Nomination with a qualified estate lawyer. These documents should be refreshed every 3-5 years or after any major life event.`,
      impact: `Reduces the risk of intestacy, family conflict and unintended tax outcomes at death.`,
      risks: ["Requires ongoing review", "Independent legal advice required"],
      cost: 0,
    },
  ];
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
