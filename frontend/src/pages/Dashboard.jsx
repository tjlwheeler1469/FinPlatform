import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  PiggyBank, 
  Calculator,
  Plus,
  ArrowRight,
  DollarSign,
  Percent,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
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

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [taxRates, setTaxRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickCalc, setQuickCalc] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scenariosRes, taxRatesRes] = await Promise.all([
          axios.get(`${API}/scenarios`, { withCredentials: true }),
          axios.get(`${API}/tax-rates`)
        ]);
        setScenarios(scenariosRes.data);
        setTaxRates(taxRatesRes.data);

        // Quick calculation for demo
        if (scenariosRes.data.length > 0) {
          const latestScenario = scenariosRes.data[0];
          const calcRes = await axios.post(`${API}/analyze/full-scenario`, latestScenario);
          setQuickCalc(calcRes.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sample projection data for demo
  const projectionData = quickCalc?.monte_carlo_projection?.percentile_projections || {
    years: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    p50: [100000, 107000, 114490, 122504, 131079, 140255, 150073, 160578, 171818, 183845, 196714]
  };

  const chartData = projectionData.years.map((year, i) => ({
    year: `Year ${year}`,
    median: projectionData.p50?.[i] || 100000 * Math.pow(1.07, year),
    p25: projectionData.p25?.[i] || 100000 * Math.pow(1.04, year),
    p75: projectionData.p75?.[i] || 100000 * Math.pow(1.10, year)
  }));

  const quickStats = [
    {
      title: "Total Scenarios",
      value: scenarios.length,
      icon: Calculator,
      color: "text-[#0F392B]",
      bgColor: "bg-[#0F392B]/10"
    },
    {
      title: "Tax-Free Threshold",
      value: formatCurrency(18200),
      icon: DollarSign,
      color: "text-[#10B981]",
      bgColor: "bg-[#10B981]/10"
    },
    {
      title: "Company Tax Rate",
      value: "25%",
      icon: Percent,
      color: "text-[#D4AF37]",
      bgColor: "bg-[#D4AF37]/10"
    },
    {
      title: "Medicare Levy",
      value: "2%",
      icon: PiggyBank,
      color: "text-[#3B82F6]",
      bgColor: "bg-[#3B82F6]/10"
    }
  ];

  return (
    <Layout>
      <div className="space-y-8" data-testid="dashboard">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your investment analysis and scenarios
            </p>
          </div>
          <Button 
            data-testid="create-scenario-btn"
            onClick={() => navigate("/scenario-builder")}
            className="bg-[#0F392B] hover:bg-[#0F392B]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={stat.title} className="card-hover" data-testid={`stat-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold font-['Manrope'] mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projection Chart */}
          <Card className="lg:col-span-2" data-testid="projection-chart">
            <CardHeader>
              <CardTitle className="font-['Manrope'] flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
                Investment Projection (10 Years)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
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
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Monte Carlo simulation showing median and probability ranges
              </p>
            </CardContent>
          </Card>

          {/* Tax Brackets Summary */}
          <Card data-testid="tax-brackets-card">
            <CardHeader>
              <CardTitle className="font-['Manrope'] flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#D4AF37]" />
                2024-25 Tax Brackets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {taxRates?.personal?.brackets?.map((bracket, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                    data-testid={`tax-bracket-${index}`}
                  >
                    <span className="text-sm text-muted-foreground">
                      {bracket.threshold ? formatCurrency(bracket.threshold) : "$190,001+"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {bracket.rate}%
                    </span>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate("/tax-analysis")}
                data-testid="view-tax-analysis-btn"
              >
                Calculate Your Tax
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Scenarios */}
        <Card data-testid="recent-scenarios">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-['Manrope']">Recent Scenarios</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/scenarios")}
              data-testid="view-all-scenarios-btn"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : scenarios.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No scenarios yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first investment scenario to get started
                </p>
                <Button 
                  onClick={() => navigate("/scenario-builder")}
                  className="bg-[#0F392B] hover:bg-[#0F392B]/90"
                  data-testid="create-first-scenario-btn"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Scenario
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {scenarios.slice(0, 5).map((scenario) => (
                  <div
                    key={scenario.scenario_id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/scenario-builder/${scenario.scenario_id}`)}
                    data-testid={`scenario-${scenario.scenario_id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        scenario.entity_type === 'company' 
                          ? 'bg-[#D4AF37]/10' 
                          : 'bg-[#0F392B]/10'
                      }`}>
                        {scenario.entity_type === 'company' 
                          ? <Building2 className="h-5 w-5 text-[#D4AF37]" />
                          : <PiggyBank className="h-5 w-5 text-[#0F392B]" />
                        }
                      </div>
                      <div>
                        <p className="font-semibold">{scenario.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {scenario.entity_type} • {formatCurrency(scenario.taxable_income || 0)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer card-hover" 
            onClick={() => navigate("/tax-analysis")}
            data-testid="quick-tax-analysis"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0F392B] flex items-center justify-center">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">Tax Calculator</p>
                <p className="text-sm text-muted-foreground">Personal & Company</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer card-hover" 
            onClick={() => navigate("/property-portfolio")}
            data-testid="quick-property"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#D4AF37] flex items-center justify-center">
                <Building2 className="h-6 w-6 text-[#0F392B]" />
              </div>
              <div>
                <p className="font-semibold">Property Analysis</p>
                <p className="text-sm text-muted-foreground">Negative Gearing</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer card-hover" 
            onClick={() => navigate("/monte-carlo")}
            data-testid="quick-monte-carlo"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#10B981] flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">Monte Carlo</p>
                <p className="text-sm text-muted-foreground">Projections</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer card-hover" 
            onClick={() => navigate("/loan-calculator")}
            data-testid="quick-loan"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#3B82F6] flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">Loan Calculator</p>
                <p className="text-sm text-muted-foreground">Variable Rates</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
