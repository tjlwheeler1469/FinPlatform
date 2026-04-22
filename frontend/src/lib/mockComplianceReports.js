// Mock compliance reports — produces realistic PDF artefacts for the Adviser Compliance Dashboard.
// Uses jsPDF + jspdf-autotable (already in package.json). All data is synthetic but plausible,
// so advisers/reviewers can see what the real artefacts will look like.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const FIRM_NAME = "Wealth Command Centre";
const FIRM_TAGLINE = "AFSL-licensed financial services";

// ── Synthetic deterministic mock data so the same click produces the same PDF ──
const ADVISERS = [
  { id: "ADV-001", name: "Priya Nair",     score: 94, files: 38, issues: 1,  status: "Exemplary" },
  { id: "ADV-002", name: "James O'Brien",   score: 88, files: 41, issues: 3,  status: "On Track" },
  { id: "ADV-003", name: "Sarah Kumar",    score: 82, files: 29, issues: 5,  status: "On Track" },
  { id: "ADV-004", name: "Michael Zhou",   score: 76, files: 33, issues: 8,  status: "Watch"    },
  { id: "ADV-005", name: "Aisha Patel",    score: 68, files: 24, issues: 12, status: "Review"   },
];

const CLIENT_SAMPLES = [
  ["CLT-2188", "Thompson Family",   "Balanced",    "Matches SoA",             "✔"],
  ["CLT-2192", "Chen Family",       "Growth",      "Matches SoA",             "✔"],
  ["CLT-2203", "Williams, D",       "Conservative","Slight over-equity drift","⚠"],
  ["CLT-2214", "Johansson, K",      "Growth",      "Matches SoA",             "✔"],
  ["CLT-2225", "Singh, R",          "Aggressive",  "Exceeds risk tolerance",  "✖"],
  ["CLT-2231", "Nguyen, L",         "Balanced",    "Matches SoA",             "✔"],
];

const ISSUE_SAMPLES = [
  { id: "ISS-0412", severity: "High",   opened: "02 Apr 2026", adviser: "ADV-004", summary: "SoA missing product replacement comparison (s947D)",            status: "Open" },
  { id: "ISS-0418", severity: "Medium", opened: "08 Apr 2026", adviser: "ADV-005", summary: "Fee disclosure inconsistent with ongoing service agreement",      status: "Remediating" },
  { id: "ISS-0421", severity: "High",   opened: "11 Apr 2026", adviser: "ADV-005", summary: "Client risk profile misaligned with recommended growth portfolio", status: "Open" },
  { id: "ISS-0426", severity: "Low",    opened: "15 Apr 2026", adviser: "ADV-003", summary: "File note missing rationale for product selection",               status: "Resolved" },
  { id: "ISS-0430", severity: "Medium", opened: "19 Apr 2026", adviser: "ADV-004", summary: "TMD alignment check outstanding",                                  status: "Open" },
];

const AUDIT_TRAIL = [
  { ts: "22 Apr 2026 09:14", actor: "adviser_001", action: "Approve",   target: "Advice draft adv_f6d39c4ebb" },
  { ts: "22 Apr 2026 09:02", actor: "adviser_001", action: "Regenerate", target: "Advice draft adv_f6d39c4ebb (v2)" },
  { ts: "22 Apr 2026 08:58", actor: "adviser_001", action: "Generate",   target: "Advice draft adv_f6d39c4ebb" },
  { ts: "21 Apr 2026 16:42", actor: "adviser_002", action: "Notify",     target: "Client CLT-2214" },
  { ts: "21 Apr 2026 14:11", actor: "adviser_003", action: "Simulate",   target: "Client CLT-2225" },
  { ts: "20 Apr 2026 11:06", actor: "adviser_001", action: "Apply",      target: "Ticket tkt_8a90ff0a11" },
  { ts: "19 Apr 2026 10:34", actor: "compliance_officer", action: "Review",   target: "Adviser ADV-004 file ISS-0412" },
];

// ── Helpers ──
const drawHeader = (doc, title, subtitle) => {
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
    doc.setTextColor(110, 110, 110);
    doc.text(subtitle, 14, 49);
  }
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

const saveAs = (doc, filename) => {
  drawFooter(doc);
  doc.save(filename);
};

const today = () => new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });
const fileTag = (title) => `${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0,10)}.pdf`;

// ==================== REPORTS ====================

export const generateMonthlyComplianceSummary = () => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawHeader(doc, "Monthly Compliance Summary", `Period · March–April 2026 · issued ${today()}`);
  let y = 58;

  doc.setTextColor(26, 39, 68); doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text("Executive summary", 14, y); y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Current period", "Previous period", "Trend"]],
    body: [
      ["Advice files reviewed", "165", "142", "+16%"],
      ["Files compliant", "152 (92%)", "127 (89%)", "+3 pts"],
      ["Critical breaches", "0", "1", "-1"],
      ["Open issues at period end", "12", "18", "-33%"],
      ["Average remediation time", "6.2 days", "8.7 days", "-29%"],
      ["Adviser training completed", "96%", "88%", "+8 pts"],
    ],
    theme: "grid",
    headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(26, 39, 68);
  doc.text("Issue breakdown by severity", 14, y); y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Severity", "Opened this period", "Resolved", "Open at period end"]],
    body: [
      ["Critical", "0", "1", "0"],
      ["High",     "4", "3", "3"],
      ["Medium",   "9", "7", "5"],
      ["Low",      "6", "5", "4"],
    ],
    theme: "striped",
    headStyles: { fillColor: [212, 168, 76], textColor: [26, 39, 68], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(26, 39, 68);
  doc.text("Recommendations", 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(60);
  [
    "1. Continue focus on Adviser 004 and 005 — quarterly coaching plan in place.",
    "2. Close the 3 remaining High-severity issues before 15 May 2026.",
    "3. Roll out refreshed SoA template to reduce file-note omissions.",
    "4. Schedule spot audits on Aggressive-portfolio clients above $1M TSB.",
  ].forEach((line) => { doc.text(line, 14, y, { maxWidth: 182 }); y += 6; });

  saveAs(doc, fileTag("MonthlyComplianceSummary"));
};

export const generateAdviserPerformanceReport = () => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawHeader(doc, "Adviser Performance Report", `Compliance scorecard · issued ${today()}`);

  autoTable(doc, {
    startY: 58,
    head: [["Adviser", "ID", "Files", "Issues", "Score /100", "Status"]],
    body: ADVISERS.map((a) => [a.name, a.id, a.files, a.issues, a.score, a.status]),
    theme: "grid",
    headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 4: { halign: "right" } },
    margin: { left: 14, right: 14 },
  });

  let y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(26, 39, 68);
  doc.text("Notes", 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60);
  [
    "Scoring methodology: 40% file review compliance · 25% TMD/SoA accuracy · 20% remediation speed · 15% CPD completion.",
    "Advisers scoring below 80 are scheduled for monthly peer-review sessions.",
    "Top-quartile advisers are offered co-authoring opportunities on complex cases.",
  ].forEach((line) => { doc.text(line, 14, y, { maxWidth: 182 }); y += 6; });

  saveAs(doc, fileTag("AdviserPerformanceReport"));
};

export const generateIssueResolutionTracker = () => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  drawHeader(doc, "Issue Resolution Tracker", `Open & recently-resolved compliance issues · ${today()}`);

  autoTable(doc, {
    startY: 58,
    head: [["Issue ID", "Severity", "Opened", "Adviser", "Summary", "Status"]],
    body: ISSUE_SAMPLES.map((i) => [i.id, i.severity, i.opened, i.adviser, i.summary, i.status]),
    theme: "striped",
    headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, overflow: "linebreak" },
    columnStyles: { 4: { cellWidth: 120 } },
    margin: { left: 14, right: 14 },
  });

  saveAs(doc, fileTag("IssueResolutionTracker"));
};

export const generateASICAlignmentReport = () => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawHeader(doc, "ASIC Alignment Report", `Regulatory compliance checklist · ${today()}`);

  autoTable(doc, {
    startY: 58,
    head: [["Obligation", "Reference", "Status", "Evidence"]],
    body: [
      ["Client best interests duty", "Corps Act s961B", "Compliant", "File reviews x165, 100% sampled"],
      ["Appropriate advice",          "Corps Act s961G", "Compliant", "All SoAs retain rationale section"],
      ["Conflicts of interest",       "RG 181",          "Compliant", "Quarterly disclosure attestation filed"],
      ["Fee-for-service disclosure",  "s962-962V",       "Remediating", "3 files flagged; ongoing service agreements refreshed by 15 May"],
      ["Design & Distribution (TMD)", "RG 274",          "Compliant", "TMD alignment audit last completed 12 Apr 2026"],
      ["Breach reporting (30-day)",   "s912DAA",         "Compliant", "No reportable situations in period"],
      ["Internal Dispute Resolution", "RG 271",          "Compliant", "IDR register reviewed fortnightly"],
      ["Record-keeping",              "RG 104 / s912G",  "Compliant", "7-year retention policy enforced"],
    ],
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

export const generateRiskAssessmentReport = () => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  drawHeader(doc, "Risk Assessment Report", `Client risk-profile alignment · ${today()}`);

  autoTable(doc, {
    startY: 58,
    head: [["Client ID", "Name", "Profile", "Portfolio alignment", "Flag"]],
    body: CLIENT_SAMPLES,
    theme: "grid",
    headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  let y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(26, 39, 68);
  doc.text("Distribution", 14, y); y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Risk bucket", "Clients", "% of book", "Avg portfolio alignment"]],
    body: [
      ["Conservative", "34", "21%", "97%"],
      ["Balanced",     "52", "32%", "94%"],
      ["Growth",       "58", "36%", "90%"],
      ["Aggressive",   "18", "11%", "82%"],
    ],
    theme: "striped",
    headStyles: { fillColor: [212, 168, 76], textColor: [26, 39, 68], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  saveAs(doc, fileTag("RiskAssessmentReport"));
};

export const generateAuditTrailReport = () => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawHeader(doc, "Audit Trail Report", `Document & advice events · last 7 days · ${today()}`);

  autoTable(doc, {
    startY: 58,
    head: [["Timestamp", "Actor", "Action", "Target"]],
    body: AUDIT_TRAIL.map((r) => [r.ts, r.actor, r.action, r.target]),
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
