// Retirement Control Center — the new adviser home. Retirement-first decision intelligence.
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Target, AlertTriangle, ChevronRight,
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

const RetirementControlCenter = () => {
  const navigate = useNavigate();
  const book = useMemo(() => buildBook(), []);
  const feed = useMemo(() => buildIntelligenceFeed(book), [book]);
  const priority = useMemo(() => rankPriorityClients(book), [book]);

  const openClient = (id) => {
    localStorage.setItem("selected_client", JSON.stringify({ id }));
    navigate(`/dashboard`);
  };

  return (
    <Layout>
      <PageShell
        eyebrow="ADVISER · RETIREMENT FIRST"
        title="Control Center"
        accent="every screen answers what to do next"
        subtitle="Retirement-first decision intelligence for the entire book. Score, shortfall, and the single highest-impact next action — for every household."
        meta={`LIVE · ${book.clients.length} households tracked`}
        metrics={[
          { label: "On track", value: `${book.kpis.onTrackPct}%`, hint: `${book.clients.filter((c) => c.readiness.score >= 75).length} / ${book.clients.length} ≥ 75` },
          { label: "At risk", value: `${book.kpis.atRiskPct}%`, hint: `${book.clients.filter((c) => c.readiness.score < 60).length} below 60` },
          { label: "Shortfall", value: fmt(book.kpis.totalShortfall), hint: "Total funding gap" },
          { label: "Opportunity", value: fmt(book.kpis.totalOpportunityValue), hint: "Ranked open value" },
        ]}
      >
        <div className="space-y-6" data-testid="retirement-control-center">
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
      </PageShell>
    </Layout>
  );
};

export default RetirementControlCenter;
