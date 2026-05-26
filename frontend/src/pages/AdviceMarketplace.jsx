// AdviceMarketplace — curated catalogue of pre-built strategy templates
// that advisers can browse, preview and clone into their Deals pipeline.
//
// Pulls from /api/advice-marketplace/templates. Clone fires
// /api/advice-marketplace/templates/{id}/clone which creates a Deal pre-filled
// with the strategy payload and tags the audit log so we can track marketplace
// uptake versus manual deal creation.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { PageShell, PillButton, ChipFilter, Tile } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, Search, Sparkles, Clock, TrendingUp, GitFork, Receipt, ChevronRight } from "lucide-react";
import { getActiveClientId, CLIENT_DATA } from "@/data/clientData";

const API = process.env.REACT_APP_BACKEND_URL;

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const COMPLEXITY_META = {
  low: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Low complexity" },
  medium: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Medium complexity" },
  high: { color: "bg-rose-50 text-rose-700 border-rose-200", label: "High complexity" },
};

const AdviceMarketplace = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(null);
  const clientId = getActiveClientId() || "thompson_family";
  const client = CLIENT_DATA[clientId];

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Best-effort idempotent seed so the page is never empty
      await fetch(`${API}/api/advice-marketplace/seed`, { method: "POST" });
      const url = new URL(`${API}/api/advice-marketplace/templates`);
      if (category && category !== "all") url.searchParams.set("category", category);
      if (search.trim()) url.searchParams.set("search", search.trim());
      const r = await fetch(url.toString());
      const data = await r.json();
      setTemplates(data.templates || []);
      setCategories(data.categories || []);
    } catch (e) {
      toast.error("Failed to load marketplace", { description: String(e).slice(0, 200) });
    } finally { setLoading(false); }
  }, [search, category]);

  useEffect(() => { refresh(); }, [refresh]);

  const cloneTemplate = async (template) => {
    setCloning(template.template_id);
    try {
      const r = await fetch(`${API}/api/advice-marketplace/templates/${template.template_id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      toast.success(`Strategy cloned to Deal pipeline`, {
        description: `${template.title} → Deal ${out.deal_id} (draft) for ${client?.profile?.name || clientId}.`,
        duration: 6000,
        action: { label: "Open Activity", onClick: () => navigate("/deals") },
      });
      refresh();
    } catch (e) {
      toast.error("Clone failed", { description: String(e).slice(0, 200) });
    } finally { setCloning(null); }
  };

  const categoryOptions = [
    { value: "all", label: "All", count: templates.length },
    ...categories.map((c) => ({ value: c.category, label: c.category, count: c.count })),
  ];

  const totalClones = templates.reduce((s, t) => s + (t.clone_count || 0), 0);
  const totalFee = templates.reduce((s, t) => s + (t.estimated_fee || 0), 0);

  return (
    <Layout>
      <PageShell
        eyebrow="MARKETPLACE"
        title="Advice marketplace"
        accent={templates.length ? `${templates.length} templates` : null}
        subtitle="Curated strategy templates ready to clone into your Deals pipeline. Every clone creates a draft Deal pre-filled with the strategy payload so advisers can start at 80% complete."
        meta={`${totalClones} total clones across the firm · avg fee ${fmt(templates.length ? totalFee / templates.length : 0)}`}
        metrics={[
          { label: "Templates", value: String(templates.length) },
          { label: "Categories", value: String(categories.length) },
          { label: "Total clones", value: String(totalClones) },
          { label: "Active client", value: client?.profile?.name?.split(" ")[0] || "—" },
        ]}
        filters={(
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 border border-slate-300 rounded-full px-3 py-1.5 max-w-xs">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                placeholder="Search title, summary, tag…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-[12px] focus:outline-none w-full"
                data-testid="marketplace-search"
              />
            </div>
            <ChipFilter
              value={category}
              onChange={setCategory}
              dataTestidPrefix="marketplace-cat"
              options={categoryOptions}
            />
          </div>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="marketplace-grid">
          {loading && (
            <Tile className="col-span-full text-center py-12 text-sm text-muted-foreground">Loading marketplace templates…</Tile>
          )}
          {!loading && templates.length === 0 && (
            <Tile className="col-span-full text-center py-12 text-sm text-muted-foreground">
              <Store className="h-10 w-10 mx-auto mb-2 opacity-30" />
              No templates match the current filter.
            </Tile>
          )}
          {!loading && templates.map((t) => {
            const meta = COMPLEXITY_META[t.complexity] || COMPLEXITY_META.medium;
            return (
              <Card key={t.template_id} className="hover:shadow-md transition-shadow border border-slate-200" data-testid={`tpl-${t.template_id}`}>
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide bg-[#1a2744]/5 border-[#1a2744]/20 text-[#1a2744]">{t.category}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-[#1a2744] leading-tight">{t.title}</h3>
                  <p className="text-[12px] text-muted-foreground mt-2 leading-snug flex-1">{t.summary}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(t.tags || []).slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[9px] capitalize">{tag.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-dashed border-slate-200 text-center">
                    <div><p className="text-[9px] uppercase text-muted-foreground"><Receipt className="h-2.5 w-2.5 inline mr-0.5" />Fee</p><p className="text-xs font-bold text-[#1a2744]">{fmt(t.estimated_fee)}</p></div>
                    <div><p className="text-[9px] uppercase text-muted-foreground"><Clock className="h-2.5 w-2.5 inline mr-0.5" />Duration</p><p className="text-xs font-bold text-[#1a2744]">{t.duration_days}d</p></div>
                    <div><p className="text-[9px] uppercase text-muted-foreground"><TrendingUp className="h-2.5 w-2.5 inline mr-0.5" />Popularity</p><p className="text-xs font-bold text-[#1a2744]">{t.popularity}%</p></div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] text-muted-foreground"><GitFork className="h-2.5 w-2.5 inline mr-1" />{t.clone_count} clones</span>
                    <Button
                      size="sm"
                      onClick={() => cloneTemplate(t)}
                      disabled={cloning === t.template_id}
                      className="bg-[#D4A84C] text-[#1a2744] hover:bg-[#D4A84C]/90 h-8 text-[11px]"
                      data-testid={`clone-${t.template_id}`}
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> {cloning === t.template_id ? "Cloning…" : "Clone to Deal"} <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-4">
          Cloning creates a draft Deal in the <a href="/deals" className="underline text-[#1a2744]">Activity pipeline</a> tagged with the source template_id so the firm can track marketplace conversion rates.
        </p>
      </PageShell>
    </Layout>
  );
};

export default AdviceMarketplace;
