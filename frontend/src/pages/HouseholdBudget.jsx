import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  CheckCircle
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
  { id: "mortgage", label: "Mortgage/Rent", icon: Home, color: "#0F392B" },
  { id: "utilities", label: "Utilities", icon: Zap, color: "#D4AF37" },
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

const HouseholdBudget = () => {
  const { portfolio } = usePortfolio();
  
  // Income sources - integrated from portfolio
  const [incomes, setIncomes] = useState([
    { id: 1, source: "Employment", amount: portfolio.personal.taxableIncome, frequency: "annual" },
    { id: 2, source: "Rental Income (Sydney)", amount: portfolio.investments.properties[0]?.rental_income || 0, frequency: "annual" },
    { id: 3, source: "Rental Income (Melbourne)", amount: portfolio.investments.properties[1]?.rental_income || 0, frequency: "annual" },
    { id: 4, source: "Dividends", amount: Math.round(portfolio.investments.shares_value * (portfolio.investments.shares_dividend_yield / 100)), frequency: "annual" },
    { id: 5, source: "Term Deposit Interest", amount: Math.round(portfolio.investments.term_deposit_amount * (portfolio.investments.term_deposit_rate / 100)), frequency: "annual" }
  ]);

  // Regular monthly expenses
  const [expenses, setExpenses] = useState([
    { id: 1, category: "mortgage", description: "Sydney Mortgage", amount: Math.round((portfolio.investments.properties[0]?.mortgage_amount || 0) * 0.065 / 12), frequency: "monthly" },
    { id: 2, category: "mortgage", description: "Melbourne Mortgage", amount: Math.round((portfolio.investments.properties[1]?.mortgage_amount || 0) * 0.062 / 12), frequency: "monthly" },
    { id: 3, category: "utilities", description: "Electricity & Gas", amount: 350, frequency: "monthly" },
    { id: 4, category: "utilities", description: "Water", amount: 80, frequency: "monthly" },
    { id: 5, category: "groceries", description: "Food & Household", amount: 1200, frequency: "monthly" },
    { id: 6, category: "transport", description: "Car Loan", amount: 650, frequency: "monthly" },
    { id: 7, category: "transport", description: "Fuel & Rego", amount: 400, frequency: "monthly" },
    { id: 8, category: "phone_internet", description: "Mobile & Internet", amount: 180, frequency: "monthly" },
    { id: 9, category: "insurance", description: "Health Insurance", amount: Math.round(portfolio.expenses.health_insurance / 12), frequency: "monthly" },
    { id: 10, category: "insurance", description: "Home & Car Insurance", amount: 280, frequency: "monthly" },
    { id: 11, category: "education", description: "School Fees", amount: Math.round(portfolio.expenses.school_fees / 12), frequency: "monthly" },
    { id: 12, category: "entertainment", description: "Streaming & Subscriptions", amount: 120, frequency: "monthly" },
    { id: 13, category: "savings", description: "Emergency Fund", amount: 500, frequency: "monthly" }
  ]);

  // One-off costs
  const [oneOffCosts, setOneOffCosts] = useState([
    { id: 1, type: "holiday", description: "Family Holiday - Gold Coast", amount: 5000, month: 3 },
    { id: 2, type: "car_repair", description: "Car Service", amount: 800, month: 5 },
    { id: 3, type: "gifts", description: "Christmas", amount: 2000, month: 11 },
    { id: 4, type: "education", description: "School Camp", amount: 600, month: 8 }
  ]);

  const [activeTab, setActiveTab] = useState("overview");

  // Calculate totals
  const totalMonthlyIncome = incomes.reduce((sum, inc) => {
    return sum + (inc.frequency === "annual" ? inc.amount / 12 : inc.amount);
  }, 0);

  const totalMonthlyExpenses = expenses.reduce((sum, exp) => {
    return sum + (exp.frequency === "annual" ? exp.amount / 12 : exp.amount);
  }, 0);

  const totalAnnualOneOff = oneOffCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const averageMonthlyOneOff = totalAnnualOneOff / 12;

  const monthlySurplus = totalMonthlyIncome - totalMonthlyExpenses - averageMonthlyOneOff;
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
      .reduce((sum, exp) => sum + (exp.frequency === "annual" ? exp.amount / 12 : exp.amount), 0);
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

  return (
    <Layout>
      <div className="space-y-6" data-testid="household-budget-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
            Household Budget
          </h1>
          <p className="text-muted-foreground mt-1">
            Track income, expenses, and plan for one-off costs
          </p>
        </div>

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
          <Card className="bg-[#D4AF37] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                <p className="text-sm text-white/80">Annual One-offs</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalAnnualOneOff)}</p>
            </CardContent>
          </Card>
          <Card className={monthlySurplus >= 0 ? "bg-[#0F392B] text-white" : "bg-destructive text-white"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {monthlySurplus >= 0 ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <p className="text-sm text-white/80">Monthly Surplus</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(monthlySurplus)}</p>
            </CardContent>
          </Card>
        </div>

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
                  <CardTitle className="font-['Manrope']">Monthly Expense Breakdown</CardTitle>
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
                            <Cell key={index} fill={entry.color} />
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
                  <CardTitle className="font-['Manrope']">12-Month Cashflow Projection</CardTitle>
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
                        <Bar dataKey="oneOff" fill="#D4AF37" name="One-Off" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cumulative Savings */}
              <Card className="lg:col-span-2" data-testid="cumulative-savings">
                <CardHeader>
                  <CardTitle className="font-['Manrope']">Cumulative Savings Projection</CardTitle>
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
                          stroke="#0F392B" 
                          fill="#0F392B" 
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
                  <CardTitle className="font-['Manrope']">Income Sources</CardTitle>
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
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
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
                  <CardTitle className="font-['Manrope']">Regular Expenses</CardTitle>
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
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
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
                  <CardTitle className="font-['Manrope']">One-Off Costs</CardTitle>
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
                        <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-[#D4AF37]" />
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
                                <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
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
                          key={idx}
                          className={`p-2 rounded-lg text-center ${
                            monthTotal > 0 ? 'bg-[#D4AF37]/10' : 'bg-muted/50'
                          }`}
                        >
                          <p className="text-xs text-muted-foreground">{month.slice(0, 3)}</p>
                          <p className={`text-sm font-semibold ${monthTotal > 0 ? 'text-[#D4AF37]' : ''}`}>
                            {monthTotal > 0 ? formatCurrency(monthTotal) : '-'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-[#D4AF37]/10 flex justify-between items-center">
                  <span className="font-semibold">Total Annual One-Offs</span>
                  <span className="text-xl font-bold text-[#D4AF37]">{formatCurrency(totalAnnualOneOff)}</span>
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
                <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(totalAnnualOneOff)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annual Surplus</p>
                <p className={`text-xl font-bold ${annualSurplus >= 0 ? 'text-[#0F392B]' : 'text-destructive'}`}>
                  {formatCurrency(annualSurplus)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HouseholdBudget;
