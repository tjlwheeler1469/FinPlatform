import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download,
  FileSpreadsheet,
  FileText,
  Building2,
  Users,
  PiggyBank,
  Wallet,
  TrendingUp,
  Calendar,
  CheckCircle,
  Loader2,
  Info
} from "lucide-react";
import { usePortfolio } from "@/App";
import { toast } from "sonner";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const ExportData = () => {
  const { 
    familyMembers, 
    sharePortfolio, 
    budget, 
    trust, 
    company, 
    portfolio 
  } = usePortfolio();

  const [exportFormat, setExportFormat] = useState("csv");
  const [selectedSections, setSelectedSections] = useState({
    familyMembers: true,
    shares: true,
    budget: true,
    properties: true,
    trust: false,
    company: false,
    summary: true
  });
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const toggleSection = (section) => {
    setSelectedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Generate CSV content
  const generateCSV = () => {
    const sections = [];
    const today = formatDate(new Date());

    // Family Members
    if (selectedSections.familyMembers) {
      sections.push(["=== FAMILY MEMBERS ===", "", "", "", "", "", ""]);
      if (includeHeaders) {
        sections.push(["Name", "Relationship", "Age", "Taxable Income", "Salary Income", "Dividend Income", "Rental Income", "Deductions", "Super Balance"]);
      }
      familyMembers.forEach(m => {
        sections.push([
          m.name,
          m.relationship,
          m.age,
          m.taxableIncome,
          m.salaryIncome,
          m.dividendIncome,
          m.rentalIncome,
          m.deductions,
          m.superBalance
        ]);
      });
      sections.push([]);
    }

    // Share Portfolio
    if (selectedSections.shares) {
      sections.push(["=== SHARE PORTFOLIO ===", "", "", "", "", "", ""]);
      if (includeHeaders) {
        sections.push(["Symbol", "Name", "Ownership", "Quantity", "Purchase Price", "Current Price", "Value", "Gain/Loss", "Dividend Yield %", "Franking %", "Sector", "Purchase Date"]);
      }
      sharePortfolio.forEach(s => {
        const value = s.quantity * s.currentPrice;
        const costBase = s.quantity * s.purchasePrice;
        sections.push([
          s.symbol,
          s.name,
          s.ownership,
          s.quantity,
          s.purchasePrice,
          s.currentPrice,
          value,
          value - costBase,
          s.dividendYield,
          s.frankingPercentage,
          s.sector,
          s.purchaseDate
        ]);
      });
      sections.push([]);
    }

    // Budget
    if (selectedSections.budget) {
      sections.push(["=== HOUSEHOLD BUDGET (Monthly) ===", "", ""]);
      sections.push(["--- Income ---", "", ""]);
      Object.entries(budget.income).forEach(([key, value]) => {
        sections.push([key.replace(/_/g, ' '), value, ""]);
      });
      sections.push([]);
      sections.push(["--- Expenses ---", "", ""]);
      Object.entries(budget.expenses).forEach(([key, value]) => {
        sections.push([key.replace(/_/g, ' '), value, ""]);
      });
      sections.push([]);
    }

    // Properties
    if (selectedSections.properties && portfolio.investments?.properties) {
      sections.push(["=== PROPERTY PORTFOLIO ===", "", "", "", "", "", ""]);
      if (includeHeaders) {
        sections.push(["Name", "Value", "Rental Income", "Mortgage Amount", "Interest Rate", "Term (Years)", "Annual Expenses", "Depreciation"]);
      }
      portfolio.investments.properties.forEach(p => {
        sections.push([
          p.name,
          p.value,
          p.rental_income,
          p.mortgage_amount,
          p.mortgage_rate,
          p.mortgage_term_years,
          p.annual_expenses,
          (p.depreciation_building || 0) + (p.depreciation_fixtures || 0)
        ]);
      });
      sections.push([]);
    }

    // Trust
    if (selectedSections.trust) {
      sections.push(["=== TRUST DETAILS ===", "", ""]);
      sections.push(["Trust Name", trust.name, ""]);
      sections.push(["Type", trust.type, ""]);
      sections.push(["Net Income", trust.netIncome, ""]);
      sections.push(["Financial Year", trust.financialYear, ""]);
      sections.push([]);
      sections.push(["--- Beneficiaries ---", "", ""]);
      familyMembers.filter(m => m.isTrustBeneficiary).forEach(m => {
        sections.push([m.name, `${m.trustDistribution}%`, ""]);
      });
      sections.push([]);
    }

    // Company
    if (selectedSections.company) {
      sections.push(["=== COMPANY DETAILS ===", "", ""]);
      sections.push(["Company Name", company.name, ""]);
      sections.push(["ABN", company.abn, ""]);
      sections.push(["ACN", company.acn, ""]);
      sections.push(["Base Rate Entity", company.isBaseRateEntity ? "Yes" : "No", ""]);
      sections.push(["Tax Rate", `${company.taxRate * 100}%`, ""]);
      sections.push(["Franking Account Balance", company.frankingAccountBalance, ""]);
      sections.push(["Retained Earnings", company.retainedEarnings, ""]);
      sections.push([]);
    }

    // Summary
    if (selectedSections.summary) {
      sections.push(["=== PORTFOLIO SUMMARY ===", "", ""]);
      sections.push(["Generated Date", today, ""]);
      sections.push(["Total Assets", portfolio.summary?.totalAssets || 0, ""]);
      sections.push(["Total Debt", portfolio.summary?.totalDebt || 0, ""]);
      sections.push(["Net Worth", portfolio.summary?.netWorth || 0, ""]);
      sections.push(["Annual Income", portfolio.summary?.annualIncome || 0, ""]);
      sections.push([]);
    }

    return sections.map(row => row.join(",")).join("\n");
  };

  // Generate Xero-compatible CSV
  const generateXeroCSV = () => {
    const lines = [];
    const today = formatDate(new Date());
    
    // Xero Chart of Accounts format
    lines.push("*AccountCode,*AccountName,*AccountType,Description,TaxType");
    
    // Assets
    lines.push("1000,Cash at Bank,BANK,Bank accounts,BAS Excluded");
    lines.push("1100,Term Deposits,CURRLIAB,Fixed term investments,BAS Excluded");
    lines.push(`1200,Share Investments,CURRLIAB,Listed shares - value ${formatCurrency(sharePortfolio.reduce((sum, s) => sum + s.quantity * s.currentPrice, 0))},BAS Excluded`);
    
    portfolio.investments?.properties?.forEach((p, i) => {
      lines.push(`1${300 + i},${p.name},FIXED,Investment property,BAS Excluded`);
    });
    
    // Liabilities
    portfolio.investments?.properties?.forEach((p, i) => {
      if (p.mortgage_amount > 0) {
        lines.push(`2${100 + i},Mortgage - ${p.name},TERMLIAB,Property loan,BAS Excluded`);
      }
    });
    
    // Income
    lines.push("4000,Salary Income,REVENUE,Employment income,GST Free Income");
    lines.push("4100,Dividend Income,REVENUE,Dividend income from shares,GST Free Income");
    lines.push("4200,Rental Income,REVENUE,Investment property income,GST on Income");
    
    // Expenses
    lines.push("5000,Interest Expense,EXPENSE,Mortgage interest,BAS Excluded");
    lines.push("5100,Property Expenses,EXPENSE,Rates insurance maintenance,GST on Expenses");
    lines.push("5200,Depreciation,EXPENSE,Asset depreciation,BAS Excluded");
    
    return lines.join("\n");
  };

  // Generate MYOB-compatible CSV
  const generateMYOBCSV = () => {
    const lines = [];
    const today = formatDate(new Date());
    
    // MYOB Account Import format
    lines.push("Account Number,Account Name,Header,Account Type,Tax Code,Opening Balance");
    
    // Assets
    lines.push("1-0000,Assets,Y,Header,,");
    lines.push(`1-1000,Cash at Bank,N,Bank,N-T,${portfolio.investments?.cash_savings || 0}`);
    lines.push(`1-1100,Term Deposits,N,Other Current Asset,N-T,${portfolio.investments?.term_deposit_amount || 0}`);
    lines.push(`1-1200,Share Investments,N,Other Current Asset,N-T,${sharePortfolio.reduce((sum, s) => sum + s.quantity * s.currentPrice, 0)}`);
    
    portfolio.investments?.properties?.forEach((p, i) => {
      lines.push(`1-2${i}00,${p.name},N,Fixed Asset,N-T,${p.value}`);
    });
    
    // Liabilities
    lines.push("2-0000,Liabilities,Y,Header,,");
    portfolio.investments?.properties?.forEach((p, i) => {
      if (p.mortgage_amount > 0) {
        lines.push(`2-1${i}00,Mortgage - ${p.name},N,Long Term Liability,N-T,${p.mortgage_amount}`);
      }
    });
    
    // Income
    lines.push("4-0000,Income,Y,Header,,");
    lines.push("4-1000,Salary Income,N,Income,GST,");
    lines.push("4-1100,Dividend Income,N,Income,FRE,");
    lines.push("4-1200,Rental Income,N,Income,GST,");
    
    // Expenses
    lines.push("6-0000,Expenses,Y,Header,,");
    lines.push("6-1000,Interest Expense,N,Expense,N-T,");
    lines.push("6-1100,Property Expenses,N,Expense,GST,");
    lines.push("6-1200,Depreciation,N,Expense,N-T,");
    
    return lines.join("\n");
  };

  // Download function
  const handleExport = (format) => {
    setIsExporting(true);
    
    setTimeout(() => {
      let content = "";
      let filename = "";
      let mimeType = "text/csv";
      
      switch (format) {
        case "csv":
          content = generateCSV();
          filename = `wheeler_portfolio_${formatDate(new Date()).replace(/\//g, '-')}.csv`;
          break;
        case "xero":
          content = generateXeroCSV();
          filename = `wheeler_xero_import_${formatDate(new Date()).replace(/\//g, '-')}.csv`;
          break;
        case "myob":
          content = generateMYOBCSV();
          filename = `wheeler_myob_import_${formatDate(new Date()).replace(/\//g, '-')}.txt`;
          mimeType = "text/plain";
          break;
        case "pdf":
          // Generate simple text report for PDF
          content = generatePDFReport();
          filename = `wheeler_portfolio_report_${formatDate(new Date()).replace(/\//g, '-')}.txt`;
          mimeType = "text/plain";
          break;
        default:
          content = generateCSV();
          filename = "export.csv";
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
      toast.success(`Exported as ${filename}`);
    }, 500);
  };

  // Generate PDF report content
  const generatePDFReport = () => {
    const today = formatDate(new Date());
    let report = "";
    
    report += "══════════════════════════════════════════════════════════════\n";
    report += "                 WHEELER FAMILY PORTFOLIO REPORT              \n";
    report += "══════════════════════════════════════════════════════════════\n";
    report += `Generated: ${today}\n\n`;
    
    // Summary
    report += "┌─────────────────────────────────────────────────────────────┐\n";
    report += "│                     PORTFOLIO SUMMARY                       │\n";
    report += "├─────────────────────────────────────────────────────────────┤\n";
    report += `│ Total Assets:      ${formatCurrency(portfolio.summary?.totalAssets || 0).padStart(20)}             │\n`;
    report += `│ Total Debt:        ${formatCurrency(portfolio.summary?.totalDebt || 0).padStart(20)}             │\n`;
    report += `│ Net Worth:         ${formatCurrency(portfolio.summary?.netWorth || 0).padStart(20)}             │\n`;
    report += `│ Annual Income:     ${formatCurrency(portfolio.summary?.annualIncome || 0).padStart(20)}             │\n`;
    report += "└─────────────────────────────────────────────────────────────┘\n\n";
    
    // Family Members
    if (selectedSections.familyMembers) {
      report += "FAMILY MEMBERS\n";
      report += "─────────────────────────────────────────────────────────────\n";
      familyMembers.forEach(m => {
        report += `  ${m.name} (${m.relationship}, age ${m.age})\n`;
        report += `    Taxable Income: ${formatCurrency(m.taxableIncome)}\n`;
        report += `    Super Balance:  ${formatCurrency(m.superBalance)}\n\n`;
      });
    }
    
    // Shares
    if (selectedSections.shares) {
      const totalShareValue = sharePortfolio.reduce((sum, s) => sum + s.quantity * s.currentPrice, 0);
      report += "SHARE PORTFOLIO\n";
      report += "─────────────────────────────────────────────────────────────\n";
      report += `  Total Value: ${formatCurrency(totalShareValue)}\n\n`;
      sharePortfolio.forEach(s => {
        const value = s.quantity * s.currentPrice;
        report += `  ${s.symbol} - ${s.name}\n`;
        report += `    ${s.quantity} shares @ ${formatCurrency(s.currentPrice)} = ${formatCurrency(value)}\n`;
        report += `    Ownership: ${s.ownership}, Yield: ${s.dividendYield}%\n\n`;
      });
    }
    
    // Properties
    if (selectedSections.properties && portfolio.investments?.properties) {
      report += "PROPERTY PORTFOLIO\n";
      report += "─────────────────────────────────────────────────────────────\n";
      portfolio.investments.properties.forEach(p => {
        report += `  ${p.name}\n`;
        report += `    Value: ${formatCurrency(p.value)}\n`;
        report += `    Rental Income: ${formatCurrency(p.rental_income)}/year\n`;
        report += `    Mortgage: ${formatCurrency(p.mortgage_amount)} @ ${p.mortgage_rate}%\n\n`;
      });
    }
    
    report += "\n══════════════════════════════════════════════════════════════\n";
    report += "                         DISCLAIMER                           \n";
    report += "══════════════════════════════════════════════════════════════\n";
    report += "This report is for informational purposes only and does not\n";
    report += "constitute financial advice. Please consult a qualified\n";
    report += "professional for advice specific to your circumstances.\n";
    
    return report;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="export-data-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
            Export Data
          </h1>
          <p className="text-muted-foreground mt-1">
            Export your portfolio data for accounting software or records
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Options */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Select Data to Export</CardTitle>
              <CardDescription>Choose which sections to include in your export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Family Members */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedSections.familyMembers ? 'border-[#0F392B] bg-[#0F392B]/5' : 'border-border'
                  }`}
                  onClick={() => toggleSection('familyMembers')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-[#0F392B]" />
                      <div>
                        <p className="font-medium">Family Members</p>
                        <p className="text-xs text-muted-foreground">{familyMembers.length} members</p>
                      </div>
                    </div>
                    <Checkbox checked={selectedSections.familyMembers} />
                  </div>
                </div>

                {/* Shares */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedSections.shares ? 'border-[#0F392B] bg-[#0F392B]/5' : 'border-border'
                  }`}
                  onClick={() => toggleSection('shares')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                      <div>
                        <p className="font-medium">Share Portfolio</p>
                        <p className="text-xs text-muted-foreground">{sharePortfolio.length} holdings</p>
                      </div>
                    </div>
                    <Checkbox checked={selectedSections.shares} />
                  </div>
                </div>

                {/* Budget */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedSections.budget ? 'border-[#0F392B] bg-[#0F392B]/5' : 'border-border'
                  }`}
                  onClick={() => toggleSection('budget')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-[#10B981]" />
                      <div>
                        <p className="font-medium">Budget</p>
                        <p className="text-xs text-muted-foreground">Income & Expenses</p>
                      </div>
                    </div>
                    <Checkbox checked={selectedSections.budget} />
                  </div>
                </div>

                {/* Properties */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedSections.properties ? 'border-[#0F392B] bg-[#0F392B]/5' : 'border-border'
                  }`}
                  onClick={() => toggleSection('properties')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-[#3B82F6]" />
                      <div>
                        <p className="font-medium">Properties</p>
                        <p className="text-xs text-muted-foreground">
                          {portfolio.investments?.properties?.length || 0} properties
                        </p>
                      </div>
                    </div>
                    <Checkbox checked={selectedSections.properties} />
                  </div>
                </div>

                {/* Trust */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedSections.trust ? 'border-[#0F392B] bg-[#0F392B]/5' : 'border-border'
                  }`}
                  onClick={() => toggleSection('trust')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PiggyBank className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Trust Details</p>
                        <p className="text-xs text-muted-foreground">{trust.name}</p>
                      </div>
                    </div>
                    <Checkbox checked={selectedSections.trust} />
                  </div>
                </div>

                {/* Company */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedSections.company ? 'border-[#0F392B] bg-[#0F392B]/5' : 'border-border'
                  }`}
                  onClick={() => toggleSection('company')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium">Company Details</p>
                        <p className="text-xs text-muted-foreground">{company.name}</p>
                      </div>
                    </div>
                    <Checkbox checked={selectedSections.company} />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Switch
                  id="headers"
                  checked={includeHeaders}
                  onCheckedChange={setIncludeHeaders}
                />
                <Label htmlFor="headers">Include column headers</Label>
              </div>
            </CardContent>
          </Card>

          {/* Export Formats */}
          <Card>
            <CardHeader>
              <CardTitle>Export Format</CardTitle>
              <CardDescription>Choose your preferred format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CSV */}
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => handleExport('csv')}
                disabled={isExporting}
              >
                <FileSpreadsheet className="h-6 w-6 mr-3 text-[#10B981]" />
                <div className="text-left">
                  <p className="font-medium">Generic CSV</p>
                  <p className="text-xs text-muted-foreground">Universal spreadsheet format</p>
                </div>
              </Button>

              {/* Xero */}
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => handleExport('xero')}
                disabled={isExporting}
              >
                <div className="w-6 h-6 mr-3 rounded bg-[#13B5EA] flex items-center justify-center text-white text-xs font-bold">
                  X
                </div>
                <div className="text-left">
                  <p className="font-medium">Xero Format</p>
                  <p className="text-xs text-muted-foreground">Chart of Accounts import</p>
                </div>
              </Button>

              {/* MYOB */}
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => handleExport('myob')}
                disabled={isExporting}
              >
                <div className="w-6 h-6 mr-3 rounded bg-[#6B21A8] flex items-center justify-center text-white text-xs font-bold">
                  M
                </div>
                <div className="text-left">
                  <p className="font-medium">MYOB Format</p>
                  <p className="text-xs text-muted-foreground">Account list import</p>
                </div>
              </Button>

              {/* PDF Report */}
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
              >
                <FileText className="h-6 w-6 mr-3 text-destructive" />
                <div className="text-left">
                  <p className="font-medium">Text Report</p>
                  <p className="text-xs text-muted-foreground">Formatted summary report</p>
                </div>
              </Button>

              {isExporting && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0F392B]" />
                  <span className="ml-2">Exporting...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Import Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#13B5EA] flex items-center justify-center text-white text-xs font-bold">
                  X
                </div>
                Importing to Xero
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Go to <strong>Accounting → Chart of Accounts</strong></li>
                <li>Click <strong>Import</strong> button</li>
                <li>Select the downloaded Xero CSV file</li>
                <li>Map columns if needed and click <strong>Import</strong></li>
                <li>Review imported accounts for accuracy</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#6B21A8] flex items-center justify-center text-white text-xs font-bold">
                  M
                </div>
                Importing to MYOB
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Go to <strong>File → Import Data → Accounts</strong></li>
                <li>Select <strong>Account Information</strong></li>
                <li>Choose the downloaded MYOB TXT file</li>
                <li>Match import fields to MYOB fields</li>
                <li>Click <strong>Import</strong> and verify</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Export Data Notice</p>
                <p>
                  Exported data is provided as-is for informational purposes. Always verify 
                  imported data in your accounting software. The export formats are designed 
                  to be compatible with standard import functions but may require manual 
                  adjustment depending on your specific software configuration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ExportData;
