import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  ArrowUpDown,
  Shield,
  Target,
  Percent,
  Activity
} from "lucide-react";
import { usePortfolio } from "@/App";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

const formatCompact = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const PortfolioAnalyzer = () => {
  const { portfolio } = usePortfolio();
  const [analysis, setAnalysis] = useState(null);
  const [sectorExposure, setSectorExposure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riskTolerance, setRiskTolerance] = useState("moderate");

  useEffect(() => {
    fetchAnalysis();
    fetchSectorExposure();
  }, [portfolio, riskTolerance]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/portfolio/analyze`, {
        portfolio: {
          australian_equities: portfolio.investments.shares_value,
          international_equities: portfolio.investments.etf_value * 0.6,
          fixed_income: 120000,
          property: portfolio.investments.properties.reduce((sum, p) => sum + p.value, 0) * 0.2,
          cash: 70000
        },
        risk_tolerance: riskTolerance,
        age: 45,
        years_to_retirement: 15
      });
      setAnalysis(response.data);
    } catch (error) {
      console.error("Error fetching analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectorExposure = async () => {
    try {
      const response = await axios.post(`${API}/portfolio/sector-exposure`, {
        holdings: null // Use default holdings
      });
      setSectorExposure(response.data);
    } catch (error) {
      console.error("Error fetching sector exposure:", error);
    }
  };

  const allocationData = analysis ? Object.entries(analysis.current_allocation).map(([name, value]) => ({
    name: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: value,
    target: analysis.target_allocation[name] || 0
  })) : [];

  const deviationData = analysis ? Object.entries(analysis.deviations).map(([name, data]) => ({
    name: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    current: data.current,
    target: data.target,
    deviation: data.deviation
  })) : [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="portfolio-analyzer">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Portfolio Analyzer</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Risk analysis, allocation diagnostics, and rebalancing recommendations
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={riskTolerance} onValueChange={setRiskTolerance}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Risk Tolerance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchAnalysis}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {/* Risk Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={`${
            analysis?.risk_metrics?.risk_assessment === 'high' ? 'bg-red-50' :
            analysis?.risk_metrics?.risk_assessment === 'low' ? 'bg-green-50' : 'bg-amber-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className={`h-8 w-8 ${
                  analysis?.risk_metrics?.risk_assessment === 'high' ? 'text-red-600' :
                  analysis?.risk_metrics?.risk_assessment === 'low' ? 'text-green-600' : 'text-amber-600'
                }`} />
                <div>
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <p className="text-xl font-bold capitalize">{analysis?.risk_metrics?.risk_assessment || 'Moderate'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Growth Assets</p>
                  <p className="text-xl font-bold">{analysis?.risk_metrics?.growth_percentage || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Percent className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Expected Return</p>
                  <p className="text-xl font-bold">{analysis?.risk_metrics?.expected_annual_return || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-xl font-bold">{analysis?.risk_metrics?.sharpe_ratio || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Message */}
        {analysis?.risk_metrics?.risk_message && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <p className="text-sm">{analysis.risk_metrics.risk_message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Allocation Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Current Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {allocationData.map((asset, i) => (
                  <div key={`item-${i}`} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm">{asset.name}: {asset.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Current vs Target Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 50]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="current" fill="#3b82f6" name="Current %" />
                    <Bar dataKey="target" fill="#10b981" name="Target %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rebalancing Recommendations */}
        {analysis?.rebalancing_required && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base">Rebalancing Required</CardTitle>
                </div>
                <Badge variant="destructive">{analysis.rebalancing_trades?.length} Trades</Badge>
              </div>
              <CardDescription>The following trades are recommended to align with your target allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.rebalancing_trades?.map((trade, i) => (
                  <div key={`item-${i}`} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-lg ${trade.action === 'buy' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {trade.action === 'buy' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium capitalize">
                        {trade.asset_class.split('_').join(' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">{trade.reason}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={trade.action === 'buy' ? 'default' : 'destructive'}>
                        {trade.action.toUpperCase()}
                      </Badge>
                      <p className="text-lg font-bold mt-1">{formatCurrency(trade.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Concentration Risks */}
        {analysis?.concentration_risks?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-base">Concentration Risks</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.concentration_risks.map((risk, i) => (
                  <div key={`item-${i}`} className="flex items-center gap-4 p-3 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium capitalize">{risk.asset_class.split('_').join(' ')}</p>
                      <p className="text-sm text-muted-foreground">{risk.recommendation}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{risk.percentage.toFixed(1)}%</p>
                      <Badge variant={risk.risk_level === 'high' ? 'destructive' : 'secondary'}>
                        {risk.risk_level} risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights */}
        {analysis?.insights?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Portfolio Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.insights.map((insight, i) => (
                  <div key={`item-${i}`} className="flex items-start gap-3 p-3 border rounded-lg">
                    <AlertTriangle className={`h-5 w-5 ${
                      insight.impact === 'high' ? 'text-red-600' : 
                      insight.impact === 'moderate' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <Badge variant="secondary" className="mb-1 capitalize">{insight.type.split('_').join(' ')}</Badge>
                      <p className="text-sm">{insight.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sector Exposure */}
        {sectorExposure && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Sector Exposure</CardTitle>
                <Badge variant="secondary">
                  Diversification: {sectorExposure.diversification_score}/100
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sectorExposure.sector_breakdown?.map((sector, i) => (
                  <div key={`item-${i}`} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium">{sector.sector}</div>
                    <div className="flex-1">
                      <Progress 
                        value={sector.percentage} 
                        className={`h-3 ${sector.concentrated ? 'bg-red-100' : ''}`}
                      />
                    </div>
                    <div className="w-16 text-right font-medium">{sector.percentage.toFixed(1)}%</div>
                    {sector.concentrated && (
                      <Badge variant="destructive">High</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default PortfolioAnalyzer;
