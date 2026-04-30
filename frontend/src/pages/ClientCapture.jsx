// Client Capture (Xplan-style "Key Dates & Disclosures")
// =====================================================
// Mirrors the layout of Xplan's snapshot screen: 6 grouped sections each
// rendered as a labelled grid with field-name on the left in BOLD and value
// on the right. Editable fields persist via PUT /api/client-capture/{id}.
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { Save, RotateCcw, ContactRound, ListChecks, Handshake, FileSearch, BookOpen, Gauge, Download, Upload } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

// Section header — the blue pill from Xplan.
const SectionHeader = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="px-4 py-1.5 rounded-full bg-[#3B9CDC] text-white flex items-center gap-2 shadow-sm">
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span className="text-xs font-semibold tracking-wide">{label}</span>
    </div>
  </div>
);

// Single field row — bold label left, value right (Xplan format).
const Row = ({ label, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-1 md:gap-4 py-2 border-b border-slate-200 items-start">
    <Label className="text-sm font-bold text-[#1a2744]">{label}</Label>
    <div className="text-sm text-[#1a2744]">{children}</div>
  </div>
);

// ---------- Page ----------
const ClientCapture = () => {
  const [clientId, setClientId] = useState(() => getActiveClientId() || "thompson_family");
  const [data, setData] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(original), [data, original]);

  // Defaults sourced from clientData.js so the form is pre-populated when no
  // server-side record exists yet.
  const buildDefaults = (id) => {
    const c = CLIENT_DATA[id] || {};
    const p = c.profile || {};
    return {
      client_id: id,
      contact: {
        is_master: true,
        client_name: p.name || id,
        gender: "",
        date_of_birth: "",
        marital_status: p.status || "",
        tax_resident_status: "Australian resident",
        tax_file_number: "",
        advice_delivery_method: "Email",
        preferred_email: p.email || "",
        preferred_phone: p.phone || "",
        street: p.address || "",
        suburb: "",
        state: "VIC",
        postcode: "",
        comments: "",
      },
      service_overview: {
        client_adviser: p.advisor || "James Mitchell",
        paraplanner: "",
        administrator: "",
        created_on_xplan: "",
        client_active_date: "",
        entity_status: "Client",
        category: "Active",
        annual_fee: 4400,
        fact_find_signed_date: "",
        last_risk_profile_date: "",
        aml_completion_date: "",
        politically_exposed_person: false,
        first_personal_advice_date: "",
        last_implemented_soa_date: "",
        last_review_roa_date: "",
        applicable_soa_date: "",
      },
      service_agreements: { service_agreement_required: true, service_agreement_anniversary_date: "", service_agreement_status: "Active" },
      reviews: { last_review_date: "", items: [] },
      fsg: { version_number: "v6.2", fsg_provided: true, fsg_method_of_delivery: "Email", fsg_issuer: "Halcyon Wealth" },
      risk_profile: { profile: p.riskProfile || "Balanced", last_completed_date: "", score: null, notes: "" },
    };
  };

  // Fetch the record on client change.
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API}/api/client-capture/${clientId}`);
        const d = r.ok ? await r.json() : buildDefaults(clientId);
        // Merge with defaults so any missing keys still show pre-filled.
        const defaults = buildDefaults(clientId);
        const merged = {
          ...defaults,
          ...d,
          contact: { ...defaults.contact, ...(d.contact || {}) },
          service_overview: { ...defaults.service_overview, ...(d.service_overview || {}) },
          service_agreements: { ...defaults.service_agreements, ...(d.service_agreements || {}) },
          reviews: { ...defaults.reviews, ...(d.reviews || {}) },
          fsg: { ...defaults.fsg, ...(d.fsg || {}) },
          risk_profile: { ...defaults.risk_profile, ...(d.risk_profile || {}) },
        };
        if (alive) { setData(merged); setOriginal(merged); }
      } catch {
        if (alive) {
          const def = buildDefaults(clientId);
          setData(def); setOriginal(def);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [clientId]);

  const set = (section, field, value) => {
    setData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/client-capture/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const saved = await r.json();
      setData(saved); setOriginal(saved);
      toast.success("Client capture saved", { description: `Updated ${new Date().toLocaleTimeString()}` });
    } catch (e) {
      toast.error("Save failed", { description: String(e).slice(0, 200) });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => { setData(original); toast.info("Changes reverted"); };

  const handlePullFromXplan = async () => {
    try {
      const r = await fetch(`${API}/api/xplan-sync/capture/${clientId}/pull`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      // Refetch the merged record so the UI reflects the pulled fields.
      const r2 = await fetch(`${API}/api/client-capture/${clientId}`);
      if (r2.ok) {
        const fresh = await r2.json();
        setData((prev) => ({ ...prev, ...fresh, service_overview: { ...prev.service_overview, ...(fresh.service_overview || {}) } }));
        setOriginal((prev) => ({ ...prev, ...fresh, service_overview: { ...prev.service_overview, ...(fresh.service_overview || {}) } }));
      }
      toast.success(`Pulled from Xplan (${out.mode})`, { description: out.fields_pulled?.length ? `${out.fields_pulled.length} fields refreshed` : "No changes" });
    } catch (e) {
      toast.error("Pull failed", { description: String(e).slice(0, 200) });
    }
  };

  const handlePushToXplan = async () => {
    if (dirty) await handleSave();
    try {
      const r = await fetch(`${API}/api/xplan-sync/capture/${clientId}/push`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      toast.success(`Pushed to Xplan (${out.mode})`, { description: `${out.fields_pushed || 0} fields synced` });
    } catch (e) {
      toast.error("Push failed", { description: String(e).slice(0, 200) });
    }
  };

  if (!data) return <Layout><div className="p-8 text-center text-muted-foreground">Loading…</div></Layout>;

  return (
    <Layout>
      <div className="max-w-[1100px] mx-auto p-4 space-y-4" data-testid="client-capture">
        {/* Toolbar */}
        <Card>
          <CardContent className="p-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <h1 className="text-xl font-bold text-[#1a2744]">Key Dates & Disclosures</h1>
              <p className="text-xs text-muted-foreground">Xplan-style client capture · sync source for SOA / ROA, FSG &amp; ongoing service obligations.</p>
            </div>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="text-sm border rounded px-2 py-1 bg-white hidden" data-testid="capture-client-select" aria-hidden="true">
              {Object.entries(CLIENT_DATA).filter(([k]) => k !== "advisor").map(([id, c]) => (
                <option key={id} value={id}>{c?.profile?.name || id}</option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 border rounded px-2.5 py-1 bg-slate-50" data-testid="capture-active-client">
              <span className="font-semibold text-[#1a2744]">{(CLIENT_DATA[clientId] || {})?.profile?.name || clientId}</span>
              <span className="text-[10px]">· active client</span>
            </div>
            {dirty && <Badge variant="outline" className="text-amber-700 border-amber-300">Unsaved</Badge>}
            <Button variant="outline" size="sm" onClick={handlePullFromXplan} data-testid="capture-pull-xplan" className="border-[#3B9CDC] text-[#3B9CDC] hover:bg-[#3B9CDC]/10"><Download className="h-3.5 w-3.5 mr-1" /> Pull Xplan</Button>
            <Button variant="outline" size="sm" onClick={handlePushToXplan} data-testid="capture-push-xplan" className="border-[#3B9CDC] text-[#3B9CDC] hover:bg-[#3B9CDC]/10"><Upload className="h-3.5 w-3.5 mr-1" /> Push Xplan</Button>
            <Button variant="outline" size="sm" onClick={handleReset} disabled={!dirty} data-testid="capture-reset"><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !dirty} data-testid="capture-save" className="bg-[#1a2744] hover:bg-[#0f1830] text-white"><Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Save"}</Button>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="p-5">
            <SectionHeader icon={ContactRound} label="Contact" />
            <Row label="Is Master">
              <Select value={data.contact.is_master ? "yes" : "no"} onValueChange={(v) => set("contact", "is_master", v === "yes")}>
                <SelectTrigger className="h-8 max-w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </Row>
            <Row label="Client Name"><Input value={data.contact.client_name || ""} onChange={(e) => set("contact", "client_name", e.target.value)} className="h-8 max-w-[480px]" /></Row>
            <Row label="Gender">
              <Select value={data.contact.gender || ""} onValueChange={(v) => set("contact", "gender", v)}>
                <SelectTrigger className="h-8 max-w-[180px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
              </Select>
            </Row>
            <Row label="Date of Birth"><Input type="date" value={data.contact.date_of_birth || ""} onChange={(e) => set("contact", "date_of_birth", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="Marital Status">
              <Select value={data.contact.marital_status || ""} onValueChange={(v) => set("contact", "marital_status", v)}>
                <SelectTrigger className="h-8 max-w-[200px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{["Single", "Married", "De facto", "Separated", "Divorced", "Widowed"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
            <Row label="Tax Resident Status"><Input value={data.contact.tax_resident_status || ""} onChange={(e) => set("contact", "tax_resident_status", e.target.value)} className="h-8 max-w-[300px]" /></Row>
            <Row label="Tax File Number"><Input value={data.contact.tax_file_number || ""} onChange={(e) => set("contact", "tax_file_number", e.target.value)} placeholder="123 456 789" className="h-8 max-w-[200px]" /></Row>
            <Row label="Disclosure - Advice delivery method"><Input value={data.contact.advice_delivery_method || ""} onChange={(e) => set("contact", "advice_delivery_method", e.target.value)} className="h-8 max-w-[300px]" /></Row>
            <Row label="Preferred Email"><Input type="email" value={data.contact.preferred_email || ""} onChange={(e) => set("contact", "preferred_email", e.target.value)} className="h-8 max-w-[400px]" /></Row>
            <Row label="Preferred Phone"><Input value={data.contact.preferred_phone || ""} onChange={(e) => set("contact", "preferred_phone", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="Street"><Input value={data.contact.street || ""} onChange={(e) => set("contact", "street", e.target.value)} className="h-8 max-w-[480px]" /></Row>
            <Row label="Suburb"><Input value={data.contact.suburb || ""} onChange={(e) => set("contact", "suburb", e.target.value)} className="h-8 max-w-[300px]" /></Row>
            <Row label="State">
              <Select value={data.contact.state || ""} onValueChange={(v) => set("contact", "state", v)}>
                <SelectTrigger className="h-8 max-w-[120px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
            <Row label="Postcode"><Input value={data.contact.postcode || ""} onChange={(e) => set("contact", "postcode", e.target.value)} className="h-8 max-w-[120px]" /></Row>
            <Row label="Comments"><Textarea rows={3} value={data.contact.comments || ""} onChange={(e) => set("contact", "comments", e.target.value)} className="max-w-[600px]" /></Row>
          </CardContent>
        </Card>

        {/* Service Overview */}
        <Card>
          <CardContent className="p-5">
            <SectionHeader icon={ListChecks} label="Service Overview" />
            <Row label="Client Adviser"><Input value={data.service_overview.client_adviser || ""} onChange={(e) => set("service_overview", "client_adviser", e.target.value)} className="h-8 max-w-[300px]" /></Row>
            <Row label="Paraplanner"><Input value={data.service_overview.paraplanner || ""} onChange={(e) => set("service_overview", "paraplanner", e.target.value)} className="h-8 max-w-[300px]" /></Row>
            <Row label="Administrator"><Input value={data.service_overview.administrator || ""} onChange={(e) => set("service_overview", "administrator", e.target.value)} className="h-8 max-w-[300px]" /></Row>
            <Row label="Created on Xplan"><Input type="date" value={data.service_overview.created_on_xplan || ""} onChange={(e) => set("service_overview", "created_on_xplan", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="Client Active Date"><Input type="date" value={data.service_overview.client_active_date || ""} onChange={(e) => set("service_overview", "client_active_date", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="Entity Status">
              <Select value={data.service_overview.entity_status || ""} onValueChange={(v) => set("service_overview", "entity_status", v)}>
                <SelectTrigger className="h-8 max-w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>{["Prospect", "Client", "Inactive", "Lost"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
            <Row label="Category">
              <Select value={data.service_overview.category || ""} onValueChange={(v) => set("service_overview", "category", v)}>
                <SelectTrigger className="h-8 max-w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>{["Active", "Inactive", "Premium", "Standard"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
            <Row label="Annual Fee"><Input type="number" value={data.service_overview.annual_fee ?? 0} onChange={(e) => set("service_overview", "annual_fee", parseFloat(e.target.value) || 0)} className="h-8 max-w-[180px]" /></Row>
            <Row label="Date the client last signed a Fact Find"><Input type="date" value={data.service_overview.fact_find_signed_date || ""} onChange={(e) => set("service_overview", "fact_find_signed_date", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="Date of Last Risk profile"><Input type="date" value={data.service_overview.last_risk_profile_date || ""} onChange={(e) => set("service_overview", "last_risk_profile_date", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="AML Completion Date"><Input type="date" value={data.service_overview.aml_completion_date || ""} onChange={(e) => set("service_overview", "aml_completion_date", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="Politically Exposed Person">
              <Select value={data.service_overview.politically_exposed_person ? "yes" : "no"} onValueChange={(v) => set("service_overview", "politically_exposed_person", v === "yes")}>
                <SelectTrigger className="h-8 max-w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
              </Select>
            </Row>
            <Row label="Date client first received personal advice"><Input type="date" value={data.service_overview.first_personal_advice_date || ""} onChange={(e) => set("service_overview", "first_personal_advice_date", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="Date of last implemented SOA"><Input type="date" value={data.service_overview.last_implemented_soa_date || ""} onChange={(e) => set("service_overview", "last_implemented_soa_date", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="Date of last Review ROA"><Input type="date" value={data.service_overview.last_review_roa_date || ""} onChange={(e) => set("service_overview", "last_review_roa_date", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="Date of applicable SOA"><Input type="date" value={data.service_overview.applicable_soa_date || ""} onChange={(e) => set("service_overview", "applicable_soa_date", e.target.value)} className="h-8 max-w-[200px]" /></Row>
          </CardContent>
        </Card>

        {/* Service Agreements */}
        <Card>
          <CardContent className="p-5">
            <SectionHeader icon={Handshake} label="Service Agreements" />
            <Row label="Service Agreement Required">
              <Select value={data.service_agreements.service_agreement_required ? "yes" : "no"} onValueChange={(v) => set("service_agreements", "service_agreement_required", v === "yes")}>
                <SelectTrigger className="h-8 max-w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
              </Select>
            </Row>
            <Row label="Service Agreement Anniversary Date"><Input type="date" value={data.service_agreements.service_agreement_anniversary_date || ""} onChange={(e) => set("service_agreements", "service_agreement_anniversary_date", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="Service Agreement Status">
              <Select value={data.service_agreements.service_agreement_status || ""} onValueChange={(v) => set("service_agreements", "service_agreement_status", v)}>
                <SelectTrigger className="h-8 max-w-[200px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{["Active", "Pending", "Expired", "Cancelled"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardContent className="p-5">
            <SectionHeader icon={FileSearch} label="Reviews" />
            <Row label="Last Review Date"><Input type="date" value={data.reviews.last_review_date || ""} onChange={(e) => set("reviews", "last_review_date", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <p className="text-xs text-muted-foreground mt-2">Review actions captured against this client are displayed in the Communications &gt; Checklist timeline.</p>
          </CardContent>
        </Card>

        {/* Financial Services Guide */}
        <Card>
          <CardContent className="p-5">
            <SectionHeader icon={BookOpen} label="Financial Services Guide" />
            <Row label="Version Number"><Input value={data.fsg.version_number || ""} onChange={(e) => set("fsg", "version_number", e.target.value)} className="h-8 max-w-[180px]" /></Row>
            <Row label="FSG Provided">
              <Select value={data.fsg.fsg_provided ? "yes" : "no"} onValueChange={(v) => set("fsg", "fsg_provided", v === "yes")}>
                <SelectTrigger className="h-8 max-w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
              </Select>
            </Row>
            <Row label="FSG Method of Delivery">
              <Select value={data.fsg.fsg_method_of_delivery || ""} onValueChange={(v) => set("fsg", "fsg_method_of_delivery", v)}>
                <SelectTrigger className="h-8 max-w-[200px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{["Email", "Mail", "In Person", "Portal Download"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
            <Row label="FSG Issuer"><Input value={data.fsg.fsg_issuer || ""} onChange={(e) => set("fsg", "fsg_issuer", e.target.value)} className="h-8 max-w-[300px]" /></Row>
          </CardContent>
        </Card>

        {/* Risk Profile */}
        <Card>
          <CardContent className="p-5">
            <SectionHeader icon={Gauge} label="Risk Profile" />
            <Row label="Profile">
              <Select value={data.risk_profile.profile || ""} onValueChange={(v) => set("risk_profile", "profile", v)}>
                <SelectTrigger className="h-8 max-w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>{["Defensive", "Conservative", "Balanced", "Growth", "High Growth"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
            <Row label="Last Completed Date"><Input type="date" value={data.risk_profile.last_completed_date || ""} onChange={(e) => set("risk_profile", "last_completed_date", e.target.value)} className="h-8 max-w-[200px]" /></Row>
            <Row label="Score"><Input type="number" value={data.risk_profile.score ?? ""} onChange={(e) => set("risk_profile", "score", e.target.value === "" ? null : parseInt(e.target.value, 10))} className="h-8 max-w-[120px]" /></Row>
            <Row label="Notes"><Textarea rows={3} value={data.risk_profile.notes || ""} onChange={(e) => set("risk_profile", "notes", e.target.value)} className="max-w-[600px]" /></Row>
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground text-center pb-8">{loading ? "Loading…" : `Last saved ${data.updated_at ? new Date(data.updated_at).toLocaleString() : "—"}`}</p>
      </div>
    </Layout>
  );
};

export default ClientCapture;
