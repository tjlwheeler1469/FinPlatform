// Client360 — Overview tab: Goals, Family, Asset Allocation, Insurance, Key Dates.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Users, BarChart3, Shield, Calendar } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "./utils";

const OverviewTab = ({ client }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Goals */}
    <Card className="lg:col-span-2 border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-[#D4A84C]" /> Financial Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {client.goals.map((goal) => {
          const GoalIcon = goal.icon;
          const progressColor = goal.progress >= 75 ? "bg-emerald-500" : goal.progress >= 40 ? "bg-[#D4A84C]" : "bg-blue-500";
          return (
            <div key={goal.id} className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${progressColor}/10`}>
                    <GoalIcon className={`h-4 w-4 ${goal.progress >= 75 ? "text-emerald-600" : goal.progress >= 40 ? "text-[#D4A84C]" : "text-blue-600"}`} />
                  </div>
                  <span className="font-medium text-sm">{goal.name}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-muted">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-1.5 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">{formatCurrency(goal.current)} / {formatCurrency(goal.target)}</span>
                <span>Target: {formatDate(goal.targetDate)}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>

    {/* Family */}
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base"><Users className="h-5 w-5 text-[#D4A84C]" /> Family</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {client.family.map((member, idx) => (
          <div key={`family-${idx}`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#0f1d35]/5 flex items-center justify-center text-[#0f1d35] text-xs font-semibold">
                {getInitials(member.name)}
              </div>
              <div>
                <p className="font-medium text-sm">{member.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{member.relationship}</p>
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground tabular-nums bg-muted px-2 py-0.5 rounded">Age {member.age}</span>
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Asset Allocation */}
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-5 w-5 text-[#D4A84C]" /> Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(client.wealth.assetAllocation).map(([asset, percent]) => (
          <div key={asset} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="capitalize">{asset.replace(/([A-Z])/g, " $1")}</span>
              <span className="font-medium">{percent}%</span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Insurance */}
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5 text-[#D4A84C]" /> Insurance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {client.insurance.map((ins, idx) => (
          <div key={`ins-${idx}`} className="flex items-center justify-between p-2 rounded-lg border">
            <div>
              <p className="font-medium text-sm">{ins.type}</p>
              <p className="text-xs text-muted-foreground">{ins.provider}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-sm">{formatCurrency(ins.sumInsured)}</p>
              <Badge className={ins.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>{ins.status}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Key Dates */}
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-5 w-5 text-[#D4A84C]" /> Key Dates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {client.keyDates.slice(0, 5).map((kd, idx) => (
          <div key={`kd-${idx}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
            <div className={`w-2 h-2 rounded-full ${
              kd.type === "review" ? "bg-amber-500"
              : kd.type === "birthday" ? "bg-pink-500"
              : kd.type === "tax" ? "bg-blue-500" : "bg-purple-500"
            }`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{kd.event}</p>
              <p className="text-xs text-muted-foreground">{formatDate(kd.date)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default OverviewTab;
