// My Vault — read-only secure document store for the end-client.
// Shows meeting notes + signed compliance documents (SOA, ROA, FSG, FDS etc).
// Data source: same `listVault` from commsLedger.js used by the adviser's vault.
import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderLock, Download, FileSignature, FileText, Search, Lock, Calendar as CalendarIcon, Shield } from "lucide-react";
import { listVault, listEvents } from "@/lib/commsLedger";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { toast } from "sonner";

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Mock meeting-notes log — in production this would come from the CRM
const MOCK_MEETING_NOTES = (clientId) => [
  { id: "mn_1", title: "Annual Strategy Review 2026", date: "2026-03-18", summary: "Reviewed portfolio rebalancing, super contribution strategy and estate planning updates.", attendees: "David Thompson, Sarah Thompson, Sarah Chen (Adviser)", recordingAvailable: true },
  { id: "mn_2", title: "Q4 2025 Portfolio Review", date: "2025-12-10", summary: "Discussed Q4 performance (+9.4% YTD), agreed to rotate 5% from property into Australian equities.", attendees: "David Thompson, Sarah Chen", recordingAvailable: true },
  { id: "mn_3", title: "EOFY Tax Planning Session", date: "2025-05-22", summary: "Actioned concessional super top-up, CGT harvesting from Telstra holding, trust distribution resolution drafted.", attendees: "David Thompson, Sarah Thompson, Sarah Chen", recordingAvailable: false },
  { id: "mn_4", title: "SMSF Trustee Annual Meeting", date: "2024-11-08", summary: "Reviewed SMSF investment strategy, rebalanced property allocation, updated BDBN.", attendees: "David Thompson, Sarah Chen", recordingAvailable: false },
];

const MyVault = () => {
  const clientId = getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const [tick, setTick] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener("comms-ledger-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("comms-ledger-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const signedFiles = useMemo(() => listVault(clientId), [clientId, tick]);
  const events = useMemo(() => listEvents(clientId), [clientId, tick]);
  const meetingNotes = useMemo(() => MOCK_MEETING_NOTES(clientId), [clientId]);

  const filteredFiles = signedFiles.filter((f) =>
    (filter === "all" || f.docType === filter) &&
    (!search || f.name.toLowerCase().includes(search.toLowerCase()) || (f.docType || "").toLowerCase().includes(search.toLowerCase()))
  );

  const download = (f) => {
    const blob = new Blob([
      `HALCYON WEALTH — SECURE DOCUMENT VAULT\n\n` +
      `Document: ${f.docName}\nType: ${f.docType}\nSigned by: ${f.signedBy}\nSigned at: ${fmt(f.addedAt)}\nSignature hash: ${f.signatureHash}\n\n--- MOCK DOCUMENT ---`
    ], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = f.name; a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  const docTypes = Array.from(new Set(signedFiles.map((f) => f.docType))).filter(Boolean);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-5" data-testid="my-vault">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4A84C]" />
            {client.profile?.name || "Your vault"}
          </div>
          <h1 className="text-3xl font-bold text-[#1a2744] mt-1 flex items-center gap-2">
            <FolderLock className="h-7 w-7 text-[#D4A84C]" /> My Vault
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Secure storage for meeting notes, signed SOAs/ROAs/FSGs and compliance documents · 7-year retention · encrypted at rest
          </p>
        </div>

        {/* Stat ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Signed Documents</p><p className="text-2xl font-bold text-[#1a2744]" data-testid="vault-signed-count">{signedFiles.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Meeting Notes</p><p className="text-2xl font-bold text-[#1a2744]" data-testid="vault-meetings-count">{meetingNotes.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Document Types</p><p className="text-2xl font-bold text-[#1a2744]">{docTypes.length}</p></CardContent></Card>
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3754] text-white border-0"><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wide text-white/60">Security</p><p className="text-base font-bold mt-0.5 flex items-center gap-1.5"><Shield className="h-4 w-4 text-[#D4A84C]" /> AES-256</p><p className="text-[10px] text-white/50 mt-1">Encrypted at rest</p></CardContent></Card>
        </div>

        <Tabs defaultValue="signed">
          <TabsList className="bg-white border h-10 w-full justify-start">
            <TabsTrigger value="signed" className="gap-1.5" data-testid="vault-tab-signed"><FileSignature className="h-3.5 w-3.5" /> Signed Documents</TabsTrigger>
            <TabsTrigger value="meetings" className="gap-1.5" data-testid="vault-tab-meetings"><CalendarIcon className="h-3.5 w-3.5" /> Meeting Notes</TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5" data-testid="vault-tab-timeline"><FileText className="h-3.5 w-3.5" /> Activity Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="signed" className="pt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2 bg-white border rounded-lg p-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="pl-8 h-8 text-sm" data-testid="vault-search" />
              </div>
              <div className="flex gap-1 bg-muted rounded-md p-1 flex-wrap">
                {["all", ...docTypes].map((t) => (
                  <Button key={t} size="sm" variant={filter === t ? "default" : "ghost"} onClick={() => setFilter(t)} className={`h-7 text-[11px] ${filter === t ? "bg-[#1a2744]" : ""}`}>{t === "all" ? "All" : t}</Button>
                ))}
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {filteredFiles.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-16">
                    <FolderLock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    No signed documents yet. Your vault fills automatically when you return signed SOAs, ROAs or other compliance documents to your adviser.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left text-xs text-muted-foreground bg-gray-50">
                        <th className="py-2 px-3">Document</th><th className="py-2 px-3">Type</th><th className="py-2 px-3">Signed</th><th className="py-2 px-3">Signature Hash</th><th className="py-2 px-3 text-right">Action</th>
                      </tr></thead>
                      <tbody>
                        {filteredFiles.map((f) => (
                          <tr key={f.id} className="border-b hover:bg-gray-50" data-testid={`vault-file-${f.id}`}>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <FileSignature className="h-4 w-4 text-[#D4A84C]" />
                                <div><p className="text-xs font-medium">{f.name}</p><p className="text-[10px] text-muted-foreground">{f.source}</p></div>
                              </div>
                            </td>
                            <td className="py-2 px-3"><Badge variant="outline" className="text-[10px]">{f.docType}</Badge></td>
                            <td className="py-2 px-3 text-[11px]">{fmt(f.addedAt)}</td>
                            <td className="py-2 px-3 font-mono text-[10px] text-muted-foreground">{f.signatureHash}</td>
                            <td className="py-2 px-3 text-right"><Button size="sm" variant="ghost" onClick={() => download(f)} className="h-7 text-[11px]" data-testid={`vault-dl-${f.id}`}><Download className="h-3 w-3 mr-1" />Download</Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings" className="pt-3 space-y-2">
            {meetingNotes.map((m) => (
              <Card key={m.id} className="hover:shadow-md transition-shadow" data-testid={`vault-meeting-${m.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-[#1a2744]">{m.title}</h4>
                        {m.recordingAvailable && <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">Recording</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{m.summary}</p>
                      <p className="text-[11px] text-muted-foreground mt-2"><strong>Attendees:</strong> {m.attendees}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Meeting date</p>
                      <p className="text-sm font-bold text-[#1a2744]">{fmt(m.date)}</p>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-[11px]" onClick={() => toast.success("Notes downloaded (mock)")}><Download className="h-3 w-3 mr-1" />Notes</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="timeline" className="pt-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Your compliance trail ({events.length})</CardTitle></CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-10">No activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {events.slice(0, 30).map((e) => (
                      <div key={e.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                        <FileText className="h-4 w-4 text-[#1a2744] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.title}</p>
                          {e.docType && <Badge variant="outline" className="text-[9px] mt-0.5">{e.docType}</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground flex-shrink-0">{fmt(e.ts)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1.5"><Lock className="h-3 w-3" /> Read-only · contact your adviser to request a new document or signature</p>
      </div>
    </Layout>
  );
};

export default MyVault;
