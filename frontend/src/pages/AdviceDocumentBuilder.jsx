// AdviceDocumentBuilder — generate a printable SOA or ROA from the active
// adviser client and download it as a PDF. Saves a record into the
// /api/compliance-docs/document collection so it appears in the Vault.
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { buildAdviceDocument, formatCurrency } from "@/lib/adviceDocumentEngine";
import { Download, FileText, Save, Eye, Upload, Tag, Mail, Rocket, ShoppingBag, Package, CheckCircle2, Loader2 } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ---------- Section renderers (HTML preview) ----------
const SectionCover = ({ s }) => (
  <div className="page-soa flex flex-col items-center justify-center text-center py-24" data-soa-section={s.id}>
    <div className="mb-12">
      <div className="text-[11px] font-bold tracking-[0.5em] text-muted-foreground uppercase">{s.preparedBy} · {s.fsl}</div>
    </div>
    <h1 className="text-5xl font-bold text-[#1a2744] mb-3">{s.title}</h1>
    <p className="text-lg text-muted-foreground mb-12">Prepared for {s.preparedFor}</p>
    <div className="space-y-1 text-xs text-muted-foreground">
      <p><strong className="text-[#1a2744]">As at:</strong> {s.asAt}</p>
      <p><strong className="text-[#1a2744]">Document ref:</strong> {s.documentRef}</p>
      <p><strong className="text-[#1a2744]">Adviser:</strong> {s.preparedBy} · {s.ar}</p>
    </div>
  </div>
);

const SectionStandard = ({ s }) => (
  <div className="page-soa space-y-3 py-6" data-soa-section={s.id}>
    <h2 className="text-2xl font-bold text-[#1a2744] border-b-2 border-[#D4A84C] pb-2">{s.heading}</h2>
    {s.body && <p className="text-sm leading-relaxed">{s.body}</p>}
    {s.metrics && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {s.metrics.map((m, i) => (
          <div key={i} className="border rounded p-3 bg-slate-50">
            <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
            <p className="text-lg font-bold text-[#1a2744]">{m.value}</p>
          </div>
        ))}
      </div>
    )}
    {s.bullets && (
      <ul className="list-disc pl-6 space-y-1 text-sm">
        {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    )}
    {s.rows && (
      <table className="w-full text-sm border-collapse mt-2">
        <tbody>
          {s.rows.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="py-2 px-2 font-medium text-muted-foreground w-1/2">{r[0]}</td>
              <td className="py-2 px-2 text-[#1a2744] font-semibold">{r[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
    {s.items && (
      <ol className="space-y-3 mt-2">
        {s.items.map((item, i) => (
          <li key={i} className="border-l-4 border-[#D4A84C] pl-3 py-1">
            <p className="font-semibold text-[#1a2744]">{item.title || item.n + ". " + item.title}</p>
            {item.detail && <p className="text-sm text-muted-foreground">{item.detail}</p>}
            {item.rationale && <p className="text-sm text-muted-foreground">{item.rationale}</p>}
            {item.impact && <p className="text-xs text-emerald-700 mt-1"><strong>Impact:</strong> {item.impact}</p>}
            {item.risks && item.risks.length > 0 && <p className="text-xs text-amber-700 mt-1"><strong>Risks:</strong> {item.risks.join("; ")}</p>}
            {Number.isFinite(item.cost) && <p className="text-xs text-muted-foreground mt-1"><strong>Cost:</strong> {formatCurrency(item.cost)}</p>}
          </li>
        ))}
      </ol>
    )}
    {s.assets && (
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Assets</p>
          <table className="w-full text-xs">
            <tbody>
              {s.assets.map((a, i) => (
                <tr key={i} className="border-b"><td className="py-1">{a.name || a.type}</td><td className="text-right font-semibold">{formatCurrency(a.value)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Liabilities</p>
          <table className="w-full text-xs">
            <tbody>
              {(s.liabilities || []).map((l, i) => (
                <tr key={i} className="border-b"><td className="py-1">{l.name || l.type}</td><td className="text-right font-semibold">{formatCurrency(l.value || l.balance)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="col-span-2 border-t-2 border-[#D4A84C] pt-2 flex justify-between text-sm font-bold">
          <span>Net Worth</span><span>{formatCurrency(s.netWorth)}</span>
        </div>
      </div>
    )}
    {s.summary && (
      <div className="grid grid-cols-3 gap-3 mt-2">
        <Stat l="Portfolio value" v={formatCurrency(s.summary.portfolioValue)} />
        <Stat l="IRR (since inception)" v={`${s.summary.irrPct.toFixed(2)}%`} />
        <Stat l="TWR (since inception)" v={`${s.summary.twrPct.toFixed(2)}%`} />
        <Stat l="Annual income" v={formatCurrency(s.summary.annualIncome)} />
        <Stat l="Realised CGT (FYTD)" v={formatCurrency(s.summary.realizedCgt)} />
        <Stat l="Unrealised CGT" v={formatCurrency(s.summary.unrealizedCgt)} />
      </div>
    )}
    {s.holdings && (
      <table className="w-full text-xs mt-3 border">
        <thead className="bg-slate-100">
          <tr><th className="text-left p-2">Holding</th><th className="text-left p-2">Type</th><th className="text-right p-2">Value</th><th className="text-right p-2">% portfolio</th></tr>
        </thead>
        <tbody>
          {s.holdings.map((h, i) => (
            <tr key={i} className="border-t"><td className="p-2">{h.name}</td><td className="p-2">{h.type}</td><td className="text-right p-2">{formatCurrency(h.value)}</td><td className="text-right p-2">{h.pctOfPortfolio}%</td></tr>
          ))}
        </tbody>
      </table>
    )}
    {s.scenario && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
        <Stat l="Confidence" v={`${s.scenario.confidence}%`} />
        <Stat l="Portfolio at retirement" v={formatCurrency(s.scenario.portfolioAtRetirement)} />
        <Stat l="Success probability" v={`${s.scenario.successProb}%`} />
        <Stat l="Years sustainable" v={String(s.scenario.yearsSustainable)} />
      </div>
    )}
    {s.signatures && (
      <div className="grid grid-cols-2 gap-12 mt-12">
        {s.signatures.map((sig, i) => (
          <div key={i} className="border-t-2 border-[#1a2744] pt-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">{sig.role}</p>
            <p className="text-sm font-semibold">{sig.name}</p>
            <p className="text-xs text-muted-foreground">Date: {sig.date}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const Stat = ({ l, v }) => (
  <div className="border rounded p-2 bg-slate-50">
    <p className="text-[10px] text-muted-foreground uppercase">{l}</p>
    <p className="text-sm font-bold text-[#1a2744]">{v}</p>
  </div>
);

const renderSection = (s) => {
  if (s.type === "cover") return <SectionCover key={s.id} s={s} />;
  return <SectionStandard key={s.id} s={s} />;
};

// ---------- Page ----------
const AdviceDocumentBuilder = () => {
  const [docType, setDocType] = useState("soa");
  const [clientId, setClientId] = useState(() => getActiveClientId() || "thompson_family");
  const [generating, setGenerating] = useState(false);
  const [packBusy, setPackBusy] = useState(false);
  const [packResult, setPackResult] = useState(null);
  const [showTokens, setShowTokens] = useState(false);
  const [tokens, setTokens] = useState({});
  const [emailMode, setEmailMode] = useState("mocked");

  // Pull the canonical Xmerge token dictionary on mount so each rendered
  // section can show its Xplan field code as a hoverable badge.
  useEffect(() => {
    fetch(`${API_URL}/api/xplan-sync/xmerge/tokens`)
      .then((r) => r.ok ? r.json() : { tokens: {} })
      .then((d) => setTokens(d.tokens || {}))
      .catch(() => setTokens({}));
    fetch(`${API_URL}/api/email-resend/status`)
      .then((r) => r.ok ? r.json() : { mode: "mocked" })
      .then((d) => setEmailMode(d.mode || "mocked"))
      .catch(() => setEmailMode("mocked"));
  }, []);

  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const document = useMemo(() => buildAdviceDocument({ docType, client }), [docType, client]);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await buildPdfBlob();
      if (!blob) throw new Error("PDF render failed");
      const filename = `${docType.toUpperCase()}-${document.client.name.replace(/[^a-z0-9]/gi, "_")}-${new Date().toISOString().slice(0, 10)}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url; a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${docType.toUpperCase()} downloaded`, { description: filename });
    } catch (e) {
      toast.error("PDF generation failed", { description: String(e).slice(0, 200) });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToVault = async () => {
    try {
      const payload = {
        client_id: document.client.id,
        client_name: document.client.name,
        document_type: docType,
        advice_type: "comprehensive",
        title: docType === "soa" ? "Comprehensive Retirement Strategy" : "Strategy update",
        advice_areas: ["retirement", "investments", "superannuation"],
        adviser_id: "adv_mitchell",
        adviser_name: document.adviser.name,
        advice_date: new Date().toISOString().slice(0, 10),
        advice_fee: docType === "soa" ? 4950 : 1850,
      };
      const r = await fetch(`${API_URL}/api/compliance-docs/document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      toast.success(`Saved to Vault`, { description: `Ref: ${out.document_id}` });
    } catch (e) {
      toast.error("Save failed", { description: String(e).slice(0, 200) });
    }
  };

  const buildPdfBlob = async () => {
    const root = window.document.getElementById("soa-document-root");
    if (!root) return null;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const sections = root.querySelectorAll("[data-soa-section]");
    for (let i = 0; i < sections.length; i++) {
      const canvas = await html2canvas(sections[i], { scale: 1.5, backgroundColor: "#ffffff" });
      const img = canvas.toDataURL("image/jpeg", 0.92);
      const imgH = (canvas.height * pageWidth) / canvas.width;
      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 20, pageWidth, Math.min(imgH, pageHeight - 40));
    }
    return pdf.output("blob");
  };

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result || "";
        resolve(String(res).split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleGenerateImplementationPack = async () => {
    setPackBusy(true);
    setPackResult(null);
    try {
      const blob = await buildPdfBlob();
      if (!blob) throw new Error("PDF render failed");
      const pdf_base64 = await blobToBase64(blob);
      const filename = `${docType.toUpperCase()}-${document.client.name.replace(/[^a-z0-9]/gi, "_")}-${new Date().toISOString().slice(0, 10)}.pdf`;

      // Derive execution tickets from the document's recommendations section.
      // Falls back to a single rebalance ticket if no recs are found.
      const recSection = (document.sections || []).find((s) => /recommend/i.test(s.heading || ""));
      const recs = (recSection && recSection.items ? recSection.items : []).slice(0, 5).map((it, i) => ({
        ticket_type: /super|contribution/i.test(it.title || "") ? "super_change"
                   : /insurance|cover/i.test(it.title || "") ? "insurance_quote"
                   : /rebalance|portfolio|allocation/i.test(it.title || "") ? "rebalance"
                   : "trade",
        headline: `${i + 1}. ${it.title || "Advice recommendation"}`,
        payload: { impact: it.impact, cost: it.cost, rationale: it.rationale },
      }));
      if (recs.length === 0) {
        recs.push({
          ticket_type: "rebalance",
          headline: `Implement ${docType.toUpperCase()} ${document.documentRef}`,
          payload: { doc_ref: document.documentRef },
        });
      }

      const body = {
        doc_ref: document.documentRef,
        doc_type: docType,
        client_name: document.client.name,
        to_email: document.client.email || "client@example.com",
        pdf_base64,
        pdf_name: filename,
        recommendations: recs,
        xmerge_tokens: tokens,
        sections: document.sections.map((s) => ({ id: s.id, type: s.type, heading: s.heading })),
        adviser_name: document.adviser.name,
      };
      const r = await fetch(`${API_URL}/api/implementation-pack/${document.client.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      setPackResult(out);
      toast.success(`Implementation Pack ${out.pack_id} created`, {
        description: `${out.ticket_ids.length} tickets · notify ${out.notify_mode} · xmerge ${out.xmerge_mode}`,
      });
    } catch (e) {
      toast.error("Implementation Pack failed", { description: String(e).slice(0, 200) });
    } finally {
      setPackBusy(false);
    }
  };

  const handlePushToXplan = async () => {
    try {
      const payload = {
        docType,
        documentRef: document.documentRef,
        sections: document.sections.map((s) => ({ id: s.id, type: s.type, heading: s.heading })),
        tokenMap: tokens,
      };
      const r = await fetch(`${API_URL}/api/xplan-sync/xmerge/${clientId}/push-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      toast.success(`Pushed to Xplan via Xmerge (${out.mode})`, {
        description: `${out.tokens_used.length} field tokens · ref ${out.document_ref}`,
      });
    } catch (e) {
      toast.error("Push failed", { description: String(e).slice(0, 200) });
    }
  };

  const handleNotifyClient = async () => {
    try {
      const body = `Your ${docType.toUpperCase()} "${document.client.name}" is ready.\n\nDocument ref: ${document.documentRef}\nPrepared by: ${document.adviser.name}\n\nPlease review and sign at your earliest convenience.`;
      // Generate PDF + attach (optional — falls through if it fails)
      let attachment_base64 = null;
      let attachment_name = null;
      try {
        const blob = await buildPdfBlob();
        if (blob) {
          attachment_base64 = await blobToBase64(blob);
          attachment_name = `${docType.toUpperCase()}-${document.client.name.replace(/[^a-z0-9]/gi, "_")}-${new Date().toISOString().slice(0, 10)}.pdf`;
        }
      } catch (e) {
        console.warn("PDF attach failed, sending without attachment", e);
      }
      const r = await fetch(`${API_URL}/api/notify/client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: document.client.id,
          client_name: document.client.name,
          to_email: document.client.email || "client@example.com",
          subject: `Your ${docType.toUpperCase()} is ready — ${document.documentRef}`,
          body,
          source_item_id: document.documentRef,
          attachment_base64,
          attachment_name,
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      const attachNote = attachment_name ? ` · PDF attached` : "";
      if (out.mode === "mocked") {
        toast.info("Notify Client (MOCKED)", {
          description: `Email logged only${attachNote}. Set RESEND_API_KEY to send live.`,
        });
      } else if (out.mode === "live") {
        toast.success(`Email sent via Resend${attachNote}`, { description: out.notification?.delivery_ref || "" });
      } else {
        toast.error("Email failed", { description: out.notification?.error || "unknown" });
      }
    } catch (e) {
      toast.error("Notify failed", { description: String(e).slice(0, 200) });
    }
  };

  const handleDispatchToRails = async () => {
    try {
      // Create ticket tied to the SOA/ROA then dispatch
      const ticketRes = await fetch(`${API_URL}/api/execution/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: document.client.id,
          client_name: document.client.name,
          ticket_type: "rebalance",
          headline: `Execute recommendations for ${docType.toUpperCase()} ${document.documentRef}`,
          message: `Dispatched from Advice Document Builder`,
          source_item_id: document.documentRef,
          urgency: "SOON",
          payload: { doc_ref: document.documentRef, doc_type: docType },
        }),
      });
      if (!ticketRes.ok) throw new Error("Ticket creation failed");
      const { ticket } = await ticketRes.json();
      const dispatchRes = await fetch(`${API_URL}/api/exec-rails/tickets/${ticket.ticket_id}/dispatch`, { method: "POST" });
      if (!dispatchRes.ok) throw new Error("Dispatch failed");
      const out = await dispatchRes.json();
      toast.success(`Dispatched to execution rails`, {
        description: `${out.event.adapter} · ${out.event.mode} · ref ${out.event.external_ref}`,
      });
    } catch (e) {
      toast.error("Execution rails failed", { description: String(e).slice(0, 200) });
    }
  };

  return (
    <Layout>
      <div className="max-w-[1100px] mx-auto p-4 space-y-4" data-testid="advice-document-builder">
        <Card>
          <CardContent className="p-4 flex items-center gap-4 flex-wrap">
            <FileText className="h-6 w-6 text-[#D4A84C]" />
            <div className="flex-1 min-w-[260px]">
              <h1 className="text-xl font-bold text-[#1a2744]">Advice Document Builder</h1>
              <p className="text-xs text-muted-foreground">Generate a draft Statement of Advice (SOA) or Record of Advice (ROA), preview, download as PDF, and save to the Vault.</p>
            </div>
            <Tabs value={docType} onValueChange={setDocType}>
              <TabsList>
                <TabsTrigger value="soa" data-testid="builder-tab-soa">SOA</TabsTrigger>
                <TabsTrigger value="roa" data-testid="builder-tab-roa">ROA</TabsTrigger>
              </TabsList>
            </Tabs>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="text-sm border rounded px-2 py-1 bg-white" data-testid="builder-client-select">
              {Object.entries(CLIENT_DATA)
                .filter(([k]) => k !== "advisor")
                .map(([id, c]) => {
                  const label = c?.profile?.name || c?.name || id;
                  return (<option key={id} value={id}>{label}</option>);
                })}
            </select>
            <Button variant="outline" size="sm" onClick={() => setShowTokens(s => !s)} data-testid="builder-toggle-tokens" className={showTokens ? "border-[#3B9CDC] text-[#3B9CDC] bg-[#3B9CDC]/10" : ""}><Tag className="h-3.5 w-3.5 mr-1" /> {showTokens ? "Hide" : "Show"} Xplan tokens</Button>
            <Button variant="outline" size="sm" onClick={handlePushToXplan} data-testid="builder-push-xplan" className="border-[#3B9CDC] text-[#3B9CDC]"><Upload className="h-3.5 w-3.5 mr-1" /> Push via Xmerge</Button>
            <Button variant="outline" size="sm" onClick={handleNotifyClient} data-testid="builder-notify-client" className={emailMode === "live" ? "border-emerald-600 text-emerald-700" : "border-amber-500 text-amber-700"}>
              <Mail className="h-3.5 w-3.5 mr-1" /> Notify Client
              <Badge variant="outline" className={`ml-2 text-[9px] ${emailMode === "live" ? "border-emerald-600 text-emerald-700" : "border-amber-500 text-amber-700"}`}>
                {emailMode === "live" ? "LIVE" : "MOCKED"}
              </Badge>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDispatchToRails} data-testid="builder-dispatch-rails" className="border-violet-500 text-violet-700"><Rocket className="h-3.5 w-3.5 mr-1" /> Execute Strategy</Button>
            <Button variant="outline" size="sm" onClick={() => window.location.assign("/product-marketplace")} data-testid="builder-view-marketplace" className="border-slate-400 text-slate-700"><ShoppingBag className="h-3.5 w-3.5 mr-1" /> Marketplace</Button>
            <Button variant="outline" size="sm" onClick={handleSaveToVault} data-testid="builder-save-vault"><Save className="h-3.5 w-3.5 mr-1" /> Save to Vault</Button>
            <Button size="sm" onClick={handleGenerateImplementationPack} disabled={packBusy} data-testid="builder-implementation-pack" className="bg-[#D4A84C] hover:bg-[#b88d34] text-[#1a2744]">
              {packBusy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Package className="h-3.5 w-3.5 mr-1" />}
              {packBusy ? "Bundling…" : "Implementation Pack"}
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={generating} data-testid="builder-download-pdf" className="bg-[#1a2744] hover:bg-[#0f1830] text-white">
              <Download className="h-3.5 w-3.5 mr-1" /> {generating ? "Generating…" : "Download PDF"}
            </Button>
          </CardContent>
        </Card>

        {packResult && (
          <Card data-testid="implementation-pack-result">
            <CardContent className="p-4 bg-gradient-to-r from-[#FCF6E8] to-white border-l-4 border-[#D4A84C]">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-[#D4A84C]" />
                <h3 className="font-bold text-[#1a2744]">Implementation Pack {packResult.pack_id}</h3>
                <Badge variant="outline" className="text-[10px] ml-auto">audit trail</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[11px]">
                {packResult.steps.map((s, i) => (
                  <div key={i} className={`border rounded p-2 ${s.ok ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                    <div className="flex items-center gap-1">
                      {s.ok ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <span className="text-rose-600">✕</span>}
                      <span className="font-semibold text-[#1a2744]">{s.step.replace(/_/g, " ")}</span>
                    </div>
                    <div className="text-muted-foreground mt-1 truncate">
                      {s.ref && <span className="font-mono">{s.ref}</span>}
                      {s.mode && <span className="ml-1">· {s.mode}</span>}
                      {typeof s.count === "number" && <span>{s.count} tickets</span>}
                      {typeof s.size_kb === "number" && <span>{s.size_kb}kb</span>}
                      {s.detail && <span>{s.detail}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{packResult.ticket_ids?.length || 0} execution tickets</span>
                <span>·</span>
                <span>notify: {packResult.notify_mode}</span>
                <span>·</span>
                <span>xmerge: {packResult.xmerge_mode} ({packResult.xmerge_tokens_used} tokens)</span>
                <a href="/execution-rails" className="ml-auto text-[#3B9CDC] underline">View execution rails →</a>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-2 flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 border-b">
            <Eye className="h-3.5 w-3.5" /> Preview · {document.documentRef} · {document.sections.length} sections
            <Badge variant="outline" className="ml-auto text-[10px]">RG175 compliant</Badge>
            <Badge variant="outline" className="text-[10px]">IPS-style portfolio</Badge>
            {showTokens && <Badge variant="outline" className="text-[10px] border-[#3B9CDC] text-[#3B9CDC]">{Object.keys(tokens).length} Xmerge tokens</Badge>}
          </CardContent>
          <CardContent className="p-0">
            <div id="soa-document-root" className={`bg-white text-[#1a2744] ${showTokens ? "soa-tokens-on" : ""}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              {showTokens && (
                <div className="px-6 pt-4">
                  <div className="border border-[#3B9CDC] bg-[#3B9CDC]/5 rounded p-3 text-[11px]">
                    <p className="font-semibold text-[#1a2744] mb-1">Xplan / Xmerge field codes — preview overlay</p>
                    <p className="text-muted-foreground mb-2">Each token below is wired into the SOA/ROA template. When you click <strong>Push via Xmerge</strong> the document is pushed back to Xplan and the codes resolve to live client fields.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 font-mono text-[10px]">
                      {Object.entries(tokens).slice(0, 21).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2 truncate"><span className="text-muted-foreground truncate">{k}</span><span className="text-[#3B9CDC]">→</span><span className="font-bold">{v}</span></div>
                      ))}
                    </div>
                    {Object.keys(tokens).length > 21 && <p className="text-[10px] text-muted-foreground mt-2">+ {Object.keys(tokens).length - 21} more tokens</p>}
                  </div>
                </div>
              )}
              {document.sections.map(renderSection)}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdviceDocumentBuilder;
