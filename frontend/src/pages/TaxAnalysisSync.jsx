import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ChartContainer from "@/components/ChartContainer";
import { 
  Calculator, 
  DollarSign, 
  Percent,
  TrendingUp,
  Building2,
  User,
  Info,
  ExternalLink,
  BookOpen,
  Users,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  Eye
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
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// ATO Info Tooltip Component
const ATOTooltip = ({ title, description, atoUrl }) => (
  <TooltipProvider>
    <UITooltip>
      <TooltipTrigger asChild>
        <button className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-muted hover:bg-muted/80">
          <Info className="h-3 w-3 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3">
        <p className="font-semibold text-sm mb-1">{title}</p>
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
        {atoUrl && (
          <a 
            href={atoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-[#0F392B] hover:underline flex items-center gap-1"
          >
            ATO Reference <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </TooltipContent>
    </UITooltip>
  </TooltipProvider>
);

// Australian 2024-25 Tax Brackets (Stage 3)
const TAX_BRACKETS = [
  { min: 0, max: 18200, rate: 0, baseTax: 0 },
  { min: 18201, max: 45000, rate: 0.16, baseTax: 0 },
  { min: 45001, max: 135000, rate: 0.30, baseTax: 4288 },
  { min: 135001, max: 190000, rate: 0.37, baseTax: 31288 },
  { min: 190001, max: Infinity, rate: 0.45, baseTax: 51638 }
];

const calculateTax = (income) => {
  if (income <= 0) return { tax: 0, medicare: 0, total: 0, effectiveRate: 0, marginalRate: 0, breakdown: [] };
  
  let tax = 0;
  const breakdown = [];
  
  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const bracket = TAX_BRACKETS[i];
    const prevMax = i === 0 ? 0 : TAX_BRACKETS[i - 1].max;
    
    if (income > bracket.min) {
      const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
      const bracketTax = taxableInBracket * bracket.rate;
      tax += bracketTax;
      
      if (bracketTax > 0) {
        breakdown.push({
          bracket: `$${bracket.min.toLocaleString()} - ${bracket.max === Infinity ? '+' : `$${bracket.max.toLocaleString()}`}`,
          rate: bracket.rate * 100,
          taxable: taxableInBracket,
          tax: Math.round(bracketTax)
        });
      }
    }
  }
  
  // Medicare levy 2%
  const medicare = income > 24276 ? income * 0.02 : 0;
  const total = tax + medicare;
  const effectiveRate = (total / income) * 100;
  
  // Find marginal rate
  let marginalRate = 0;
  for (const bracket of TAX_BRACKETS) {
    if (income >= bracket.min) {
      marginalRate = bracket.rate * 100;
    }
  }
  marginalRate += 2; // Add Medicare
  
  return {
    tax: Math.round(tax),
    medicare: Math.round(medicare),
    total: Math.round(total),
    effectiveRate,
    marginalRate,
    breakdown
  };
};

const COLORS = ['#0F392B', '#D4AF37', '#10B981', '#3B82F6', '#8B5CF6'];

const TaxAnalysisSync = () => {
  const { 
    familyMembers, 
    updateFamilyMember, 
    addFamilyMember, 
    removeFamilyMember,
    company,
    hasUnsavedChanges,
    saveAllData
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState("family");
  const [newMemberName, setNewMemberName] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  
  // Company tax state
  const [companyIncome, setCompanyIncome] = useState(company.taxableIncome || 150000);
  const [isBaseRateEntity, setIsBaseRateEntity] = useState(company.isBaseRateEntity);

  // Calculate tax for all family members
  const familyTaxData = useMemo(() => {
    return familyMembers.map(member => {
      const taxCalc = calculateTax(member.taxableIncome || 0);
      return {
        ...member,
        ...taxCalc,
        netIncome: (member.taxableIncome || 0) - taxCalc.total
      };
    });
  }, [familyMembers]);

  // Totals
  const totals = useMemo(() => {
    return familyTaxData.reduce((acc, member) => ({
      totalIncome: acc.totalIncome + (member.taxableIncome || 0),
      totalTax: acc.totalTax + member.total,
      totalNet: acc.totalNet + member.netIncome
    }), { totalIncome: 0, totalTax: 0, totalNet: 0 });
  }, [familyTaxData]);

  // Company tax calculation
  const companyTax = useMemo(() => {
    const rate = isBaseRateEntity ? 0.25 : 0.30;
    const tax = companyIncome * rate;
    return {
      income: companyIncome,
      rate: rate * 100,
      tax: Math.round(tax),
      netProfit: companyIncome - tax,
      franking: Math.round(tax)
    };
  }, [companyIncome, isBaseRateEntity]);

  // Chart data for family comparison
  const familyComparisonData = familyTaxData.map(member => ({
    name: member.name.split(' ')[0],
    income: member.taxableIncome || 0,
    tax: member.total,
    net: member.netIncome
  }));

  // Pie chart data for tax breakdown
  const taxDistributionData = familyTaxData
    .filter(m => m.total > 0)
    .map((member, i) => ({
      name: member.name,
      value: member.total,
      color: COLORS[i % COLORS.length]
    }));

  // Handle adding new family member
  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    addFamilyMember({
      name: newMemberName,
      relationship: "family",
      taxableIncome: 0,
      salaryIncome: 0,
      dividendIncome: 0,
      rentalIncome: 0,
      deductions: 0,
      superBalance: 0
    });
    setNewMemberName("");
    setShowAddMember(false);
    toast.success("Family member added - synced across all modules");
  };

  // Handle removing family member
  const handleRemoveMember = (id) => {
    removeFamilyMember(id);
    toast.success("Family member removed - synced across all modules");
  };

  // Handle income update
  const handleIncomeUpdate = (id, income) => {
    updateFamilyMember(id, { taxableIncome: Number(income) });
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="tax-analysis-sync-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              Tax Analysis
            </h1>
            <p className="text-muted-foreground mt-1">
              Calculate Australian personal and company taxes for 2024-25
              <ATOTooltip 
                title="2024-25 Tax Rates" 
                description="Stage 3 tax cuts applied. Rates effective 1 July 2024."
                atoUrl="https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents"
              />
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/calculation-methodology">
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                View Methodology
              </Button>
            </Link>
            {hasUnsavedChanges && (
              <Button onClick={saveAllData} className="bg-[#0F392B]" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0F392B] text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/70">Family Members</p>
              <p className="text-2xl font-bold">{familyMembers.length}</p>
              <p className="text-xs text-white/60">Synced across modules</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Family Income</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalIncome)}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Tax Payable</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totals.totalTax)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#10B981]/10 border-[#10B981]/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Net Income</p>
              <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(totals.totalNet)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="family" data-testid="family-tab">
              <Users className="h-4 w-4 mr-2" />
              Family
            </TabsTrigger>
            <TabsTrigger value="company" data-testid="company-tab">
              <Building2 className="h-4 w-4 mr-2" />
              Company
            </TabsTrigger>
            <TabsTrigger value="comparison" data-testid="comparison-tab">
              <TrendingUp className="h-4 w-4 mr-2" />
              Comparison
            </TabsTrigger>
          </TabsList>

          {/* Family Tab */}
          <TabsContent value="family" className="space-y-6">
            {/* Add Member Button */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Family Members</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddMember(!showAddMember)}
                data-testid="add-member-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Enter name"
                        data-testid="new-member-name"
                      />
                    </div>
                    <Button onClick={handleAddMember} className="bg-[#0F392B]" data-testid="confirm-add-member">
                      Add
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddMember(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Family Member Cards */}
            <div className="space-y-4">
              {familyTaxData.map((member, index) => (
                <Card key={member.id} data-testid={`member-card-${index}`}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Input Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0F392B] text-white flex items-center justify-center">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold">{member.name}</p>
                              <Badge variant="outline" className="text-xs capitalize">
                                {member.relationship?.replace('_', ' ') || 'Family'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Link to={`/family-member/${member.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-[#0F392B]"
                                data-testid={`view-profile-${index}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {familyMembers.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleRemoveMember(member.id)}
                                data-testid={`remove-member-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Taxable Income
                            <ATOTooltip 
                              title="Taxable Income" 
                              description="Total assessable income minus allowable deductions."
                              atoUrl="https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records"
                            />
                          </Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={member.taxableIncome || 0}
                              onChange={(e) => handleIncomeUpdate(member.id, e.target.value)}
                              className="pl-10"
                              data-testid={`member-income-${index}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Results Section */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Income Tax</p>
                            <p className="text-lg font-bold">{formatCurrency(member.tax)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Medicare Levy</p>
                            <p className="text-lg font-bold">{formatCurrency(member.medicare)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-destructive/10">
                            <p className="text-xs text-muted-foreground">Total Tax</p>
                            <p className="text-lg font-bold text-destructive">{formatCurrency(member.total)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-[#10B981]/10">
                            <p className="text-xs text-muted-foreground">Net Income</p>
                            <p className="text-lg font-bold text-[#10B981]">{formatCurrency(member.netIncome)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                          <div>
                            <p className="text-xs text-muted-foreground">Effective Rate</p>
                            <p className="text-xl font-bold text-[#D4AF37]">{member.effectiveRate.toFixed(1)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Marginal Rate</p>
                            <p className="text-xl font-bold">{member.marginalRate.toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tax Bracket Breakdown */}
                    {member.breakdown && member.breakdown.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Tax Bracket Breakdown</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {member.breakdown.map((b, i) => (
                            <div key={i} className="p-2 rounded bg-muted/50 text-xs">
                              <p className="text-muted-foreground">{b.bracket}</p>
                              <p className="font-medium">{b.rate}% = {formatCurrency(b.tax)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Family Total */}
            <Card className="bg-[#0F392B] text-white">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-white/70 text-sm">Combined Income</p>
                    <p className="text-2xl font-bold">{formatCurrency(totals.totalIncome)}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Combined Tax</p>
                    <p className="text-2xl font-bold text-red-300">{formatCurrency(totals.totalTax)}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Combined Net</p>
                    <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(totals.totalNet)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Tax Calculator</CardTitle>
                  <CardDescription>
                    Calculate company tax for {company.name || "your company"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>
                      Taxable Income
                      <ATOTooltip 
                        title="Company Taxable Income" 
                        description="Assessable income minus allowable deductions for the company."
                        atoUrl="https://www.ato.gov.au/businesses-and-organisations/corporate-tax"
                      />
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={companyIncome}
                        onChange={(e) => setCompanyIncome(Number(e.target.value))}
                        className="pl-10"
                        data-testid="company-income"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <Label>Base Rate Entity</Label>
                      <p className="text-sm text-muted-foreground">
                        Turnover under $50M = 25% tax
                        <ATOTooltip 
                          title="Base Rate Entity" 
                          description="Companies with aggregated turnover below $50M and no more than 80% passive income qualify for the 25% rate."
                          atoUrl="https://www.ato.gov.au/tax-rates-and-codes/company-tax-rates"
                        />
                      </p>
                    </div>
                    <Switch
                      checked={isBaseRateEntity}
                      onCheckedChange={setIsBaseRateEntity}
                      data-testid="base-rate-switch"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tax Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                    <p className="text-sm text-white/70">Company Tax ({companyTax.rate}%)</p>
                    <p className="text-3xl font-bold">{formatCurrency(companyTax.tax)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                      <p className="text-xl font-bold text-[#10B981]">{formatCurrency(companyTax.netProfit)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#D4AF37]/10">
                      <p className="text-sm text-muted-foreground">Franking Credits</p>
                      <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(companyTax.franking)}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <p><strong>Note:</strong> Franking credits can be attached to dividends paid to shareholders, 
                    providing them with a tax offset.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Company Tax Rates Reference */}
            <Card>
              <CardHeader>
                <CardTitle>Company Tax Rates 2024-25</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                    <p className="text-sm text-white/70">Base Rate Entities</p>
                    <p className="text-4xl font-bold">25%</p>
                    <p className="text-sm text-white/60 mt-2">Turnover {"<"} $50M, ≤80% passive income</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Full Rate Companies</p>
                    <p className="text-4xl font-bold">30%</p>
                    <p className="text-sm text-muted-foreground mt-2">All other companies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Family Tax Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Family Income vs Tax</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={familyComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill="#0F392B" />
                        <Bar dataKey="tax" name="Tax" fill="#EF4444" />
                        <Bar dataKey="net" name="Net" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Tax Distribution Pie */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax Distribution</CardTitle>
                  <CardDescription>How total family tax is split</CardDescription>
                </CardHeader>
                <CardContent>
                  {taxDistributionData.length > 0 ? (
                    <>
                      <ChartContainer height={200}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={taxDistributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="value"
                            >
                              {taxDistributionData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {taxDistributionData.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm">{item.name}: {formatCurrency(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No tax data to display
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Personal vs Company Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Personal vs Company Tax Structure</CardTitle>
                <CardDescription>Compare effective tax rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Entity</th>
                        <th className="text-right p-3">Income</th>
                        <th className="text-right p-3">Tax</th>
                        <th className="text-right p-3">Effective Rate</th>
                        <th className="text-right p-3">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {familyTaxData.map((member, i) => (
                        <tr key={member.id} className="border-b">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-[#0F392B]" />
                              {member.name}
                            </div>
                          </td>
                          <td className="text-right p-3">{formatCurrency(member.taxableIncome || 0)}</td>
                          <td className="text-right p-3 text-destructive">{formatCurrency(member.total)}</td>
                          <td className="text-right p-3">{member.effectiveRate.toFixed(1)}%</td>
                          <td className="text-right p-3 text-[#10B981]">{formatCurrency(member.netIncome)}</td>
                        </tr>
                      ))}
                      <tr className="border-b bg-[#D4AF37]/10">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[#D4AF37]" />
                            {company.name || "Company"}
                          </div>
                        </td>
                        <td className="text-right p-3">{formatCurrency(companyTax.income)}</td>
                        <td className="text-right p-3 text-destructive">{formatCurrency(companyTax.tax)}</td>
                        <td className="text-right p-3">{companyTax.rate}%</td>
                        <td className="text-right p-3 text-[#10B981]">{formatCurrency(companyTax.netProfit)}</td>
                      </tr>
                      <tr className="bg-muted font-semibold">
                        <td className="p-3">Combined Total</td>
                        <td className="text-right p-3">{formatCurrency(totals.totalIncome + companyTax.income)}</td>
                        <td className="text-right p-3 text-destructive">{formatCurrency(totals.totalTax + companyTax.tax)}</td>
                        <td className="text-right p-3">
                          {(((totals.totalTax + companyTax.tax) / (totals.totalIncome + companyTax.income)) * 100).toFixed(1)}%
                        </td>
                        <td className="text-right p-3 text-[#10B981]">{formatCurrency(totals.totalNet + companyTax.netProfit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Personal Tax Rates Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Tax Rates 2024-25</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {TAX_BRACKETS.map((bracket, i) => (
                      <div key={i} className="flex justify-between p-2 rounded bg-muted/50">
                        <span>
                          ${bracket.min.toLocaleString()} - {bracket.max === Infinity ? '+' : `$${bracket.max.toLocaleString()}`}
                        </span>
                        <span className={`font-semibold ${bracket.rate === 0 ? 'text-[#10B981]' : ''}`}>
                          {(bracket.rate * 100)}%
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between p-2 rounded bg-[#10B981]/10 border border-[#10B981]/30">
                      <span>Medicare Levy</span>
                      <span className="font-semibold">2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Sync Notice */}
              <Card className="bg-[#0F392B] text-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <RefreshCw className="h-8 w-8 text-[#D4AF37]" />
                    <div>
                      <h3 className="font-semibold text-lg">Data Sync Enabled</h3>
                      <p className="text-white/80 mt-2 text-sm">
                        Family member data is synchronized across all modules:
                      </p>
                      <ul className="text-sm text-white/70 mt-2 space-y-1">
                        <li>• Income Splitting</li>
                        <li>• Trust Distribution Analysis</li>
                        <li>• Family Overview</li>
                        <li>• Household Budget</li>
                      </ul>
                      <p className="text-xs text-white/60 mt-3">
                        Changes made here will automatically update across all connected pages.
                      </p>
                    </div>
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

export default TaxAnalysisSync;
