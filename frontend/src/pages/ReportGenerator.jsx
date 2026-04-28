import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/App";
import { 
  FileText, 
  Download, 
  Printer,
  Calendar,
  DollarSign,
  Building2,
  TrendingUp,
  PieChart,
  Lightbulb,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Scale,
  Percent
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '$0';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Demo scenarios for report generation
const DEMO_SCENARIOS = [
  {
    scenario_id: "demo_001",
    name: "Current Portfolio Analysis",
    entity_type: "personal",
    taxable_income: 185000,
    investments: {
      cash_savings: 28000,
      term_deposit_amount: 35000,
      term_deposit_rate: 4.8,
      shares_value: 84500,
      shares_dividend_yield: 4.2,
      franking_percentage: 85,
      bonds_value: 0,
      bonds_yield: 0,
      etf_value: 42000,
      etf_yield: 3.5,
      smsf_balance: 443000,
      properties: [
        {
          property_id: "prop_001",
          name: "Family Home - Glen Waverley",
          value: 985000,
          rental_income: 0,
          mortgage_amount: 285000,
          mortgage_rate: 6.19,
          mortgage_term_years: 25,
          annual_expenses: 8500,
          depreciation_building: 0,
          depreciation_fixtures: 0
        },
        {
          property_id: "prop_002",
          name: "Investment Unit - Brunswick",
          value: 620000,
          rental_income: 32000,
          mortgage_amount: 380000,
          mortgage_rate: 6.49,
          mortgage_term_years: 28,
          annual_expenses: 7200,
          depreciation_building: 5800,
          depreciation_fixtures: 2800
        }
      ]
    },
    expenses: {
      school_fees: 0,
      childcare: 0,
      health_insurance: 4200,
      private_expenses: 65000,
      work_related: 3500,
      other_deductible: 2200
    },
    simulation_years: 10
  },
  {
    scenario_id: "demo_002",
    name: "Retirement Planning 2043",
    entity_type: "personal",
    taxable_income: 185000,
    investments: {
      cash_savings: 63000,
      term_deposit_amount: 0,
      term_deposit_rate: 4.8,
      shares_value: 84500,
      shares_dividend_yield: 4.2,
      franking_percentage: 85,
      bonds_value: 50000,
      bonds_yield: 5.0,
      etf_value: 42000,
      etf_yield: 3.5,
      smsf_balance: 443000,
      properties: [
        {
          property_id: "prop_001",
          name: "Family Home - Glen Waverley",
          value: 985000,
          rental_income: 0,
          mortgage_amount: 285000,
          mortgage_rate: 6.19,
          mortgage_term_years: 25,
          annual_expenses: 8500,
          depreciation_building: 0,
          depreciation_fixtures: 0
        }
      ]
    },
    expenses: {
      school_fees: 0,
      childcare: 0,
      health_insurance: 4200,
      private_expenses: 55000,
      work_related: 2000,
      other_deductible: 1500
    },
    simulation_years: 17
  },
  {
    scenario_id: "demo_003",
    name: "Thompson Family Trust Analysis",
    entity_type: "company",
    taxable_income: 185000,
    investments: {
      cash_savings: 28000,
      term_deposit_amount: 35000,
      term_deposit_rate: 4.8,
      shares_value: 84500,
      shares_dividend_yield: 4.2,
      franking_percentage: 85,
      bonds_value: 0,
      bonds_yield: 0,
      etf_value: 42000,
      etf_yield: 3.5,
      smsf_balance: 0,
      properties: []
    },
    expenses: {
      school_fees: 0,
      childcare: 0,
      health_insurance: 0,
      private_expenses: 0,
      work_related: 5000,
      other_deductible: 3000
    },
    simulation_years: 10
  }
];

const ReportGenerator = ({ embedded = false }) => {
  const { portfolio } = usePortfolio();
  const [scenarios] = useState(DEMO_SCENARIOS);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async (scenario) => {
    setLoading(true);
    setSelectedScenario(scenario);
    
    // Generate mock report data client-side
    await new Promise(r => setTimeout(r, 800)); // Simulate generation time
    
    const inv = scenario.investments;
    const totalInvested = (inv.cash_savings || 0) + (inv.term_deposit_amount || 0) + (inv.shares_value || 0) + (inv.bonds_value || 0) + (inv.etf_value || 0) + (inv.smsf_balance || 0);
    const propertyTotal = (inv.properties || []).reduce((s, p) => s + p.value, 0);
    const mortgageTotal = (inv.properties || []).reduce((s, p) => s + (p.mortgage_amount || 0), 0);
    const grossAssets = totalInvested + propertyTotal;
    const netWorth = grossAssets - mortgageTotal;
    
    const exp = scenario.expenses || {};
    const totalExpenses = Object.values(exp).reduce((s, v) => s + (v || 0), 0);
    const taxableIncome = scenario.taxable_income || 0;
    const estimatedTax = taxableIncome > 180000 ? 51667 + (taxableIncome - 180000) * 0.45 :
      taxableIncome > 120000 ? 29467 + (taxableIncome - 120000) * 0.37 :
      taxableIncome > 45000 ? 5092 + (taxableIncome - 45000) * 0.325 :
      taxableIncome > 18200 ? (taxableIncome - 18200) * 0.19 : 0;
    
    const data = {
      report_title: `${scenario.name} — Halcyon Wealth Report`,
      generated_at: new Date().toISOString(),
      client_name: "David & Sarah Thompson",
      sections: [
        {
          title: 'Executive Summary',
          data: {
            total_gross_assets: grossAssets,
            total_invested_assets: totalInvested,
            total_property: propertyTotal,
            total_liabilities: mortgageTotal,
            net_worth: netWorth,
            annual_income: taxableIncome,
            annual_expenses: totalExpenses,
            savings_rate: taxableIncome > 0 ? ((taxableIncome - totalExpenses - estimatedTax) / taxableIncome * 100) : 0,
          }
        },
        {
          title: 'Income Breakdown',
          data: {
            salary_income: taxableIncome,
            rental_income: (inv.properties || []).reduce((s, p) => s + (p.rental_income || 0), 0),
            dividend_income: Math.round((inv.shares_value || 0) * (inv.shares_dividend_yield || 0) / 100 + (inv.etf_value || 0) * (inv.etf_yield || 0) / 100),
            interest_income: Math.round((inv.cash_savings || 0) * 0.04 + (inv.term_deposit_amount || 0) * (inv.term_deposit_rate || 0) / 100),
          }
        },
        {
          title: 'Tax Analysis',
          data: {
            taxable_income: taxableIncome,
            estimated_tax: Math.round(estimatedTax),
            effective_rate: taxableIncome > 0 ? (estimatedTax / taxableIncome * 100) : 0,
            medicare_levy: Math.round(taxableIncome * 0.02),
            net_after_tax: Math.round(taxableIncome - estimatedTax - taxableIncome * 0.02),
            breakdown: [
              { bracket: '$0 - $18,200', rate: 0, taxable: Math.min(taxableIncome, 18200), tax: 0 },
              { bracket: '$18,201 - $45,000', rate: 19, taxable: Math.min(Math.max(taxableIncome - 18200, 0), 26800), tax: Math.min(Math.max(taxableIncome - 18200, 0), 26800) * 0.19 },
              { bracket: '$45,001 - $120,000', rate: 32.5, taxable: Math.min(Math.max(taxableIncome - 45000, 0), 75000), tax: Math.min(Math.max(taxableIncome - 45000, 0), 75000) * 0.325 },
              { bracket: '$120,001 - $180,000', rate: 37, taxable: Math.min(Math.max(taxableIncome - 120000, 0), 60000), tax: Math.min(Math.max(taxableIncome - 120000, 0), 60000) * 0.37 },
              { bracket: '$180,001+', rate: 45, taxable: Math.max(taxableIncome - 180000, 0), tax: Math.max(taxableIncome - 180000, 0) * 0.45 },
            ].filter(b => b.taxable > 0)
          }
        },
        ...(inv.properties && inv.properties.length > 0 ? [{
          title: 'Property Portfolio',
          data: inv.properties.map(p => ({
            property_name: p.name,
            value: p.value,
            rental_income: p.rental_income,
            mortgage: p.mortgage_amount,
            equity: p.value - (p.mortgage_amount || 0),
            mortgage_rate: `${p.mortgage_rate}%`,
            net_yield: p.value > 0 ? `${((p.rental_income - (p.annual_expenses || 0)) / p.value * 100).toFixed(1)}%` : '0%',
          }))
        }] : []),
        {
          title: 'Investment Projections',
          data: {
            current_portfolio: totalInvested,
            expected_annual_return: '7.0%',
            projected_5yr: Math.round(totalInvested * Math.pow(1.07, 5)),
            projected_10yr: Math.round(totalInvested * Math.pow(1.07, 10)),
            projected_20yr: Math.round(totalInvested * Math.pow(1.07, 20)),
            growth_probability: 87.5,
            risk_volatility: '12.0%',
          }
        },
      ],
      disclaimer: "This report is generated for informational purposes only and does not constitute financial advice. Past performance is not a guarantee of future results. Halcyon Wealth Pty Ltd (AFSL 123456). Please consult your adviser before making any financial decisions."
    };
    
    setReportData(data);
    toast.success("Report generated");
    setLoading(false);
  };

  const printReport = () => {
    window.print();
  };

  const downloadReport = () => {
    if (!reportData) return;
    
    // Use jsPDF for proper PDF generation
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;
      
      // Header bar
      doc.setFillColor(26, 39, 68); // #1a2744
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(212, 168, 76); // #D4A84C
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Halcyon Wealth', 15, 15);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(reportData.report_title, 15, 25);
      doc.setFontSize(8);
      doc.text(`Generated: ${formatDate(reportData.generated_at)}`, 15, 31);
      
      y = 45;
      doc.setTextColor(0, 0, 0);
      
      // Client
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Client: ${reportData.client_name}`, 15, y);
      y += 10;
      
      // Sections
      reportData.sections.forEach((section) => {
        if (y > 260) { doc.addPage(); y = 20; }
        
        // Section header
        doc.setFillColor(240, 240, 245);
        doc.rect(15, y - 5, pageWidth - 30, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 39, 68);
        doc.text(section.title, 18, y);
        y += 10;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        if (Array.isArray(section.data)) {
          section.data.forEach((item) => {
            if (y > 270) { doc.addPage(); y = 20; }
            Object.entries(item).forEach(([key, value]) => {
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              const val = typeof value === 'number' ? formatCurrency(value) : String(value);
              doc.text(`${label}: ${val}`, 20, y);
              y += 5;
            });
            y += 3;
          });
        } else if (section.data && typeof section.data === 'object') {
          Object.entries(section.data).forEach(([key, value]) => {
            if (key === 'breakdown' || typeof value === 'object') return;
            if (y > 270) { doc.addPage(); y = 20; }
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            let val;
            if (typeof value === 'number') {
              val = key.includes('rate') || key.includes('probability') || key.includes('volatility') 
                ? `${value.toFixed(1)}%` : formatCurrency(value);
            } else {
              val = String(value);
            }
            doc.text(`${label}: ${val}`, 20, y);
            y += 5;
          });
        }
        y += 5;
      });
      
      // Disclaimer
      if (y > 240) { doc.addPage(); y = 20; }
      y += 5;
      doc.setFillColor(26, 39, 68);
      doc.rect(0, y - 5, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      const disclaimerLines = doc.splitTextToSize(reportData.disclaimer, pageWidth - 30);
      doc.text(disclaimerLines, 15, y);
      
      doc.save(`${reportData.report_title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      toast.success("PDF downloaded");
    }).catch(() => {
      // Fallback to text download
      const reportText = generateReportText(reportData);
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportData.report_title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Report downloaded (text format)");
    });
  };

  const generateReportText = (data) => {
    let text = `${data.report_title}\n`;
    text += `${'='.repeat(60)}\n`;
    text += `Generated: ${formatDate(data.generated_at)}\n\n`;

    data.sections.forEach(section => {
      text += `\n${section.title}\n`;
      text += `${'-'.repeat(40)}\n`;
      
      if (Array.isArray(section.data)) {
        section.data.forEach((item, index) => {
          text += `\n[${index + 1}] ${item.property_name || `Item ${index + 1}`}\n`;
          Object.entries(item).forEach(([key, value]) => {
            if (typeof value === 'number') {
              text += `  ${key}: ${formatCurrency(value)}\n`;
            } else if (typeof value === 'boolean') {
              text += `  ${key}: ${value ? 'Yes' : 'No'}\n`;
            } else if (value !== null && value !== undefined) {
              text += `  ${key}: ${value}\n`;
            }
          });
        });
      } else if (typeof section.data === 'object' && section.data !== null) {
        Object.entries(section.data).forEach(([key, value]) => {
          if (typeof value === 'number') {
            text += `${key}: ${formatCurrency(value)}\n`;
          } else if (typeof value === 'object' && value !== null) {
            text += `${key}:\n`;
            Object.entries(value).forEach(([k, v]) => {
              if (typeof v === 'number') {
                text += `  ${k}: ${formatCurrency(v)}\n`;
              } else {
                text += `  ${k}: ${v}\n`;
              }
            });
          } else if (value !== null && value !== undefined) {
            text += `${key}: ${value}\n`;
          }
        });
      }
    });

    text += `\n\n${'-'.repeat(60)}\n`;
    text += `DISCLAIMER\n`;
    text += data.disclaimer;

    return text;
  };

  const content = (
    <>
      <div className="space-y-8" data-testid="report-generator-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Report Generator
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate comprehensive PDF reports for your investment scenarios
            </p>
          </div>
          {reportData && (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={printReport}
                data-testid="print-btn"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button 
                onClick={downloadReport}
                className="bg-[#1a2744] hover:bg-[#1a2744]/90"
                data-testid="download-btn"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario Selection */}
          <Card className="lg:col-span-1" data-testid="scenario-selection">
            <CardHeader>
              <CardTitle className="">Select Scenario</CardTitle>
              <CardDescription>Choose a scenario to generate report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.scenario_id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedScenario?.scenario_id === scenario.scenario_id
                        ? 'border-[#1a2744] bg-[#1a2744]/5'
                        : 'border-border hover:border-[#1a2744]/50'
                    }`}
                    onClick={() => generateReport(scenario)}
                    data-testid={`scenario-${scenario.scenario_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        scenario.entity_type === 'company' 
                          ? 'bg-[#D4A84C]/10' 
                          : 'bg-[#1a2744]/10'
                      }`}>
                        {scenario.entity_type === 'company' 
                          ? <Building2 className="h-4 w-4 text-[#D4A84C]" />
                          : <DollarSign className="h-4 w-4 text-[#1a2744]" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-sm">{scenario.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {scenario.entity_type}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Report Preview */}
          <Card className="lg:col-span-2 print:col-span-3" data-testid="report-preview">
            <CardHeader>
              <CardTitle className="">Report Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a2744] mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Generating report...</p>
                  </div>
                </div>
              ) : reportData ? (
                <div className="space-y-6 print:space-y-4" id="report-content">
                  {/* Report Header */}
                  <div className="p-6 rounded-lg bg-[#1a2744] text-white print:bg-gray-100 print:text-black">
                    <h2 className="text-2xl font-bold ">{reportData.report_title}</h2>
                    <div className="flex items-center gap-2 mt-2 text-white/80 print:text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Generated: {formatDate(reportData.generated_at)}</span>
                    </div>
                  </div>

                  {/* Report Sections */}
                  {reportData.sections.map((section, index) => (
                    <div key={`item-${index}`} className="p-4 rounded-lg border border-border">
                      <h3 className="text-lg font-semibold  mb-4 flex items-center gap-2">
                        {section.title === 'Executive Summary' && <PieChart className="h-5 w-5 text-[#1a2744]" />}
                        {section.title === 'Income Breakdown' && <DollarSign className="h-5 w-5 text-[#10B981]" />}
                        {section.title === 'Tax Analysis' && <FileText className="h-5 w-5 text-[#D4A84C]" />}
                        {section.title === 'Property Portfolio' && <Building2 className="h-5 w-5 text-[#3B82F6]" />}
                        {section.title === 'Investment Projections' && <TrendingUp className="h-5 w-5 text-[#1a2744]" />}
                        {section.title}
                      </h3>

                      {/* Special handling for Tax Analysis with breakdown */}
                      {section.title === 'Tax Analysis' && section.data?.breakdown ? (
                        <div className="space-y-4">
                          {/* Main tax data */}
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(section.data)
                              .filter(([key, v]) => key !== 'breakdown' && v !== null && v !== undefined)
                              .map(([key, value]) => (
                                <div key={key} className="flex justify-between p-2 rounded bg-muted/30">
                                  <span className="text-muted-foreground capitalize text-sm">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="font-semibold text-sm">
                                    {typeof value === 'number' 
                                      ? (key.includes('rate') 
                                          ? `${value.toFixed(1)}%` 
                                          : formatCurrency(value))
                                      : value
                                    }
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                          {/* Tax bracket breakdown */}
                          <div className="mt-4">
                            <h4 className="font-medium text-sm mb-2">Tax Bracket Breakdown</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2">Bracket</th>
                                    <th className="text-right p-2">Rate</th>
                                    <th className="text-right p-2">Taxable</th>
                                    <th className="text-right p-2">Tax</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {section.data.breakdown.map((bracket, i) => (
                                    <tr key={`item-${i}`} className="border-b">
                                      <td className="p-2 text-muted-foreground">{bracket.bracket}</td>
                                      <td className="text-right p-2">{bracket.rate}%</td>
                                      <td className="text-right p-2">{formatCurrency(bracket.taxable)}</td>
                                      <td className="text-right p-2 font-medium">{formatCurrency(bracket.tax)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : section.title === 'Investment Projections' && section.data?.percentile_projections ? (
                        /* Special handling for Investment Projections with percentiles */
                        <div className="space-y-4">
                          {/* Main projection data */}
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(section.data)
                              .filter(([key, v]) => key !== 'percentile_projections' && v !== null && v !== undefined && typeof v !== 'object')
                              .map(([key, value]) => (
                                <div key={key} className="flex justify-between p-2 rounded bg-muted/30">
                                  <span className="text-muted-foreground capitalize text-sm">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="font-semibold text-sm">
                                    {typeof value === 'number' 
                                      ? (key.includes('probability') || key.includes('volatility') || key.includes('return')
                                          ? `${value.toFixed(1)}%` 
                                          : formatCurrency(value))
                                      : value
                                    }
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                          {/* Percentile projections table */}
                          {section.data.percentile_projections?.years && (
                            <div className="mt-4">
                              <h4 className="font-medium text-sm mb-2">Percentile Projections by Year</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left p-2">Year</th>
                                      <th className="text-right p-2">10th %ile</th>
                                      <th className="text-right p-2">25th %ile</th>
                                      <th className="text-right p-2">50th (Median)</th>
                                      <th className="text-right p-2">75th %ile</th>
                                      <th className="text-right p-2">90th %ile</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {section.data.percentile_projections.years.map((year, i) => (
                                      <tr key={`item-${i}`} className="border-b">
                                        <td className="p-2 font-medium">Year {year}</td>
                                        <td className="text-right p-2 text-destructive">
                                          {formatCurrency(section.data.percentile_projections.p10?.[i] || 0)}
                                        </td>
                                        <td className="text-right p-2 text-[#D4A84C]">
                                          {formatCurrency(section.data.percentile_projections.p25?.[i] || 0)}
                                        </td>
                                        <td className="text-right p-2 font-semibold">
                                          {formatCurrency(section.data.percentile_projections.p50?.[i] || 0)}
                                        </td>
                                        <td className="text-right p-2 text-[#10B981]">
                                          {formatCurrency(section.data.percentile_projections.p75?.[i] || 0)}
                                        </td>
                                        <td className="text-right p-2 text-[#1a2744]">
                                          {formatCurrency(section.data.percentile_projections.p90?.[i] || 0)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : Array.isArray(section.data) ? (
                        section.data.length > 0 ? (
                          <div className="space-y-3">
                            {section.data.map((item, i) => (
                              <div key={`item-${i}`} className="p-3 rounded bg-muted/50">
                                <p className="font-medium">{item.property_name || `Item ${i + 1}`}</p>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                  {Object.entries(item)
                                    .filter(([k]) => k !== 'property_name')
                                    .slice(0, 6)
                                    .map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-muted-foreground capitalize">
                                          {key.replace(/_/g, ' ')}:
                                        </span>
                                        <span className="font-medium">
                                          {typeof value === 'number' 
                                            ? formatCurrency(value) 
                                            : typeof value === 'boolean'
                                              ? (value ? 'Yes' : 'No')
                                              : value
                                          }
                                        </span>
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No data available</p>
                        )
                      ) : typeof section.data === 'object' && section.data !== null ? (
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(section.data)
                            .filter(([_, v]) => v !== null && v !== undefined)
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground capitalize text-sm">
                                  {key.replace(/_/g, ' ')}:
                                </span>
                                <span className="font-semibold text-sm">
                                  {typeof value === 'number' 
                                    ? (key.includes('rate') 
                                        ? `${value.toFixed(1)}%` 
                                        : formatCurrency(value))
                                    : typeof value === 'boolean'
                                      ? (value ? 'Yes' : 'No')
                                      : JSON.stringify(value)
                                  }
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No data available</p>
                      )}
                    </div>
                  ))}

                  {/* Financial Recommendations */}
                  {reportData && (
                    <div className="p-4 rounded-lg border border-[#1a2744] bg-[#1a2744]/5">
                      <h3 className="text-lg font-semibold  mb-4 flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-[#D4A84C]" />
                        Recommended Next Steps
                      </h3>
                      
                      {/* Generate recommendations based on report data */}
                      <div className="space-y-3">
                        {/* Debt/Equity Analysis */}
                        {(() => {
                          const summary = reportData.sections?.find(s => s.title === 'Executive Summary')?.data;
                          const totalDebt = summary?.total_debt || 0;
                          const totalAssets = summary?.total_assets || 0;
                          const debtRatio = totalAssets > 0 ? (totalDebt / totalAssets * 100) : 0;
                          
                          const projections = reportData.sections?.find(s => s.title === 'Investment Projections')?.data;
                          const expectedReturn = projections?.expected_return || 7;
                          const volatility = projections?.volatility || 15;
                          
                          const taxData = reportData.sections?.find(s => s.title === 'Tax Analysis')?.data;
                          const effectiveRate = taxData?.effective_rate || 30;
                          
                          const recommendations = [];
                          
                          // Debt recommendations
                          if (debtRatio > 60) {
                            recommendations.push({
                              priority: "High",
                              color: "#EF4444",
                              icon: "🔴",
                              title: "Reduce Debt Exposure",
                              detail: `Your debt-to-asset ratio is ${debtRatio.toFixed(0)}%. Consider paying down high-interest debt or refinancing to reduce risk.`,
                              link: "/loan-calculator"
                            });
                          } else if (debtRatio > 40) {
                            recommendations.push({
                              priority: "Medium",
                              color: "#D4A84C",
                              icon: "🟡",
                              title: "Monitor Debt Levels",
                              detail: `Debt ratio of ${debtRatio.toFixed(0)}% is manageable but review loan terms. Consider accelerating mortgage payments if rates rise.`,
                              link: "/loan-calculator"
                            });
                          } else if (debtRatio > 0) {
                            recommendations.push({
                              priority: "Low",
                              color: "#10B981",
                              icon: "🟢",
                              title: "Debt Position Strong",
                              detail: `Debt ratio of ${debtRatio.toFixed(0)}% is healthy. Current leverage is appropriate for wealth building.`,
                              link: "/recommendations"
                            });
                          }
                          
                          // Risk/Return recommendations
                          const riskAdjustedReturn = expectedReturn / (volatility || 1);
                          if (riskAdjustedReturn < 0.4) {
                            recommendations.push({
                              priority: "High",
                              color: "#EF4444",
                              icon: "🔴",
                              title: "Improve Risk-Adjusted Returns",
                              detail: `Portfolio volatility (${volatility.toFixed(0)}%) is high relative to expected returns. Consider diversifying into lower-risk assets like bonds or term deposits.`,
                              link: "/monte-carlo"
                            });
                          } else if (riskAdjustedReturn < 0.6) {
                            recommendations.push({
                              priority: "Medium",
                              color: "#D4A84C",
                              icon: "🟡",
                              title: "Rebalance Portfolio",
                              detail: `Risk-adjusted return of ${(riskAdjustedReturn * 100).toFixed(0)}% is moderate. Review asset allocation to optimize the risk/reward balance.`,
                              link: "/monte-carlo"
                            });
                          } else {
                            recommendations.push({
                              priority: "Low",
                              color: "#10B981",
                              icon: "🟢",
                              title: "Portfolio Well Balanced",
                              detail: `Risk-adjusted return is strong. Expected ${expectedReturn.toFixed(1)}% return with ${volatility.toFixed(0)}% volatility is well-optimized.`,
                              link: "/dashboard"
                            });
                          }
                          
                          // Tax recommendations
                          if (effectiveRate > 35) {
                            recommendations.push({
                              priority: "High",
                              color: "#D4A84C",
                              icon: "🟡",
                              title: "Tax Optimization Opportunity",
                              detail: `Effective tax rate of ${effectiveRate.toFixed(1)}% is high. Consider salary sacrifice, trust distributions, or maximizing deductions.`,
                              link: "/tax-analysis"
                            });
                          }
                          
                          // Super recommendations
                          recommendations.push({
                            priority: "Medium",
                            color: "#3B82F6",
                            icon: "🔵",
                            title: "Maximize Super Contributions",
                            detail: "Review concessional contribution caps ($30,000/year). Salary sacrifice can reduce taxable income while building retirement wealth.",
                            link: "/smsf-optimizer"
                          });
                          
                          // Diversification
                          recommendations.push({
                            priority: "Low",
                            color: "#10B981",
                            icon: "🟢",
                            title: "Maintain Diversification",
                            detail: "Continue spreading investments across property, shares, bonds, and cash to reduce concentration risk.",
                            link: "/recommendations"
                          });
                          
                          return recommendations.map((rec, i) => (
                            <div 
                              key={`item-${i}`} 
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                rec.priority === 'High' ? 'bg-red-50 border-red-200 hover:border-red-400' :
                                rec.priority === 'Medium' ? 'bg-amber-50 border-amber-200 hover:border-amber-400' :
                                'bg-green-50 border-green-200 hover:border-green-400'
                              }`}
                              onClick={() => rec.link && window.location.assign(rec.link)}
                              data-testid={`recommendation-${i}`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                rec.priority === 'High' ? 'bg-red-100' :
                                rec.priority === 'Medium' ? 'bg-amber-100' :
                                'bg-green-100'
                              }`}>
                                {rec.priority === 'High' ? (
                                  <AlertTriangle className="h-5 w-5 text-red-600" />
                                ) : rec.priority === 'Medium' ? (
                                  <Scale className="h-5 w-5 text-amber-600" />
                                ) : (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-semibold ${
                                    rec.priority === 'High' ? 'text-red-800' :
                                    rec.priority === 'Medium' ? 'text-amber-800' :
                                    'text-green-800'
                                  }`}>{rec.title}</span>
                                  <Badge 
                                    className={`text-xs ${
                                      rec.priority === 'High' ? 'bg-red-600' :
                                      rec.priority === 'Medium' ? 'bg-amber-500' :
                                      'bg-green-600'
                                    }`}
                                  >
                                    {rec.priority} Risk
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{rec.detail}</p>
                                {rec.link && (
                                  <div className="mt-2 flex items-center text-sm font-medium text-[#1a2744]">
                                    View Details <ArrowRight className="h-4 w-4 ml-1" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <p className="font-semibold mb-2">Disclaimer</p>
                    <p>{reportData.disclaimer}</p>
                  </div>
                </div>
              ) : (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a scenario to generate report</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content, #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default ReportGenerator;
