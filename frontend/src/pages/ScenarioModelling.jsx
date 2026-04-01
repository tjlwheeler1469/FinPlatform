import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Building2, TrendingUp, LineChart, DollarSign, Calculator,
  ArrowUpRight, ArrowDownRight, Home, PiggyBank, Target,
  CheckCircle2, Loader2, Sparkles, Plus, Trash2, Bitcoin,
  Coins, BarChart3, Wallet, RefreshCw, ChevronRight, Eye, Edit2, X
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useXplanSync } from "@/components/XplanSyncNotification";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(value);
};

// Existing assets (would come from API in production)
const EXISTING_ASSETS = {
  stocks: [
    { id: "stk1", name: "BHP Group", symbol: "BHP", value: 45000, shares: 1000, costBase: 38000 },
    { id: "stk2", name: "Commonwealth Bank", symbol: "CBA", value: 62000, shares: 500, costBase: 48000 },
    { id: "stk3", name: "CSL Limited", symbol: "CSL", value: 35000, shares: 120, costBase: 30000 },
  ],
  etfs: [
    { id: "etf1", name: "Vanguard Aus Shares", symbol: "VAS", value: 85000, units: 950, costBase: 72000 },
    { id: "etf2", name: "iShares S&P 500", symbol: "IVV", value: 55000, units: 100, costBase: 45000 },
  ],
  funds: [
    { id: "fund1", name: "Magellan Global Fund", value: 75000, units: 45000, costBase: 65000 },
    { id: "fund2", name: "Platinum International", value: 42000, units: 28000, costBase: 38000 },
  ],
  bonds: [
    { id: "bond1", name: "Aus Gov 10Y Bond", value: 50000, maturity: "2034", yield: 4.2 },
    { id: "bond2", name: "Corporate Bond Fund", value: 30000, maturity: "2028", yield: 5.1 },
  ],
  property: [
    { id: "prop1", name: "Investment Property - Sydney", value: 850000, debt: 450000, rental: 3200 },
    { id: "prop2", name: "Primary Residence", value: 1200000, debt: 380000, rental: 0 },
  ],
  crypto: [
    { id: "crypto1", name: "Bitcoin", symbol: "BTC", value: 28000, units: 0.38, costBase: 18000 },
    { id: "crypto2", name: "Ethereum", symbol: "ETH", value: 12000, units: 4.2, costBase: 8000 },
  ],
  cash: [
    { id: "cash1", name: "High Interest Savings", value: 45000, rate: 5.0 },
    { id: "cash2", name: "Term Deposit 12M", value: 100000, rate: 4.8, maturity: "Dec 2026" },
  ]
};

// Goals data
const MOCK_GOALS = [
  { id: "g1", name: "Retirement Fund", target: 2000000, current: 1450000, deadline: "2035", category: "retirement", priority: "high" },
  { id: "g2", name: "Investment Property", target: 200000, current: 85000, deadline: "2027", category: "property", priority: "high" },
  { id: "g3", name: "Children's Education", target: 150000, current: 42000, deadline: "2030", category: "education", priority: "medium" },
  { id: "g4", name: "Emergency Fund", target: 50000, current: 45000, deadline: "2025", category: "savings", priority: "high" },
];

const ASSET_TYPES = [
  { id: "stocks", label: "Stocks", icon: TrendingUp, color: "#3B82F6", returnRange: [6, 12] },
  { id: "etfs", label: "ETFs", icon: BarChart3, color: "#10B981", returnRange: [5, 10] },
  { id: "funds", label: "Managed Funds", icon: LineChart, color: "#8B5CF6", returnRange: [5, 9] },
  { id: "bonds", label: "Bonds", icon: Wallet, color: "#F59E0B", returnRange: [3, 6] },
  { id: "property", label: "Property", icon: Building2, color: "#EF4444", returnRange: [4, 8] },
  { id: "crypto", label: "Crypto", icon: Bitcoin, color: "#F97316", returnRange: [-10, 30] },
  { id: "cash", label: "Cash & TDs", icon: PiggyBank, color: "#6B7280", returnRange: [3, 5] },
];

const ScenarioModelling = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState("goals");
  const [goals, setGoals] = useState(MOCK_GOALS);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const { triggerSync } = useXplanSync();
  
  // Goal CRUD state
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({
    name: "",
    target: 100000,
    current: 0,
    deadline: "2030",
    category: "savings",
    priority: "medium"
  });
  
  // Scenario state
  const [scenarioName, setScenarioName] = useState("My Scenario");
  const [timeframe, setTimeframe] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [includeExisting, setIncludeExisting] = useState({
    stocks: false, etfs: false, funds: false, bonds: false, 
    property: false, crypto: false, cash: false
  });
  const [selectedExistingAssets, setSelectedExistingAssets] = useState([]);
  const [projectionData, setProjectionData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [scenarioMode, setScenarioMode] = useState("conservative"); // conservative, moderate, aggressive

  // Calculate total existing assets value
  const totalExistingValue = Object.entries(includeExisting)
    .filter(([_, included]) => included)
    .reduce((sum, [type]) => {
      return sum + EXISTING_ASSETS[type].reduce((s, a) => s + a.value, 0);
    }, 0);

  // Calculate total new investment
  const totalNewInvestment = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  // Add new transaction
  const addTransaction = (type = "stocks") => {
    const assetType = ASSET_TYPES.find(a => a.id === type);
    setTransactions([...transactions, {
      id: Date.now(),
      type,
      name: "",
      amount: 50000,
      expectedReturn: assetType ? (assetType.returnRange[0] + assetType.returnRange[1]) / 2 : 7,
      frequency: "lump_sum",
      monthlyContribution: 0
    }]);
  };

  // Remove transaction
  const removeTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Update transaction
  const updateTransaction = (id, field, value) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  // Toggle existing asset inclusion
  const toggleExistingAsset = (type) => {
    setIncludeExisting(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Goal CRUD functions
  const openAddGoal = () => {
    setEditingGoal(null);
    setGoalForm({
      name: "",
      target: 100000,
      current: 0,
      deadline: "2030",
      category: "savings",
      priority: "medium"
    });
    setGoalDialogOpen(true);
  };

  const openEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      name: goal.name,
      target: goal.target,
      current: goal.current,
      deadline: goal.deadline,
      category: goal.category,
      priority: goal.priority
    });
    setGoalDialogOpen(true);
  };

  const saveGoal = () => {
    if (!goalForm.name.trim()) {
      toast.error("Please enter a goal name");
      return;
    }
    if (goalForm.target <= 0) {
      toast.error("Target amount must be greater than 0");
      return;
    }

    if (editingGoal) {
      // Update existing goal
      setGoals(goals.map(g => 
        g.id === editingGoal.id 
          ? { ...g, ...goalForm }
          : g
      ));
      toast.success("Goal updated successfully!");
      // Trigger Xplan sync for goal update
      triggerSync("strategy", {
        description: `Updated goal: ${goalForm.name}`,
        goalData: goalForm
      });
    } else {
      // Add new goal
      const newGoal = {
        id: `g${Date.now()}`,
        ...goalForm
      };
      setGoals([...goals, newGoal]);
      toast.success("Goal added successfully!");
      // Trigger Xplan sync for new goal
      triggerSync("strategy", {
        description: `Created new goal: ${goalForm.name}`,
        goalData: newGoal
      });
    }
    setGoalDialogOpen(false);
    setEditingGoal(null);
  };

  const deleteGoal = (goalId) => {
    const goalToDelete = goals.find(g => g.id === goalId);
    setGoals(goals.filter(g => g.id !== goalId));
    if (selectedGoal?.id === goalId) {
      setSelectedGoal(null);
    }
    toast.success("Goal deleted");
  };

  // Calculate projections
  const calculateProjections = () => {
    setIsCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      const years = Array.from({ length: timeframe + 1 }, (_, i) => i);
      const returnMultipliers = {
        conservative: 0.7,
        moderate: 1.0,
        aggressive: 1.3
      };

      const data = years.map(year => {
        let conservativeValue = totalExistingValue;
        let moderateValue = totalExistingValue;
        let aggressiveValue = totalExistingValue;

        // Add existing assets growth
        Object.entries(includeExisting).forEach(([type, included]) => {
          if (included) {
            const assetType = ASSET_TYPES.find(a => a.id === type);
            const baseReturn = assetType ? (assetType.returnRange[0] + assetType.returnRange[1]) / 2 / 100 : 0.06;
            const existingTotal = EXISTING_ASSETS[type].reduce((s, a) => s + a.value, 0);
            
            conservativeValue += existingTotal * Math.pow(1 + baseReturn * 0.7, year) - existingTotal;
            moderateValue += existingTotal * Math.pow(1 + baseReturn, year) - existingTotal;
            aggressiveValue += existingTotal * Math.pow(1 + baseReturn * 1.3, year) - existingTotal;
          }
        });

        // Add new investments growth
        transactions.forEach(t => {
          const amount = parseFloat(t.amount) || 0;
          const returnRate = (parseFloat(t.expectedReturn) || 7) / 100;
          
          if (t.frequency === "lump_sum") {
            conservativeValue += amount * Math.pow(1 + returnRate * 0.7, year);
            moderateValue += amount * Math.pow(1 + returnRate, year);
            aggressiveValue += amount * Math.pow(1 + returnRate * 1.3, year);
          } else {
            // Monthly contributions with compound growth
            const monthly = parseFloat(t.monthlyContribution) || 0;
            const months = year * 12;
            const monthlyRate = returnRate / 12;
            
            // Future value of annuity formula
            const fvAnnuity = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
            conservativeValue += amount + fvAnnuity * 0.7;
            moderateValue += amount + fvAnnuity;
            aggressiveValue += amount + fvAnnuity * 1.3;
          }
        });

        return {
          year,
          conservative: Math.round(conservativeValue),
          moderate: Math.round(moderateValue),
          aggressive: Math.round(aggressiveValue)
        };
      });

      setProjectionData(data);
      setIsCalculating(false);
      toast.success("Projection calculated!");
    }, 800);
  };

  // Goal progress component
  const GoalCard = ({ goal }) => {
    const progress = (goal.current / goal.target) * 100;
    const yearsToDeadline = new Date(goal.deadline).getFullYear() - new Date().getFullYear();
    const monthlyRequired = yearsToDeadline > 0 ? (goal.target - goal.current) / (yearsToDeadline * 12) : 0;

    return (
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md bg-card ${selectedGoal?.id === goal.id ? 'ring-2 ring-[#D4A84C]' : ''}`}
        onClick={() => setSelectedGoal(goal)}
        data-testid={`goal-card-${goal.id}`}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{goal.name}</h3>
              <p className="text-sm text-muted-foreground">Target: {formatCurrency(goal.target)}</p>
            </div>
            <div className="flex items-center gap-1">
              <Badge 
                variant={goal.priority === "high" ? "default" : "secondary"} 
                className={goal.priority === "high" ? "bg-[#D4A84C] text-black font-semibold" : "bg-slate-600 text-white font-semibold"}
              >
                {goal.priority}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditGoal(goal);
                }}
                data-testid={`edit-goal-${goal.id}`}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteGoal(goal.id);
                }}
                data-testid={`delete-goal-${goal.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground">{formatCurrency(goal.current)} ({progress.toFixed(0)}%)</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Deadline: {goal.deadline}</span>
              <span>Need: {formatCurrency(monthlyRequired)}/mo</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Asset type selector
  const AssetTypeCard = ({ type, included, onToggle }) => {
    const Icon = type.icon;
    const assets = EXISTING_ASSETS[type.id];
    const totalValue = assets.reduce((s, a) => s + a.value, 0);

    return (
      <Card className={`cursor-pointer transition-all ${included ? 'ring-2 ring-[#D4A84C] bg-[#D4A84C]/10' : 'bg-card hover:bg-muted/50'}`} onClick={onToggle}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${type.color}20` }}>
                <Icon className="h-4 w-4" style={{ color: type.color }} />
              </div>
              <span className="font-medium text-foreground">{type.label}</span>
            </div>
            <Switch checked={included} />
          </div>
          <div className="text-sm text-muted-foreground">
            {assets.length} holdings • {formatCurrency(totalValue)}
          </div>
        </CardContent>
      </Card>
    );
  };

  const content = (
    <>
      <div className="space-y-6" data-testid="scenario-modelling-page">
        {/* Header Stats - Clean Card Design like FamilyWealthDashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#D4A84C]/10 border-[#D4A84C]/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Goals</p>
              <p className="text-2xl font-bold text-[#D4A84C]">{goals.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Existing Assets</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalExistingValue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">New Investment</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalNewInvestment)}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Scenario</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalExistingValue + totalNewInvestment)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="existing">Assets</TabsTrigger>
            <TabsTrigger value="scenario">Scenario</TabsTrigger>
            <TabsTrigger value="projection">Projection</TabsTrigger>
          </TabsList>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground">Your Financial Goals</h2>
              <Button 
                className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                onClick={openAddGoal}
                data-testid="add-goal-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
            {selectedGoal && (
              <Card className="bg-card border-[#D4A84C]/30">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#D4A84C]" />
                    Model This Goal
                  </CardTitle>
                  <CardDescription>Create a scenario to achieve "{selectedGoal.name}"</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button 
                      className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                      onClick={() => {
                        const gap = selectedGoal.target - selectedGoal.current;
                        addTransaction("stocks");
                        updateTransaction(transactions[transactions.length - 1]?.id || Date.now(), "amount", gap);
                        setActiveTab("scenario");
                      }}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Create Scenario
                    </Button>
                    <Button variant="outline">
                      View History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Existing Assets Tab */}
          <TabsContent value="existing" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Include Existing Assets</h2>
                <p className="text-sm text-muted-foreground">Select which assets to include in your scenario projection</p>
              </div>
              <Badge variant="outline" className="text-lg py-1 px-3">
                Selected: {formatCurrency(totalExistingValue)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ASSET_TYPES.map(type => (
                <AssetTypeCard 
                  key={type.id} 
                  type={type} 
                  included={includeExisting[type.id]}
                  onToggle={() => toggleExistingAsset(type.id)}
                />
              ))}
            </div>

            {/* Show selected assets details */}
            {Object.entries(includeExisting).some(([_, v]) => v) && (
              <Card className="bg-card border">
                <CardHeader>
                  <CardTitle className="text-foreground text-base">Selected Assets Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {Object.entries(includeExisting)
                        .filter(([_, included]) => included)
                        .map(([type]) => (
                          <div key={type} className="space-y-2">
                            <h4 className="font-medium text-[#D4A84C] capitalize">{type}</h4>
                            <div className="grid gap-2">
                              {EXISTING_ASSETS[type].map(asset => (
                                <div key={asset.id} className="flex justify-between items-center p-2 rounded bg-muted">
                                  <span className="text-foreground">{asset.name}</span>
                                  <span className="text-foreground font-medium">{formatCurrency(asset.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Build Scenario Tab */}
          <TabsContent value="scenario" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Build Your Scenario</h2>
                <p className="text-sm text-muted-foreground">Add multiple investments across asset classes</p>
              </div>
            </div>

            {/* Timeframe Selector */}
            <Card className="bg-card border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Projection Timeframe</Label>
                    <p className="text-sm text-muted-foreground">How far into the future?</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[timeframe]}
                      onValueChange={([v]) => setTimeframe(v)}
                      min={1}
                      max={30}
                      step={1}
                      className="w-48"
                    />
                    <Badge variant="outline" className="text-lg py-1 px-3 min-w-[80px] text-center">
                      {timeframe} years
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Transaction Buttons */}
            <div className="flex flex-wrap gap-2">
              {ASSET_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.id}
                    variant="outline"
                    size="sm"
                    onClick={() => addTransaction(type.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" style={{ color: type.color }} />
                    Add {type.label}
                  </Button>
                );
              })}
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <Card className="bg-card border-dashed">
                  <CardContent className="p-8 text-center">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No investments added yet</p>
                    <p className="text-sm text-muted-foreground">Click the buttons above to add investments to your scenario</p>
                  </CardContent>
                </Card>
              ) : (
                transactions.map((transaction, idx) => {
                  const assetType = ASSET_TYPES.find(a => a.id === transaction.type);
                  const Icon = assetType?.icon || TrendingUp;
                  
                  return (
                    <Card key={transaction.id} className="bg-card border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${assetType?.color || '#3B82F6'}20` }}>
                            <Icon className="h-5 w-5" style={{ color: assetType?.color || '#3B82F6' }} />
                          </div>
                          
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-muted-foreground text-xs">Asset Name</Label>
                              <Input
                                value={transaction.name}
                                onChange={(e) => updateTransaction(transaction.id, "name", e.target.value)}
                                placeholder={`New ${assetType?.label || 'Investment'}`}
                              />
                            </div>
                            
                            <div>
                              <Label className="text-muted-foreground text-xs">Investment Amount</Label>
                              <Input
                                type="number"
                                value={transaction.amount}
                                onChange={(e) => updateTransaction(transaction.id, "amount", e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label className="text-muted-foreground text-xs">Expected Return (%)</Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[transaction.expectedReturn]}
                                  onValueChange={([v]) => updateTransaction(transaction.id, "expectedReturn", v)}
                                  min={assetType?.returnRange[0] || -10}
                                  max={assetType?.returnRange[1] || 30}
                                  step={0.5}
                                  className="flex-1"
                                />
                                <span className="text-foreground text-sm w-12">{transaction.expectedReturn}%</span>
                              </div>
                            </div>

                            <div>
                              <Label className="text-muted-foreground text-xs">Contribution</Label>
                              <Select 
                                value={transaction.frequency}
                                onValueChange={(v) => updateTransaction(transaction.id, "frequency", v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lump_sum">Lump Sum</SelectItem>
                                  <SelectItem value="monthly">+ Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTransaction(transaction.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {transaction.frequency === "monthly" && (
                          <div className="mt-3 ml-12">
                            <Label className="text-muted-foreground text-xs">Monthly Contribution</Label>
                            <Input
                              type="number"
                              value={transaction.monthlyContribution}
                              onChange={(e) => updateTransaction(transaction.id, "monthlyContribution", e.target.value)}
                              placeholder="0"
                              className="w-48"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Calculate Button */}
            {(transactions.length > 0 || totalExistingValue > 0) && (
              <div className="flex justify-end">
                <Button 
                  className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black px-8"
                  onClick={() => {
                    calculateProjections();
                    setActiveTab("projection");
                  }}
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Calculate Projection
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Projection Tab */}
          <TabsContent value="projection" className="space-y-4">
            {!projectionData ? (
              <Card className="bg-card border">
                <CardContent className="p-12 text-center">
                  <LineChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Projection Yet</h3>
                  <p className="text-muted-foreground mb-4">Add assets and investments to see your projection</p>
                  <Button 
                    className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                    onClick={() => setActiveTab("scenario")}
                  >
                    Build Scenario
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-muted/50 border">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Conservative (5-7%)</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(projectionData[projectionData.length - 1]?.conservative || 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-blue-700 mb-1">Moderate (7-10%)</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatCurrency(projectionData[projectionData.length - 1]?.moderate || 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-emerald-700 mb-1">Aggressive (10-15%)</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {formatCurrency(projectionData[projectionData.length - 1]?.aggressive || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart */}
                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#D4A84C]" />
                      {timeframe}-Year Projection
                    </CardTitle>
                    <CardDescription>
                      Starting: {formatCurrency(totalExistingValue + totalNewInvestment)} • 
                      Includes {Object.entries(includeExisting).filter(([_, v]) => v).length} existing asset types • 
                      {transactions.length} new investments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={projectionData}>
                          <defs>
                            <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6B7280" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6B7280" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorModerate" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAggressive" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="year" 
                            stroke="#6b7280"
                            tickFormatter={(v) => `Year ${v}`}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            tickFormatter={(v) => formatCurrency(v)}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                            labelStyle={{ color: '#1f2937' }}
                            formatter={(value) => formatCurrency(value)}
                            labelFormatter={(label) => `Year ${label}`}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="conservative"
                            name="Conservative"
                            stroke="#6B7280"
                            fill="url(#colorConservative)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="moderate"
                            name="Moderate"
                            stroke="#3B82F6"
                            fill="url(#colorModerate)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="aggressive"
                            name="Aggressive"
                            stroke="#10B981"
                            fill="url(#colorAggressive)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("scenario")}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Modify Scenario
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      Save Scenario
                    </Button>
                    <Button className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Execute Plan
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Goal Add/Edit Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Update your financial goal details.' : 'Create a new financial goal to track your progress.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="goal-name">Goal Name</Label>
              <Input
                id="goal-name"
                value={goalForm.name}
                onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                placeholder="e.g., Retirement Fund, House Deposit"
                data-testid="goal-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="goal-target">Target Amount ($)</Label>
                <Input
                  id="goal-target"
                  type="number"
                  value={goalForm.target}
                  onChange={(e) => setGoalForm({ ...goalForm, target: parseFloat(e.target.value) || 0 })}
                  data-testid="goal-target-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal-current">Current Amount ($)</Label>
                <Input
                  id="goal-current"
                  type="number"
                  value={goalForm.current}
                  onChange={(e) => setGoalForm({ ...goalForm, current: parseFloat(e.target.value) || 0 })}
                  data-testid="goal-current-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="goal-deadline">Target Year</Label>
                <Select 
                  value={goalForm.deadline} 
                  onValueChange={(v) => setGoalForm({ ...goalForm, deadline: v })}
                >
                  <SelectTrigger data-testid="goal-deadline-select">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal-priority">Priority</Label>
                <Select 
                  value={goalForm.priority} 
                  onValueChange={(v) => setGoalForm({ ...goalForm, priority: v })}
                >
                  <SelectTrigger data-testid="goal-priority-select">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-category">Category</Label>
              <Select 
                value={goalForm.category} 
                onValueChange={(v) => setGoalForm({ ...goalForm, category: v })}
              >
                <SelectTrigger data-testid="goal-category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retirement">Retirement</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
              onClick={saveGoal}
              data-testid="save-goal-btn"
            >
              {editingGoal ? 'Update Goal' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return embedded ? content : <Layout title="Scenario Modelling" subtitle="Goals, Strategy & What-If Analysis">{content}</Layout>;
};

export default ScenarioModelling;
