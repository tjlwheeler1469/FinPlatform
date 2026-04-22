// Compliance Trail — shows the last readiness events + adviser actions for a client.
// Turns the audit log into a client-visible trust artefact.
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileClock, RefreshCw, Shield, Loader2 } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  } catch { return iso; }
};

const ComplianceTrail = ({ clientId }) => {
  const [events, setEvents] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!API || !clientId) return;
    setLoading(true);
    try {
      const [re, ae] = await Promise.all([
        fetch(`${API}/api/compliance-audit/readiness-events?client_id=${encodeURIComponent(clientId)}&limit=15`).then((r) => r.json()).catch(() => ({ events: [] })),
        fetch(`${API}/api/compliance-audit/adviser-actions?client_id=${encodeURIComponent(clientId)}&limit=15`).then((r) => r.json()).catch(() => ({ actions: [] })),
      ]);
      setEvents(re.events || []);
      setActions(ae.actions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clientId]);

  // Merge + sort events for a unified timeline
  const timeline = [
    ...events.map((e) => ({ type: "readiness", at: e.timestamp, title: `Readiness score computed: ${e.score}/100 (${e.classification})`, meta: `${e.num_sims || 0} sims · actor: ${e.actor || "system"}`, id: e.event_id })),
    ...actions.map((a) => ({ type: "action", at: a.timestamp, title: `Adviser action: ${a.action}`, meta: `${a.headline || ""} · by ${a.actor}`, id: a.action_id })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <Card data-testid="compliance-trail">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-[#D4A84C]" /> 7 · Compliance Trail
            </CardTitle>
            <CardDescription>Every readiness compute + adviser action is audit-logged. Regulator-ready.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-7 gap-1 text-[11px]" data-testid="trail-refresh">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-2">
          <div className="space-y-2" data-testid="trail-list">
            {timeline.length === 0 && !loading && (
              <p className="text-xs text-center text-muted-foreground py-8">No events yet — interact with the Decision Hub or generate advice to populate the trail.</p>
            )}
            {timeline.map((t) => (
              <div key={`${t.type}-${t.id}`} className="flex items-start gap-3 p-2.5 rounded border bg-white" data-testid={`trail-${t.type}-${t.id}`}>
                <div className="mt-0.5">
                  <FileClock className={`h-3.5 w-3.5 ${t.type === "action" ? "text-[#D4A84C]" : "text-slate-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[9px] ${t.type === "action" ? "bg-[#D4A84C]/10 border-[#D4A84C]/40 text-[#7a5d1f]" : "bg-slate-100 text-slate-700"}`}>
                      {t.type === "action" ? "Adviser" : "Readiness"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{fmtTime(t.at)}</span>
                  </div>
                  <p className="text-xs font-medium text-[#1a2744] mt-0.5">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground">{t.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ComplianceTrail;
