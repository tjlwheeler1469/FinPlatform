import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User, Wallet, TrendingUp, Gauge, Building2, Shield, DollarSign, Target, BarChart3
} from "lucide-react";

const formatCurrency = (v) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

// Separate client data — nothing shared between profiles
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
    allocation: [
      { type: "Property", value: 1605000 },
      { type: "Super", value: 443000 },
      { type: "Shares", value: 84500 },
      { type: "Cash", value: 63000 },
      { type: "Managed Funds", value: 32000 },
      { type: "Other", value: 50500 },
    ],
    goals: [
      { name: "Retirement at 67", target: 2500000, current: 1608800 },
      { name: "Pay off investment loan", target: 380000, current: 180000 },
      { name: "Emergency fund $60K", target: 60000, current: 28000 },
    ],
  },
  client_1: null, // alias — resolved below
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
    allocation: [
      { type: "Trust Portfolio", value: 2800000 },
      { type: "Super", value: 1200000 },
      { type: "Property", value: 1100000 },
      { type: "Cash", value: 100000 },
    ],
    goals: [
      { name: "Retirement at 60", target: 6000000, current: 5200000 },
      { name: "Sophie's university", target: 150000, current: 85000 },
    ],
  },
  client_2: null, // alias — resolved below
};

// Aliases
PROFILES.client_1 = PROFILES.thompson_family;
PROFILES.client_2 = PROFILES.chen_family;

const ClientProfileTab = ({ clientId }) => {
  const profile = PROFILES[clientId] || PROFILES.thompson_family;
  const totalAllocation = profile.allocation.reduce((s, a) => s + a.value, 0);

  return (
    <div className="space-y-5" data-testid="client-profile-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1a2744] flex items-center justify-center text-white font-bold text-lg">
            {profile.initials}
          </div>
          <div>
            <h2 className="text-lg font-bold">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">
              Age {profile.age} | {profile.riskProfile} | Retire at {profile.retirementAge} | Adviser: {profile.adviser}
            </p>
          </div>
        </div>
        <Badge className="bg-[#1a2744] text-base px-3 py-1">{formatCurrency(profile.netWorth)}</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Wallet className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <p className="text-[11px] text-muted-foreground">Net Worth</p>
            <p className="text-lg font-bold">{formatCurrency(profile.netWorth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <p className="text-[11px] text-muted-foreground">Gross Assets</p>
            <p className="text-lg font-bold">{formatCurrency(profile.grossAssets)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-amber-600" />
            <p className="text-[11px] text-muted-foreground">Income</p>
            <p className="text-lg font-bold">{formatCurrency(profile.income)}</p>
          </CardContent>
        </Card>
        <Card className={profile.liabilities > 0 ? "border-red-200" : ""}>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <p className="text-[11px] text-muted-foreground">Liabilities</p>
            <p className={`text-lg font-bold ${profile.liabilities > 0 ? "text-red-600" : ""}`}>{formatCurrency(profile.liabilities)}</p>
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
          <CardContent className="space-y-2">
            {profile.allocation.map((a) => (
              <div key={a.type}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span>{a.type}</span>
                  <span className="font-medium">{formatCurrency(a.value)} ({((a.value / totalAllocation) * 100).toFixed(0)}%)</span>
                </div>
                <Progress value={(a.value / totalAllocation) * 100} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" /> Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.goals.map((g, i) => {
              const pct = Math.min(100, (g.current / g.target) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{g.name}</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{formatCurrency(g.current)}</span>
                    <span>{formatCurrency(g.target)}</span>
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
