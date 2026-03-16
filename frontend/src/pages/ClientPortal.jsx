import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Home,
  TrendingUp,
  Target,
  Calendar,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  FileText,
  MessageCircle,
  Sparkles,
  Shield
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return "$0";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

// Sample client data - in production this would come from API
const CLIENT_DATA = {
  name: "Wheeler Family",
  members: ["James Wheeler", "Sarah Wheeler"],
  advisor: "James Wheeler CFP®",
  lastReview: "2025-12-15",
  nextReview: "2026-03-15",
  
  // Financial Overview
  netWorth: 1978000,
  netWorthChange: 45000,
  netWorthChangePercent: 2.3,
  
  // Wealth Trajectory
  wealthHistory: [
    { month: "Jul", value: 1820000 },
    { month: "Aug", value: 1850000 },
    { month: "Sep", value: 1890000 },
    { month: "Oct", value: 1920000 },
    { month: "Nov", value: 1950000 },
    { month: "Dec", value: 1978000 }
  ],
  
  // Retirement Readiness
  retirementReadiness: {
    score: 72,
    targetAge: 65,
    currentAge: 45,
    projectedWealth: 3250000,
    monthlyIncomeAtRetirement: 12500,
    successProbability: 82
  },
  
  // Goals
  goals: [
    { name: "Emergency Fund", target: 50000, current: 35000, category: "savings", priority: "high" },
    { name: "Investment Property", target: 200000, current: 85000, category: "property", priority: "medium" },
    { name: "Kids Education", target: 150000, current: 45000, category: "education", priority: "medium" },
    { name: "Early Retirement", target: 2000000, current: 580000, category: "retirement", priority: "high" }
  ],
  
  // Upcoming Events
  upcomingEvents: [
    { date: "2026-03-15", title: "Quarterly Review Meeting", type: "meeting" },
    { date: "2026-06-30", title: "Super Contribution Deadline", type: "tax" },
    { date: "2027-02-01", title: "Child 1 High School Start", type: "life" }
  ],
  
  // Recent Activity
  recentActivity: [
    { date: "2025-12-15", action: "Portfolio Rebalanced", type: "investment" },
    { date: "2025-11-28", action: "Annual Review Completed", type: "meeting" },
    { date: "2025-11-15", action: "Insurance Coverage Updated", type: "insurance" }
  ]
};

const ClientPortal = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const overallGoalProgress = CLIENT_DATA.goals.reduce((acc, goal) => acc + goal.current, 0) / 
    CLIENT_DATA.goals.reduce((acc, goal) => acc + goal.target, 0) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" data-testid="client-portal-page">
      {/* Header */}
      <div className="bg-[#1a2744] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Welcome back</p>
              <h1 className="text-2xl font-bold">{CLIENT_DATA.name}</h1>
              <p className="text-white/70 text-sm mt-1">
                Your advisor: {CLIENT_DATA.advisor}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message Advisor
              </Button>
              <Button className="bg-[#D4A84C] text-[#1a2744] hover:bg-[#D4A84C]/90">
                <Calendar className="h-4 w-4 mr-2" />
                Book Meeting
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-white/70 text-sm">Net Worth</p>
              <p className="text-2xl font-bold">{formatCurrency(CLIENT_DATA.netWorth)}</p>
              <div className={`flex items-center text-sm mt-1 ${CLIENT_DATA.netWorthChangePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                {CLIENT_DATA.netWorthChangePercent >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{CLIENT_DATA.netWorthChangePercent}% this month</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-white/70 text-sm">Retirement Readiness</p>
              <p className="text-2xl font-bold">{CLIENT_DATA.retirementReadiness.score}/100</p>
              <p className="text-sm text-white/70 mt-1">
                {CLIENT_DATA.retirementReadiness.successProbability}% success probability
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-white/70 text-sm">Goal Progress</p>
              <p className="text-2xl font-bold">{overallGoalProgress.toFixed(0)}%</p>
              <Progress value={overallGoalProgress} className="mt-2 bg-white/20 h-2" />
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-white/70 text-sm">Next Review</p>
              <p className="text-2xl font-bold">{new Date(CLIENT_DATA.nextReview).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}</p>
              <p className="text-sm text-white/70 mt-1">
                {Math.ceil((new Date(CLIENT_DATA.nextReview) - new Date()) / (1000 * 60 * 60 * 24))} days away
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <Home className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="wealth">
              <TrendingUp className="h-4 w-4 mr-2" />
              Wealth Trajectory
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Target className="h-4 w-4 mr-2" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Wealth Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Your Wealth Trajectory</CardTitle>
                  <CardDescription>Net worth over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={CLIENT_DATA.wealthHistory}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4A84C" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#D4A84C" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#D4A84C" 
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Retirement Readiness */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#D4A84C]" />
                    Retirement Readiness
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="12"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke={CLIENT_DATA.retirementReadiness.score >= 70 ? "#22c55e" : CLIENT_DATA.retirementReadiness.score >= 50 ? "#eab308" : "#ef4444"}
                          strokeWidth="12"
                          strokeDasharray={`${CLIENT_DATA.retirementReadiness.score * 3.52} 352`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold">{CLIENT_DATA.retirementReadiness.score}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {CLIENT_DATA.retirementReadiness.score >= 70 ? "On Track" : CLIENT_DATA.retirementReadiness.score >= 50 ? "Needs Attention" : "At Risk"}
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target Age</span>
                      <span className="font-medium">{CLIENT_DATA.retirementReadiness.targetAge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projected Wealth</span>
                      <span className="font-medium">{formatCurrency(CLIENT_DATA.retirementReadiness.projectedWealth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Income</span>
                      <span className="font-medium">{formatCurrency(CLIENT_DATA.retirementReadiness.monthlyIncomeAtRetirement)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Goals Summary & Upcoming */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Goals */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Goals</CardTitle>
                  <CardDescription>Track your progress towards financial goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {CLIENT_DATA.goals.map((goal, index) => {
                    const progress = (goal.current / goal.target) * 100;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{goal.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progress.toFixed(0)}% complete</span>
                          <Badge variant="outline" className="text-xs">{goal.priority} priority</Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Upcoming & Activity */}
              <div className="space-y-6">
                {/* Upcoming Events */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {CLIENT_DATA.upcomingEvents.map((event, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          event.type === "meeting" ? "bg-blue-100" :
                          event.type === "tax" ? "bg-green-100" : "bg-purple-100"
                        }`}>
                          {event.type === "meeting" ? (
                            <Calendar className="h-5 w-5 text-blue-600" />
                          ) : event.type === "tax" ? (
                            <DollarSign className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {CLIENT_DATA.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div className="flex-1">
                          <p className="text-sm">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Wealth Tab */}
          <TabsContent value="wealth">
            <Card>
              <CardHeader>
                <CardTitle>Wealth Trajectory Analysis</CardTitle>
                <CardDescription>Your financial journey over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CLIENT_DATA.wealthHistory}>
                      <defs>
                        <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4A84C" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4A84C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#D4A84C" 
                        fillOpacity={1} 
                        fill="url(#colorValue2)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CLIENT_DATA.goals.map((goal, index) => {
                const progress = (goal.current / goal.target) * 100;
                return (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{goal.name}</CardTitle>
                          <CardDescription>{goal.category}</CardDescription>
                        </div>
                        <Badge variant={goal.priority === "high" ? "destructive" : "secondary"}>
                          {goal.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold">{progress.toFixed(0)}%</p>
                          <p className="text-sm text-muted-foreground">complete</p>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <div className="flex justify-between text-sm">
                          <div>
                            <p className="text-muted-foreground">Current</p>
                            <p className="font-medium">{formatCurrency(goal.current)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground">Target</p>
                            <p className="font-medium">{formatCurrency(goal.target)}</p>
                          </div>
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                          {formatCurrency(goal.target - goal.current)} remaining
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Your Documents</CardTitle>
                <CardDescription>Access your financial documents securely</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Financial Plan 2025", type: "PDF", date: "Dec 15, 2025" },
                    { name: "Statement of Advice - Super Strategy", type: "PDF", date: "Nov 28, 2025" },
                    { name: "Annual Review Summary", type: "PDF", date: "Nov 28, 2025" },
                    { name: "Insurance Schedule", type: "PDF", date: "Oct 15, 2025" }
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-red-500" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.type} • {doc.date}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientPortal;
