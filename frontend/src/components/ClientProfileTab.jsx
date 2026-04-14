import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User, Wallet, TrendingUp, Gauge, DollarSign, Target, BarChart3,
  CalendarDays, Shield, Briefcase, Heart
} from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

const PROFILES = {
  thompson_family: {
    name: "David & Sarah Thompson",
    initials: "DT",
    status: "Married",
    age: 50,
    riskProfile: "Balanced",
    retirementAge: 67,
    adviser: "Sarah Chen",
    income: 185000,
    netWorth: 1608800,
    grossAssets: 2278000,
    liabilities: 669200,
    superBalance: 443000,
    insuranceCover: "Life + TPD + IP",
    nextReview: "15 May 2026",
    allocation: [
      { type: "Property", value: 1605000, color: "#8B5CF6" },
      { type: "Super", value: 443000, color: "#10B981" },
      { type: "Shares", value: 84500, color: "#3B82F6" },
      { type: "Cash", value: 63000, color: "#F59E0B" },
      { type: "Managed Funds", value: 32000, color: "#EC4899" },
      { type: "Other", value: 50500, color: "#6B7280" },
    ],
    goals: [
      { name: "Retirement at 67", target: 2500000, current: 1608800 },
      { name: "Pay off investment loan", target: 380000, current: 180000 },
      { name: "Emergency fund $60K", target: 60000, current: 28000 },
    ],
  },
  client_1: null,
  chen_family: {
    name: "Michael & Lisa Chen",
    initials: "MC",
    status: "Married",
    age: 49,
    riskProfile: "Balanced",
    retirementAge: 60,
    adviser: "Sarah Chen",
    income: 450000,
    netWorth: 5200000,
    grossAssets: 5200000,
    liabilities: 0,
    superBalance: 1200000,
    insuranceCover: "Life + TPD",
    nextReview: "22 Jun 2026",
    allocation: [
      { type: "Trust Portfolio", value: 2800000, color: "#3B82F6" },
      { type: "Super", value: 1200000, color: "#10B981" },
      { type: "Property", value: 1100000, color: "#8B5CF6" },
      { type: "Cash", value: 100000, color: "#F59E0B" },
    ],
    goals: [
      { name: "Retirement at 60", target: 6000000, current: 5200000 },
      { name: "Sophie's university", target: 150000, current: 85000 },
    ],
  },
  client_2: null,
};

PROFILES.client_1 = PROFILES.thompson_family;
PROFILES.client_2 = PROFILES.chen_family;

const ClientProfileTab = ({ clientId }) => {
  const p = PROFILES[clientId] || PROFILES.thompson_family;
  const totalAlloc = p.allocation.reduce((s, a) => s + a.value, 0);

  return (
    <div className="space-y-5" data-testid="client-profile-tab">
      {/* Client Header Card */}
      <Card className="bg-[#1a2744] text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {p.initials}
              </div>
              <div>
                <h2 className="text-lg font-bold">{p.name}</h2>
                <p className="text-sm text-white/70">
                  {p.status} | Age {p.age} | {p.riskProfile} Profile | Retire at {p.retirementAge}
                </p>
                <p className="text-xs text-white/50 mt-0.5">Adviser: {p.adviser}</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-2xl font-bold">{fmt(p.netWorth)}</p>
              <p className="text-xs text-white/60">Net Worth</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Wallet, label: "Net Worth", value: fmt(p.netWorth), color: "text-emerald-600" },
          { icon: DollarSign, label: "Gross Assets", value: fmt(p.grossAssets), color: "text-blue-600" },
          { icon: TrendingUp, label: "Income", value: fmt(p.income), color: "text-amber-600" },
          { icon: Gauge, label: "Super Balance", value: fmt(p.superBalance), color: "text-green-600" },
          { icon: TrendingUp, label: "Liabilities", value: fmt(p.liabilities), color: p.liabilities > 0 ? "text-red-600" : "text-emerald-600" },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center">
              <kpi.icon className={`h-4 w-4 mx-auto mb-1 ${kpi.color}`} />
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              <p className={`text-base font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Insurance Cover</p>
              <p className="text-sm font-medium">{p.insuranceCover}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Next Review</p>
              <p className="text-sm font-medium">{p.nextReview}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-purple-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Risk Profile</p>
              <p className="text-sm font-medium">{p.riskProfile}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation + Goals side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" /> Portfolio Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {p.allocation.map((a) => (
              <div key={a.type}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: a.color }} />
                    {a.type}
                  </span>
                  <span className="font-medium">{fmt(a.value)} ({((a.value / totalAlloc) * 100).toFixed(0)}%)</span>
                </div>
                <Progress value={(a.value / totalAlloc) * 100} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" /> Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {p.goals.map((g, i) => {
              const pct = Math.min(100, (g.current / g.target) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{g.name}</span>
                    <Badge variant={pct >= 80 ? "default" : pct >= 50 ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                      {pct.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{fmt(g.current)}</span>
                    <span>{fmt(g.target)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientProfileTab;
