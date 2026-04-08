import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User, Wallet, TrendingUp, Gauge, PiggyBank, Building2, Shield,
  ChevronRight, DollarSign, Target, Clock, BarChart3, RefreshCw, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

// Unified client data matching PersonalDashboard mockAssets/mockLiabilities
const CLIENT_DATA = {
  name: "David & Sarah Thompson",
  status: "Married",
  age: 50,
  retirementAge: 67,
  riskProfile: "Balanced",
  incomeHousehold: 185000,
  expensesAnnual: 95000,
  assets: [
    { name: 'David - AustralianSuper', type: 'Super', value: 245000 },
    { name: 'Sarah - REST Super', type: 'Super', value: 198000 },
    { name: 'Family Home - Glen Waverley', type: 'Property', value: 985000 },
    { name: 'Investment Unit - Brunswick', type: 'Property', value: 620000 },
    { name: 'Vanguard High Growth ETF', type: 'Shares', value: 42000 },
    { name: 'BHP Group Shares', type: 'Shares', value: 18500 },
    { name: 'CBA Shares (DRP)', type: 'Shares', value: 24000 },
    { name: 'Emergency Fund - ING Savings', type: 'Cash', value: 28000 },
    { name: 'Term Deposit - Westpac 12m', type: 'Cash', value: 35000 },
    { name: 'Colonial First State Balanced', type: 'Managed Fund', value: 32000 },
    { name: 'Bitcoin (Coinbase)', type: 'Crypto', value: 8500 },
    { name: 'Toyota RAV4 Hybrid 2023', type: 'Other', value: 42000 },
  ],
  liabilities: [
    { name: 'Home Loan - CBA', type: 'Mortgage', value: 285000, rate: 6.19 },
    { name: 'Investment Loan - ANZ', type: 'Mortgage', value: 380000, rate: 6.49 },
    { name: 'Credit Card - Visa', type: 'Credit', value: 4200, rate: 19.99 },
  ],
};

const ClientProfileTab = ({ clientId }) => {
  const [retirementData, setRetirementData] = useState(null);
  const [loading, setLoading] = useState(true);

  const totalAssets = CLIENT_DATA.assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = CLIENT_DATA.liabilities.reduce((sum, l) => sum + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;
  const totalSuper = CLIENT_DATA.assets.filter(a => a.type === 'Super').reduce((s, a) => s + a.value, 0);
  const totalProperty = CLIENT_DATA.assets.filter(a => a.type === 'Property').reduce((s, a) => s + a.value, 0);
  const totalShares = CLIENT_DATA.assets.filter(a => a.type === 'Shares').reduce((s, a) => s + a.value, 0);
  const totalCash = CLIENT_DATA.assets.filter(a => a.type === 'Cash').reduce((s, a) => s + a.value, 0);

  const assetsByType = CLIENT_DATA.assets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + a.value;
    return acc;
  }, {});

  useEffect(() => {
    const fetchRetirement = async () => {
      try {
        const response = await fetch(`${API}/hybrid-engine/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId || 'thompson_family',
            current_age: 50,
            retirement_age: 67,
            life_expectancy: 92,
            current_portfolio: netWorth,
            annual_contributions: 42000,
            retirement_spending: 72000,
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
    fetchRetirement();
  }, [clientId, netWorth]);

  const confidence = retirementData?.confidence_score || 0;
  const getConfidenceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };
  const getConfidenceLabel = (score) => {
    if (score >= 80) return 'On Track';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Attention';
    return 'At Risk';
  };

  return (
    <div className="space-y-6" data-testid="client-profile-tab">
      {/* Client Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1a2744] flex items-center justify-center text-white text-lg font-bold">
            DT
          </div>
          <div>
            <h2 className="text-xl font-bold">{CLIENT_DATA.name}</h2>
            <p className="text-sm text-muted-foreground">
              {CLIENT_DATA.status} | Age {CLIENT_DATA.age} | Risk: {CLIENT_DATA.riskProfile} | Retirement: Age {CLIENT_DATA.retirementAge}
            </p>
          </div>
        </div>
        <Badge className="bg-[#1a2744] text-lg px-3 py-1">{formatCurrency(netWorth)}</Badge>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Wallet className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-xs text-muted-foreground">Net Worth</p>
            <p className="text-lg font-bold">{formatCurrency(netWorth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-xs text-muted-foreground">Gross Assets</p>
            <p className="text-lg font-bold">{formatCurrency(totalAssets)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Shield className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <p className="text-xs text-muted-foreground">Super Combined</p>
            <p className="text-lg font-bold">{formatCurrency(totalSuper)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-amber-600" />
            <p className="text-xs text-muted-foreground">Income (Household)</p>
            <p className="text-lg font-bold">{formatCurrency(CLIENT_DATA.incomeHousehold)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <p className="text-xs text-muted-foreground">Total Debt</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Retirement Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-5 w-5 text-green-600" />
            Retirement Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                <p className={`text-3xl font-bold ${getConfidenceColor(confidence)}`}>{confidence.toFixed(0)}%</p>
                <Badge className={confidence >= 80 ? 'bg-green-500 mt-1' : confidence >= 60 ? 'bg-blue-500 mt-1' : 'bg-amber-500 mt-1'}>
                  {getConfidenceLabel(confidence)}
                </Badge>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Years to Retirement</p>
                <p className="text-3xl font-bold">{CLIENT_DATA.retirementAge - CLIENT_DATA.age}</p>
                <p className="text-xs text-muted-foreground">At age {CLIENT_DATA.retirementAge}</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Annual Savings</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(CLIENT_DATA.incomeHousehold - CLIENT_DATA.expensesAnnual)}</p>
                <p className="text-xs text-muted-foreground">{((1 - CLIENT_DATA.expensesAnnual / CLIENT_DATA.incomeHousehold) * 100).toFixed(0)}% savings rate</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Target Spending</p>
                <p className="text-3xl font-bold">$72,000</p>
                <p className="text-xs text-muted-foreground">ASFA comfortable std</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Allocation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Portfolio Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(assetsByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, value]) => (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{type}</span>
                    <span>{formatCurrency(value)} ({((value / totalAssets) * 100).toFixed(1)}%)</span>
                  </div>
                  <Progress value={(value / totalAssets) * 100} className="h-2" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Holdings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Top Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...CLIENT_DATA.assets]
              .sort((a, b) => b.value - a.value)
              .slice(0, 6)
              .map((asset, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      asset.type === 'Property' ? 'bg-purple-100 text-purple-600' :
                      asset.type === 'Super' ? 'bg-green-100 text-green-600' :
                      asset.type === 'Shares' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {asset.type === 'Property' ? <Building2 className="h-4 w-4" /> :
                       asset.type === 'Super' ? <Shield className="h-4 w-4" /> :
                       asset.type === 'Shares' ? <TrendingUp className="h-4 w-4" /> :
                       <Wallet className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{asset.name}</p>
                      <Badge variant="outline" className="text-[10px]">{asset.type}</Badge>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(asset.value)}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Liabilities */}
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-red-600">
            <DollarSign className="h-5 w-5" />
            Liabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {CLIENT_DATA.liabilities.map((l, i) => (
              <div key={i} className="flex items-center justify-between p-2 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.type} | {l.rate}% p.a.</p>
                </div>
                <p className="font-bold text-red-600">{formatCurrency(l.value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientProfileTab;
