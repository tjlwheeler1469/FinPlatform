import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp,
  DollarSign,
  Calculator,
  Repeat,
  Banknote,
  BarChart3,
  Lightbulb,
  CheckCircle,
  Info
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const HISTORICAL_PRESETS = {
  asx_5yr: { label: "ASX 200 (5yr avg)", rate: 3.2 },
  asx_10yr: { label: "ASX 200 (10yr avg)", rate: 2.8 },
  banks_5yr: { label: "Big 4 Banks (5yr)", rate: 2.5 },
  banks_10yr: { label: "Big 4 Banks (10yr)", rate: 2.2 },
  resources_5yr: { label: "Resources (5yr)", rate: 4.5 },
  resources_10yr: { label: "Resources (10yr)", rate: 3.8 },
  reits_5yr: { label: "A-REITs (5yr)", rate: 3.5 },
  reits_10yr: { label: "A-REITs (10yr)", rate: 3.0 }
};

const DividendReinvestment = () => {
  const [initialInvestment, setInitialInvestment] = useState(100000);
  const [dividendYield, setDividendYield] = useState(4.5);
  const [capitalGrowth, setCapitalGrowth] = useState(5.0);
  const [dividendGrowth, setDividendGrowth] = useState(3.0);
  const [years, setYears] = useState(20);
  const [taxRate, setTaxRate] = useState(30);
  const [frankingPct, setFrankingPct] = useState(85);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("comparison");

  useEffect(() => {
    document.title = "Dividend Reinvestment | WealthOptimizer AU";
  }, []);

  const applyHistoricalRate = (key) => {
    const preset = HISTORICAL_PRESETS[key];
    if (preset) {
      setDividendGrowth(preset.rate);
      toast.success(`Applied ${preset.label}: ${preset.rate}% dividend growth`);
    }
  };

  const calculateReinvestment = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/dividend-reinvestment`, {
        initial_investment: initialInvestment,
        dividend_yield: dividendYield / 100,
        capital_growth_rate: capitalGrowth / 100,
        dividend_growth_rate: dividendGrowth / 100,
        years: years,
        reinvest_dividends: true,
        tax_rate: taxRate / 100,
        franking_percentage: frankingPct / 100
      });
      setResult(response.data);
      toast.success("Calculation complete");
    } catch (error) {
      console.error("Error calculating:", error);
      toast.error("Failed to calculate reinvestment");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const comparisonChartData = result ? result.reinvest_projection.map((r, i) => ({
    year: r.year,
    reinvest: r.portfolio_value,
    cash: result.cash_projection[i].total_wealth
  })) : [];

  const dividendChartData = result ? result.reinvest_projection.map((r, i) => ({
    year: r.year,
    reinvestDividend: r.dividend_paid,
    cashDividend: result.cash_projection[i].dividend_received
  })) : [];

  return (
    <Layout>
      <div className="space-y-8" data-testid="dividend-reinvestment-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold  text-foreground">
            Dividend Reinvestment Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare reinvesting dividends vs taking cash over time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <Card className="lg:col-span-1" data-testid="drip-inputs">
            <CardHeader>
              <CardTitle className="">Investment Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Initial Investment */}
              <div className="space-y-2">
                <Label>Initial Investment</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={initialInvestment}
                    onChange={(e) => setInitialInvestment(Number(e.target.value))}
                    className="pl-10"
                    data-testid="initial-investment-input"
                  />
                </div>
              </div>

              {/* Dividend Yield */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Dividend Yield</Label>
                  <span className="text-sm font-semibold">{dividendYield}%</span>
                </div>
                <Slider
                  value={[dividendYield]}
                  onValueChange={(v) => setDividendYield(v[0])}
                  min={1}
                  max={10}
                  step={0.1}
                />
              </div>

              {/* Capital Growth */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Capital Growth Rate</Label>
                  <span className="text-sm font-semibold">{capitalGrowth}%</span>
                </div>
                <Slider
                  value={[capitalGrowth]}
                  onValueChange={(v) => setCapitalGrowth(v[0])}
                  min={0}
                  max={15}
                  step={0.5}
                />
              </div>

              {/* Dividend Growth with Historical Options */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Dividend Growth Rate</Label>
                  <span className="text-sm font-semibold">{dividendGrowth}%</span>
                </div>
                <Slider
                  value={[dividendGrowth]}
                  onValueChange={(v) => setDividendGrowth(v[0])}
                  min={0}
                  max={8}
                  step={0.1}
                />
                
                {/* Historical Presets */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Historical Benchmarks</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyHistoricalRate("asx_5yr")}
                      className="text-xs h-8"
                    >
                      ASX 5yr: 3.2%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyHistoricalRate("asx_10yr")}
                      className="text-xs h-8"
                    >
                      ASX 10yr: 2.8%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyHistoricalRate("banks_5yr")}
                      className="text-xs h-8"
                    >
                      Banks 5yr: 2.5%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyHistoricalRate("resources_5yr")}
                      className="text-xs h-8"
                    >
                      Resources: 4.5%
                    </Button>
                  </div>
                </div>
              </div>

              {/* Investment Horizon */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Investment Horizon</Label>
                  <span className="text-sm font-semibold">{years} years</span>
                </div>
                <Slider
                  value={[years]}
                  onValueChange={(v) => setYears(v[0])}
                  min={5}
                  max={40}
                  step={1}
                />
              </div>

              {/* Tax Rate */}
              <div className="space-y-2">
                <Label>Marginal Tax Rate</Label>
                <Select value={taxRate.toString()} onValueChange={(v) => setTaxRate(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16">16%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="37">37%</SelectItem>
                    <SelectItem value="45">45%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Franking */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Franking Percentage</Label>
                  <span className="text-sm font-semibold">{frankingPct}%</span>
                </div>
                <Slider
                  value={[frankingPct]}
                  onValueChange={(v) => setFrankingPct(v[0])}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <Button 
                onClick={calculateReinvestment}
                className="w-full bg-[#1a2744] hover:bg-[#1a2744]/90"
                disabled={loading}
                data-testid="calculate-btn"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-[#1a2744] text-white">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Repeat className="h-4 w-4" />
                        <p className="text-sm text-white/80">Reinvest Final</p>
                      </div>
                      <p className="text-xl font-bold">
                        {formatCurrency(result.comparison.final_reinvest_value)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Cash Total</p>
                      </div>
                      <p className="text-xl font-bold">
                        {formatCurrency(result.comparison.final_cash_total)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Reinvest Advantage</p>
                      <p className="text-xl font-bold text-[#10B981]">
                        +{formatCurrency(result.comparison.reinvest_advantage)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        +{result.comparison.reinvest_advantage_pct}% more
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Reinvest CAGR</p>
                      <p className="text-xl font-bold text-[#D4A84C]">
                        {result.comparison.reinvest_cagr}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        vs {result.comparison.cash_cagr}% cash
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs for different views */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="comparison">Comparison</TabsTrigger>
                    <TabsTrigger value="growth">Growth</TabsTrigger>
                    <TabsTrigger value="dividends">Dividends</TabsTrigger>
                  </TabsList>

                  <TabsContent value="comparison" className="space-y-6">
                    {/* Main Comparison Chart */}
                    <Card data-testid="comparison-chart">
                      <CardHeader>
                        <CardTitle className="">Wealth Comparison</CardTitle>
                        <CardDescription>Reinvest vs Cash dividends over {years} years</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={comparisonChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="year" 
                                stroke="hsl(var(--muted-foreground))"
                                tickFormatter={(v) => `Yr ${v}`}
                              />
                              <YAxis 
                                tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                                stroke="hsl(var(--muted-foreground))"
                              />
                              <Tooltip formatter={(v) => formatCurrency(v)} />
                              <Legend />
                              <Area 
                                type="monotone" 
                                dataKey="reinvest" 
                                name="Reinvest Dividends"
                                stroke="#1a2744" 
                                fill="#1a2744" 
                                fillOpacity={0.3}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="cash" 
                                name="Take Cash"
                                stroke="#D4A84C" 
                                fill="#D4A84C" 
                                fillOpacity={0.3}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="growth" className="space-y-6">
                    {/* Growth Chart */}
                    <Card data-testid="growth-chart">
                      <CardHeader>
                        <CardTitle className="">Portfolio Growth</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <LineChart data={comparisonChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="year"
                                stroke="hsl(var(--muted-foreground))"
                              />
                              <YAxis 
                                tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                                stroke="hsl(var(--muted-foreground))"
                              />
                              <Tooltip formatter={(v) => formatCurrency(v)} />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="reinvest" 
                                name="With Reinvestment"
                                stroke="#1a2744" 
                                strokeWidth={3}
                                dot={false}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="cash" 
                                name="Cash Strategy"
                                stroke="#D4A84C" 
                                strokeWidth={3}
                                dot={false}
                                strokeDasharray="5 5"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="dividends" className="space-y-6">
                    {/* Dividend Chart */}
                    <Card data-testid="dividend-chart">
                      <CardHeader>
                        <CardTitle className="">Annual Dividends</CardTitle>
                        <CardDescription>Dividend amounts growing over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={dividendChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                              <YAxis 
                                tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                                stroke="hsl(var(--muted-foreground))"
                              />
                              <Tooltip formatter={(v) => formatCurrency(v)} />
                              <Legend />
                              <Bar dataKey="reinvestDividend" name="Reinvest (Larger Base)" fill="#1a2744" />
                              <Bar dataKey="cashDividend" name="Cash (Net Received)" fill="#D4A84C" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Final Comparison Table */}
                <Card data-testid="final-comparison">
                  <CardHeader>
                    <CardTitle className="">Final Comparison at Year {years}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Metric</th>
                            <th className="text-right p-3 font-semibold">
                              <div className="flex items-center justify-end gap-2">
                                <Repeat className="h-4 w-4 text-[#1a2744]" />
                                Reinvest
                              </div>
                            </th>
                            <th className="text-right p-3 font-semibold">
                              <div className="flex items-center justify-end gap-2">
                                <Banknote className="h-4 w-4 text-[#D4A84C]" />
                                Take Cash
                              </div>
                            </th>
                            <th className="text-right p-3 font-semibold">Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-3 text-muted-foreground">Initial Investment</td>
                            <td className="text-right p-3">{formatCurrency(result.comparison.initial_investment)}</td>
                            <td className="text-right p-3">{formatCurrency(result.comparison.initial_investment)}</td>
                            <td className="text-right p-3">-</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-muted-foreground">Portfolio Value</td>
                            <td className="text-right p-3 font-medium">{formatCurrency(result.comparison.final_reinvest_value)}</td>
                            <td className="text-right p-3 font-medium">{formatCurrency(result.comparison.final_cash_portfolio)}</td>
                            <td className="text-right p-3 text-[#10B981]">
                              +{formatCurrency(result.comparison.final_reinvest_value - result.comparison.final_cash_portfolio)}
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-muted-foreground">Cash Received</td>
                            <td className="text-right p-3">$0 (reinvested)</td>
                            <td className="text-right p-3">{formatCurrency(result.comparison.final_cash_dividends)}</td>
                            <td className="text-right p-3 text-destructive">
                              -{formatCurrency(result.comparison.final_cash_dividends)}
                            </td>
                          </tr>
                          <tr className="border-b bg-muted/30">
                            <td className="p-3 font-semibold">Total Wealth</td>
                            <td className="text-right p-3 font-bold text-[#10B981]">{formatCurrency(result.comparison.final_reinvest_value)}</td>
                            <td className="text-right p-3 font-bold">{formatCurrency(result.comparison.final_cash_total)}</td>
                            <td className="text-right p-3 font-bold text-[#10B981]">
                              +{formatCurrency(result.comparison.reinvest_advantage)}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 text-muted-foreground">CAGR</td>
                            <td className="text-right p-3 font-medium">{result.comparison.reinvest_cagr}%</td>
                            <td className="text-right p-3 font-medium">{result.comparison.cash_cagr}%</td>
                            <td className="text-right p-3 text-[#10B981]">
                              +{(result.comparison.reinvest_cagr - result.comparison.cash_cagr).toFixed(2)}%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card data-testid="recommendations">
                  <CardHeader>
                    <CardTitle className=" flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-[#D4A84C]" />
                      Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <div key={`item-${index}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-[500px]">
                <CardContent className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Repeat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Compare Dividend Strategies</p>
                    <p className="text-muted-foreground max-w-md">
                      Set your investment parameters and see the long-term impact 
                      of reinvesting dividends vs taking cash
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg  flex items-center gap-2">
                <Info className="h-5 w-5 text-[#1a2744]" />
                What is DRIP?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                A Dividend Reinvestment Plan (DRP) automatically uses your dividends 
                to purchase additional shares instead of paying cash. Many ASX companies 
                offer DRPs with no brokerage fees.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg  flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#10B981]" />
                Compounding Power
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Reinvesting dividends creates a compounding effect where your dividends 
                earn dividends. Over long periods (20+ years), this can dramatically 
                increase total returns.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg  flex items-center gap-2">
                <Banknote className="h-5 w-5 text-[#D4A84C]" />
                When to Take Cash
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Cash dividends make sense when you need income, want to rebalance 
                to different investments, or believe the stock is overvalued. 
                Retirees often prefer cash for living expenses.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DividendReinvestment;
