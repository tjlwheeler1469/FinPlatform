// Universal PDF generator for Review Pack & Invoices.
// jsPDF + jspdf-autotable are already in package.json.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CLIENT_DATA, computeClientTotals, FIRM } from "@/data/clientData";

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const drawHeader = (doc, title, subtitle) => {
  // Navy band
  doc.setFillColor(26, 39, 68);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(FIRM.name, 14, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(FIRM.tagline, 14, 20);
  // Gold accent line
  doc.setDrawColor(212, 168, 76);
  doc.setLineWidth(1);
  doc.line(0, 28, doc.internal.pageSize.getWidth(), 28);
  // Title
  doc.setTextColor(26, 39, 68);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 42);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 49);
  }
};

const drawFooter = (doc) => {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `${FIRM.name} · ${FIRM.email} · ${FIRM.phone}   Page ${i} of ${pages}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
  }
};

// -------- Review Pack --------
export const generateReviewPackPDF = ({ clientId, confidence, changes = [], opportunities = [], alerts = [] }) => {
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const totals = computeClientTotals(clientId);
  const today = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  const doc = new jsPDF();
  drawHeader(doc, "Annual Review Pack", `${client.profile.name} · ${today}`);

  let y = 58;

  // Summary card
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 36, "F");
  doc.setTextColor(26, 39, 68);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Household Summary", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Net Worth: ${fmt(totals.netWorth)}`, 18, y + 15);
  doc.text(`Gross Assets: ${fmt(totals.grossAssets)}`, 18, y + 21);
  doc.text(`Liabilities: ${fmt(totals.totalLiabilities)}`, 18, y + 27);
  doc.text(`Age: ${client.profile.age}   Retirement: ${client.profile.retirementAge}   Risk: ${client.profile.riskProfile}`, 18, y + 33);
  // Confidence badge
  doc.setFillColor(confidence >= 85 ? 16 : confidence >= 70 ? 245 : 244,
                   confidence >= 85 ? 185 : confidence >= 70 ? 158 : 63,
                   confidence >= 85 ? 129 : confidence >= 70 ? 11 : 94);
  doc.rect(150, y + 6, 42, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${confidence}%`, 171, y + 18, { align: "center" });
  doc.setFontSize(7);
  doc.text("CONFIDENCE", 171, y + 25, { align: "center" });

  y += 44;

  // What Changed
  if (changes.length) {
    doc.setTextColor(26, 39, 68);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("What Changed Since Last Review", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Previous", "Current", "Δ Change"]],
      body: changes.map((c) => [c.label, c.previous || "-", c.current || "-", `${c.delta >= 0 ? "+" : ""}${c.delta}${c.suffix || "%"}`]),
      headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      theme: "striped",
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Key Risks / Alerts
  if (alerts.length) {
    doc.setTextColor(26, 39, 68);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Key Risks & Alerts", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Level", "Alert", "Detail"]],
      body: alerts.map((a) => [a.level?.toUpperCase() || "-", a.title, a.detail]),
      headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      theme: "striped",
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Recommendations / Opportunities
  if (opportunities.length) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setTextColor(26, 39, 68);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Recommendations & Opportunities", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Recommendation", "Rationale", "Estimated Impact"]],
      body: opportunities.map((o) => [o.title, o.detail, fmt(o.impact)]),
      headStyles: { fillColor: [212, 168, 76], textColor: [26, 39, 68], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      theme: "striped",
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Closing note
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120);
  const disclaimer = "This Review Pack is general information only and does not constitute personal financial advice. Please consult your adviser before making investment decisions.";
  doc.text(disclaimer, 14, y, { maxWidth: 182 });

  drawFooter(doc);
  doc.save(`ReviewPack_${client.profile.last_name || clientId}_${Date.now()}.pdf`);
};

// -------- Invoice PDF --------
export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF();
  drawHeader(doc, `Invoice ${invoice.invoice_number || invoice.id || ""}`, `Issued ${invoice.issue_date || new Date().toLocaleDateString("en-AU")}`);

  let y = 58;

  // Bill to
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 39, 68);
  doc.text("Bill To", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.text(invoice.client_name || "Client", 14, y + 6);
  if (invoice.client_email) doc.text(invoice.client_email, 14, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 39, 68);
  doc.text("Due Date", 140, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.text(invoice.due_date || "On receipt", 140, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 39, 68);
  doc.text("Status", 140, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(invoice.status === "paid" ? 16 : 60,
                   invoice.status === "paid" ? 185 : 60,
                   invoice.status === "paid" ? 129 : 60);
  doc.text((invoice.status || "draft").toUpperCase(), 140, y + 20);

  y += 32;

  const lineItems = invoice.line_items || [
    { description: invoice.service || "Advisory Services", amount: invoice.subtotal || invoice.amount || 0 },
  ];
  autoTable(doc, {
    startY: y,
    head: [["Description", "Amount"]],
    body: lineItems.map((li) => [li.description, fmt(li.amount)]),
    headStyles: { fillColor: [26, 39, 68], textColor: 255 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
    theme: "grid",
  });
  y = doc.lastAutoTable.finalY + 6;

  const subtotal = invoice.subtotal ?? lineItems.reduce((s, li) => s + (li.amount || 0), 0);
  const gst = invoice.gst ?? subtotal * 0.1;
  const total = invoice.total ?? subtotal + gst;

  // Totals table (right-aligned)
  autoTable(doc, {
    startY: y,
    body: [
      ["Subtotal", fmt(subtotal)],
      ["GST (10%)", fmt(gst)],
      [{ content: "Total (AUD)", styles: { fontStyle: "bold", fillColor: [248, 250, 252] } },
       { content: fmt(total), styles: { fontStyle: "bold", fillColor: [248, 250, 252] } }],
    ],
    columnStyles: { 0: { cellWidth: 140, halign: "right" }, 1: { cellWidth: 42, halign: "right" } },
    margin: { left: 14, right: 14 },
    theme: "plain",
    bodyStyles: { fontSize: 10 },
  });

  // Payment note
  y = doc.lastAutoTable.finalY + 14;
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont("helvetica", "italic");
  doc.text("Please remit payment within 14 days. Thank you for your business.", 14, y);

  drawFooter(doc);
  doc.save(`Invoice_${invoice.invoice_number || invoice.id || Date.now()}.pdf`);
};
