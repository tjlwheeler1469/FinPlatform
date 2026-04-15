import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User, Wallet, TrendingUp, Gauge, DollarSign, Target, BarChart3,
  CalendarDays, Shield, Briefcase, Heart
} from "lucide-react";

const fmt = (v) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

import { CLIENT_DATA, computeClientTotals } from "@/data/clientData";

const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#6B7280", "#14B8A6", "#F97316"];

const buildProfile = (clientId) => {
  const d = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const t = computeClientTotals(clientId);
  const p = d.profile;
  // Group assets by type for allocation
  const typeMap = {};
  d.assets.forEach(a => { typeMap[a.type] = (typeMap[a.type] || 0) + a.value; });
  const allocation = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1])
    .map(([type, value], i) => ({ type, value, color: COLORS[i % COLORS.length] }));
  // Super balance
  const superBalance = d.assets.filter(a => a.type === 'Super' || a.type === 'SMSF').reduce((s, a) => s + a.value, 0);
  return {
    name: p.name, initials: p.first_name[0] + p.last_name[0], status: p.status, age: p.age,
    riskProfile: p.riskProfile, retirementAge: p.retirementAge, adviser: p.advisor || 'Sarah Chen',
    income: p.incomeHousehold, netWorth: t.netWorth, grossAssets: t.grossAssets, liabilities: t.totalLiabilities,
    superBalance, insuranceCover: "Life + TPD + IP", nextReview: "15 May 2026",
    allocation,
    goals: [
      { name: `Retirement at ${p.retirementAge}`, target: d.retirement.retirement_spending * 25, current: t.netWorth },
      ...(t.totalLiabilities > 0 ? [{ name: "Debt reduction", target: t.totalLiabilities, current: Math.round(t.totalLiabilities * 0.4) }] : []),
      { name: "Emergency reserve", target: Math.round(p.expensesAnnual * 0.5), current: d.assets.filter(a => a.type === 'Cash').reduce((s, a) => s + a.value, 0) },
    ],
  };
};

const ClientProfileTab = ({ clientId }) => {
  const p = buildProfile(clientId || 'thompson_family');
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
