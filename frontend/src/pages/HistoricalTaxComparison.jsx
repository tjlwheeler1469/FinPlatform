import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calculator,
  Calendar,
  ArrowRight,
  Percent
} from "lucide-react";
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
  LineChart,
  Line
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

const HistoricalTaxComparison = ({ embedded = false }) => {
  const [taxableIncome, setTaxableIncome] = useState(120000);
  const [historicalRates, setHistoricalRates] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistoricalRates();
  }, []);

  const fetchHistoricalRates = async () => {
    try {
      const response = await axios.get(`${API}/tax-rates/historical`);
      setHistoricalRates(response.data);
    } catch (error) {
      console.error("Error fetching historical rates:", error);
    }
  };

  const compareRates = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/tax-comparison`, null, {
        params: {
          taxable_income: taxableIncome,
          years: ["2024-25", "2023-24", "2022-23", "2021-22", "2020-21"]
        },
        paramsSerializer: params => {
          return Object.entries(params)
            .map(([key, val]) => Array.isArray(val) 
              ? val.map(v => `${key}=${v}`).join('&')
              : `${key}=${val}`
            ).join('&');
        }
      });
      setComparison(response.data);
      toast.success("Comparison calculated");
    } catch (error) {
      console.error("Error comparing rates:", error);
      toast.error("Failed to compare rates");
    } finally {
      setLoading(false);
    }
  };

  const chartData = comparison?.comparisons?.map(c => ({
    year: c.year,
    tax: c.total_tax,
    netIncome: c.net_income,
    effectiveRate: c.effective_rate
  })) || [];

  const incomeScenarios = [50000, 80000, 120000, 150000, 200000, 250000];

  const content = (
      <div className="space-y-8" data-testid="historical-tax-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold  text-foreground">
            Historical Tax Comparison
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare tax rates across different financial years and see Stage 3 savings
          </p>
        </div>

        {/* Calculator */}
        <Card data-testid="tax-comparison-calculator">
          <CardHeader>
            <CardTitle className="">Compare Your Tax</CardTitle>
            <CardDescription>
              See how tax changes affect your take-home pay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="income">Taxable Income</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="income"
                    type="number"
                    value={taxableIncome}
                    onChange={(e) => setTaxableIncome(Number(e.target.value))}
                    className="pl-10"
                    data-testid="income-input"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[80000, 120000, 180000].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setTaxableIncome(amount)}
                    data-testid={`quick-amount-${amount}`}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
              <Button 
                onClick={compareRates}
                className="bg-[#1a2744] hover:bg-[#1a2744]/90"
                disabled={loading}
                data-testid="compare-btn"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Compare
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {comparison && (
          <>
            {/* Stage 3 Savings Highlight */}
            <Card className="bg-gradient-to-r from-[#1a2744] to-[#1a2744]/80 text-white" data-testid="savings-highlight">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div>
                    <p className="text-white/80 text-sm">Your Stage 3 Tax Cut Savings</p>
                    <p className="text-4xl font-bold">{formatCurrency(comparison.stage_3_savings)}</p>
                    <p className="text-white/60 text-sm mt-1">per year compared to 2023-24</p>
                  </div>
                  <div className="flex items-center gap-4 justify-center">
                    <div className="text-center">
                      <p className="text-white/60 text-sm">2023-24</p>
                      <p className="text-xl font-semibold">
                        {formatCurrency(comparison.comparisons[1]?.total_tax || 0)}
                      </p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-[#D4A84C]" />
                    <div className="text-center">
                      <p className="text-white/60 text-sm">2024-25</p>
                      <p className="text-xl font-semibold text-[#D4A84C]">
                        {formatCurrency(comparison.comparisons[0]?.total_tax || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-[#D4A84C] text-[#1a2744] text-lg px-4 py-2">
                      {comparison.savings_percentage.toFixed(1)}% Less Tax
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tax by Year Chart */}
              <Card data-testid="tax-chart">
                <CardHeader>
                  <CardTitle className="">Tax Payable by Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                        <YAxis 
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="tax" fill="#1a2744" name="Tax Payable" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Effective Rate Chart */}
              <Card data-testid="rate-chart">
                <CardHeader>
                  <CardTitle className="">Effective Tax Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                        <YAxis 
                          tickFormatter={(value) => `${value.toFixed(0)}%`}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          formatter={(value) => [`${value.toFixed(1)}%`, 'Effective Rate']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="effectiveRate" 
                          stroke="#D4A84C" 
                          strokeWidth={3}
                          dot={{ fill: '#D4A84C', r: 6 }}
                          name="Effective Rate"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison Table */}
            <Card data-testid="comparison-table">
              <CardHeader>
                <CardTitle className="">Year-by-Year Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Year</th>
                        <th className="text-right p-3 font-semibold">Income Tax</th>
                        <th className="text-right p-3 font-semibold">Medicare</th>
                        <th className="text-right p-3 font-semibold">Total Tax</th>
                        <th className="text-right p-3 font-semibold">Net Income</th>
                        <th className="text-right p-3 font-semibold">Effective Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.comparisons.map((c, index) => (
                        <tr key={c.year} className={`border-b ${index === 0 ? 'bg-[#1a2744]/5' : ''}`}>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {c.year}
                              {index === 0 && (
                                <Badge className="bg-[#D4A84C] text-[#1a2744]">Current</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{c.description}</p>
                          </td>
                          <td className="text-right p-3">{formatCurrency(c.income_tax)}</td>
                          <td className="text-right p-3">{formatCurrency(c.medicare_levy)}</td>
                          <td className="text-right p-3 font-semibold">{formatCurrency(c.total_tax)}</td>
                          <td className="text-right p-3 font-semibold text-[#10B981]">
                            {formatCurrency(c.net_income)}
                          </td>
                          <td className="text-right p-3">{c.effective_rate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Historical Brackets Reference */}
        {historicalRates && (
          <Card data-testid="brackets-reference">
            <CardHeader>
              <CardTitle className="">Tax Bracket Changes</CardTitle>
              <CardDescription>
                How marginal rates have changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(historicalRates.personal).slice(0, 3).map(([year, data]) => (
                  <div key={year} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{year}</h4>
                      {year === "2024-25" && (
                        <Badge className="bg-[#10B981]">Current</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      {data.brackets.map((b, i) => (
                        <div key={`item-${i}`} className="flex justify-between">
                          <span className="text-muted-foreground">
                            {b.to ? `$${b.from.toLocaleString()} - $${b.to.toLocaleString()}` : `$${b.from.toLocaleString()}+`}
                          </span>
                          <span className="font-semibold">{b.rate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default HistoricalTaxComparison;
