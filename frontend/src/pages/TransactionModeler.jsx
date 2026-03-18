import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  TrendingUp,
  LineChart,
  DollarSign,
  Calculator,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  PiggyBank,
  Target,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  RefreshCw,
  Save,
  ChevronRight,
  Info,
  Wallet,
  Calendar,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const TransactionModeler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client") || "client_1";
  
  const [activeTab, setActiveTab] = useState("property");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Property form state
  const [propertyForm, setPropertyForm] = useState({
    transaction_type: "buy",
    property_value: 850000,
    deposit_percent: 20,
    loan_interest_rate: 6.5,
    loan_term_years: 30,
    expected_rental_yield: 4.0,
    expected_capital_growth: 5.0
  });
  
  // Fund form state
  const [fundForm, setFundForm] = useState({
    transaction_type: "buy",
    fund_name: "Vanguard Australian Shares Index ETF",
    amount: 100000,
    expected_return: 7.0,
    management_fee: 0.10,
    distribution_yield: 3.5
  });
  
  // Stock form state
  const [stockForm, setStockForm] = useState({
    transaction_type: "buy",
    symbol: "CBA",
    shares: 100,
    price_per_share: 120,
    purchase_date: "2023-01-01",
    purchase_price: 95
  });

  // Get client info from localStorage
  const selectedClient = JSON.parse(localStorage.getItem("selected_client") || "{}");
  const clientName = selectedClient.name || "Wheeler Family";

  const modelProperty = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${API_URL}/api/transaction-modeling/property?client_id=${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propertyForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult({ type: "property", data });
        toast.success("Property scenario modeled successfully");
      } else {
        toast.error("Failed to model property scenario");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const modelFund = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${API_URL}/api/transaction-modeling/fund?client_id=${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fundForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult({ type: "fund", data });
        toast.success("Fund investment modeled successfully");
      } else {
        toast.error("Failed to model fund investment");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const modelStock = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${API_URL}/api/transaction-modeling/stock?client_id=${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult({ type: "stock", data });
        toast.success("Stock trade modeled successfully");
      } else {
        toast.error("Failed to model stock trade");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleModel = () => {
    switch (activeTab) {
      case "property":
        modelProperty();
        break;
      case "fund":
        modelFund();
        break;
      case "stock":
        modelStock();
        break;
      default:
        break;
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="transaction-modeler">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/client-360")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Calculator className="h-7 w-7 text-[#D4A84C]" />
              Transaction Modeler
            </h1>
            <p className="text-muted-foreground mt-1">
              Model "What If" scenarios for {clientName}
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2 text-[#D4A84C]" />
            Scenario Builder
          </Badge>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Model a Transaction</CardTitle>
              <CardDescription>
                Choose a transaction type and configure the parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="property" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Property
                  </TabsTrigger>
                  <TabsTrigger value="fund" className="flex items-center gap-2">
                    <PiggyBank className="h-4 w-4" />
                    Fund
                  </TabsTrigger>
                  <TabsTrigger value="stock" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Stock
                  </TabsTrigger>
                </TabsList>

                {/* Property Tab */}
                <TabsContent value="property" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Transaction Type</Label>
                      <Select 
                        value={propertyForm.transaction_type}
                        onValueChange={(v) => setPropertyForm({...propertyForm, transaction_type: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy Property</SelectItem>
                          <SelectItem value="sell">Sell Property</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Property Value</Label>
                      <Input
                        type="number"
                        value={propertyForm.property_value}
                        onChange={(e) => setPropertyForm({...propertyForm, property_value: Number(e.target.value)})}
                        data-testid="property-value-input"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Deposit: {propertyForm.deposit_percent}%</Label>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(propertyForm.property_value * propertyForm.deposit_percent / 100)}
                        </span>
                      </div>
                      <Slider
                        value={[propertyForm.deposit_percent]}
                        onValueChange={([v]) => setPropertyForm({...propertyForm, deposit_percent: v})}
                        min={5}
                        max={50}
                        step={5}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Interest Rate: {propertyForm.loan_interest_rate}%</Label>
                      </div>
                      <Slider
                        value={[propertyForm.loan_interest_rate]}
                        onValueChange={([v]) => setPropertyForm({...propertyForm, loan_interest_rate: v})}
                        min={4}
                        max={10}
                        step={0.25}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Expected Rental Yield: {propertyForm.expected_rental_yield}%</Label>
                      </div>
                      <Slider
                        value={[propertyForm.expected_rental_yield]}
                        onValueChange={([v]) => setPropertyForm({...propertyForm, expected_rental_yield: v})}
                        min={2}
                        max={8}
                        step={0.5}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Expected Capital Growth: {propertyForm.expected_capital_growth}%</Label>
                      </div>
                      <Slider
                        value={[propertyForm.expected_capital_growth]}
                        onValueChange={([v]) => setPropertyForm({...propertyForm, expected_capital_growth: v})}
                        min={0}
                        max={10}
                        step={0.5}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Fund Tab */}
                <TabsContent value="fund" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Transaction Type</Label>
                      <Select 
                        value={fundForm.transaction_type}
                        onValueChange={(v) => setFundForm({...fundForm, transaction_type: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy/Invest</SelectItem>
                          <SelectItem value="sell">Sell/Redeem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Investment Amount</Label>
                      <Input
                        type="number"
                        value={fundForm.amount}
                        onChange={(e) => setFundForm({...fundForm, amount: Number(e.target.value)})}
                        data-testid="fund-amount-input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Fund Name</Label>
                    <Select 
                      value={fundForm.fund_name}
                      onValueChange={(v) => setFundForm({...fundForm, fund_name: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vanguard Australian Shares Index ETF">VAS - Vanguard Australian Shares</SelectItem>
                        <SelectItem value="Vanguard International Shares ETF">VGS - Vanguard International</SelectItem>
                        <SelectItem value="Magellan Global Fund">Magellan Global Fund</SelectItem>
                        <SelectItem value="Platinum International Fund">Platinum International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Expected Return: {fundForm.expected_return}%</Label>
                      </div>
                      <Slider
                        value={[fundForm.expected_return]}
                        onValueChange={([v]) => setFundForm({...fundForm, expected_return: v})}
                        min={3}
                        max={15}
                        step={0.5}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Management Fee: {fundForm.management_fee}%</Label>
                      </div>
                      <Slider
                        value={[fundForm.management_fee]}
                        onValueChange={([v]) => setFundForm({...fundForm, management_fee: v})}
                        min={0.05}
                        max={2}
                        step={0.05}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Stock Tab */}
                <TabsContent value="stock" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Transaction Type</Label>
                      <Select 
                        value={stockForm.transaction_type}
                        onValueChange={(v) => setStockForm({...stockForm, transaction_type: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy Shares</SelectItem>
                          <SelectItem value="sell">Sell Shares</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Stock Symbol</Label>
                      <Select 
                        value={stockForm.symbol}
                        onValueChange={(v) => setStockForm({...stockForm, symbol: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CBA">CBA - Commonwealth Bank</SelectItem>
                          <SelectItem value="BHP">BHP - BHP Group</SelectItem>
                          <SelectItem value="CSL">CSL - CSL Limited</SelectItem>
                          <SelectItem value="WBC">WBC - Westpac</SelectItem>
                          <SelectItem value="NAB">NAB - National Australia Bank</SelectItem>
                          <SelectItem value="ANZ">ANZ - ANZ Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Number of Shares</Label>
                      <Input
                        type="number"
                        value={stockForm.shares}
                        onChange={(e) => setStockForm({...stockForm, shares: Number(e.target.value)})}
                        data-testid="stock-shares-input"
                      />
                    </div>
                    <div>
                      <Label>Price per Share</Label>
                      <Input
                        type="number"
                        value={stockForm.price_per_share}
                        onChange={(e) => setStockForm({...stockForm, price_per_share: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  
                  {stockForm.transaction_type === "sell" && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <Label>Original Purchase Price</Label>
                        <Input
                          type="number"
                          value={stockForm.purchase_price}
                          onChange={(e) => setStockForm({...stockForm, purchase_price: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label>Purchase Date</Label>
                        <Input
                          type="date"
                          value={stockForm.purchase_date}
                          onChange={(e) => setStockForm({...stockForm, purchase_date: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Trade Value: {formatCurrency(stockForm.shares * stockForm.price_per_share)}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              <Button 
                onClick={handleModel} 
                className="w-full bg-[#1a2744] hover:bg-[#1a2744]/90"
                disabled={loading}
                data-testid="model-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Modeling...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Model Scenario
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#D4A84C]" />
                Impact Analysis
              </CardTitle>
              <CardDescription>
                See how this transaction affects the portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure a transaction and click "Model Scenario" to see the impact analysis</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-[#D4A84C]" />
                  <p className="text-muted-foreground">Analyzing scenario...</p>
                </div>
              )}

              {result && result.type === "property" && result.data.analysis && (
                <div className="space-y-6" data-testid="property-result">
                  {/* Purchase Costs */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#D4A84C]" />
                      Upfront Costs
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>Deposit ({result.data.analysis.purchase_costs.deposit_percent}%)</span>
                      <span className="text-right font-medium">{formatCurrency(result.data.analysis.purchase_costs.deposit)}</span>
                      <span>Stamp Duty</span>
                      <span className="text-right font-medium">{formatCurrency(result.data.analysis.purchase_costs.stamp_duty)}</span>
                      <span>Legal & Other</span>
                      <span className="text-right font-medium">{formatCurrency(result.data.analysis.purchase_costs.legal_fees + result.data.analysis.purchase_costs.other_costs)}</span>
                      <Separator className="col-span-2 my-1" />
                      <span className="font-semibold">Total Cash Required</span>
                      <span className="text-right font-bold text-[#1a2744]">{formatCurrency(result.data.analysis.purchase_costs.total_upfront_cost)}</span>
                    </div>
                  </div>

                  {/* Cash Flow */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-[#D4A84C]" />
                      Annual Cash Flow
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>Rental Income</span>
                      <span className="text-right font-medium text-emerald-600">+{formatCurrency(result.data.analysis.cash_flow.annual_rental_income)}</span>
                      <span>Loan Repayments</span>
                      <span className="text-right font-medium text-red-600">-{formatCurrency(result.data.analysis.cash_flow.annual_loan_payment)}</span>
                      <Separator className="col-span-2 my-1" />
                      <span className="font-semibold">Net Cash Flow</span>
                      <span className={`text-right font-bold ${result.data.analysis.cash_flow.net_annual_cashflow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatCurrency(result.data.analysis.cash_flow.net_annual_cashflow)}
                      </span>
                    </div>
                    <Badge 
                      variant={result.data.analysis.cash_flow.is_positively_geared ? "default" : "secondary"}
                      className="mt-3"
                    >
                      {result.data.analysis.cash_flow.is_positively_geared ? "Positively Geared" : "Negatively Geared"}
                    </Badge>
                  </div>

                  {/* 10-Year Summary */}
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-800">
                      <Target className="h-4 w-4" />
                      10-Year Projection
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-emerald-700">Capital Growth</span>
                      <span className="text-right font-medium text-emerald-800">{formatCurrency(result.data.analysis.summary["10_year_capital_growth"])}</span>
                      <span className="text-emerald-700">Rental Income</span>
                      <span className="text-right font-medium text-emerald-800">{formatCurrency(result.data.analysis.summary["10_year_rental_income"])}</span>
                      <Separator className="col-span-2 my-1" />
                      <span className="font-semibold text-emerald-700">Total Return</span>
                      <span className="text-right font-bold text-emerald-800">{formatCurrency(result.data.analysis.summary["10_year_total_return"])}</span>
                      <span className="font-semibold text-emerald-700">ROI</span>
                      <span className="text-right font-bold text-emerald-800">{result.data.analysis.summary["roi_10_year"]}%</span>
                    </div>
                  </div>
                </div>
              )}

              {result && result.type === "fund" && result.data.analysis && (
                <div className="space-y-6" data-testid="fund-result">
                  {/* Investment Details */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <PiggyBank className="h-4 w-4 text-[#D4A84C]" />
                      Investment Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>Initial Investment</span>
                      <span className="text-right font-medium">{formatCurrency(result.data.analysis.investment_details.initial_investment)}</span>
                      <span>Fund</span>
                      <span className="text-right font-medium truncate">{result.data.analysis.investment_details.fund_name}</span>
                      <span>Management Fee</span>
                      <span className="text-right font-medium">{result.data.analysis.investment_details.management_fee}% p.a.</span>
                    </div>
                  </div>

                  {/* Annual Analysis */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-[#D4A84C]" />
                      Expected Returns
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>Gross Return</span>
                      <span className="text-right font-medium">{result.data.analysis.annual_analysis.gross_return_rate}% p.a.</span>
                      <span>Net Return (after fees)</span>
                      <span className="text-right font-medium text-emerald-600">{result.data.analysis.annual_analysis.net_return_rate}% p.a.</span>
                      <span>Annual Distribution</span>
                      <span className="text-right font-medium">{formatCurrency(result.data.analysis.annual_analysis.annual_distribution)}</span>
                    </div>
                  </div>

                  {/* 10-Year Summary */}
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-800">
                      <Target className="h-4 w-4" />
                      10-Year Projection
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-emerald-700">Fund Value</span>
                      <span className="text-right font-medium text-emerald-800">{formatCurrency(result.data.analysis.summary["10_year_fund_value"])}</span>
                      <span className="text-emerald-700">Distributions Received</span>
                      <span className="text-right font-medium text-emerald-800">{formatCurrency(result.data.analysis.summary["10_year_distributions"])}</span>
                      <Separator className="col-span-2 my-1" />
                      <span className="font-semibold text-emerald-700">Total Value</span>
                      <span className="text-right font-bold text-emerald-800">{formatCurrency(result.data.analysis.summary["10_year_total_value"])}</span>
                      <span className="font-semibold text-emerald-700">ROI</span>
                      <span className="text-right font-bold text-emerald-800">{result.data.analysis.summary["10_year_roi"]}%</span>
                    </div>
                  </div>
                </div>
              )}

              {result && result.type === "stock" && result.data.analysis && (
                <div className="space-y-6" data-testid="stock-result">
                  {/* Trade Details */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#D4A84C]" />
                      Trade Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>Symbol</span>
                      <span className="text-right font-medium">{result.data.analysis.trade_details.symbol}</span>
                      <span>Shares</span>
                      <span className="text-right font-medium">{result.data.analysis.trade_details.shares}</span>
                      <span>Price</span>
                      <span className="text-right font-medium">${result.data.analysis.trade_details.price_per_share || result.data.analysis.trade_details.sale_price}</span>
                      <span>Brokerage</span>
                      <span className="text-right font-medium">{formatCurrency(result.data.analysis.trade_details.brokerage)}</span>
                      <Separator className="col-span-2 my-1" />
                      <span className="font-semibold">Total</span>
                      <span className="text-right font-bold">{formatCurrency(result.data.analysis.trade_details.total_cost || result.data.analysis.trade_details.net_proceeds)}</span>
                    </div>
                  </div>

                  {/* CGT Analysis (for sells) */}
                  {result.data.analysis.cgt_analysis && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        Capital Gains Tax
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-amber-700">Gross Gain</span>
                        <span className="text-right font-medium text-amber-800">{formatCurrency(result.data.analysis.cgt_analysis.gross_gain)}</span>
                        {result.data.analysis.cgt_analysis.cgt_discount_eligible && (
                          <>
                            <span className="text-amber-700">50% CGT Discount</span>
                            <span className="text-right font-medium text-emerald-600">-{formatCurrency(result.data.analysis.cgt_analysis.cgt_discount_applied)}</span>
                          </>
                        )}
                        <span className="text-amber-700">Taxable Gain</span>
                        <span className="text-right font-medium text-amber-800">{formatCurrency(result.data.analysis.cgt_analysis.taxable_gain)}</span>
                        <Separator className="col-span-2 my-1" />
                        <span className="font-semibold text-amber-700">Estimated Tax</span>
                        <span className="text-right font-bold text-amber-800">{formatCurrency(result.data.analysis.cgt_analysis.tax_payable)}</span>
                      </div>
                      {result.data.analysis.cgt_analysis.cgt_discount_eligible && (
                        <Badge className="mt-3 bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          50% CGT Discount Applied
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* 5-Year Projections (for buys) */}
                  {result.data.analysis.projections && (
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-800">
                        <Target className="h-4 w-4" />
                        5-Year Projections
                      </h4>
                      <div className="space-y-3">
                        {["conservative", "moderate", "aggressive"].map((scenario) => (
                          <div key={scenario} className="flex items-center justify-between">
                            <span className="text-sm text-emerald-700 capitalize">{scenario}</span>
                            <div className="text-right">
                              <span className="font-medium text-emerald-800">
                                {formatCurrency(result.data.analysis.summary[`5_year_${scenario}`]?.value || 0)}
                              </span>
                              <span className="text-xs text-emerald-600 ml-2">
                                (+{result.data.analysis.summary[`5_year_${scenario}`]?.gain_percent || 0}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TransactionModeler;
