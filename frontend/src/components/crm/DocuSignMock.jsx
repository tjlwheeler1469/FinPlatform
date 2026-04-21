// DocuSign Mock — e-signature workflow stub.
// Send → Sent → Viewed → Signed / Declined — all simulated in localStorage.
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSignature, Send, CheckCircle2, XCircle, Eye, Clock, Trash2, Download, BellRing, User } from "lucide-react";
import { toast } from "sonner";
import { CLIENT_DATA } from "@/data/clientData";

const DOCUMENT_TEMPLATES = [
  { id: "soa", name: "Statement of Advice", size: "3.2 MB" },
  { id: "roa", name: "Record of Advice", size: "820 KB" },
  { id: "fds", name: "Fee Disclosure Statement", size: "420 KB" },
  { id: "optin", name: "Opt-In Renewal", size: "180 KB" },
  { id: "engagement", name: "Engagement Letter", size: "260 KB" },
  { id: "poa", name: "Power of Attorney (Financial)", size: "640 KB" },
  { id: "smsftrust", name: "SMSF Trust Deed Update", size: "1.1 MB" },
];

const loadEnvelopes = () => { try { return JSON.parse(localStorage.getItem("crm_docusign_envelopes") || "[]"); } catch { return []; } };
const saveEnvelopes = (e) => localStorage.setItem("crm_docusign_envelopes", JSON.stringify(e));

const fmtTime = (iso) => iso ? new Date(iso).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS_CHAIN = ["draft", "sent", "viewed", "signed"];
const STATUS_COLORS = { draft: "bg-gray-400", sent: "bg-blue-500", viewed: "bg-amber-500", signed: "bg-emerald-500", declined: "bg-rose-500" };

const clientOptions = Object.entries(CLIENT_DATA)
  .filter(([k]) => !["client_1", "client_2"].includes(k))
  .map(([id, c]) => ({ id, name: c.profile?.name || id, email: c.profile?.email || `${id}@example.com` }));

const DocuSignMock = () => {
  const [envelopes, setEnvelopes] = useState(loadEnvelopes);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ docId: "soa", clientId: clientOptions[0]?.id, message: "Please review and sign at your earliest convenience.", provider: "docusign_mock" });

  const createEnvelope = () => {
    const doc = DOCUMENT_TEMPLATES.find((d) => d.id === draft.docId);
    const client = clientOptions.find((c) => c.id === draft.clientId);
    if (!doc || !client) return toast.error("Select doc & recipient");
    const env = {
      id: `env_${Date.now()}`,
      docName: doc.name,
      docSize: doc.size,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      message: draft.message,
      provider: draft.provider,
      status: "sent",
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      viewedAt: null,
      signedAt: null,
      declinedAt: null,
      log: [{ ts: new Date().toISOString(), event: "Envelope created & sent", by: "Sarah Chen" }],
    };
    const next = [env, ...envelopes];
    setEnvelopes(next); saveEnvelopes(next);
    setCreating(false);
    toast.success(`Envelope sent to ${client.email} · MOCK (DocuSign API key not configured)`);
  };

  const advance = (env, newStatus) => {
    const next = envelopes.map((e) => {
      if (e.id !== env.id) return e;
      const u = { ...e, status: newStatus };
      const now = new Date().toISOString();
      if (newStatus === "viewed" && !u.viewedAt) u.viewedAt = now;
      if (newStatus === "signed") u.signedAt = now;
      if (newStatus === "declined") u.declinedAt = now;
      u.log = [...u.log, { ts: now, event: `Status → ${newStatus}`, by: u.clientName }];
      return u;
    });
    setEnvelopes(next); saveEnvelopes(next);
    toast.success(`Status updated → ${newStatus}`);
  };

  const remind = (env) => toast.success(`Reminder sent to ${env.clientEmail} · MOCK`);
  const remove = (id) => { const next = envelopes.filter((e) => e.id !== id); setEnvelopes(next); saveEnvelopes(next); toast.success("Deleted"); };

  const stats = {
    total: envelopes.length,
    pending: envelopes.filter((e) => ["sent", "viewed"].includes(e.status)).length,
    signed: envelopes.filter((e) => e.status === "signed").length,
    declined: envelopes.filter((e) => e.status === "declined").length,
  };

  return (
    <div className="space-y-4" data-testid="docusign-mock">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Envelopes</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Pending Signature</p><p className="text-2xl font-bold text-blue-600" data-testid="stat-pending">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Signed</p><p className="text-2xl font-bold text-emerald-600">{stats.signed}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Declined</p><p className="text-2xl font-bold text-rose-600">{stats.declined}</p></CardContent></Card>
      </div>

      {/* New envelope */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm flex items-center gap-2"><FileSignature className="h-4 w-4" /> E-Signature Envelopes</CardTitle>
          <Button size="sm" onClick={() => setCreating(!creating)} className="bg-[#1a2744]" data-testid="btn-new-envelope"><Send className="h-3.5 w-3.5 mr-1" /> New Envelope</Button>
        </CardHeader>
        {creating && (
          <CardContent className="border-t bg-gray-50 pt-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label className="text-xs">Document</Label>
                <Select value={draft.docId} onValueChange={(v) => setDraft({ ...draft, docId: v })}>
                  <SelectTrigger className="h-8 text-sm" data-testid="envelope-doc"><SelectValue /></SelectTrigger>
                  <SelectContent>{DOCUMENT_TEMPLATES.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} · {d.size}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Recipient</Label>
                <Select value={draft.clientId} onValueChange={(v) => setDraft({ ...draft, clientId: v })}>
                  <SelectTrigger className="h-8 text-sm" data-testid="envelope-recipient"><SelectValue /></SelectTrigger>
                  <SelectContent>{clientOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">E-Sign Provider (mock)</Label>
                <Select value={draft.provider} onValueChange={(v) => setDraft({ ...draft, provider: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="docusign_mock">DocuSign (mock stub)</SelectItem><SelectItem value="adobe_sign_mock">Adobe Sign (mock stub)</SelectItem><SelectItem value="signnow_mock">signNow (mock stub)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label className="text-xs">Message to signer</Label><Textarea rows={2} value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} className="text-sm" /></div>
            </div>
            <div className="flex gap-2 justify-end mt-3">
              <Button size="sm" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button size="sm" onClick={createEnvelope} className="bg-[#10b981]" data-testid="btn-send-envelope"><Send className="h-3.5 w-3.5 mr-1" /> Send for Signature</Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Envelope list */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 px-3">Document</th><th className="py-2 px-3">Recipient</th><th className="py-2 px-3">Sent</th><th className="py-2 px-3">Viewed</th><th className="py-2 px-3">Signed</th><th className="py-2 px-3">Status</th><th className="py-2 px-3 text-right">Actions</th></tr></thead>
              <tbody>
                {envelopes.length === 0 && <tr><td colSpan="7" className="py-8 text-center text-muted-foreground text-sm">No envelopes yet — create one above</td></tr>}
                {envelopes.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50" data-testid={`envelope-row-${e.id}`}>
                    <td className="py-2 px-3"><p className="font-medium text-xs">{e.docName}</p><p className="text-[10px] text-muted-foreground">{e.docSize}</p></td>
                    <td className="py-2 px-3 text-xs"><User className="h-3 w-3 inline mr-1" />{e.clientName}<p className="text-[10px] text-muted-foreground">{e.clientEmail}</p></td>
                    <td className="py-2 px-3 text-[11px]">{fmtTime(e.sentAt)}</td>
                    <td className="py-2 px-3 text-[11px]">{fmtTime(e.viewedAt)}</td>
                    <td className="py-2 px-3 text-[11px]">{fmtTime(e.signedAt)}</td>
                    <td className="py-2 px-3"><Badge className={`${STATUS_COLORS[e.status]} text-[10px]`}>{e.status === "signed" ? <CheckCircle2 className="h-3 w-3 mr-0.5" /> : e.status === "declined" ? <XCircle className="h-3 w-3 mr-0.5" /> : e.status === "viewed" ? <Eye className="h-3 w-3 mr-0.5" /> : <Clock className="h-3 w-3 mr-0.5" />}{e.status}</Badge></td>
                    <td className="py-2 px-3 text-right space-x-1">
                      {e.status === "sent" && <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => advance(e, "viewed")} data-testid={`btn-view-${e.id}`}><Eye className="h-3 w-3 mr-1" />Viewed</Button>}
                      {["sent", "viewed"].includes(e.status) && <Button size="sm" variant="ghost" className="h-7 text-[11px] text-emerald-600" onClick={() => advance(e, "signed")} data-testid={`btn-sign-${e.id}`}><CheckCircle2 className="h-3 w-3 mr-1" />Sign</Button>}
                      {["sent", "viewed"].includes(e.status) && <Button size="sm" variant="ghost" className="h-7 text-[11px] text-rose-600" onClick={() => advance(e, "declined")}><XCircle className="h-3 w-3 mr-1" />Decline</Button>}
                      {["sent", "viewed"].includes(e.status) && <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => remind(e)}><BellRing className="h-3 w-3 mr-1" />Remind</Button>}
                      {e.status === "signed" && <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => toast.success("Mock download — signed PDF not yet available")}><Download className="h-3 w-3 mr-1" />Download</Button>}
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => remove(e.id)}><Trash2 className="h-3 w-3 text-rose-600" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center italic">Mock stub — status transitions simulate real DocuSign webhooks. Plug in your DocuSign/Adobe Sign API key to send live envelopes.</p>
    </div>
  );
};

export default DocuSignMock;
