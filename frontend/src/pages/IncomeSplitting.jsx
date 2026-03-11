import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { 
  Users,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Calculator,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  PieChart,
  Scale,
  Building2,
  Shield,
  Plus,
  Trash2,
  Save
} from "lucide-react";
import { usePortfolio } from "@/App";
import ChartContainer from "@/components/ChartContainer";
import { Link } from "react-router-dom";
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
  PieChart as RechartsPie,
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
  { min: 0, max: 18200, rate: 0 },
  { min: 18201, max: 45000, rate: 0.16 },
  { min: 45001, max: 135000, rate: 0.30 },
  { min: 135001, max: 190000, rate: 0.37 },
  { min: 190001, max: Infinity, rate: 0.45 }
];

const calculateTax = (income) => {
  let tax = 0;
  let remaining = income;
  
  for (const bracket of TAX_BRACKETS) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min + 1);
    if (income > bracket.min) {
      const actualTaxable = Math.min(taxableInBracket, income - bracket.min);
      tax += actualTaxable * bracket.rate;
      remaining -= taxableInBracket;
    }
  }
  
  // Medicare levy 2%
  if (income > 24276) {
    tax += income * 0.02;
  }
  
  return Math.round(tax);
};

const getMarginalRate = (income) => {
  for (let i = TAX_BRACKETS.length - 1; i >= 0; i--) {
    if (income >= TAX_BRACKETS[i].min) {
      return TAX_BRACKETS[i].rate * 100 + 2; // +2% for Medicare
    }
  }
  return 0;
};

const COLORS = ['#0F392B', '#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const IncomeSplitting = () => {
  const { 
    familyMembers, 
    updateFamilyMember, 
    addFamilyMember, 
    removeFamilyMember,
    hasUnsavedChanges,
    saveAllData,
    trust,
    portfolio
  } = usePortfolio();

  // Income sources that can be split
  const [incomeSources, setIncomeSources] = useState({
    dividends: Math.round(portfolio.investments.shares_value * (portfolio.investments.shares_dividend_yield / 100)),
    rentalIncome: portfolio.investments.properties.reduce((sum, p) => sum + (p.rental_income || 0), 0),
    trustDistributions: trust.netIncome,
    interestIncome: Math.round(portfolio.investments.term_deposit_amount * (portfolio.investments.term_deposit_rate / 100))
  });

  // Update income sources when trust changes
  useEffect(() => {
    setIncomeSources(prev => ({
      ...prev,
      trustDistributions: trust.netIncome
    }));
  }, [trust.netIncome]);

  // Distribution strategy - based on trust beneficiaries
  const [distributions, setDistributions] = useState({});
  const [activeTab, setActiveTab] = useState("analysis");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRelationship, setNewMemberRelationship] = useState("adult_child");

  useEffect(() => {
    // Initialize distributions based on trust distribution percentages for ALL family members
    const totalSplittable = incomeSources.dividends + incomeSources.trustDistributions;
    
    const initial = {};
    familyMembers.forEach((m) => {
      // Use trust distribution if set, otherwise 0
      initial[m.id] = m.isTrustBeneficiary && m.trustDistribution > 0 
        ? Math.round(totalSplittable * (m.trustDistribution / 100))
        : 0;
    });
    setDistributions(initial);
  }, [familyMembers, incomeSources.dividends, incomeSources.trustDistributions]);

  // Handle adding new family member - syncs with Trust Distribution
  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    addFamilyMember({
      name: newMemberName,
      relationship: newMemberRelationship,
      taxableIncome: 0,
      salaryIncome: 0,
      dividendIncome: 0,
      rentalIncome: 0,
      deductions: 0,
      superBalance: 0,
      isTrustBeneficiary: true, // Automatically make new members trust beneficiaries
      trustDistribution: 0
    });
    setNewMemberName("");
    setShowAddMember(false);
    toast.success("Family member added - synced to Trust Distribution Analysis");
  };

  // Handle removing family member
  const handleRemoveMember = (id) => {
    removeFamilyMember(id);
    toast.success("Family member removed - synced across all modules");
  };

  // Handle updating member income - syncs with Tax Analysis
  const handleUpdateIncome = (id, income) => {
    updateFamilyMember(id, { taxableIncome: Number(income) });
  };

  // Toggle trust beneficiary status
  const toggleBeneficiary = (id, isBeneficiary) => {
    updateFamilyMember(id, { 
      isTrustBeneficiary: isBeneficiary,
      trustDistribution: isBeneficiary ? 0 : 0 // Reset distribution when toggling
    });
    toast.success(isBeneficiary ? "Added as trust beneficiary" : "Removed from trust beneficiaries");
  };

  // Calculate current scenario (no splitting)
  const currentScenario = {
    totalIncome: familyMembers.reduce((sum, m) => sum + (m.taxableIncome || 0), 0) + 
                 incomeSources.dividends + incomeSources.trustDistributions + incomeSources.interestIncome,
    taxes: familyMembers.map(m => ({
      ...m,
      totalIncome: (m.taxableIncome || 0) + (m.relationship === 'primary' ? incomeSources.dividends + incomeSources.trustDistributions + incomeSources.interestIncome : 0),
      tax: calculateTax((m.taxableIncome || 0) + (m.relationship === 'primary' ? incomeSources.dividends + incomeSources.trustDistributions + incomeSources.interestIncome : 0)),
      marginalRate: getMarginalRate((m.taxableIncome || 0) + (m.relationship === 'primary' ? incomeSources.dividends + incomeSources.trustDistributions + incomeSources.interestIncome : 0))
    }))
  };
  currentScenario.totalTax = currentScenario.taxes.reduce((sum, t) => sum + t.tax, 0);

  // Calculate optimized scenario (with splitting)
  const optimizedScenario = {
    taxes: familyMembers.map(m => {
      const distributed = distributions[m.id] || 0;
      const totalIncome = (m.taxableIncome || 0) + distributed;
      return {
        ...m,
        distributed,
        totalIncome,
        tax: calculateTax(totalIncome),
        marginalRate: getMarginalRate(totalIncome)
      };
    })
  };
  optimizedScenario.totalTax = optimizedScenario.taxes.reduce((sum, t) => sum + t.tax, 0);
  
  const taxSavings = currentScenario.totalTax - optimizedScenario.totalTax;

  // Redistribute to a member
  const updateDistribution = (memberId, amount) => {
    const totalSplittable = incomeSources.dividends + incomeSources.trustDistributions;
    const newDist = { ...distributions, [memberId]: Math.min(amount, totalSplittable) };
    
    // Ensure total doesn't exceed splittable income
    const otherTotal = Object.entries(newDist)
      .filter(([id]) => Number(id) !== memberId)
      .reduce((sum, [, val]) => sum + val, 0);
    
    if (amount + otherTotal > totalSplittable) {
      newDist[memberId] = totalSplittable - otherTotal;
    }
    
    setDistributions(newDist);
  };

  // Chart data
  const comparisonData = [
    { name: "Current", tax: currentScenario.totalTax, fill: "#EF4444" },
    { name: "Optimized", tax: optimizedScenario.totalTax, fill: "#10B981" }
  ];

  const memberComparisonData = familyMembers.map((m, i) => ({
    name: m.name.split(' ')[0],
    current: currentScenario.taxes[i].tax,
    optimized: optimizedScenario.taxes[i].tax
  }));

  const distributionPieData = Object.entries(distributions)
    .filter(([, val]) => val > 0)
    .map(([id, val], i) => ({
      name: familyMembers.find(m => m.id === Number(id))?.name || 'Unknown',
      value: val,
      color: COLORS[i % COLORS.length]
    }));

  return (
    <Layout>
      <div className="space-y-6" data-testid="income-splitting-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
            Income Splitting Strategies
          </h1>
          <p className="text-muted-foreground mt-1">
            Optimize family tax by distributing income to lower-taxed members
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Current Total Tax</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(currentScenario.totalTax)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#10B981]/10 border-[#10B981]/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Optimized Tax</p>
              <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(optimizedScenario.totalTax)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0F392B] text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/80">Potential Savings</p>
              <p className="text-2xl font-bold">{formatCurrency(taxSavings)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Splittable Income</p>
              <p className="text-2xl font-bold text-[#D4AF37]">
                {formatCurrency(incomeSources.dividends + incomeSources.trustDistributions)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="distribute">Distribute</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tax Comparison Chart */}
              <Card data-testid="tax-comparison-chart">
                <CardHeader>
                  <CardTitle className="font-['Manrope']">Total Family Tax Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={250}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="tax" radius={[0, 4, 4, 0]}>
                          {comparisonData.map((entry, index) => (
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

              {/* Per Member Comparison */}
              <Card data-testid="member-comparison">
                <CardHeader>
                  <CardTitle className="font-['Manrope']">Tax by Family Member</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={250}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={memberComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="current" name="Current" fill="#EF4444" />
                        <Bar dataKey="optimized" name="Optimized" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Family Members Table */}
              <Card className="lg:col-span-2" data-testid="family-table">
                <CardHeader>
                  <CardTitle className="font-['Manrope']">Family Tax Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Member</th>
                          <th className="text-left p-3 font-semibold">Relationship</th>
                          <th className="text-right p-3 font-semibold">Base Income</th>
                          <th className="text-right p-3 font-semibold">Current Tax</th>
                          <th className="text-right p-3 font-semibold">Marginal Rate</th>
                          <th className="text-right p-3 font-semibold">Distributed</th>
                          <th className="text-right p-3 font-semibold">Optimized Tax</th>
                          <th className="text-right p-3 font-semibold">New Marginal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {familyMembers.map((member, i) => (
                          <tr key={member.id} className="border-b">
                            <td className="p-3 font-medium">{member.name}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="capitalize">{member.relationship.replace('_', ' ')}</Badge>
                            </td>
                            <td className="text-right p-3">{formatCurrency(member.taxableIncome || 0)}</td>
                            <td className="text-right p-3 text-destructive font-medium">
                              {formatCurrency(currentScenario.taxes[i].tax)}
                            </td>
                            <td className="text-right p-3">{currentScenario.taxes[i].marginalRate.toFixed(0)}%</td>
                            <td className="text-right p-3 text-[#D4AF37] font-medium">
                              {formatCurrency(distributions[member.id] || 0)}
                            </td>
                            <td className="text-right p-3 text-[#10B981] font-medium">
                              {formatCurrency(optimizedScenario.taxes[i].tax)}
                            </td>
                            <td className="text-right p-3">{optimizedScenario.taxes[i].marginalRate.toFixed(0)}%</td>
                          </tr>
                        ))}
                        <tr className="bg-muted/30 font-semibold">
                          <td className="p-3" colSpan={3}>Total</td>
                          <td className="text-right p-3 text-destructive">{formatCurrency(currentScenario.totalTax)}</td>
                          <td className="p-3"></td>
                          <td className="text-right p-3 text-[#D4AF37]">
                            {formatCurrency(Object.values(distributions).reduce((a, b) => a + b, 0))}
                          </td>
                          <td className="text-right p-3 text-[#10B981]">{formatCurrency(optimizedScenario.totalTax)}</td>
                          <td className="p-3"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Distribute Tab */}
          <TabsContent value="distribute" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Distribution Controls */}
              <Card className="lg:col-span-2" data-testid="distribution-controls">
                <CardHeader>
                  <CardTitle className="font-['Manrope']">Distribute Income</CardTitle>
                  <CardDescription>
                    Allocate dividends and trust distributions to family members in lower tax brackets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Income Sources */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h4 className="font-semibold">Splittable Income Sources</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Dividends</p>
                        <p className="font-semibold">{formatCurrency(incomeSources.dividends)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Trust Distributions</p>
                        <p className="font-semibold">{formatCurrency(incomeSources.trustDistributions)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Interest</p>
                        <p className="font-semibold text-muted-foreground">{formatCurrency(incomeSources.interestIncome)} (fixed)</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Splittable</p>
                        <p className="font-bold text-[#D4AF37]">
                          {formatCurrency(incomeSources.dividends + incomeSources.trustDistributions)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Distribution Sliders */}
                  {familyMembers.filter(m => m.canReceive).map(member => {
                    const currentDist = distributions[member.id] || 0;
                    const maxDist = incomeSources.dividends + incomeSources.trustDistributions;
                    const newIncome = member.income + currentDist;
                    const newTax = calculateTax(newIncome);
                    const newRate = getMarginalRate(newIncome);
                    
                    return (
                      <div key={member.id} className="p-4 rounded-lg border space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Base: {formatCurrency(member.income)} • Marginal: {getMarginalRate(member.income).toFixed(0)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#D4AF37]">{formatCurrency(currentDist)}</p>
                            <p className="text-xs text-muted-foreground">distributed</p>
                          </div>
                        </div>
                        
                        <Slider
                          value={[currentDist]}
                          onValueChange={(v) => updateDistribution(member.id, v[0])}
                          max={maxDist}
                          step={1000}
                          className="my-4"
                        />
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            New Total: {formatCurrency(newIncome)}
                          </span>
                          <span className="text-muted-foreground">
                            New Tax: <span className="text-[#10B981] font-medium">{formatCurrency(newTax)}</span>
                          </span>
                          <span className="text-muted-foreground">
                            New Marginal: {newRate.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Distribution Summary */}
              <Card data-testid="distribution-summary">
                <CardHeader>
                  <CardTitle className="font-['Manrope']">Distribution Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {distributionPieData.length > 0 && (
                    <ChartContainer height={200}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={distributionPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            dataKey="value"
                          >
                            {distributionPieData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                  
                  <div className="space-y-2">
                    {distributionPieData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg bg-[#0F392B] text-white mt-4">
                    <p className="text-sm text-white/80">Your Tax Savings</p>
                    <p className="text-2xl font-bold">{formatCurrency(taxSavings)}</p>
                    <p className="text-xs text-white/60 mt-1">per year</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trust Distributions */}
              <Card data-testid="trust-strategy">
                <CardHeader>
                  <CardTitle className="font-['Manrope'] flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#0F392B]" />
                    Family Trust Distributions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Discretionary trusts allow trustees to distribute income to beneficiaries 
                    in lower tax brackets, potentially saving significant tax.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Distribute to adult children</p>
                        <p className="text-sm text-muted-foreground">
                          Adult children with low income can receive up to $18,200 tax-free
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Split with spouse</p>
                        <p className="text-sm text-muted-foreground">
                          Balance income between spouses to optimize combined tax
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Retain in trust</p>
                        <p className="text-sm text-muted-foreground">
                          Undistributed income taxed at top marginal rate (47%)
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dividend Streaming */}
              <Card data-testid="dividend-strategy">
                <CardHeader>
                  <CardTitle className="font-['Manrope'] flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                    Dividend Streaming
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Direct franked dividends to beneficiaries who can best utilize 
                    franking credits based on their marginal tax rate.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Franking credit refunds</p>
                        <p className="text-sm text-muted-foreground">
                          Low-income members may receive refunds for excess franking credits
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">45-day holding rule</p>
                        <p className="text-sm text-muted-foreground">
                          Must hold shares 45+ days to claim franking credits
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Structure */}
              <Card data-testid="company-strategy">
                <CardHeader>
                  <CardTitle className="font-['Manrope'] flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#3B82F6]" />
                    Company & Trust Combination
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Use a company as trustee with a corporate beneficiary to manage 
                    tax timing and access the 25% company tax rate.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Bucket company</p>
                        <p className="text-sm text-muted-foreground">
                          Distribute excess to company at 25% rate, draw later as dividends
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Division 7A loans</p>
                        <p className="text-sm text-muted-foreground">
                          Access company funds via compliant loans
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card data-testid="recommendations">
                <CardHeader>
                  <CardTitle className="font-['Manrope'] flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-[#D4AF37]" />
                    Your Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[#10B981]/10">
                    <ArrowRight className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <strong>Immediate:</strong> Distribute {formatCurrency(incomeSources.trustDistributions)} 
                      trust income to lower-taxed family members to save {formatCurrency(taxSavings)} annually
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[#D4AF37]/10">
                    <ArrowRight className="h-5 w-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <strong>Consider:</strong> Restructure share ownership through a family trust 
                      to enable flexible dividend streaming
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[#3B82F6]/10">
                    <ArrowRight className="h-5 w-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <strong>Long-term:</strong> Establish a bucket company to park excess income 
                      at 25% company tax rate
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default IncomeSplitting;
