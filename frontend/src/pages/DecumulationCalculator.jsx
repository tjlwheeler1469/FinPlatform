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
import {
  Calculator, TrendingDown, DollarSign, PiggyBank, Building, Users, Calendar,
  Target, Briefcase, ChevronRight, Download, RefreshCw, AlertTriangle,
  CheckCircle2, Info, BarChart3, Wallet, Shield, Clock, Plus, Trash2,
  Home, Car, CreditCard, Landmark, ArrowUpDown, CircleDollarSign
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend, ComposedChart
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ASSET_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'term_deposit', label: 'Term Deposit' },
  { value: 'shares_australian', label: 'Australian Shares' },
  { value: 'shares_international', label: 'International Shares' },
  { value: 'managed_funds', label: 'Managed Funds' },
  { value: 'etf', label: 'ETFs' },
  { value: 'property_investment', label: 'Investment Property' },
  { value: 'property_residential', label: 'Residential Property (Home)' },
  { value: 'super_accumulation', label: 'Super (Accumulation)' },
  { value: 'super_pension', label: 'Super (Pension)' },
  { value: 'bonds', label: 'Bonds' },
  { value: 'annuity', label: 'Annuity' },
  { value: 'business_assets', label: 'Business Assets' },
  { value: 'other', label: 'Other' },
];

const ENTITY_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'joint', label: 'Joint' },
  { value: 'smsf', label: 'SMSF' },
  { value: 'trust', label: 'Family Trust' },
  { value: 'company', label: 'Company' },
  { value: 'super_fund', label: 'Super Fund' },
];

const LIABILITY_TYPES = [
  { value: 'mortgage_primary', label: 'Home Mortgage' },
  { value: 'mortgage_investment', label: 'Investment Loan' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'car_loan', label: 'Car Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'margin_loan', label: 'Margin Loan' },
  { value: 'smsf_limited_recourse', label: 'SMSF Limited Recourse' },
  { value: 'other', label: 'Other' },
];

const DRAWDOWN_STRATEGIES = [
  { value: 'minimum', label: 'Minimum Required', description: 'Draw only SMSF minimum' },
  { value: 'percentage', label: 'Fixed Percentage', description: 'Fixed % of balance' },
  { value: 'fixed_amount', label: 'Fixed Amount', description: 'Target dollar amount' },
];

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

export default function DecumulationCalculator() {
  const [activeTab, setActiveTab] = useState('setup');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [rules, setRules] = useState(null);
  
  // Mode
  const [isClientMode, setIsClientMode] = useState(false);
  const [clientName, setClientName] = useState('');
  
  // Personal Details
  const [currentAge, setCurrentAge] = useState(67);
  const [gender, setGender] = useState('male');
  const [isHomeowner, setIsHomeowner] = useState(true);
  const [relationshipStatus, setRelationshipStatus] = useState('single');
  
  // Assets
  const [assets, setAssets] = useState([
    { id: 1, name: 'Family Home', asset_type: 'property_residential', entity: 'individual', current_value: 1000000, is_assessable_for_pension: false },
    { id: 2, name: 'Share Portfolio', asset_type: 'shares_australian', entity: 'individual', current_value: 200000, is_assessable_for_pension: true },
  ]);
  
  // Liabilities
  const [liabilities, setLiabilities] = useState([]);
  
  // Super Pensions
  const [superPensions, setSuperPensions] = useState([
    { id: 1, name: 'Main Super', fund_name: 'Super Fund', account_type: 'account_based', current_balance: 500000, fees_percent: 0.8 }
  ]);
  
  // Other Income
  const [otherIncome, setOtherIncome] = useState([]);
  
  // Expenses
  const [expenses, setExpenses] = useState([
    { id: 1, name: 'Living Expenses', annual_amount: 50000, category: 'living' },
    { id: 2, name: 'Healthcare', annual_amount: 8000, category: 'healthcare' },
  ]);
  
  // Drawdown Settings
  const [drawdownStrategy, setDrawdownStrategy] = useState('minimum');
  const [targetPercentage, setTargetPercentage] = useState(5);
  const [targetAmount, setTargetAmount] = useState(50000);
  const [legacyTarget, setLegacyTarget] = useState(0);
  
  // Settings
  const [inflationRate, setInflationRate] = useState(2.5);
  const [projectionYears, setProjectionYears] = useState(30);
  const [includeAgePension, setIncludeAgePension] = useState(true);
  
  // Dialogs
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  // New item forms
  const [newAsset, setNewAsset] = useState({ name: '', asset_type: 'cash', entity: 'individual', current_value: 0, is_assessable_for_pension: true });
  const [newLiability, setNewLiability] = useState({ name: '', liability_type: 'personal_loan', entity: 'individual', current_balance: 0, interest_rate: 6 });
  const [newIncome, setNewIncome] = useState({ name: '', annual_amount: 0, start_age: 67, is_taxable: true });
  const [newExpense, setNewExpense] = useState({ name: '', annual_amount: 0, category: 'living' });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await fetch(`${API_URL}/api/decumulation/rules`);
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const calculateDecumulation = async () => {
    setCalculating(true);
    try {
      const request = {
        person: {
          name: isClientMode ? clientName : null,
          current_age: currentAge,
          gender,
          is_homeowner: isHomeowner,
          relationship_status: relationshipStatus,
        },
        assets: assets.map(a => ({
          name: a.name,
          asset_type: a.asset_type,
          entity: a.entity,
          current_value: a.current_value,
          is_assessable_for_pension: a.is_assessable_for_pension,
        })),
        liabilities: liabilities.map(l => ({
          name: l.name,
          liability_type: l.liability_type,
          entity: l.entity,
          current_balance: l.current_balance,
          interest_rate: l.interest_rate,
        })),
        super_pensions: superPensions.map(s => ({
          name: s.name,
          fund_name: s.fund_name,
          account_type: s.account_type,
          current_balance: s.current_balance,
          fees_percent: s.fees_percent,
        })),
        other_income: otherIncome.map(i => ({
          name: i.name,
          annual_amount: i.annual_amount,
          start_age: i.start_age,
          is_taxable: i.is_taxable,
        })),
        expenses: expenses.map(e => ({
          name: e.name,
          annual_amount: e.annual_amount,
          category: e.category,
        })),
        drawdown_settings: {
          strategy: drawdownStrategy,
          target_percentage: drawdownStrategy === 'percentage' ? targetPercentage : null,
          target_income: drawdownStrategy === 'fixed_amount' ? targetAmount : null,
          legacy_target: legacyTarget,
        },
        inflation_rate: inflationRate,
        projection_years: projectionYears,
        include_age_pension: includeAgePension,
        is_client: isClientMode,
        client_name: isClientMode ? clientName : null,
      };
      
      const response = await fetch(`${API_URL}/api/decumulation/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      setResult(data);
      setActiveTab('results');
    } catch (error) {
      console.error('Calculation failed:', error);
    }
    setCalculating(false);
  };

  const loadSample = async () => {
    setCalculating(true);
    try {
      const response = await fetch(`${API_URL}/api/decumulation/demo/sample-calculation`);
      const data = await response.json();
      setResult(data);
      setActiveTab('results');
    } catch (error) {
      console.error('Failed to load sample:', error);
    }
    setCalculating(false);
  };

  const addAsset = () => {
    setAssets([...assets, { ...newAsset, id: Date.now() }]);
    setNewAsset({ name: '', asset_type: 'cash', entity: 'individual', current_value: 0, is_assessable_for_pension: true });
    setShowAddAsset(false);
  };

  const addLiability = () => {
    setLiabilities([...liabilities, { ...newLiability, id: Date.now() }]);
    setNewLiability({ name: '', liability_type: 'personal_loan', entity: 'individual', current_balance: 0, interest_rate: 6 });
    setShowAddLiability(false);
  };

  const addIncome = () => {
    setOtherIncome([...otherIncome, { ...newIncome, id: Date.now() }]);
    setNewIncome({ name: '', annual_amount: 0, start_age: 67, is_taxable: true });
    setShowAddIncome(false);
  };

  const addExpense = () => {
    setExpenses([...expenses, { ...newExpense, id: Date.now() }]);
    setNewExpense({ name: '', annual_amount: 0, category: 'living' });
    setShowAddExpense(false);
  };

  const removeItem = (list, setList, id) => {
    setList(list.filter(item => item.id !== id));
  };

  const formatCurrency = (value) => `AUD $${(value || 0).toLocaleString()}`;

  const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
  const totalSuper = superPensions.reduce((sum, s) => sum + s.current_balance, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.current_balance, 0);
  const netPosition = totalAssets + totalSuper - totalLiabilities;

  const getAssetsByTypeData = () => {
    if (!result?.assets_by_type) return [];
    return Object.entries(result.assets_by_type).map(([type, data], idx) => ({
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: data.total_value,
      color: COLORS[idx % COLORS.length]
    }));
  };

  const getAssetsByEntityData = () => {
    if (!result?.assets_by_entity) return [];
    return Object.entries(result.assets_by_entity).map(([entity, data], idx) => ({
      name: entity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: data.total_value,
      color: COLORS[idx % COLORS.length]
    }));
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="decumulation-calculator">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <TrendingDown className="h-8 w-8 text-primary" />
              Decumulation Calculator
            </h1>
            <p className="text-muted-foreground">
              Pension Phase Planning - Drawdown, Assets & Age Pension Modeling
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={isClientMode} onCheckedChange={setIsClientMode} />
              <Label>{isClientMode ? 'Client Mode' : 'Personal Mode'}</Label>
            </div>
            <Button variant="outline" onClick={loadSample} disabled={calculating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
              Load Sample
            </Button>
          </div>
        </div>

        {isClientMode && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertTitle>Adviser Mode</AlertTitle>
            <AlertDescription>
              <Input 
                value={clientName} 
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="w-64 mt-2"
              />
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm text-green-600">Total Assets</div>
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(totalAssets)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-blue-600">Super Pension</div>
                  <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalSuper)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-sm text-red-600">Liabilities</div>
                  <div className="text-2xl font-bold text-red-700">{formatCurrency(totalLiabilities)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-sm text-purple-600">Net Position</div>
                  <div className="text-2xl font-bold text-purple-700">{formatCurrency(netPosition)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="setup" data-testid="setup-tab">
              <Users className="h-4 w-4 mr-2" />Setup
            </TabsTrigger>
            <TabsTrigger value="assets" data-testid="assets-tab">
              <Building className="h-4 w-4 mr-2" />Assets
            </TabsTrigger>
            <TabsTrigger value="income" data-testid="income-tab">
              <CircleDollarSign className="h-4 w-4 mr-2" />Income
            </TabsTrigger>
            <TabsTrigger value="results" data-testid="results-tab" disabled={!result}>
              <BarChart3 className="h-4 w-4 mr-2" />Results
            </TabsTrigger>
            <TabsTrigger value="projections" data-testid="projections-tab" disabled={!result}>
              <TrendingDown className="h-4 w-4 mr-2" />Projections
            </TabsTrigger>
            <TabsTrigger value="rules" data-testid="rules-tab">
              <Info className="h-4 w-4 mr-2" />Rules
            </TabsTrigger>
          </TabsList>

          {/* SETUP TAB */}
          <TabsContent value="setup" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Current Age: {currentAge}</Label>
                    <Slider value={[currentAge]} onValueChange={([v]) => setCurrentAge(v)} min={55} max={100} step={1} className="mt-2" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isHomeowner} onCheckedChange={setIsHomeowner} />
                    <Label>Homeowner (affects Age Pension)</Label>
                  </div>
                  <div>
                    <Label>Relationship Status</Label>
                    <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="partnered">Partnered/Couple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5" /> Drawdown Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Strategy</Label>
                    <Select value={drawdownStrategy} onValueChange={setDrawdownStrategy}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DRAWDOWN_STRATEGIES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {DRAWDOWN_STRATEGIES.find(s => s.value === drawdownStrategy)?.description}
                    </p>
                  </div>
                  {drawdownStrategy === 'percentage' && (
                    <div>
                      <Label>Target Percentage: {targetPercentage}%</Label>
                      <Slider value={[targetPercentage]} onValueChange={([v]) => setTargetPercentage(v)} min={4} max={15} step={0.5} className="mt-2" />
                    </div>
                  )}
                  {drawdownStrategy === 'fixed_amount' && (
                    <div>
                      <Label>Target Annual Amount (AUD)</Label>
                      <Input type="number" value={targetAmount} onChange={(e) => setTargetAmount(Number(e.target.value))} className="mt-1" />
                    </div>
                  )}
                  <Separator />
                  <div>
                    <Label>Legacy Target (Estate Value)</Label>
                    <Input type="number" value={legacyTarget} onChange={(e) => setLegacyTarget(Number(e.target.value))} className="mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">Amount you want to leave to beneficiaries</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" /> Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Projection Years: {projectionYears}</Label>
                    <Slider value={[projectionYears]} onValueChange={([v]) => setProjectionYears(v)} min={10} max={40} step={1} className="mt-2" />
                  </div>
                  <div>
                    <Label>Inflation Rate: {inflationRate}%</Label>
                    <Slider value={[inflationRate]} onValueChange={([v]) => setInflationRate(v)} min={0} max={6} step={0.1} className="mt-2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={includeAgePension} onCheckedChange={setIncludeAgePension} />
                    <Label>Include Age Pension Calculation</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5" /> Super Pensions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {superPensions.map((pension) => (
                    <div key={pension.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{pension.name}</div>
                        <div className="text-sm text-muted-foreground">{pension.fund_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(pension.current_balance)}</div>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(superPensions, setSuperPensions, pension.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => setSuperPensions([...superPensions, { id: Date.now(), name: 'New Super', fund_name: 'Fund', account_type: 'account_based', current_balance: 100000, fees_percent: 0.8 }])}>
                    <Plus className="h-4 w-4 mr-2" /> Add Super Pension
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ASSETS TAB */}
          <TabsContent value="assets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" /> Assets
                  </CardTitle>
                  <Button onClick={() => setShowAddAsset(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Asset
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {assets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{asset.entity}</Badge>
                              <span className="font-medium">{asset.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground capitalize">{asset.asset_type.replace(/_/g, ' ')}</div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div className="font-bold">{formatCurrency(asset.current_value)}</div>
                              {!asset.is_assessable_for_pension && (
                                <Badge variant="secondary" className="text-xs">Exempt</Badge>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(assets, setAssets, asset.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Liabilities */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" /> Liabilities
                  </CardTitle>
                  <Button onClick={() => setShowAddLiability(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Liability
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {liabilities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No liabilities added</div>
                      ) : (
                        liabilities.map((liability) => (
                          <div key={liability.id} className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{liability.entity}</Badge>
                                <span className="font-medium">{liability.name}</span>
                              </div>
                              <div className="text-sm text-muted-foreground capitalize">{liability.liability_type.replace(/_/g, ' ')} • {liability.interest_rate}% p.a.</div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div className="font-bold text-red-600">-{formatCurrency(liability.current_balance)}</div>
                              <Button variant="ghost" size="sm" onClick={() => removeItem(liabilities, setLiabilities, liability.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* INCOME TAB */}
          <TabsContent value="income" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Other Income */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CircleDollarSign className="h-5 w-5" /> Other Income Streams
                  </CardTitle>
                  <Button onClick={() => setShowAddIncome(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Income
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {otherIncome.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No other income added (e.g., rental, part-time work)</div>
                    ) : (
                      otherIncome.map((income) => (
                        <div key={income.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                          <div>
                            <div className="font-medium">{income.name}</div>
                            <div className="text-sm text-muted-foreground">From age {income.start_age}</div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div className="font-bold text-green-600">+{formatCurrency(income.annual_amount)}/yr</div>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(otherIncome, setOtherIncome, income.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Expenses */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" /> Expenses
                  </CardTitle>
                  <Button onClick={() => setShowAddExpense(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Expense
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{expense.name}</div>
                          <Badge variant="outline" className="capitalize">{expense.category}</Badge>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div className="font-bold">{formatCurrency(expense.annual_amount)}/yr</div>
                          <Button variant="ghost" size="sm" onClick={() => removeItem(expenses, setExpenses, expense.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Annual Expenses</span>
                      <span>{formatCurrency(expenses.reduce((sum, e) => sum + e.annual_amount, 0))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calculate Button */}
            <div className="flex justify-center">
              <Button size="lg" onClick={calculateDecumulation} disabled={calculating} className="px-12" data-testid="calculate-btn">
                {calculating ? (
                  <><RefreshCw className="h-5 w-5 mr-2 animate-spin" />Calculating...</>
                ) : (
                  <><Calculator className="h-5 w-5 mr-2" />Calculate Pension Phase Projection</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* RESULTS TAB */}
          <TabsContent value="results" className="space-y-6">
            {result && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-4">
                      <div className="text-sm text-green-600">Total Annual Income</div>
                      <div className="text-2xl font-bold text-green-700">{formatCurrency(result.income_analysis.total_income)}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-4">
                      <div className="text-sm text-blue-600">Super Drawdown</div>
                      <div className="text-2xl font-bold text-blue-700">{formatCurrency(result.drawdown_analysis.planned_annual_drawdown)}</div>
                      <div className="text-xs text-blue-600">{result.drawdown_analysis.minimum_drawdown_rate}% minimum rate</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-4">
                      <div className="text-sm text-purple-600">Age Pension</div>
                      <div className="text-2xl font-bold text-purple-700">{formatCurrency(result.age_pension?.annual_pension || 0)}</div>
                      {result.age_pension?.is_eligible && <Badge className="bg-purple-500 mt-1">Eligible</Badge>}
                    </CardContent>
                  </Card>
                  <Card className={`bg-gradient-to-br ${result.income_analysis.surplus_deficit >= 0 ? 'from-emerald-50 to-emerald-100' : 'from-red-50 to-red-100'}`}>
                    <CardContent className="pt-4">
                      <div className={`text-sm ${result.income_analysis.surplus_deficit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {result.income_analysis.surplus_deficit >= 0 ? 'Surplus' : 'Deficit'}
                      </div>
                      <div className={`text-2xl font-bold ${result.income_analysis.surplus_deficit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatCurrency(Math.abs(result.income_analysis.surplus_deficit))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Assets by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={getAssetsByTypeData()} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                            {getAssetsByTypeData().map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Assets by Entity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={getAssetsByEntityData()} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                            {getAssetsByEntityData().map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Longevity Analysis */}
                <Card className={result.longevity_analysis.fund_exhaustion_age ? 'border-red-300' : 'border-green-300'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Longevity Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <div className="text-sm text-muted-foreground">Life Expectancy</div>
                        <div className="text-3xl font-bold">{result.summary.expected_lifespan}</div>
                        <div className="text-xs">({result.summary.life_expectancy_years} more years)</div>
                      </div>
                      <div className={`p-4 rounded-lg text-center ${result.longevity_analysis.fund_exhaustion_age ? 'bg-red-100' : 'bg-green-100'}`}>
                        <div className={`text-sm ${result.longevity_analysis.fund_exhaustion_age ? 'text-red-600' : 'text-green-600'}`}>
                          Funds Last Until
                        </div>
                        <div className={`text-3xl font-bold ${result.longevity_analysis.fund_exhaustion_age ? 'text-red-700' : 'text-green-700'}`}>
                          {result.longevity_analysis.fund_exhaustion_age ? `Age ${result.longevity_analysis.fund_exhaustion_age}` : `${result.longevity_analysis.years_funds_projected_to_last}+ years`}
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <div className="text-sm text-muted-foreground">Final Net Position</div>
                        <div className="text-3xl font-bold">{formatCurrency(result.longevity_analysis.final_net_position)}</div>
                        {result.longevity_analysis.meets_legacy_target && <Badge className="mt-1 bg-green-500">Meets Legacy Target</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Net Position Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Net Position Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={result.projections}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age" />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                        <Area type="monotone" dataKey="super_balance" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Super" />
                        <Area type="monotone" dataKey="other_assets" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Other Assets" />
                        <Area type="monotone" dataKey="liabilities" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Liabilities" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* PROJECTIONS TAB */}
          <TabsContent value="projections">
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Year-by-Year Projections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Age</TableHead>
                          <TableHead className="text-right">Super</TableHead>
                          <TableHead className="text-right">Other Assets</TableHead>
                          <TableHead className="text-right">Liabilities</TableHead>
                          <TableHead className="text-right">Net Position</TableHead>
                          <TableHead className="text-right">Drawdown</TableHead>
                          <TableHead className="text-right">Age Pension</TableHead>
                          <TableHead className="text-right">Total Income</TableHead>
                          <TableHead className="text-right">Expenses</TableHead>
                          <TableHead className="text-right">+/-</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.projections.map((row) => (
                          <TableRow key={row.year} className={row.super_balance <= 0 ? 'bg-red-50' : ''}>
                            <TableCell className="font-medium">{row.age}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.super_balance)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.other_assets)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(row.liabilities)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(row.net_position)}</TableCell>
                            <TableCell className="text-right text-blue-600">{formatCurrency(row.super_drawdown)}</TableCell>
                            <TableCell className="text-right text-purple-600">{formatCurrency(row.age_pension)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(row.total_income)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.expenses)}</TableCell>
                            <TableCell className={`text-right font-medium ${row.surplus_deficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {row.surplus_deficit >= 0 ? '+' : ''}{formatCurrency(row.surplus_deficit)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* RULES TAB */}
          <TabsContent value="rules" className="space-y-6">
            {rules && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Minimum Drawdown Rates (SMSF/Super Pension)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Age Range</TableHead>
                          <TableHead>Minimum %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(rules.minimum_drawdown_rates).map(([range, rate]) => (
                          <TableRow key={range}>
                            <TableCell className="capitalize">{range.replace(/_/g, ' ')}</TableCell>
                            <TableCell className="font-bold">{rate}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Age Pension Thresholds (FY 2024-25)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Pension Rates</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between p-2 bg-muted rounded">
                            <span>Single (max)</span>
                            <span className="font-bold">{formatCurrency(rules.age_pension_rates.max_rate_single)}/yr</span>
                          </div>
                          <div className="flex justify-between p-2 bg-muted rounded">
                            <span>Couple (max combined)</span>
                            <span className="font-bold">{formatCurrency(rules.age_pension_rates.max_rate_couple)}/yr</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Asset Thresholds (Homeowner, Single)</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between p-2 bg-muted rounded">
                            <span>Full Pension Threshold</span>
                            <span className="font-bold">{formatCurrency(rules.age_pension_rates.assets_threshold_homeowner_single)}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-muted rounded">
                            <span>Cut-off</span>
                            <span className="font-bold">{formatCurrency(rules.age_pension_rates.assets_cutoff_homeowner_single)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold mb-2">Deeming Rates</h3>
                      <p className="text-sm text-muted-foreground mb-2">How Centrelink calculates income from financial assets:</p>
                      <ul className="text-sm space-y-1">
                        <li>• Below threshold ({formatCurrency(rules.age_pension_rates.deeming_threshold_single)}): <strong>{rules.age_pension_rates.deeming_rate_below}%</strong></li>
                        <li>• Above threshold: <strong>{rules.age_pension_rates.deeming_rate_above}%</strong></li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Transfer Balance Cap</div>
                        <div className="text-2xl font-bold">{formatCurrency(rules.transfer_balance_cap)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Max that can be transferred to tax-free pension</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Pension Age</div>
                        <div className="text-2xl font-bold">{rules.pension_age}</div>
                        <p className="text-xs text-muted-foreground mt-1">Age to qualify for Age Pension</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Asset Dialog */}
        <Dialog open={showAddAsset} onOpenChange={setShowAddAsset}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Asset Name</Label>
                <Input value={newAsset.name} onChange={(e) => setNewAsset({...newAsset, name: e.target.value})} placeholder="e.g., Share Portfolio" />
              </div>
              <div>
                <Label>Asset Type</Label>
                <Select value={newAsset.asset_type} onValueChange={(v) => setNewAsset({...newAsset, asset_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Entity</Label>
                <Select value={newAsset.entity} onValueChange={(v) => setNewAsset({...newAsset, entity: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current Value (AUD)</Label>
                <Input type="number" value={newAsset.current_value} onChange={(e) => setNewAsset({...newAsset, current_value: Number(e.target.value)})} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newAsset.is_assessable_for_pension} onCheckedChange={(v) => setNewAsset({...newAsset, is_assessable_for_pension: v})} />
                <Label>Assessable for Age Pension</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddAsset(false)}>Cancel</Button>
              <Button onClick={addAsset}>Add Asset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Liability Dialog */}
        <Dialog open={showAddLiability} onOpenChange={setShowAddLiability}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Liability</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Liability Name</Label>
                <Input value={newLiability.name} onChange={(e) => setNewLiability({...newLiability, name: e.target.value})} placeholder="e.g., Investment Loan" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newLiability.liability_type} onValueChange={(v) => setNewLiability({...newLiability, liability_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LIABILITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Entity</Label>
                <Select value={newLiability.entity} onValueChange={(v) => setNewLiability({...newLiability, entity: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current Balance (AUD)</Label>
                <Input type="number" value={newLiability.current_balance} onChange={(e) => setNewLiability({...newLiability, current_balance: Number(e.target.value)})} />
              </div>
              <div>
                <Label>Interest Rate (%)</Label>
                <Input type="number" value={newLiability.interest_rate} onChange={(e) => setNewLiability({...newLiability, interest_rate: Number(e.target.value)})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddLiability(false)}>Cancel</Button>
              <Button onClick={addLiability}>Add Liability</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Income Dialog */}
        <Dialog open={showAddIncome} onOpenChange={setShowAddIncome}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Income Stream</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Income Name</Label>
                <Input value={newIncome.name} onChange={(e) => setNewIncome({...newIncome, name: e.target.value})} placeholder="e.g., Rental Income" />
              </div>
              <div>
                <Label>Annual Amount (AUD)</Label>
                <Input type="number" value={newIncome.annual_amount} onChange={(e) => setNewIncome({...newIncome, annual_amount: Number(e.target.value)})} />
              </div>
              <div>
                <Label>Start Age</Label>
                <Input type="number" value={newIncome.start_age} onChange={(e) => setNewIncome({...newIncome, start_age: Number(e.target.value)})} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newIncome.is_taxable} onCheckedChange={(v) => setNewIncome({...newIncome, is_taxable: v})} />
                <Label>Taxable Income</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddIncome(false)}>Cancel</Button>
              <Button onClick={addIncome}>Add Income</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Expense Dialog */}
        <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Expense Name</Label>
                <Input value={newExpense.name} onChange={(e) => setNewExpense({...newExpense, name: e.target.value})} placeholder="e.g., Travel" />
              </div>
              <div>
                <Label>Annual Amount (AUD)</Label>
                <Input type="number" value={newExpense.annual_amount} onChange={(e) => setNewExpense({...newExpense, annual_amount: Number(e.target.value)})} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newExpense.category} onValueChange={(v) => setNewExpense({...newExpense, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="living">Living Expenses</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="leisure">Leisure & Travel</SelectItem>
                    <SelectItem value="housing">Housing</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddExpense(false)}>Cancel</Button>
              <Button onClick={addExpense}>Add Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
