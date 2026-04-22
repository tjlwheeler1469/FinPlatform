// Actions Shipped Report — weekly adviser activity widget.
// "Did we actually move the needle this week?"
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, CheckCircle2, Bell, Users, DollarSign, RefreshCw, Loader2, TrendingUp, TrendingDown } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const fmtMoney = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

const WINDOWS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
];

const ActionsShippedReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [windowDays, setWindowDays] = useState(7);

  const load = async (days = windowDays) => {
    if (!API) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/reports/actions-shipped?days=${days}`);
      if (r.ok) setReport(await r.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(windowDays); /* eslint-disable-next-line */ }, [windowDays]);

  const t = report?.totals || {};
  const d = report?.delta_wow || {};
  const daily = report?.daily || [];
  const maxDaily = Math.max(1, ...daily.map((x) => x.actions || 0));

  return (
    <Card data-testid="actions-shipped-report">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-[#D4A84C]" /> Actions Shipped
            </CardTitle>
            <CardDescription>Did this adviser/book actually move the needle this week?</CardDescription>
          </div>
          <div className="flex items-center gap-1.5" data-testid="actions-shipped-windows">
            {WINDOWS.map((w) => (
              <Button
                key={w.days}
                size="sm"
                variant={windowDays === w.days ? "default" : "outline"}
                className={`h-7 text-[11px] ${windowDays === w.days ? "bg-[#1a2744]" : ""}`}
                onClick={() => setWindowDays(w.days)}
                data-testid={`actions-window-${w.days}`}
              >
                {w.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => load(windowDays)}
              disabled={loading}
              className="h-7 px-2"
              data-testid="actions-refresh"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2" data-testid="actions-kpis">
          <Kpi icon={Zap}           label="Simulations"        value={t.simulations}            delta={d.simulations_pct} />
          <Kpi icon={CheckCircle2}  label="Strategies applied" value={t.strategies_applied}     delta={d.strategies_applied_pct} />
          <Kpi icon={Trophy}        label="Drafts approved"    value={t.advice_drafts_approved} delta={d.advice_drafts_approved_pct} />
          <Kpi icon={Bell}          label="Clients notified"   value={t.clients_notified}       delta={d.clients_notified_pct} />
        </div>

        {/* Secondary row */}
        <div className="grid grid-cols-3 gap-2 text-xs" data-testid="actions-secondary">
          <SecondaryKpi icon={Users} label="Clients touched" value={t.unique_clients_touched} />
          <SecondaryKpi icon={DollarSign} label="$ impact approved" value={fmtMoney(t.dollar_impact_approved)} />
          <SecondaryKpi icon={Zap} label="Readiness computes" value={t.readiness_computes} />
        </div>

        {/* Daily sparkline */}
        <div data-testid="actions-sparkline">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Daily activity · last {windowDays} days</p>
          <div className="flex items-end gap-1 h-16">
            {daily.map((day) => {
              const h = Math.max(3, Math.round((day.actions / maxDaily) * 56));
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5 group">
                  <div
                    className="w-full rounded-t bg-[#1a2744] hover:bg-[#D4A84C] transition-colors"
                    style={{ height: `${h}px` }}
                    title={`${day.date}: ${day.actions} actions`}
                  />
                  <span className="text-[8px] text-muted-foreground group-hover:text-[#1a2744]">
                    {new Date(day.date).toLocaleDateString("en-AU", { weekday: "short" })[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {t.simulations === 0 && t.strategies_applied === 0 && t.advice_drafts_approved === 0 && t.clients_notified === 0 && (
          <p className="text-[11px] text-center text-muted-foreground py-3 bg-amber-50/60 rounded border border-amber-200" data-testid="actions-empty">
            No adviser actions recorded in this window yet — the report will fill as you use the Intelligence Feed.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// ── KPI tile ──
const Kpi = ({ icon: Icon, label, value, delta }) => {
  const hasDelta = typeof delta === "number" && isFinite(delta);
  const up = (delta || 0) > 0;
  const color = !hasDelta || delta === 0 ? "text-muted-foreground" : up ? "text-emerald-700" : "text-rose-700";
  return (
    <div className="p-3 rounded-lg border bg-white">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-xl font-bold text-[#1a2744] tabular-nums">{value || 0}</span>
        {hasDelta && delta !== 0 && (
          <span className={`flex items-center text-[10px] font-semibold tabular-nums ${color}`}>
            {up ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
            {up ? "+" : ""}{delta}% WoW
          </span>
        )}
      </div>
    </div>
  );
};

const SecondaryKpi = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 p-2 rounded border bg-slate-50/40">
    <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-bold text-[#1a2744] tabular-nums">{value ?? "—"}</p>
    </div>
  </div>
);

export default ActionsShippedReport;
