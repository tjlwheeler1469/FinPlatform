// Retirement Control Center — the new adviser home. Retirement-first decision intelligence.
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Target, TrendingDown, AlertTriangle, Sparkles, ChevronRight,
  Users, Activity, Gauge,
} from "lucide-react";
import { buildBook, buildIntelligenceFeed, rankPriorityClients } from "@/engine/bookAggregator";
import IntelligenceFeed from "@/components/intelligence/IntelligenceFeed";
import ActionsShippedReport from "@/components/intelligence/ActionsShippedReport";

const fmt = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

const KpiCard = ({ icon: Icon, label, value, sub, tone = "navy", testId }) => {
  const toneClasses = {
    navy: "bg-[#0f1d35] text-white",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
    gold: "bg-[#D4A84C]/10 text-[#7a5d1f] border-[#D4A84C]/30",
  };
  return (
    <Card className={`border ${toneClasses[tone]}`} data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider opacity-80">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <p className="text-3xl font-bold mt-1 tabular-nums">{value}</p>
        {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
};

const RetirementControlCenter = () => {
  const navigate = useNavigate();
  const book = useMemo(() => buildBook(), []);
  const feed = useMemo(() => buildIntelligenceFeed(book), [book]);
  const priority = useMemo(() => rankPriorityClients(book), [book]);

  const openClient = (id) => {
    localStorage.setItem("selected_client", JSON.stringify({ id }));
    navigate(`/client-360?id=${id}`);
  };

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto p-4 space-y-5" data-testid="retirement-control-center">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <Gauge className="h-6 w-6 text-[#D4A84C]" /> Retirement Control Center
            </h1>
            <p className="text-xs text-muted-foreground">Every screen answers: what should this adviser/client do next to improve retirement outcomes?</p>
          </div>
          <Badge variant="outline" className="bg-[#D4A84C]/10 border-[#D4A84C]/40 text-[#7a5d1f]">
            <Activity className="h-3 w-3 mr-1" /> Live · {book.clients.length} clients
          </Badge>
        </div>

        {/* ── Book Overview KPI strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="book-overview-kpis">
          <KpiCard icon={Users} label="On Track" value={`${book.kpis.onTrackPct}%`} sub={`${book.clients.filter((c) => c.readiness.score >= 75).length} / ${book.clients.length} clients ≥ 75`} tone="emerald" testId="kpi-on-track" />
          <KpiCard icon={AlertTriangle} label="At Risk" value={`${book.kpis.atRiskPct}%`} sub={`${book.clients.filter((c) => c.readiness.score < 60).length} clients below 60`} tone="rose" testId="kpi-at-risk" />
          <KpiCard icon={TrendingDown} label="Total Shortfall" value={fmt(book.kpis.totalShortfall)} sub="Sum of funding gaps across book" tone="amber" testId="kpi-shortfall" />
          <KpiCard icon={Gauge} label="Avg Readiness" value={`${book.kpis.avgScore}`} sub="0–100 composite" tone="navy" testId="kpi-avg-score" />
          <KpiCard icon={Sparkles} label="Opportunity Value" value={fmt(book.kpis.totalOpportunityValue)} sub="Ranked opportunities open" tone="gold" testId="kpi-opportunity" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Intelligence Feed — Mission Control ── */}
          <IntelligenceFeed feed={feed} />

          {/* ── Priority Clients ── */}
          <Card data-testid="priority-clients">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-[#D4A84C]" /> Priority Clients
              </CardTitle>
              <CardDescription>Top {priority.length} ranked by risk · opportunity · urgency</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-2">
                <div className="space-y-2">
                  {priority.map((p, idx) => {
                    const cls = p.readiness.classification;
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-lg border hover:border-[#1a2744]/40 cursor-pointer transition-colors"
                        onClick={() => openClient(p.id)}
                        data-testid={`priority-${p.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#1a2744]/10 text-[#1a2744] text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-[#1a2744] truncate">{p.name}</p>
                              <span className="text-lg font-bold tabular-nums" style={{ color: cls.color }}>{p.readiness.score}</span>
                            </div>
                            <Badge variant="outline" className="text-[9px] mt-1" style={{ backgroundColor: `${cls.color}15`, color: cls.color, borderColor: `${cls.color}40` }}>{cls.label}</Badge>
                            {p.topOpportunity && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2"><span className="font-medium text-amber-700">→</span> {p.topOpportunity.title}</p>}
                            {!p.topOpportunity && p.alerts[0] && <p className="text-xs text-rose-600 mt-1.5 line-clamp-2"><AlertTriangle className="h-3 w-3 inline mr-1" />{p.alerts[0].title}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* ── Client List (sortable) ── */}
        <Card data-testid="client-list">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Clients · Retirement View</CardTitle>
            <CardDescription>Sorted by readiness score, ascending</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">Score</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-right py-2 px-2">Retirement Income</th>
                  <th className="text-right py-2 px-2">Shortfall</th>
                  <th className="text-left py-2 px-2">Top Opportunity</th>
                  <th className="text-right py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {[...book.clients].sort((a, b) => a.readiness.score - b.readiness.score).map((c) => {
                  const cls = c.readiness.classification;
                  return (
                    <tr key={c.id} className="border-b hover:bg-muted/40 cursor-pointer" onClick={() => openClient(c.id)} data-testid={`client-row-${c.id}`}>
                      <td className="py-2.5 px-2 font-medium text-[#1a2744]">{c.name}</td>
                      <td className="py-2.5 px-2 font-bold tabular-nums" style={{ color: cls.color }}>{c.readiness.score}</td>
                      <td className="py-2.5 px-2">
                        <Badge variant="outline" className="text-[9px]" style={{ backgroundColor: `${cls.color}15`, color: cls.color, borderColor: `${cls.color}40` }}>{cls.label}</Badge>
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{fmt(c.readiness.outcome.sustainableIncome)}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-rose-600">{c.readiness.outcome.fundingGap > 0 ? fmt(c.readiness.outcome.fundingGap) : "—"}</td>
                      <td className="py-2.5 px-2 text-xs text-muted-foreground max-w-xs truncate">{c.topOpportunity?.title || "—"}</td>
                      <td className="py-2.5 px-2 text-right"><Button size="sm" variant="ghost" className="h-7"><ChevronRight className="h-4 w-4" /></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* ── Actions Shipped Report ── */}
        <ActionsShippedReport />
      </div>
    </Layout>
  );
};

export default RetirementControlCenter;
