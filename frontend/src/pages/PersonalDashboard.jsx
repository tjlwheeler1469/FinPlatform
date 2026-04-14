import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Layout from '@/components/Layout';
import SmartInsights from '@/components/SmartInsights';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Gauge, TrendingUp, TrendingDown, Shield, AlertTriangle, Zap, Brain,
  RefreshCw, Target, Clock, DollarSign, Users, Eye, ChevronRight,
  CheckCircle2, XCircle, ArrowUp, ArrowDown, PieChart, Wallet,
  Lightbulb, Calendar, Bell, Activity, FileText, Building2, Landmark,
  BarChart3, ArrowLeftRight, AlertCircle, Sun, Settings, Edit2, User, Loader2
} from 'lucide-react';
import {
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart,
  RadialBar, LineChart, Line, AreaChart, Area
} from 'recharts';

const NetWorthTrend = lazy(() => import("@/pages/NetWorthTrend"));
const UnifiedInvestments = lazy(() => import("@/pages/UnifiedInvestments"));

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

// ==================== REALISTIC DATA FOR AVERAGE MARRIED 50-YEAR-OLD AUSTRALIAN COUPLE ====================
// Based on ABS statistics and ASFA retirement standards for median Australian households
// Profile: David (50) & Sarah (50) Thompson - Married, 2 adult children, living in Melbourne

const mockAssets = [
  // Superannuation - Combined super for couple (avg $240K each at age 50)
  { id: 1, name: 'David - AustralianSuper', type: 'Super', entity: 'Super', value: 245000, change: 8.2 },
  { id: 2, name: 'Sarah - REST Super', type: 'Super', entity: 'Super', value: 198000, change: 7.8 },
  
  // Family Home (Melbourne median ~$950K, with mortgage offset)
  { id: 3, name: 'Family Home - Glen Waverley', type: 'Property', entity: 'Personal', value: 985000, change: 4.1 },
  
  // Investment Property (common for 50-year-olds building wealth)
  { id: 4, name: 'Investment Unit - Brunswick', type: 'Property', entity: 'Joint', value: 620000, change: 3.8 },
  
  // Shares & ETFs (typical for middle-income earners)
  { id: 5, name: 'Vanguard High Growth ETF', type: 'Shares', entity: 'Personal', value: 42000, change: 9.5 },
  { id: 6, name: 'BHP Group Shares', type: 'Shares', entity: 'Personal', value: 18500, change: 6.2 },
  { id: 7, name: 'CBA Shares (DRP)', type: 'Shares', entity: 'Joint', value: 24000, change: 11.3 },
  
  // Cash & Term Deposits (emergency fund + savings)
  { id: 8, name: 'Emergency Fund - ING Savings', type: 'Cash', entity: 'Personal', value: 28000, change: 4.35 },
  { id: 9, name: 'Term Deposit - Westpac 12m', type: 'Cash', entity: 'Joint', value: 35000, change: 4.65 },
  
  // Managed Funds (common for hands-off investing)
  { id: 10, name: 'Colonial First State Balanced', type: 'Managed Fund', entity: 'Personal', value: 32000, change: 5.8 },
  
  // Small crypto exposure (increasingly common for Gen X)
  { id: 11, name: 'Bitcoin (Coinbase)', type: 'Crypto', entity: 'Personal', value: 8500, change: 28.4 },
  
  // Vehicle (depreciating asset but part of net worth)
  { id: 12, name: 'Toyota RAV4 Hybrid 2023', type: 'Other', entity: 'Personal', value: 42000, change: -12.0 },
];

// Liabilities for net worth calculation
const mockLiabilities = [
  { id: 1, name: 'Home Loan - CBA', type: 'Mortgage', value: 285000, rate: 6.19 },
  { id: 2, name: 'Investment Loan - ANZ', type: 'Mortgage', value: 380000, rate: 6.49 },
  { id: 3, name: 'Credit Card - Visa', type: 'Credit', value: 4200, rate: 19.99 },
];

const mockDocuments = [
  { id: 1, name: 'Joint Tax Return 2025', status: 'pending', dueDate: '2026-04-15', type: 'Tax' },
  { id: 2, name: 'Home & Contents Insurance', status: 'urgent', dueDate: '2026-01-31', type: 'Insurance' },
  { id: 3, name: 'Super Consolidation Review', status: 'pending', dueDate: '2026-02-28', type: 'Super' },
  { id: 4, name: 'Investment Property Review', status: 'pending', dueDate: '2026-03-15', type: 'Property' },
];

// Rebalancing based on age-appropriate allocation (50-year-old = 50% growth, 50% defensive)
const mockRebalancing = [
  { asset: 'Australian Shares', current: 28, target: 25, diff: 3, action: 'Sell' },
  { asset: 'International Shares', current: 12, target: 20, diff: -8, action: 'Buy' },
  { asset: 'Property', current: 42, target: 25, diff: 17, action: 'Review' },
  { asset: 'Bonds/Fixed Income', current: 8, target: 20, diff: -12, action: 'Buy' },
  { asset: 'Cash', current: 10, target: 10, diff: 0, action: 'Hold' },
];

const mockMarketIndicators = [
  { name: 'ASX 200', value: 7842, change: 0.8 },
  { name: 'S&P 500', value: 5123, change: 1.2 },
  { name: 'AUD/USD', value: 0.672, change: -0.3 },
  { name: '10Y Bond', value: 4.25, change: 0.05 },
];

// Default user profile for the dashboard
const defaultUserProfile = {
  user_id: 'thompson_family',
  name: 'David & Sarah Thompson',
  first_name: 'David',
  last_name: 'Thompson',
  partner_first_name: 'Sarah',
  age: 50,
  retirementAge: 67,
  yearsToRetirement: 17,
  riskProfile: 'Balanced',
  incomeHousehold: 185000,
  expensesAnnual: 95000,
  children: 2,
  status: 'Married'
};

// ==================== MAIN COMPONENT ====================

const PersonalDashboard = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [entityFilter, setEntityFilter] = useState('all');
  const [retirementData, setRetirementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marketIndicators, setMarketIndicators] = useState(mockMarketIndicators);
  const [marketDataSource, setMarketDataSource] = useState('fallback');
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // Fetch live market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/market-data/indicators`);
        if (response.ok) {
          const data = await response.json();
          if (data.indicators && data.indicators.length > 0) {
            // Transform API data to match our format
            const transformedData = data.indicators.slice(0, 4).map(ind => ({
              name: ind.name,
              value: ind.value,
              change: ind.change_percent
            }));
            setMarketIndicators(transformedData);
            setMarketDataSource(data.source);
          }
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        // Keep using mock data on error
      }
    };
    fetchMarketData();
    // Refresh market data every 5 minutes
    const interval = setInterval(fetchMarketData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user-profile/thompson_family/summary`);
        if (response.ok) {
          const data = await response.json();
          setUserProfile(prev => ({
            ...prev,
            name: data.display_name,
            age: data.age,
            yearsToRetirement: data.years_to_retirement,
            retirementAge: data.retirement_age,
            riskProfile: data.risk_profile,
            incomeHousehold: data.combined_income,
            expensesAnnual: data.annual_expenses,
            children: data.children,
            status: data.marital_status === 'married' ? 'Married' : data.marital_status
          }));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  // Fetch retirement confidence data
  useEffect(() => {
    const fetchRetirementData = async () => {
      try {
        // Calculate total portfolio from assets (excluding liabilities)
        const totalAssets = mockAssets.reduce((sum, a) => sum + a.value, 0);
        const totalLiabilities = mockLiabilities.reduce((sum, l) => sum + l.value, 0);
        const netPortfolio = totalAssets - totalLiabilities;
        
        const response = await fetch(`${API_URL}/api/hybrid-engine/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: 'thompson_family',
            // 50-year-old couple planning for retirement at 67 (Australian standard)
            current_age: 50,
            retirement_age: 67,
            life_expectancy: 92,
            // Net worth after liabilities (~$1.6M)
            current_portfolio: netPortfolio,
            // Combined super contributions (employer + salary sacrifice)
            annual_contributions: 42000,
            // ASFA comfortable retirement standard for couples (~$72K/year)
            retirement_spending: 72000,
            // Conservative return assumption for balanced portfolio
            expected_return: 0.065,
            return_volatility: 0.12,
            inflation_rate: 0.03,
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
  const yearsToRetirement = userProfile.yearsToRetirement;
  
  // Calculate net worth (assets - liabilities)
  const totalLiabilities = mockLiabilities.reduce((sum, l) => sum + l.value, 0);
  const grossAssets = totals.totalValue;
  const netWorthValue = grossAssets - totalLiabilities;

  // Profile edit form state
  const [editForm, setEditForm] = useState({
    first_name: 'David',
    last_name: 'Thompson',
    partner_first_name: 'Sarah',
    date_of_birth: '1976-03-15',
    partner_date_of_birth: '1976-08-22',
    retirement_age: 67,
    risk_profile: 'balanced',
    annual_income: 125000,
    partner_annual_income: 60000,
    annual_expenses: 95000
  });

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user-profile/thompson_family`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        const data = await response.json();
        // Update local state
        const displayName = editForm.partner_first_name 
          ? `${editForm.first_name} & ${editForm.partner_first_name} ${editForm.last_name}`
          : `${editForm.first_name} ${editForm.last_name}`;
        
        setUserProfile(prev => ({
          ...prev,
          name: displayName,
          retirementAge: editForm.retirement_age,
          riskProfile: editForm.risk_profile,
          incomeHousehold: (editForm.annual_income || 0) + (editForm.partner_annual_income || 0),
          expensesAnnual: editForm.annual_expenses
        }));
        setShowProfileEdit(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    }
  };

  const content = (
      <div className="space-y-6" data-testid="personal-dashboard">
        {/* Header with Date (Daily Briefing style) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sun className="h-8 w-8 text-amber-500" />
              {userProfile.name}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setShowProfileEdit(true)}
                data-testid="edit-profile-btn"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' • '}<span className="text-primary">{userProfile.status}, Age {userProfile.age}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-3 py-1 bg-green-50 border-green-200">
              Net Worth: {formatCurrency(netWorthValue)}
            </Badge>
            {marketDataSource === 'live' && (
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                <Activity className="h-3 w-3 mr-1" /> Live
              </Badge>
            )}
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={showProfileEdit} onOpenChange={setShowProfileEdit}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit Profile
              </DialogTitle>
              <DialogDescription>
                Update your personal details and financial information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Your First Name</Label>
                  <Input 
                    id="first_name"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input 
                    id="last_name"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partner_first_name">Partner's First Name</Label>
                  <Input 
                    id="partner_first_name"
                    value={editForm.partner_first_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, partner_first_name: e.target.value }))}
                    placeholder="Leave empty if single"
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Your Date of Birth</Label>
                  <Input 
                    id="date_of_birth"
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) => setEditForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retirement_age">Target Retirement Age</Label>
                  <Input 
                    id="retirement_age"
                    type="number"
                    value={editForm.retirement_age}
                    onChange={(e) => setEditForm(prev => ({ ...prev, retirement_age: parseInt(e.target.value) || 67 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="risk_profile">Risk Profile</Label>
                  <Select 
                    value={editForm.risk_profile} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, risk_profile: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderately_conservative">Moderately Conservative</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="high_growth">High Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="annual_income">Your Annual Income</Label>
                  <Input 
                    id="annual_income"
                    type="number"
                    value={editForm.annual_income}
                    onChange={(e) => setEditForm(prev => ({ ...prev, annual_income: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="partner_annual_income">Partner's Income</Label>
                  <Input 
                    id="partner_annual_income"
                    type="number"
                    value={editForm.partner_annual_income}
                    onChange={(e) => setEditForm(prev => ({ ...prev, partner_annual_income: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="annual_expenses">Annual Expenses</Label>
                  <Input 
                    id="annual_expenses"
                    type="number"
                    value={editForm.annual_expenses}
                    onChange={(e) => setEditForm(prev => ({ ...prev, annual_expenses: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProfileEdit(false)}>Cancel</Button>
              <Button onClick={handleProfileUpdate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-5xl">
            <TabsTrigger value="overview" className="flex items-center gap-1" data-testid="tab-overview">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="net-worth" className="flex items-center gap-1" data-testid="tab-net-worth">
              <Wallet className="h-4 w-4" />
              Net Worth
            </TabsTrigger>
            <TabsTrigger value="wealth-trends" className="flex items-center gap-1" data-testid="tab-wealth-trends">
              <TrendingUp className="h-4 w-4" />
              Wealth Trends
            </TabsTrigger>
            <TabsTrigger value="investments" className="flex items-center gap-1" data-testid="tab-investments">
              <BarChart3 className="h-4 w-4" />
              Investments
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1" data-testid="tab-insights">
              <Brain className="h-4 w-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-1" data-testid="tab-transactions">
              <FileText className="h-4 w-4" />
              Transactions
            </TabsTrigger>
          </TabsList>

          {/* ==================== TAB 1: OVERVIEW (Simplified) ==================== */}
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
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                      {yearsToRetirement} years to retirement (age {userProfile.retirementAge})
                    </p>
                  </div>
                  <Link to="/retirement-confidence">
                    <Button variant="outline" className="w-full mt-4">
                      View Full Analysis <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Net Worth Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-500" />
                    Net Worth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(netWorthValue)}</p>
                    <p className="text-sm text-green-600"><ArrowUp className="h-3 w-3 inline" /> +5.8% YTD</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Assets</span>
                      <span className="font-medium">{formatCurrency(grossAssets)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Liabilities</span>
                      <span className="font-medium">-{formatCurrency(totalLiabilities)}</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between font-semibold">
                      <span>Net Worth</span>
                      <span className="text-green-600">{formatCurrency(netWorthValue)}</span>
                    </div>
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

            {/* Asset Allocation */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChart className="h-5 w-5 text-blue-500" />
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <RechartsPie>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
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
          </TabsContent>


          {/* ==================== TAB 1b: NET WORTH ==================== */}
          <TabsContent value="net-worth" className="space-y-6">
            {/* Entity Breakdown — MOVED TO TOP */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Assets by Entity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {entityData.map((entity) => (
                    <div key={entity.name} className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">{entity.name}</p>
                      <p className="text-xl font-bold">{formatCurrency(entity.value)}</p>
                      <p className="text-xs text-muted-foreground">{((entity.value / grossAssets) * 100).toFixed(1)}% of total</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[#1a2744] text-white">
                <CardContent className="p-4">
                  <p className="text-xs text-white/70">Net Worth</p>
                  <p className="text-2xl font-bold text-[#D4A84C]">{formatCurrency(netWorthValue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Gross Assets</p>
                  <p className="text-2xl font-bold">{formatCurrency(grossAssets)}</p>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Liabilities</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Holdings</p>
                  <p className="text-2xl font-bold">{mockAssets.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Asset Breakdown by Type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-500" />
                  Assets by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="asset-breakdown-table">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-4 font-medium text-muted-foreground">Category</th>
                        <th className="py-2 pr-4 font-medium text-muted-foreground text-right">Value</th>
                        <th className="py-2 font-medium text-muted-foreground text-right">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(totals.byType)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, value]) => (
                          <tr key={type} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{type}</td>
                            <td className="py-2 pr-4 text-right">{formatCurrency(value)}</td>
                            <td className="py-2 text-right text-muted-foreground">{((value / grossAssets) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      <tr className="border-t-2 font-bold">
                        <td className="py-2 pr-4">Total Assets</td>
                        <td className="py-2 pr-4 text-right">{formatCurrency(grossAssets)}</td>
                        <td className="py-2 text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Full Calculation Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-500" />
                  Full Calculation Breakdown
                </CardTitle>
                <CardDescription>Every line item contributing to net worth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="full-calculation-table">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-4 font-medium text-muted-foreground">Item</th>
                        <th className="py-2 pr-4 font-medium text-muted-foreground">Type</th>
                        <th className="py-2 pr-4 font-medium text-muted-foreground">Entity</th>
                        <th className="py-2 font-medium text-muted-foreground text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...mockAssets].sort((a, b) => b.value - a.value).map((asset) => (
                        <tr key={asset.id} className="border-b">
                          <td className="py-1.5 pr-4">{asset.name}</td>
                          <td className="py-1.5 pr-4"><Badge variant="outline" className="text-xs">{asset.type}</Badge></td>
                          <td className="py-1.5 pr-4 text-muted-foreground text-xs">{asset.entity}</td>
                          <td className="py-1.5 text-right font-medium text-green-700">{formatCurrency(asset.value)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 bg-green-50">
                        <td className="py-2 pr-4 font-bold" colSpan={3}>Total Assets</td>
                        <td className="py-2 text-right font-bold text-green-700">{formatCurrency(grossAssets)}</td>
                      </tr>
                      {mockLiabilities.map((l) => (
                        <tr key={l.id} className="border-b">
                          <td className="py-1.5 pr-4">{l.name}</td>
                          <td className="py-1.5 pr-4"><Badge variant="outline" className="text-xs">{l.type}</Badge></td>
                          <td className="py-1.5 pr-4 text-muted-foreground text-xs">{l.rate}% p.a.</td>
                          <td className="py-1.5 text-right font-medium text-red-600">-{formatCurrency(l.value)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 bg-red-50">
                        <td className="py-2 pr-4 font-bold" colSpan={3}>Total Liabilities</td>
                        <td className="py-2 text-right font-bold text-red-600">-{formatCurrency(totalLiabilities)}</td>
                      </tr>
                      <tr className="border-t-2 bg-[#1a2744]/5">
                        <td className="py-3 pr-4 font-bold text-lg" colSpan={3}>Net Worth</td>
                        <td className="py-3 text-right font-bold text-lg text-[#D4A84C]">{formatCurrency(netWorthValue)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* ==================== TAB 2: WEALTH TRENDS ==================== */}
          <TabsContent value="wealth-trends" className="space-y-6">
            <ErrorBoundary label="Wealth Trends">
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" /></div>}>
                <NetWorthTrend embedded netWorthOverride={netWorthValue} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* ==================== TAB 3: INVESTMENTS ==================== */}
          <TabsContent value="investments" className="space-y-6">
            <ErrorBoundary label="Investments">
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" /></div>}>
                <UnifiedInvestments embedded />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* ==================== TAB 4: INSIGHTS ==================== */}
          <TabsContent value="insights" className="space-y-6">
            <SmartInsights 
              clientId="thompson_family"
              portfolioData={portfolioDataForInsights}
              retirementData={retirementData}
              isAdvisor={false}
              compact={false}
            />
          </TabsContent>

          {/* ==================== TAB 5: TRANSACTIONS ==================== */}
          <TabsContent value="transactions" className="space-y-6">
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
                {totals.assets.length} investments | {formatCurrency(totals.totalValue)}
              </Badge>
            </div>

            {/* Investments Table — sorted alphabetically */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#D4A84C]" />
                  All Investments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...totals.assets].sort((a, b) => a.name.localeCompare(b.name)).map((asset) => (
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
        </Tabs>
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default PersonalDashboard;
