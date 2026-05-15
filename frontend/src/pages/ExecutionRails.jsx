// ExecutionRails — Monitoring + dispatch board for advice execution tickets.
// Lists every ticket, the adapter it routes to, and lets advisers dispatch
// pending tickets through the rails (broker / super platform / insurance /
// contribution / rebalance). Each dispatch creates an audit-logged event
// trace so compliance can replay the execution history.
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { PageShell, PillButton, Tile, ChipFilter } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, RefreshCw, CheckCircle2, Clock, XCircle, Zap, Activity } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_META = {
  pending:    { color: "bg-amber-50 text-amber-700 border-amber-300",      icon: Clock },
  executing:  { color: "bg-blue-50 text-blue-700 border-blue-300",          icon: Zap },
  completed:  { color: "bg-emerald-50 text-emerald-700 border-emerald-300", icon: CheckCircle2 },
  failed:     { color: "bg-rose-50 text-rose-700 border-rose-300",          icon: XCircle },
  cancelled:  { color: "bg-slate-50 text-slate-600 border-slate-300",       icon: XCircle },
};

const StatusPill = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.pending;
  const Icon = m.icon;
  return (
    <Badge variant="outline" className={`${m.color} text-[10px] gap-1`}>
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  );
};

const ExecutionRails = () => {
  const [adapters, setAdapters] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [events, setEvents] = useState({}); // ticket_id -> events[]

  const refresh = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([
        fetch(`${API}/api/exec-rails/adapters`).then((r) => r.json()),
        fetch(`${API}/api/execution/tickets?limit=50`).then((r) => r.json()),
      ]);
      setAdapters(a.adapters || []);
      setTickets(t.tickets || []);
    } catch (e) {
      toast.error("Failed to load", { description: String(e).slice(0, 200) });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const seedDemoTicket = async () => {
    try {
      await fetch(`${API}/api/execution/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: "thompson_family",
          client_name: "David & Sarah Thompson",
          ticket_type: "trade",
          headline: "Buy 100 × VAS.AX (rebalance top-up)",
          message: "Generated from ExecutionRails demo seed",
          payload: { symbol: "VAS.AX", qty: 100, side: "buy" },
        }),
      });
      await refresh();
      toast.success("Demo ticket created");
    } catch (e) { toast.error("Seed failed"); }
  };

  const dispatch = async (id) => {
    setBusyId(id);
    try {
      const r = await fetch(`${API}/api/exec-rails/tickets/${id}/dispatch`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      toast.success(`Dispatched via ${out.event.adapter}`, {
        description: `${out.event.mode} · ref ${out.event.external_ref}`,
      });
      setEvents((e) => ({ ...e, [id]: out.event.stages || [] }));
      await refresh();
    } catch (e) {
      toast.error("Dispatch failed", { description: String(e).slice(0, 200) });
    } finally {
      setBusyId(null);
    }
  };

  const loadEvents = async (id) => {
    try {
      const r = await fetch(`${API}/api/exec-rails/events/${id}`).then((r) => r.json());
      const all = (r.events || []).flatMap((e) => e.stages || []);
      setEvents((prev) => ({ ...prev, [id]: all }));
    } catch {}
  };

  const pendingCount = tickets.filter((t) => t.status === "pending").length;
  const completedCount = tickets.filter((t) => t.status === "completed").length;
  const liveAdapters = adapters.filter((a) => a.live).length;

  const [statusFilter, setStatusFilter] = useState("all");
  const filteredTickets = statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter);
  const ticketCount = (s) => tickets.filter((t) => t.status === s).length;

  return (
    <Layout>
      <PageShell
        eyebrow="RAILS"
        title="Execution rails"
        accent={pendingCount ? `${pendingCount} pending` : null}
        subtitle="Route advice tickets through broker, super, insurance, contribution and rebalance adapters. Each dispatch is audit-logged for compliance replay."
        meta={`${adapters.length} adapters registered · ${liveAdapters} live · ${tickets.length} tickets in flight`}
        metrics={[
          { label: "Pending", value: String(pendingCount) },
          { label: "Completed", value: String(completedCount) },
          { label: "Live adapters", value: `${liveAdapters} / ${adapters.length}` },
          { label: "Total tickets", value: String(tickets.length) },
        ]}
        actions={(
          <>
            <PillButton variant="ghost" onClick={refresh} data-testid="rails-refresh">
              <RefreshCw className="h-3.5 w-3.5 inline mr-1.5" /> Refresh
            </PillButton>
            <PillButton onClick={seedDemoTicket} data-testid="rails-seed-demo">
              <Zap className="h-3.5 w-3.5 inline mr-1.5" /> Seed demo ticket
            </PillButton>
          </>
        )}
        filters={tickets.length > 0 ? (
          <ChipFilter
            value={statusFilter}
            onChange={setStatusFilter}
            dataTestidPrefix="ticket-status"
            options={[
              { value: "all", label: "All", count: tickets.length },
              { value: "pending", label: "Pending", count: ticketCount("pending") },
              { value: "executing", label: "Executing", count: ticketCount("executing") },
              { value: "completed", label: "Completed", count: ticketCount("completed") },
              { value: "failed", label: "Failed", count: ticketCount("failed") },
            ]}
          />
        ) : null}
      >
        <div className="space-y-4" data-testid="execution-rails">

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Registered Adapters</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {adapters.map((a) => (
                <div key={a.ticket_type} className="border rounded p-3 bg-slate-50">
                  <p className="text-sm font-semibold text-[#1a2744]">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">{a.ticket_type}</p>
                  <Badge variant="outline" className={`text-[9px] mt-1 ${a.live ? "border-emerald-600 text-emerald-700" : "border-amber-500 text-amber-700"}`}>
                    {a.live ? "LIVE" : "MOCK"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-600" />
              <p className="text-sm font-semibold">Tickets ({filteredTickets.length}{statusFilter !== "all" ? ` of ${tickets.length}` : ""})</p>
            </div>
            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">{statusFilter === "all" ? <>No execution tickets yet. Click <strong>Seed demo ticket</strong> above.</> : `No ${statusFilter} tickets.`}</div>
            )}
            <div className="divide-y">
              {filteredTickets.map((t) => (
                <div key={t.ticket_id} className="p-4" data-testid={`ticket-${t.ticket_id}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#1a2744]">{t.headline}</span>
                        <StatusPill status={t.status} />
                        <Badge variant="outline" className="text-[9px]">{t.ticket_type}</Badge>
                        {t.execution_ref && <Badge variant="outline" className="text-[9px] font-mono">{t.execution_ref}</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {t.client_name} · created {new Date(t.created_at).toLocaleString()}
                      </p>
                      {events[t.ticket_id] && events[t.ticket_id].length > 0 && (
                        <div className="mt-2 border-l-2 border-violet-300 pl-3 space-y-1">
                          {events[t.ticket_id].map((s, i) => (
                            <div key={i} className="text-[11px] flex items-center gap-2">
                              <StatusPill status={s.stage === "settled" ? "completed" : (s.stage === "failed" ? "failed" : "executing")} />
                              <span className="text-muted-foreground">{s.detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => loadEvents(t.ticket_id)} data-testid={`view-events-${t.ticket_id}`}>History</Button>
                      {t.status === "pending" && (
                        <Button size="sm" disabled={busyId === t.ticket_id} onClick={() => dispatch(t.ticket_id)} data-testid={`dispatch-${t.ticket_id}`} className="bg-violet-600 hover:bg-violet-700 text-white">
                          {busyId === t.ticket_id ? "…" : "Dispatch"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </PageShell>
    </Layout>
  );
};

export default ExecutionRails;
