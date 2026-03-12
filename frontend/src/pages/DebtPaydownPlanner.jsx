import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard,
  TrendingDown,
  Calendar,
  DollarSign,
  Calculator,
  Target,
  Zap,
  Home,
  Car,
  Wallet,
  CheckCircle,
  Plus,
  Trash2
} from "lucide-react";
import { usePortfolio } from "@/App";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
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

const DebtPaydownPlanner = () => {
  const { portfolio } = usePortfolio();
  
  // Debts
  const [debts, setDebts] = useState([
    { 
      id: 1, 
      name: "Home Mortgage - Sydney", 
      type: "mortgage",
      balance: 510000, 
      interestRate: 6.5, 
      minimumPayment: 3200,
      extraPayment: 0
    },
    { 
      id: 2, 
      name: "Investment Loan - Melbourne", 
      type: "mortgage",
      balance: 432000, 
      interestRate: 6.2, 
      minimumPayment: 2700,
      extraPayment: 0
    },
    { 
      id: 3, 
      name: "Car Loan", 
      type: "car",
      balance: 25000, 
      interestRate: 8.5, 
      minimumPayment: 550,
      extraPayment: 0
    }
  ]);
  
  const [extraBudget, setExtraBudget] = useState(500);
  const [strategy, setStrategy] = useState("avalanche"); // avalanche or snowball

  // Calculate payoff schedule for a single debt
  const calculatePayoff = (balance, rate, payment) => {
    const monthlyRate = rate / 100 / 12;
    let remaining = balance;
    let months = 0;
    let totalInterest = 0;
    const schedule = [];
    
    while (remaining > 0 && months < 600) { // Max 50 years
      const interest = remaining * monthlyRate;
      totalInterest += interest;
      const principal = Math.min(payment - interest, remaining);
      remaining = Math.max(0, remaining - principal);
      months++;
      
      if (months % 12 === 0 || remaining === 0) {
        schedule.push({
          month: months,
          year: Math.ceil(months / 12),
          remaining: Math.round(remaining),
          interest: Math.round(interest)
        });
      }
    }
    
    return { months, totalInterest, schedule };
  };

  // Calculate total debt payoff
  const calculateTotalPayoff = () => {
    let totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    let totalMinimum = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
    let totalExtra = extraBudget;
    
    // Sort debts based on strategy
    const sortedDebts = [...debts].sort((a, b) => {
      if (strategy === "avalanche") {
        return b.interestRate - a.interestRate; // Highest rate first
      } else {
        return a.balance - b.balance; // Lowest balance first
      }
    });
    
    // Simulate payoff
    let month = 0;
    let totalInterest = 0;
    const schedule = [];
    const debtBalances = debts.map(d => ({ ...d, remaining: d.balance }));
    
    while (debtBalances.some(d => d.remaining > 0) && month < 600) {
      month++;
      let extraAvailable = totalExtra;
      
      // Apply payments
      for (const debt of debtBalances) {
        if (debt.remaining <= 0) continue;
        
        const monthlyRate = debt.interestRate / 100 / 12;
        const interest = debt.remaining * monthlyRate;
        totalInterest += interest;
        
        // Find if this debt should get extra payment
        const sortedIndex = sortedDebts.findIndex(d => d.id === debt.id);
        const isTargetDebt = sortedIndex === sortedDebts.findIndex(d => 
          debtBalances.find(db => db.id === d.id)?.remaining > 0
        );
        
        let payment = debt.minimumPayment;
        if (isTargetDebt) {
          payment += extraAvailable;
          extraAvailable = 0;
        }
        
        const principal = Math.min(payment - interest, debt.remaining);
        debt.remaining = Math.max(0, debt.remaining - principal);
      }
      
      // Record monthly snapshot
      if (month % 6 === 0 || month === 1) {
        schedule.push({
          month,
          year: (month / 12).toFixed(1),
          total: debtBalances.reduce((sum, d) => sum + d.remaining, 0),
          ...debtBalances.reduce((acc, d) => {
            acc[d.name.split(' ')[0]] = d.remaining;
            return acc;
          }, {})
        });
      }
    }
    
    return { 
      months: month, 
      totalInterest: Math.round(totalInterest),
      schedule,
      debtFreeDate: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000)
    };
  };

  const result = calculateTotalPayoff();
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMinimum = debts.reduce((sum, d) => sum + d.minimumPayment, 0);

  // Calculate savings from extra payments
  const withoutExtra = calculateTotalPayoff();
  const savedInterest = withoutExtra.totalInterest - result.totalInterest;
  const savedMonths = withoutExtra.months - result.months;

  const getDebtIcon = (type) => {
    switch (type) {
      case "mortgage": return Home;
      case "car": return Car;
      case "credit": return CreditCard;
      default: return Wallet;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-bold text-sm">Year {label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="debt-paydown-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-[#D4AF37]" />
              Debt Paydown Planner
            </h1>
            <p className="text-muted-foreground mt-1">
              Optimize your debt repayment strategy
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={strategy === "avalanche" ? "default" : "outline"}
              onClick={() => setStrategy("avalanche")}
              className={strategy === "avalanche" ? "bg-[#0F392B]" : ""}
            >
              Avalanche
            </Button>
            <Button
              variant={strategy === "snowball" ? "default" : "outline"}
              onClick={() => setStrategy("snowball")}
              className={strategy === "snowball" ? "bg-[#0F392B]" : ""}
            >
              Snowball
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-700">Total Debt</p>
              <p className="text-2xl font-bold text-red-800">{formatCurrency(totalDebt)}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-sm text-green-700">Debt-Free Date</p>
              <p className="text-2xl font-bold text-green-800">
                {result.debtFreeDate.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
              </p>
              <p className="text-sm text-green-600">{Math.ceil(result.months / 12)} years</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Interest</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(result.totalInterest)}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#0F392B] bg-[#0F392B]/5">
            <CardContent className="pt-6">
              <p className="text-sm text-[#0F392B]">Monthly Payment</p>
              <p className="text-2xl font-bold text-[#0F392B]">{formatCurrency(totalMinimum + extraBudget)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Extra Payment Slider */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#D4AF37]" />
              Extra Monthly Payment
            </CardTitle>
            <CardDescription>
              Add extra payments to pay off debt faster. Currently using <strong>{strategy}</strong> method.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-[#0F392B]">{formatCurrency(extraBudget)}</span>
                <span className="text-muted-foreground">/ month extra</span>
              </div>
              <Slider
                value={[extraBudget]}
                onValueChange={(v) => setExtraBudget(v[0])}
                min={0}
                max={2000}
                step={50}
                data-testid="extra-payment-slider"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>$0</span>
                <span>$2,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payoff Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Debt Payoff Projection</CardTitle>
            <CardDescription>How your debt will decrease over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer height={350}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.schedule}>
                  <defs>
                    <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" label={{ value: 'Years', position: 'bottom', offset: -5 }} />
                  <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Debt"
                    stroke="#EF4444"
                    fill="url(#debtGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Individual Debts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Debts</CardTitle>
            <CardDescription>
              {strategy === "avalanche" 
                ? "Sorted by interest rate (highest first) - saves the most money"
                : "Sorted by balance (lowest first) - faster psychological wins"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...debts].sort((a, b) => 
                strategy === "avalanche" 
                  ? b.interestRate - a.interestRate 
                  : a.balance - b.balance
              ).map((debt, index) => {
                const Icon = getDebtIcon(debt.type);
                const payoff = calculatePayoff(debt.balance, debt.interestRate, debt.minimumPayment);
                
                return (
                  <div 
                    key={debt.id}
                    className={`p-4 border rounded-lg ${index === 0 ? 'border-[#0F392B] bg-[#0F392B]/5' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-[#0F392B] text-white' : 'bg-muted'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{debt.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {debt.interestRate}% APR • {formatCurrency(debt.minimumPayment)}/mo minimum
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(debt.balance)}</p>
                        <p className="text-sm text-muted-foreground">
                          Payoff: {Math.ceil(payoff.months / 12)} years
                        </p>
                      </div>
                    </div>
                    {index === 0 && (
                      <Badge className="mt-2 bg-[#D4AF37]">
                        <Target className="h-3 w-3 mr-1" />
                        Focus debt - gets extra payments
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Strategy Comparison */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calculator className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">Payoff Strategy Explained</p>
                <div className="text-sm text-blue-700 mt-2 space-y-2">
                  <p>
                    <strong>Avalanche Method:</strong> Pay highest interest rate first. 
                    Mathematically optimal - saves the most money in interest.
                  </p>
                  <p>
                    <strong>Snowball Method:</strong> Pay smallest balance first. 
                    Creates quick wins for motivation, slightly more interest paid overall.
                  </p>
                  <p className="pt-2 border-t border-blue-200">
                    With {formatCurrency(extraBudget)}/month extra, you'll be debt-free in{' '}
                    <strong>{Math.ceil(result.months / 12)} years</strong> and pay{' '}
                    <strong>{formatCurrency(result.totalInterest)}</strong> in total interest.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DebtPaydownPlanner;
