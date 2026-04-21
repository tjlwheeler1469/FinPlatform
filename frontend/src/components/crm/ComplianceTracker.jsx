// SOA/ROA Compliance Tracker — legally mandated disclosures per client.
// Tracks delivery, signing, and overdue status for SOA, ROA, FSG, FDS, Annual Reviews.
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, Mail, FileText, Filter, BellRing } from "lucide-react";
import { toast } from "sonner";
import { CLIENT_DATA } from "@/data/clientData";
import { logEvent, addToVault } from "@/lib/commsLedger";

const DOC_TYPES = [
  { id: "FSG", name: "Financial Services Guide", cadenceDays: 365, legal: "Corporations Act s941A" },
  { id: "SOA", name: "Statement of Advice", cadenceDays: null, legal: "Corporations Act s946A (on advice)" },
  { id: "ROA", name: "Record of Advice", cadenceDays: null, legal: "Corporations Act s946B (simple advice)" },
  { id: "FDS", name: "Fee Disclosure Statement", cadenceDays: 365, legal: "Corporations Act s962G" },
  { id: "AnnualReview", name: "Annual Review", cadenceDays: 365, legal: "Ongoing fee arrangement" },
  { id: "OpIn", name: "Opt-In Renewal", cadenceDays: 365, legal: "Corporations Act s962K" },
];

const randomDate = (daysAgo) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString(); };

const seed = () => {
  const clientIds = Object.keys(CLIENT_DATA).filter((k) => !["client_1", "client_2"].includes(k));
  const records = [];
  clientIds.forEach((cid, idx) => {
    DOC_TYPES.forEach((t) => {
      const daysOff = (idx * 30 + t.id.length * 40) % 500;
      const signed = daysOff < 300;
      records.push({
        id: `${cid}_${t.id}`,
        clientId: cid,
        clientName: CLIENT_DATA[cid]?.profile?.name || cid,
        docType: t.id,
        docName: t.name,
        delivered: randomDate(daysOff),
        signed: signed ? randomDate(Math.max(0, daysOff - 5)) : null,
        status: signed ? "signed" : daysOff > 365 ? "overdue" : "awaiting_sign",
        cadenceDays: t.cadenceDays,
      });
    });
  });
  return records;
};

const loadRecords = () => { try { const v = JSON.parse(localStorage.getItem("crm_compliance_records") || "null"); return v || seed(); } catch { return seed(); } };
const saveRecords = (r) => localStorage.setItem("crm_compliance_records", JSON.stringify(r));

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const daysUntilDue = (r) => {
  if (!r.cadenceDays || !r.delivered) return null;
  const due = new Date(r.delivered); due.setDate(due.getDate() + r.cadenceDays);
  return Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
};

const ComplianceTracker = () => {
  const [records, setRecords] = useState(loadRecords);
  const [filterDoc, setFilterDoc] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const enriched = useMemo(() => records.map((r) => {
    const d = daysUntilDue(r);
    let alertStatus = r.status;
    if (r.cadenceDays && d !== null) {
      if (d < 0) alertStatus = "overdue";
      else if (d <= 30 && r.status === "signed") alertStatus = "due_soon";
    }
    return { ...r, daysUntilDue: d, alertStatus };
  }), [records]);

  const filtered = enriched.filter((r) =>
    (filterDoc === "all" || r.docType === filterDoc) &&
    (filterStatus === "all" || r.alertStatus === filterStatus) &&
    (!search || r.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = useMemo(() => {
    const total = enriched.length;
    const signed = enriched.filter((r) => r.alertStatus === "signed").length;
    const overdue = enriched.filter((r) => r.alertStatus === "overdue").length;
    const awaiting = enriched.filter((r) => r.alertStatus === "awaiting_sign").length;
    const dueSoon = enriched.filter((r) => r.alertStatus === "due_soon").length;
    return { total, signed, overdue, awaiting, dueSoon, compliance: total ? Math.round(((signed) / total) * 100) : 0 };
  }, [enriched]);

  const resend = (r) => {
    logEvent(r.clientId, { type: "reminder_sent", docType: r.docType, docName: r.docName, title: `Reminder: ${r.docName}`, meta: { channel: "email" } });
    toast.success(`Reminder emailed to ${r.clientName} · MOCK (connect Resend/SendGrid to deliver)`);
  };

  const markSigned = (r) => {
    const next = records.map((x) => x.id === r.id ? { ...x, signed: new Date().toISOString(), status: "signed" } : x);
    setRecords(next); saveRecords(next);
    const vaultEntry = addToVault(r.clientId, {
      name: `${r.docName} · Signed ${new Date().toLocaleDateString("en-AU")}.pdf`,
      docType: r.docType,
      docName: r.docName,
      signedBy: r.clientName,
      source: "compliance-manual",
      meta: { recordId: r.id },
    });
    logEvent(r.clientId, {
      type: "doc_signed",
      docType: r.docType,
      docName: r.docName,
      title: `${r.docName} signed (manual)`,
      by: r.clientName,
      meta: { recordId: r.id, vaultFileId: vaultEntry?.id },
    });
    toast.success("Marked signed · saved to vault");
  };

  const bulkRemindOverdue = () => {
    const overdueRows = filtered.filter((r) => r.alertStatus === "overdue");
    if (!overdueRows.length) return toast.info("No overdue items in current view");
    toast.success(`${overdueRows.length} reminders queued · MOCK notification`);
  };

  const statusBadge = (s) => {
    if (s === "signed") return <Badge className="bg-emerald-500 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-0.5" />Signed</Badge>;
    if (s === "overdue") return <Badge className="bg-rose-500 text-[10px]"><AlertTriangle className="h-3 w-3 mr-0.5" />Overdue</Badge>;
    if (s === "due_soon") return <Badge className="bg-amber-500 text-[10px]"><Clock className="h-3 w-3 mr-0.5" />Due soon</Badge>;
    return <Badge variant="outline" className="text-[10px]"><Clock className="h-3 w-3 mr-0.5" />Awaiting sign</Badge>;
  };

  return (
    <div className="space-y-4" data-testid="compliance-tracker">
      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Firm Compliance</p><p className="text-2xl font-bold text-[#1a2744]" data-testid="stat-compliance">{stats.compliance}%</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Signed</p><p className="text-2xl font-bold text-emerald-600" data-testid="stat-signed">{stats.signed}</p></CardContent></Card>
        <Card className="border-rose-200"><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-rose-600" data-testid="stat-overdue">{stats.overdue}</p></CardContent></Card>
        <Card className="border-amber-200"><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Due &lt; 30d</p><p className="text-2xl font-bold text-amber-600" data-testid="stat-due-soon">{stats.dueSoon}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Awaiting Sign</p><p className="text-2xl font-bold text-blue-600" data-testid="stat-awaiting">{stats.awaiting}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client..." className="h-8 w-48 text-sm" data-testid="compliance-search" />
          <Select value={filterDoc} onValueChange={setFilterDoc}>
            <SelectTrigger className="h-8 w-40 text-sm"><SelectValue placeholder="Doc type" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All docs</SelectItem>{DOC_TYPES.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="signed">Signed</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="due_soon">Due soon</SelectItem><SelectItem value="awaiting_sign">Awaiting</SelectItem></SelectContent>
          </Select>
          <div className="flex-1" />
          <Button size="sm" onClick={bulkRemindOverdue} className="bg-rose-600 hover:bg-rose-700" data-testid="btn-bulk-remind"><BellRing className="h-3.5 w-3.5 mr-1" /> Remind all overdue</Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Document Log ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 px-2">Client</th><th className="py-2 px-2">Document</th><th className="py-2 px-2">Delivered</th><th className="py-2 px-2">Signed</th><th className="py-2 px-2">Next due</th><th className="py-2 px-2">Status</th><th className="py-2 px-2 text-right">Actions</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50" data-testid={`compliance-row-${r.id}`}>
                    <td className="py-2 px-2 font-medium">{r.clientName}</td>
                    <td className="py-2 px-2"><FileText className="h-3.5 w-3.5 inline text-[#1a2744] mr-1" />{r.docType}</td>
                    <td className="py-2 px-2 text-xs">{fmtDate(r.delivered)}</td>
                    <td className="py-2 px-2 text-xs">{fmtDate(r.signed)}</td>
                    <td className="py-2 px-2 text-xs">{r.daysUntilDue !== null ? `${r.daysUntilDue}d` : "—"}</td>
                    <td className="py-2 px-2">{statusBadge(r.alertStatus)}</td>
                    <td className="py-2 px-2 text-right space-x-1">
                      {r.alertStatus !== "signed" && <Button size="sm" variant="ghost" onClick={() => markSigned(r)} className="h-7 text-[11px]" data-testid={`btn-sign-${r.id}`}><CheckCircle2 className="h-3 w-3 mr-1" />Mark signed</Button>}
                      <Button size="sm" variant="ghost" onClick={() => resend(r)} className="h-7 text-[11px]"><Mail className="h-3 w-3 mr-1" />Remind</Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="7" className="py-8 text-center text-muted-foreground text-sm">No records match current filters</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center">Legal cadences: FSG 12mo · FDS 12mo · Opt-in 12mo · SOA on advice · ROA on simple advice. All notifications are MOCK stubs — bring your email provider key to go live.</p>
    </div>
  );
};

export default ComplianceTracker;
