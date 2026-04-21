// Client Segmentations — dynamic segments by AUM, risk, age, life stage, service tier.
// Used to drive targeted comms, newsletters, and compliance workflows.
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Plus, Send, Trash2, Filter, TrendingUp, Shield, Briefcase, Heart, Target } from "lucide-react";
import { toast } from "sonner";
import { CLIENT_DATA } from "@/data/clientData";

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);
const fmtShort = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return fmt(v);
};

const buildClientList = () => {
  return Object.entries(CLIENT_DATA)
    .filter(([k]) => !["client_1", "client_2"].includes(k))
    .map(([id, c]) => {
      const assets = (c.assets || []).reduce((s, a) => s + a.value, 0);
      const liab = (c.liabilities || []).reduce((s, l) => s + l.value, 0);
      const netWorth = assets - liab;
      const p = c.profile || {};
      return {
        id,
        name: p.name || id,
        netWorth,
        assets,
        age: p.age || 0,
        risk: p.riskProfile || "Balanced",
        income: p.incomeHousehold || 0,
        advisor: p.advisor || "Unassigned",
        occupation: p.occupation || "",
        tier: netWorth >= 20_000_000 ? "Platinum" : netWorth >= 10_000_000 ? "Gold" : netWorth >= 5_000_000 ? "Silver" : "Bronze",
        lifeStage: p.age < 40 ? "Accumulator" : p.age < 55 ? "Pre-Retiree" : p.age < 65 ? "Transition" : "Retiree",
      };
    });
};

const PRESET_SEGMENTS = [
  { id: "hnw", name: "HNW ($5M+)", icon: TrendingUp, color: "#D4A84C", match: (c) => c.netWorth >= 5_000_000 },
  { id: "uhnw", name: "UHNW ($15M+)", icon: TrendingUp, color: "#1a2744", match: (c) => c.netWorth >= 15_000_000 },
  { id: "pre_retiree", name: "Pre-Retirees (55-64)", icon: Heart, color: "#8b5cf6", match: (c) => c.age >= 55 && c.age <= 64 },
  { id: "accumulators", name: "Accumulators (<45)", icon: Target, color: "#10b981", match: (c) => c.age < 45 },
  { id: "aggressive", name: "Aggressive Risk", icon: Shield, color: "#f43f5e", match: (c) => c.risk === "Aggressive" },
  { id: "conservative", name: "Conservative Risk", icon: Shield, color: "#06b6d4", match: (c) => c.risk === "Conservative" },
  { id: "business_owners", name: "Business Owners", icon: Briefcase, color: "#f59e0b", match: (c) => /owner|director|ceo|founder|partner/i.test(c.occupation) },
];

const loadCustomSegments = () => {
  try { return JSON.parse(localStorage.getItem("crm_custom_segments") || "[]"); } catch { return []; }
};
const saveCustomSegments = (s) => localStorage.setItem("crm_custom_segments", JSON.stringify(s));

const ClientSegmentations = () => {
  const clients = useMemo(buildClientList, []);
  const [customSegments, setCustomSegments] = useState(loadCustomSegments);
  const [showBuilder, setShowBuilder] = useState(false);
  const [newSeg, setNewSeg] = useState({ name: "", minNW: 0, maxNW: 0, minAge: 0, maxAge: 120, risk: "any", tier: "any" });
  const [activeSegmentId, setActiveSegmentId] = useState("all");

  const allSegments = useMemo(() => [
    { id: "all", name: "All Clients", icon: Users, color: "#6b7280", match: () => true },
    ...PRESET_SEGMENTS,
    ...customSegments.map((s) => ({
      ...s,
      icon: Filter,
      color: "#3b82f6",
      match: (c) =>
        (!s.minNW || c.netWorth >= s.minNW) &&
        (!s.maxNW || c.netWorth <= s.maxNW) &&
        (!s.minAge || c.age >= s.minAge) &&
        (!s.maxAge || c.age <= s.maxAge) &&
        (s.risk === "any" || c.risk === s.risk) &&
        (s.tier === "any" || c.tier === s.tier),
    })),
  ], [customSegments]);

  const activeSegment = allSegments.find((s) => s.id === activeSegmentId) || allSegments[0];
  const matched = clients.filter(activeSegment.match);

  const saveSegment = () => {
    if (!newSeg.name.trim()) return toast.error("Name required");
    const seg = { ...newSeg, id: `custom_${Date.now()}`, custom: true };
    const next = [...customSegments, seg];
    setCustomSegments(next);
    saveCustomSegments(next);
    setShowBuilder(false);
    setNewSeg({ name: "", minNW: 0, maxNW: 0, minAge: 0, maxAge: 120, risk: "any", tier: "any" });
    toast.success(`Segment "${seg.name}" saved`);
  };
  const removeSegment = (id) => {
    const next = customSegments.filter((s) => s.id !== id);
    setCustomSegments(next);
    saveCustomSegments(next);
    if (activeSegmentId === id) setActiveSegmentId("all");
    toast.success("Segment deleted");
  };

  const segmentAUM = matched.reduce((s, c) => s + c.netWorth, 0);

  const sendToSegment = () => {
    const ids = matched.map((c) => c.id);
    localStorage.setItem("crm_campaign_target", JSON.stringify({ segmentName: activeSegment.name, clientIds: ids }));
    toast.success(`${matched.length} clients queued in Newsletters tab`);
  };

  return (
    <TooltipProvider>
    <div className="space-y-4" data-testid="client-segmentations">
      {/* Segment chips */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Segments ({allSegments.length})</CardTitle>
            <p className="text-xs text-muted-foreground">Tap a segment to filter the client list below.</p>
          </div>
          <Button size="sm" onClick={() => setShowBuilder(!showBuilder)} className="bg-[#1a2744]" data-testid="btn-new-segment"><Plus className="h-3.5 w-3.5 mr-1" /> New Segment</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allSegments.map((s) => {
              const count = clients.filter(s.match).length;
              const Icon = s.icon;
              const active = s.id === activeSegmentId;
              return (
                <button key={s.id} onClick={() => setActiveSegmentId(s.id)} className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${active ? "bg-[#1a2744] text-white border-[#1a2744]" : "bg-white hover:bg-gray-50"}`} data-testid={`segment-${s.id}`}>
                  <Icon className="h-3 w-3" style={{ color: active ? "#D4A84C" : s.color }} />
                  <span className="font-medium">{s.name}</span>
                  <Badge variant="outline" className={`h-5 px-1.5 text-[10px] ${active ? "bg-white/20 text-white border-white/30" : ""}`}>{count}</Badge>
                  {s.custom && <Trash2 className="h-3 w-3 opacity-0 group-hover:opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeSegment(s.id); }} />}
                </button>
              );
            })}
          </div>

          {showBuilder && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-3" data-testid="segment-builder">
              <p className="text-sm font-semibold">Build Custom Segment</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs">Name</Label><Input value={newSeg.name} onChange={(e) => setNewSeg({ ...newSeg, name: e.target.value })} placeholder="e.g. SMSF Trustees $10M+" className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Min Net Worth</Label><Input type="number" value={newSeg.minNW || ""} onChange={(e) => setNewSeg({ ...newSeg, minNW: +e.target.value })} placeholder="0" className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Max Net Worth</Label><Input type="number" value={newSeg.maxNW || ""} onChange={(e) => setNewSeg({ ...newSeg, maxNW: +e.target.value })} placeholder="no max" className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Risk Profile</Label>
                  <Select value={newSeg.risk} onValueChange={(v) => setNewSeg({ ...newSeg, risk: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="any">Any</SelectItem><SelectItem value="Conservative">Conservative</SelectItem><SelectItem value="Balanced">Balanced</SelectItem><SelectItem value="Growth">Growth</SelectItem><SelectItem value="Aggressive">Aggressive</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Min Age</Label><Input type="number" value={newSeg.minAge || ""} onChange={(e) => setNewSeg({ ...newSeg, minAge: +e.target.value })} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Max Age</Label><Input type="number" value={newSeg.maxAge || ""} onChange={(e) => setNewSeg({ ...newSeg, maxAge: +e.target.value })} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Service Tier</Label>
                  <Select value={newSeg.tier} onValueChange={(v) => setNewSeg({ ...newSeg, tier: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="any">Any</SelectItem><SelectItem value="Platinum">Platinum ($20M+)</SelectItem><SelectItem value="Gold">Gold ($10M+)</SelectItem><SelectItem value="Silver">Silver ($5M+)</SelectItem><SelectItem value="Bronze">Bronze</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-end"><Button size="sm" onClick={saveSegment} className="w-full bg-[#10b981]" data-testid="btn-save-segment">Save Segment</Button></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active segment header */}
      <Card className="bg-gradient-to-r from-[#1a2744]/5 to-[#D4A84C]/5 border-[#D4A84C]/30">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Segment</p>
            <p className="text-xl font-bold text-[#1a2744]">{activeSegment.name}</p>
          </div>
          <div className="flex gap-6 text-right">
            <div><p className="text-xs text-muted-foreground">Clients</p><p className="text-2xl font-bold" data-testid="segment-count">{matched.length}</p></div>
            <div><p className="text-xs text-muted-foreground">Combined AUM</p><p className="text-2xl font-bold text-[#D4A84C]">{fmtShort(segmentAUM)}</p></div>
            <Button onClick={sendToSegment} disabled={!matched.length} className="bg-[#1a2744] self-center" data-testid="btn-send-to-segment"><Send className="h-4 w-4 mr-2" /> Target in Campaign</Button>
          </div>
        </CardContent>
      </Card>

      {/* Client list */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Matched Clients</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 px-2">Client</th><th className="py-2 px-2">Net Worth</th><th className="py-2 px-2">Age</th><th className="py-2 px-2">Risk</th><th className="py-2 px-2">Life Stage</th><th className="py-2 px-2">Tier</th><th className="py-2 px-2">Adviser</th></tr></thead>
              <tbody>
                {matched.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50" data-testid={`client-row-${c.id}`}>
                    <td className="py-2 px-2 font-medium">{c.name}</td>
                    <td className="py-2 px-2">{fmtShort(c.netWorth)}</td>
                    <td className="py-2 px-2">{c.age}</td>
                    <td className="py-2 px-2"><Badge variant="outline" className="text-[10px]">{c.risk}</Badge></td>
                    <td className="py-2 px-2"><span className="text-xs">{c.lifeStage}</span></td>
                    <td className="py-2 px-2"><Badge className={`text-[10px] ${c.tier === "Platinum" ? "bg-[#1a2744]" : c.tier === "Gold" ? "bg-[#D4A84C]" : c.tier === "Silver" ? "bg-gray-400" : "bg-amber-700"}`}>{c.tier}</Badge></td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{c.advisor}</td>
                  </tr>
                ))}
                {matched.length === 0 && <tr><td colSpan="7" className="py-8 text-center text-muted-foreground text-sm">No clients match this segment</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
};

export default ClientSegmentations;
