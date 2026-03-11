import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChartContainer from "@/components/ChartContainer";
import { 
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Building2,
  Briefcase,
  LineChart,
  Percent,
  Calculator,
  ArrowLeft,
  Save,
  Edit,
  CheckCircle,
  AlertTriangle,
  Target,
  Calendar,
  Wallet,
  Users,
  ChevronRight
} from "lucide-react";
import { usePortfolio } from "@/App";
import { toast } from "sonner";
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
  Area
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Tax calculation with 2024-25 brackets
const TAX_BRACKETS = [
  { min: 0, max: 18200, rate: 0 },
  { min: 18201, max: 45000, rate: 0.16 },
  { min: 45001, max: 135000, rate: 0.30 },
  { min: 135001, max: 190000, rate: 0.37 },
  { min: 190001, max: Infinity, rate: 0.45 }
];

const calculateTax = (income) => {
  if (income <= 0) return { tax: 0, medicare: 0, total: 0, effectiveRate: 0, marginalRate: 0 };
  
  let tax = 0;
  for (const bracket of TAX_BRACKETS) {
    if (income > bracket.min) {
      const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
      tax += taxableInBracket * bracket.rate;
    }
  }
  
  const medicare = income > 24276 ? income * 0.02 : 0;
  const total = tax + medicare;
  const effectiveRate = (total / income) * 100;
  
  let marginalRate = 0;
  for (const bracket of TAX_BRACKETS) {
    if (income >= bracket.min) marginalRate = bracket.rate * 100;
  }
  marginalRate += 2;
  
  return { tax: Math.round(tax), medicare: Math.round(medicare), total: Math.round(total), effectiveRate, marginalRate };
};

const COLORS = ['#0F392B', '#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const FamilyMemberProfile = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { 
    familyMembers, 
    updateFamilyMember, 
    sharePortfolio, 
    trust, 
    portfolio,
    budget,
    hasUnsavedChanges,
    saveAllData
  } = usePortfolio();

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  // Find the member
  const member = familyMembers.find(m => m.id === Number(memberId));
  
  if (!member) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <AlertTriangle className="h-16 w-16 text-amber-500" />
          <h2 className="text-2xl font-bold">Member Not Found</h2>
          <p className="text-muted-foreground">The requested family member could not be found.</p>
          <Button onClick={() => navigate('/tax-analysis-sync')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tax Analysis
          </Button>
        </div>
      </Layout>
    );
  }

  // Calculate tax for this member
  const taxCalc = calculateTax(member.taxableIncome || 0);
  const netIncome = (member.taxableIncome || 0) - taxCalc.total;

  // Get shares owned by this member (personal ownership)
  const memberShares = sharePortfolio.filter(s => 
    s.ownership === 'personal' && s.ownerId === member.id
  );
  const totalShareValue = memberShares.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
  const totalShareGain = memberShares.reduce((sum, s) => 
    sum + ((s.currentPrice - s.purchasePrice) * s.quantity), 0);
  const annualDividends = memberShares.reduce((sum, s) => 
    sum + (s.quantity * s.currentPrice * (s.dividendYield / 100)), 0);

  // Trust distribution for this member
  const trustDistribution = member.isTrustBeneficiary 
    ? Math.round(trust.netIncome * ((member.trustDistribution || 0) / 100))
    : 0;

  // Super projection (7% growth for 10 years)
  const superBalance = member.superBalance || 0;
  const superProjection = [];
  let projectedSuper = superBalance;
  const annualContribution = (member.salaryIncome || 0) * 0.115; // 11.5% SG
  for (let year = 0; year <= 10; year++) {
    superProjection.push({
      year: `Year ${year}`,
      balance: Math.round(projectedSuper)
    });
    projectedSuper = projectedSuper * 1.07 + annualContribution;
  }

  // Income breakdown data
  const incomeBreakdown = [
    { name: 'Salary', value: member.salaryIncome || 0, color: '#0F392B' },
    { name: 'Dividends', value: member.dividendIncome || annualDividends || 0, color: '#D4AF37' },
    { name: 'Rental', value: member.rentalIncome || 0, color: '#10B981' },
    { name: 'Trust', value: trustDistribution, color: '#3B82F6' },
    { name: 'Other', value: (member.taxableIncome || 0) - (member.salaryIncome || 0) - (member.dividendIncome || 0) - (member.rentalIncome || 0) - trustDistribution, color: '#8B5CF6' }
  ].filter(item => item.value > 0);

  // Wealth composition
  const wealthComposition = [
    { name: 'Superannuation', value: superBalance, color: '#0F392B' },
    { name: 'Shares', value: totalShareValue, color: '#D4AF37' },
    { name: 'Cash', value: 0, color: '#10B981' } // Would need personal cash tracking
  ].filter(item => item.value > 0);

  const totalWealth = superBalance + totalShareValue;

  // Handle edit
  const handleEdit = () => {
    setEditedData({
      salaryIncome: member.salaryIncome || 0,
      dividendIncome: member.dividendIncome || 0,
      rentalIncome: member.rentalIncome || 0,
      deductions: member.deductions || 0,
      superBalance: member.superBalance || 0,
      trustDistribution: member.trustDistribution || 0
    });
    setIsEditing(true);
  };

  // Handle save
  const handleSave = () => {
    const totalIncome = (editedData.salaryIncome || 0) + 
                       (editedData.dividendIncome || 0) + 
                       (editedData.rentalIncome || 0);
    const taxableIncome = Math.max(0, totalIncome - (editedData.deductions || 0));
    
    updateFamilyMember(member.id, {
      ...editedData,
      taxableIncome
    });
    setIsEditing(false);
    toast.success("Profile updated - synced across all modules");
  };

  // Age calculation (mock - would need DOB)
  const age = member.age || 45;
  const yearsToRetirement = Math.max(0, 67 - age);

  return (
    <Layout>
      <div className="space-y-6" data-testid="family-member-profile-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0F392B] text-white flex items-center justify-center text-2xl font-bold">
                {member.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold font-['Manrope']">{member.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize">
                    {(member.relationship || 'family').replace('_', ' ')}
                  </Badge>
                  {member.isTrustBeneficiary && (
                    <Badge className="bg-[#D4AF37] text-[#0F392B]">Trust Beneficiary</Badge>
                  )}
                  {age && <Badge variant="secondary">Age {age}</Badge>}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} className="bg-[#0F392B]">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-[#0F392B] text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/70">Taxable Income</p>
              <p className="text-2xl font-bold">{formatCurrency(member.taxableIncome || 0)}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Tax Payable</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(taxCalc.total)}</p>
              <p className="text-xs text-muted-foreground">{taxCalc.effectiveRate.toFixed(1)}% effective</p>
            </CardContent>
          </Card>
          <Card className="bg-[#10B981]/10 border-[#10B981]/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Net Income</p>
              <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(netIncome)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#D4AF37]/10 border-[#D4AF37]/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Super Balance</p>
              <p className="text-2xl font-bold text-[#D4AF37]">{formatCurrency(superBalance)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Wealth</p>
              <p className="text-2xl font-bold">{formatCurrency(totalWealth)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="income">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="super">Super</TabsTrigger>
          </TabsList>

          {/* Income Tab */}
          <TabsContent value="income" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#0F392B]" />
                    Income Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Salary Income</Label>
                        <Input
                          type="number"
                          value={editedData.salaryIncome}
                          onChange={(e) => setEditedData({...editedData, salaryIncome: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dividend Income</Label>
                        <Input
                          type="number"
                          value={editedData.dividendIncome}
                          onChange={(e) => setEditedData({...editedData, dividendIncome: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rental Income</Label>
                        <Input
                          type="number"
                          value={editedData.rentalIncome}
                          onChange={(e) => setEditedData({...editedData, rentalIncome: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Deductions</Label>
                        <Input
                          type="number"
                          value={editedData.deductions}
                          onChange={(e) => setEditedData({...editedData, deductions: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 rounded-lg bg-[#0F392B]/10">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-[#0F392B]" />
                          <span>Salary Income</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(member.salaryIncome || 0)}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-[#D4AF37]/10">
                        <div className="flex items-center gap-2">
                          <LineChart className="h-4 w-4 text-[#D4AF37]" />
                          <span>Dividend Income</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(member.dividendIncome || annualDividends || 0)}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-[#10B981]/10">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#10B981]" />
                          <span>Rental Income</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(member.rentalIncome || 0)}</span>
                      </div>
                      {member.isTrustBeneficiary && trustDistribution > 0 && (
                        <div className="flex justify-between p-3 rounded-lg bg-[#3B82F6]/10">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#3B82F6]" />
                            <span>Trust Distribution ({member.trustDistribution}%)</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(trustDistribution)}</span>
                        </div>
                      )}
                      <div className="flex justify-between p-3 rounded-lg bg-destructive/10">
                        <span>Deductions</span>
                        <span className="font-semibold text-destructive">-{formatCurrency(member.deductions || 0)}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between p-3 rounded-lg bg-[#0F392B] text-white">
                          <span className="font-semibold">Taxable Income</span>
                          <span className="font-bold">{formatCurrency(member.taxableIncome || 0)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Income Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Income Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {incomeBreakdown.length > 0 ? (
                    <>
                      <ChartContainer height={200}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={incomeBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="value"
                            >
                              {incomeBreakdown.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="flex flex-wrap justify-center gap-3 mt-4">
                        {incomeBreakdown.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No income data
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tax Tab */}
          <TabsContent value="tax" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tax Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-destructive" />
                    Tax Summary 2024-25
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Income Tax</p>
                      <p className="text-2xl font-bold">{formatCurrency(taxCalc.tax)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Medicare Levy</p>
                      <p className="text-2xl font-bold">{formatCurrency(taxCalc.medicare)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-destructive/10">
                      <p className="text-sm text-muted-foreground">Total Tax</p>
                      <p className="text-2xl font-bold text-destructive">{formatCurrency(taxCalc.total)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#10B981]/10">
                      <p className="text-sm text-muted-foreground">Net Income</p>
                      <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(netIncome)}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Effective Tax Rate</p>
                        <p className="text-3xl font-bold text-[#D4AF37]">{taxCalc.effectiveRate.toFixed(1)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Marginal Rate</p>
                        <p className="text-3xl font-bold">{taxCalc.marginalRate.toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Income vs Tax</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={250}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Income', gross: member.taxableIncome || 0, tax: taxCalc.total, net: netIncome }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="gross" name="Gross Income" fill="#0F392B" />
                        <Bar dataKey="tax" name="Tax" fill="#EF4444" />
                        <Bar dataKey="net" name="Net Income" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tax Optimization Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#D4AF37]" />
                  Tax Optimization Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {taxCalc.marginalRate > 34 && (
                    <div className="p-4 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#10B981] mt-0.5" />
                        <div>
                          <p className="font-medium">Salary Sacrifice to Super</p>
                          <p className="text-sm text-muted-foreground">
                            At {taxCalc.marginalRate.toFixed(0)}% marginal rate, salary sacrificing to super (15% tax) 
                            could save up to {formatCurrency((member.taxableIncome || 0) * 0.1 * ((taxCalc.marginalRate - 15) / 100))} annually.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {member.isTrustBeneficiary && (
                    <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#D4AF37] mt-0.5" />
                        <div>
                          <p className="font-medium">Trust Distribution</p>
                          <p className="text-sm text-muted-foreground">
                            Currently receiving {member.trustDistribution}% ({formatCurrency(trustDistribution)}) from family trust.
                            Review distribution strategy annually.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-[#3B82F6] mt-0.5" />
                      <div>
                        <p className="font-medium">Deductions Review</p>
                        <p className="text-sm text-muted-foreground">
                          Current deductions: {formatCurrency(member.deductions || 0)}. 
                          Ensure all work-related expenses and charitable donations are claimed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Share Holdings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-[#D4AF37]" />
                    Share Holdings
                  </CardTitle>
                  <CardDescription>Personal share portfolio</CardDescription>
                </CardHeader>
                <CardContent>
                  {memberShares.length > 0 ? (
                    <div className="space-y-3">
                      {memberShares.map((share, i) => {
                        const value = share.quantity * share.currentPrice;
                        const gain = (share.currentPrice - share.purchasePrice) * share.quantity;
                        const gainPct = ((share.currentPrice - share.purchasePrice) / share.purchasePrice) * 100;
                        
                        return (
                          <div key={i} className="p-3 rounded-lg border">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{share.symbol}</p>
                                <p className="text-sm text-muted-foreground">{share.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(value)}</p>
                                <p className={`text-sm ${gain >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                                  {gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({gainPct.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                              <span>{share.quantity} shares</span>
                              <span>Yield: {share.dividendYield}%</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-3 border-t">
                        <div className="flex justify-between p-3 rounded-lg bg-[#0F392B] text-white">
                          <span>Total Value</span>
                          <span className="font-bold">{formatCurrency(totalShareValue)}</span>
                        </div>
                        <div className="flex justify-between p-2 mt-2">
                          <span className="text-sm text-muted-foreground">Total Gain/Loss</span>
                          <span className={`font-medium ${totalShareGain >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                            {totalShareGain >= 0 ? '+' : ''}{formatCurrency(totalShareGain)}
                          </span>
                        </div>
                        <div className="flex justify-between p-2">
                          <span className="text-sm text-muted-foreground">Annual Dividends</span>
                          <span className="font-medium text-[#D4AF37]">{formatCurrency(annualDividends)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No personal share holdings</p>
                      <Link to="/share-portfolio">
                        <Button variant="outline" size="sm" className="mt-2">
                          View Share Portfolio
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wealth Composition */}
              <Card>
                <CardHeader>
                  <CardTitle>Wealth Composition</CardTitle>
                </CardHeader>
                <CardContent>
                  {wealthComposition.length > 0 && totalWealth > 0 ? (
                    <>
                      <ChartContainer height={200}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={wealthComposition}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="value"
                            >
                              {wealthComposition.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="space-y-2 mt-4">
                        {wealthComposition.map((item, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span>{item.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">{formatCurrency(item.value)}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({((item.value / totalWealth) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No wealth data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Super Tab */}
          <TabsContent value="super" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Super Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-[#D4AF37]" />
                    Superannuation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Current Super Balance</Label>
                        <Input
                          type="number"
                          value={editedData.superBalance}
                          onChange={(e) => setEditedData({...editedData, superBalance: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-3xl font-bold text-[#D4AF37]">{formatCurrency(superBalance)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">Annual SG (11.5%)</p>
                          <p className="text-lg font-bold">{formatCurrency(annualContribution)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">Years to Preservation</p>
                          <p className="text-lg font-bold">{Math.max(0, 60 - age)} years</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#0F392B]/10">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Projected Balance (10 years)</p>
                            <p className="text-2xl font-bold text-[#0F392B]">
                              {formatCurrency(superProjection[10]?.balance || 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Assumed Return</p>
                            <p className="text-lg font-medium">7% p.a.</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Super Projection Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>10-Year Super Projection</CardTitle>
                  <CardDescription>Assuming 7% annual return + SG contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={280}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={superProjection}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          name="Super Balance"
                          stroke="#D4AF37" 
                          fill="#D4AF37" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Super Optimization */}
            <Card>
              <CardHeader>
                <CardTitle>Super Optimization Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-[#10B981]/10">
                    <h4 className="font-semibold mb-2">Salary Sacrifice</h4>
                    <p className="text-sm text-muted-foreground">
                      Contribute extra from pre-tax salary. Cap: $30,000/year (2024-25).
                      Tax saving: {formatCurrency((Math.min(30000, (member.salaryIncome || 0) * 0.1)) * (taxCalc.marginalRate - 15) / 100)} potential.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#D4AF37]/10">
                    <h4 className="font-semibold mb-2">Spouse Contribution</h4>
                    <p className="text-sm text-muted-foreground">
                      Contribute to spouse's super for up to $540 tax offset if spouse earns under $40,000.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#3B82F6]/10">
                    <h4 className="font-semibold mb-2">Carry Forward</h4>
                    <p className="text-sm text-muted-foreground">
                      If super balance under $500k, use unused concessional cap from previous 5 years.
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/tax-analysis-sync">
                <Button variant="outline" className="w-full justify-start">
                  <Calculator className="h-4 w-4 mr-2" />
                  Tax Analysis
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link to="/income-splitting">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Income Splitting
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link to="/trust-distributions">
                <Button variant="outline" className="w-full justify-start">
                  <Wallet className="h-4 w-4 mr-2" />
                  Trust Distribution
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link to="/share-portfolio">
                <Button variant="outline" className="w-full justify-start">
                  <LineChart className="h-4 w-4 mr-2" />
                  Share Portfolio
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

export default FamilyMemberProfile;
