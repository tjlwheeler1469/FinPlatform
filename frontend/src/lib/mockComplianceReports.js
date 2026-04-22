// Compliance reports — produces PDF artefacts for the Adviser Compliance Dashboard.
// HYDRATED FROM LIVE MONGO via /api/compliance-reports/data when available,
// with deterministic synthetic fallback so the demo never shows a blank document.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = process.env.REACT_APP_BACKEND_URL;
const FIRM_NAME = "Wealth Command Centre";
const FIRM_TAGLINE = "AFSL-licensed financial services";

// ── Synthetic fallback (used only if backend empty / unreachable) ──
const FALLBACK_ADVISERS = [
  ["Priya Nair",    "ADV-001", "38", "1",  "94", "Exemplary"],
  ["James O'Brien",  "ADV-002", "41", "3",  "88", "On Track"],
  ["Sarah Kumar",   "ADV-003", "29", "5",  "82", "On Track"],
  ["Michael Zhou",  "ADV-004", "33", "8",  "76", "Watch"],
  ["Aisha Patel",   "ADV-005", "24", "12", "68", "Review"],
];
const FALLBACK_CLIENT_RISK = [
  ["CLT-2188", "Thompson Family",   "Balanced",    "Matches SoA",              "✔"],
  ["CLT-2192", "Chen Family",       "Growth",      "Matches SoA",              "✔"],
  ["CLT-2203", "Williams, D",       "Conservative","Slight over-equity drift", "⚠"],
  ["CLT-2214", "Johansson, K",      "Growth",      "Matches SoA",              "✔"],
  ["CLT-2225", "Singh, R",          "Aggressive",  "Exceeds risk tolerance",   "✖"],
  ["CLT-2231", "Nguyen, L",         "Balanced",    "Matches SoA",              "✔"],
];
const FALLBACK_ISSUES = [
  ["ISS-0412", "High",   "02 Apr 2026", "ADV-004", "SoA missing product replacement comparison (s947D)",             "Open"],
  ["ISS-0418", "Medium", "08 Apr 2026", "ADV-005", "Fee disclosure inconsistent with ongoing service agreement",      "Remediating"],
  ["ISS-0421", "High",   "11 Apr 2026", "ADV-005", "Client risk profile misaligned with recommended growth portfolio","Open"],
  ["ISS-0426", "Low",    "15 Apr 2026", "ADV-003", "File note missing rationale for product selection",               "Resolved"],
  ["ISS-0430", "Medium", "19 Apr 2026", "ADV-004", "TMD alignment check outstanding",                                  "Open"],
];
const FALLBACK_AUDIT = [
  ["22 Apr 2026 09:14", "adviser_001", "Approve",    "Advice draft adv_f6d39c4ebb"],
  ["22 Apr 2026 09:02", "adviser_001", "Regenerate", "Advice draft adv_f6d39c4ebb (v2)"],
  ["22 Apr 2026 08:58", "adviser_001", "Generate",   "Advice draft adv_f6d39c4ebb"],
  ["21 Apr 2026 16:42", "adviser_002", "Notify",     "Client CLT-2214"],
  ["21 Apr 2026 14:11", "adviser_003", "Simulate",   "Client CLT-2225"],
  ["20 Apr 2026 11:06", "adviser_001", "Apply",      "Ticket tkt_8a90ff0a11"],
  ["19 Apr 2026 10:34", "compliance_officer", "Review", "Adviser ADV-004 file ISS-0412"],
];
const FALLBACK_MONTHLY = {
  period_label: "Mar–Apr 2026",
  metrics: [
    ["Advice files reviewed",   "165",      "142",     "+16%"],
    ["Files compliant",         "152 (92%)","127 (89%)","+3 pts"],
    ["Critical breaches",       "0",        "1",       "-1"],
    ["Open issues at period end","12",      "18",      "-33%"],
  ],
};
const FALLBACK_RISK_BUCKETS = [
  ["Conservative", "34", "21%", "97%"],
  ["Balanced",     "52", "32%", "94%"],
  ["Growth",       "58", "36%", "90%"],
  ["Aggressive",   "18", "11%", "82%"],
];
const FALLBACK_ASIC = [
  ["Client best interests duty", "Corps Act s961B", "Compliant", "File reviews x165, 100% sampled"],
  ["Appropriate advice",          "Corps Act s961G", "Compliant", "All SoAs retain rationale section"],
  ["Conflicts of interest",       "RG 181",          "Compliant", "Quarterly disclosure attestation filed"],
  ["Fee-for-service disclosure",  "s962-962V",       "Remediating", "3 files flagged; refreshed by 15 May"],
  ["Design & Distribution (TMD)", "RG 274",          "Compliant", "TMD alignment audit last completed 12 Apr 2026"],
  ["Breach reporting (30-day)",   "s912DAA",         "Compliant", "No reportable situations in period"],
  ["Internal Dispute Resolution", "RG 271",          "Compliant", "IDR register reviewed fortnightly"],
  ["Record-keeping",              "RG 104 / s912G",  "Compliant", "7-year retention policy enforced"],
];

// ── Single cached fetch — one round-trip per PDF generation batch ──
let _cachedData = null;
let _cachedAt = 0;
const CACHE_MS = 30_000;

const hydrate = async () => {
  const now = Date.now();
  if (_cachedData && now - _cachedAt < CACHE_MS) return _cachedData;
  if (!API) {
    _cachedData = { fallback: true };
    return _cachedData;
  }
  try {
    const res = await fetch(`${API}/api/compliance-reports/data`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    _cachedData = data;
    _cachedAt = now;
    return data;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("compliance-reports/data fetch failed, using synthetic fallback", e);
    _cachedData = { fallback: true };
    return _cachedData;
  }
};

// ── PDF helpers ──
const drawHeader = (doc, title, subtitle, dataSource) => {
  doc.setFillColor(26, 39, 68);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text(FIRM_NAME, 14, 13);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(FIRM_TAGLINE, 14, 20);
  doc.setDrawColor(212, 168, 76);
  doc.setLineWidth(1);
  doc.line(0, 28, doc.internal.pageSize.getWidth(), 28);
  doc.setTextColor(26, 39, 68);
  doc.setFontSize(17); doc.setFont("helvetica", "bold");
  doc.text(title, 14, 42);
  if (subtitle) {
    doc.setFontSize(9.5); doc.setFont("helvetica", "normal");
    doc.setTextColor(110);
    doc.text(subtitle, 14, 49);
  }
  // Source badge top-right
  const badge = dataSource === "mongodb-live" ? "LIVE DATA" : "SYNTHETIC";
  const badgeColor = dataSource === "mongodb-live" ? [16, 185, 129] : [148, 163, 184];
  doc.setFillColor(...badgeColor);
  const pageW = doc.internal.pageSize.getWidth();
  doc.roundedRect(pageW - 44, 8, 32, 8, 2, 2, "F");
  doc.setTextColor(255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
  doc.text(badge, pageW - 28, 13.5, { align: "center" });
  doc.setFont("helvetica", "normal");
};

const drawFooter = (doc) => {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5); doc.setTextColor(150);
    doc.text(
      `${FIRM_NAME} · Compliance Office · Generated ${new Date().toLocaleString("en-AU")}   Page ${i}/${pages}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
  }
};

const saveAs = (doc, filename) => { drawFooter(doc); doc.save(filename); };
const today = () => new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });
const fileTag = (title) => `${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0,10)}.pdf`;
const src = (d) => (d && !d.fallback && d.data_source) || "synthetic";

// ==================== REPORTS ====================

export const generateMonthlyComplianceSummary = async () => {
  const data = await hydrate();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const period = data?.monthly_summary?.period_label || FALLBACK_MONTHLY.period_label;
  drawHeader(doc, "Monthly Compliance Summary", `Period · ${period} · issued ${today()}`, src(data));
  let y = 58;
  doc.setTextColor(26, 39, 68); doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text("Key metrics", 14, y); y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Current period", "Previous period", "Trend"]],
    body: (data?.monthly_summary?.metrics) || FALLBACK_MONTHLY.metrics,
    theme: "grid",
    headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(26, 39, 68);
  doc.text("Notes", 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(60);
  [
    data?.counts ? `Platform activity: ${data.counts.readiness_events} readiness computes, ${data.counts.drafts_approved} drafts approved, ${data.counts.execution_tickets} execution tickets.` : "Data-source fallback active; live MongoDB counts unavailable.",
    "All drafts retain versioned history and adviser attestation in the compliance log.",
    "Remediation windows, IDR register, and ASIC attestations are tracked separately in the ASIC Alignment Report.",
  ].forEach((line) => { doc.text(line, 14, y, { maxWidth: 182 }); y += 8; });
  saveAs(doc, fileTag("MonthlyComplianceSummary"));
};

export const generateAdviserPerformanceReport = async () => {
  const data = await hydrate();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawHeader(doc, "Adviser Performance Report", `Compliance scorecard · issued ${today()}`, src(data));
  const rows = (data?.adviser_rows?.length ? data.adviser_rows : FALLBACK_ADVISERS);
  autoTable(doc, {
    startY: 58,
    head: [["Adviser", "ID", "Unique clients", "Drafts approved", "Score /100", "Status"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 4: { halign: "right" } },
    margin: { left: 14, right: 14 },
  });
  let y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(26, 39, 68);
  doc.text("Scoring methodology", 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60);
  [
    "Composite 0-100 score · 40% activity volume · 30% client-book breadth · 20% draft approvals · 10% remediation speed.",
    "Advisers scoring <80 are scheduled for monthly peer-review sessions.",
    "Top-quartile advisers are offered co-authoring opportunities on complex cases.",
  ].forEach((l) => { doc.text(l, 14, y, { maxWidth: 182 }); y += 6; });
  saveAs(doc, fileTag("AdviserPerformanceReport"));
};

export const generateIssueResolutionTracker = async () => {
  const data = await hydrate();
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  drawHeader(doc, "Issue Resolution Tracker", `Open & recently-resolved compliance issues · ${today()}`, src(data));
  const rows = (data?.issues?.length ? data.issues : FALLBACK_ISSUES);
  autoTable(doc, {
    startY: 58,
    head: [["Issue ID", "Severity", "Opened", "Adviser", "Summary", "Status"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, overflow: "linebreak" },
    columnStyles: { 4: { cellWidth: 120 } },
    margin: { left: 14, right: 14 },
  });
  saveAs(doc, fileTag("IssueResolutionTracker"));
};

export const generateASICAlignmentReport = async () => {
  const data = await hydrate();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawHeader(doc, "ASIC Alignment Report", `Regulatory compliance checklist · ${today()}`, src(data));
  autoTable(doc, {
    startY: 58,
    head: [["Obligation", "Reference", "Status", "Evidence"]],
    body: (data?.asic_rows?.length ? data.asic_rows : FALLBACK_ASIC),
    theme: "grid",
    headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 28 }, 2: { cellWidth: 28 }, 3: { cellWidth: "auto" } },
    margin: { left: 14, right: 14 },
  });
  let y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(26, 39, 68);
  doc.text("Attestation", 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60);
  doc.text(
    "I attest that the above represents the AFSL's current compliance position to the best of my knowledge as at the date of this report. Supporting evidence is retained in the compliance registry.",
    14, y, { maxWidth: 182 }
  );
  y += 14;
  doc.text("__________________________", 14, y);
  doc.text("Head of Compliance · " + today(), 14, y + 6);
  saveAs(doc, fileTag("ASICAlignmentReport"));
};

export const generateRiskAssessmentReport = async () => {
  const data = await hydrate();
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  drawHeader(doc, "Risk Assessment Report", `Client risk-profile alignment · ${today()}`, src(data));
  autoTable(doc, {
    startY: 58,
    head: [["Client ID", "Name", "Classification", "Portfolio alignment", "Flag"]],
    body: (data?.client_risk_rows?.length ? data.client_risk_rows : FALLBACK_CLIENT_RISK),
    theme: "grid",
    headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  let y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(26, 39, 68);
  doc.text("Distribution by readiness bucket", 14, y); y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Bucket", "Clients", "% of book", "Avg portfolio alignment"]],
    body: (data?.risk_buckets?.length ? data.risk_buckets : FALLBACK_RISK_BUCKETS),
    theme: "striped",
    headStyles: { fillColor: [212, 168, 76], textColor: [26, 39, 68], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  saveAs(doc, fileTag("RiskAssessmentReport"));
};

export const generateAuditTrailReport = async () => {
  const data = await hydrate();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawHeader(doc, "Audit Trail Report", `Document & advice events · ${today()}`, src(data));
  autoTable(doc, {
    startY: 58,
    head: [["Timestamp", "Actor", "Action", "Target"]],
    body: (data?.audit_rows?.length ? data.audit_rows : FALLBACK_AUDIT),
    theme: "grid",
    headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    margin: { left: 14, right: 14 },
  });
  let y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(26, 39, 68);
  doc.text("Integrity statement", 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60);
  doc.text(
    "This audit trail is sourced from the immutable compliance log (Mongo collections `adviser_actions`, `advice_drafts`, `execution_tickets`). Entries are append-only; amendments are recorded as new rows.",
    14, y, { maxWidth: 182 }
  );
  saveAs(doc, fileTag("AuditTrailReport"));
};

// Registry for the dashboard button → handler mapping
export const REPORT_GENERATORS = {
  "Monthly Compliance Summary": generateMonthlyComplianceSummary,
  "Adviser Performance Report": generateAdviserPerformanceReport,
  "Issue Resolution Tracker":    generateIssueResolutionTracker,
  "ASIC Alignment Report":       generateASICAlignmentReport,
  "Risk Assessment Report":      generateRiskAssessmentReport,
  "Audit Trail Report":          generateAuditTrailReport,
};
