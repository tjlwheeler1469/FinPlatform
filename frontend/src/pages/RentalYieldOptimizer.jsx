import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChartContainer from "@/components/ChartContainer";
import { 
  Building2,
  DollarSign,
  Percent,
  TrendingUp,
  TrendingDown,
  Calculator,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Info
} from "lucide-react";
import { usePortfolio } from "@/App";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value) => `${value.toFixed(2)}%`;

const RentalYieldOptimizer = () => {
  const { portfolio } = usePortfolio();

  // Property inputs
  const [propertyValue, setPropertyValue] = useState(850000);
  const [weeklyRent, setWeeklyRent] = useState(700);
  const [mortgageAmount, setMortgageAmount] = useState(510000);
  const [interestRate, setInterestRate] = useState(6.29);
  const [annualExpenses, setAnnualExpenses] = useState(8500);
  const [depreciation, setDepreciation] = useState(9700);
  const [vacancyRate, setVacancyRate] = useState(2);
  const [managementFee, setManagementFee] = useState(8);
  const [marginalTaxRate, setMarginalTaxRate] = useState(37);

  // Scenario adjustments
  const [rentIncrease, setRentIncrease] = useState(0);
  const [expenseReduction, setExpenseReduction] = useState(0);
  const [additionalPaydown, setAdditionalPaydown] = useState(0);

  // Calculate metrics
  const annualRent = weeklyRent * 52;
  const vacancyLoss = annualRent * (vacancyRate / 100);
  const effectiveRent = annualRent - vacancyLoss;
  const managementCost = effectiveRent * (managementFee / 100);
  const mortgageInterest = mortgageAmount * (interestRate / 100);
  
  const totalExpenses = annualExpenses + managementCost + mortgageInterest + depreciation;
  const netRentalIncome = effectiveRent - totalExpenses;
  const isNegativelyGeared = netRentalIncome < 0;
  const taxBenefit = isNegativelyGeared ? Math.abs(netRentalIncome) * (marginalTaxRate / 100) : 0;
  const afterTaxCashflow = netRentalIncome + taxBenefit + depreciation; // Add back depreciation as non-cash

  // Yields
  const grossYield = (annualRent / propertyValue) * 100;
  const netYield = (netRentalIncome / propertyValue) * 100;
  const cashOnCash = ((afterTaxCashflow) / (propertyValue - mortgageAmount)) * 100;

  // Optimized scenario
  const optimizedWeeklyRent = weeklyRent * (1 + rentIncrease / 100);
  const optimizedAnnualRent = optimizedWeeklyRent * 52;
  const optimizedVacancyLoss = optimizedAnnualRent * (vacancyRate / 100);
  const optimizedEffectiveRent = optimizedAnnualRent - optimizedVacancyLoss;
  const optimizedManagementCost = optimizedEffectiveRent * (managementFee / 100);
  const optimizedMortgageAmount = mortgageAmount - additionalPaydown;
  const optimizedMortgageInterest = optimizedMortgageAmount * (interestRate / 100);
  const optimizedExpenses = annualExpenses * (1 - expenseReduction / 100);
  
  const optimizedTotalExpenses = optimizedExpenses + optimizedManagementCost + optimizedMortgageInterest + depreciation;
  const optimizedNetRentalIncome = optimizedEffectiveRent - optimizedTotalExpenses;
  const optimizedIsNegativelyGeared = optimizedNetRentalIncome < 0;
  const optimizedTaxBenefit = optimizedIsNegativelyGeared ? Math.abs(optimizedNetRentalIncome) * (marginalTaxRate / 100) : 0;
  const optimizedAfterTaxCashflow = optimizedNetRentalIncome + optimizedTaxBenefit + depreciation;

  const optimizedGrossYield = (optimizedAnnualRent / propertyValue) * 100;
  const optimizedNetYield = (optimizedNetRentalIncome / propertyValue) * 100;
  const optimizedCashOnCash = ((optimizedAfterTaxCashflow) / (propertyValue - optimizedMortgageAmount)) * 100;

  const improvement = optimizedAfterTaxCashflow - afterTaxCashflow;

  // Benchmark data
  const benchmarkData = [
    { metric: "Gross Yield", current: grossYield, optimized: optimizedGrossYield, benchmark: 4.5, fullMark: 8 },
    { metric: "Net Yield", current: netYield, optimized: optimizedNetYield, benchmark: 2.0, fullMark: 5 },
    { metric: "Cash on Cash", current: cashOnCash, optimized: optimizedCashOnCash, benchmark: 5.0, fullMark: 15 },
    { metric: "LVR", current: (mortgageAmount/propertyValue)*100, optimized: (optimizedMortgageAmount/propertyValue)*100, benchmark: 60, fullMark: 100 },
    { metric: "Vacancy (%)", current: vacancyRate, optimized: vacancyRate, benchmark: 2, fullMark: 10 }
  ];

  // Comparison chart
  const comparisonData = [
    { name: "Gross Rent", current: annualRent, optimized: optimizedAnnualRent },
    { name: "Net Rent", current: netRentalIncome, optimized: optimizedNetRentalIncome },
    { name: "Tax Benefit", current: taxBenefit, optimized: optimizedTaxBenefit },
    { name: "After-Tax CF", current: afterTaxCashflow, optimized: optimizedAfterTaxCashflow }
  ];

  // Recommendations
  const generateRecommendations = () => {
    const recs = [];

    if (grossYield < 4) {
      recs.push({
        priority: "High",
        title: "Below-market rent",
        detail: `Gross yield of ${formatPercent(grossYield)} is below the 4-5% benchmark. Consider rent review.`,
        action: "Increase rent by 5-10%"
      });
    }

    if ((mortgageAmount / propertyValue) > 0.8) {
      recs.push({
        priority: "High",
        title: "High LVR",
        detail: `LVR of ${((mortgageAmount/propertyValue)*100).toFixed(0)}% increases risk and interest costs.`,
        action: "Pay down principal to reduce LVR below 80%"
      });
    }

    if (vacancyRate > 3) {
      recs.push({
        priority: "Medium",
        title: "High vacancy rate",
        detail: `${vacancyRate}% vacancy exceeds the 2% benchmark. Review property management.`,
        action: "Consider reducing rent slightly for longer tenancy"
      });
    }

    if (managementFee > 7) {
      recs.push({
        priority: "Medium",
        title: "High management fees",
        detail: `${managementFee}% management fee is above market average of 5-7%.`,
        action: "Negotiate with agent or consider self-management"
      });
    }

    if (depreciation === 0) {
      recs.push({
        priority: "Medium",
        title: "No depreciation claimed",
        detail: "You may be missing significant tax deductions.",
        action: "Commission a quantity surveyor depreciation schedule"
      });
    }

    if (interestRate > 6.5) {
      recs.push({
        priority: "Low",
        title: "Review loan rate",
        detail: `Current rate of ${interestRate}% may be above market.`,
        action: "Shop around or negotiate with current lender"
      });
    }

    return recs;
  };

  const recommendations = generateRecommendations();

  return (
    <Layout>
      <div className="space-y-6" data-testid="rental-yield-optimizer-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
            Rental Yield Optimizer
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze and optimize your rental property returns
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0F392B] text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/70">Gross Yield</p>
              <p className="text-2xl font-bold">{formatPercent(grossYield)}</p>
              <p className="text-xs text-white/60">Benchmark: 4-5%</p>
            </CardContent>
          </Card>
          <Card className={netYield >= 0 ? "bg-[#10B981]/10 border-[#10B981]" : "bg-destructive/10 border-destructive"}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Net Yield</p>
              <p className={`text-2xl font-bold ${netYield >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                {formatPercent(netYield)}
              </p>
              <p className="text-xs text-muted-foreground">After expenses</p>
            </CardContent>
          </Card>
          <Card className={isNegativelyGeared ? "bg-[#D4AF37]/10 border-[#D4AF37]" : ""}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Tax Benefit</p>
              <p className="text-2xl font-bold text-[#D4AF37]">{formatCurrency(taxBenefit)}</p>
              <p className="text-xs text-muted-foreground">{isNegativelyGeared ? "Negatively geared" : "Positively geared"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">After-Tax Cash Flow</p>
              <p className={`text-2xl font-bold ${afterTaxCashflow >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                {formatCurrency(afterTaxCashflow)}
              </p>
              <p className="text-xs text-muted-foreground">/year</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Inputs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Property Value</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Weekly Rent</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={weeklyRent}
                    onChange={(e) => setWeeklyRent(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Annual: {formatCurrency(annualRent)}</p>
              </div>

              <div className="space-y-2">
                <Label>Mortgage Balance</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={mortgageAmount}
                    onChange={(e) => setMortgageAmount(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">LVR: {((mortgageAmount/propertyValue)*100).toFixed(0)}%</p>
              </div>

              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Annual Expenses (rates, insurance, repairs)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={annualExpenses}
                    onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Annual Depreciation</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={depreciation}
                    onChange={(e) => setDepreciation(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vacancy Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={vacancyRate}
                    onChange={(e) => setVacancyRate(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mgmt Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={managementFee}
                    onChange={(e) => setManagementFee(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Marginal Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={marginalTaxRate}
                  onChange={(e) => setMarginalTaxRate(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Optimization Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#D4AF37]" />
                Optimize Returns
              </CardTitle>
              <CardDescription>Adjust scenarios to see impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Rent Increase</Label>
                  <span className="font-medium">{rentIncrease}%</span>
                </div>
                <Slider
                  value={[rentIncrease]}
                  onValueChange={(v) => setRentIncrease(v[0])}
                  max={20}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  New rent: {formatCurrency(optimizedWeeklyRent)}/week ({formatCurrency(optimizedAnnualRent)}/year)
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Expense Reduction</Label>
                  <span className="font-medium">{expenseReduction}%</span>
                </div>
                <Slider
                  value={[expenseReduction]}
                  onValueChange={(v) => setExpenseReduction(v[0])}
                  max={30}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  New expenses: {formatCurrency(optimizedExpenses)}/year
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Principal Paydown</Label>
                  <span className="font-medium">{formatCurrency(additionalPaydown)}</span>
                </div>
                <Slider
                  value={[additionalPaydown]}
                  onValueChange={(v) => setAdditionalPaydown(v[0])}
                  max={100000}
                  step={5000}
                />
                <p className="text-xs text-muted-foreground">
                  New balance: {formatCurrency(optimizedMortgageAmount)}
                </p>
              </div>

              {/* Optimized Results */}
              <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                <h4 className="font-semibold mb-3">Optimized Results</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Gross Yield</span>
                    <span className="font-medium">{formatPercent(optimizedGrossYield)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Net Yield</span>
                    <span className="font-medium">{formatPercent(optimizedNetYield)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">After-Tax Cash Flow</span>
                    <span className="font-medium">{formatCurrency(optimizedAfterTaxCashflow)}</span>
                  </div>
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-[#D4AF37]">Annual Improvement</span>
                      <span className={`font-bold ${improvement >= 0 ? 'text-[#10B981]' : 'text-red-400'}`}>
                        {improvement >= 0 ? '+' : ''}{formatCurrency(improvement)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#10B981]" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-[#10B981]" />
                  <p>Property is well-optimized!</p>
                </div>
              ) : (
                recommendations.map((rec, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-lg border ${
                      rec.priority === 'High' ? 'bg-red-50 border-red-200' :
                      rec.priority === 'Medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {rec.priority === 'High' ? (
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      ) : rec.priority === 'Medium' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      ) : (
                        <Info className="h-4 w-4 text-green-600 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-medium text-sm ${
                          rec.priority === 'High' ? 'text-red-800' :
                          rec.priority === 'Medium' ? 'text-amber-800' :
                          'text-green-800'
                        }`}>{rec.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{rec.detail}</p>
                        <p className="text-xs font-medium mt-1 flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" /> {rec.action}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparison Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Current vs Optimized</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="current" name="Current" fill="#0F392B" />
                    <Bar dataKey="optimized" name="Optimized" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Income Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Income & Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between p-2 rounded bg-[#10B981]/10">
                  <span>Gross Rent</span>
                  <span className="font-semibold text-[#10B981]">{formatCurrency(annualRent)}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-destructive/10">
                  <span>Vacancy Loss ({vacancyRate}%)</span>
                  <span className="font-semibold text-destructive">-{formatCurrency(vacancyLoss)}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-destructive/10">
                  <span>Management Fee ({managementFee}%)</span>
                  <span className="font-semibold text-destructive">-{formatCurrency(managementCost)}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-destructive/10">
                  <span>Mortgage Interest</span>
                  <span className="font-semibold text-destructive">-{formatCurrency(mortgageInterest)}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-destructive/10">
                  <span>Other Expenses</span>
                  <span className="font-semibold text-destructive">-{formatCurrency(annualExpenses)}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#D4AF37]/10">
                  <span>Depreciation (non-cash)</span>
                  <span className="font-semibold text-[#D4AF37]">-{formatCurrency(depreciation)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span className="font-semibold">Net Rental Income</span>
                    <span className={`font-bold ${netRentalIncome >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                      {formatCurrency(netRentalIncome)}
                    </span>
                  </div>
                </div>
                {isNegativelyGeared && (
                  <div className="flex justify-between p-2 rounded bg-[#D4AF37]/10 border border-[#D4AF37]">
                    <span className="font-semibold">Tax Benefit</span>
                    <span className="font-bold text-[#D4AF37]">+{formatCurrency(taxBenefit)}</span>
                  </div>
                )}
                <div className="flex justify-between p-3 rounded bg-[#0F392B] text-white">
                  <span className="font-semibold">After-Tax Cash Flow</span>
                  <span className="font-bold">{formatCurrency(afterTaxCashflow)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RentalYieldOptimizer;
