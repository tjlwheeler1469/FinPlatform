import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  DollarSign, TrendingUp, TrendingDown, Target, PiggyBank, Wallet, Calendar,
  CheckCircle2, AlertTriangle, Clock, Plus, RefreshCw, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, FileText, Shield, Home, Car, CreditCard,
  ShoppingCart, Film, Utensils, Phone, Heart, Briefcase, GraduationCap
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORY_ICONS = {
  housing: Home,
  utilities: Phone,
  groceries: ShoppingCart,
  transport: Car,
  insurance: Shield,
  healthcare: Heart,
  education: GraduationCap,
  entertainment: Film,
  dining: Utensils,
  shopping: ShoppingCart,
  subscriptions: Phone,
  personal: Briefcase,
  savings: PiggyBank,
  debt_repayment: CreditCard,
  investments: TrendingUp,
  superannuation: Wallet,
  other: DollarSign
};

export default function ClientFinancialDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState('DEMO-001');
  
  // Budget data
  const [budget, setBudget] = useState(null);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [spendingAnalysis, setSpendingAnalysis] = useState(null);
  
  // Milestones
  const [milestones, setMilestones] = useState([]);
  const [readiness, setReadiness] = useState(null);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load budget and demo data
      const [budgetRes, analysisRes, milestonesRes] = await Promise.all([
        fetch(`${API_URL}/api/budget/client/${clientId}`).then(r => r.json()),
        fetch(`${API_URL}/api/budget/client/${clientId}/spending-analysis?months=3`).then(r => r.json()),
        fetch(`${API_URL}/api/milestones/client/${clientId}`).then(r => r.json())
      ]);
      
      if (budgetRes.message) {
        // No budget found, use demo data
        const demoRes = await fetch(`${API_URL}/api/budget/demo/sample`).then(r => r.json());
        setBudget(demoRes);
        // Calculate summary from demo data
        calculateDemoSummary(demoRes);
      } else {
        setBudget(budgetRes);
        setBudgetSummary(budgetRes.summary);
      }
      
      setSpendingAnalysis(analysisRes);
      setMilestones(milestonesRes.milestones || []);
      
      // Get readiness if milestones exist
      if (milestonesRes.milestones?.length > 0) {
        const readinessRes = await fetch(`${API_URL}/api/milestones/client/${clientId}/retirement-readiness`).then(r => r.json());
        setReadiness(readinessRes);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const calculateDemoSummary = (demoData) => {
    const freqMultiplier = {
      weekly: 52/12, fortnightly: 26/12, monthly: 1, quarterly: 1/3, annual: 1/12
    };
    
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    const incomeByCategory = {};
    const expensesByCategory = {};
    
    for (const inc of demoData.incomes || []) {
      const monthly = inc.amount * (freqMultiplier[inc.frequency] || 1);
      monthlyIncome += monthly;
      incomeByCategory[inc.category] = (incomeByCategory[inc.category] || 0) + monthly;
    }
    
    for (const exp of demoData.expenses || []) {
      const monthly = exp.amount * (freqMultiplier[exp.frequency] || 1);
      monthlyExpenses += monthly;
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + monthly;
    }
    
    const goalContributions = (demoData.goals || []).reduce((sum, g) => sum + (g.monthly_contribution || 0), 0);
    
    setBudgetSummary({
      monthly_income: monthlyIncome,
      annual_income: monthlyIncome * 12,
      monthly_expenses: monthlyExpenses,
      annual_expenses: monthlyExpenses * 12,
      goal_contributions: goalContributions,
      monthly_surplus: monthlyIncome - monthlyExpenses - goalContributions,
      savings_rate: ((monthlyIncome - monthlyExpenses - goalContributions) / monthlyIncome * 100),
      income_by_category: incomeByCategory,
      expenses_by_category: expensesByCategory
    });
  };

  const formatCurrency = (value) => `AUD $${(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const formatPercent = (value) => `${(value || 0).toFixed(1)}%`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': case 'on_track': case 'achieved': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'at_risk': case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      on_track: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      at_risk: 'bg-red-100 text-red-800',
      overdue: 'bg-red-100 text-red-800',
      not_started: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colors[status] || colors.not_started}>{status?.replace('_', ' ')}</Badge>;
  };

  const getCategoryIcon = (category) => {
    const IconComponent = CATEGORY_ICONS[category] || DollarSign;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <Layout>
      <div className="space-y-6 p-6" data-testid="client-financial-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              Financial Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Budget, expenses, goals, and retirement planning
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEMO-001">Demo Client</SelectItem>
                <SelectItem value="CLIENT-001">John Smith</SelectItem>
                <SelectItem value="CLIENT-002">Sarah Wilson</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-green-500" /> Monthly Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(budgetSummary?.monthly_income)}
              </div>
              <p className="text-xs text-muted-foreground">{formatCurrency(budgetSummary?.annual_income)} / year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-red-500" /> Monthly Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(budgetSummary?.monthly_expenses)}
              </div>
              <p className="text-xs text-muted-foreground">{formatCurrency(budgetSummary?.annual_expenses)} / year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-blue-500" /> Monthly Surplus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(budgetSummary?.monthly_surplus || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(budgetSummary?.monthly_surplus)}
              </div>
              <p className="text-xs text-muted-foreground">
                Savings rate: {formatPercent(budgetSummary?.savings_rate)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" /> Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(budget?.goals || []).filter(g => g.status === 'achieved' || g.status === 'completed').length} / {(budget?.goals || []).length}
              </div>
              <p className="text-xs text-muted-foreground">Goals achieved</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        {budget?.active_alerts?.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Budget Alerts</AlertTitle>
            <AlertDescription>
              {budget.active_alerts.map((alert, i) => (
                <div key={`item-${i}`} className="text-sm">{alert.message}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="overview-tab">
              <BarChart3 className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="budget" data-testid="budget-tab">
              <Wallet className="h-4 w-4 mr-2" /> Budget
            </TabsTrigger>
            <TabsTrigger value="expenses" data-testid="expenses-tab">
              <CreditCard className="h-4 w-4 mr-2" /> Expenses
            </TabsTrigger>
            <TabsTrigger value="goals" data-testid="goals-tab">
              <Target className="h-4 w-4 mr-2" /> Goals
            </TabsTrigger>
            <TabsTrigger value="milestones" data-testid="milestones-tab">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Milestones
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Income Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-green-500" /> Income Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(budget?.incomes || []).map((inc, i) => (
                      <div key={`item-${i}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium">{inc.source}</p>
                          <p className="text-sm text-muted-foreground">{inc.category} • {inc.frequency}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(inc.amount)}</p>
                          <p className="text-xs text-muted-foreground">/{inc.frequency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Expense Breakdown by Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-red-500" /> Expenses by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {Object.entries(budgetSummary?.expenses_by_category || {})
                        .sort(([,a], [,b]) => b - a)
                        .map(([category, amount]) => {
                          const percentage = (amount / (budgetSummary?.monthly_expenses || 1)) * 100;
                          return (
                            <div key={category} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getCategoryIcon(category)}
                                  <span className="text-sm font-medium capitalize">{category.replace('_', ' ')}</span>
                                </div>
                                <span className="text-sm font-bold">{formatCurrency(amount)}</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                              <p className="text-xs text-muted-foreground text-right">{percentage.toFixed(1)}%</p>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Income Items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Income</CardTitle>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {formatCurrency(budgetSummary?.monthly_income)} / month
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(budget?.incomes || []).map((inc, i) => (
                        <TableRow key={`item-${i}`}>
                          <TableCell className="font-medium">{inc.source}</TableCell>
                          <TableCell><Badge variant="outline">{inc.category}</Badge></TableCell>
                          <TableCell>{inc.frequency}</TableCell>
                          <TableCell className="text-right text-green-600 font-bold">{formatCurrency(inc.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Expense Items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Expenses</CardTitle>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {formatCurrency(budgetSummary?.monthly_expenses)} / month
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(budget?.expenses || []).map((exp, i) => (
                          <TableRow key={`item-${i}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {exp.is_essential && <Badge className="bg-blue-100 text-blue-800 text-xs">Essential</Badge>}
                                {exp.description}
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{exp.category}</Badge></TableCell>
                            <TableCell>{exp.frequency}</TableCell>
                            <TableCell className="text-right text-red-600 font-bold">{formatCurrency(exp.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Spending Analysis (Last 3 Months)</CardTitle>
                <CardDescription>Compare actual spending vs budget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(spendingAnalysis?.category_analysis || Object.entries(budgetSummary?.expenses_by_category || {})).map((item, i) => {
                    const cat = item.category || item[0];
                    const spent = item.monthly_average || item[1];
                    const budgeted = budget?.category_budgets?.[cat] || spent;
                    const percentage = (spent / budgeted) * 100;
                    
                    return (
                      <div key={`item-${i}`} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(cat)}
                            <span className="font-medium capitalize">{cat.replace('_', ' ')}</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${percentage > 100 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(spent)}
                            </span>
                            <span className="text-muted-foreground"> / {formatCurrency(budgeted)}</span>
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className={`h-2 ${percentage > 100 ? '[&>div]:bg-red-500' : percentage > 80 ? '[&>div]:bg-yellow-500' : ''}`}
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}% of budget</span>
                          {percentage > 100 && (
                            <span className="text-xs text-red-600 font-medium">Over by {formatCurrency(spent - budgeted)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(budget?.goals || []).map((goal, i) => {
                const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                
                return (
                  <Card key={`item-${i}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        {getStatusBadge(goal.status)}
                      </div>
                      {goal.description && (
                        <CardDescription>{goal.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{formatCurrency(goal.current_amount)}</span>
                            <span className="text-muted-foreground">{formatCurrency(goal.target_amount)}</span>
                          </div>
                          <Progress value={progress} className="h-3" />
                          <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(1)}% complete</p>
                        </div>
                        
                        {goal.monthly_contribution > 0 && (
                          <div className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                            <span>Monthly contribution:</span>
                            <span className="font-bold">{formatCurrency(goal.monthly_contribution)}</span>
                          </div>
                        )}
                        
                        {goal.target_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Target: {new Date(goal.target_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {(budget?.goals || []).length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No goals set yet</p>
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" /> Add Goal
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            {readiness && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Retirement Readiness Score</span>
                    <Badge className={`text-lg px-4 py-1 ${
                      readiness.readiness_level === 'excellent' ? 'bg-green-500' :
                      readiness.readiness_level === 'good' ? 'bg-blue-500' :
                      readiness.readiness_level === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {readiness.overall_readiness_score}%
                    </Badge>
                  </CardTitle>
                  <CardDescription>{readiness.readiness_message}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(readiness.category_scores || {}).map(([cat, data]) => (
                      <div key={cat} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{cat.replace('_', ' ')}</span>
                          <span className="text-sm font-bold">{data.score}%</span>
                        </div>
                        <Progress value={data.score} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{data.milestone_count} milestones</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Retirement Milestones</CardTitle>
                <CardDescription>Key targets for your ideal retirement</CardDescription>
              </CardHeader>
              <CardContent>
                {milestones.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {milestones.map((m, i) => (
                        <div key={`item-${i}`} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(m.status)}`} />
                              <span className="font-medium">{m.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{m.category}</Badge>
                              {getStatusBadge(m.status)}
                            </div>
                          </div>
                          {m.description && (
                            <p className="text-sm text-muted-foreground mb-2">{m.description}</p>
                          )}
                          {m.target_value > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{formatCurrency(m.current_value || 0)}</span>
                                <span className="text-muted-foreground">{formatCurrency(m.target_value)}</span>
                              </div>
                              <Progress value={m.progress_percentage || 0} className="h-2" />
                            </div>
                          )}
                          {m.target_date && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Target: {new Date(m.target_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No milestones initialized yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Use the adviser dashboard to set up retirement milestones
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
