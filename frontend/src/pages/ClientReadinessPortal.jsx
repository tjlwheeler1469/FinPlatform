// Client Readiness Portal — MOBILE-FIRST, READ-ONLY.
// The client's own window into their retirement readiness. No editing, no adviser tools.
// Everything stacks single-column by default; expands on tablet+.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Target, TrendingUp, Shield, Sparkles, Clock, MessageSquare,
  ChevronRight, CheckCircle2, DollarSign, Activity, Calendar, ArrowLeft,
} from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { computeReadinessCached } from "@/engine/readinessCache";
import { whatMovesTheNeedle, riskPanel } from "@/engine/retirementReadinessEngine";
import { evaluateRules } from "@/engine/rulesEngine";
import ReadinessDial from "@/components/readiness/ReadinessDial";
import NumberRoll from "@/components/ui/NumberRoll";

const API = process.env.REACT_APP_BACKEND_URL;

const fmtMoney = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

const CLASSIFICATION_STYLES = {
  Strong:     { bg: "bg-emerald-50",  text: "text-emerald-700",  ring: "ring-emerald-200",  dot: "bg-emerald-500" },
  "On Track": { bg: "bg-sky-50",      text: "text-sky-700",      ring: "ring-sky-200",      dot: "bg-sky-500" },
  Watchlist:  { bg: "bg-amber-50",    text: "text-amber-700",    ring: "ring-amber-200",    dot: "bg-amber-500" },
  "At Risk":  { bg: "bg-rose-50",     text: "text-rose-700",     ring: "ring-rose-200",     dot: "bg-rose-500" },
};

const ClientReadinessPortal = () => {
  const navigate = useNavigate();
  const clientId = getActiveClientId() || "thompson_family";
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  const readiness = useMemo(() => computeReadinessCached(clientId, client, { numSims: 200 }), [clientId, client]);
  const rules = useMemo(() => evaluateRules(client, readiness), [client, readiness]);
  const risks = useMemo(() => riskPanel(client), [client]);
  const topActions = useMemo(() => whatMovesTheNeedle(client), [client]);

  // ── "Show me in N years" read-only projection ──
  const currentAge = client.retirement?.current_age || 50;
  const retireAge = client.retirement?.retirement_age || 67;
  const maxOffset = Math.min(15, retireAge - currentAge);
  const [yearOffset, setYearOffset] = useState(0);

  // Compute the projected scenario: age forward by `offset` years, preserve inputs.
  // We simulate by aging the client (shrinking years-to-retirement, shrinking contribution window).
  const projectedReadiness = useMemo(() => {
    if (yearOffset === 0) return readiness;
    const projClient = {
      ...client,
      retirement: {
        ...client.retirement,
        current_age: Math.min(currentAge + yearOffset, retireAge),
      },
      // Rough asset growth: compound at expected real return 5%
      assets: (client.assets || []).map((a) => ({ ...a, value: (a.value || 0) * Math.pow(1.05, yearOffset) })),
    };
    return computeReadinessCached(`${clientId}:fwd${yearOffset}`, projClient, { numSims: 150 });
  }, [clientId, client, readiness, yearOffset, currentAge, retireAge]);

  const scoreDelta = projectedReadiness.score - readiness.score;
  const incomeDelta = projectedReadiness.outcome.sustainableIncome - readiness.outcome.sustainableIncome;

  // Recent adviser activity for this client (compliance trail — read-only view)
  const [trail, setTrail] = useState([]);
  useEffect(() => {
    if (!API) return;
    fetch(`${API}/api/compliance-audit/adviser-actions?client_id=${encodeURIComponent(clientId)}&limit=5`)
      .then((r) => r.ok ? r.json() : { actions: [] })
      .then((d) => setTrail(d.actions || []))
      .catch(() => {});
  }, [clientId]);

  const classStyle = CLASSIFICATION_STYLES[readiness.classification?.label] || CLASSIFICATION_STYLES["On Track"];
  const yearsToRetire = Math.max(0, (client.retirement?.retirement_age || 67) - (client.retirement?.current_age || 50));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16" data-testid="client-readiness-portal">
      {/* ── Sticky mobile-friendly top bar ── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/client-portal")} className="p-1 h-auto" data-testid="portal-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Your retirement readiness</p>
            <p className="text-sm font-semibold text-[#1a2744] truncate">{client.profile?.name?.split(" ")[0] || "Welcome"}</p>
          </div>
          <Badge variant="outline" className={`text-[10px] ${classStyle.bg} ${classStyle.text} border-0`}>
            {readiness.classification?.label}
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-5">
        {/* ── Hero — big dial ── */}
        <Card className="overflow-hidden border-0 shadow-sm" data-testid="portal-hero">
          <div className="bg-gradient-to-br from-[#0f1d35] to-[#1a2744] p-6 text-white text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-3">Retirement Readiness Score</p>
            <div className="flex justify-center">
              <ReadinessDial score={readiness.score} size={200} testId="portal-dial" />
            </div>
            <p className="mt-3 text-xs text-white/70">
              <span className={`inline-block w-2 h-2 rounded-full ${classStyle.dot} mr-1.5`} />
              You are classified <b className="text-white">{readiness.classification?.label}</b>
            </p>
            <p className="mt-1 text-[11px] text-white/60">
              {yearsToRetire > 0
                ? `${yearsToRetire} year${yearsToRetire === 1 ? "" : "s"} until retirement at age ${client.retirement?.retirement_age || 67}`
                : "You're ready to retire"}
            </p>
          </div>
        </Card>

        {/* ── "Show me in N years" interactive preview ── */}
        {maxOffset > 0 && (
          <Card data-testid="portal-future-slider" className="border-[#D4A84C]/40">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#D4A84C]" />
                    <p className="text-sm font-semibold text-[#1a2744]">Show me in {yearOffset === 0 ? "N" : yearOffset} year{yearOffset === 1 ? "" : "s"}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Drag the slider to see where you're headed. Nothing changes for your plan.</p>
                </div>
                {yearOffset > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[11px] h-7"
                    onClick={() => setYearOffset(0)}
                    data-testid="portal-future-reset"
                  >
                    Today
                  </Button>
                )}
              </div>

              <div className="px-1 pt-2">
                <Slider
                  value={[yearOffset]}
                  min={0}
                  max={maxOffset}
                  step={1}
                  onValueChange={(v) => setYearOffset(v[0])}
                  data-testid="portal-future-slider-input"
                />
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>Today · age {currentAge}</span>
                  <span className="font-semibold text-[#D4A84C]">+{yearOffset}yr · age {currentAge + yearOffset}</span>
                  <span>Retire · age {retireAge}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-lg border bg-slate-50/40" data-testid="portal-future-score">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Projected score</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <NumberRoll value={projectedReadiness.score} className="text-xl font-bold tabular-nums text-[#1a2744]" />
                    <span className="text-[10px] text-muted-foreground">/100</span>
                  </div>
                  {yearOffset > 0 && (
                    <span className={`text-[10px] font-semibold tabular-nums ${scoreDelta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {scoreDelta >= 0 ? "+" : ""}{scoreDelta} pts
                    </span>
                  )}
                </div>
                <div className="p-2.5 rounded-lg border bg-slate-50/40" data-testid="portal-future-income">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Projected income /yr</p>
                  <NumberRoll
                    value={projectedReadiness.outcome.sustainableIncome}
                    format={fmtMoney}
                    className="text-xl font-bold tabular-nums text-emerald-700"
                  />
                  {yearOffset > 0 && (
                    <span className={`text-[10px] font-semibold tabular-nums ${incomeDelta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {incomeDelta >= 0 ? "+" : ""}{fmtMoney(incomeDelta)}
                    </span>
                  )}
                </div>
              </div>

              {yearOffset > 0 && (
                <p className="text-[11px] text-muted-foreground italic border-t pt-2">
                  ▸ Based on current plan growing at ~5% real return. Actual outcomes vary — this is for context only.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Outcome tiles — stacked, 2-col on md+ ── */}
        <div className="grid grid-cols-2 gap-3" data-testid="portal-outcomes">
          <OutcomeTile
            icon={DollarSign} label="Income /yr"
            value={readiness.outcome.sustainableIncome} isMoney
            tone="emerald"
            sub={`across ${readiness.outcome.yearsSustainability} years`}
          />
          <OutcomeTile
            icon={Target} label="Success probability"
            value={readiness.outcome.probabilityOfSuccess} suffix="%"
            tone={readiness.outcome.probabilityOfSuccess >= 80 ? "emerald" : readiness.outcome.probabilityOfSuccess >= 60 ? "amber" : "rose"}
            sub="across 300 simulations"
          />
          <OutcomeTile
            icon={Shield} label={readiness.outcome.fundingGap > 0 ? "Funding gap" : "Surplus"}
            value={Math.abs(readiness.outcome.fundingGap)} isMoney
            tone={readiness.outcome.fundingGap > 0 ? "rose" : "emerald"}
            sub="required to fund plan"
          />
          <OutcomeTile
            icon={Clock} label="Years sustainable"
            value={readiness.outcome.yearsSustainability}
            tone="sky"
            sub={`to age ${client.retirement?.life_expectancy || 92}`}
          />
        </div>

        {/* ── Factor breakdown ── */}
        <Card data-testid="portal-factors">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1a2744]">The 5 things that decide your score</p>
                <p className="text-[11px] text-muted-foreground">Each factor is weighted. Tap-hold for what it means.</p>
              </div>
              <Sparkles className="h-4 w-4 text-[#D4A84C]" />
            </div>
            <div className="space-y-2.5">
              {readiness.factors.map((f) => (
                <div key={f.id} data-testid={`portal-factor-${f.id}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#1a2744]">{f.label}</span>
                      <Badge variant="outline" className="text-[9px]">{Math.round(f.weight)}%</Badge>
                    </div>
                    <NumberRoll value={f.score} className="text-xs font-bold tabular-nums text-[#1a2744]" />
                  </div>
                  <Progress value={f.score} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── What would lift your score ── */}
        <Card data-testid="portal-actions">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[#D4A84C]" />
              <p className="text-sm font-semibold text-[#1a2744]">What would lift your score</p>
            </div>
            <div className="space-y-2">
              {topActions.slice(0, 3).map((a, i) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/60 border" data-testid={`portal-action-${a.id}`}>
                  <div className="w-7 h-7 rounded-full bg-[#1a2744] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1a2744] leading-snug">{a.label}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      {a.uplift >= 0 ? "+" : ""}{a.uplift} pts · projected score {a.score}
                    </p>
                  </div>
                </div>
              ))}
              {topActions.length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-4">You're already maximised — nice work.</p>
              )}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-[#D4A84C]/10 border border-[#D4A84C]/30">
              <p className="text-[11px] text-[#7a5d1f] mb-2">
                These are suggestions based on your data. Any change needs a chat with your adviser first.
              </p>
              <Button
                size="sm"
                className="w-full bg-[#1a2744] hover:bg-[#0f1d35] gap-1.5 text-xs"
                onClick={() => navigate("/client-portal?tab=msgs")}
                data-testid="portal-book-chat"
              >
                <MessageSquare className="h-3 w-3" /> Discuss with your adviser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Key risks (read-only) ── */}
        {risks.length > 0 && (
          <Card data-testid="portal-risks">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-[#D4A84C]" />
                <p className="text-sm font-semibold text-[#1a2744]">Key risks we watch for you</p>
              </div>
              <div className="space-y-2">
                {risks.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 rounded border bg-white" data-testid={`portal-risk-${r.id}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      r.level === "high" ? "bg-rose-500" :
                      r.level === "medium" ? "bg-amber-500" :
                      "bg-emerald-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1a2744]">{r.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.message}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px]">{r.level}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Recent adviser activity ── */}
        <Card data-testid="portal-activity">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#D4A84C]" />
                <p className="text-sm font-semibold text-[#1a2744]">Recent activity on your plan</p>
              </div>
              <Badge variant="outline" className="text-[10px]">transparent</Badge>
            </div>
            {trail.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-4">No recent activity — your adviser will reach out when action is required.</p>
            ) : (
              <div className="space-y-2">
                {trail.map((a) => (
                  <div key={a.action_id} className="flex items-start gap-2 p-2.5 rounded border bg-white" data-testid={`portal-activity-${a.action_id}`}>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-[#1a2744]">{friendlyAction(a.action)}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{a.headline || "—"}</p>
                      <p className="text-[9px] text-muted-foreground">{new Date(a.timestamp).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Footer reassurance ── */}
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground">
              Your plan is monitored continuously. If anything material changes, your adviser will contact you.
            </p>
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Last computed {new Date().toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ── Subcomponent — outcome tile ──
const OutcomeTile = ({ icon: Icon, label, value, suffix, isMoney, tone, sub }) => {
  const toneMap = {
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
    sky: "text-sky-700",
    navy: "text-[#1a2744]",
  };
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className={`h-3 w-3 ${toneMap[tone] || toneMap.navy}`} />
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
        <NumberRoll
          value={value}
          className={`text-lg font-bold tabular-nums ${toneMap[tone] || toneMap.navy}`}
          format={(v) => isMoney ? fmtMoney(v) : (Math.round(v).toString() + (suffix || ""))}
        />
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
};

// ── Human-friendly action label ──
const friendlyAction = (a) => {
  switch (a) {
    case "simulate": return "Ran a scenario simulation";
    case "apply": return "Queued a strategy for your plan";
    case "generate": return "Drafted strategy advice";
    case "generate_approved": return "Approved new advice memo";
    case "notify": return "Sent you an update";
    default: return a || "Activity";
  }
};

export default ClientReadinessPortal;
