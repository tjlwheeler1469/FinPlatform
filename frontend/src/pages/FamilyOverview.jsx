import { useState } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Building2,
  Shield,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Wallet,
  Calendar,
  ArrowRight
} from "lucide-react";
import { usePortfolio } from "@/App";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Australian Tax Calculator
const calculateTax = (income) => {
  if (income <= 0) return 0;
  let tax = 0;
  if (income > 190000) tax += (income - 190000) * 0.45;
  if (income > 135000) tax += Math.min(income - 135000, 55000) * 0.37;
  if (income > 45000) tax += Math.min(income - 45000, 90000) * 0.30;
  if (income > 18200) tax += Math.min(income - 18200, 26800) * 0.16;
  if (income > 24276) tax += income * 0.02; // Medicare
  return Math.round(tax);
};

const FamilyOverview = () => {
  const { 
    familyMembers, 
    trust, 
    budget, 
    portfolio,
    hasUnsavedChanges,
    lastSaved,
    saveAllData,
    resetToDefaults,
    getMonthlyCashflow,
    getCashflowProjection,
    getTrustBeneficiaries,
    getPrimaryEarners
  } = usePortfolio();

  const monthlyCashflow = getMonthlyCashflow();
  const cashflowProjection = getCashflowProjection();
  const trustBeneficiaries = getTrustBeneficiaries();
  const primaryEarners = getPrimaryEarners();

  // Calculate family totals
  const totalFamilyIncome = familyMembers.reduce((sum, m) => sum + (m.taxableIncome || 0), 0);
  const totalFamilyTax = familyMembers.reduce((sum, m) => sum + calculateTax(m.taxableIncome || 0), 0);
  const totalFamilyNetIncome = totalFamilyIncome - totalFamilyTax;
  const effectiveTaxRate = totalFamilyIncome > 0 ? (totalFamilyTax / totalFamilyIncome) * 100 : 0;

  // Trust distribution totals
  const totalTrustDistribution = trustBeneficiaries.reduce((sum, b) => sum + (b.trustDistribution || 0), 0);
  const undistributedTrust = 100 - totalTrustDistribution;

  // Annual cashflow
  const annualSurplus = monthlyCashflow.surplus * 12;
  const annualIncome = monthlyCashflow.income * 12;
  const annualExpenses = monthlyCashflow.expenses * 12;

  // Investment summary
  const totalInvestments = 
    portfolio.investments.cash_savings +
    portfolio.investments.term_deposit_amount +
    portfolio.investments.shares_value +
    portfolio.investments.etf_value +
    portfolio.investments.bonds_value;

  // Family member income breakdown for chart
  const familyIncomeData = familyMembers
    .filter(m => m.taxableIncome > 0)
    .map(m => ({
      name: m.name.split(' ')[0],
      income: m.taxableIncome,
      tax: calculateTax(m.taxableIncome),
      net: m.taxableIncome - calculateTax(m.taxableIncome)
    }));

  // Quick links
  const quickLinks = [
    { path: "/income-splitting", label: "Income Splitting", icon: Users, color: "#1a2744" },
    { path: "/trust-distributions", label: "Trust Analysis", icon: Shield, color: "#D4A84C" },
    { path: "/budget", label: "Budget", icon: Wallet, color: "#10B981" },
    { path: "/tax-analysis", label: "Tax Analysis", icon: DollarSign, color: "#3B82F6" }
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="family-overview-page">
        {/* Header with Save Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Family Overview
            </h1>
            <p className="text-muted-foreground mt-1">
              Holistic view of Thompson Family finances
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
            {lastSaved && !hasUnsavedChanges && (
              <span className="text-xs text-muted-foreground">
                Last saved: {new Date(lastSaved).toLocaleString('en-AU')}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              onClick={saveAllData} 
              className="bg-[#1a2744] hover:bg-[#1a2744]/90"
              disabled={!hasUnsavedChanges}
              data-testid="save-btn"
            >
              <Save className="h-4 w-4 mr-2" />
              Save All
            </Button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map(link => (
            <Link key={link.path} to={link.path}>
              <Card className="hover:border-[#1a2744]/30 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${link.color}15` }}
                  >
                    <link.icon className="h-5 w-5" style={{ color: link.color }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{link.label}</p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      Open <ArrowRight className="h-3 w-3 ml-1" />
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#1a2744] text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/80">Total Family Income</p>
              <p className="text-2xl font-bold">{formatCurrency(totalFamilyIncome)}</p>
              <p className="text-xs text-white/60 mt-1">{familyMembers.length} members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Tax</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalFamilyTax)}</p>
              <p className="text-xs text-muted-foreground mt-1">{effectiveTaxRate.toFixed(1)}% effective rate</p>
            </CardContent>
          </Card>
          <Card className="bg-[#10B981]/10 border-[#10B981]/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Monthly Surplus</p>
              <p className={`text-2xl font-bold ${monthlyCashflow.surplus >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                {formatCurrency(monthlyCashflow.surplus)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(annualSurplus)}/year</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Net Worth</p>
              <p className="text-2xl font-bold text-[#D4A84C]">{formatCurrency(portfolio.summary.netWorth)}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(portfolio.summary.totalDebt)} debt</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 12-Month Cashflow Projection */}
          <Card className="lg:col-span-2" data-testid="cashflow-projection">
            <CardHeader>
              <CardTitle className=" flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#10B981]" />
                12-Month Cashflow Projection
              </CardTitle>
              <CardDescription>
                Monthly surplus and cumulative savings forecast
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={300}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <ComposedChart data={cashflowProjection}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      yAxisId="left" 
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(value), name]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="income" name="Income" fill="#10B981" opacity={0.8} />
                    <Bar yAxisId="left" dataKey="expenses" name="Expenses" fill="#EF4444" opacity={0.8} />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="cumulativeSavings" 
                      name="Cumulative Savings"
                      stroke="#D4A84C" 
                      strokeWidth={3}
                      dot={{ fill: '#D4A84C' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
              
              {/* Projection Summary */}
              <div className="grid grid-cols-3 gap-4 mt-4 p-4 rounded-lg bg-muted/50">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Year-End Projection</p>
                  <p className="text-xl font-bold text-[#D4A84C]">
                    {formatCurrency(cashflowProjection[11]?.cumulativeSavings || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Annual Savings</p>
                  <p className="text-xl font-bold text-[#10B981]">{formatCurrency(annualSurplus)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Savings Rate</p>
                  <p className="text-xl font-bold">
                    {annualIncome > 0 ? ((annualSurplus / annualIncome) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Family Members Summary */}
          <Card data-testid="family-members-summary">
            <CardHeader>
              <CardTitle className=" flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1a2744]" />
                Family Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {familyMembers.map(member => (
                <div key={member.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {member.relationship.replace('_', ' ')}
                      </Badge>
                      {member.isTrustBeneficiary && (
                        <Badge className="bg-[#D4A84C]/10 text-[#D4A84C] text-xs">
                          Trust {member.trustDistribution}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Income</p>
                      <p className="font-medium">{formatCurrency(member.taxableIncome)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tax</p>
                      <p className="font-medium text-destructive">{formatCurrency(calculateTax(member.taxableIncome))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Net</p>
                      <p className="font-medium text-[#10B981]">
                        {formatCurrency(member.taxableIncome - calculateTax(member.taxableIncome))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <Link to="/income-splitting">
                <Button variant="outline" className="w-full mt-2">
                  Manage Family Members
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Family Income Breakdown Chart */}
          <Card data-testid="family-income-chart">
            <CardHeader>
              <CardTitle className=" flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#10B981]" />
                Income by Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer height={250}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={familyIncomeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={60} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="income" name="Gross Income" fill="#1a2744" stackId="a" />
                    <Bar dataKey="tax" name="Tax" fill="#EF4444" stackId="b" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Trust Distribution Summary */}
          <Card data-testid="trust-summary">
            <CardHeader>
              <CardTitle className=" flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#D4A84C]" />
                Trust Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-[#1a2744] text-white">
                <p className="text-sm text-white/80">{trust.name}</p>
                <p className="text-2xl font-bold">{formatCurrency(trust.netIncome)}</p>
                <p className="text-xs text-white/60">FY {trust.financialYear}</p>
              </div>

              <div className="space-y-2">
                {trustBeneficiaries.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{b.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{b.trustDistribution}%</span>
                      <span className="text-sm text-muted-foreground">
                        ({formatCurrency(trust.netIncome * b.trustDistribution / 100)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {undistributedTrust > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {undistributedTrust}% undistributed ({formatCurrency(trust.netIncome * undistributedTrust / 100)}) - taxed at 47%
                  </p>
                </div>
              )}

              <Link to="/trust-distributions">
                <Button variant="outline" className="w-full">
                  Manage Trust Distributions
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Monthly Budget Summary */}
          <Card data-testid="budget-summary">
            <CardHeader>
              <CardTitle className=" flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#3B82F6]" />
                Monthly Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-[#10B981]/10 text-center">
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="text-lg font-bold text-[#10B981]">{formatCurrency(monthlyCashflow.income)}</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center">
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="text-lg font-bold text-destructive">{formatCurrency(monthlyCashflow.expenses)}</p>
                </div>
                <div className={`p-3 rounded-lg text-center ${monthlyCashflow.surplus >= 0 ? 'bg-[#D4A84C]/10' : 'bg-destructive/10'}`}>
                  <p className="text-xs text-muted-foreground">Surplus</p>
                  <p className={`text-lg font-bold ${monthlyCashflow.surplus >= 0 ? 'text-[#D4A84C]' : 'text-destructive'}`}>
                    {formatCurrency(monthlyCashflow.surplus)}
                  </p>
                </div>
              </div>

              {/* Budget Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Budget Utilization</span>
                  <span className="font-medium">
                    {((monthlyCashflow.expenses / monthlyCashflow.income) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={(monthlyCashflow.expenses / monthlyCashflow.income) * 100} 
                  className="h-2"
                />
              </div>

              {/* Top Expenses */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Top Expenses</p>
                {Object.entries(budget.expenses)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-medium">{formatCurrency(value)}</span>
                    </div>
                  ))}
              </div>

              <Link to="/budget">
                <Button variant="outline" className="w-full">
                  Manage Budget
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default FamilyOverview;
