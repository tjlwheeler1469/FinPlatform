import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Calculator, TrendingUp, DollarSign, PiggyBank, Building, Users, Calendar,
  Target, Briefcase, ChevronRight, Download, RefreshCw, AlertTriangle,
  CheckCircle2, Info, BarChart3, Wallet, Shield, Clock, Save, Upload
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const INVESTMENT_PROFILE_COLORS = {
  conservative: '#22c55e',
  moderately_conservative: '#84cc16',
  balanced: '#3b82f6',
  growth: '#f59e0b',
  aggressive: '#ef4444'
};

const ASSET_COLORS = {
  cash: '#94a3b8',
  fixed_income: '#3b82f6',
  australian_shares: '#22c55e',
  international_shares: '#8b5cf6',
  property: '#f59e0b',
  infrastructure: '#ec4899',
  alternatives: '#06b6d4',
  commodities: '#f97316'
};

export default function RetirementCalculator() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [profiles, setProfiles] = useState(null);
  const [superCaps, setSuperCaps] = useState(null);
  const [fundCosts, setFundCosts] = useState(null);
  
  // Form State
  const [isClientMode, setIsClientMode] = useState(false);
  const [clientName, setClientName] = useState('');
  
  // Personal Details
  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(65);
  const [annualIncome, setAnnualIncome] = useState(120000);
  const [taxRate, setTaxRate] = useState(32.5);
  
  // Super Details
  const [currentBalance, setCurrentBalance] = useState(150000);
  const [fundType, setFundType] = useState('industry');
  const [investmentProfile, setInvestmentProfile] = useState('balanced');
  const [customReturnRate, setCustomReturnRate] = useState(null);
  
  // Contributions
  const [employerSG, setEmployerSG] = useState(13800);
  const [salaryPSacrifice, setSalarySacrifice] = useState(5000);
  const [personalNonConcessional, setPersonalNonConcessional] = useState(0);
  const [contributionGrowthRate, setContributionGrowthRate] = useState(3);
  
  // Advanced Settings
  const [inflationRate, setInflationRate] = useState(2.5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Save to Profile
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveClientId, setSaveClientId] = useState('');
  const [savePlatforms, setSavePlatforms] = useState([]);
  
  // Custom Asset Allocation (for custom profile)
  const [customAllocation, setCustomAllocation] = useState({
    cash: 5,
    fixed_income: 25,
    australian_shares: 30,
    international_shares: 25,
    property: 10,
    alternatives: 5
  });

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    // Auto-calculate employer SG based on income
    setEmployerSG(Math.round(annualIncome * 0.115)); // 11.5% SG
  }, [annualIncome]);

  const loadReferenceData = async () => {
    setLoading(true);
    try {
      const [profilesRes, capsRes, costsRes] = await Promise.all([
        fetch(`${API_URL}/api/retirement/profiles`).then(r => r.json()),
        fetch(`${API_URL}/api/retirement/super-caps`).then(r => r.json()),
        fetch(`${API_URL}/api/retirement/fund-costs`).then(r => r.json())
      ]);
      setProfiles(profilesRes);
      setSuperCaps(capsRes);
      setFundCosts(costsRes);
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
    setLoading(false);
  };

  const calculateRetirement = async () => {
    setCalculating(true);
    try {
      const request = {
        personal: {
          current_age: currentAge,
          retirement_age: retirementAge,
          annual_income: annualIncome,
          tax_rate: taxRate,
          is_client: isClientMode,
          client_name: isClientMode ? clientName : null
        },
        current_super_balance: currentBalance,
        fund_type: fundType,
        investment_profile: investmentProfile,
        custom_allocation: investmentProfile === 'custom' ? customAllocation : null,
        custom_return_rate: customReturnRate,
        contributions: {
          employer_sg: employerSG,
          salary_sacrifice: salaryPSacrifice,
          personal_non_concessional: personalNonConcessional,
          contribution_growth_rate: contributionGrowthRate
        },
        inflation_rate: inflationRate
      };
      
      const response = await fetch(`${API_URL}/api/retirement/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      const data = await response.json();
      setResult(data);
      setActiveTab('results');
    } catch (error) {
      console.error('Calculation failed:', error);
    }
    setCalculating(false);
  };

  const saveToClientProfile = async () => {
    if (!result) {
      toast.error('No calculation to save. Run a calculation first.');
      return;
    }
    
    setSaving(true);
    try {
      const clientId = saveClientId || `CLIENT-${Date.now()}`;
      const response = await fetch(`${API_URL}/api/client-profile/retirement/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_name: clientName || 'Unnamed Client',
          calculation_type: 'accumulation',
          calculation_id: result.calculation_id || `CALC-${Date.now()}`,
          calculation_data: result,
          push_to_platforms: savePlatforms.length > 0 ? savePlatforms : null
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success(`Saved to client profile: ${clientId}`);
        if (data.platform_push_results?.length > 0) {
          toast.success(`Pushed to ${data.platform_push_results.length} platform(s)`);
        }
        setShowSaveDialog(false);
      } else {
        toast.error('Failed to save: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save to client profile');
    }
    setSaving(false);
  };

  const loadSampleCalculation = async () => {
    setCalculating(true);
    try {
      const response = await fetch(`${API_URL}/api/retirement/demo/sample-calculation`);
      const data = await response.json();
      setResult(data);
      setActiveTab('results');
    } catch (error) {
      console.error('Failed to load sample:', error);
    }
    setCalculating(false);
  };

  const formatCurrency = (value) => {
    return `AUD $${value?.toLocaleString() || 0}`;
  };

  const exportResults = (format) => {
    if (!result) return;
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retirement_projection_${result.calculation_id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const headers = ['Year', 'Age', 'Start Balance', 'Contributions', 'Returns', 'Costs', 'End Balance', 'Real Balance'];
      const rows = result.projections.map(p => [
        p.year, p.age, p.start_balance, p.contributions, p.investment_return, p.costs, p.end_balance, p.real_balance
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retirement_projection_${result.calculation_id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getAllocationData = () => {
    if (!result?.investment?.allocation) return [];
    return Object.entries(result.investment.allocation)
      .filter(([_, v]) => v > 0)
      .map(([key, value]) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: ASSET_COLORS[key] || '#6b7280'
      }));
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="retirement-calculator">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Calculator className="h-8 w-8 text-primary" />
              Retirement Calculator
            </h1>
            <p className="text-muted-foreground">
              SMSF & Super Planning for Accumulation Phase
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={isClientMode}
                onCheckedChange={setIsClientMode}
                id="client-mode"
              />
              <Label htmlFor="client-mode" className="text-sm">
                {isClientMode ? 'Client Mode' : 'Individual Mode'}
              </Label>
            </div>
            <Button variant="outline" onClick={loadSampleCalculation} disabled={calculating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
              Load Sample
            </Button>
          </div>
        </div>

        {isClientMode && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertTitle>Adviser Mode Active</AlertTitle>
            <AlertDescription>
              <div className="flex items-center gap-2 mt-2">
                <Label>Client Name:</Label>
                <Input 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  className="w-64"
                />
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="calculator" data-testid="calculator-tab">
              <Calculator className="h-4 w-4 mr-2" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="results" data-testid="results-tab" disabled={!result}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="projections" data-testid="projections-tab" disabled={!result}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Projections
            </TabsTrigger>
            <TabsTrigger value="profiles" data-testid="profiles-tab">
              <Target className="h-4 w-4 mr-2" />
              Profiles
            </TabsTrigger>
            <TabsTrigger value="reference" data-testid="reference-tab">
              <Info className="h-4 w-4 mr-2" />
              Reference
            </TabsTrigger>
          </TabsList>

          {/* CALCULATOR TAB */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Personal Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Current Age: {currentAge}</Label>
                    <Slider
                      value={[currentAge]}
                      onValueChange={([v]) => setCurrentAge(v)}
                      min={18}
                      max={70}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Retirement Age: {retirementAge}</Label>
                    <Slider
                      value={[retirementAge]}
                      onValueChange={([v]) => setRetirementAge(v)}
                      min={55}
                      max={75}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Annual Income (AUD)</Label>
                    <Input
                      type="number"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Marginal Tax Rate: {taxRate}%</Label>
                    <Slider
                      value={[taxRate]}
                      onValueChange={([v]) => setTaxRate(v)}
                      min={0}
                      max={47}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Super Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5" />
                    Super Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Current Super Balance (AUD)</Label>
                    <Input
                      type="number"
                      value={currentBalance}
                      onChange={(e) => setCurrentBalance(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Fund Type</Label>
                    <Select value={fundType} onValueChange={setFundType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="industry">Industry Fund</SelectItem>
                        <SelectItem value="retail">Retail Fund</SelectItem>
                        <SelectItem value="smsf">SMSF</SelectItem>
                        <SelectItem value="sma">SMA (Separately Managed)</SelectItem>
                        <SelectItem value="managed_account">Managed Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Investment Profile</Label>
                    <Select value={investmentProfile} onValueChange={setInvestmentProfile}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative (5% target)</SelectItem>
                        <SelectItem value="moderately_conservative">Moderately Conservative (6%)</SelectItem>
                        <SelectItem value="balanced">Balanced (7% target)</SelectItem>
                        <SelectItem value="growth">Growth (8% target)</SelectItem>
                        <SelectItem value="aggressive">Aggressive (9.5% target)</SelectItem>
                        <SelectItem value="custom">Custom Allocation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {investmentProfile === 'custom' && (
                    <div className="p-3 bg-muted rounded-lg">
                      <Label className="text-xs">Custom Return Rate Override (%)</Label>
                      <Input
                        type="number"
                        value={customReturnRate || ''}
                        onChange={(e) => setCustomReturnRate(e.target.value ? Number(e.target.value) : null)}
                        placeholder="e.g., 7.5"
                        className="mt-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contributions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Contributions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Employer SG (11.5%)</Label>
                    <Input
                      type="number"
                      value={employerSG}
                      onChange={(e) => setEmployerSG(Number(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated from income</p>
                  </div>
                  <div>
                    <Label>Salary Sacrifice (Pre-tax)</Label>
                    <Input
                      type="number"
                      value={salaryPSacrifice}
                      onChange={(e) => setSalarySacrifice(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Personal Non-Concessional (After-tax)</Label>
                    <Input
                      type="number"
                      value={personalNonConcessional}
                      onChange={(e) => setPersonalNonConcessional(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Annual Contribution Growth: {contributionGrowthRate}%</Label>
                    <Slider
                      value={[contributionGrowthRate]}
                      onValueChange={([v]) => setContributionGrowthRate(v)}
                      min={0}
                      max={10}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Settings */}
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Advanced Settings
                  </span>
                  <ChevronRight className={`h-5 w-5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                </CardTitle>
              </CardHeader>
              {showAdvanced && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Inflation Rate: {inflationRate}%</Label>
                      <Slider
                        value={[inflationRate]}
                        onValueChange={([v]) => setInflationRate(v)}
                        min={0}
                        max={6}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  {investmentProfile === 'custom' && (
                    <div className="mt-6">
                      <Label className="mb-4 block">Custom Asset Allocation (%)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(customAllocation).map(([asset, value]) => (
                          <div key={asset}>
                            <Label className="text-xs capitalize">{asset.replace(/_/g, ' ')}</Label>
                            <Input
                              type="number"
                              value={value}
                              onChange={(e) => setCustomAllocation({...customAllocation, [asset]: Number(e.target.value)})}
                              min={0}
                              max={100}
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Total: {Object.values(customAllocation).reduce((a, b) => a + b, 0)}% (should equal 100%)
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Calculate Button */}
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={calculateRetirement} 
                disabled={calculating}
                className="px-12"
                data-testid="calculate-btn"
              >
                {calculating ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-5 w-5 mr-2" />
                    Calculate Retirement Projection
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* RESULTS TAB */}
          <TabsContent value="results" className="space-y-6">
            {result && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="pt-4">
                      <div className="text-sm text-green-600">Projected Balance at {result.summary.retirement_age}</div>
                      <div className="text-3xl font-bold text-green-700">
                        {formatCurrency(result.summary.projected_final_balance)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Real value: {formatCurrency(result.summary.projected_final_balance_real)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="text-sm text-blue-600">Monthly Retirement Income</div>
                      <div className="text-3xl font-bold text-blue-700">
                        {formatCurrency(result.retirement_income.projected_monthly_income)}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {result.retirement_income.sustainable_withdrawal_rate}% withdrawal rate
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="pt-4">
                      <div className="text-sm text-purple-600">Total Contributions</div>
                      <div className="text-3xl font-bold text-purple-700">
                        {formatCurrency(result.summary.total_contributions)}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Over {result.summary.years_to_retirement} years
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="pt-4">
                      <div className="text-sm text-orange-600">Investment Returns</div>
                      <div className="text-3xl font-bold text-orange-700">
                        {formatCurrency(result.summary.total_investment_returns)}
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        {result.investment.expected_return}% p.a. return
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Save to Profile Button */}
                <div className="flex justify-end gap-2">
                  <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="save-to-profile-btn">
                        <Save className="h-4 w-4 mr-2" /> Save to Client Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Calculation to Client Profile</DialogTitle>
                        <DialogDescription>
                          Save this retirement calculation to a client profile and optionally push to connected platforms.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="client-id">Client ID</Label>
                          <Input
                            id="client-id"
                            value={saveClientId}
                            onChange={(e) => setSaveClientId(e.target.value)}
                            placeholder="e.g., CLIENT-001 (auto-generated if blank)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="client-name">Client Name</Label>
                          <Input
                            id="client-name"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="e.g., John Smith"
                          />
                        </div>
                        <div>
                          <Label>Push to Platforms (optional)</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {['amp_north', 'netwealth', 'hub24', 'class', 'iress'].map(platform => (
                              <Button
                                key={platform}
                                variant={savePlatforms.includes(platform) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (savePlatforms.includes(platform)) {
                                    setSavePlatforms(savePlatforms.filter(p => p !== platform));
                                  } else {
                                    setSavePlatforms([...savePlatforms, platform]);
                                  }
                                }}
                              >
                                {platform.replace('_', ' ').toUpperCase()}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                        <Button onClick={saveToClientProfile} disabled={saving}>
                          {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                          {saving ? 'Saving...' : 'Save & Push'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Scenarios Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Scenario Comparison</CardTitle>
                    <CardDescription>Pessimistic, Expected, and Optimistic outcomes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-sm text-red-600">Pessimistic ({result.scenarios.pessimistic.return_rate}% return)</div>
                        <div className="text-2xl font-bold text-red-700">
                          {formatCurrency(result.scenarios.pessimistic.final_balance)}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-300">
                        <div className="text-sm text-green-600">Expected ({result.scenarios.expected.return_rate}% return)</div>
                        <div className="text-2xl font-bold text-green-700">
                          {formatCurrency(result.scenarios.expected.final_balance)}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-600">Optimistic ({result.scenarios.optimistic.return_rate}% return)</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {formatCurrency(result.scenarios.optimistic.final_balance)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Balance Growth Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Balance Growth Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={result.projections}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="age" />
                          <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Area type="monotone" dataKey="end_balance" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Nominal Balance" />
                          <Area type="monotone" dataKey="real_balance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Real Balance" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Asset Allocation Pie */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Asset Allocation - {result.investment.profile.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={getAllocationData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, value }) => `${name} ${value}%`}
                          >
                            {getAllocationData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Costs & Contributions Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contribution Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span>Annual Concessional</span>
                          <span className="font-medium">{formatCurrency(result.contributions.annual_concessional)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span>Annual Non-Concessional</span>
                          <span className="font-medium">{formatCurrency(result.contributions.annual_non_concessional)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span>Contributions Tax (15%)</span>
                          <span className="font-medium text-red-600">-{formatCurrency(result.contributions.contribution_tax.total_tax)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between p-2 bg-green-50 rounded font-bold">
                          <span>Net Annual Contribution</span>
                          <span className="text-green-700">{formatCurrency(result.contributions.net_annual_contribution)}</span>
                        </div>
                        <div className="mt-4">
                          {result.contributions.caps_status.within_caps ? (
                            <Badge className="bg-green-500">Within Contribution Caps</Badge>
                          ) : (
                            <Badge variant="destructive">Exceeds Contribution Caps</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cost Summary ({result.costs.fund_type})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(result.costs.annual_costs_breakdown).filter(([k, v]) => v > 0 && k !== 'total').map(([key, value]) => (
                          <div key={key} className="flex justify-between p-2 bg-muted rounded">
                            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="font-medium">{formatCurrency(value)}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between p-2 bg-red-50 rounded font-bold">
                          <span>Annual Costs Total</span>
                          <span className="text-red-700">{formatCurrency(result.costs.annual_costs_total)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-red-50 rounded font-bold">
                          <span>Lifetime Costs</span>
                          <span className="text-red-700">{formatCurrency(result.costs.lifetime_costs)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Export Buttons */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => exportResults('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => exportResults('json')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* PROJECTIONS TAB */}
          <TabsContent value="projections">
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Year-by-Year Projections</CardTitle>
                  <CardDescription>Detailed breakdown of your super growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Year</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead className="text-right">Start Balance</TableHead>
                          <TableHead className="text-right">Contributions</TableHead>
                          <TableHead className="text-right">Returns</TableHead>
                          <TableHead className="text-right">Costs</TableHead>
                          <TableHead className="text-right">End Balance</TableHead>
                          <TableHead className="text-right">Real Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.projections.map((row) => (
                          <TableRow key={row.year} className={row.age === result.summary.retirement_age ? 'bg-green-50' : ''}>
                            <TableCell>{row.year}</TableCell>
                            <TableCell>{row.age}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.start_balance)}</TableCell>
                            <TableCell className="text-right text-green-600">+{formatCurrency(row.contributions)}</TableCell>
                            <TableCell className="text-right text-blue-600">+{formatCurrency(row.investment_return)}</TableCell>
                            <TableCell className="text-right text-red-600">-{formatCurrency(row.costs)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(row.end_balance)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatCurrency(row.real_balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PROFILES TAB */}
          <TabsContent value="profiles">
            {profiles && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(profiles.profiles).map(([key, profile]) => (
                  <Card key={key} className={investmentProfile === key ? 'border-2 border-primary' : ''}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {profile.name}
                        <Badge style={{ backgroundColor: INVESTMENT_PROFILE_COLORS[key] }}>
                          {profile.target_return}% target
                        </Badge>
                      </CardTitle>
                      <CardDescription>{profile.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Expected Volatility:</span>
                          <span>{profile.volatility}%</span>
                        </div>
                        <Separator />
                        <div className="text-sm font-medium mb-2">Asset Allocation:</div>
                        {Object.entries(profile.allocation).filter(([_, v]) => v > 0).map(([asset, pct]) => (
                          <div key={asset} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: ASSET_COLORS[asset] }}
                            />
                            <span className="text-sm capitalize flex-1">{asset.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-medium">{pct}%</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        variant={investmentProfile === key ? 'default' : 'outline'}
                        onClick={() => {
                          setInvestmentProfile(key);
                          setActiveTab('calculator');
                        }}
                      >
                        {investmentProfile === key ? 'Selected' : 'Select This Profile'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REFERENCE TAB */}
          <TabsContent value="reference" className="space-y-6">
            {superCaps && (
              <Card>
                <CardHeader>
                  <CardTitle>Superannuation Contribution Caps (FY {superCaps.financial_year})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600">Concessional Cap</div>
                      <div className="text-2xl font-bold text-blue-700">{formatCurrency(superCaps.caps.concessional_cap)}</div>
                      <div className="text-xs text-blue-600 mt-1">Pre-tax contributions (employer + salary sacrifice)</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600">Non-Concessional Cap</div>
                      <div className="text-2xl font-bold text-green-700">{formatCurrency(superCaps.caps.non_concessional_cap)}</div>
                      <div className="text-xs text-green-600 mt-1">After-tax contributions per year</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600">Bring-Forward Cap</div>
                      <div className="text-2xl font-bold text-purple-700">{formatCurrency(superCaps.caps.bring_forward_cap)}</div>
                      <div className="text-xs text-purple-600 mt-1">3-year non-concessional bring-forward</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm text-orange-600">SG Rate</div>
                      <div className="text-2xl font-bold text-orange-700">{superCaps.caps.sg_rate}%</div>
                      <div className="text-xs text-orange-600 mt-1">Current Superannuation Guarantee rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {fundCosts && (
              <Card>
                <CardHeader>
                  <CardTitle>Fund Type Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fund Type</TableHead>
                        <TableHead>Admin Fee</TableHead>
                        <TableHead>Investment Fee</TableHead>
                        <TableHead>Other Fees</TableHead>
                        <TableHead>Best For</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Industry Fund</TableCell>
                        <TableCell>{fundCosts.fund_types.industry.admin_fee_percent}% + ${fundCosts.fund_types.industry.admin_fee_flat}</TableCell>
                        <TableCell>{fundCosts.fund_types.industry.investment_fee_percent}%</TableCell>
                        <TableCell>Insurance ~${fundCosts.fund_types.industry.insurance_default}</TableCell>
                        <TableCell>Most members, low cost</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Retail Fund</TableCell>
                        <TableCell>{fundCosts.fund_types.retail.admin_fee_percent}% + ${fundCosts.fund_types.retail.admin_fee_flat}</TableCell>
                        <TableCell>{fundCosts.fund_types.retail.investment_fee_percent}%</TableCell>
                        <TableCell>Insurance ~${fundCosts.fund_types.retail.insurance_default}</TableCell>
                        <TableCell>More investment options</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">SMSF</TableCell>
                        <TableCell>Accounting ${fundCosts.fund_types.smsf.accounting_fee}</TableCell>
                        <TableCell>{fundCosts.fund_types.smsf.investment_fee_percent}%</TableCell>
                        <TableCell>Audit ${fundCosts.fund_types.smsf.audit_fee}, ASIC ${fundCosts.fund_types.smsf.asic_fee}</TableCell>
                        <TableCell>Balances $400k+, control</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">SMA</TableCell>
                        <TableCell>{fundCosts.fund_types.sma.admin_fee_percent}%</TableCell>
                        <TableCell>{fundCosts.fund_types.sma.investment_fee_percent}%</TableCell>
                        <TableCell>Platform {fundCosts.fund_types.sma.platform_fee_percent}%</TableCell>
                        <TableCell>Direct ownership, tax efficiency</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {profiles?.asset_assumptions && (
              <Card>
                <CardHeader>
                  <CardTitle>Asset Class Assumptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Class</TableHead>
                        <TableHead>Expected Return</TableHead>
                        <TableHead>Income Yield</TableHead>
                        <TableHead>Volatility</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(profiles.asset_assumptions).map(([asset, data]) => (
                        <TableRow key={asset}>
                          <TableCell className="font-medium capitalize">{asset.replace(/_/g, ' ')}</TableCell>
                          <TableCell>{data.expected_return}%</TableCell>
                          <TableCell>{data.income_yield}%</TableCell>
                          <TableCell>{data.volatility}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
