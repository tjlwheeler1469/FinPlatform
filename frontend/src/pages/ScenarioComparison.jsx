import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Scale, 
  DollarSign,
  Calculator,
  Plus,
  Trash2,
  Building2,
  User,
  TrendingUp,
  TrendingDown,
  Award,
  ArrowRight,
  ArrowLeftRight
} from "lucide-react";
import { usePortfolio } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
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

const COLORS = ['#0F392B', '#D4AF37', '#10B981', '#3B82F6', '#8B5CF6'];

// Demo scenarios for comparison
const DEMO_SCENARIOS = [
  {
    name: "Current Portfolio",
    entity_type: "personal",
    taxable_income: 185000,
    investments: {
      cash_savings: 75000,
      term_deposit_amount: 150000,
      term_deposit_rate: 4.8,
      shares_value: 320000,
      shares_dividend_yield: 4.2,
      franking_percentage: 85,
      bonds_value: 80000,
      bonds_yield: 5.2,
      etf_value: 145000,
      etf_yield: 3.5,
      smsf_balance: 580000,
      properties: [
        { value: 850000, rental_income: 36000, mortgage_amount: 510000 },
        { value: 720000, rental_income: 32000, mortgage_amount: 432000 }
      ]
    }
  },
  {
    name: "High Growth Strategy",
    entity_type: "personal",
    taxable_income: 185000,
    investments: {
      cash_savings: 30000,
      term_deposit_amount: 50000,
      term_deposit_rate: 4.8,
      shares_value: 500000,
      shares_dividend_yield: 3.0,
      franking_percentage: 70,
      bonds_value: 0,
      bonds_yield: 0,
      etf_value: 400000,
      etf_yield: 2.5,
      smsf_balance: 580000,
      properties: [
        { value: 1200000, rental_income: 48000, mortgage_amount: 900000 }
      ]
    }
  },
  {
    name: "Conservative Income",
    entity_type: "personal",
    taxable_income: 185000,
    investments: {
      cash_savings: 200000,
      term_deposit_amount: 400000,
      term_deposit_rate: 5.0,
      shares_value: 200000,
      shares_dividend_yield: 5.5,
      franking_percentage: 100,
      bonds_value: 300000,
      bonds_yield: 5.5,
      etf_value: 100000,
      etf_yield: 4.5,
      smsf_balance: 580000,
      properties: []
    }
  }
];

const ScenarioComparison = () => {
  const { portfolio } = usePortfolio();
  const [scenarios, setScenarios] = useState(DEMO_SCENARIOS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("comparison");

  const addScenario = () => {
    setScenarios([
      ...scenarios,
      {
        name: `Scenario ${scenarios.length + 1}`,
        entity_type: "personal",
        taxable_income: 150000,
        investments: {
          cash_savings: 50000,
          term_deposit_amount: 100000,
          term_deposit_rate: 4.5,
          shares_value: 200000,
          shares_dividend_yield: 4.0,
          franking_percentage: 85,
          bonds_value: 50000,
          bonds_yield: 5.0,
          etf_value: 100000,
          etf_yield: 3.5,
          smsf_balance: 300000,
          properties: []
        }
      }
    ]);
  };

  const removeScenario = (index) => {
    if (scenarios.length > 2) {
      setScenarios(scenarios.filter((_, i) => i !== index));
    }
  };

  const updateScenario = (index, field, value) => {
    const updated = [...scenarios];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index] = {
        ...updated[index],
        [parent]: {
          ...updated[index][parent],
          [child]: value
        }
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setScenarios(updated);
  };

  const compareScenarios = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/scenario-comparison`, {
        scenarios
      });
      setResult(response.data);
      toast.success("Comparison complete");
    } catch (error) {
      console.error("Error comparing scenarios:", error);
      toast.error("Failed to compare scenarios");
    } finally {
      setLoading(false);
    }
  };

  const netWorthChartData = result?.comparisons?.map((c, i) => ({
    name: c.scenario_name,
    assets: c.summary.total_assets,
    debt: c.summary.total_debt,
    netWorth: c.summary.net_worth
  })) || [];

  const incomeChartData = result?.comparisons?.map((c, i) => ({
    name: c.scenario_name,
    employment: c.income.employment_income,
    investment: c.income.investment_income,
    netIncome: c.tax.net_income
  })) || [];

  return (
    <Layout>
      <div className="space-y-8" data-testid="scenario-comparison-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              Scenario Comparison
            </h1>
            <p className="text-muted-foreground mt-1">
              Compare multiple investment strategies side by side
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={addScenario} disabled={scenarios.length >= 5}>
              <Plus className="h-4 w-4 mr-2" />
              Add Scenario
            </Button>
            <Button 
              onClick={compareScenarios}
              className="bg-[#0F392B] hover:bg-[#0F392B]/90"
              disabled={loading}
            >
              <Scale className="h-4 w-4 mr-2" />
              Compare
            </Button>
          </div>
        </div>

        {/* Scenario Input Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario, index) => (
            <Card key={index} data-testid={`scenario-input-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                    >
                      {scenario.entity_type === 'company' 
                        ? <Building2 className="h-4 w-4" style={{ color: COLORS[index % COLORS.length] }} />
                        : <User className="h-4 w-4" style={{ color: COLORS[index % COLORS.length] }} />
                      }
                    </div>
                    <Input
                      value={scenario.name}
                      onChange={(e) => updateScenario(index, 'name', e.target.value)}
                      className="font-semibold border-0 p-0 h-auto focus-visible:ring-0 w-32"
                    />
                  </div>
                  {scenarios.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeScenario(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Taxable Income</Label>
                  <Input
                    type="number"
                    value={scenario.taxable_income}
                    onChange={(e) => updateScenario(index, 'taxable_income', Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Cash</Label>
                    <Input
                      type="number"
                      value={scenario.investments.cash_savings}
                      onChange={(e) => updateScenario(index, 'investments.cash_savings', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Term Deposits</Label>
                    <Input
                      type="number"
                      value={scenario.investments.term_deposit_amount}
                      onChange={(e) => updateScenario(index, 'investments.term_deposit_amount', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Shares</Label>
                    <Input
                      type="number"
                      value={scenario.investments.shares_value}
                      onChange={(e) => updateScenario(index, 'investments.shares_value', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ETFs</Label>
                    <Input
                      type="number"
                      value={scenario.investments.etf_value}
                      onChange={(e) => updateScenario(index, 'investments.etf_value', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Bonds</Label>
                    <Input
                      type="number"
                      value={scenario.investments.bonds_value}
                      onChange={(e) => updateScenario(index, 'investments.bonds_value', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Super</Label>
                    <Input
                      type="number"
                      value={scenario.investments.smsf_balance}
                      onChange={(e) => updateScenario(index, 'investments.smsf_balance', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Properties: {scenario.investments.properties?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    Total: {formatCurrency(
                      scenario.investments.cash_savings +
                      scenario.investments.term_deposit_amount +
                      scenario.investments.shares_value +
                      scenario.investments.etf_value +
                      scenario.investments.bonds_value +
                      scenario.investments.smsf_balance +
                      (scenario.investments.properties?.reduce((s, p) => s + (p.value || 0), 0) || 0)
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Best For Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[#0F392B] text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-[#D4AF37]" />
                    <p className="text-sm text-white/80">Best Net Worth</p>
                  </div>
                  <p className="text-lg font-bold">{result.best_for.net_worth}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#10B981] text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5" />
                    <p className="text-sm text-white/80">Best Income</p>
                  </div>
                  <p className="text-lg font-bold">{result.best_for.net_income}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#D4AF37] text-[#0F392B]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-5 w-5" />
                    <p className="text-sm opacity-80">Tax Efficient</p>
                  </div>
                  <p className="text-lg font-bold">{result.best_for.tax_efficiency}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#3B82F6] text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5" />
                    <p className="text-sm text-white/80">Lowest Risk</p>
                  </div>
                  <p className="text-lg font-bold">{result.best_for.lowest_risk}</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="differences">Differences</TabsTrigger>
              </TabsList>

              <TabsContent value="comparison" className="space-y-6">
                {/* Comparison Table */}
                <Card data-testid="comparison-table">
                  <CardHeader>
                    <CardTitle className="font-['Manrope']">Side-by-Side Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Metric</th>
                            {result.comparisons.map((c, i) => (
                              <th key={i} className="text-right p-3 font-semibold">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  {c.scenario_name}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b bg-muted/30">
                            <td className="p-3 font-semibold">Net Worth</td>
                            {result.comparisons.map((c, i) => (
                              <td key={i} className="text-right p-3 font-bold">{formatCurrency(c.summary.net_worth)}</td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-muted-foreground">Total Assets</td>
                            {result.comparisons.map((c, i) => (
                              <td key={i} className="text-right p-3">{formatCurrency(c.summary.total_assets)}</td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-muted-foreground">Total Debt</td>
                            {result.comparisons.map((c, i) => (
                              <td key={i} className="text-right p-3 text-destructive">{formatCurrency(c.summary.total_debt)}</td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-muted-foreground">Debt to Equity</td>
                            {result.comparisons.map((c, i) => (
                              <td key={i} className="text-right p-3">{c.summary.debt_to_equity.toFixed(2)}</td>
                            ))}
                          </tr>
                          <tr className="border-b bg-muted/30">
                            <td className="p-3 font-semibold">Total Income</td>
                            {result.comparisons.map((c, i) => (
                              <td key={i} className="text-right p-3 font-bold">{formatCurrency(c.income.total_income)}</td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-muted-foreground">Employment</td>
                            {result.comparisons.map((c, i) => (
                              <td key={i} className="text-right p-3">{formatCurrency(c.income.employment_income)}</td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-muted-foreground">Investment Income</td>
                            {result.comparisons.map((c, i) => (
                              <td key={i} className="text-right p-3 text-[#10B981]">{formatCurrency(c.income.investment_income)}</td>
                            ))}
                          </tr>
                          <tr className="border-b bg-muted/30">
                            <td className="p-3 font-semibold">Total Tax</td>
                            {result.comparisons.map((c, i) => (
                              <td key={i} className="text-right p-3 font-bold text-[#D4AF37]">{formatCurrency(c.tax.total_tax)}</td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 text-muted-foreground">Effective Rate</td>
                            {result.comparisons.map((c, i) => (
                              <td key={i} className="text-right p-3">{c.tax.effective_rate.toFixed(1)}%</td>
                            ))}
                          </tr>
                          <tr className="bg-[#0F392B]/5">
                            <td className="p-3 font-semibold">Net Income</td>
                            {result.comparisons.map((c, i) => (
                              <td key={i} className="text-right p-3 font-bold text-[#10B981]">{formatCurrency(c.tax.net_income)}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="charts" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card data-testid="net-worth-chart">
                    <CardHeader>
                      <CardTitle className="font-['Manrope']">Net Worth Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={netWorthChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                            <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Legend />
                            <Bar dataKey="assets" fill="#10B981" name="Assets" />
                            <Bar dataKey="debt" fill="#EF4444" name="Debt" />
                            <Bar dataKey="netWorth" fill="#0F392B" name="Net Worth" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="income-chart">
                    <CardHeader>
                      <CardTitle className="font-['Manrope']">Income Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={incomeChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                            <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Legend />
                            <Bar dataKey="employment" fill="#0F392B" name="Employment" />
                            <Bar dataKey="investment" fill="#D4AF37" name="Investment" />
                            <Bar dataKey="netIncome" fill="#10B981" name="Net Income" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="differences" className="space-y-6">
                {result.differences.length > 0 && (
                  <Card data-testid="differences-card">
                    <CardHeader>
                      <CardTitle className="font-['Manrope'] flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5 text-[#D4AF37]" />
                        Differences vs {result.differences[0].compared_to}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {result.differences.map((diff, index) => (
                          <div key={index} className="p-4 rounded-lg border border-border">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(index + 1) % COLORS.length] }} />
                              {diff.scenario}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Net Worth</p>
                                <p className={`text-lg font-bold ${diff.net_worth_diff >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                                  {diff.net_worth_diff >= 0 ? '+' : ''}{formatCurrency(diff.net_worth_diff)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Income</p>
                                <p className={`text-lg font-bold ${diff.income_diff >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                                  {diff.income_diff >= 0 ? '+' : ''}{formatCurrency(diff.income_diff)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Tax</p>
                                <p className={`text-lg font-bold ${diff.tax_diff <= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                                  {diff.tax_diff >= 0 ? '+' : ''}{formatCurrency(diff.tax_diff)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Net Income</p>
                                <p className={`text-lg font-bold ${diff.net_income_diff >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                                  {diff.net_income_diff >= 0 ? '+' : ''}{formatCurrency(diff.net_income_diff)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Scenarios Compared</p>
                    <p className="text-2xl font-bold">{result.summary.scenarios_compared}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Highest Net Worth</p>
                    <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(result.summary.highest_net_worth)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Worth Range</p>
                    <p className="text-2xl font-bold text-[#D4AF37]">{formatCurrency(result.summary.net_worth_range)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ScenarioComparison;
