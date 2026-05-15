// WebhooksAdmin — manage outbound event subscriptions + inspect delivery log.
// Used by integrators to wire Halcyon events into Slack, Zapier, internal
// audit systems, etc. Every delivery is HMAC-signed (X-Halcyon-Signature).
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { PageShell, PillButton, Tile } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Cable, PlusCircle, Trash2, Zap, RefreshCw, CheckCircle2, XCircle, Clock, Copy,
} from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_META = {
  delivered: { color: "bg-emerald-50 text-emerald-800 border-emerald-300", icon: CheckCircle2 },
  failed:    { color: "bg-rose-50 text-rose-800 border-rose-300",          icon: XCircle },
  pending:   { color: "bg-amber-50 text-amber-800 border-amber-300",       icon: Clock },
};

const WebhooksAdmin = () => {
  const [subs, setSubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [validTypes, setValidTypes] = useState([]);
  const [newSub, setNewSub] = useState({ event_type: "deal.stage_changed", target_url: "", description: "" });

  const refresh = useCallback(async () => {
    try {
      const [s, e] = await Promise.all([
        fetch(`${API}/api/webhooks/subscriptions`).then((r) => r.json()),
        fetch(`${API}/api/webhooks/events?limit=50`).then((r) => r.json()),
      ]);
      setSubs(s.subscriptions || []);
      setEvents(e.events || []);
      setValidTypes(s.valid_event_types || []);
    } catch (err) { toast.error("Failed to load"); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const createSub = async () => {
    if (!newSub.target_url.startsWith("http")) return toast.error("Target URL must start with http(s)://");
    try {
      const r = await fetch(`${API}/api/webhooks/subscriptions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSub),
      });
      if (!r.ok) throw new Error("create failed");
      const out = await r.json();
      navigator.clipboard?.writeText(out.secret);
      toast.success("Subscription created — secret copied to clipboard", {
        description: `Use this secret to verify X-Halcyon-Signature on incoming POSTs.`,
        duration: 10_000,
      });
      setNewSub({ event_type: newSub.event_type, target_url: "", description: "" });
      await refresh();
    } catch (e) { toast.error("Create failed", { description: String(e).slice(0, 200) }); }
  };

  const deleteSub = async (id) => {
    if (!window.confirm("Delete this subscription? It will stop receiving events immediately.")) return;
    await fetch(`${API}/api/webhooks/subscriptions/${id}`, { method: "DELETE" });
    await refresh();
    toast.success("Subscription deleted");
  };

  const toggleSub = async (sub) => {
    await fetch(`${API}/api/webhooks/subscriptions/${sub.sub_id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !sub.active }),
    });
    await refresh();
  };

  const testFire = async (event_type) => {
    try {
      const r = await fetch(`${API}/api/webhooks/test-fire?event_type=${encodeURIComponent(event_type)}`, { method: "POST" });
      const out = await r.json();
      toast.success(`Fired ${event_type} to ${out.fired_to} subscriber${out.fired_to === 1 ? "" : "s"}`);
      setTimeout(refresh, 800);
    } catch (e) { toast.error("Test fire failed"); }
  };

  const retryEvent = async (eid) => {
    await fetch(`${API}/api/webhooks/events/${eid}/retry`, { method: "POST" });
    toast.success("Retry queued");
    setTimeout(refresh, 800);
  };

  const totalSuccess = subs.reduce((s, x) => s + (x.success_count || 0), 0);
  const totalFailure = subs.reduce((s, x) => s + (x.failure_count || 0), 0);
  const activeSubs = subs.filter((s) => s.active).length;

  return (
    <Layout>
      <PageShell
        eyebrow="AUTOMATION"
        title="Outbound webhooks"
        accent={subs.length ? `${activeSubs} active` : null}
        subtitle="Fan-out platform events to Slack, Zapier, your audit warehouse — every POST HMAC-SHA256 signed (X-Halcyon-Signature) with full delivery log + manual retry."
        meta={`${subs.length} subscriptions · ${events.length} recent deliveries · ${validTypes.length} event types supported`}
        metrics={[
          { label: "Active subs", value: String(activeSubs) },
          { label: "Delivered", value: String(totalSuccess) },
          { label: "Failed", value: String(totalFailure) },
          { label: "Recent events", value: String(events.length) },
        ]}
        actions={(
          <PillButton variant="ghost" onClick={refresh} data-testid="webhook-refresh">
            <RefreshCw className="h-3.5 w-3.5 inline mr-1.5" /> Refresh
          </PillButton>
        )}
      >
        <div className="space-y-6" data-testid="webhooks-admin">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><PlusCircle className="h-4 w-4 text-emerald-600" /> Register subscription</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <Select value={newSub.event_type} onValueChange={(v) => setNewSub((s) => ({ ...s, event_type: v }))}>
              <SelectTrigger data-testid="new-sub-event"><SelectValue /></SelectTrigger>
              <SelectContent>
                {validTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="https://hooks.slack.com/..." value={newSub.target_url} onChange={(e) => setNewSub((s) => ({ ...s, target_url: e.target.value }))} data-testid="new-sub-url" className="md:col-span-2" />
            <Input placeholder="Description (optional)" value={newSub.description} onChange={(e) => setNewSub((s) => ({ ...s, description: e.target.value }))} data-testid="new-sub-desc" />
            <Button onClick={createSub} className="md:col-span-4" data-testid="new-sub-create"><PlusCircle className="h-3.5 w-3.5 mr-1" /> Register & copy secret</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Active subscriptions ({subs.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {subs.length === 0 && <p className="p-6 text-center text-xs text-muted-foreground">No subscriptions yet.</p>}
            {subs.map((s) => (
              <div key={s.sub_id} className="border-t p-3 flex items-center gap-2 flex-wrap" data-testid={`sub-${s.sub_id}`}>
                <Switch checked={s.active} onCheckedChange={() => toggleSub(s)} data-testid={`sub-toggle-${s.sub_id}`} />
                <Badge variant="outline" className="font-mono text-[10px]">{s.event_type}</Badge>
                <span className="text-[12px] truncate flex-1 min-w-[200px]">{s.target_url}</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 border-emerald-300 text-emerald-800">✓ {s.success_count}</Badge>
                <Badge variant="outline" className="text-[10px] bg-rose-50 border-rose-300 text-rose-800">✗ {s.failure_count}</Badge>
                <Button size="sm" variant="ghost" onClick={() => testFire(s.event_type)} className="h-7" data-testid={`sub-test-${s.sub_id}`}><Zap className="h-3 w-3 mr-1" /> Test fire</Button>
                <Button size="sm" variant="ghost" onClick={() => deleteSub(s.sub_id)} className="h-7 text-rose-600" data-testid={`sub-del-${s.sub_id}`}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Delivery log ({events.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {events.length === 0 && <p className="p-6 text-center text-xs text-muted-foreground">No webhook events yet. Subscriptions will populate this log on first delivery.</p>}
            {events.map((e) => {
              const meta = STATUS_META[e.status] || STATUS_META.pending;
              const Icon = meta.icon;
              return (
                <div key={e.event_id} className="border-t p-3 text-[11px]" data-testid={`event-${e.event_id}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`${meta.color} text-[10px] gap-1`}><Icon className="h-3 w-3" />{e.status}</Badge>
                    <span className="font-mono">{e.event_type}</span>
                    <span className="text-muted-foreground">→ {e.target_url}</span>
                    <span className="text-muted-foreground ml-auto">HTTP {e.http_status || "—"} · {new Date(e.created_at).toLocaleString()}</span>
                    {e.status === "failed" && <Button size="sm" variant="ghost" onClick={() => retryEvent(e.event_id)} className="h-6 text-[10px]" data-testid={`retry-${e.event_id}`}>retry</Button>}
                  </div>
                  {e.response_excerpt && <p className="text-[10px] text-muted-foreground font-mono mt-1 truncate">{e.response_excerpt}</p>}
                  {e.error && <p className="text-[10px] text-rose-700 mt-1">{e.error}</p>}
                </div>
              );
            })}
          </CardContent>
        </Card>
        </div>
      </PageShell>
    </Layout>
  );
};

export default WebhooksAdmin;
