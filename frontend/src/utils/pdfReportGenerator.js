/**
 * PDF Report Generation Utilities
 * Generates professional PDF reports for:
 * - Portfolio Summary (single page overview)
 * - Statement of Advice (full SOA document)
 * - Tax Summary Report
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Wheeler Financial branding colors
const COLORS = {
  primary: [15, 57, 43],      // #0F392B
  gold: [212, 175, 55],       // #D4AF37
  text: [51, 51, 51],         // #333333
  muted: [107, 114, 128],     // #6B7280
  success: [16, 185, 129],    // #10B981
  danger: [239, 68, 68],      // #EF4444
  white: [255, 255, 255]
};

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0
  }).format(value);
};

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Add header to PDF
const addHeader = (doc, title, subtitle = null) => {
  // Green header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 35, 'F');
  
  // Logo placeholder (gold accent)
  doc.setFillColor(...COLORS.gold);
  doc.circle(20, 17.5, 8, 'F');
  
  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 35, 15);
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 35, 23);
  }
  
  // Wheeler Financial branding
  doc.setFontSize(8);
  doc.text('Wheeler Financial', 170, 12);
  doc.text('AFSL Compliant', 170, 17);
  
  // Reset text color
  doc.setTextColor(...COLORS.text);
  
  return 45; // Return Y position after header
};

// Add footer to PDF
const addFooter = (doc, pageNum, totalPages) => {
  const pageHeight = doc.internal.pageSize.height;
  
  // Footer line
  doc.setDrawColor(...COLORS.muted);
  doc.line(20, pageHeight - 20, 190, pageHeight - 20);
  
  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Generated on ${formatDate(new Date())}`, 20, pageHeight - 12);
  doc.text('Wheeler Financial - Australian Investment & Tax Planning', 20, pageHeight - 7);
  doc.text(`Page ${pageNum} of ${totalPages}`, 180, pageHeight - 12);
  doc.text('Confidential', 180, pageHeight - 7);
};

// Add section title
const addSectionTitle = (doc, title, y) => {
  doc.setFillColor(...COLORS.primary);
  doc.rect(20, y, 170, 8, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 25, y + 5.5);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'normal');
  return y + 15;
};

/**
 * Generate Portfolio Summary PDF
 */
export const generatePortfolioSummaryPDF = (data) => {
  const doc = new jsPDF();
  const {
    clientName = 'Wheeler Family',
    netWorth = 1978000,
    totalAssets = 2920000,
    totalDebt = 942000,
    shares = [],
    properties = [],
    riskProfile = 'Balanced',
    lastReview = new Date(),
    adviser = { name: 'David Chen' }
  } = data;

  // Header
  let y = addHeader(doc, 'Portfolio Summary', `Prepared for ${clientName}`);

  // Key Metrics
  y = addSectionTitle(doc, 'Financial Overview', y);
  
  doc.setFontSize(10);
  const metrics = [
    ['Net Worth', formatCurrency(netWorth)],
    ['Total Assets', formatCurrency(totalAssets)],
    ['Total Liabilities', formatCurrency(totalDebt)],
    ['Risk Profile', riskProfile],
    ['Last Review', formatDate(lastReview)],
    ['Financial Adviser', adviser.name]
  ];
  
  metrics.forEach((row, i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0] + ':', 25, y + (i * 7));
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 80, y + (i * 7));
  });
  
  y += 50;

  // Asset Allocation
  y = addSectionTitle(doc, 'Asset Allocation', y);
  
  const totalShareValue = shares.reduce((sum, s) => sum + (s.currentPrice * s.quantity), 0);
  const totalPropertyValue = properties.reduce((sum, p) => sum + p.currentValue, 0);
  const cashValue = totalAssets - totalShareValue - totalPropertyValue;
  
  const allocations = [
    ['Asset Class', 'Value', '% of Total'],
    ['Shares', formatCurrency(totalShareValue), ((totalShareValue / totalAssets) * 100).toFixed(1) + '%'],
    ['Property', formatCurrency(totalPropertyValue), ((totalPropertyValue / totalAssets) * 100).toFixed(1) + '%'],
    ['Cash & Other', formatCurrency(cashValue), ((cashValue / totalAssets) * 100).toFixed(1) + '%'],
    ['Total', formatCurrency(totalAssets), '100%']
  ];
  
  doc.autoTable({
    startY: y,
    head: [allocations[0]],
    body: allocations.slice(1),
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary },
    margin: { left: 25, right: 25 },
    styles: { fontSize: 9 }
  });
  
  y = doc.lastAutoTable.finalY + 15;

  // Top Holdings
  if (shares.length > 0) {
    y = addSectionTitle(doc, 'Top Share Holdings', y);
    
    const topShares = shares
      .map(s => ({
        ...s,
        value: s.currentPrice * s.quantity,
        gain: ((s.currentPrice - s.purchasePrice) / s.purchasePrice) * 100
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    const shareRows = topShares.map(s => [
      s.symbol,
      s.name,
      s.quantity.toString(),
      formatCurrency(s.currentPrice),
      formatCurrency(s.value),
      (s.gain >= 0 ? '+' : '') + s.gain.toFixed(1) + '%'
    ]);
    
    doc.autoTable({
      startY: y,
      head: [['Symbol', 'Name', 'Qty', 'Price', 'Value', 'Gain/Loss']],
      body: shareRows,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      margin: { left: 25, right: 25 },
      styles: { fontSize: 8 }
    });
  }

  // Add footer
  addFooter(doc, 1, 1);

  return doc;
};

/**
 * Generate Statement of Advice PDF
 */
export const generateSOAPDF = (data) => {
  const doc = new jsPDF();
  const {
    clientName = 'Wheeler Family',
    adviser = { name: 'David Chen', title: 'Senior Financial Adviser', afsl: '123456' },
    recommendations = [],
    riskProfile = 'Balanced',
    goals = [],
    currentSituation = {},
    fees = {}
  } = data;

  let pageNum = 1;
  let totalPages = 3; // Estimate

  // Page 1 - Cover
  let y = addHeader(doc, 'Statement of Advice', 'Personal Financial Advice');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared for:', 25, y);
  doc.setFontSize(18);
  doc.text(clientName, 25, y + 10);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(new Date())}`, 25, y + 25);
  doc.text(`Prepared by: ${adviser.name}`, 25, y + 32);
  doc.text(`${adviser.title}`, 25, y + 39);
  doc.text(`AFSL: ${adviser.afsl}`, 25, y + 46);
  
  y += 70;
  
  // Important Notice
  doc.setFillColor(255, 243, 205);
  doc.rect(20, y, 170, 30, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Notice', 25, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text('This Statement of Advice (SOA) contains personal financial advice prepared', 25, y + 14);
  doc.text('specifically for you. Before acting on any advice, please read and consider', 25, y + 20);
  doc.text('the appropriateness of this advice having regard to your objectives, financial', 25, y + 26);
  
  addFooter(doc, pageNum, totalPages);
  
  // Page 2 - Your Situation & Goals
  doc.addPage();
  pageNum++;
  y = addHeader(doc, 'Your Current Situation', '');
  
  y = addSectionTitle(doc, 'Financial Position', y);
  
  const situation = [
    ['Total Assets', formatCurrency(currentSituation.totalAssets || 2920000)],
    ['Total Liabilities', formatCurrency(currentSituation.totalDebt || 942000)],
    ['Net Worth', formatCurrency(currentSituation.netWorth || 1978000)],
    ['Annual Income', formatCurrency(currentSituation.income || 250000)],
    ['Risk Profile', riskProfile]
  ];
  
  situation.forEach((row, i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0] + ':', 25, y + (i * 7));
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 100, y + (i * 7));
  });
  
  y += 50;
  
  // Goals
  y = addSectionTitle(doc, 'Your Financial Goals', y);
  
  const defaultGoals = goals.length > 0 ? goals : [
    { name: 'Retirement Fund', target: 2000000, deadline: '2035' },
    { name: "Children's Education", target: 200000, deadline: '2028' },
    { name: 'Pay Off Mortgage', target: 650000, deadline: '2030' }
  ];
  
  const goalRows = defaultGoals.map(g => [g.name, formatCurrency(g.target), g.deadline]);
  
  doc.autoTable({
    startY: y,
    head: [['Goal', 'Target Amount', 'Target Date']],
    body: goalRows,
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary },
    margin: { left: 25, right: 25 },
    styles: { fontSize: 9 }
  });
  
  addFooter(doc, pageNum, totalPages);
  
  // Page 3 - Recommendations
  doc.addPage();
  pageNum++;
  y = addHeader(doc, 'Our Recommendations', '');
  
  y = addSectionTitle(doc, 'Strategic Recommendations', y);
  
  const defaultRecs = recommendations.length > 0 ? recommendations : [
    { title: 'Superannuation Optimization', description: 'Maximize concessional contributions to reduce tax and build retirement savings', priority: 'High' },
    { title: 'Portfolio Rebalancing', description: 'Adjust asset allocation to align with risk profile and goals', priority: 'Medium' },
    { title: 'Debt Reduction Strategy', description: 'Accelerate mortgage repayments using offset account', priority: 'High' },
    { title: 'Insurance Review', description: 'Review life and income protection coverage levels', priority: 'Medium' }
  ];
  
  defaultRecs.forEach((rec, i) => {
    const recY = y + (i * 25);
    
    // Priority badge
    const badgeColor = rec.priority === 'High' ? COLORS.danger : COLORS.gold;
    doc.setFillColor(...badgeColor);
    doc.roundedRect(25, recY - 3, 20, 6, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.white);
    doc.text(rec.priority, 27, recY + 1);
    
    // Title and description
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(rec.title, 50, recY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(rec.description, 50, recY + 7);
  });
  
  y += defaultRecs.length * 25 + 20;
  
  // Fees
  y = addSectionTitle(doc, 'Fees & Charges', y);
  
  const feeRows = [
    ['Initial Advice Fee', formatCurrency(fees.initial || 2500)],
    ['Ongoing Service Fee', formatCurrency(fees.ongoing || 3500) + ' p.a.'],
    ['Implementation Fee', formatCurrency(fees.implementation || 500)]
  ];
  
  doc.autoTable({
    startY: y,
    head: [['Fee Type', 'Amount']],
    body: feeRows,
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary },
    margin: { left: 25, right: 25 },
    styles: { fontSize: 9 }
  });
  
  addFooter(doc, pageNum, totalPages);

  return doc;
};

/**
 * Generate Tax Summary PDF
 */
export const generateTaxSummaryPDF = (data) => {
  const doc = new jsPDF();
  const {
    clientName = 'Wheeler Family',
    financialYear = '2024-25',
    income = {},
    deductions = {},
    cgtEvents = [],
    taxPayable = 0,
    effectiveRate = 0
  } = data;

  // Header
  let y = addHeader(doc, 'Tax Summary Report', `Financial Year ${financialYear}`);

  // Client Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Prepared for: ${clientName}`, 25, y);
  y += 15;

  // Income Summary
  y = addSectionTitle(doc, 'Income Summary', y);
  
  const incomeItems = [
    ['Salary & Wages', formatCurrency(income.salary || 180000)],
    ['Dividend Income', formatCurrency(income.dividends || 12500)],
    ['Rental Income', formatCurrency(income.rental || 45000)],
    ['Interest Income', formatCurrency(income.interest || 2500)],
    ['Capital Gains', formatCurrency(income.capitalGains || 15000)],
    ['Total Assessable Income', formatCurrency(income.total || 255000)]
  ];
  
  doc.autoTable({
    startY: y,
    body: incomeItems,
    theme: 'plain',
    margin: { left: 25, right: 25 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'normal' },
      1: { halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.row.index === incomeItems.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });
  
  y = doc.lastAutoTable.finalY + 15;

  // Deductions Summary
  y = addSectionTitle(doc, 'Deductions', y);
  
  const deductionItems = [
    ['Work-Related Expenses', formatCurrency(deductions.workRelated || 3500)],
    ['Investment Property Expenses', formatCurrency(deductions.property || 28000)],
    ['Investment Interest', formatCurrency(deductions.interest || 5500)],
    ['Professional Subscriptions', formatCurrency(deductions.subscriptions || 800)],
    ['Charitable Donations', formatCurrency(deductions.donations || 2000)],
    ['Total Deductions', formatCurrency(deductions.total || 39800)]
  ];
  
  doc.autoTable({
    startY: y,
    body: deductionItems,
    theme: 'plain',
    margin: { left: 25, right: 25 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'normal' },
      1: { halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.row.index === deductionItems.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });
  
  y = doc.lastAutoTable.finalY + 15;

  // CGT Events
  if (cgtEvents.length > 0) {
    y = addSectionTitle(doc, 'Capital Gains Tax Events', y);
    
    const cgtRows = cgtEvents.slice(0, 5).map(e => [
      e.asset,
      formatDate(e.date),
      formatCurrency(e.proceeds),
      formatCurrency(e.costBase),
      formatCurrency(e.gain),
      e.discount ? 'Yes' : 'No'
    ]);
    
    doc.autoTable({
      startY: y,
      head: [['Asset', 'Date', 'Proceeds', 'Cost Base', 'Gain/Loss', '50% Discount']],
      body: cgtRows,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      margin: { left: 25, right: 25 },
      styles: { fontSize: 8 }
    });
    
    y = doc.lastAutoTable.finalY + 15;
  }

  // Tax Payable Summary
  y = addSectionTitle(doc, 'Tax Summary', y);
  
  const taxSummary = [
    ['Taxable Income', formatCurrency((income.total || 255000) - (deductions.total || 39800))],
    ['Tax on Taxable Income', formatCurrency(taxPayable || 62547)],
    ['Medicare Levy', formatCurrency(Math.round((income.total || 255000) * 0.02))],
    ['PAYG Withheld', formatCurrency(55000)],
    ['Estimated Refund/Payable', formatCurrency((taxPayable || 62547) + Math.round((income.total || 255000) * 0.02) - 55000)]
  ];
  
  doc.autoTable({
    startY: y,
    body: taxSummary,
    theme: 'plain',
    margin: { left: 25, right: 25 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' }
    }
  });
  
  y = doc.lastAutoTable.finalY + 10;
  
  // Effective Rate
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(25, y, 160, 15, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Effective Tax Rate: ${(effectiveRate || 29.1).toFixed(1)}%`, 35, y + 10);

  // Add footer
  addFooter(doc, 1, 1);

  return doc;
};

/**
 * Download PDF
 */
export const downloadPDF = (doc, filename) => {
  doc.save(filename);
};

/**
 * Generate all reports as a combined PDF
 */
export const generateAllReportsPDF = (data) => {
  // This would combine all reports into one PDF
  // For now, return individual generators
  return {
    portfolioSummary: () => generatePortfolioSummaryPDF(data),
    statementOfAdvice: () => generateSOAPDF(data),
    taxSummary: () => generateTaxSummaryPDF(data)
  };
};

export default {
  generatePortfolioSummaryPDF,
  generateSOAPDF,
  generateTaxSummaryPDF,
  downloadPDF,
  generateAllReportsPDF
};
