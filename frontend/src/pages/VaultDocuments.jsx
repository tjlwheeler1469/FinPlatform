// VaultDocuments — metadata-tag search + version history over the local
// object-storage backend. Every uploaded PDF (SOA/ROA/Implementation Pack)
// is automatically versioned by family_key, and we surface v1/v2/v3 inline.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FolderLock, Search, Download, RefreshCw, FileText, Layers, HardDrive,
  Tag as TagIcon, ChevronDown, ChevronRight, RotateCcw,
} from "lucide-react";
import { fmtCurrencyCompact } from "@/lib/inputBounds";
import { useRbac } from "@/lib/rbac";

const API = process.env.REACT_APP_BACKEND_URL;

const fmtBytes = (n) => {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`;
  return `${n} B`;
};

const fmtDate = (iso) => new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const VersionRow = ({ obj, family, onRestored }) => {
  const { requireOrToast } = useRbac();
  const restore = async () => {
    if (!requireOrToast("file.restore_version", { targetKind: "file", targetRef: obj.object_id })) return;
    if (!window.confirm(`Restore v${obj.version} as the new latest? A new version will be created with these bytes.`)) return;
    try {
      const r = await fetch(`${API}/api/files/versions/${family}/restore/${obj.object_id}`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      toast.success(`v${out.restored_from_version} restored as v${out.new_version}`);
      onRestored?.();
    } catch (e) {
      toast.error("Restore failed", { description: String(e).slice(0, 200) });
    }
  };
  return (
    <div className="flex items-center gap-2 text-[11px] py-1.5 px-2 hover:bg-slate-50 rounded">
      <Badge variant="outline" className="text-[10px] font-mono">v{obj.version}</Badge>
      <span className="text-muted-foreground">{fmtDate(obj.created_at)}</span>
      <span className="text-muted-foreground">·</span>
      <span>{fmtBytes(obj.size_bytes)}</span>
      {obj.is_latest && <Badge variant="outline" className="text-[9px] bg-emerald-50 border-emerald-300 text-emerald-800 ml-1">LATEST</Badge>}
      <div className="ml-auto flex gap-3">
        {!obj.is_latest && (
          <button onClick={restore} className="text-amber-700 hover:underline" data-testid={`restore-${obj.object_id}`}>
            <RotateCcw className="h-3 w-3 inline mr-0.5" /> restore
          </button>
        )}
        <a href={`${API}/api/files/${obj.object_id}`} target="_blank" rel="noopener noreferrer" className="text-[#3B9CDC] hover:underline" data-testid={`download-${obj.object_id}`}>
          <Download className="h-3 w-3 inline mr-0.5" /> download
        </a>
      </div>
    </div>
  );
};

const FamilyCard = ({ family, objects, onRefresh }) => {
  const [open, setOpen] = useState(false);
  const latest = objects.find((o) => o.is_latest) || objects[objects.length - 1];
  const tags = Array.from(new Set(objects.flatMap((o) => o.tags || [])));
  return (
    <Card data-testid={`family-${family}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-[#1a2744] mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[#1a2744] truncate">{latest.filename}</p>
              <Badge variant="outline" className="text-[9px]"><Layers className="h-2.5 w-2.5 mr-0.5" />{objects.length} version{objects.length === 1 ? "" : "s"}</Badge>
              {tags.map((t) => (
                <Badge key={t} variant="outline" className="text-[9px] capitalize"><TagIcon className="h-2.5 w-2.5 mr-0.5" />{t}</Badge>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Family <span className="font-mono">{family}</span> · owner {latest.owner_client_id || "—"} · latest {fmtDate(latest.created_at)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} className="h-7" data-testid={`toggle-${family}`}>
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
        {open && (
          <div className="mt-2 pl-6 border-l-2 border-slate-200">
            {[...objects].sort((a, b) => a.version - b.version).map((o) => <VersionRow key={o.object_id} obj={o} family={family} onRestored={onRefresh} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const VaultDocuments = () => {
  const [objects, setObjects] = useState([]);
  const [usage, setUsage] = useState(null);
  const [filter, setFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [showAllVersions, setShowAllVersions] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const url = new URL(`${API}/api/files/search`);
      url.searchParams.set("only_latest", showAllVersions ? "false" : "true");
      url.searchParams.set("limit", "200");
      if (tagFilter) url.searchParams.set("tag", tagFilter);
      const [s, u] = await Promise.all([
        fetch(url.toString()).then((r) => r.json()),
        fetch(`${API}/api/files/_/usage`).then((r) => r.json()),
      ]);
      setObjects(s.objects || []);
      setUsage(u);
    } catch (e) {
      toast.error("Failed to load Vault", { description: String(e).slice(0, 200) });
    }
  }, [tagFilter, showAllVersions]);

  useEffect(() => { refresh(); }, [refresh]);

  // Group by family_key so we can show v1/v2/v3 inline. We always fetch the
  // family when the user expands a card (for now, group what we have).
  const filtered = objects.filter((o) =>
    !filter ||
    (o.filename || "").toLowerCase().includes(filter.toLowerCase()) ||
    (o.owner_client_id || "").toLowerCase().includes(filter.toLowerCase()) ||
    (o.family_key || "").toLowerCase().includes(filter.toLowerCase())
  );
  const families = {};
  for (const o of filtered) {
    const fk = o.family_key || o.object_id;
    if (!families[fk]) families[fk] = [];
    families[fk].push(o);
  }

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto p-4 space-y-4" data-testid="vault-documents">
        <Card>
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
            <FolderLock className="h-6 w-6 text-[#1a2744]" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#1a2744]">Document Vault</h1>
              <p className="text-xs text-muted-foreground">
                {usage?.total_count ?? 0} documents · {usage?.latest_count ?? 0} latest versions · {fmtBytes(usage?.total_bytes ?? 0)} on disk
                <span className="ml-2 font-mono text-[10px]">{usage?.storage_root}</span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} data-testid="vault-refresh"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <Search className="h-4 w-4 text-slate-400" />
            <Input placeholder="Search filename, owner or family…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs h-8" data-testid="vault-search" />
            <Input placeholder="Tag filter (e.g. soa)" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="max-w-[180px] h-8" data-testid="vault-tag" />
            <Button variant={showAllVersions ? "default" : "outline"} size="sm" onClick={() => setShowAllVersions((v) => !v)} data-testid="vault-toggle-versions">
              <Layers className="h-3.5 w-3.5 mr-1" /> {showAllVersions ? "Showing all versions" : "Latest only"}
            </Button>
            <span className="text-[11px] text-muted-foreground ml-auto"><HardDrive className="h-3 w-3 inline mr-1" />local persistent disk</span>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {Object.entries(families).length === 0 && (
            <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
              No documents in the Vault yet. Generate an Implementation Pack from the SOA / ROA builder — its PDF will land here automatically.
            </CardContent></Card>
          )}
          {Object.entries(families).map(([fk, objs]) => <FamilyCard key={fk} family={fk} objects={objs} onRefresh={refresh} />)}
        </div>
      </div>
    </Layout>
  );
};

export default VaultDocuments;
