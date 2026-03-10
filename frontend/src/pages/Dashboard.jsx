import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  PiggyBank, 
  Calculator,
  ArrowRight,
  DollarSign,
  Percent,
  BarChart3,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Home,
  Landmark,
  Briefcase
} from "lucide-react";
import { usePortfolio } from "@/App";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
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

const formatPercent = (value) => {
  return `${value.toFixed(1)}%`;
};

const COLORS = ['#0F392B', '#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { portfolio, recommendations } = usePortfolio();
  const [taxRates, setTaxRates] = useState(null);
  const [monteCarloData, setMonteCarloData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taxRatesRes, monteCarloRes] = await Promise.all([
          axios.get(`${API}/tax-rates`),
          axios.post(`${API}/analyze/monte-carlo`, null, {
            params: {
              initial_value: portfolio.investments.shares_value + portfolio.investments.etf_value,
              expected_return: 0.08,
              volatility: 0.15,
              years: 10,
              simulations: 1000
            }
          })
        ]);
        setTaxRates(taxRatesRes.data);
        setMonteCarloData(monteCarloRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [portfolio]);

  // Asset allocation for pie chart
  const assetAllocation = [
    { name: "Cash & Deposits", value: portfolio.investments.cash_savings + portfolio.investments.term_deposit_amount, color: COLORS[0] },
    { name: "Shares", value: portfolio.investments.shares_value, color: COLORS[1] },
    { name: "ETFs", value: portfolio.investments.etf_value, color: COLORS[2] },
    { name: "Bonds", value: portfolio.investments.bonds_value, color: COLORS[3] },
    { name: "Property", value: portfolio.investments.properties.reduce((sum, p) => sum + p.value, 0), color: COLORS[4] },
    { name: "Super", value: portfolio.investments.smsf_balance, color: COLORS[5] }
  ].filter(a => a.value > 0);

  // Projection chart data
  const projectionData = monteCarloData?.percentile_projections 
    ? monteCarloData.percentile_projections.years.map((year, i) => ({
        year: `Year ${year}`,
        median: monteCarloData.percentile_projections.p50[i],
        p25: monteCarloData.percentile_projections.p25[i],
        p75: monteCarloData.percentile_projections.p75[i]
      }))
    : [];

  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-[#D4AF37]",
    low: "bg-blue-500"
  };

  const typeIcons = {
    tax_optimization: Calculator,
    property: Building2,
    diversification: BarChart3,
    super: PiggyBank,
    cgt: TrendingUp,
    debt: Landmark
  };

  return (
    <Layout>
      <div className="space-y-8" data-testid="dashboard">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              Wheeler Family Portfolio
            </h1>
            <p className="text-muted-foreground mt-1">
              {formatCurrency(portfolio.personal.taxableIncome)} combined income • 2 investment properties
            </p>
          </div>
          <Button 
            data-testid="create-scenario-btn"
            onClick={() => navigate("/scenario-builder")}
            className="bg-[#0F392B] hover:bg-[#0F392B]/90"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Run Analysis
          </Button>
        </div>

        {/* Net Worth Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#0F392B] to-[#0F392B]/80 text-white">
            <CardContent className="p-6">
              <p className="text-sm text-white/80">Net Worth</p>
              <p className="text-3xl font-bold font-['Manrope'] mt-1">
                {formatCurrency(portfolio.summary.netWorth)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-[#10B981]">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">+12.4% this year</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold font-['Manrope'] mt-1">
                    {formatCurrency(portfolio.summary.totalAssets)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-[#10B981]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Debt</p>
                  <p className="text-2xl font-bold font-['Manrope'] mt-1">
                    {formatCurrency(portfolio.summary.totalDebt)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <div className="mt-2">
                <Progress value={(portfolio.summary.totalDebt / portfolio.summary.totalAssets) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {((portfolio.summary.totalDebt / portfolio.summary.totalAssets) * 100).toFixed(0)}% debt ratio
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Est. Tax (2024-25)</p>
                  <p className="text-2xl font-bold font-['Manrope'] mt-1">
                    {formatCurrency(portfolio.summary.totalTax)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-[#D4AF37]" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Effective rate: {((portfolio.summary.totalTax / portfolio.summary.annualIncome) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Allocation */}
          <Card data-testid="asset-allocation">
            <CardHeader>
              <CardTitle className="font-['Manrope'] flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
                Asset Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {assetAllocation.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Investment Projection */}
          <Card className="lg:col-span-2" data-testid="projection-chart">
            <CardHeader>
              <CardTitle className="font-['Manrope'] flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#10B981]" />
                10-Year Investment Projection
              </CardTitle>
              <CardDescription>
                Monte Carlo simulation • Shares & ETFs portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData}>
                    <defs>
                      <linearGradient id="colorMedian" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F392B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0F392B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [formatCurrency(value), '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="p75"
                      stroke="transparent"
                      fill="#D4AF37"
                      fillOpacity={0.2}
                      name="75th Percentile"
                    />
                    <Area
                      type="monotone"
                      dataKey="median"
                      stroke="#0F392B"
                      strokeWidth={2}
                      fill="url(#colorMedian)"
                      name="Median"
                    />
                    <Area
                      type="monotone"
                      dataKey="p25"
                      stroke="transparent"
                      fill="#0F392B"
                      fillOpacity={0.1}
                      name="25th Percentile"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {monteCarloData && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Median at Year 10</p>
                    <p className="text-lg font-bold text-[#0F392B]">
                      {formatCurrency(monteCarloData.final_value_median)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Probability of Loss</p>
                    <p className="text-lg font-bold text-destructive">
                      {monteCarloData.probability_of_loss.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Probability to Double</p>
                    <p className="text-lg font-bold text-[#10B981]">
                      {monteCarloData.probability_double.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Properties Overview */}
        <Card data-testid="properties-overview">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-['Manrope'] flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#D4AF37]" />
                Property Portfolio
              </CardTitle>
              <CardDescription>{portfolio.investments.properties.length} investment properties</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/property-portfolio")}>
              View Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.investments.properties.map((property) => {
                const annualInterest = property.mortgage_amount * (property.mortgage_rate / 100);
                const netRental = property.rental_income - annualInterest - property.annual_expenses;
                const isNegativelyGeared = netRental < 0;
                
                return (
                  <div 
                    key={property.property_id}
                    className="p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0F392B]/10 flex items-center justify-center">
                          <Home className="h-5 w-5 text-[#0F392B]" />
                        </div>
                        <div>
                          <p className="font-semibold">{property.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(property.value)}</p>
                        </div>
                      </div>
                      <Badge variant={isNegativelyGeared ? "secondary" : "default"} className={isNegativelyGeared ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-[#10B981]/10 text-[#10B981]"}>
                        {isNegativelyGeared ? "Negative Geared" : "Positive"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Rent p.a.</p>
                        <p className="font-semibold text-[#10B981]">{formatCurrency(property.rental_income)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mortgage</p>
                        <p className="font-semibold">{property.mortgage_rate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Net Cash Flow</p>
                        <p className={`font-semibold ${netRental >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                          {formatCurrency(netRental)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Investment Recommendations */}
        <Card data-testid="recommendations">
          <CardHeader>
            <CardTitle className="font-['Manrope'] flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[#D4AF37]" />
              Investment Recommendations
            </CardTitle>
            <CardDescription>Personalized suggestions based on your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const Icon = typeIcons[rec.type] || Lightbulb;
                return (
                  <div 
                    key={rec.id}
                    className="p-4 rounded-lg border border-border hover:border-[#0F392B]/30 transition-colors"
                    data-testid={`recommendation-${rec.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        rec.priority === 'high' ? 'bg-red-500/10' : 
                        rec.priority === 'medium' ? 'bg-[#D4AF37]/10' : 'bg-blue-500/10'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          rec.priority === 'high' ? 'text-red-500' : 
                          rec.priority === 'medium' ? 'text-[#D4AF37]' : 'text-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge variant="outline" className={`text-xs ${
                            rec.priority === 'high' ? 'border-red-500 text-red-500' : 
                            rec.priority === 'medium' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-blue-500 text-blue-500'
                          }`}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#10B981]">{rec.impact}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[#0F392B]">
                            {rec.action}
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card 
            className="cursor-pointer card-hover" 
            onClick={() => navigate("/tax-analysis")}
            data-testid="quick-tax-analysis"
          >
            <CardContent className="p-4 text-center">
              <Calculator className="h-8 w-8 mx-auto mb-2 text-[#0F392B]" />
              <p className="font-medium text-sm">Tax Analysis</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer card-hover" 
            onClick={() => navigate("/cgt-calculator")}
            data-testid="quick-cgt"
          >
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-[#D4AF37]" />
              <p className="font-medium text-sm">CGT Calculator</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer card-hover" 
            onClick={() => navigate("/property-portfolio")}
            data-testid="quick-property"
          >
            <CardContent className="p-4 text-center">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-[#10B981]" />
              <p className="font-medium text-sm">Properties</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer card-hover" 
            onClick={() => navigate("/smsf-optimizer")}
            data-testid="quick-smsf"
          >
            <CardContent className="p-4 text-center">
              <PiggyBank className="h-8 w-8 mx-auto mb-2 text-[#8B5CF6]" />
              <p className="font-medium text-sm">SMSF</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer card-hover" 
            onClick={() => navigate("/monte-carlo")}
            data-testid="quick-monte-carlo"
          >
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-[#3B82F6]" />
              <p className="font-medium text-sm">Projections</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer card-hover" 
            onClick={() => navigate("/loan-calculator")}
            data-testid="quick-loan"
          >
            <CardContent className="p-4 text-center">
              <Landmark className="h-8 w-8 mx-auto mb-2 text-[#EC4899]" />
              <p className="font-medium text-sm">Loans</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
