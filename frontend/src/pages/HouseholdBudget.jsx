import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Wallet,
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Home,
  Car,
  Utensils,
  Zap,
  Phone,
  Heart,
  GraduationCap,
  ShoppingBag,
  Plane,
  Wrench,
  Gift,
  Calendar,
  PiggyBank,
  AlertCircle,
  CheckCircle,
  FlaskConical,
  RotateCcw
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
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

const EXPENSE_CATEGORIES = [
  { id: "mortgage", label: "Mortgage/Rent", icon: Home, color: "#1a2744" },
  { id: "utilities", label: "Utilities", icon: Zap, color: "#D4A84C" },
  { id: "groceries", label: "Groceries", icon: Utensils, color: "#10B981" },
  { id: "transport", label: "Transport/Car", icon: Car, color: "#3B82F6" },
  { id: "phone_internet", label: "Phone/Internet", icon: Phone, color: "#8B5CF6" },
  { id: "insurance", label: "Insurance", icon: Heart, color: "#EC4899" },
  { id: "education", label: "Education", icon: GraduationCap, color: "#F59E0B" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "#6366F1" },
  { id: "entertainment", label: "Entertainment", icon: Gift, color: "#14B8A6" },
  { id: "savings", label: "Savings", icon: PiggyBank, color: "#22C55E" },
  { id: "other", label: "Other", icon: Wallet, color: "#64748B" }
];

const ONE_OFF_TYPES = [
  { id: "holiday", label: "Holiday/Travel", icon: Plane },
  { id: "car_repair", label: "Car Repairs", icon: Wrench },
  { id: "medical", label: "Medical/Dental", icon: Heart },
  { id: "gifts", label: "Gifts/Events", icon: Gift },
  { id: "home_repair", label: "Home Repairs", icon: Home },
  { id: "education", label: "Education Fees", icon: GraduationCap },
  { id: "other", label: "Other", icon: Wallet }
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Frequency multipliers to convert to monthly
const FREQUENCY_TO_MONTHLY = {
  weekly: 52 / 12,      // ~4.33
  fortnightly: 26 / 12, // ~2.17
  monthly: 1,
  quarterly: 1 / 3,
  annual: 1 / 12
};

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" }
];

const HouseholdBudget = ({ embedded = false }) => {
  const { portfolio } = usePortfolio();
  
  // Income sources - integrated from portfolio
  const [incomes, setIncomes] = useState([
    { id: 1, source: "Employment (James)", amount: 3558, frequency: "weekly" },
    { id: 2, source: "Employment (Sarah)", amount: 1827, frequency: "weekly" },
    { id: 3, source: "Rental Income (Sydney)", amount: portfolio.investments?.properties?.[0]?.rental_income || 0, frequency: "annual" },
    { id: 4, source: "Rental Income (Melbourne)", amount: portfolio.investments?.properties?.[1]?.rental_income || 0, frequency: "annual" },
    { id: 5, source: "Dividends", amount: Math.round((portfolio.investments?.shares_value || 0) * ((portfolio.investments?.shares_dividend_yield || 0) / 100)), frequency: "annual" },
    { id: 6, source: "Term Deposit Interest", amount: Math.round((portfolio.investments?.term_deposit_amount || 0) * ((portfolio.investments?.term_deposit_rate || 0) / 100)), frequency: "annual" }
  ]);

  // Regular expenses with various frequencies
  const [expenses, setExpenses] = useState([
    { id: 1, category: "mortgage", description: "Sydney Mortgage", amount: Math.round((portfolio.investments?.properties?.[0]?.mortgage_amount || 0) * 0.065 / 12), frequency: "monthly" },
    { id: 2, category: "mortgage", description: "Melbourne Mortgage", amount: Math.round((portfolio.investments?.properties?.[1]?.mortgage_amount || 0) * 0.062 / 12), frequency: "monthly" },
    { id: 3, category: "utilities", description: "Electricity & Gas", amount: 350, frequency: "monthly" },
    { id: 4, category: "utilities", description: "Water", amount: 240, frequency: "quarterly" },
    { id: 5, category: "groceries", description: "Food & Household", amount: 300, frequency: "weekly" },
    { id: 6, category: "transport", description: "Car Loan", amount: 325, frequency: "fortnightly" },
    { id: 7, category: "transport", description: "Fuel", amount: 80, frequency: "weekly" },
    { id: 8, category: "transport", description: "Rego & CTP", amount: 1400, frequency: "annual" },
    { id: 9, category: "phone_internet", description: "Mobile & Internet", amount: 180, frequency: "monthly" },
    { id: 10, category: "insurance", description: "Health Insurance", amount: portfolio.expenses?.health_insurance || 4800, frequency: "annual" },
    { id: 11, category: "insurance", description: "Home & Car Insurance", amount: 3360, frequency: "annual" },
    { id: 12, category: "education", description: "School Fees", amount: (portfolio.expenses?.school_fees || 9600) / 4, frequency: "quarterly" },
    { id: 13, category: "entertainment", description: "Streaming & Subscriptions", amount: 120, frequency: "monthly" },
    { id: 14, category: "savings", description: "Emergency Fund", amount: 250, frequency: "fortnightly" }
  ]);

  // One-off costs
  const [oneOffCosts, setOneOffCosts] = useState([
    { id: 1, type: "holiday", description: "Family Holiday - Gold Coast", amount: 5000, month: 3 },
    { id: 2, type: "car_repair", description: "Car Service", amount: 800, month: 5 },
    { id: 3, type: "gifts", description: "Christmas", amount: 2000, month: 11 },
    { id: 4, type: "education", description: "School Camp", amount: 600, month: 8 }
  ]);

  const [activeTab, setActiveTab] = useState("overview");

  // What-If Mode
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [whatIfAdjustments, setWhatIfAdjustments] = useState({
    incomeChange: 0,    // percentage change
    expenseChange: 0,   // percentage change
    extraSavings: 0,    // additional monthly savings
    lumpSum: 0,         // one-off injection
    mortgageRateChange: 0, // basis points change
  });

  // Helper to convert any frequency to monthly
  const toMonthly = (amount, frequency) => {
    return amount * (FREQUENCY_TO_MONTHLY[frequency] || 1);
  };

  // Calculate totals (with What-If adjustments)
  const incomeMultiplier = whatIfMode ? 1 + (whatIfAdjustments.incomeChange / 100) : 1;
  const expenseMultiplier = whatIfMode ? 1 + (whatIfAdjustments.expenseChange / 100) : 1;
  const extraSavings = whatIfMode ? whatIfAdjustments.extraSavings : 0;

  const totalMonthlyIncome = incomes.reduce((sum, inc) => {
    return sum + toMonthly(inc.amount, inc.frequency);
  }, 0) * incomeMultiplier;

  const totalMonthlyExpenses = expenses.reduce((sum, exp) => {
    return sum + toMonthly(exp.amount, exp.frequency);
  }, 0) * expenseMultiplier;

  const totalAnnualOneOff = oneOffCosts.reduce((sum, cost) => sum + cost.amount, 0) + (whatIfMode ? whatIfAdjustments.lumpSum : 0);
  const averageMonthlyOneOff = totalAnnualOneOff / 12;

  const monthlySurplus = totalMonthlyIncome - totalMonthlyExpenses - averageMonthlyOneOff + extraSavings;
  const annualSurplus = monthlySurplus * 12;

  // Add handlers
  const addIncome = () => {
    setIncomes([...incomes, { id: Date.now(), source: "", amount: 0, frequency: "monthly" }]);
  };

  const removeIncome = (id) => {
    setIncomes(incomes.filter(inc => inc.id !== id));
  };

  const updateIncome = (id, field, value) => {
    setIncomes(incomes.map(inc => inc.id === id ? { ...inc, [field]: value } : inc));
  };

  const addExpense = () => {
    setExpenses([...expenses, { id: Date.now(), category: "other", description: "", amount: 0, frequency: "monthly" }]);
  };

  const removeExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const updateExpense = (id, field, value) => {
    setExpenses(expenses.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const addOneOff = () => {
    setOneOffCosts([...oneOffCosts, { id: Date.now(), type: "other", description: "", amount: 0, month: new Date().getMonth() }]);
  };

  const removeOneOff = (id) => {
    setOneOffCosts(oneOffCosts.filter(cost => cost.id !== id));
  };

  const updateOneOff = (id, field, value) => {
    setOneOffCosts(oneOffCosts.map(cost => cost.id === id ? { ...cost, [field]: value } : cost));
  };

  // Chart data
  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => {
    const total = expenses
      .filter(exp => exp.category === cat.id)
      .reduce((sum, exp) => sum + toMonthly(exp.amount, exp.frequency), 0);
    return { name: cat.label, value: Math.round(total), color: cat.color };
  }).filter(item => item.value > 0);

  const monthlyProjection = MONTHS.map((month, idx) => {
    const monthOneOff = oneOffCosts
      .filter(cost => cost.month === idx)
      .reduce((sum, cost) => sum + cost.amount, 0);
    
    return {
      month: month.slice(0, 3),
      income: Math.round(totalMonthlyIncome),
      expenses: Math.round(totalMonthlyExpenses),
      oneOff: monthOneOff,
      total: Math.round(totalMonthlyExpenses + monthOneOff),
      surplus: Math.round(totalMonthlyIncome - totalMonthlyExpenses - monthOneOff)
    };
  });

  const cumulativeSavings = monthlyProjection.reduce((acc, month, idx) => {
    const prev = idx > 0 ? acc[idx - 1].cumulative : 0;
    acc.push({
      month: month.month,
      surplus: month.surplus,
      cumulative: prev + month.surplus
    });
    return acc;
  }, []);

  const content = (
      <div className="space-y-6" data-testid="household-budget-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Household Budget
            </h1>
            <p className="text-muted-foreground mt-1">
              Track income, expenses, and plan for one-off costs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer" data-testid="whatif-toggle">
              <FlaskConical className={`h-4 w-4 ${whatIfMode ? "text-purple-600" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${whatIfMode ? "text-purple-600" : "text-muted-foreground"}`}>What-If</span>
              <Switch checked={whatIfMode} onCheckedChange={setWhatIfMode} />
            </label>
            {whatIfMode && (
              <Button variant="ghost" size="sm" onClick={() => setWhatIfAdjustments({ incomeChange: 0, expenseChange: 0, extraSavings: 0, lumpSum: 0, mortgageRateChange: 0 })} data-testid="reset-whatif">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* What-If Scenario Panel */}
        {whatIfMode && (
          <Card className="border-purple-200 bg-purple-50/50" data-testid="whatif-panel">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-semibold text-purple-700">What-If Scenario Adjustments</p>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">Simulation</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Income Change</Label>
                  <div className="flex items-center gap-2">
                    <Slider value={[whatIfAdjustments.incomeChange]} min={-50} max={50} step={5}
                      onValueChange={([v]) => setWhatIfAdjustments(p => ({...p, incomeChange: v}))}
                      className="flex-1" />
                    <span className={`text-xs font-bold min-w-[40px] text-right ${whatIfAdjustments.incomeChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {whatIfAdjustments.incomeChange > 0 ? "+" : ""}{whatIfAdjustments.incomeChange}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Expense Change</Label>
                  <div className="flex items-center gap-2">
                    <Slider value={[whatIfAdjustments.expenseChange]} min={-50} max={50} step={5}
                      onValueChange={([v]) => setWhatIfAdjustments(p => ({...p, expenseChange: v}))}
                      className="flex-1" />
                    <span className={`text-xs font-bold min-w-[40px] text-right ${whatIfAdjustments.expenseChange <= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {whatIfAdjustments.expenseChange > 0 ? "+" : ""}{whatIfAdjustments.expenseChange}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Extra Monthly Savings</Label>
                  <Input type="number" value={whatIfAdjustments.extraSavings} onChange={e => setWhatIfAdjustments(p => ({...p, extraSavings: Number(e.target.value)}))}
                    className="h-8 text-xs" placeholder="$0" data-testid="whatif-extra-savings" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Annual Lump Sum</Label>
                  <Input type="number" value={whatIfAdjustments.lumpSum} onChange={e => setWhatIfAdjustments(p => ({...p, lumpSum: Number(e.target.value)}))}
                    className="h-8 text-xs" placeholder="$0" data-testid="whatif-lump-sum" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mortgage Rate (bps)</Label>
                  <div className="flex items-center gap-2">
                    <Slider value={[whatIfAdjustments.mortgageRateChange]} min={-200} max={200} step={25}
                      onValueChange={([v]) => setWhatIfAdjustments(p => ({...p, mortgageRateChange: v}))}
                      className="flex-1" />
                    <span className={`text-xs font-bold min-w-[40px] text-right ${whatIfAdjustments.mortgageRateChange <= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {whatIfAdjustments.mortgageRateChange > 0 ? "+" : ""}{whatIfAdjustments.mortgageRateChange}bp
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#10B981] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-sm text-white/80">Monthly Income</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalMonthlyIncome)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#EF4444] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4" />
                <p className="text-sm text-white/80">Monthly Expenses</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalMonthlyExpenses)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#D4A84C] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                <p className="text-sm text-white/80">Annual One-offs</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalAnnualOneOff)}</p>
            </CardContent>
          </Card>
          <Card className={monthlySurplus >= 0 ? "bg-[#1a2744] text-white" : "bg-destructive text-white"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {monthlySurplus >= 0 ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <p className="text-sm text-white/80">Monthly Surplus</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(monthlySurplus)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Investable Surplus Callout */}
        {monthlySurplus > 0 && (
          <Card className="border-l-4 border-l-[#D4A84C] bg-gradient-to-r from-[#D4A84C]/5 to-transparent" data-testid="investable-surplus">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[#D4A84C]/10 flex items-center justify-center">
                  <PiggyBank className="h-6 w-6 text-[#D4A84C]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available to Invest</p>
                  <p className="text-2xl font-bold text-[#1a2744]">{formatCurrency(monthlySurplus)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(annualSurplus)}/year after all expenses & one-offs</p>
                </div>
              </div>
              <Button
                className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                onClick={() => window.location.href = "/investments"}
                data-testid="invest-surplus-btn"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Investments
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="oneoff">One-Offs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expense Breakdown Pie */}
              <Card data-testid="expense-breakdown">
                <CardHeader>
                  <CardTitle className="">Monthly Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={250}>
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                          labelLine={false}
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`item-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Cashflow */}
              <Card data-testid="monthly-cashflow">
                <CardHeader>
                  <CardTitle className="">12-Month Cashflow Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={250}>
                      <BarChart data={monthlyProjection}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="income" fill="#10B981" name="Income" />
                        <Bar dataKey="expenses" fill="#EF4444" name="Regular" />
                        <Bar dataKey="oneOff" fill="#D4A84C" name="One-Off" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cumulative Savings */}
              <Card className="lg:col-span-2" data-testid="cumulative-savings">
                <CardHeader>
                  <CardTitle className="">Cumulative Savings Projection</CardTitle>
                  <CardDescription>
                    Projected annual savings: {formatCurrency(cumulativeSavings[11]?.cumulative || 0)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={250}>
                      <AreaChart data={cumulativeSavings}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Area 
                          type="monotone" 
                          dataKey="cumulative" 
                          name="Cumulative Savings"
                          stroke="#1a2744" 
                          fill="#1a2744" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income" className="space-y-4">
            <Card data-testid="income-section">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="">Income Sources</CardTitle>
                  <Button variant="outline" size="sm" onClick={addIncome}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income
                  </Button>
                </div>
                <CardDescription>
                  Income sources are pre-populated from your portfolio. Edit or add new sources.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incomes.map((income) => (
                    <div key={income.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-[#10B981]" />
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <Input
                          value={income.source}
                          onChange={(e) => updateIncome(income.id, 'source', e.target.value)}
                          placeholder="Source"
                        />
                        <Input
                          type="number"
                          value={income.amount}
                          onChange={(e) => updateIncome(income.id, 'amount', Number(e.target.value))}
                          placeholder="Amount"
                        />
                        <Select 
                          value={income.frequency} 
                          onValueChange={(v) => updateIncome(income.id, 'frequency', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCY_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeIncome(income.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 rounded-lg bg-[#10B981]/10 flex justify-between items-center">
                  <span className="font-semibold">Total Monthly Income</span>
                  <span className="text-xl font-bold text-[#10B981]">{formatCurrency(totalMonthlyIncome)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <Card data-testid="expenses-section">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="">Regular Expenses</CardTitle>
                  <Button variant="outline" size="sm" onClick={addExpense}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
                <CardDescription>
                  Monthly recurring expenses. Mortgage payments are calculated from your properties.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {expenses.map((expense) => {
                    const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
                    const Icon = category?.icon || Wallet;
                    
                    return (
                      <div key={expense.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category?.color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: category?.color }} />
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <Select 
                            value={expense.category} 
                            onValueChange={(v) => updateExpense(expense.id, 'category', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EXPENSE_CATEGORIES.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={expense.description}
                            onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                            placeholder="Description"
                          />
                          <Input
                            type="number"
                            value={expense.amount}
                            onChange={(e) => updateExpense(expense.id, 'amount', Number(e.target.value))}
                            placeholder="Amount"
                          />
                          <Select 
                            value={expense.frequency} 
                            onValueChange={(v) => updateExpense(expense.id, 'frequency', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FREQUENCY_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeExpense(expense.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-4 rounded-lg bg-destructive/10 flex justify-between items-center">
                  <span className="font-semibold">Total Monthly Expenses</span>
                  <span className="text-xl font-bold text-destructive">{formatCurrency(totalMonthlyExpenses)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* One-Off Costs Tab */}
          <TabsContent value="oneoff" className="space-y-4">
            <Card data-testid="oneoff-section">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="">One-Off Costs</CardTitle>
                  <Button variant="outline" size="sm" onClick={addOneOff}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add One-Off
                  </Button>
                </div>
                <CardDescription>
                  Plan for holidays, car repairs, gifts, and other irregular expenses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {oneOffCosts.map((cost) => {
                    const costType = ONE_OFF_TYPES.find(t => t.id === cost.type);
                    const Icon = costType?.icon || Wallet;
                    
                    return (
                      <div key={cost.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="w-10 h-10 rounded-lg bg-[#D4A84C]/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-[#D4A84C]" />
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <Select 
                            value={cost.type} 
                            onValueChange={(v) => updateOneOff(cost.id, 'type', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ONE_OFF_TYPES.map(type => (
                                <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={cost.description}
                            onChange={(e) => updateOneOff(cost.id, 'description', e.target.value)}
                            placeholder="Description"
                          />
                          <Input
                            type="number"
                            value={cost.amount}
                            onChange={(e) => updateOneOff(cost.id, 'amount', Number(e.target.value))}
                            placeholder="Amount"
                          />
                          <Select 
                            value={cost.month.toString()} 
                            onValueChange={(v) => updateOneOff(cost.id, 'month', Number(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map((month, idx) => (
                                <SelectItem key={`item-${idx}`} value={idx.toString()}>{month}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeOneOff(cost.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* One-Off by Month */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">One-Off Costs by Month</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                    {MONTHS.map((month, idx) => {
                      const monthTotal = oneOffCosts
                        .filter(c => c.month === idx)
                        .reduce((sum, c) => sum + c.amount, 0);
                      
                      return (
                        <div 
                          key={`item-${idx}`}
                          className={`p-2 rounded-lg text-center ${
                            monthTotal > 0 ? 'bg-[#D4A84C]/10' : 'bg-muted/50'
                          }`}
                        >
                          <p className="text-xs text-muted-foreground">{month.slice(0, 3)}</p>
                          <p className={`text-sm font-semibold ${monthTotal > 0 ? 'text-[#D4A84C]' : ''}`}>
                            {monthTotal > 0 ? formatCurrency(monthTotal) : '-'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-[#D4A84C]/10 flex justify-between items-center">
                  <span className="font-semibold">Total Annual One-Offs</span>
                  <span className="text-xl font-bold text-[#D4A84C]">{formatCurrency(totalAnnualOneOff)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Footer */}
        <Card className={monthlySurplus >= 0 ? "border-[#10B981]" : "border-destructive"}>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Annual Income</p>
                <p className="text-xl font-bold text-[#10B981]">{formatCurrency(totalMonthlyIncome * 12)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annual Expenses</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(totalMonthlyExpenses * 12)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">One-Off Costs</p>
                <p className="text-xl font-bold text-[#D4A84C]">{formatCurrency(totalAnnualOneOff)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annual Surplus</p>
                <p className={`text-xl font-bold ${annualSurplus >= 0 ? 'text-[#1a2744]' : 'text-destructive'}`}>
                  {formatCurrency(annualSurplus)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default HouseholdBudget;
