import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Search,
  TrendingUp, TrendingDown, Shield, Users, Eye, ArrowRight, XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CLIENT_HEALTH = [
  {
    id: "client_1", name: "Thompson Family", type: "Household", riskProfile: "Growth",
    netWorth: 1978000, change: 6.2, lastReview: "2025-11-15", nextReview: "2026-05-15",
    scores: { drift: 82, compliance: 95, engagement: 78, riskAlignment: 88, performance: 74 },
    alerts: [
      { type: "amber", text: "Portfolio drift 8.2% — above 5% threshold" },
      { type: "green", text: "SOA current — reviewed Nov 2025" },
    ],
    tasks: { pending: 3, overdue: 1 },
  },
  {
    id: "client_2", name: "Chen Family Trust", type: "Trust", riskProfile: "Balanced",
    netWorth: 4370000, change: 8.5, lastReview: "2025-12-01", nextReview: "2026-06-01",
    scores: { drift: 94, compliance: 100, engagement: 92, riskAlignment: 96, performance: 91 },
    alerts: [
      { type: "green", text: "All allocations within mandate" },
      { type: "green", text: "Trust distribution review complete" },
    ],
    tasks: { pending: 1, overdue: 0 },
  },
  {
    id: "client_3", name: "Robert Mitchell", type: "Individual", riskProfile: "Conservative",
    netWorth: 1755000, change: 4.1, lastReview: "2025-08-20", nextReview: "2026-02-20",
    scores: { drift: 68, compliance: 78, engagement: 45, riskAlignment: 72, performance: 65 },
    alerts: [
      { type: "red", text: "Review overdue — last review Aug 2025" },
      { type: "amber", text: "No contact in 4 months" },
      { type: "red", text: "Insurance gap analysis incomplete" },
    ],
    tasks: { pending: 5, overdue: 3 },
  },
  {
    id: "client_4", name: "Williams Family", type: "Household", riskProfile: "Growth",
    netWorth: 1330000, change: 9.8, lastReview: "2025-10-10", nextReview: "2026-04-10",
    scores: { drift: 88, compliance: 90, engagement: 85, riskAlignment: 82, performance: 88 },
    alerts: [
      { type: "green", text: "Strong performance — +9.8% YTD" },
      { type: "amber", text: "Home loan rate review due" },
    ],
    tasks: { pending: 2, overdue: 0 },
  },
  {
    id: "client_5", name: "Patel SMSF", type: "SMSF", riskProfile: "Aggressive",
    netWorth: 6670000, change: 11.2, lastReview: "2026-01-05", nextReview: "2026-07-05",
    scores: { drift: 91, compliance: 98, engagement: 96, riskAlignment: 94, performance: 95 },
    alerts: [
      { type: "green", text: "SMSF audit current" },
      { type: "green", text: "Top performer — +11.2% YTD" },
    ],
    tasks: { pending: 1, overdue: 0 },
  },
];

const getRAG = (score) => {
  if (score >= 80) return { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Green", icon: CheckCircle2 };
  if (score >= 60) return { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Amber", icon: AlertTriangle };
  return { color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Red", icon: XCircle };
};

const getOverallScore = (scores) => {
  const vals = Object.values(scores);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
};

const formatCurrency = (v) => {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
};

const ClientHealthDashboard = ({ embedded = false }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const clients = useMemo(() => {
    let filtered = CLIENT_HEALTH;
    if (search) filtered = filtered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (filter !== "all") {
      filtered = filtered.filter(c => {
        const score = getOverallScore(c.scores);
        if (filter === "red") return score < 60;
        if (filter === "amber") return score >= 60 && score < 80;
        if (filter === "green") return score >= 80;
        return true;
      });
    }
    return filtered;
  }, [search, filter]);

  const summary = useMemo(() => {
    const all = CLIENT_HEALTH;
    return {
      total: all.length,
      green: all.filter(c => getOverallScore(c.scores) >= 80).length,
      amber: all.filter(c => { const s = getOverallScore(c.scores); return s >= 60 && s < 80; }).length,
      red: all.filter(c => getOverallScore(c.scores) < 60).length,
      totalAUM: all.reduce((s, c) => s + c.netWorth, 0),
      overdueTasks: all.reduce((s, c) => s + c.tasks.overdue, 0),
    };
  }, []);

  const handleViewClient = (clientId) => {
    const clientMap = {
      client_1: { id: "client_1", name: "Thompson Family" },
      client_2: { id: "client_2", name: "Chen Family Trust" },
      client_3: { id: "client_3", name: "Robert Mitchell" },
      client_4: { id: "client_4", name: "Williams Family" },
      client_5: { id: "client_5", name: "Patel SMSF" },
    };
    localStorage.setItem("selected_client", JSON.stringify(clientMap[clientId]));
    localStorage.setItem("app_mode", "adviser");
    window.dispatchEvent(new CustomEvent('client-changed'));
    navigate("/dashboard");
  };

  const content = (
    <div className="space-y-6" data-testid="client-health-dashboard">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Client Health Dashboard</h1>
        <p className="text-muted-foreground text-sm">RAG status across all clients — drift, compliance, engagement & performance</p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="border-[#0f1d35]">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-emerald-600">Healthy</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.green}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-amber-600">At Risk</p>
            <p className="text-2xl font-bold text-amber-600">{summary.amber}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-red-600">Critical</p>
            <p className="text-2xl font-bold text-red-600">{summary.red}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total AUM</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalAUM)}</p>
          </CardContent>
        </Card>
        <Card className={summary.overdueTasks > 0 ? "border-red-200" : ""}>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Overdue Tasks</p>
            <p className={`text-2xl font-bold ${summary.overdueTasks > 0 ? "text-red-600" : "text-emerald-600"}`}>{summary.overdueTasks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" data-testid="health-search" />
        </div>
        {["all", "red", "amber", "green"].map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}
            className={filter === f ? "bg-[#0f1d35]" : ""} data-testid={`filter-${f}`}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Client Cards */}
      <div className="space-y-4">
        {clients.map(client => {
          const overall = getOverallScore(client.scores);
          const rag = getRAG(overall);
          const RagIcon = rag.icon;
          return (
            <Card key={client.id} className={`${rag.bg} transition-all hover:shadow-md`} data-testid={`health-card-${client.id}`}>
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Left: Identity */}
                  <div className="flex items-center gap-4 min-w-[220px]">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      overall >= 80 ? "bg-emerald-100 text-emerald-700" : overall >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    }`}>
                      {client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold">{client.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1.5">{client.type}</Badge>
                        <span>{client.riskProfile}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Scores */}
                  <div className="flex-1 grid grid-cols-5 gap-3">
                    {Object.entries(client.scores).map(([key, val]) => {
                      const s = getRAG(val);
                      return (
                        <div key={key} className="text-center">
                          <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                          <p className={`text-sm font-bold ${s.color}`}>{val}%</p>
                          <Progress value={val} className="h-1 mt-1" />
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Overall + Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <div className={`text-3xl font-bold ${rag.color}`}>{overall}</div>
                      <div className="flex items-center justify-center gap-1">
                        <RagIcon className={`h-3.5 w-3.5 ${rag.color}`} />
                        <span className={`text-xs font-medium ${rag.color}`}>{rag.label}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1 min-w-[100px]">
                      <p className="text-sm font-semibold">{formatCurrency(client.netWorth)}</p>
                      <p className={`text-xs ${client.change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {client.change >= 0 ? "+" : ""}{client.change}% YTD
                      </p>
                      {client.tasks.overdue > 0 && (
                        <Badge variant="destructive" className="text-[10px]">{client.tasks.overdue} overdue</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleViewClient(client.id)} data-testid={`view-${client.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Alerts */}
                {client.alerts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-current/5 flex flex-wrap gap-2">
                    {client.alerts.map((alert, i) => (
                      <Badge key={i} variant="outline" className={`text-[10px] ${
                        alert.type === "red" ? "border-red-300 text-red-700 bg-red-50" :
                        alert.type === "amber" ? "border-amber-300 text-amber-700 bg-amber-50" :
                        "border-emerald-300 text-emerald-700 bg-emerald-50"
                      }`}>
                        {alert.type === "red" ? <XCircle className="h-3 w-3 mr-1" /> :
                         alert.type === "amber" ? <AlertTriangle className="h-3 w-3 mr-1" /> :
                         <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {alert.text}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default ClientHealthDashboard;
