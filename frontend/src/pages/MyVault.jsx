// My Vault — read-only secure document store for the end-client.
// Source of truth is the SAME backend object storage as the adviser's Vault:
// `/api/files/search?client_id={id}&only_latest=true` returns the latest
// version of every document family owned by the active client.
//
// We deliberately use a read-only stance — no upload, no version restore,
// no delete buttons. Download is the only action.
import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderLock, Download, FileSignature, FileText, Search, Lock, Calendar as CalendarIcon, Shield, RefreshCw, Layers, Tag as TagIcon } from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtBytes = (n) => {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`;
  return `${n} B`;
};

// Mock meeting-notes log — adviser-curated, stays as-is for now.
const MOCK_MEETING_NOTES = (clientId) => [
  { id: "mn_1", title: "Annual Strategy Review 2026", date: "2026-03-18", summary: "Reviewed portfolio rebalancing, super contribution strategy and estate planning updates.", attendees: "David Thompson, Sarah Thompson, Sarah Chen (Adviser)", recordingAvailable: true },
  { id: "mn_2", title: "Q4 2025 Portfolio Review", date: "2025-12-10", summary: "Discussed Q4 performance (+9.4% YTD), agreed to rotate 5% from property into Australian equities.", attendees: "David Thompson, Sarah Chen", recordingAvailable: true },
  { id: "mn_3", title: "EOFY Tax Planning Session", date: "2025-05-22", summary: "Actioned concessional super top-up, CGT harvesting from Telstra holding, trust distribution resolution drafted.", attendees: "David Thompson, Sarah Thompson, Sarah Chen", recordingAvailable: false },
  { id: "mn_4", title: "SMSF Trustee Annual Meeting", date: "2024-11-08", summary: "Reviewed SMSF investment strategy, rebalanced property allocation, updated BDBN.", attendees: "David Thompson, Sarah Chen", recordingAvailable: false },
];

const MyVault = () => {
  const clientId = getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(`${API}/api/files/search`);
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("only_latest", "true");
      url.searchParams.set("limit", "200");
      const r = await fetch(url.toString());
      const data = await r.json();
      setDocs(data.objects || []);
    } catch (e) {
      toast.error("Failed to load Vault", { description: String(e).slice(0, 200) });
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { refresh(); }, [refresh]);

  const meetingNotes = useMemo(() => MOCK_MEETING_NOTES(clientId), [clientId]);

  const allTags = useMemo(() => Array.from(new Set(docs.flatMap((d) => d.tags || []))).filter(Boolean), [docs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return docs.filter((d) => {
      const matchesTag = tagFilter === "all" || (d.tags || []).includes(tagFilter);
      const matchesSearch =
        !q ||
        (d.filename || "").toLowerCase().includes(q) ||
        (d.family_key || "").toLowerCase().includes(q) ||
        (d.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesTag && matchesSearch;
    });
  }, [docs, search, tagFilter]);

  const signedCount = docs.filter((d) => d.is_frozen).length;

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
            Secure storage for meeting notes, signed SOAs/ROAs/FSGs and compliance documents · synced live with your adviser · encrypted at rest
          </p>
        </div>

        {/* Stat ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Documents</p><p className="text-2xl font-bold text-[#1a2744]" data-testid="vault-doc-count">{docs.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Signed &amp; Frozen</p><p className="text-2xl font-bold text-[#1a2744]" data-testid="vault-signed-count">{signedCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Meeting Notes</p><p className="text-2xl font-bold text-[#1a2744]" data-testid="vault-meetings-count">{meetingNotes.length}</p></CardContent></Card>
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3754] text-white border-0"><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wide text-white/60">Security</p><p className="text-base font-bold mt-0.5 flex items-center gap-1.5"><Shield className="h-4 w-4 text-[#D4A84C]" /> AES-256</p><p className="text-[10px] text-white/50 mt-1">Encrypted at rest</p></CardContent></Card>
        </div>

        <Tabs defaultValue="docs">
          <TabsList className="bg-white border h-10 w-full justify-start">
            <TabsTrigger value="docs" className="gap-1.5" data-testid="vault-tab-docs"><FileSignature className="h-3.5 w-3.5" /> Documents</TabsTrigger>
            <TabsTrigger value="meetings" className="gap-1.5" data-testid="vault-tab-meetings"><CalendarIcon className="h-3.5 w-3.5" /> Meeting Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="docs" className="pt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2 bg-white border rounded-lg p-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents, tags, families..." className="pl-8 h-8 text-sm" data-testid="vault-search" />
              </div>
              <div className="flex gap-1 bg-muted rounded-md p-1 flex-wrap">
                {["all", ...allTags].map((t) => (
                  <Button key={t} size="sm" variant={tagFilter === t ? "default" : "ghost"} onClick={() => setTagFilter(t)} className={`h-7 text-[11px] ${tagFilter === t ? "bg-[#1a2744]" : ""}`} data-testid={`vault-filter-${t}`}>{t === "all" ? "All" : t}</Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={refresh} disabled={loading} data-testid="vault-refresh" className="h-7 text-[11px]">
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {filtered.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-16">
                    <FolderLock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    {loading ? "Loading your documents…" : "No documents yet. Your vault fills automatically when your adviser issues a new SOA, ROA or compliance document."}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left text-xs text-muted-foreground bg-gray-50">
                        <th className="py-2 px-3">Document</th><th className="py-2 px-3">Tags</th><th className="py-2 px-3">Issued</th><th className="py-2 px-3">Size</th><th className="py-2 px-3 text-right">Action</th>
                      </tr></thead>
                      <tbody>
                        {filtered.map((d) => (
                          <tr key={d.object_id} className="border-b hover:bg-gray-50" data-testid={`vault-file-${d.object_id}`}>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <FileSignature className="h-4 w-4 text-[#D4A84C]" />
                                <div>
                                  <p className="text-xs font-medium flex items-center gap-1.5 flex-wrap">
                                    {d.filename}
                                    <Badge variant="outline" className="text-[9px]"><Layers className="h-2.5 w-2.5 mr-0.5" />v{d.version}</Badge>
                                    {d.is_frozen && (
                                      <Badge variant="outline" className="text-[9px] bg-amber-50 border-amber-300 text-amber-800" data-testid={`vault-frozen-${d.object_id}`}>
                                        <Lock className="h-2.5 w-2.5 mr-0.5" /> SIGNED
                                      </Badge>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono">{d.family_key}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex gap-1 flex-wrap">
                                {(d.tags || []).map((t) => (
                                  <Badge key={t} variant="outline" className="text-[9px] capitalize"><TagIcon className="h-2.5 w-2.5 mr-0.5" />{t}</Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-[11px]">{fmt(d.created_at)}</td>
                            <td className="py-2 px-3 text-[11px]">{fmtBytes(d.size_bytes)}</td>
                            <td className="py-2 px-3 text-right">
                              <a href={`${API}/api/files/${d.object_id}`} target="_blank" rel="noopener noreferrer" data-testid={`vault-dl-${d.object_id}`}>
                                <Button size="sm" variant="ghost" className="h-7 text-[11px]"><Download className="h-3 w-3 mr-1" />Download</Button>
                              </a>
                            </td>
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
        </Tabs>

        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1.5"><Lock className="h-3 w-3" /> Read-only · contact your adviser to request a new document or signature</p>
      </div>
    </Layout>
  );
};

export default MyVault;
