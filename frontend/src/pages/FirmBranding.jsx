// FirmBranding — white-label settings page. Lets a Principal set the firm
// name, primary/accent colours, logo URL, PDF footer and support email.
// Backed by /api/branding/* (Mongo doc `firm_branding/_id=default`).
//
// Surfaces a live preview that re-applies the colours as CSS variables on
// the preview swatch — no full app re-skin yet, but a visible demonstration.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { PageShell, PillButton, Tile } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, RefreshCw, Save, Building2, Image as ImageIcon, Mail, FileText } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const FirmBranding = () => {
  const [branding, setBranding] = useState(null);
  const [dirty, setDirty] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/branding/current`);
      const data = await r.json();
      setBranding(data);
      setDirty({});
    } catch (e) {
      toast.error("Failed to load branding", { description: String(e).slice(0, 200) });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onField = (key, val) => setDirty((d) => ({ ...d, [key]: val }));
  const merged = { ...(branding || {}), ...dirty };
  const dirtyKeys = Object.keys(dirty);

  const save = async () => {
    if (dirtyKeys.length === 0) { toast.info("No changes to save"); return; }
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/branding/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dirty),
      });
      if (!r.ok) throw new Error((await r.json())?.detail || `HTTP ${r.status}`);
      toast.success("Branding updated", { description: `${dirtyKeys.length} field${dirtyKeys.length === 1 ? "" : "s"} saved.` });
      refresh();
    } catch (e) {
      toast.error("Save failed", { description: String(e).slice(0, 200) });
    } finally { setBusy(false); }
  };

  const reset = async () => {
    if (!window.confirm("Reset to Halcyon Wealth defaults? This will overwrite any firm-specific branding.")) return;
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/branding/reset`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      toast.success("Reset to defaults");
      refresh();
    } catch (e) {
      toast.error("Reset failed", { description: String(e).slice(0, 200) });
    } finally { setBusy(false); }
  };

  if (loading || !branding) {
    return <Layout><div className="p-12 text-center text-sm text-muted-foreground">Loading firm branding…</div></Layout>;
  }

  return (
    <Layout>
      <PageShell
        eyebrow="WHITE-LABEL"
        title="Firm branding"
        accent={branding.is_default ? "default theme" : "customised"}
        subtitle="Customise the firm name, brand colours, logo and PDF footer text. Settings persist in Mongo and apply across server-rendered PDFs immediately."
        meta={branding.is_default ? "Currently using Halcyon Wealth defaults — first save will create the firm-specific doc." : `Last updated ${branding.updated_at ? new Date(branding.updated_at).toLocaleString() : "—"}`}
        actions={(
          <>
            <PillButton variant="ghost" onClick={reset} disabled={busy} data-testid="branding-reset">
              <RefreshCw className="h-3.5 w-3.5 inline mr-1.5" /> Reset
            </PillButton>
            <PillButton onClick={save} disabled={busy || dirtyKeys.length === 0} data-testid="branding-save">
              <Save className="h-3.5 w-3.5 inline mr-1.5" /> {busy ? "Saving…" : `Save ${dirtyKeys.length || ""} changes`}
            </PillButton>
          </>
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="firm-branding">

          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#1a2744] flex items-center gap-2"><Building2 className="h-4 w-4 text-[#D4A84C]" /> Firm details</h3>
                <Field label="Firm name" value={merged.firm_name} onChange={(v) => onField("firm_name", v)} testid="branding-firm-name" />
                <Field label="Tagline" value={merged.tagline} onChange={(v) => onField("tagline", v)} testid="branding-tagline" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="AFSL #" value={merged.afsl} onChange={(v) => onField("afsl", v)} testid="branding-afsl" placeholder="e.g. 285573" />
                  <Field label="Domain" value={merged.domain} onChange={(v) => onField("domain", v)} testid="branding-domain" placeholder="advisers.firm.com.au" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#1a2744] flex items-center gap-2"><Palette className="h-4 w-4 text-[#D4A84C]" /> Colours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ColorField label="Primary (navy)" value={merged.primary_color} onChange={(v) => onField("primary_color", v)} testid="branding-primary" />
                  <ColorField label="Accent (gold)" value={merged.accent_color} onChange={(v) => onField("accent_color", v)} testid="branding-accent" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#1a2744] flex items-center gap-2"><ImageIcon className="h-4 w-4 text-[#D4A84C]" /> Logos &amp; documents</h3>
                <Field label="Logo URL" value={merged.logo_url} onChange={(v) => onField("logo_url", v)} testid="branding-logo" placeholder="https://cdn.firm.com.au/logo.png" />
                <Field label="Favicon URL" value={merged.favicon_url} onChange={(v) => onField("favicon_url", v)} testid="branding-favicon" placeholder="https://cdn.firm.com.au/favicon.ico" />
                <Field label="PDF footer text" value={merged.pdf_footer} onChange={(v) => onField("pdf_footer", v)} testid="branding-footer" />
                <Field label="Support email" value={merged.support_email} onChange={(v) => onField("support_email", v)} testid="branding-email" />
              </CardContent>
            </Card>
          </div>

          {/* Live preview */}
          <Card className="sticky top-4 self-start">
            <CardContent className="p-5 space-y-3" data-testid="branding-preview">
              <h3 className="text-sm font-bold text-[#1a2744] flex items-center gap-2"><FileText className="h-4 w-4 text-[#D4A84C]" /> Live preview</h3>
              <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: merged.primary_color }}>
                <div className="p-4 text-white">
                  <p className="text-[10px] uppercase tracking-wide opacity-70">Preview</p>
                  <h4 className="text-base font-bold mt-0.5">{merged.firm_name}</h4>
                  <p className="text-[11px] opacity-80 mt-0.5">{merged.tagline}</p>
                  <div className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: merged.accent_color, color: merged.primary_color }}>
                    Sample call-to-action
                  </div>
                </div>
                <div className="p-3 bg-white text-[#1a2744] text-[11px] border-t" style={{ borderColor: merged.accent_color }}>
                  <p className="font-semibold">SOA · Letter-quality PDF</p>
                  <p className="text-muted-foreground mt-1">Footer: <em>{merged.pdf_footer}</em></p>
                  <p className="text-muted-foreground mt-1"><Mail className="h-2.5 w-2.5 inline mr-1" />{merged.support_email}</p>
                  {merged.afsl && <p className="text-muted-foreground">AFSL {merged.afsl}</p>}
                </div>
              </div>
              <div className="flex gap-2 text-[10px]">
                <Badge variant="outline" className="font-mono" style={{ borderColor: merged.primary_color, color: merged.primary_color }}>{merged.primary_color}</Badge>
                <Badge variant="outline" className="font-mono" style={{ borderColor: merged.accent_color, color: merged.accent_color }}>{merged.accent_color}</Badge>
              </div>
              {dirtyKeys.length > 0 && (
                <p className="text-[10px] text-amber-700 mt-2 font-medium">
                  {dirtyKeys.length} unsaved change{dirtyKeys.length === 1 ? "" : "s"}: {dirtyKeys.map((k) => k.replace(/_/g, " ")).join(", ")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </Layout>
  );
};

const Field = ({ label, value, onChange, testid, placeholder }) => (
  <div>
    <Label className="text-[10px] uppercase">{label}</Label>
    <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 text-sm" data-testid={testid} />
  </div>
);

const ColorField = ({ label, value, onChange, testid }) => (
  <div>
    <Label className="text-[10px] uppercase">{label}</Label>
    <div className="flex items-center gap-2">
      <Input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-14 p-1" data-testid={`${testid}-picker`} />
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="#1a2744" className="h-9 text-sm font-mono" data-testid={testid} />
    </div>
  </div>
);

export default FirmBranding;
