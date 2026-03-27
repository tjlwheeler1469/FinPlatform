import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import SmartInsights from '@/components/SmartInsights';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Gauge, TrendingUp, TrendingDown, Shield, AlertTriangle, Zap, Brain,
  RefreshCw, Target, Clock, DollarSign, Users, Eye, ChevronRight,
  CheckCircle2, XCircle, ArrowUp, ArrowDown, PieChart, Wallet,
  Lightbulb, Calendar, Bell, Activity, FileText, Building2, Landmark,
  BarChart3, ArrowLeftRight, AlertCircle, Sun
} from 'lucide-react';
import {
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart,
  RadialBar, LineChart, Line, AreaChart, Area
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

// ==================== HELPER FUNCTIONS ====================

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

const getConfidenceColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};

const getConfidenceLabel = (score) => {
  if (score >= 80) return 'On Track';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Attention';
  return 'At Risk';
};

// ==================== MOCK DATA ====================

const mockAssets = [
  { id: 1, name: 'Vanguard Australian Shares ETF', type: 'Shares', entity: 'Personal', value: 125000, change: 8.5 },
  { id: 2, name: 'CBA Shares', type: 'Shares', entity: 'Personal', value: 45000, change: 12.3 },
  { id: 3, name: 'Investment Property - Sydney', type: 'Property', entity: 'Trust', value: 850000, change: 5.2 },
  { id: 4, name: 'Term Deposit - NAB', type: 'Cash', entity: 'Personal', value: 100000, change: 4.5 },
  { id: 5, name: 'Super Accumulation', type: 'Super', entity: 'Super', value: 450000, change: 9.1 },
  { id: 6, name: 'Managed Fund - Magellan', type: 'Managed Fund', entity: 'Personal', value: 75000, change: -2.3 },
  { id: 7, name: 'Corporate Bonds', type: 'Bonds', entity: 'Company', value: 50000, change: 3.8 },
  { id: 8, name: 'Bitcoin', type: 'Crypto', entity: 'Personal', value: 25000, change: 45.2 },
  { id: 9, name: 'Private Equity Fund', type: 'Unlisted', entity: 'Trust', value: 100000, change: 15.0 },
  { id: 10, name: 'Hybrid Securities - ANZ', type: 'Hybrids', entity: 'Personal', value: 30000, change: 5.5 },
];

const mockDocuments = [
  { id: 1, name: 'Annual Tax Return 2025', status: 'pending', dueDate: '2026-04-15', type: 'Tax' },
  { id: 2, name: 'Insurance Renewal', status: 'urgent', dueDate: '2026-01-31', type: 'Insurance' },
  { id: 3, name: 'Super Statement Review', status: 'pending', dueDate: '2026-02-28', type: 'Super' },
];

const mockRebalancing = [
  { asset: 'Australian Shares', current: 35, target: 30, diff: 5, action: 'Sell' },
  { asset: 'International Shares', current: 20, target: 25, diff: -5, action: 'Buy' },
  { asset: 'Property', current: 25, target: 20, diff: 5, action: 'Sell' },
  { asset: 'Bonds', current: 10, target: 15, diff: -5, action: 'Buy' },
  { asset: 'Cash', current: 10, target: 10, diff: 0, action: 'Hold' },
];

const mockMarketIndicators = [
  { name: 'ASX 200', value: 7842, change: 0.8 },
  { name: 'S&P 500', value: 5123, change: 1.2 },
  { name: 'AUD/USD', value: 0.672, change: -0.3 },
  { name: '10Y Bond', value: 4.25, change: 0.05 },
];

// ==================== MAIN COMPONENT ====================

const PersonalDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [entityFilter, setEntityFilter] = useState('all');
  const [retirementData, setRetirementData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch retirement confidence data
  useEffect(() => {
    const fetchRetirementData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/hybrid-engine/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: 'personal_dashboard',
            current_age: 45,
            retirement_age: 65,
            life_expectancy: 90,
            current_portfolio: 1850000,
            annual_contributions: 50000,
            retirement_spending: 80000,
            expected_return: 0.07,
            return_volatility: 0.15,
            inflation_rate: 0.025,
            num_simulations: 5000,
            enable_dynamic_spending: true,
            mode: 'background'
          })
        });
        if (response.ok) {
          const data = await response.json();
          setRetirementData(data);
        }
      } catch (error) {
        console.error('Error fetching retirement data:', error);
      }
      setLoading(false);
    };
    fetchRetirementData();
  }, []);

  // Calculate totals
  const totals = useMemo(() => {
    const filteredAssets = entityFilter === 'all' 
      ? mockAssets 
      : mockAssets.filter(a => a.entity.toLowerCase() === entityFilter);
    
    const totalValue = filteredAssets.reduce((sum, a) => sum + a.value, 0);
    const byType = filteredAssets.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + a.value;
      return acc;
    }, {});
    const byEntity = mockAssets.reduce((acc, a) => {
      acc[a.entity] = (acc[a.entity] || 0) + a.value;
      return acc;
    }, {});

    return { totalValue, byType, byEntity, assets: filteredAssets };
  }, [entityFilter]);

  // Portfolio data for Smart Insights
  const portfolioDataForInsights = {
    totalValue: totals.totalValue,
    byType: totals.byType,
    byEntity: totals.byEntity,
    net_worth: totals.totalValue
  };

  // Asset allocation data for pie chart
  const allocationData = Object.entries(totals.byType).map(([name, value], index) => ({
    name,
    value,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));

  // Entity breakdown data
  const entityData = Object.entries(totals.byEntity).map(([name, value], index) => ({
    name,
    value,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));

  const confidence = retirementData?.confidence_score || 0;
  const yearsToRetirement = retirementData?.inputs?.years_to_retirement || 20;

  return (
    <Layout>
      <div className="space-y-6" data-testid="personal-dashboard">
        {/* Header with Date (Daily Briefing style) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sun className="h-8 w-8 text-amber-500" />
              Personal Dashboard
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-3 py-1">
              Net Worth: {formatCurrency(totals.totalValue)}
            </Badge>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Retirement Confidence</span>
              </div>
              <p className="text-3xl font-bold" style={{ color: getConfidenceColor(confidence) }}>
                {confidence.toFixed(0)}%
              </p>
              <Badge className={confidence >= 80 ? 'bg-green-500' : confidence >= 60 ? 'bg-blue-500' : 'bg-amber-500'}>
                {getConfidenceLabel(confidence)}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Net Worth</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totals.totalValue)}
              </p>
              <p className="text-sm text-green-600">
                <ArrowUp className="h-3 w-3 inline" /> +8.2% YTD
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-muted-foreground">Years to Retirement</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">{yearsToRetirement}</p>
              <p className="text-sm text-muted-foreground">At age 65</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-muted-foreground">Actions Required</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">
                {mockDocuments.filter(d => d.status === 'urgent' || d.status === 'pending').length}
              </p>
              <p className="text-sm text-amber-600">Documents pending</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-slate-600" />
                <span className="text-sm text-muted-foreground">ASX 200</span>
              </div>
              <p className="text-3xl font-bold text-slate-700">{mockMarketIndicators[0].value}</p>
              <p className={`text-sm ${mockMarketIndicators[0].change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mockMarketIndicators[0].change >= 0 ? '+' : ''}{mockMarketIndicators[0].change}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Market Indicators Bar */}
        <Card className="bg-slate-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between overflow-x-auto gap-6">
              {mockMarketIndicators.map((indicator, idx) => (
                <div key={idx} className="flex items-center gap-3 min-w-fit">
                  <span className="text-sm font-medium text-muted-foreground">{indicator.name}</span>
                  <span className="font-semibold">{indicator.value.toLocaleString()}</span>
                  <span className={`text-sm ${indicator.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {indicator.change >= 0 ? '+' : ''}{indicator.change}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs - Combined Overview + Retirement + Portfolio + Assets + Management */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="overview" className="flex items-center gap-1" data-testid="tab-overview">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="retirement" className="flex items-center gap-1" data-testid="tab-retirement">
              <Gauge className="h-4 w-4" />
              Retirement
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-1" data-testid="tab-portfolio">
              <PieChart className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-1" data-testid="tab-assets">
              <Wallet className="h-4 w-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1" data-testid="tab-insights">
              <Brain className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* ==================== TAB 1: OVERVIEW (Combined Daily Briefing + Overview) ==================== */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Retirement Readiness Summary */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    Retirement Readiness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-32 h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                          cx="50%" 
                          cy="50%" 
                          innerRadius="60%" 
                          outerRadius="100%" 
                          data={[{ value: confidence, fill: getConfidenceColor(confidence) }]}
                          startAngle={180}
                          endAngle={0}
                        >
                          <RadialBar dataKey="value" cornerRadius={10} background />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-3xl font-bold" style={{ color: getConfidenceColor(confidence) }}>
                          {confidence.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge className={confidence >= 80 ? 'bg-green-500' : confidence >= 60 ? 'bg-blue-500' : 'bg-amber-500'}>
                      {getConfidenceLabel(confidence)}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      {yearsToRetirement} years to retirement
                    </p>
                  </div>
                  <Link to="/retirement-confidence">
                    <Button variant="outline" className="w-full mt-4">
                      View Full Analysis <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Net Worth Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-500" />
                    Net Worth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(totals.totalValue)}</p>
                    <p className="text-sm text-green-600"><ArrowUp className="h-3 w-3 inline" /> +8.2% YTD</p>
                  </div>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={entityData.slice(0, 4)}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {entityData.slice(0, 4).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    {entityData.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/retirement-confidence">
                    <Button variant="outline" className="w-full justify-start h-auto py-3">
                      <Gauge className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">Check Retirement</p>
                        <p className="text-xs text-muted-foreground">Run confidence analysis</p>
                      </div>
                    </Button>
                  </Link>
                  <Link to="/scenario-modelling">
                    <Button variant="outline" className="w-full justify-start h-auto py-3">
                      <Target className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">Goals & Scenarios</p>
                        <p className="text-xs text-muted-foreground">Plan your future</p>
                      </div>
                    </Button>
                  </Link>
                  <Link to="/portfolio-rebalancing">
                    <Button variant="outline" className="w-full justify-start h-auto py-3">
                      <ArrowLeftRight className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">Rebalance Portfolio</p>
                        <p className="text-xs text-muted-foreground">Optimize allocations</p>
                      </div>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Smart Insights (AI + Manual) */}
            <SmartInsights 
              clientId="personal_dashboard"
              portfolioData={portfolioDataForInsights}
              retirementData={retirementData}
              isAdvisor={false}
              compact={true}
              maxInsights={4}
            />

            {/* Documents Needing Attention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  Documents & Actions
                  <Badge variant="destructive">{mockDocuments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-3">
                  {mockDocuments.map((doc) => (
                    <div key={doc.id} className={`p-3 rounded-lg border ${
                      doc.status === 'urgent' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                            <span className="text-xs text-muted-foreground">Due: {doc.dueDate}</span>
                          </div>
                        </div>
                        <Badge className={doc.status === 'urgent' ? 'bg-red-500' : 'bg-amber-500'}>
                          {doc.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TAB 2: RETIREMENT ==================== */}
          <TabsContent value="retirement" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Retirement Readiness Gauge */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    Retirement Readiness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                          cx="50%" 
                          cy="50%" 
                          innerRadius="60%" 
                          outerRadius="100%" 
                          data={[{ value: confidence, fill: getConfidenceColor(confidence) }]}
                          startAngle={180}
                          endAngle={0}
                        >
                          <RadialBar dataKey="value" cornerRadius={10} background />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-4xl font-bold" style={{ color: getConfidenceColor(confidence) }}>
                          {confidence.toFixed(0)}%
                        </p>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                      <p className="text-xl font-bold text-green-600">
                        {retirementData?.monte_carlo?.success_rate_percent?.toFixed(0) || '--'}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Median Outcome</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(retirementData?.monte_carlo?.percentiles?.p50_median || 0)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Years Left</p>
                      <p className="text-xl font-bold text-purple-600">{yearsToRetirement}</p>
                    </div>
                  </div>
                  
                  <Link to="/retirement-confidence">
                    <Button className="w-full mt-4">
                      Open Full Retirement Planner <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Confidence Drivers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Confidence Drivers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Savings Strength', value: (retirementData?.confidence_breakdown?.raw_factors?.monte_carlo_success || 0) * 100, color: '#3b82f6' },
                      { name: 'Market Protection', value: (retirementData?.confidence_breakdown?.raw_factors?.downside_protection || 0) * 100, color: '#22c55e' },
                      { name: 'Longevity Coverage', value: (retirementData?.confidence_breakdown?.raw_factors?.longevity_protection || 0) * 100, color: '#ec4899' },
                      { name: 'Spending Flexibility', value: (retirementData?.confidence_breakdown?.raw_factors?.spending_flexibility || 0) * 100, color: '#f59e0b' },
                      { name: 'Diversification', value: (retirementData?.confidence_breakdown?.raw_factors?.diversification || 0) * 100, color: '#06b6d4' },
                    ].map((driver) => (
                      <div key={driver.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{driver.name}</span>
                          <span className="font-medium">{driver.value.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${driver.value}%`, backgroundColor: driver.value >= 70 ? '#22c55e' : driver.value >= 40 ? driver.color : '#ef4444' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Projected Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Retirement Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current Age</p>
                    <p className="text-2xl font-bold">45</p>
                  </div>
                  <div className="flex-1 mx-8">
                    <Progress value={(20 - yearsToRetirement) / 20 * 100 + 50} className="h-4" />
                    <p className="text-center text-sm text-muted-foreground mt-2">{yearsToRetirement} years to go</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Target Retirement</p>
                    <p className="text-2xl font-bold">65</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TAB 3: PORTFOLIO ==================== */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Asset Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    Asset Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
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
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Entity Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-500" />
                    Holdings by Entity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={entityData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {entityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio Rebalancing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-amber-500" />
                  Portfolio Rebalancing Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRebalancing.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-medium w-40">{item.asset}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Current: {item.current}%</span>
                          <ChevronRight className="h-4 w-4" />
                          <span className="text-sm font-medium">Target: {item.target}%</span>
                        </div>
                      </div>
                      <Badge className={
                        item.action === 'Buy' ? 'bg-green-500' : 
                        item.action === 'Sell' ? 'bg-red-500' : 
                        'bg-gray-500'
                      }>
                        {item.action} {Math.abs(item.diff)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TAB 4: ASSETS ==================== */}
          <TabsContent value="assets" className="space-y-6">
            {/* Entity Filter */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Filter by Entity:</span>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="super">Super</SelectItem>
                  <SelectItem value="trust">Trust</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="ml-auto">
                {totals.assets.length} assets | {formatCurrency(totals.totalValue)}
              </Badge>
            </div>

            {/* Assets Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-500" />
                  All Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {totals.assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          asset.type === 'Shares' ? 'bg-blue-100 text-blue-600' :
                          asset.type === 'Property' ? 'bg-purple-100 text-purple-600' :
                          asset.type === 'Super' ? 'bg-green-100 text-green-600' :
                          asset.type === 'Bonds' ? 'bg-amber-100 text-amber-600' :
                          asset.type === 'Crypto' ? 'bg-orange-100 text-orange-600' :
                          asset.type === 'Unlisted' ? 'bg-indigo-100 text-indigo-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {asset.type === 'Shares' ? <TrendingUp className="h-5 w-5" /> :
                           asset.type === 'Property' ? <Building2 className="h-5 w-5" /> :
                           asset.type === 'Super' ? <Shield className="h-5 w-5" /> :
                           asset.type === 'Bonds' ? <Landmark className="h-5 w-5" /> :
                           asset.type === 'Unlisted' ? <FileText className="h-5 w-5" /> :
                           <Wallet className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{asset.type}</Badge>
                            <Badge variant="secondary" className="text-xs">{asset.entity}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(asset.value)}</p>
                        <p className={`text-sm ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.change}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TAB 5: INSIGHTS (Full Smart Insights) ==================== */}
          <TabsContent value="insights" className="space-y-6">
            <SmartInsights 
              clientId="personal_dashboard"
              portfolioData={portfolioDataForInsights}
              retirementData={retirementData}
              isAdvisor={false}
              compact={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PersonalDashboard;
