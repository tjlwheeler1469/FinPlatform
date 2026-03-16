import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Target,
  Plus,
  TrendingUp,
  TrendingDown,
  Home,
  GraduationCap,
  Plane,
  Car,
  Heart,
  Shield,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { usePortfolio } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const GOAL_TYPES = [
  { value: "retirement", label: "Retirement", icon: Target, color: "#1a2744" },
  { value: "house", label: "Property", icon: Home, color: "#3B82F6" },
  { value: "education", label: "Education", icon: GraduationCap, color: "#8B5CF6" },
  { value: "travel", label: "Travel", icon: Plane, color: "#EC4899" },
  { value: "car", label: "Vehicle", icon: Car, color: "#F59E0B" },
  { value: "emergency", label: "Emergency Fund", icon: Shield, color: "#10B981" },
  { value: "other", label: "Other", icon: DollarSign, color: "#6366F1" }
];

const getGoalIcon = (type) => {
  const goalType = GOAL_TYPES.find(g => g.value === type);
  return goalType ? goalType.icon : Target;
};

const getGoalColor = (type) => {
  const goalType = GOAL_TYPES.find(g => g.value === type);
  return goalType ? goalType.color : "#6366F1";
};

const getProgressColor = (progress) => {
  if (progress >= 80) return "bg-green-500";
  if (progress >= 50) return "bg-blue-500";
  if (progress >= 25) return "bg-yellow-500";
  return "bg-red-500";
};

const GoalTracker = () => {
  const { portfolio } = usePortfolio();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    goal_type: "other",
    target_amount: 100000,
    current_amount: 0,
    monthly_contribution: 500,
    priority: "medium"
  });

  // Fetch goals
  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/goals/?household_id=hh_001`);
        setGoals(res.data.goals || []);
      } catch (error) {
        console.error("Error fetching goals:", error);
        toast.error("Failed to load goals");
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  // Add goal
  const handleAddGoal = async () => {
    if (!newGoal.name) {
      toast.error("Please enter a goal name");
      return;
    }
    try {
      await axios.post(`${API}/goals/`, {
        household_id: "hh_001",
        ...newGoal
      });
      toast.success("Goal created");
      setNewGoalOpen(false);
      setNewGoal({
        name: "",
        goal_type: "other",
        target_amount: 100000,
        current_amount: 0,
        monthly_contribution: 500,
        priority: "medium"
      });
      // Refresh goals
      const res = await axios.get(`${API}/goals/?household_id=hh_001`);
      setGoals(res.data.goals || []);
    } catch (error) {
      toast.error("Failed to create goal");
    }
  };

  // Calculate summary
  const totalTarget = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
  const totalCurrent = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  const goalsOnTrack = goals.filter(g => (g.progress_percent || g.progress || 0) >= 50).length;

  // Chart data
  const chartData = goals.map(g => ({
    name: g.name.length > 15 ? g.name.substring(0, 15) + '...' : g.name,
    progress: g.progress_percent || g.progress || 0,
    target: g.target_amount || 0,
    current: g.current_amount || 0,
    color: getGoalColor(g.goal_type || g.category || 'other')
  }));

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-[#1a2744]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="goal-tracker-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground flex items-center gap-3">
              <Target className="h-8 w-8 text-[#D4A84C]" />
              Goal Tracker
            </h1>
            <p className="text-muted-foreground mt-1">
              Track progress towards your financial goals
            </p>
          </div>
          <Dialog open={newGoalOpen} onOpenChange={setNewGoalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a2744]" data-testid="new-goal-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Goal Name</Label>
                  <Input 
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                    placeholder="e.g., Retirement Fund"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Goal Type</Label>
                  <Select value={newGoal.goal_type} onValueChange={(v) => setNewGoal({...newGoal, goal_type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" style={{ color: type.color }} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Amount</Label>
                    <Input 
                      type="number"
                      value={newGoal.target_amount}
                      onChange={(e) => setNewGoal({...newGoal, target_amount: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Amount</Label>
                    <Input 
                      type="number"
                      value={newGoal.current_amount}
                      onChange={(e) => setNewGoal({...newGoal, current_amount: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly Contribution</Label>
                    <Input 
                      type="number"
                      value={newGoal.monthly_contribution}
                      onChange={(e) => setNewGoal({...newGoal, monthly_contribution: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newGoal.priority} onValueChange={(v) => setNewGoal({...newGoal, priority: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewGoalOpen(false)}>Cancel</Button>
                <Button onClick={handleAddGoal} className="bg-[#1a2744]">Create Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Goals</p>
                  <p className="text-2xl font-bold">{goals.length}</p>
                </div>
                <Target className="h-8 w-8 text-[#1a2744]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Target</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalTarget)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-[#D4A84C]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Progress</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalCurrent)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Goals On Track</p>
                  <p className="text-2xl font-bold">{goalsOnTrack} / {goals.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Progress</CardTitle>
            <CardDescription>Combined progress across all goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-2">
              <Progress value={overallProgress} className="flex-1 h-4" />
              <span className="text-2xl font-bold">{overallProgress.toFixed(1)}%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(totalCurrent)} of {formatCurrency(totalTarget)} saved
            </p>
          </CardContent>
        </Card>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            // Handle both goal_type and category field names
            const goalType = goal.goal_type || goal.category || 'other';
            const progressPercent = goal.progress_percent || goal.progress || 0;
            const Icon = getGoalIcon(goalType);
            const color = getGoalColor(goalType);
            const isOnTrack = progressPercent >= 50;
            
            return (
              <Card key={goal.id || goal.goal_id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: color }} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        <CardDescription>{goalType.replace('_', ' ')}</CardDescription>
                      </div>
                    </div>
                    <Badge className={isOnTrack ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {isOnTrack ? 'On Track' : 'Needs Attention'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{progressPercent.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={progressPercent} 
                        className={`h-3 ${getProgressColor(progressPercent)}`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current</p>
                        <p className="text-xl font-bold" style={{ color }}>{formatCurrency(goal.current_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target</p>
                        <p className="text-xl font-bold">{formatCurrency(goal.target_amount)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        {goal.monthly_contribution && (
                          <>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatCurrency(goal.monthly_contribution)}/month
                            </span>
                          </>
                        )}
                        {goal.target_date && (
                          <>
                            <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
                            <span className="text-sm">
                              Target: {new Date(goal.target_date).toLocaleDateString('en-AU', {month: 'short', year: 'numeric'})}
                            </span>
                          </>
                        )}
                      </div>
                      <Badge 
                        variant="outline"
                        className={goal.priority === 'high' ? 'border-red-500 text-red-500' : 
                          goal.priority === 'medium' ? 'border-yellow-500 text-yellow-500' : 
                          'border-blue-500 text-blue-500'}
                      >
                        {goal.priority} priority
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Goal Progress Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'progress' ? `${value.toFixed(1)}%` : formatCurrency(value),
                      name === 'progress' ? 'Progress' : name
                    ]}
                  />
                  <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">Goal Setting Tips</p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Set SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound</li>
                  <li>• Review and adjust your goals quarterly</li>
                  <li>• Prioritize high-priority goals with automatic contributions</li>
                  <li>• Celebrate milestones to stay motivated</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GoalTracker;
