import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Shield,
  Users,
  DollarSign,
  TrendingDown,
  Calculator,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Plus,
  Trash2,
  User,
  Building2,
  PieChart as PieChartIcon
} from "lucide-react";
import { usePortfolio } from "@/App";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Australian 2024-25 Tax Brackets
const TAX_BRACKETS = [
  { min: 0, max: 18200, rate: 0, label: "$0 - $18,200" },
  { min: 18201, max: 45000, rate: 0.16, label: "$18,201 - $45,000" },
  { min: 45001, max: 135000, rate: 0.30, label: "$45,001 - $135,000" },
  { min: 135001, max: 190000, rate: 0.37, label: "$135,001 - $190,000" },
  { min: 190001, max: Infinity, rate: 0.45, label: "$190,001+" }
];

// Undistributed trust income rate
const UNDISTRIBUTED_RATE = 0.47;

const calculateTax = (income) => {
  if (income <= 0) return 0;
  
  let tax = 0;
  let remaining = income;
  
  for (const bracket of TAX_BRACKETS) {
    if (remaining <= 0) break;
    
    const bracketSize = bracket.max - bracket.min + (bracket.min === 0 ? 0 : 1);
    const taxableInBracket = Math.min(remaining, bracketSize);
    
    if (income > bracket.min) {
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
    }
  }
  
  // Medicare levy 2% for income over threshold
  if (income > 24276) {
    tax += income * 0.02;
  }
  
  return Math.round(tax);
};

const getTaxBreakdown = (income) => {
  const breakdown = [];
  let remaining = income;
  
  for (const bracket of TAX_BRACKETS) {
    if (remaining <= 0) break;
    
    const bracketSize = bracket.max - bracket.min + (bracket.min === 0 ? 0 : 1);
    const taxableInBracket = Math.min(remaining, bracketSize);
    
    if (income > bracket.min) {
      breakdown.push({
        bracket: bracket.label,
        rate: bracket.rate * 100,
        taxable: taxableInBracket,
        tax: Math.round(taxableInBracket * bracket.rate)
      });
      remaining -= taxableInBracket;
    }
  }
  
  // Medicare levy
  if (income > 24276) {
    breakdown.push({
      bracket: "Medicare Levy",
      rate: 2,
      taxable: income,
      tax: Math.round(income * 0.02)
    });
  }
  
  return breakdown;
};

const getMarginalRate = (income) => {
  for (let i = TAX_BRACKETS.length - 1; i >= 0; i--) {
    if (income >= TAX_BRACKETS[i].min) {
      return TAX_BRACKETS[i].rate * 100 + (income > 24276 ? 2 : 0);
    }
  }
  return 0;
};

const COLORS = ['#0F392B', '#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const TrustDistributionAnalysis = () => {
  const { portfolio } = usePortfolio();
  
  // Trust configuration
  const [trustIncome, setTrustIncome] = useState(150000);
  const [trustType, setTrustType] = useState("discretionary");
  
  // Beneficiaries with their existing income
  const [beneficiaries, setBeneficiaries] = useState([
    { id: 1, name: "James Wheeler", type: "individual", existingIncome: 120000, distribution: 30 },
    { id: 2, name: "Sarah Wheeler", type: "individual", existingIncome: 65000, distribution: 30 },
    { id: 3, name: "Emily Wheeler (Adult)", type: "individual", existingIncome: 25000, distribution: 20 },
    { id: 4, name: "Michael Wheeler (Adult)", type: "individual", existingIncome: 0, distribution: 20 }
  ]);

  const [showDetailed, setShowDetailed] = useState(null);

  // Calculate distributions and tax for each beneficiary
  const calculateBeneficiaryTax = (beneficiary) => {
    const distributionAmount = (trustIncome * beneficiary.distribution) / 100;
    const totalIncome = beneficiary.existingIncome + distributionAmount;
    
    // Tax on total income
    const totalTax = calculateTax(totalIncome);
    
    // Tax on existing income only
    const existingTax = calculateTax(beneficiary.existingIncome);
    
    // Tax attributable to trust distribution
    const distributionTax = totalTax - existingTax;
    
    // Effective rate on distribution
    const effectiveRate = distributionAmount > 0 
      ? (distributionTax / distributionAmount) * 100 
      : 0;
    
    // Marginal rate before and after
    const marginalBefore = getMarginalRate(beneficiary.existingIncome);
    const marginalAfter = getMarginalRate(totalIncome);
    
    return {
      ...beneficiary,
      distributionAmount,
      totalIncome,
      totalTax,
      existingTax,
      distributionTax,
      effectiveRate,
      marginalBefore,
      marginalAfter,
      netDistribution: distributionAmount - distributionTax,
      taxBreakdown: getTaxBreakdown(totalIncome)
    };
  };

  const analysisResults = beneficiaries.map(calculateBeneficiaryTax);
  
  // Total distributed
  const totalDistributed = analysisResults.reduce((sum, b) => sum + b.distributionAmount, 0);
  const undistributed = trustIncome - totalDistributed;
  const undistributedTax = Math.round(undistributed * UNDISTRIBUTED_RATE);
  
  // Total tax paid on distributions
  const totalDistributionTax = analysisResults.reduce((sum, b) => sum + b.distributionTax, 0);
  
  // Combined tax (distributions + undistributed)
  const combinedTax = totalDistributionTax + undistributedTax;
  
  // Compare to if all income went to highest earner
  const highestEarner = beneficiaries.reduce((max, b) => 
    b.existingIncome > max.existingIncome ? b : max, beneficiaries[0]);
  const noSplitTax = calculateTax(highestEarner.existingIncome + trustIncome) - 
                     calculateTax(highestEarner.existingIncome);
  
  const taxSavings = noSplitTax - combinedTax;
  
  // Distribution percentage total
  const totalPercentage = beneficiaries.reduce((sum, b) => sum + b.distribution, 0);

  // Update distribution
  const updateDistribution = (id, value) => {
    setBeneficiaries(prev => prev.map(b => 
      b.id === id ? { ...b, distribution: Math.max(0, Math.min(100, value)) } : b
    ));
  };

  // Add beneficiary
  const addBeneficiary = () => {
    const newId = Math.max(...beneficiaries.map(b => b.id)) + 1;
    setBeneficiaries(prev => [...prev, {
      id: newId,
      name: `Beneficiary ${newId}`,
      type: "individual",
      existingIncome: 0,
      distribution: 0
    }]);
  };

  // Remove beneficiary
  const removeBeneficiary = (id) => {
    if (beneficiaries.length > 1) {
      setBeneficiaries(prev => prev.filter(b => b.id !== id));
    }
  };

  // Chart data
  const taxComparisonData = [
    { name: "No Split", tax: noSplitTax, fill: "#EF4444" },
    { name: "With Split", tax: combinedTax, fill: "#10B981" }
  ];

  const distributionPieData = analysisResults
    .filter(b => b.distributionAmount > 0)
    .map((b, i) => ({
      name: b.name.split(' ')[0],
      value: b.distributionAmount,
      color: COLORS[i % COLORS.length]
    }));

  if (undistributed > 0) {
    distributionPieData.push({
      name: "Undistributed",
      value: undistributed,
      color: "#6B7280"
    });
  }

  const effectiveRateData = analysisResults.map((b, i) => ({
    name: b.name.split(' ')[0],
    effectiveRate: b.effectiveRate,
    marginalRate: b.marginalAfter,
    fill: COLORS[i % COLORS.length]
  }));

  return (
    <Layout>
      <div className="space-y-6" data-testid="trust-distribution-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
            Trust Distribution Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Detailed tax impact per beneficiary with distribution optimization
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0F392B] text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/80">Trust Income</p>
              <p className="text-2xl font-bold">{formatCurrency(trustIncome)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Tax on Distributions</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(combinedTax)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#10B981]/10 border-[#10B981]/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Tax Savings (vs No Split)</p>
              <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(taxSavings)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Distribution %</p>
              <p className={`text-2xl font-bold ${totalPercentage === 100 ? 'text-[#10B981]' : totalPercentage > 100 ? 'text-destructive' : 'text-[#D4AF37]'}`}>
                {totalPercentage}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Warning if distribution > 100% */}
        {totalPercentage > 100 && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">
                Total distribution exceeds 100%. Adjust beneficiary percentages.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Undistributed warning */}
        {undistributed > 0 && totalPercentage < 100 && (
          <Card className="bg-[#D4AF37]/10 border-[#D4AF37]/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[#D4AF37]" />
              <p className="text-sm">
                <strong>{formatCurrency(undistributed)}</strong> will remain undistributed and taxed at 47% ({formatCurrency(undistributedTax)} tax). 
                Consider distributing to beneficiaries in lower tax brackets.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trust Configuration */}
          <Card className="lg:col-span-1" data-testid="trust-config">
            <CardHeader>
              <CardTitle className="font-['Manrope'] flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#0F392B]" />
                Trust Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Trust Net Income</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={trustIncome}
                    onChange={(e) => setTrustIncome(Number(e.target.value))}
                    className="pl-10"
                    data-testid="trust-income-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Trust Type</Label>
                <select
                  value={trustType}
                  onChange={(e) => setTrustType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="discretionary">Discretionary Trust</option>
                  <option value="unit">Unit Trust</option>
                  <option value="hybrid">Hybrid Trust</option>
                </select>
              </div>

              <Separator />

              {/* Distribution Pie Chart */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4" />
                  Distribution Allocation
                </h4>
                <ChartContainer height={180}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        dataKey="value"
                      >
                        {distributionPieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="space-y-1 mt-2">
                  {distributionPieData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Beneficiary Distribution */}
          <Card className="lg:col-span-2" data-testid="beneficiary-distributions">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-['Manrope'] flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#D4AF37]" />
                    Beneficiary Tax Impact
                  </CardTitle>
                  <CardDescription>
                    Adjust distribution percentages to optimize total tax
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addBeneficiary}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Beneficiary
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysisResults.map((result, index) => (
                <div 
                  key={result.id} 
                  className="p-4 rounded-lg border space-y-4"
                  data-testid={`beneficiary-${result.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}>
                        <User className="h-5 w-5" style={{ color: COLORS[index % COLORS.length] }} />
                      </div>
                      <div>
                        <Input
                          value={result.name}
                          onChange={(e) => setBeneficiaries(prev => prev.map(b => 
                            b.id === result.id ? { ...b, name: e.target.value } : b
                          ))}
                          className="font-semibold border-0 p-0 h-auto focus-visible:ring-0"
                        />
                        <p className="text-sm text-muted-foreground">
                          Existing: {formatCurrency(result.existingIncome)} • 
                          Marginal: {result.marginalBefore.toFixed(0)}% → {result.marginalAfter.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowDetailed(showDetailed === result.id ? null : result.id)}
                      >
                        {showDetailed === result.id ? "Hide" : "Show"} Details
                      </Button>
                      {beneficiaries.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeBeneficiary(result.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Distribution Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Distribution: <strong>{result.distribution}%</strong></span>
                      <span className="text-[#D4AF37] font-semibold">{formatCurrency(result.distributionAmount)}</span>
                    </div>
                    <Slider
                      value={[result.distribution]}
                      onValueChange={(v) => updateDistribution(result.id, v[0])}
                      max={100}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Existing Income</span>
                      <Input
                        type="number"
                        value={result.existingIncome}
                        onChange={(e) => setBeneficiaries(prev => prev.map(b => 
                          b.id === result.id ? { ...b, existingIncome: Number(e.target.value) } : b
                        ))}
                        className="w-32 h-6 text-xs"
                      />
                    </div>
                  </div>

                  {/* Summary Row */}
                  <div className="grid grid-cols-4 gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Distribution</p>
                      <p className="font-semibold text-[#D4AF37]">{formatCurrency(result.distributionAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Tax on Dist.</p>
                      <p className="font-semibold text-destructive">{formatCurrency(result.distributionTax)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Effective Rate</p>
                      <p className="font-semibold">{result.effectiveRate.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Net Received</p>
                      <p className="font-semibold text-[#10B981]">{formatCurrency(result.netDistribution)}</p>
                    </div>
                  </div>

                  {/* Detailed Tax Breakdown */}
                  {showDetailed === result.id && (
                    <div className="mt-4 p-4 rounded-lg bg-[#0F392B]/5 space-y-3">
                      <h5 className="font-semibold flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Tax Bracket Breakdown
                      </h5>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Bracket</th>
                            <th className="text-right p-2">Rate</th>
                            <th className="text-right p-2">Taxable</th>
                            <th className="text-right p-2">Tax</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.taxBreakdown.map((bracket, i) => (
                            <tr key={i} className="border-b">
                              <td className="p-2 text-muted-foreground">{bracket.bracket}</td>
                              <td className="text-right p-2">{bracket.rate}%</td>
                              <td className="text-right p-2">{formatCurrency(bracket.taxable)}</td>
                              <td className="text-right p-2 font-medium">{formatCurrency(bracket.tax)}</td>
                            </tr>
                          ))}
                          <tr className="font-semibold bg-muted/30">
                            <td className="p-2" colSpan={3}>Total Tax on Combined Income</td>
                            <td className="text-right p-2 text-destructive">{formatCurrency(result.totalTax)}</td>
                          </tr>
                          <tr className="font-semibold">
                            <td className="p-2" colSpan={3}>Tax Attributable to Distribution</td>
                            <td className="text-right p-2 text-[#D4AF37]">{formatCurrency(result.distributionTax)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}

              {/* Totals */}
              <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-white/80">Total Distributed</p>
                    <p className="text-xl font-bold">{formatCurrency(totalDistributed)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white/80">Tax on Distributions</p>
                    <p className="text-xl font-bold">{formatCurrency(totalDistributionTax)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white/80">Undistributed Tax (47%)</p>
                    <p className="text-xl font-bold">{formatCurrency(undistributedTax)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white/80">Total Tax</p>
                    <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(combinedTax)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tax Comparison Chart */}
          <Card data-testid="tax-comparison">
            <CardHeader>
              <CardTitle className="font-['Manrope']">Tax Comparison</CardTitle>
              <CardDescription>
                Splitting vs all income to highest earner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={250}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taxComparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="tax" radius={[0, 4, 4, 0]}>
                      {taxComparisonData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="mt-4 p-4 rounded-lg bg-[#10B981]/10 text-center">
                <p className="text-sm text-muted-foreground">Annual Tax Savings</p>
                <p className="text-3xl font-bold text-[#10B981]">{formatCurrency(taxSavings)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Effective Rate Comparison */}
          <Card data-testid="effective-rate-comparison">
            <CardHeader>
              <CardTitle className="font-['Manrope']">Effective Rates by Beneficiary</CardTitle>
              <CardDescription>
                Tax rate on distribution vs marginal rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={250}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={effectiveRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                    <Legend />
                    <Bar dataKey="effectiveRate" name="Effective Rate on Dist." fill="#D4AF37" />
                    <Bar dataKey="marginalRate" name="New Marginal Rate" fill="#0F392B" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card data-testid="recommendations">
          <CardHeader>
            <CardTitle className="font-['Manrope'] flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[#D4AF37]" />
              Distribution Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Generate dynamic recommendations */}
            {analysisResults.map((result, i) => {
              if (result.distribution === 0) return null;
              
              const recommendations = [];
              
              // Tax-free threshold
              if (result.existingIncome === 0 && result.distributionAmount <= 18200) {
                recommendations.push({
                  type: "success",
                  text: `${result.name}: Distribution of ${formatCurrency(result.distributionAmount)} falls within tax-free threshold. Zero tax on this distribution.`
                });
              }
              
              // Low tax bracket
              if (result.effectiveRate < 20 && result.distributionAmount > 0) {
                recommendations.push({
                  type: "success",
                  text: `${result.name}: Effective rate of ${result.effectiveRate.toFixed(1)}% is low. Consider increasing distribution to this beneficiary.`
                });
              }
              
              // High marginal rate warning
              if (result.marginalAfter >= 37 && result.distributionAmount > 0) {
                recommendations.push({
                  type: "warning",
                  text: `${result.name}: New marginal rate of ${result.marginalAfter.toFixed(0)}% is high. Consider redistributing to lower-taxed beneficiaries.`
                });
              }
              
              return recommendations.map((rec, j) => (
                <div 
                  key={`${i}-${j}`} 
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    rec.type === 'success' ? 'bg-[#10B981]/10' : 'bg-[#D4AF37]/10'
                  }`}
                >
                  {rec.type === 'success' 
                    ? <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0" />
                    : <AlertTriangle className="h-5 w-5 text-[#D4AF37] flex-shrink-0" />
                  }
                  <p className="text-sm">{rec.text}</p>
                </div>
              ));
            })}
            
            {/* Undistributed recommendation */}
            {undistributed > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-sm">
                  <strong>Undistributed Income:</strong> {formatCurrency(undistributed)} will be taxed at 47% 
                  ({formatCurrency(undistributedTax)}). Distribute to beneficiaries to reduce tax.
                </p>
              </div>
            )}
            
            {/* General strategies */}
            <Separator />
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Lightbulb className="h-5 w-5 text-[#D4AF37] flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Optimization Strategy</p>
                <p className="text-muted-foreground">
                  Prioritize distributions to beneficiaries with low existing income to utilize the tax-free threshold 
                  ($18,200) and lower tax brackets. Adult children with minimal income are ideal recipients.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TrustDistributionAnalysis;
