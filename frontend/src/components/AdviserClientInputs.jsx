// AdviserClientInputs — comprehensive manual data entry for advisers.
// Lets advisers add/edit client data: personal, income, expenses, assets,
// liabilities, goals, insurance, estate. Persists per-client to localStorage.
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Save, Plus, Trash2, User, Wallet, PiggyBank, TrendingUp,
  Home, Target, Shield, ScrollText, DollarSign, Percent,
} from "lucide-react";

const storageKey = (clientId) => `adviser_inputs_${clientId}`;

const DEFAULT_DATA = (client) => ({
  // Personal / household
  personal: {
    clientName: client?.profile?.name || "",
    partnerName: client?.profile?.partner_first_name || "",
    age: client?.profile?.age || 50,
    partnerAge: "",
    maritalStatus: client?.profile?.status || "Married",
    children: client?.profile?.children || 0,
    occupation: client?.profile?.occupation || "",
    partnerOccupation: "",
    riskProfile: client?.profile?.riskProfile || "Balanced",
    notes: "",
  },
  // Income sources
  incomes: [
    { id: "i1", source: "Salary - Client", amount: client?.profile?.incomeHousehold ? Math.round(client.profile.incomeHousehold * 0.6) : 125000, frequency: "yearly", endsAtRetirement: true },
    { id: "i2", source: "Salary - Partner", amount: client?.profile?.incomeHousehold ? Math.round(client.profile.incomeHousehold * 0.4) : 60000, frequency: "yearly", endsAtRetirement: true },
  ],
  // Expenses (annual)
  expenses: {
    housing: 42000,
    utilities: 5400,
    groceries: 14400,
    transport: 9600,
    insurance: 7800,
    education: 0,
    entertainment: 7200,
    travel: 12000,
    healthcare: 3600,
    other: 6000,
  },
  // Assets
  assets: [
    ...(client?.assets || []).slice(0, 5).map((a, i) => ({
      id: `a${i}`, name: a.name, type: a.type, entity: a.entity, value: a.value, annualReturn: a.change || 6.5,
    })),
  ],
  // Liabilities
  liabilities: [
    ...(client?.liabilities || []).map((l, i) => ({
      id: `l${i}`, name: l.name, type: l.type, value: l.value, rate: l.rate, minPayment: Math.round(l.value * 0.08),
    })),
  ],
  // Goals
  goals: [
    { id: "g1", name: "Comfortable Retirement", targetYear: (new Date().getFullYear() + 17), targetAmount: 4_000_000, priority: "high" },
    { id: "g2", name: "Kids Education Fund", targetYear: (new Date().getFullYear() + 10), targetAmount: 350_000, priority: "medium" },
    { id: "g3", name: "Holiday House Upgrade", targetYear: (new Date().getFullYear() + 7), targetAmount: 500_000, priority: "low" },
  ],
  // Insurance
  insurance: {
    life: 1_500_000,
    tpd: 1_000_000,
    trauma: 500_000,
    incomeProtection: 15_000, // monthly
    healthPremium: 4_800,
  },
  // Estate
  estate: {
    willUpToDate: true,
    willLocation: "Safe deposit box - CBA Glen Waverley",
    executors: "Sarah Thompson, Michael Thompson (brother)",
    poa: true,
    enduringGuardian: true,
    superBeneficiary: "Binding - Spouse 100%",
    notes: "",
  },
});

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const AdviserClientInputs = ({ clientId, client }) => {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey(clientId));
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return DEFAULT_DATA(client);
  });

  // Reset when client changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(clientId));
      setData(saved ? JSON.parse(saved) : DEFAULT_DATA(client));
    } catch { setData(DEFAULT_DATA(client)); }
  }, [clientId, client]);

  const totals = useMemo(() => {
    const totalIncome = data.incomes.reduce((s, i) => s + (+i.amount || 0) * (i.frequency === "monthly" ? 12 : i.frequency === "weekly" ? 52 : 1), 0);
    const totalExpenses = Object.values(data.expenses).reduce((s, v) => s + (+v || 0), 0);
    const totalAssets = data.assets.reduce((s, a) => s + (+a.value || 0), 0);
    const totalLiabilities = data.liabilities.reduce((s, l) => s + (+l.value || 0), 0);
    return { totalIncome, totalExpenses, surplus: totalIncome - totalExpenses, totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
  }, [data]);

  const save = () => {
    try {
      localStorage.setItem(storageKey(clientId), JSON.stringify(data));
      toast.success("Client inputs saved", { description: "Persisted to this browser." });
    } catch (e) {
      toast.error("Save failed");
    }
  };

  const reset = () => {
    setData(DEFAULT_DATA(client));
    try { localStorage.removeItem(storageKey(clientId)); } catch { /* ignore */ }
    toast.info("Reset to client defaults");
  };

  // Update helpers
  const updatePersonal = (k, v) => setData((d) => ({ ...d, personal: { ...d.personal, [k]: v } }));
  const updateExpense = (k, v) => setData((d) => ({ ...d, expenses: { ...d.expenses, [k]: +v } }));
  const updateInsurance = (k, v) => setData((d) => ({ ...d, insurance: { ...d.insurance, [k]: +v } }));
  const updateEstate = (k, v) => setData((d) => ({ ...d, estate: { ...d.estate, [k]: v } }));

  const addRow = (key, defaults) => setData((d) => ({ ...d, [key]: [...d[key], { id: `${key}_${Date.now()}`, ...defaults }] }));
  const updateRow = (key, id, patch) => setData((d) => ({ ...d, [key]: d[key].map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const removeRow = (key, id) => setData((d) => ({ ...d, [key]: d[key].filter((r) => r.id !== id) }));

  return (
    <div className="space-y-4" data-testid="adviser-client-inputs">
      {/* Header with totals */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1a2744] flex items-center gap-2">
            <User className="h-4 w-4" />
            Adviser Data Entry · {data.personal.clientName}
          </h2>
          <p className="text-xs text-muted-foreground">Fill in any data the client has provided — it flows directly into retirement scenarios & reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reset} data-testid="inputs-reset-btn">Reset</Button>
          <Button size="sm" className="bg-[#1a2744]" onClick={save} data-testid="inputs-save-btn">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save
          </Button>
        </div>
      </div>

      {/* Rollup cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Annual Income</p><p className="text-lg font-bold text-emerald-700">{fmt(totals.totalIncome)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Annual Expenses</p><p className="text-lg font-bold text-rose-700">{fmt(totals.totalExpenses)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Net Worth</p><p className="text-lg font-bold text-[#1a2744]">{fmt(totals.netWorth)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Annual Surplus</p><p className={`text-lg font-bold ${totals.surplus >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmt(totals.surplus)}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="personal" className="text-xs" data-testid="inputs-tab-personal"><User className="h-3 w-3 mr-1" />Personal</TabsTrigger>
          <TabsTrigger value="income" className="text-xs" data-testid="inputs-tab-income"><DollarSign className="h-3 w-3 mr-1" />Income</TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs" data-testid="inputs-tab-expenses"><Wallet className="h-3 w-3 mr-1" />Expenses</TabsTrigger>
          <TabsTrigger value="assets" className="text-xs" data-testid="inputs-tab-assets"><TrendingUp className="h-3 w-3 mr-1" />Assets</TabsTrigger>
          <TabsTrigger value="liabilities" className="text-xs" data-testid="inputs-tab-liabilities"><Home className="h-3 w-3 mr-1" />Liabilities</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs" data-testid="inputs-tab-goals"><Target className="h-3 w-3 mr-1" />Goals</TabsTrigger>
          <TabsTrigger value="protection" className="text-xs" data-testid="inputs-tab-protection"><Shield className="h-3 w-3 mr-1" />Protection</TabsTrigger>
        </TabsList>

        {/* PERSONAL */}
        <TabsContent value="personal" className="pt-3">
          <Card>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className="text-xs">Client Name</Label><Input value={data.personal.clientName} onChange={(e) => updatePersonal("clientName", e.target.value)} data-testid="ip-client-name" /></div>
              <div><Label className="text-xs">Partner Name</Label><Input value={data.personal.partnerName} onChange={(e) => updatePersonal("partnerName", e.target.value)} /></div>
              <div><Label className="text-xs">Age</Label><Input type="number" value={data.personal.age} onChange={(e) => updatePersonal("age", +e.target.value)} data-testid="ip-age" /></div>
              <div><Label className="text-xs">Partner Age</Label><Input type="number" value={data.personal.partnerAge} onChange={(e) => updatePersonal("partnerAge", +e.target.value)} /></div>
              <div><Label className="text-xs">Marital Status</Label><Input value={data.personal.maritalStatus} onChange={(e) => updatePersonal("maritalStatus", e.target.value)} /></div>
              <div><Label className="text-xs">Children</Label><Input type="number" value={data.personal.children} onChange={(e) => updatePersonal("children", +e.target.value)} /></div>
              <div><Label className="text-xs">Occupation</Label><Input value={data.personal.occupation} onChange={(e) => updatePersonal("occupation", e.target.value)} /></div>
              <div><Label className="text-xs">Partner Occupation</Label><Input value={data.personal.partnerOccupation} onChange={(e) => updatePersonal("partnerOccupation", e.target.value)} /></div>
              <div><Label className="text-xs">Risk Profile</Label><Input value={data.personal.riskProfile} onChange={(e) => updatePersonal("riskProfile", e.target.value)} /></div>
              <div className="md:col-span-2"><Label className="text-xs">Notes</Label><Textarea rows={3} value={data.personal.notes} onChange={(e) => updatePersonal("notes", e.target.value)} placeholder="Health concerns, family considerations, career plans…" /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INCOME */}
        <TabsContent value="income" className="pt-3">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Income Sources</CardTitle>
              <Button variant="outline" size="sm" onClick={() => addRow("incomes", { source: "New Source", amount: 0, frequency: "yearly", endsAtRetirement: true })} data-testid="ip-add-income"><Plus className="h-3 w-3 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.incomes.map((i) => (
                <div key={i.id} className="grid grid-cols-[1fr_120px_120px_90px_32px] gap-2 items-center">
                  <Input value={i.source} onChange={(e) => updateRow("incomes", i.id, { source: e.target.value })} className="h-8 text-sm" />
                  <Input type="number" value={i.amount} onChange={(e) => updateRow("incomes", i.id, { amount: +e.target.value })} className="h-8 text-sm" />
                  <select value={i.frequency} onChange={(e) => updateRow("incomes", i.id, { frequency: e.target.value })} className="h-8 text-sm border rounded px-2">
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={i.endsAtRetirement} onChange={(e) => updateRow("incomes", i.id, { endsAtRetirement: e.target.checked })} /> Ends@retire</label>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow("incomes", i.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXPENSES */}
        <TabsContent value="expenses" className="pt-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Annual Expense Categories</CardTitle><CardDescription className="text-xs">All values in $/year.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(data.expenses).map(([k, v]) => (
                <div key={k}>
                  <Label className="text-xs capitalize">{k.replace(/([A-Z])/g, " $1")}</Label>
                  <Input type="number" value={v} onChange={(e) => updateExpense(k, e.target.value)} className="h-8 text-sm" data-testid={`ip-exp-${k}`} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ASSETS */}
        <TabsContent value="assets" className="pt-3">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Assets</CardTitle>
              <Button variant="outline" size="sm" onClick={() => addRow("assets", { name: "New Asset", type: "Shares", entity: "Personal", value: 0, annualReturn: 6.5 })} data-testid="ip-add-asset"><Plus className="h-3 w-3 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.assets.map((a) => (
                <div key={a.id} className="grid grid-cols-[1fr_120px_110px_120px_90px_32px] gap-2 items-center">
                  <Input value={a.name} onChange={(e) => updateRow("assets", a.id, { name: e.target.value })} className="h-8 text-sm" />
                  <Input value={a.type} onChange={(e) => updateRow("assets", a.id, { type: e.target.value })} className="h-8 text-sm" />
                  <Input value={a.entity} onChange={(e) => updateRow("assets", a.id, { entity: e.target.value })} className="h-8 text-sm" />
                  <Input type="number" value={a.value} onChange={(e) => updateRow("assets", a.id, { value: +e.target.value })} className="h-8 text-sm" />
                  <Input type="number" step="0.1" value={a.annualReturn} onChange={(e) => updateRow("assets", a.id, { annualReturn: +e.target.value })} className="h-8 text-sm" />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow("assets", a.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LIABILITIES */}
        <TabsContent value="liabilities" className="pt-3">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Liabilities</CardTitle>
              <Button variant="outline" size="sm" onClick={() => addRow("liabilities", { name: "New Loan", type: "Mortgage", value: 0, rate: 6.0, minPayment: 0 })} data-testid="ip-add-liability"><Plus className="h-3 w-3 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.liabilities.map((l) => (
                <div key={l.id} className="grid grid-cols-[1fr_120px_120px_100px_120px_32px] gap-2 items-center">
                  <Input value={l.name} onChange={(e) => updateRow("liabilities", l.id, { name: e.target.value })} className="h-8 text-sm" />
                  <Input value={l.type} onChange={(e) => updateRow("liabilities", l.id, { type: e.target.value })} className="h-8 text-sm" />
                  <Input type="number" value={l.value} onChange={(e) => updateRow("liabilities", l.id, { value: +e.target.value })} className="h-8 text-sm" />
                  <Input type="number" step="0.01" value={l.rate} onChange={(e) => updateRow("liabilities", l.id, { rate: +e.target.value })} className="h-8 text-sm" />
                  <Input type="number" value={l.minPayment} onChange={(e) => updateRow("liabilities", l.id, { minPayment: +e.target.value })} className="h-8 text-sm" />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow("liabilities", l.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GOALS */}
        <TabsContent value="goals" className="pt-3">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Financial Goals</CardTitle>
              <Button variant="outline" size="sm" onClick={() => addRow("goals", { name: "New Goal", targetYear: new Date().getFullYear() + 10, targetAmount: 100000, priority: "medium" })} data-testid="ip-add-goal"><Plus className="h-3 w-3 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.goals.map((g) => (
                <div key={g.id} className="grid grid-cols-[1fr_110px_140px_110px_32px] gap-2 items-center">
                  <Input value={g.name} onChange={(e) => updateRow("goals", g.id, { name: e.target.value })} className="h-8 text-sm" />
                  <Input type="number" value={g.targetYear} onChange={(e) => updateRow("goals", g.id, { targetYear: +e.target.value })} className="h-8 text-sm" />
                  <Input type="number" value={g.targetAmount} onChange={(e) => updateRow("goals", g.id, { targetAmount: +e.target.value })} className="h-8 text-sm" />
                  <select value={g.priority} onChange={(e) => updateRow("goals", g.id, { priority: e.target.value })} className="h-8 text-sm border rounded px-2">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow("goals", g.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROTECTION (Insurance + Estate) */}
        <TabsContent value="protection" className="pt-3">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Insurance Cover</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(data.insurance).map(([k, v]) => (
                  <div key={k}>
                    <Label className="text-xs capitalize">{k.replace(/([A-Z])/g, " $1")} {k === "incomeProtection" ? "($/mo)" : "($)"}</Label>
                    <Input type="number" value={v} onChange={(e) => updateInsurance(k, e.target.value)} className="h-8 text-sm" data-testid={`ip-ins-${k}`} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ScrollText className="h-4 w-4" /> Estate Planning</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={data.estate.willUpToDate} onChange={(e) => updateEstate("willUpToDate", e.target.checked)} /> Will up to date</label>
                <div><Label className="text-xs">Will Location</Label><Input value={data.estate.willLocation} onChange={(e) => updateEstate("willLocation", e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Executors</Label><Input value={data.estate.executors} onChange={(e) => updateEstate("executors", e.target.value)} className="h-8 text-sm" /></div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={data.estate.poa} onChange={(e) => updateEstate("poa", e.target.checked)} /> Power of Attorney in place</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={data.estate.enduringGuardian} onChange={(e) => updateEstate("enduringGuardian", e.target.checked)} /> Enduring Guardian appointed</label>
                <div><Label className="text-xs">Super Beneficiary</Label><Input value={data.estate.superBeneficiary} onChange={(e) => updateEstate("superBeneficiary", e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Notes</Label><Textarea rows={2} value={data.estate.notes} onChange={(e) => updateEstate("notes", e.target.value)} /></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-[11px] text-muted-foreground italic">Data is saved locally per-client. Click <Badge variant="outline" className="mx-1">Save</Badge> to persist. Use the Retirement tab to see how changes affect confidence.</div>
    </div>
  );
};

export default AdviserClientInputs;
