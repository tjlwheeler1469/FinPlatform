// AdviserGoals — goal CRUD with feasibility validation for adviser client profile.
// Each goal is checked against client's monthly surplus; infeasible goals are flagged
// with a prompt to adjust the budget.
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Target, TrendingUp, AlertTriangle, CheckCircle2, PiggyBank, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const LS_KEY = (clientId) => `client_goals_${clientId}`;

const defaultGoalsFor = (client) => [
  { id: "g_retire", name: "Comfortable Retirement", target: (client.retirement?.retirement_spending || 100000) * 25, current: client.assets.filter((a) => a.type === "Super" || a.type === "SMSF").reduce((s, a) => s + a.value, 0), targetDate: `${new Date().getFullYear() + Math.max(1, (client.retirement?.retirement_age || 67) - (client.retirement?.current_age || 50))}-07-01`, priority: "high", category: "retirement" },
  { id: "g_home", name: "Home Upgrade", target: 1_500_000, current: 400_000, targetDate: `${new Date().getFullYear() + 5}-06-30`, priority: "medium", category: "lifestyle" },
  { id: "g_edu", name: "Children's Education", target: 350_000, current: 85_000, targetDate: `${new Date().getFullYear() + 10}-01-15`, priority: "medium", category: "family" },
];

const monthsUntil = (isoDate) => {
  const now = new Date();
  const t = new Date(isoDate);
  return Math.max(1, Math.round((t - now) / (1000 * 60 * 60 * 24 * 30.44)));
};

const AdviserGoals = ({ clientId: propClientId, embedded = false }) => {
  const navigate = useNavigate();
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const monthlySurplus = Math.max(0, (client.budget?.monthlyIncome || 0) - (client.budget?.monthlyExpenses || 0));

  const [goals, setGoals] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem(LS_KEY(clientId)) || "null"); return saved || defaultGoalsFor(client); }
    catch { return defaultGoalsFor(client); }
  });
  const [editing, setEditing] = useState(null);

  useEffect(() => { localStorage.setItem(LS_KEY(clientId), JSON.stringify(goals)); }, [goals, clientId]);

  const enriched = useMemo(() => goals.map((g) => {
    const months = monthsUntil(g.targetDate);
    const gap = Math.max(0, g.target - g.current);
    const monthlyRequired = gap / months;
    const progress = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
    return { ...g, months, gap, monthlyRequired, progress };
  }), [goals]);

  const totalMonthlyRequired = enriched.reduce((s, g) => s + g.monthlyRequired, 0);
  const feasibilityRatio = monthlySurplus > 0 ? totalMonthlyRequired / monthlySurplus : Infinity;
  const isFeasible = totalMonthlyRequired <= monthlySurplus;
  const shortfall = Math.max(0, totalMonthlyRequired - monthlySurplus);

  const upsertGoal = (g) => {
    if (!g.name?.trim()) return toast.error("Give your goal a name");
    if (!g.target || g.target <= 0) return toast.error("Target amount must be > 0");
    if (!g.targetDate) return toast.error("Pick a target date");
    const newId = g.id || `g_${Date.now()}`;
    const payload = { ...g, id: newId, current: Number(g.current) || 0 };
    setGoals((prev) => {
      const exists = prev.find((x) => x.id === newId);
      return exists ? prev.map((x) => (x.id === newId ? payload : x)) : [...prev, payload];
    });
    setEditing(null);
    toast.success(g.id ? "Goal updated" : "Goal added");
  };
  const removeGoal = (id) => { setGoals((prev) => prev.filter((x) => x.id !== id)); toast.success("Goal removed"); };

  return (
    <div className="space-y-4" data-testid="adviser-goals">
      {/* Feasibility banner */}
      <Card className={isFeasible ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            {isFeasible ? <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" />}
            <div>
              <p className={`font-semibold ${isFeasible ? "text-emerald-800" : "text-rose-800"}`} data-testid="feasibility-status">
                {isFeasible ? "Goals are fundable from current cash flow" : "Goals exceed current savings capacity"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly surplus: <strong className="text-[#1a2744]">{fmt(monthlySurplus)}</strong> · Required for all goals: <strong className="text-[#1a2744]">{fmt(totalMonthlyRequired)}</strong>
                {!isFeasible && <> · Shortfall: <strong className="text-rose-700">{fmt(shortfall)}/mo</strong></>}
              </p>
            </div>
          </div>
          {!isFeasible && (
            <Button size="sm" variant="outline" onClick={() => navigate("/budget")} className="border-rose-300 text-rose-700 hover:bg-rose-100 flex-shrink-0" data-testid="adjust-budget-btn">
              <PiggyBank className="h-3.5 w-3.5 mr-1" /> Adjust Budget
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Active Goals</p><p className="text-2xl font-bold text-[#1a2744]">{enriched.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Combined Target</p><p className="text-2xl font-bold text-[#1a2744]">{fmt(enriched.reduce((s, g) => s + g.target, 0))}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Saved To Date</p><p className="text-2xl font-bold text-emerald-600">{fmt(enriched.reduce((s, g) => s + g.current, 0))}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground">Feasibility</p><p className={`text-2xl font-bold ${isFeasible ? "text-emerald-600" : "text-rose-600"}`}>{feasibilityRatio === Infinity ? "—" : `${Math.round(feasibilityRatio * 100)}%`}</p></CardContent></Card>
      </div>

      {/* Goals list */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-[#D4A84C]" /> Household Goals</CardTitle>
            <p className="text-xs text-muted-foreground">Edit · add · remove. Each goal is auto-checked against current savings capacity.</p>
          </div>
          <Button size="sm" onClick={() => setEditing({ name: "", target: "", current: 0, targetDate: `${new Date().getFullYear() + 5}-12-31`, priority: "medium", category: "lifestyle" })} className="bg-[#1a2744]" data-testid="add-goal-btn">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Goal
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-3" data-testid="goal-editor">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{editing.id ? "Edit goal" : "New goal"}</p>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2"><Label className="text-xs">Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Holiday Home in Byron" className="h-8 text-sm" data-testid="goal-name-input" /></div>
                <div><Label className="text-xs">Target ($)</Label><Input type="number" value={editing.target} onChange={(e) => setEditing({ ...editing, target: Number(e.target.value) || 0 })} className="h-8 text-sm" data-testid="goal-target-input" /></div>
                <div><Label className="text-xs">Saved so far ($)</Label><Input type="number" value={editing.current} onChange={(e) => setEditing({ ...editing, current: Number(e.target.value) || 0 })} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Target date</Label><Input type="date" value={editing.targetDate} onChange={(e) => setEditing({ ...editing, targetDate: e.target.value })} className="h-8 text-sm" data-testid="goal-date-input" /></div>
                <div><Label className="text-xs">Priority</Label>
                  <Select value={editing.priority} onValueChange={(v) => setEditing({ ...editing, priority: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Category</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="retirement">Retirement</SelectItem><SelectItem value="lifestyle">Lifestyle</SelectItem><SelectItem value="family">Family</SelectItem><SelectItem value="property">Property</SelectItem><SelectItem value="legacy">Legacy</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button size="sm" onClick={() => upsertGoal(editing)} className="bg-emerald-600" data-testid="save-goal-btn">Save Goal</Button>
              </div>
            </div>
          )}

          {enriched.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No goals yet — click Add Goal to start.</p>}
          {enriched.map((g) => {
            const feasible = g.monthlyRequired <= monthlySurplus;
            const priorityColor = g.priority === "high" ? "bg-rose-100 text-rose-700 border-rose-200" : g.priority === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200";
            return (
              <div key={g.id} className="p-4 border rounded-lg hover:border-[#1a2744] transition-colors" data-testid={`goal-row-${g.id}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-[#1a2744]">{g.name}</h4>
                      <Badge variant="outline" className={`text-[9px] ${priorityColor}`}>{g.priority}</Badge>
                      <Badge variant="outline" className="text-[9px]">{g.category}</Badge>
                      {!feasible && <Badge className="bg-rose-500 text-[9px]"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Cash flow shortfall</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>{fmt(g.current)}</strong> of {fmt(g.target)} saved · {g.months} months to go · need <strong className={feasible ? "text-emerald-600" : "text-rose-600"}>{fmt(g.monthlyRequired)}/mo</strong>
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(g)} data-testid={`edit-goal-${g.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeGoal(g.id)} data-testid={`delete-goal-${g.id}`}><Trash2 className="h-3.5 w-3.5 text-rose-600" /></Button>
                  </div>
                </div>
                <Progress value={g.progress} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{g.progress.toFixed(0)}% complete</span>
                  <span>Target: {new Date(g.targetDate).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdviserGoals;
