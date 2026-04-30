// Intelligence Feed — mission control for advisers.
// Ranked, categorised, quantified decision items with one-click actions.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap, Sparkles, AlertTriangle, Target, Activity, Users,
  ChevronRight, Send, CheckCircle2, FileText, Play,
} from "lucide-react";
import { groupFeedByCategory, CATEGORY_META } from "@/engine/bookAggregator";
import { CLIENT_DATA } from "@/data/clientData";
import AdviceDraftModal from "@/components/intelligence/AdviceDraftModal";

const API = process.env.REACT_APP_BACKEND_URL;

const ICONS = {
  sparkles: Sparkles,
  "alert-triangle": AlertTriangle,
  target: Target,
  activity: Activity,
  users: Users,
};

const URGENCY_STYLES = {
  NOW:     { bg: "bg-rose-600",  fg: "text-white", pulse: "animate-pulse" },
  SOON:    { bg: "bg-amber-500", fg: "text-white", pulse: "" },
  MONITOR: { bg: "bg-slate-500", fg: "text-white", pulse: "" },
};

const fmtMoney = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  if (abs > 0) return `$${Math.round(v)}`;
  return "—";
};

const logLocalAction = (actionId, item, extra = {}) => {
  // Fire-and-forget persistence to Mongo-backed audit log; local fallback for resilience.
  try {
    const log = JSON.parse(localStorage.getItem("adviser_action_log") || "[]");
    log.unshift({ at: new Date().toISOString(), action: actionId, itemId: item.id, clientId: item.clientId, headline: item.headline, ...extra });
    localStorage.setItem("adviser_action_log", JSON.stringify(log.slice(0, 200)));
  } catch (e) { /* ignore */ }
  if (!API) return;
  fetch(`${API}/api/compliance-audit/adviser-actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actor: "adviser",
      action: actionId,
      item_id: item.id,
      client_id: item.clientId,
      headline: item.headline,
      metadata: { category: item.category, urgency: item.urgency, impactScore: item.impactScore, ...extra },
    }),
    keepalive: true,
  }).catch(() => {});
};

const IntelligenceFeed = ({ feed }) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [adviceItem, setAdviceItem] = useState(null);

  const grouped = useMemo(() => groupFeedByCategory(feed), [feed]);

  const shown = useMemo(() => {
    if (activeCategory === "all") return feed;
    return feed.filter((f) => f.category === activeCategory);
  }, [feed, activeCategory]);

  const stats = useMemo(() => {
    const now = feed.filter((f) => f.urgency === "NOW").length;
    const totalValue = feed.reduce((s, f) => s + (f.financialImpact || 0), 0);
    const avgImpact = feed.length ? Math.round(feed.reduce((s, f) => s + f.impactScore, 0) / feed.length) : 0;
    return { now, totalValue, avgImpact };
  }, [feed]);

  const handleAction = async (actionId, item) => {
    logLocalAction(actionId, item);
    if (actionId === "simulate") {
      if (item.clientId) {
        // Activate the client in adviser context and jump straight to that
        // client's Overview page. Resolve the full client record from
        // CLIENT_DATA so the sidebar selector + header card render properly.
        const fromCatalog = CLIENT_DATA?.[item.clientId];
        const payload = {
          id: item.clientId,
          client_id: item.clientId,
          name: fromCatalog?.name || item.clientName || item.clientId,
        };
        localStorage.setItem("app_mode", "adviser");
        localStorage.setItem("selected_client", JSON.stringify(payload));
        navigate(`/dashboard`);
      } else {
        toast.info("Open a client to simulate.");
      }
    } else if (actionId === "apply") {
      // Persist an execution ticket — adviser retains full control via ticket status.
      if (!API) { toast.error("Backend unavailable"); return; }
      try {
        const res = await fetch(`${API}/api/execution/tickets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: item.clientId || "unknown",
            client_name: item.clientName || "",
            ticket_type: item.category === "portfolio" ? "rebalance" : "contribution",
            headline: item.headline,
            message: item.message,
            urgency: item.urgency,
            requested_by: "adviser",
            source_item_id: item.id,
            payload: { impactScore: item.impactScore, scoreDelta: item.scoreDelta, financialImpact: item.financialImpact },
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        toast.success("Execution ticket created", { description: `${data.ticket.ticket_id} · status: pending. Adviser retains control.` });
      } catch (e) {
        toast.error("Apply failed", { description: String(e).slice(0, 200) });
      }
    } else if (actionId === "generate") {
      // Open the AI advice modal. Adviser fully controls edit/approve/reject.
      setAdviceItem(item);
    } else if (actionId === "notify") {
      if (!API) { toast.error("Backend unavailable"); return; }
      try {
        const res = await fetch(`${API}/api/notify/client`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: item.clientId || "unknown",
            client_name: item.clientName || "",
            subject: `Strategy update: ${item.headline}`,
            body: `${item.headline}\n\n${item.message || ""}\n\n— Your adviser`,
            source_item_id: item.id,
            actor: "adviser",
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const modeLabel = data.mode === "live" ? "Email sent via Resend" : "Notification logged (Resend MOCKED — awaiting RESEND_API_KEY)";
        toast.success(`Client notified: ${item.clientName || "—"}`, { description: modeLabel });
      } catch (e) {
        toast.error("Notify failed", { description: String(e).slice(0, 200) });
      }
    }
  };

  return (
    <Card className="lg:col-span-2" data-testid="intelligence-feed">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-[#D4A84C]" /> Intelligence Feed · Mission Control
            </CardTitle>
            <CardDescription>
              What should you do right now? Top {feed.length} ranked by Impact Score.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span className="text-muted-foreground"><b className="text-rose-700 tabular-nums">{stats.now}</b> NOW</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[#D4A84C]" />
              <span className="text-muted-foreground"><b className="text-[#1a2744] tabular-nums">{fmtMoney(stats.totalValue)}</b> total $ impact</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="h-3 w-3 text-emerald-600" />
              <span className="text-muted-foreground"><b className="text-emerald-700 tabular-nums">{stats.avgImpact}</b> avg impact</span>
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5 mt-3" data-testid="feed-category-chips">
          <button
            onClick={() => setActiveCategory("all")}
            className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border transition-colors ${activeCategory === "all" ? "bg-[#1a2744] text-white border-[#1a2744]" : "bg-white text-muted-foreground border-slate-200 hover:border-slate-300"}`}
            data-testid="chip-all"
          >
            All · {feed.length}
          </button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const count = (grouped[key] || []).length;
            if (count === 0) return null;
            const active = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border transition-colors ${active ? "text-white" : "bg-white text-muted-foreground hover:border-slate-300"}`}
                style={active ? { backgroundColor: meta.accent, borderColor: meta.accent } : { borderColor: "#e2e8f0" }}
                data-testid={`chip-${key}`}
              >
                {meta.label} · {count}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="h-[640px] pr-2">
          <div className="space-y-2.5">
            {shown.map((item) => {
              const Icon = ICONS[item.icon] || Sparkles;
              const uStyle = URGENCY_STYLES[item.urgency];
              const meta = CATEGORY_META[item.category];
              const deltaPositive = item.scoreDelta >= 0;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border bg-white hover:shadow-md transition-shadow"
                  data-testid={`feed-item-${item.id}`}
                >
                  {/* Top row: impact score + urgency + category */}
                  <div className="flex items-start gap-3">
                    {/* Impact Score badge */}
                    <div
                      className="flex flex-col items-center justify-center w-14 h-14 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${meta.accent}12`, borderColor: `${meta.accent}40`, borderWidth: 1, borderStyle: "solid" }}
                    >
                      <span className="text-[9px] uppercase tracking-wider" style={{ color: meta.accent }}>Impact</span>
                      <span className="text-xl font-bold tabular-nums" style={{ color: meta.accent }}>{item.impactScore}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <Icon className="h-3.5 w-3.5" style={{ color: meta.accent }} />
                        <Badge variant="outline" className="text-[9px]" style={{ borderColor: `${meta.accent}60`, color: meta.accent }}>
                          {meta.label}
                        </Badge>
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${uStyle.bg} ${uStyle.fg} ${uStyle.pulse}`}>
                          {item.urgency}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#1a2744] leading-tight">{item.headline}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.message}</p>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-dashed border-slate-200">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Readiness Δ</p>
                      <p className={`text-sm font-bold tabular-nums ${deltaPositive ? "text-emerald-700" : "text-rose-700"}`}>
                        {deltaPositive ? "+" : ""}{item.scoreDelta}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">$ Impact</p>
                      <p className="text-sm font-bold tabular-nums text-[#1a2744]">{fmtMoney(item.financialImpact)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Confidence</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold tabular-nums text-[#1a2744]">{item.confidence}%</p>
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.confidence}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.actionHint && (
                    <p className="text-[11px] text-muted-foreground mt-2 italic">▸ {item.actionHint}</p>
                  )}

                  {/* Actions row */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {item.actions.map((a) => {
                      const isPrimary = a.id === "simulate";
                      const ActionIcon = a.id === "simulate" ? Play :
                                         a.id === "apply" ? CheckCircle2 :
                                         a.id === "generate" ? FileText :
                                         a.id === "notify" ? Send : ChevronRight;
                      return (
                        <Button
                          key={a.id}
                          size="sm"
                          variant={isPrimary ? "default" : "outline"}
                          className={`h-7 text-[11px] gap-1 ${isPrimary ? "bg-[#1a2744] hover:bg-[#0f1d35]" : ""}`}
                          onClick={() => handleAction(a.id, item)}
                          data-testid={`feed-action-${item.id}-${a.id}`}
                        >
                          <ActionIcon className="h-3 w-3" />
                          {a.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && (
              <div className="text-center py-10">
                <Sparkles className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No items in this category. Great discipline.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <AdviceDraftModal
        open={!!adviceItem}
        onOpenChange={(o) => { if (!o) setAdviceItem(null); }}
        feedItem={adviceItem}
        onApproved={(draft) => logLocalAction("generate_approved", adviceItem || { id: "", headline: draft.title }, { draft_id: draft.draft_id })}
      />
    </Card>
  );
};

export default IntelligenceFeed;
