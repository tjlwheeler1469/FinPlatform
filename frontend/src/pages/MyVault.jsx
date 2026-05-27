// My Vault — read-only secure document store for the end-client.
// Source of truth is the SAME backend object storage as the adviser's Vault:
// `/api/files/search?client_id={id}&only_latest=true` returns the latest
// version of every document family owned by the active client.
//
// Meeting notes are loaded from `/api/meetings/by-client/{client_id}` (Mongo-
// persisted) and fall back to a small built-in demo set on first load so the
// page is never empty.
import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { PageShell, PillButton } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderLock, Download, FileSignature, Search, Lock, Calendar as CalendarIcon, RefreshCw, Layers, Tag as TagIcon } from "lucide-react";
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

const MyVault = () => {
  const clientId = getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [docs, setDocs] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch documents from the unified object-storage backend.
      const url = new URL(`${API}/api/files/search`);
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("only_latest", "true");
      url.searchParams.set("limit", "200");
      const [filesRes, meetingsRes] = await Promise.all([
        fetch(url.toString()),
        fetch(`${API}/api/meetings/by-client/${encodeURIComponent(clientId)}`),
      ]);
      const filesData = filesRes.ok ? await filesRes.json() : { objects: [] };
      let meetingsData = meetingsRes.ok ? await meetingsRes.json() : { meetings: [] };
      // First-load helper: trigger demo seed if collection is empty, then retry.
      if ((meetingsData.meetings || []).length === 0) {
        try {
          await fetch(`${API}/api/meetings/seed-demo`, { method: "POST" });
          const retry = await fetch(`${API}/api/meetings/by-client/${encodeURIComponent(clientId)}`);
          if (retry.ok) meetingsData = await retry.json();
        } catch (_) { /* seed best-effort */ }
      }
      setDocs(filesData.objects || []);
      setMeetings(meetingsData.meetings || []);
    } catch (e) {
      toast.error("Failed to load Vault", { description: String(e).slice(0, 200) });
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { refresh(); }, [refresh]);

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
      <PageShell
        eyebrow="YOUR VAULT"
        title="Secure vault"
        accent={`${docs.length} documents · ${meetings.length} meetings`}
        subtitle="Encrypted storage for every signed SOA, ROA, FSG and meeting note. Synced live from your adviser. Read-only — contact your adviser to request a new document or signature."
        meta={`${(client.profile?.name || "").toUpperCase()} · AES-256 · ENCRYPTED AT REST`}
        metrics={[
          { label: "Documents", value: String(docs.length) },
          { label: "Signed & frozen", value: String(signedCount) },
          { label: "Meeting notes", value: String(meetings.length) },
          { label: "Security", value: "AES-256" },
        ]}
        actions={(
          <PillButton variant="ghost" onClick={refresh} disabled={loading} data-testid="vault-refresh">
            <RefreshCw className={`h-3.5 w-3.5 inline -mt-0.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </PillButton>
        )}
      >
      <div className="space-y-5" data-testid="my-vault">

        <Tabs defaultValue="docs">
          <TabsList className="bg-transparent border-0 h-auto w-full justify-start gap-1.5 px-0 p-0 mb-4">
            <TabsTrigger value="docs" className="gap-1.5 px-4 py-2 rounded-full transition-all border border-transparent data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300" data-testid="vault-tab-docs"><FileSignature className="h-3.5 w-3.5" /> Documents</TabsTrigger>
            <TabsTrigger value="meetings" className="gap-1.5 px-4 py-2 rounded-full transition-all border border-transparent data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300" data-testid="vault-tab-meetings"><CalendarIcon className="h-3.5 w-3.5" /> Meeting Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="docs" className="pt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents, tags, families..." className="pl-8 h-8 text-sm rounded-full border-slate-300" data-testid="vault-search" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {["all", ...allTags].map((t) => (
                  <button key={t} onClick={() => setTagFilter(t)} className={`h-7 px-3 text-[11px] rounded-full transition-all border ${tagFilter === t ? "bg-[#1a2744] text-white border-[#1a2744]" : "bg-white text-slate-600 border-slate-300 hover:border-slate-500"}`} data-testid={`vault-filter-${t}`}>{t === "all" ? "All" : t}</button>
                ))}
              </div>
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
                                  <div className="text-xs font-medium flex items-center gap-1.5 flex-wrap">
                                    <span>{d.filename}</span>
                                    <Badge variant="outline" className="text-[9px]"><Layers className="h-2.5 w-2.5 mr-0.5" />v{d.version}</Badge>
                                    {d.is_frozen && (
                                      <Badge variant="outline" className="text-[9px] bg-amber-50 border-amber-300 text-amber-800" data-testid={`vault-frozen-${d.object_id}`}>
                                        <Lock className="h-2.5 w-2.5 mr-0.5" /> SIGNED
                                      </Badge>
                                    )}
                                  </div>
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
            {meetings.length === 0 ? (
              <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
                <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                {loading ? "Loading meeting notes…" : "No meeting notes yet. Your adviser will publish a record after each session."}
              </CardContent></Card>
            ) : meetings.map((m) => (
              <Card key={m.meeting_id} className="hover:shadow-md transition-shadow" data-testid={`vault-meeting-${m.meeting_id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-[#1a2744]">{m.title}</h4>
                        {m.recording_available && <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">Recording</Badge>}
                        {(m.tags || []).map((t) => (
                          <Badge key={t} variant="outline" className="text-[9px] capitalize"><TagIcon className="h-2.5 w-2.5 mr-0.5" />{t.replace(/_/g, " ")}</Badge>
                        ))}
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

        <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1.5"><Lock className="h-3 w-3" /> Read-only · contact your adviser to request a new document or signature</p>
      </div>
      </PageShell>
    </Layout>
  );
};

export default MyVault;
