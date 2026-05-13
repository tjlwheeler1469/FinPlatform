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

// ---------- Section renderers (ASIC letter format) ----------

// Letterhead — adviser + licensee + client block + date + document ref.
const SectionLetterhead = ({ s }) => (
  <div className="page-soa px-12 py-10 border-b" data-soa-section={s.id} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
    <div className="flex justify-between items-start mb-10">
      <div>
        <div className="w-10 h-10 rounded-sm bg-[#1a2744] mb-3" />
        <p className="text-lg font-bold text-[#1a2744] leading-tight">{s.licensee.name}</p>
        <p className="text-xs text-gray-500 leading-tight">{s.licensee.afsl}</p>
      </div>
      <div className="text-right text-xs text-gray-500 leading-tight">
        <p>{s.adviser.address}</p>
        <p className="mt-0.5">Tel: {s.adviser.phone}</p>
        <p>{s.adviser.email}</p>
        <p className="mt-2 font-mono text-[10px] text-gray-400">Ref: {s.reference}</p>
      </div>
    </div>
    <div className="mb-8">
      <p className="text-sm">{s.date}</p>
    </div>
    <div className="mb-8">
      <p className="text-sm font-semibold text-[#1a2744]">{s.client.name}</p>
      {s.client.address && <p className="text-sm text-gray-600 whitespace-pre-line">{s.client.address}</p>}
    </div>
    <h1 className="text-3xl font-bold text-[#1a2744] mb-2 border-b-2 border-[#1a2744] pb-3">{s.title}</h1>
    <p className="text-sm text-gray-600 italic mt-3">Dear {s.client.name.split(" ")[0] || s.client.name},</p>
  </div>
);

// Standard narrative paragraph section — heading + prose + optional bullets/numbered.
const SectionParagraph = ({ s }) => (
  <div className="page-soa px-12 py-6" data-soa-section={s.id} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
    <h2 className="text-lg font-bold text-[#1a2744] mb-3">{s.heading}</h2>
    {s.paragraphs && s.paragraphs.map((p, i) => (
      <p key={i} className="text-[13px] leading-7 text-gray-800 mb-3">{p}</p>
    ))}
    {s.bullets && (
      <ul className="list-disc pl-6 space-y-1 text-[13px] leading-6 text-gray-800">
        {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    )}
    {s.numbered && (
      <ol className="list-decimal pl-6 space-y-2 text-[13px] leading-6 text-gray-800 mt-2">
        {s.numbered.map((n, i) => <li key={i}>{n}</li>)}
      </ol>
    )}
  </div>
);

// Current situation — prose + inline data grid on the right.
const SectionSituation = ({ s }) => (
  <div className="page-soa px-12 py-6" data-soa-section={s.id} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
    <h2 className="text-lg font-bold text-[#1a2744] mb-3">{s.heading}</h2>
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-3">
        {s.paragraphs.map((p, i) => (
          <p key={i} className="text-[13px] leading-7 text-gray-800">{p}</p>
        ))}
      </div>
      <div className="col-span-1 border-l-2 border-gray-200 pl-4">
        <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mb-2">At a glance</p>
        {s.keyFigures.map((f, i) => (
          <div key={i} className="py-1.5 border-b border-gray-100 flex justify-between items-baseline">
            <span className="text-[11px] text-gray-600">{f.label}</span>
            <span className="text-[12px] font-semibold text-[#1a2744]">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// My advice — numbered narrative with rationale / impact / risks.
const SectionAdviceDetail = ({ s }) => (
  <div className="page-soa px-12 py-6" data-soa-section={s.id} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
    <h2 className="text-lg font-bold text-[#1a2744] mb-3">{s.heading}</h2>
    {s.paragraphs && s.paragraphs.map((p, i) => (
      <p key={i} className="text-[13px] leading-7 text-gray-800 mb-3">{p}</p>
    ))}
    <div className="mt-4 space-y-6">
      {s.recommendations.map((r) => (
        <div key={r.n}>
          <p className="text-[13px] font-semibold text-[#1a2744] mb-1.5">{r.n}. {r.title}</p>
          {r.rationale && <p className="text-[13px] leading-7 text-gray-800 mb-2">{r.rationale}</p>}
          {r.impact && (
            <p className="text-[12px] text-gray-700 italic mb-1">
              <span className="font-semibold not-italic">Expected benefit: </span>{r.impact}
            </p>
          )}
          {r.risks && r.risks.length > 0 && (
            <p className="text-[12px] text-gray-700 italic mb-1">
              <span className="font-semibold not-italic">Key risks: </span>{r.risks.join("; ")}.
            </p>
          )}
          {Number.isFinite(r.cost) && r.cost > 0 && (
            <p className="text-[12px] text-gray-700 italic">
              <span className="font-semibold not-italic">Implementation cost: </span>${r.cost.toLocaleString()}
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Fees — simple two-column table + conflicts disclosure.
const SectionFees = ({ s }) => (
  <div className="page-soa px-12 py-6" data-soa-section={s.id} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
    <h2 className="text-lg font-bold text-[#1a2744] mb-3">{s.heading}</h2>
    {s.paragraphs && s.paragraphs.map((p, i) => (
      <p key={i} className="text-[13px] leading-7 text-gray-800 mb-3">{p}</p>
    ))}
    <table className="w-full border-collapse mt-2 max-w-[480px]">
      <tbody>
        {s.rows.map((r, i) => (
          <tr key={i} className="border-b border-gray-200">
            <td className="py-2 text-[13px] text-gray-800">{r[0]}</td>
            <td className="py-2 text-[13px] text-right font-semibold text-[#1a2744]">{r[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {s.conflicts && s.conflicts.length > 0 && (
      <div className="mt-5">
        <p className="text-[12px] font-semibold text-[#1a2744] mb-1">Conflicts of interest</p>
        {s.conflicts.map((c, i) => (
          <p key={i} className="text-[12px] leading-6 text-gray-700 mb-1">{c}</p>
        ))}
      </div>
    )}
  </div>
);

// Authority to Proceed — signature lines.
const SectionAuthority = ({ s }) => (
  <div className="page-soa px-12 py-8 border-t-2 border-[#1a2744] mt-4" data-soa-section={s.id} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
    <h2 className="text-lg font-bold text-[#1a2744] mb-3">{s.heading}</h2>
    {s.paragraphs && s.paragraphs.map((p, i) => (
      <p key={i} className="text-[13px] leading-7 text-gray-800 mb-3">{p}</p>
    ))}
    <div className="grid grid-cols-2 gap-12 mt-10">
      {s.signatures.map((sig, i) => (
        <div key={i}>
          <div className="border-b border-gray-700 h-10" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mt-1">{sig.role}</p>
          <p className="text-[13px] font-semibold text-[#1a2744]">{sig.name}</p>
          <p className="text-[11px] text-gray-600">Date: {sig.date}</p>
        </div>
      ))}
    </div>
    <p className="text-[10px] text-gray-400 italic mt-8">
      Yours sincerely, — this document is signed and retained by your adviser in accordance with s912G of the Corporations Act 2001 (Cth).
    </p>
  </div>
);

// Callout — Budget 2026-27 tax law changes alert (amber accent).
const SectionCallout = ({ s }) => (
  <div className="page-soa px-12 py-6" data-soa-section={s.id} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
    <div className="border-l-4 border-amber-500 bg-amber-50 p-5 rounded-r">
      <h2 className="text-lg font-bold text-[#1a2744] mb-2 flex items-center gap-2">
        <span className="text-amber-600">⚠</span> {s.heading}
      </h2>
      {s.intro && <p className="text-[13px] leading-7 text-gray-800 mb-3">{s.intro}</p>}
      {s.bullets && (
        <ul className="list-disc pl-6 space-y-2 text-[13px] leading-6 text-gray-800">
          {s.bullets.map((b, i) => <li key={i} className="whitespace-pre-line">{b}</li>)}
        </ul>
      )}
      {s.footer && <p className="text-[11px] text-gray-600 italic mt-3 pt-3 border-t border-amber-200">{s.footer}</p>}
    </div>
  </div>
);

const renderSection = (s) => {
  switch (s.type) {
    case "letterhead":    return <SectionLetterhead key={s.id} s={s} />;
    case "paragraph":     return <SectionParagraph key={s.id} s={s} />;
    case "callout":       return <SectionCallout key={s.id} s={s} />;
    case "situation":     return <SectionSituation key={s.id} s={s} />;
    case "advice-detail": return <SectionAdviceDetail key={s.id} s={s} />;
    case "fees-table":    return <SectionFees key={s.id} s={s} />;
    case "authority":     return <SectionAuthority key={s.id} s={s} />;
    default:              return <SectionParagraph key={s.id} s={s} />;
  }
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
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="text-sm border rounded px-2 py-1 bg-white hidden" data-testid="builder-client-select" aria-hidden="true">
              {Object.entries(CLIENT_DATA)
                .filter(([k]) => k !== "advisor")
                .map(([id, c]) => {
                  const label = c?.profile?.name || c?.name || id;
                  return (<option key={id} value={id}>{label}</option>);
                })}
            </select>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 border rounded px-2.5 py-1 bg-slate-50" data-testid="builder-active-client">
              <span className="font-semibold text-[#1a2744]">{(CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family)?.profile?.name || clientId}</span>
              <span className="text-[10px]">· active client</span>
            </div>
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
