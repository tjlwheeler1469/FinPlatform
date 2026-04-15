import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Calculator,
  FileText,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  Building2,
  Send,
  Printer,
  ExternalLink,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { ComplianceFooter, CalculatorDisclaimer } from "@/components/ComplianceDisclaimer";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2
  }).format(value);
};

// BAS periods
const BAS_PERIODS = [
  { value: "2024-Q4", label: "Apr-Jun 2024 (Q4)", due: "2024-07-28" },
  { value: "2025-Q1", label: "Jul-Sep 2024 (Q1)", due: "2024-10-28" },
  { value: "2025-Q2", label: "Oct-Dec 2024 (Q2)", due: "2025-02-28" },
  { value: "2025-Q3", label: "Jan-Mar 2025 (Q3)", due: "2025-04-28" },
  { value: "2025-Q4", label: "Apr-Jun 2025 (Q4)", due: "2025-07-28" },
];

// Mock data from Xero/MYOB integration
const MOCK_GST_DATA = {
  "2025-Q2": {
    sales: {
      gstFree: 12500.00,
      gstApplicable: 145000.00,
      gstCollected: 14500.00,
      exportSales: 5000.00
    },
    purchases: {
      gstFree: 8500.00,
      gstApplicable: 85000.00,
      gstPaid: 8500.00,
      capitalPurchases: 15000.00,
      capitalGst: 1500.00
    },
    payg: {
      grossWages: 125000.00,
      withheld: 32500.00,
      instalmentIncome: 0,
      instalmentRate: 0
    }
  }
};

const BASCalculator = ({ embedded = false }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("2025-Q2");
  const [activeTab, setActiveTab] = useState("worksheet");
  const [dataSource, setDataSource] = useState("manual"); // manual, xero, myob
  const [calculating, setCalculating] = useState(false);
  const [basData, setBasData] = useState({
    // GST on Sales
    G1: 0, // Total sales
    G2: 0, // Export sales
    G3: 0, // Other GST-free sales
    G4: 0, // Input taxed sales
    G5: 0, // G2 + G3 + G4
    G6: 0, // Total sales subject to GST (G1 - G5)
    G7: 0, // Adjustments
    G8: 0, // Total sales subject to GST after adjustments
    G9: 0, // GST on sales (G8 ÷ 11)
    
    // GST on Purchases
    G10: 0, // Capital purchases
    G11: 0, // Non-capital purchases
    G12: 0, // G10 + G11
    G13: 0, // Purchases for making input taxed sales
    G14: 0, // Purchases without GST
    G15: 0, // Estimated purchases for private use
    G16: 0, // G13 + G14 + G15
    G17: 0, // Total purchases subject to GST (G12 - G16)
    G18: 0, // Adjustments
    G19: 0, // Total purchases subject to GST after adjustments
    G20: 0, // GST on purchases (G19 ÷ 11)
    
    // PAYG Withholding
    W1: 0, // Total salary, wages and other payments
    W2: 0, // Amounts withheld from salary, wages and other payments
    W3: 0, // Amounts withheld from investment distributions
    W4: 0, // Amounts withheld from invoices (no ABN)
    W5: 0, // Total amounts withheld (W2 + W3 + W4)
    
    // PAYG Instalments
    T1: 0, // Instalment income
    T2: 0, // Varied instalment rate
    T3: 0, // New varied instalment amount
    T4: 0, // Reason code for variation
    T7: 0, // Instalment income (option 2)
    T8: 0, // ATO calculated instalment rate
    T9: 0, // PAYG instalment (T7 × T8)
    T11: 0, // PAYG instalment amount
  });

  // Calculate derived values
  const calculateBAS = () => {
    setCalculating(true);
    
    setTimeout(() => {
      const data = { ...basData };
      
      // GST Calculations
      data.G5 = data.G2 + data.G3 + data.G4;
      data.G6 = data.G1 - data.G5;
      data.G8 = data.G6 + data.G7;
      data.G9 = Math.round((data.G8 / 11) * 100) / 100;
      
      data.G12 = data.G10 + data.G11;
      data.G16 = data.G13 + data.G14 + data.G15;
      data.G17 = data.G12 - data.G16;
      data.G19 = data.G17 + data.G18;
      data.G20 = Math.round((data.G19 / 11) * 100) / 100;
      
      // PAYG Withholding
      data.W5 = data.W2 + data.W3 + data.W4;
      
      // PAYG Instalments
      data.T9 = Math.round(data.T7 * (data.T8 / 100) * 100) / 100;
      
      setBasData(data);
      setCalculating(false);
      toast.success("BAS calculated successfully");
    }, 1000);
  };

  // Import from Xero/MYOB
  const importFromAccounting = () => {
    const mockData = MOCK_GST_DATA[selectedPeriod];
    if (!mockData) {
      toast.error("No data available for this period");
      return;
    }
    
    setBasData({
      ...basData,
      G1: mockData.sales.gstApplicable + mockData.sales.gstFree + mockData.sales.gstCollected,
      G2: mockData.sales.exportSales,
      G3: mockData.sales.gstFree,
      G10: mockData.purchases.capitalPurchases + mockData.purchases.capitalGst,
      G11: mockData.purchases.gstApplicable + mockData.purchases.gstPaid,
      W1: mockData.payg.grossWages,
      W2: mockData.payg.withheld,
      T7: mockData.payg.instalmentIncome,
      T8: mockData.payg.instalmentRate
    });
    
    toast.success(`Imported data from ${dataSource === 'xero' ? 'Xero' : 'MYOB'}`);
  };

  // Summary calculations
  const gstOnSales = basData.G9;
  const gstOnPurchases = basData.G20;
  const netGST = gstOnSales - gstOnPurchases;
  const paygWithholding = basData.W5;
  const paygInstalment = basData.T11 || basData.T9;
  const totalPayable = netGST + paygWithholding + paygInstalment;

  // Export BAS
  const exportBAS = () => {
    const period = BAS_PERIODS.find(p => p.value === selectedPeriod);
    const content = `
BUSINESS ACTIVITY STATEMENT
===========================
Period: ${period?.label}
Due Date: ${period?.due}
Generated: ${new Date().toLocaleDateString('en-AU')}

GST ON SALES
------------
G1 Total sales: ${formatCurrency(basData.G1)}
G2 Export sales: ${formatCurrency(basData.G2)}
G3 Other GST-free sales: ${formatCurrency(basData.G3)}
G9 GST on sales: ${formatCurrency(basData.G9)}

GST ON PURCHASES
----------------
G10 Capital purchases: ${formatCurrency(basData.G10)}
G11 Non-capital purchases: ${formatCurrency(basData.G11)}
G20 GST on purchases: ${formatCurrency(basData.G20)}

PAYG WITHHOLDING
----------------
W1 Total wages: ${formatCurrency(basData.W1)}
W5 Total withheld: ${formatCurrency(basData.W5)}

SUMMARY
-------
Net GST: ${formatCurrency(netGST)}
PAYG Withholding: ${formatCurrency(paygWithholding)}
PAYG Instalment: ${formatCurrency(paygInstalment)}
--------------------------
TOTAL PAYABLE: ${formatCurrency(totalPayable)}

Note: This is a calculation only. Lodge via ATO Business Portal or through your registered tax agent.
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BAS_${selectedPeriod}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("BAS exported successfully");
  };

  const selectedPeriodInfo = BAS_PERIODS.find(p => p.value === selectedPeriod);
  const dueDate = selectedPeriodInfo ? new Date(selectedPeriodInfo.due) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const content = (
      <div className="space-y-6" data-testid="bas-calculator-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              BAS Calculator
            </h1>
            <p className="text-muted-foreground mt-1">
              Calculate your Business Activity Statement for ATO lodgement
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {BAS_PERIODS.map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportBAS}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button onClick={calculateBAS} className="bg-[#1a2744]" disabled={calculating}>
              {calculating ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Calculating...</>
              ) : (
                <><Calculator className="h-4 w-4 mr-2" /> Calculate</>
              )}
            </Button>
          </div>
        </div>

        {/* Due Date Alert */}
        {selectedPeriodInfo && (
          <Card className={isOverdue ? "bg-destructive/10 border-destructive/30" : daysUntilDue <= 14 ? "bg-amber-50 border-amber-200" : "bg-[#10B981]/10 border-[#10B981]/30"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isOverdue ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : daysUntilDue <= 14 ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-[#10B981]" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {selectedPeriodInfo.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(selectedPeriodInfo.due).toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <Badge variant={isOverdue ? "destructive" : daysUntilDue <= 14 ? "secondary" : "outline"}>
                  {isOverdue ? "OVERDUE" : `${daysUntilDue} days until due`}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <CalculatorDisclaimer calculatorName="BAS calculator" />

        {/* Data Source */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data Source</CardTitle>
            <CardDescription>Import data from your accounting software or enter manually</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  id="manual" 
                  name="source" 
                  checked={dataSource === "manual"}
                  onChange={() => setDataSource("manual")}
                  className="w-4 h-4"
                />
                <Label htmlFor="manual">Manual Entry</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  id="xero" 
                  name="source" 
                  checked={dataSource === "xero"}
                  onChange={() => setDataSource("xero")}
                  className="w-4 h-4"
                />
                <Label htmlFor="xero" className="text-[#13B5EA]">Xero</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  id="myob" 
                  name="source" 
                  checked={dataSource === "myob"}
                  onChange={() => setDataSource("myob")}
                  className="w-4 h-4"
                />
                <Label htmlFor="myob" className="text-[#6B21A8]">MYOB</Label>
              </div>
              {(dataSource === "xero" || dataSource === "myob") && (
                <Button variant="outline" size="sm" onClick={importFromAccounting}>
                  <Upload className="h-4 w-4 mr-2" /> Import Data
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-[#1a2744] text-white">
            <CardContent className="p-4">
              <p className="text-xs text-white/70">GST on Sales</p>
              <p className="text-xl font-bold">{formatCurrency(gstOnSales)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">GST on Purchases</p>
              <p className="text-xl font-bold text-[#10B981]">({formatCurrency(gstOnPurchases)})</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Net GST</p>
              <p className={`text-xl font-bold ${netGST >= 0 ? '' : 'text-[#10B981]'}`}>
                {formatCurrency(netGST)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">PAYG Withholding</p>
              <p className="text-xl font-bold">{formatCurrency(paygWithholding)}</p>
            </CardContent>
          </Card>
          <Card className={totalPayable >= 0 ? "bg-destructive/10" : "bg-[#10B981]/10"}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total {totalPayable >= 0 ? 'Payable' : 'Refundable'}</p>
              <p className="text-xl font-bold">{formatCurrency(Math.abs(totalPayable))}</p>
            </CardContent>
          </Card>
        </div>

        {/* BAS Worksheet */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="worksheet">GST Worksheet</TabsTrigger>
            <TabsTrigger value="payg-w">PAYG Withholding</TabsTrigger>
            <TabsTrigger value="payg-i">PAYG Instalments</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* GST Worksheet Tab */}
          <TabsContent value="worksheet" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GST on Sales */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-[#1a2744]">GST on Sales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "G1", desc: "Total sales (including GST)", key: "G1" },
                    { label: "G2", desc: "Export sales", key: "G2" },
                    { label: "G3", desc: "Other GST-free sales", key: "G3" },
                    { label: "G4", desc: "Input taxed sales", key: "G4" },
                    { label: "G7", desc: "Adjustments", key: "G7" },
                  ].map(field => (
                    <div key={field.key} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-10 justify-center text-xs">{field.label}</Badge>
                        <span className="text-xs text-muted-foreground">{field.desc}</span>
                      </div>
                      <Input 
                        type="number"
                        value={basData[field.key]}
                        onChange={(e) => setBasData({ ...basData, [field.key]: parseFloat(e.target.value) || 0 })}
                        className="text-right"
                      />
                    </div>
                  ))}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>G5 GST-free sales (G2+G3+G4)</span>
                      <span className="font-medium">{formatCurrency(basData.G5)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>G6 Sales subject to GST (G1-G5)</span>
                      <span className="font-medium">{formatCurrency(basData.G6)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>G8 After adjustments</span>
                      <span className="font-medium">{formatCurrency(basData.G8)}</span>
                    </div>
                    <div className="flex justify-between font-semibold p-2 bg-muted rounded">
                      <span>G9 GST on sales (G8 ÷ 11)</span>
                      <span>{formatCurrency(basData.G9)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GST on Purchases */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-[#10B981]">GST on Purchases</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "G10", desc: "Capital purchases (including GST)", key: "G10" },
                    { label: "G11", desc: "Non-capital purchases (including GST)", key: "G11" },
                    { label: "G13", desc: "Purchases for making input taxed sales", key: "G13" },
                    { label: "G14", desc: "Purchases without GST in the price", key: "G14" },
                    { label: "G15", desc: "Estimated purchases for private use", key: "G15" },
                    { label: "G18", desc: "Adjustments", key: "G18" },
                  ].map(field => (
                    <div key={field.key} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-10 justify-center text-xs">{field.label}</Badge>
                        <span className="text-xs text-muted-foreground">{field.desc}</span>
                      </div>
                      <Input 
                        type="number"
                        value={basData[field.key]}
                        onChange={(e) => setBasData({ ...basData, [field.key]: parseFloat(e.target.value) || 0 })}
                        className="text-right"
                      />
                    </div>
                  ))}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>G12 Total purchases (G10+G11)</span>
                      <span className="font-medium">{formatCurrency(basData.G12)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>G17 Purchases subject to GST</span>
                      <span className="font-medium">{formatCurrency(basData.G17)}</span>
                    </div>
                    <div className="flex justify-between font-semibold p-2 bg-[#10B981]/10 rounded">
                      <span>G20 GST on purchases (G19 ÷ 11)</span>
                      <span className="text-[#10B981]">({formatCurrency(basData.G20)})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PAYG Withholding Tab */}
          <TabsContent value="payg-w" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">PAYG Withholding</CardTitle>
                <CardDescription>Amounts withheld from payments to employees and others</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "W1", desc: "Total salary, wages and other payments", key: "W1" },
                  { label: "W2", desc: "Amounts withheld from salary/wages", key: "W2" },
                  { label: "W3", desc: "Amounts withheld from investment distributions", key: "W3" },
                  { label: "W4", desc: "Amounts withheld where no ABN quoted", key: "W4" },
                ].map(field => (
                  <div key={field.key} className="grid grid-cols-12 gap-4 items-center">
                    <Badge variant="outline" className="col-span-1 justify-center">{field.label}</Badge>
                    <Label className="col-span-7 text-sm">{field.desc}</Label>
                    <div className="col-span-4">
                      <Input 
                        type="number"
                        value={basData[field.key]}
                        onChange={(e) => setBasData({ ...basData, [field.key]: parseFloat(e.target.value) || 0 })}
                        className="text-right"
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-12 gap-4 items-center bg-muted p-3 rounded">
                    <Badge className="col-span-1 justify-center bg-[#1a2744]">W5</Badge>
                    <span className="col-span-7 font-semibold">Total amounts withheld</span>
                    <span className="col-span-4 text-right font-bold text-lg">{formatCurrency(basData.W5)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAYG Instalments Tab */}
          <TabsContent value="payg-i" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">PAYG Instalments</CardTitle>
                <CardDescription>Pay as you go income tax instalments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <Badge variant="outline" className="col-span-1 justify-center">T7</Badge>
                  <Label className="col-span-7 text-sm">Instalment income for the quarter</Label>
                  <div className="col-span-4">
                    <Input 
                      type="number"
                      value={basData.T7}
                      onChange={(e) => setBasData({ ...basData, T7: parseFloat(e.target.value) || 0 })}
                      className="text-right"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 items-center">
                  <Badge variant="outline" className="col-span-1 justify-center">T8</Badge>
                  <Label className="col-span-7 text-sm">ATO instalment rate (%)</Label>
                  <div className="col-span-4">
                    <Input 
                      type="number"
                      step="0.01"
                      value={basData.T8}
                      onChange={(e) => setBasData({ ...basData, T8: parseFloat(e.target.value) || 0 })}
                      className="text-right"
                    />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-12 gap-4 items-center bg-muted p-3 rounded">
                    <Badge className="col-span-1 justify-center bg-[#D4A84C]">T9</Badge>
                    <span className="col-span-7 font-semibold">PAYG instalment (T7 × T8%)</span>
                    <span className="col-span-4 text-right font-bold text-lg">{formatCurrency(basData.T9)}</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      Use T11 if you want to enter a specific instalment amount instead of using the calculated amount.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 items-center">
                  <Badge variant="outline" className="col-span-1 justify-center">T11</Badge>
                  <Label className="col-span-7 text-sm">PAYG instalment amount (optional override)</Label>
                  <div className="col-span-4">
                    <Input 
                      type="number"
                      value={basData.T11}
                      onChange={(e) => setBasData({ ...basData, T11: parseFloat(e.target.value) || 0 })}
                      className="text-right"
                      placeholder="Leave blank to use T9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">BAS Summary</CardTitle>
                <CardDescription>Review before lodging with the ATO</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Period</p>
                      <p className="font-semibold">{selectedPeriodInfo?.label}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-semibold">{selectedPeriodInfo?.due}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 border rounded">
                      <span>1A GST on sales</span>
                      <span className="font-medium">{formatCurrency(gstOnSales)}</span>
                    </div>
                    <div className="flex justify-between p-3 border rounded">
                      <span>1B GST on purchases (credit)</span>
                      <span className="font-medium text-[#10B981]">({formatCurrency(gstOnPurchases)})</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted rounded font-semibold">
                      <span>Net GST (1A - 1B)</span>
                      <span>{formatCurrency(netGST)}</span>
                    </div>
                    <div className="flex justify-between p-3 border rounded">
                      <span>4 PAYG tax withheld</span>
                      <span className="font-medium">{formatCurrency(paygWithholding)}</span>
                    </div>
                    <div className="flex justify-between p-3 border rounded">
                      <span>5A PAYG instalment</span>
                      <span className="font-medium">{formatCurrency(paygInstalment)}</span>
                    </div>
                    <div className={`flex justify-between p-4 rounded-lg font-bold text-lg ${totalPayable >= 0 ? 'bg-destructive/10' : 'bg-[#10B981]/10'}`}>
                      <span>9 Total amount {totalPayable >= 0 ? 'payable' : 'refundable'}</span>
                      <span>{formatCurrency(Math.abs(totalPayable))}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={exportBAS} className="flex-1">
                      <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Printer className="h-4 w-4 mr-2" /> Print
                    </Button>
                    <a 
                      href="https://bp.ato.gov.au/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full bg-[#1a2744]">
                        <Send className="h-4 w-4 mr-2" /> Lodge via ATO
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ComplianceFooter />
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default BASCalculator;
