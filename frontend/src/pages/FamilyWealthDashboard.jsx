import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import ChartContainer from "@/components/ChartContainer";
import { 
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Building2,
  LineChart,
  Target,
  Lightbulb,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  Calendar,
  Shield,
  Wallet,
  Home,
  Landmark,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  ChevronRight
} from "lucide-react";
import { usePortfolio } from "@/App";
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
  Legend,
  AreaChart,
  Area,
  LineChart as RechartsLine,
  Line,
  Treemap
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Tax calculation
const TAX_BRACKETS = [
  { min: 0, max: 18200, rate: 0 },
  { min: 18201, max: 45000, rate: 0.16 },
  { min: 45001, max: 135000, rate: 0.30 },
  { min: 135001, max: 190000, rate: 0.37 },
  { min: 190001, max: Infinity, rate: 0.45 }
];

const calculateTax = (income) => {
  if (income <= 0) return 0;
  let tax = 0;
  for (const bracket of TAX_BRACKETS) {
    if (income > bracket.min) {
      const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
      tax += taxableInBracket * bracket.rate;
    }
  }
  tax += income > 24276 ? income * 0.02 : 0; // Medicare
  return Math.round(tax);
};

const COLORS = ['#1a2744', '#D4A84C', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#6366F1'];

const FamilyWealthDashboard = () => {
  const { 
    familyMembers, 
    sharePortfolio, 
    portfolio, 
    trust, 
    company,
    budget
  } = usePortfolio();

  const [projectionYears, setProjectionYears] = useState(20);
  const [estateTransferAge, setEstateTransferAge] = useState(85);
  const [giftingAmount, setGiftingAmount] = useState(0);

  // Calculate combined family wealth
  const familyWealth = useMemo(() => {
    // Property
    const propertyValue = portfolio.investments?.properties?.reduce((sum, p) => sum + p.value, 0) || 0;
    const propertyDebt = portfolio.investments?.properties?.reduce((sum, p) => sum + (p.mortgage_amount || 0), 0) || 0;
    const propertyEquity = propertyValue - propertyDebt;
    
    // Shares
    const shareValue = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
    const shareGain = sharePortfolio.reduce((sum, s) => sum + ((s.currentPrice - s.purchasePrice) * s.quantity), 0);
    
    // Cash & Term Deposits
    const cash = portfolio.investments?.cash_savings || 0;
    const termDeposit = portfolio.investments?.term_deposit_amount || 0;
    
    // Super (combined family)
    const totalSuper = familyMembers.reduce((sum, m) => sum + (m.superBalance || 0), 0);
    
    // Trust assets
    const trustAssets = trust.netIncome > 0 ? trust.netIncome * 10 : 0; // Estimate trust value
    
    // Company
    const companyValue = company.retainedEarnings || 0;
    
    const totalAssets = propertyValue + shareValue + cash + termDeposit + totalSuper + trustAssets + companyValue;
    const totalDebt = propertyDebt;
    const netWorth = totalAssets - totalDebt;
    
    return {
      propertyValue,
      propertyDebt,
      propertyEquity,
      shareValue,
      shareGain,
      cash,
      termDeposit,
      totalSuper,
      trustAssets,
      companyValue,
      totalAssets,
      totalDebt,
      netWorth
    };
  }, [portfolio, sharePortfolio, familyMembers, trust, company]);

  // Calculate tax savings from current structure
  const taxSavings = useMemo(() => {
    // Income without optimization
    const totalFamilyIncome = familyMembers.reduce((sum, m) => sum + (m.taxableIncome || 0), 0);
    const singlePersonTax = calculateTax(totalFamilyIncome);
    
    // Income with splitting
    const actualTax = familyMembers.reduce((sum, m) => sum + calculateTax(m.taxableIncome || 0), 0);
    const incomeSplittingSaving = singlePersonTax - actualTax;
    
    // Trust distribution savings
    const trustDistSaving = trust.netIncome > 0 ? trust.netIncome * 0.15 : 0; // Estimate
    
    // Super contributions (11.5% taxed at 15% vs marginal rate)
    const superContributions = familyMembers.reduce((sum, m) => sum + ((m.salaryIncome || 0) * 0.115), 0);
    const avgMarginalRate = totalFamilyIncome > 0 ? (actualTax / totalFamilyIncome) : 0.30;
    const superTaxSaving = superContributions * (avgMarginalRate - 0.15);
    
    // Franking credits
    const frankingCredits = sharePortfolio.reduce((sum, s) => {
      const dividend = s.quantity * s.currentPrice * (s.dividendYield / 100);
      const franking = dividend * (s.frankingPercentage / 100) * (30 / 70);
      return sum + franking;
    }, 0);
    
    // Negative gearing
    const negativeGearing = portfolio.investments?.properties?.reduce((sum, p) => {
      const interest = (p.mortgage_amount || 0) * ((p.mortgage_rate || 6) / 100);
      const expenses = p.annual_expenses || 0;
      const depreciation = (p.depreciation_building || 0) + (p.depreciation_fixtures || 0);
      const netRental = (p.rental_income || 0) - interest - expenses - depreciation;
      return sum + (netRental < 0 ? Math.abs(netRental) * avgMarginalRate : 0);
    }, 0) || 0;
    
    const totalSavings = incomeSplittingSaving + trustDistSaving + superTaxSaving + frankingCredits + negativeGearing;
    
    return {
      incomeSplitting: Math.round(incomeSplittingSaving),
      trustDistribution: Math.round(trustDistSaving),
      superContributions: Math.round(superTaxSaving),
      frankingCredits: Math.round(frankingCredits),
      negativeGearing: Math.round(negativeGearing),
      total: Math.round(totalSavings)
    };
  }, [familyMembers, trust, sharePortfolio, portfolio]);

  // Inter-generational wealth transfer analysis
  const wealthTransfer = useMemo(() => {
    const primaryMembers = familyMembers.filter(m => 
      m.relationship === 'primary' || m.relationship === 'spouse'
    );
    const nextGen = familyMembers.filter(m => 
      m.relationship === 'adult_child' || m.relationship === 'child'
    );
    
    const primaryAge = Math.max(...primaryMembers.map(m => m.age || 45));
    const yearsToTransfer = Math.max(0, estateTransferAge - primaryAge);
    
    // Project wealth growth
    const growthRate = 0.06; // 6% annual growth
    const projectedWealth = familyWealth.netWorth * Math.pow(1 + growthRate, yearsToTransfer);
    
    // Super death benefit considerations
    const superAtTransfer = familyMembers.reduce((sum, m) => {
      const years = Math.max(0, estateTransferAge - (m.age || 45));
      const projected = (m.superBalance || 0) * Math.pow(1.07, years);
      return sum + projected;
    }, 0);
    
    // Tax on super death benefit (to non-dependents)
    const superTaxableComponent = superAtTransfer * 0.85; // Assume 85% taxable
    const superDeathTax = superTaxableComponent * 0.17; // 15% + 2% Medicare
    
    // CGT on property (if applicable)
    const propertyGrowth = (familyWealth.propertyValue * Math.pow(1.05, yearsToTransfer)) - familyWealth.propertyValue;
    const propertyCGT = propertyGrowth * 0.5 * 0.37; // 50% discount, 37% rate
    
    // Strategies
    const strategies = [];
    
    if (superAtTransfer > 1900000) {
      strategies.push({
        title: "Super Death Benefit Planning",
        description: "Projected super balance exceeds transfer balance cap. Consider pension payments before death to reduce taxable component.",
        impact: formatCurrency(superDeathTax),
        priority: "High"
      });
    }
    
    if (giftingAmount > 0) {
      const giftingYears = Math.floor(yearsToTransfer);
      const totalGifting = giftingAmount * giftingYears;
      const reducedEstate = projectedWealth - totalGifting;
      strategies.push({
        title: "Gradual Gifting Strategy",
        description: `Gifting ${formatCurrency(giftingAmount)}/year for ${giftingYears} years reduces estate by ${formatCurrency(totalGifting)}.`,
        impact: formatCurrency(totalGifting),
        priority: "Medium"
      });
    }
    
    if (trust.netIncome > 0) {
      strategies.push({
        title: "Family Trust Structure",
        description: "Continue distributing trust income to adult children to build their wealth outside your estate.",
        impact: formatCurrency(trust.netIncome),
        priority: "High"
      });
    }
    
    if (nextGen.length > 0) {
      strategies.push({
        title: "Education & Training",
        description: "Invest in next generation's education and financial literacy for successful wealth transition.",
        impact: "Long-term",
        priority: "Medium"
      });
    }
    
    strategies.push({
      title: "Estate Planning Documents",
      description: "Ensure wills, powers of attorney, and binding death benefit nominations are current.",
      impact: "Essential",
      priority: "High"
    });
    
    return {
      primaryAge,
      yearsToTransfer,
      projectedWealth: Math.round(projectedWealth),
      superAtTransfer: Math.round(superAtTransfer),
      superDeathTax: Math.round(superDeathTax),
      propertyCGT: Math.round(propertyCGT),
      totalEstateValue: Math.round(projectedWealth + superAtTransfer),
      strategies,
      nextGenCount: nextGen.length,
      perBeneficiary: nextGen.length > 0 ? Math.round((projectedWealth + superAtTransfer) / nextGen.length) : 0
    };
  }, [familyMembers, familyWealth, trust, estateTransferAge, giftingAmount]);

  // Wealth composition chart data
  const wealthComposition = [
    { name: 'Property Equity', value: familyWealth.propertyEquity, color: '#1a2744' },
    { name: 'Shares', value: familyWealth.shareValue, color: '#D4A84C' },
    { name: 'Superannuation', value: familyWealth.totalSuper, color: '#10B981' },
    { name: 'Cash & TD', value: familyWealth.cash + familyWealth.termDeposit, color: '#3B82F6' },
    { name: 'Trust Assets', value: familyWealth.trustAssets, color: '#8B5CF6' },
    { name: 'Company', value: familyWealth.companyValue, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  // Tax savings breakdown
  const taxSavingsData = [
    { name: 'Income Splitting', value: taxSavings.incomeSplitting, color: '#1a2744' },
    { name: 'Trust Distributions', value: taxSavings.trustDistribution, color: '#D4A84C' },
    { name: 'Super Contributions', value: taxSavings.superContributions, color: '#10B981' },
    { name: 'Franking Credits', value: taxSavings.frankingCredits, color: '#3B82F6' },
    { name: 'Negative Gearing', value: taxSavings.negativeGearing, color: '#8B5CF6' }
  ].filter(item => item.value > 0);

  // Wealth projection over time
  const wealthProjection = useMemo(() => {
    const data = [];
    let wealth = familyWealth.netWorth;
    let superBalance = familyWealth.totalSuper;
    
    for (let year = 0; year <= projectionYears; year++) {
      data.push({
        year: `Year ${year}`,
        wealth: Math.round(wealth),
        super: Math.round(superBalance),
        total: Math.round(wealth + superBalance)
      });
      
      wealth *= 1.06; // 6% growth
      superBalance *= 1.07; // 7% super growth
      superBalance += familyMembers.reduce((sum, m) => sum + ((m.salaryIncome || 0) * 0.115), 0);
    }
    
    return data;
  }, [familyWealth, familyMembers, projectionYears]);

  // Family members by wealth
  const memberWealth = familyMembers.map(m => {
    const personalShares = sharePortfolio
      .filter(s => s.ownership === 'personal' && s.ownerId === m.id)
      .reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
    
    return {
      name: m.name,
      super: m.superBalance || 0,
      shares: personalShares,
      total: (m.superBalance || 0) + personalShares,
      age: m.age || 45
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <Layout>
      <div className="space-y-6" data-testid="family-wealth-dashboard">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Family Wealth Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Combined wealth, tax savings & inter-generational planning
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {familyMembers.length} Family Members
            </Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-[#1a2744] text-white col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <p className="text-sm text-white/70">Total Net Worth</p>
              <p className="text-3xl font-bold">{formatCurrency(familyWealth.netWorth)}</p>
              <p className="text-xs text-white/60 mt-1">Family combined</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Assets</p>
              <p className="text-2xl font-bold">{formatCurrency(familyWealth.totalAssets)}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Debt</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(familyWealth.totalDebt)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#10B981]/10 border-[#10B981]/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Annual Tax Savings</p>
              <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(taxSavings.total)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#D4A84C]/10 border-[#D4A84C]/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Super</p>
              <p className="text-2xl font-bold text-[#D4A84C]">{formatCurrency(familyWealth.totalSuper)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="wealth">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="wealth">Combined Wealth</TabsTrigger>
            <TabsTrigger value="tax">Tax Savings</TabsTrigger>
            <TabsTrigger value="transfer">Wealth Transfer</TabsTrigger>
          </TabsList>

          {/* Combined Wealth Tab */}
          <TabsContent value="wealth" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wealth Composition */}
              <Card>
                <CardHeader>
                  <CardTitle>Wealth Composition</CardTitle>
                  <CardDescription>Asset allocation across the family</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={280}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wealthComposition}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {wealthComposition.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {wealthComposition.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Member Wealth Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Wealth by Family Member</CardTitle>
                  <CardDescription>Personal wealth (Super + Shares)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={280}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={memberWealth} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="super" name="Super" stackId="a" fill="#D4A84C" />
                        <Bar dataKey="shares" name="Shares" stackId="a" fill="#1a2744" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="mt-4 space-y-2">
                    {memberWealth.map((m, i) => (
                      <Link key={i} to={`/family-member/${familyMembers.find(fm => fm.name === m.name)?.id}`}>
                        <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#1a2744] text-white flex items-center justify-center text-sm">
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{m.name}</p>
                              <p className="text-xs text-muted-foreground">Age {m.age}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(m.total)}</span>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Wealth Projection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Wealth Projection</CardTitle>
                    <CardDescription>Projected family wealth over time (6% growth)</CardDescription>
                  </div>
                  <Select value={projectionYears.toString()} onValueChange={(v) => setProjectionYears(Number(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Years</SelectItem>
                      <SelectItem value="20">20 Years</SelectItem>
                      <SelectItem value="30">30 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer height={350}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={wealthProjection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                      <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="wealth" name="Non-Super Wealth" stackId="1" fill="#1a2744" stroke="#1a2744" />
                      <Area type="monotone" dataKey="super" name="Superannuation" stackId="1" fill="#D4A84C" stroke="#D4A84C" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-xl font-bold">{formatCurrency(familyWealth.netWorth + familyWealth.totalSuper)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#D4A84C]/10 text-center">
                    <p className="text-sm text-muted-foreground">In {Math.floor(projectionYears/2)} Years</p>
                    <p className="text-xl font-bold text-[#D4A84C]">
                      {formatCurrency(wealthProjection[Math.floor(projectionYears/2)]?.total || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#10B981]/10 text-center">
                    <p className="text-sm text-muted-foreground">In {projectionYears} Years</p>
                    <p className="text-xl font-bold text-[#10B981]">
                      {formatCurrency(wealthProjection[projectionYears]?.total || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Savings Tab */}
          <TabsContent value="tax" className="space-y-6">
            {/* Tax Savings Summary */}
            <Card className="bg-[#10B981] text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80">Total Annual Tax Savings</p>
                    <p className="text-4xl font-bold">{formatCurrency(taxSavings.total)}</p>
                    <p className="text-sm text-white/70 mt-1">From current tax-efficient structures</p>
                  </div>
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tax Savings Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax Savings Breakdown</CardTitle>
                  <CardDescription>Annual savings by strategy</CardDescription>
                </CardHeader>
                <CardContent>
                  {taxSavingsData.length > 0 ? (
                    <>
                      <ChartContainer height={250}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={taxSavingsData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                            <YAxis dataKey="name" type="category" width={120} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]}>
                              {taxSavingsData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No tax savings data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tax Strategies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-[#D4A84C]" />
                    Active Tax Strategies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {taxSavings.incomeSplitting > 0 && (
                    <div className="p-3 rounded-lg bg-[#1a2744]/10 border border-[#1a2744]/20">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#1a2744] mt-0.5" />
                        <div>
                          <p className="font-medium">Income Splitting</p>
                          <p className="text-sm text-muted-foreground">
                            Distributing income across family members saves {formatCurrency(taxSavings.incomeSplitting)}/year
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {taxSavings.trustDistribution > 0 && (
                    <div className="p-3 rounded-lg bg-[#D4A84C]/10 border border-[#D4A84C]/20">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#D4A84C] mt-0.5" />
                        <div>
                          <p className="font-medium">Family Trust Distributions</p>
                          <p className="text-sm text-muted-foreground">
                            Trust structure saves approximately {formatCurrency(taxSavings.trustDistribution)}/year
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {taxSavings.superContributions > 0 && (
                    <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#10B981] mt-0.5" />
                        <div>
                          <p className="font-medium">Superannuation Contributions</p>
                          <p className="text-sm text-muted-foreground">
                            Concessional super (15% vs marginal rate) saves {formatCurrency(taxSavings.superContributions)}/year
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {taxSavings.frankingCredits > 0 && (
                    <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#3B82F6] mt-0.5" />
                        <div>
                          <p className="font-medium">Franking Credits</p>
                          <p className="text-sm text-muted-foreground">
                            Dividend imputation credits provide {formatCurrency(taxSavings.frankingCredits)}/year offset
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {taxSavings.negativeGearing > 0 && (
                    <div className="p-3 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#8B5CF6] mt-0.5" />
                        <div>
                          <p className="font-medium">Negative Gearing</p>
                          <p className="text-sm text-muted-foreground">
                            Property losses offset other income, saving {formatCurrency(taxSavings.negativeGearing)}/year
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wealth Transfer Tab */}
          <TabsContent value="transfer" className="space-y-6">
            {/* Estate Summary */}
            <Card className="bg-gradient-to-r from-[#1a2744] to-[#1a5c45] text-white">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-white/70 text-sm">Current Estate Value</p>
                    <p className="text-3xl font-bold">{formatCurrency(familyWealth.netWorth + familyWealth.totalSuper)}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Projected at Age {estateTransferAge}</p>
                    <p className="text-3xl font-bold text-[#D4A84C]">{formatCurrency(wealthTransfer.totalEstateValue)}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Years to Transfer</p>
                    <p className="text-3xl font-bold">{wealthTransfer.yearsToTransfer}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Per Beneficiary ({wealthTransfer.nextGenCount})</p>
                    <p className="text-3xl font-bold">{formatCurrency(wealthTransfer.perBeneficiary)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Planning Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Transfer Planning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Estate Transfer Age</Label>
                      <span className="font-medium">{estateTransferAge}</span>
                    </div>
                    <Slider
                      value={[estateTransferAge]}
                      onValueChange={(v) => setEstateTransferAge(v[0])}
                      min={70}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Annual Gifting</Label>
                      <span className="font-medium">{formatCurrency(giftingAmount)}</span>
                    </div>
                    <Slider
                      value={[giftingAmount]}
                      onValueChange={(v) => setGiftingAmount(v[0])}
                      min={0}
                      max={100000}
                      step={5000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Gifting assets during your lifetime can reduce estate size
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Tax Considerations</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Super death tax (non-dependents): ~{formatCurrency(wealthTransfer.superDeathTax)}<br/>
                          Potential property CGT: ~{formatCurrency(wealthTransfer.propertyCGT)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strategies */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-[#D4A84C]" />
                    Wealth Transfer Strategies
                  </CardTitle>
                  <CardDescription>Recommendations for inter-generational wealth transfer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {wealthTransfer.strategies.map((strategy, i) => (
                    <div 
                      key={i}
                      className={`p-4 rounded-lg border ${
                        strategy.priority === 'High' ? 'bg-[#1a2744]/5 border-[#1a2744]/20' :
                        strategy.priority === 'Medium' ? 'bg-[#D4A84C]/5 border-[#D4A84C]/20' :
                        'bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {strategy.priority === 'High' ? (
                            <Target className="h-5 w-5 text-[#1a2744] mt-0.5" />
                          ) : strategy.priority === 'Medium' ? (
                            <Lightbulb className="h-5 w-5 text-[#D4A84C] mt-0.5" />
                          ) : (
                            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium">{strategy.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                          </div>
                        </div>
                        <Badge variant={strategy.priority === 'High' ? 'default' : 'outline'}>
                          {strategy.impact}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Next Generation */}
            <Card>
              <CardHeader>
                <CardTitle>Next Generation Beneficiaries</CardTitle>
                <CardDescription>Potential recipients of inter-generational wealth transfer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {familyMembers
                    .filter(m => m.relationship === 'adult_child' || m.relationship === 'child')
                    .map((member, i) => (
                      <Link key={i} to={`/family-member/${member.id}`}>
                        <Card className="hover:border-[#1a2744] transition-colors cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-[#D4A84C] text-[#1a2744] flex items-center justify-center text-xl font-bold">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold">{member.name}</p>
                                <p className="text-sm text-muted-foreground">Age {member.age || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Est. Inheritance</span>
                                <span className="font-medium text-[#10B981]">{formatCurrency(wealthTransfer.perBeneficiary)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  }
                  {familyMembers.filter(m => m.relationship === 'adult_child' || m.relationship === 'child').length === 0 && (
                    <div className="col-span-full p-8 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No next generation beneficiaries identified</p>
                      <p className="text-sm mt-1">Add adult children in Tax Analysis to see wealth transfer planning</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Important Notice</p>
                    <p>
                      Estate planning involves complex legal and tax considerations. The projections and 
                      strategies shown are general in nature and may not account for all personal circumstances. 
                      Australia does not have inheritance tax, but super death benefits, CGT on inherited assets, 
                      and other factors should be considered. Always consult qualified estate planning professionals.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Related Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Link to="/tax-analysis-sync">
                <Button variant="outline" className="w-full justify-start">
                  <Wallet className="h-4 w-4 mr-2" />
                  Tax Analysis
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link to="/trust-distributions">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Trust Analysis
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link to="/scenario-modeling">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Scenario Modeling
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link to="/sg-calculator">
                <Button variant="outline" className="w-full justify-start">
                  <PiggyBank className="h-4 w-4 mr-2" />
                  SG Calculator
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link to="/export">
                <Button variant="outline" className="w-full justify-start">
                  <Landmark className="h-4 w-4 mr-2" />
                  Export Data
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FamilyWealthDashboard;
