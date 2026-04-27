// ClientCommsTimeline — per-client audit trail, compliance checkboxes, and vault.
// Reads from /lib/commsLedger (populated by DocuSignMock, ComplianceTracker, NewsletterBuilder).
// Provides 3 views in one panel:
//   1. Compliance Checkboxes — auto-ticked as SOA/ROA/etc are sent and returned-signed
//   2. Activity Timeline — chronological list of every comms event for this client
//   3. Vault — signed PDFs stored against the client
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send, CheckCircle2, Clock, Eye, XCircle, FileSignature, Mail, FileText, ShieldCheck,
  Lock, Download, Trash2, History, FolderLock, BellRing, Sparkles, Archive,
} from "lucide-react";
import { toast } from "sonner";
import {
  listEvents, getDocStatusMap, listVault, removeFromVault, addToVault, logEvent,
  REQUIRED_DOCS,
} from "@/lib/commsLedger";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";

const fmt = (iso) => iso ? new Date(iso).toLocaleString("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const fmtShort = (iso) => iso ? new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const EVENT_ICON = {
  doc_sent: Send,
  doc_viewed: Eye,
  doc_signed: CheckCircle2,
  doc_declined: XCircle,
  campaign_sent: Mail,
  reminder_sent: BellRing,
};
const EVENT_COLOR = {
  doc_sent: "text-blue-600 bg-blue-50",
  doc_viewed: "text-amber-600 bg-amber-50",
  doc_signed: "text-emerald-600 bg-emerald-50",
  doc_declined: "text-rose-600 bg-rose-50",
  campaign_sent: "text-purple-600 bg-purple-50",
  reminder_sent: "text-orange-600 bg-orange-50",
};

const ChecklistPanel = ({ clientId, statusMap }) => {
  const rows = REQUIRED_DOCS.map((d) => {
    const s = statusMap[d.id] || {};
    return { ...d, ...s };
  });

  const markSent = (row) => {
    logEvent(clientId, {
      type: "doc_sent",
      docType: row.id,
      docName: row.name,
      title: `${row.name} marked sent (manual)`,
      meta: { channel: "manual" },
    });
    toast.success(`${row.id} marked sent`);
  };

  const markSigned = (row) => {
    const vaultEntry = addToVault(clientId, {
      name: `${row.name} · Signed ${new Date().toLocaleDateString("en-AU")}.pdf`,
      docType: row.id,
      docName: row.name,
      signedBy: "Client (manual confirm)",
      source: "manual-checkbox",
    });
    logEvent(clientId, {
      type: "doc_signed",
      docType: row.id,
      docName: row.name,
      title: `${row.name} marked signed · saved to vault`,
      meta: { vaultFileId: vaultEntry?.id, source: "manual" },
    });
    toast.success(`${row.id} marked signed · added to vault`);
  };

  const completedCount = rows.filter((r) => r.signedAt).length;

  return (
    <Card data-testid="comms-checklist">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Required Communications Checklist</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">First box ticks when sent · second ticks when returned signed (auto from e-sign).</p>
        </div>
        <Badge className="bg-[#1a2744]">{completedCount} / {rows.length} complete</Badge>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 px-2">Document</th>
                <th className="py-2 px-2 text-center w-24">Sent</th>
                <th className="py-2 px-2 text-center w-28">Returned &amp; Signed</th>
                <th className="py-2 px-2 text-xs">Last activity</th>
                <th className="py-2 px-2 text-right w-36">Quick actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const sent = !!r.sentAt;
                const signed = !!r.signedAt;
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50" data-testid={`checklist-row-${r.id}`}>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-[#1a2744]" />
                        <div>
                          <p className="font-medium text-sm">{r.id}</p>
                          <p className="text-[10px] text-muted-foreground">{r.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={sent}
                        onCheckedChange={() => !sent && markSent(r)}
                        data-testid={`chk-sent-${r.id}`}
                        className={sent ? "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" : ""}
                      />
                      {sent && <p className="text-[9px] text-muted-foreground mt-1">{fmtShort(r.sentAt)}</p>}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={signed}
                        disabled={!sent && !signed}
                        onCheckedChange={() => !signed && markSigned(r)}
                        data-testid={`chk-signed-${r.id}`}
                        className={signed ? "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" : ""}
                      />
                      {signed && <p className="text-[9px] text-muted-foreground mt-1">{fmtShort(r.signedAt)}</p>}
                    </td>
                    <td className="py-2 px-2 text-[11px] text-muted-foreground">
                      {r.declinedAt ? <span className="text-rose-600">Declined {fmtShort(r.declinedAt)}</span> :
                       r.signedAt ? <span className="text-emerald-600">Signed {fmtShort(r.signedAt)}</span> :
                       r.viewedAt ? <span className="text-amber-600">Viewed {fmtShort(r.viewedAt)}</span> :
                       r.sentAt ? <span>Sent {fmtShort(r.sentAt)}</span> : <span className="italic">Not yet sent</span>}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {!sent && <Button size="sm" variant="outline" onClick={() => markSent(r)} className="h-7 text-[11px]">Mark sent</Button>}
                      {sent && !signed && <Button size="sm" variant="outline" onClick={() => markSigned(r)} className="h-7 text-[11px] text-emerald-700 border-emerald-300">Mark signed</Button>}
                      {signed && <Badge className="bg-emerald-500 text-[10px]"><Lock className="h-3 w-3 mr-1" />In vault</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          Checkboxes auto-tick when an e-sign envelope is sent / returned via the E-Signatures tab. Manual overrides are logged to the timeline.
        </p>
      </CardContent>
    </Card>
  );
};

const TimelinePanel = ({ events }) => {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No communications yet — start an e-sign envelope or compliance email to populate this timeline.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card data-testid="comms-timeline">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" /> Activity Timeline ({events.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-px before:bg-gray-200">
          {events.map((e) => {
            const Icon = EVENT_ICON[e.type] || FileText;
            const color = EVENT_COLOR[e.type] || "text-gray-600 bg-gray-100";
            return (
              <div key={e.id} className="relative" data-testid={`timeline-${e.type}`}>
                <div className={`absolute -left-[18px] top-0 w-6 h-6 rounded-full flex items-center justify-center ${color} border-2 border-white shadow-sm`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="ml-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.docType && <Badge variant="outline" className="text-[9px]">{e.docType}</Badge>}
                  </div>
                  {e.body && <p className="text-xs text-muted-foreground mt-0.5">{e.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{fmt(e.ts)} · {e.by || "adviser"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const VaultPanel = ({ clientId, files }) => {
  const remove = (fid) => { removeFromVault(clientId, fid); toast.success("Removed from vault"); };
  const download = (f) => {
    // Generate a mock signed-PDF text file to prove the vault entry downloads
    const blob = new Blob([
      `HALCYON WEALTH — DIGITAL SIGNATURE VAULT\n\n` +
      `Document: ${f.docName}\n` +
      `Type: ${f.docType}\n` +
      `Signed by: ${f.signedBy}\n` +
      `Signed at: ${fmt(f.addedAt)}\n` +
      `Signature hash: ${f.signatureHash}\n` +
      `Source: ${f.source}\n\n` +
      `--- MOCK DOCUMENT ---\nThis is a placeholder. Connect DocuSign / Adobe Sign to retrieve the actual signed PDF.`
    ], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = f.name; a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded (mock PDF)");
  };

  return (
    <Card data-testid="comms-vault">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm flex items-center gap-2"><FolderLock className="h-4 w-4 text-[#D4A84C]" /> Secure Vault · Signed Documents</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Encrypted at rest · signature hash recorded · 7-year retention</p>
        </div>
        <Badge className="bg-[#1a2744]"><Lock className="h-3 w-3 mr-1" />{files.length} file{files.length !== 1 ? "s" : ""}</Badge>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            <Archive className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No signed documents yet — the vault fills automatically as clients return signed SOAs/ROAs/FDSs.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 px-2">Document</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Signed by</th>
                  <th className="py-2 px-2">Added</th>
                  <th className="py-2 px-2">Signature hash</th>
                  <th className="py-2 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id} className="border-b hover:bg-gray-50" data-testid={`vault-row-${f.id}`}>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-3.5 w-3.5 text-[#D4A84C]" />
                        <p className="text-xs font-medium">{f.name}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground pl-5">{f.source}</p>
                    </td>
                    <td className="py-2 px-2"><Badge variant="outline" className="text-[10px]">{f.docType}</Badge></td>
                    <td className="py-2 px-2 text-[11px]">{f.signedBy}</td>
                    <td className="py-2 px-2 text-[11px]">{fmtShort(f.addedAt)}</td>
                    <td className="py-2 px-2 font-mono text-[10px] text-muted-foreground">{f.signatureHash}</td>
                    <td className="py-2 px-2 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => download(f)} className="h-7 text-[11px]" data-testid={`vault-dl-${f.id}`}><Download className="h-3 w-3 mr-1" />Download</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(f.id)} className="h-7"><Trash2 className="h-3 w-3 text-rose-600" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ClientCommsTimeline = ({ clientId: propClientId, embedded = true }) => {
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener("comms-ledger-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("comms-ledger-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Read latest data on every render via tick dep
  const events = useMemo(() => listEvents(clientId), [clientId, tick]);
  const statusMap = useMemo(() => getDocStatusMap(clientId), [clientId, tick]);
  const vaultFiles = useMemo(() => listVault(clientId), [clientId, tick]);

  return (
    <div className="space-y-4" data-testid="client-comms-timeline">
      <Card className="bg-gradient-to-r from-[#1a2744]/5 to-[#D4A84C]/5 border-[#D4A84C]/30">
        <CardContent className="p-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#D4A84C]" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Comms &amp; Vault</p>
              <p className="text-sm font-bold text-[#1a2744]">{client.profile?.name || clientId}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Events</p>
            <p className="text-lg font-bold text-[#1a2744]" data-testid="ct-event-count">{events.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Docs Required</p>
            <p className="text-lg font-bold text-[#1a2744]">{REQUIRED_DOCS.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Vault Files</p>
            <p className="text-lg font-bold text-[#D4A84C]" data-testid="ct-vault-count">{vaultFiles.length}</p>
          </div>
          <div className="ml-auto text-[10px] text-muted-foreground italic max-w-xs text-right">
            Every e-sign, email and compliance tick is logged here automatically.
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist">
        <TabsList className="bg-white border h-10 w-full justify-start gap-1 px-1">
          <TabsTrigger value="checklist" className="gap-1.5 text-xs" data-testid="ct-tab-checklist"><ShieldCheck className="h-3.5 w-3.5" /> Checklist</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5 text-xs" data-testid="ct-tab-timeline"><History className="h-3.5 w-3.5" /> Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="checklist" className="pt-3"><ChecklistPanel clientId={clientId} statusMap={statusMap} /></TabsContent>
        <TabsContent value="timeline" className="pt-3"><TimelinePanel events={events} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientCommsTimeline;
