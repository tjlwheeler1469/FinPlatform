// DealsPipeline — kanban-style board for the practice's advice workflow.
// Each Deal is a first-class CRM entity tied to a client, with a tracked
// lifecycle stage. Cards show value, age, linked artefacts, and let advisers
// transition stages with a single click.
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, ChevronRight, RefreshCw, PlusCircle, Clock, CheckCircle2,
  FileText, Pencil, Archive, XCircle, Link as LinkIcon,
} from "lucide-react";
import { fmtCurrencyCompact } from "@/lib/inputBounds";

const API = process.env.REACT_APP_BACKEND_URL;
const FS = fmtCurrencyCompact;

const STAGES = [
  { id: "draft",     label: "Draft",      icon: Pencil,        accent: "border-slate-300 bg-slate-50",        next: "review" },
  { id: "review",    label: "In Review",  icon: Clock,         accent: "border-amber-300 bg-amber-50",        next: "signed" },
  { id: "signed",    label: "Signed",     icon: CheckCircle2,  accent: "border-emerald-300 bg-emerald-50",    next: "executed" },
  { id: "executed",  label: "Executed",   icon: FileText,      accent: "border-violet-300 bg-violet-50",      next: "archived" },
  { id: "archived",  label: "Archived",   icon: Archive,       accent: "border-stone-300 bg-stone-50",        next: null },
  { id: "lost",      label: "Lost",       icon: XCircle,       accent: "border-rose-300 bg-rose-50",          next: null },
];

const ageOf = (iso) => {
  const ms = new Date() - new Date(iso);
  const d = Math.floor(ms / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "1 day";
  if (d < 30) return `${d} days`;
  return `${Math.floor(d / 30)} mo`;
};

const DealCard = ({ deal, onAdvance, onChangeStage }) => {
  const stage = STAGES.find((s) => s.id === deal.stage) || STAGES[0];
  const Icon = stage.icon;
  return (
    <div className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow" data-testid={`deal-${deal.deal_id}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-semibold text-[#1a2744] leading-tight truncate flex-1">{deal.title}</p>
        <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
      </div>
      <p className="text-[10px] text-muted-foreground mb-2 truncate">{deal.client_name || deal.client_id}</p>
      <div className="flex items-center gap-2 flex-wrap text-[10px] mb-2">
        <Badge variant="outline" className="text-[9px]">{deal.deal_type}</Badge>
        {deal.expected_value > 0 && <Badge variant="outline" className="text-[9px] bg-emerald-50 border-emerald-300 text-emerald-800">{FS(deal.expected_value)}</Badge>}
        {deal.links && deal.links.length > 0 && (
          <Badge variant="outline" className="text-[9px] gap-1"><LinkIcon className="h-2.5 w-2.5" />{deal.links.length}</Badge>
        )}
        <span className="text-muted-foreground">{ageOf(deal.created_at)}</span>
      </div>
      <div className="flex gap-1.5">
        {stage.next && (
          <Button size="sm" variant="outline" onClick={() => onAdvance(deal)} className="h-6 text-[10px] flex-1" data-testid={`advance-${deal.deal_id}`}>
            <ChevronRight className="h-3 w-3 mr-0.5" /> {STAGES.find((s) => s.id === stage.next).label}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onChangeStage(deal)} className="h-6 text-[10px] px-2" data-testid={`change-${deal.deal_id}`}>
          Stage
        </Button>
      </div>
    </div>
  );
};

const StageColumn = ({ stage, deals, onAdvance, onChangeStage }) => {
  const Icon = stage.icon;
  const totalValue = deals.reduce((s, d) => s + (d.expected_value || 0), 0);
  return (
    <div className={`flex flex-col border-l-4 rounded-l ${stage.accent} min-w-[260px] flex-shrink-0`} data-testid={`column-${stage.id}`}>
      <div className="p-3 border-b">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="h-3.5 w-3.5" />
          <p className="text-sm font-semibold text-[#1a2744]">{stage.label}</p>
          <Badge variant="outline" className="text-[9px] ml-auto">{deals.length}</Badge>
        </div>
        {totalValue > 0 && <p className="text-[10px] text-muted-foreground">Pipeline: {FS(totalValue)}</p>}
      </div>
      <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)]">
        {deals.length === 0 && <p className="text-[10px] text-muted-foreground italic text-center py-4">No deals here</p>}
        {deals.map((d) => <DealCard key={d.deal_id} deal={d} onAdvance={onAdvance} onChangeStage={onChangeStage} />)}
      </div>
    </div>
  );
};

const DealsPipeline = () => {
  const [deals, setDeals] = useState([]);
  const [summary, setSummary] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([
        fetch(`${API}/api/deals?limit=200`).then((r) => r.json()),
        fetch(`${API}/api/deals/pipeline/summary`).then((r) => r.json()),
      ]);
      setDeals(d.deals || []);
      setSummary(s);
    } catch (e) {
      toast.error("Failed to load deals", { description: String(e).slice(0, 200) });
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const seedDemoDeal = async () => {
    try {
      const titles = [
        ["draft", "soa", "Q2 2026 SOA refresh — investment property review"],
        ["review", "implementation_pack", "Implementation Pack — Thompson rebalance"],
        ["signed", "roa", "ROA — top up concessional contributions"],
        ["executed", "rebalance", "Multi-leg rebalance — settled"],
      ];
      const [stage, dt, title] = titles[Math.floor(Math.random() * titles.length)];
      const r = await fetch(`${API}/api/deals`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: "thompson_family", client_name: "David & Sarah Thompson",
          deal_type: dt, title, expected_value: Math.round(Math.random() * 9000) + 1000,
        }),
      });
      if (!r.ok) throw new Error("create failed");
      const created = await r.json();
      if (stage !== "draft") {
        await fetch(`${API}/api/deals/${created.deal_id}/stage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_stage: stage, reason: "demo seed" }),
        });
      }
      await refresh();
      toast.success("Demo deal seeded");
    } catch (e) { toast.error("Seed failed"); }
  };

  const advanceStage = async (deal) => {
    const stage = STAGES.find((s) => s.id === deal.stage);
    if (!stage?.next) return;
    try {
      const r = await fetch(`${API}/api/deals/${deal.deal_id}/stage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_stage: stage.next }),
      });
      if (!r.ok) throw new Error("transition failed");
      toast.success(`${deal.title.slice(0, 40)}… → ${STAGES.find((s) => s.id === stage.next).label}`);
      await refresh();
    } catch (e) { toast.error("Stage change failed"); }
  };

  const changeStageManually = async (deal) => {
    const choice = window.prompt(
      `Move "${deal.title}" to which stage?\n${STAGES.map((s) => s.id).join(" | ")}`,
      deal.stage,
    );
    if (!choice || !STAGES.find((s) => s.id === choice)) return;
    try {
      const r = await fetch(`${API}/api/deals/${deal.deal_id}/stage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_stage: choice }),
      });
      if (!r.ok) throw new Error();
      await refresh();
      toast.success(`Stage changed to ${choice}`);
    } catch { toast.error("Stage change failed"); }
  };

  return (
    <Layout>
      <div className="max-w-[1800px] mx-auto p-4 space-y-4" data-testid="deals-pipeline">
        <Card>
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
            <Briefcase className="h-6 w-6 text-[#1a2744]" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#1a2744]">Deals Pipeline</h1>
              <p className="text-xs text-muted-foreground">
                CRM-grade tracking of every advice engagement · {summary?.total_count ?? 0} deals · {FS(summary?.total_value ?? 0)} total pipeline value
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={seedDemoDeal} data-testid="seed-demo-deal"><PlusCircle className="h-3.5 w-3.5 mr-1" /> Seed demo</Button>
            <Button variant="outline" size="sm" onClick={refresh} data-testid="refresh-pipeline"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh</Button>
          </CardContent>
        </Card>

        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((s) => (
            <StageColumn
              key={s.id}
              stage={s}
              deals={deals.filter((d) => d.stage === s.id)}
              onAdvance={advanceStage}
              onChangeStage={changeStageManually}
            />
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground italic text-center">
          Implementation Packs auto-create a Deal in the <strong>review</strong> stage. Each Deal links its PDF, notification, execution tickets and Xmerge push for full audit.
        </p>
      </div>
    </Layout>
  );
};

export default DealsPipeline;
