import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  DollarSign,
  Calculator,
  Plus,
  Trash2,
  Home,
  TrendingUp,
  Percent,
  Award,
  BarChart3
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
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

const PropertyComparison = () => {
  const { portfolio } = usePortfolio();
  const [properties, setProperties] = useState(portfolio.investments.properties.map(p => ({...p})));
  const [marginalRate, setMarginalRate] = useState(30);
  const [horizon, setHorizon] = useState(10);
  const [growthRate, setGrowthRate] = useState(4);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const addProperty = () => {
    setProperties([
      ...properties,
      {
        property_id: `prop_${Date.now()}`,
        name: `Property ${properties.length + 1}`,
        value: 600000,
        rental_income: 28000,
        mortgage_amount: 400000,
        mortgage_rate: 6.5,
        annual_expenses: 6000,
        depreciation_building: 5000,
        depreciation_fixtures: 2000
      }
    ]);
  };

  const removeProperty = (index) => {
    if (properties.length > 1) {
      setProperties(properties.filter((_, i) => i !== index));
    }
  };

  const updateProperty = (index, field, value) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    setProperties(updated);
  };

  const compareProperties = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/property-comparison`, {
        properties,
        marginal_tax_rate: marginalRate / 100,
        investment_horizon_years: horizon,
        expected_capital_growth: growthRate / 100
      });
      setResult(response.data);
      toast.success("Comparison complete");
    } catch (error) {
      console.error("Error comparing properties:", error);
      toast.error("Failed to compare properties");
    } finally {
      setLoading(false);
    }
  };

  const yieldChartData = result?.comparisons?.map((c, i) => ({
    name: c.property_name,
    grossYield: c.metrics.gross_yield,
    netYield: c.metrics.net_yield,
    returnOnEquity: c.returns.return_on_equity
  })) || [];

  const cashFlowChartData = result?.comparisons?.map((c, i) => ({
    name: c.property_name,
    income: c.cash_flow.annual_income,
    expenses: c.cash_flow.annual_interest + c.cash_flow.annual_expenses,
    cashFlow: c.cash_flow.cash_flow_after_tax
  })) || [];

  const radarData = result?.comparisons?.map((c, i) => ({
    property: c.property_name,
    yield: c.scores.yield_score,
    cashFlow: Math.max(0, c.scores.cash_flow_score),
    growth: c.scores.growth_potential,
    safety: c.scores.risk_score
  })) || [];

  return (
    <Layout>
      <div className="space-y-8" data-testid="property-comparison-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              Property Comparison
            </h1>
            <p className="text-muted-foreground mt-1">
              Compare investment properties side by side
            </p>
          </div>
          <Button variant="outline" onClick={addProperty}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Parameters */}
        <Card data-testid="parameters">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Marginal Tax Rate</Label>
                  <span className="text-sm font-semibold">{marginalRate}%</span>
                </div>
                <Slider
                  value={[marginalRate]}
                  onValueChange={(v) => setMarginalRate(v[0])}
                  min={16}
                  max={45}
                  step={1}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Investment Horizon</Label>
                  <span className="text-sm font-semibold">{horizon} years</span>
                </div>
                <Slider
                  value={[horizon]}
                  onValueChange={(v) => setHorizon(v[0])}
                  min={1}
                  max={30}
                  step={1}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Expected Growth</Label>
                  <span className="text-sm font-semibold">{growthRate}% p.a.</span>
                </div>
                <Slider
                  value={[growthRate]}
                  onValueChange={(v) => setGrowthRate(v[0])}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property, index) => (
            <Card key={property.property_id} data-testid={`property-input-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}>
                      <Home className="h-4 w-4" style={{ color: COLORS[index % COLORS.length] }} />
                    </div>
                    <Input
                      value={property.name}
                      onChange={(e) => updateProperty(index, 'name', e.target.value)}
                      className="font-semibold border-0 p-0 h-auto focus-visible:ring-0 w-32"
                    />
                  </div>
                  {properties.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeProperty(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Value</Label>
                    <Input
                      type="number"
                      value={property.value}
                      onChange={(e) => updateProperty(index, 'value', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rent p.a.</Label>
                    <Input
                      type="number"
                      value={property.rental_income}
                      onChange={(e) => updateProperty(index, 'rental_income', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Mortgage</Label>
                    <Input
                      type="number"
                      value={property.mortgage_amount}
                      onChange={(e) => updateProperty(index, 'mortgage_amount', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rate %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={property.mortgage_rate}
                      onChange={(e) => updateProperty(index, 'mortgage_rate', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Expenses p.a.</Label>
                    <Input
                      type="number"
                      value={property.annual_expenses}
                      onChange={(e) => updateProperty(index, 'annual_expenses', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Depreciation</Label>
                    <Input
                      type="number"
                      value={(property.depreciation_building || 0) + (property.depreciation_fixtures || 0)}
                      onChange={(e) => updateProperty(index, 'depreciation_building', Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button 
          onClick={compareProperties}
          className="w-full bg-[#0F392B] hover:bg-[#0F392B]/90"
          disabled={loading}
          data-testid="compare-btn"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Compare Properties
        </Button>

        {/* Results */}
        {result && (
          <>
            {/* Best For Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#0F392B] text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-[#D4AF37]" />
                    <p className="text-sm text-white/80">Best for Yield</p>
                  </div>
                  <p className="text-xl font-bold">{result.recommendations.best_for_yield}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#10B981] text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5" />
                    <p className="text-sm text-white/80">Best for Cash Flow</p>
                  </div>
                  <p className="text-xl font-bold">{result.recommendations.best_for_cash_flow}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#D4AF37] text-[#0F392B]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5" />
                    <p className="text-sm opacity-80">Best for Growth</p>
                  </div>
                  <p className="text-xl font-bold">{result.recommendations.best_for_growth}</p>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Table */}
            <Card data-testid="comparison-table">
              <CardHeader>
                <CardTitle className="font-['Manrope']">Detailed Comparison</CardTitle>
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
                              {c.property_name}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground">Value</td>
                        {result.comparisons.map((c, i) => (
                          <td key={i} className="text-right p-3 font-medium">{formatCurrency(c.metrics.current_value)}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground">Gross Yield</td>
                        {result.comparisons.map((c, i) => (
                          <td key={i} className="text-right p-3 font-medium">{c.metrics.gross_yield}%</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground">Net Yield</td>
                        {result.comparisons.map((c, i) => (
                          <td key={i} className="text-right p-3 font-medium">{c.metrics.net_yield}%</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground">LVR</td>
                        {result.comparisons.map((c, i) => (
                          <td key={i} className="text-right p-3 font-medium">{c.metrics.lvr}%</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground">Cash Flow (After Tax)</td>
                        {result.comparisons.map((c, i) => (
                          <td key={i} className={`text-right p-3 font-medium ${c.cash_flow.cash_flow_after_tax >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                            {formatCurrency(c.cash_flow.cash_flow_after_tax)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground">Tax Benefit</td>
                        {result.comparisons.map((c, i) => (
                          <td key={i} className="text-right p-3 font-medium text-[#D4AF37]">{formatCurrency(c.cash_flow.tax_benefit)}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground">Return on Equity</td>
                        {result.comparisons.map((c, i) => (
                          <td key={i} className="text-right p-3 font-medium">{c.returns.return_on_equity}%</td>
                        ))}
                      </tr>
                      <tr className="border-b bg-muted/30">
                        <td className="p-3 font-semibold">Projected Value ({horizon}yr)</td>
                        {result.comparisons.map((c, i) => (
                          <td key={i} className="text-right p-3 font-bold text-[#10B981]">{formatCurrency(c.returns.projected_value)}</td>
                        ))}
                      </tr>
                      <tr className="bg-muted/30">
                        <td className="p-3 font-semibold">Total Return ({horizon}yr)</td>
                        {result.comparisons.map((c, i) => (
                          <td key={i} className="text-right p-3 font-bold">{formatCurrency(c.returns.total_return)}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="yield-chart">
                <CardHeader>
                  <CardTitle className="font-['Manrope']">Yield Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yieldChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Legend />
                        <Bar dataKey="grossYield" fill="#0F392B" name="Gross Yield" />
                        <Bar dataKey="netYield" fill="#D4AF37" name="Net Yield" />
                        <Bar dataKey="returnOnEquity" fill="#10B981" name="ROE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="radar-chart">
                <CardHeader>
                  <CardTitle className="font-['Manrope']">Property Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { metric: "Yield", ...Object.fromEntries(radarData.map(r => [r.property, r.yield])) },
                        { metric: "Cash Flow", ...Object.fromEntries(radarData.map(r => [r.property, r.cashFlow])) },
                        { metric: "Growth", ...Object.fromEntries(radarData.map(r => [r.property, r.growth])) },
                        { metric: "Safety", ...Object.fromEntries(radarData.map(r => [r.property, r.safety])) }
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        {radarData.map((r, i) => (
                          <Radar
                            key={r.property}
                            name={r.property}
                            dataKey={r.property}
                            stroke={COLORS[i % COLORS.length]}
                            fill={COLORS[i % COLORS.length]}
                            fillOpacity={0.2}
                          />
                        ))}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <Card data-testid="portfolio-summary">
              <CardHeader>
                <CardTitle className="font-['Manrope']">Portfolio Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-bold">{formatCurrency(result.summary.total_value)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Total Equity</p>
                    <p className="text-xl font-bold text-[#10B981]">{formatCurrency(result.summary.total_equity)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Total Rent p.a.</p>
                    <p className="text-xl font-bold">{formatCurrency(result.summary.total_rental_income)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Avg. LVR</p>
                    <p className="text-xl font-bold">{result.summary.average_lvr.toFixed(1)}%</p>
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

export default PropertyComparison;
