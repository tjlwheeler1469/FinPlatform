// Newsletter & Campaign Builder — mock email builder with template library.
// Targets loaded from Segmentations tab via localStorage "crm_campaign_target".
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, Sparkles, Eye, Save, Trash2, Plus, Users, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { logEvent } from "@/lib/commsLedger";

const TEMPLATES = [
  { id: "market_update", name: "Monthly Market Update", subject: "Market wrap — {{month}}", body: "Dear {{first_name}},\n\nThis month's market highlights:\n• ASX 200 moved {{asx_change}}\n• RBA held rates at {{rba_rate}}\n• Your portfolio is tracking at {{ytd_return}} YTD\n\nKey actions for you:\n1. Review asset allocation\n2. Check rebalancing opportunities\n3. Tax-loss harvesting window\n\nBook a review at your convenience.\n\nRegards,\n{{adviser_name}}" },
  { id: "eofy", name: "EOFY Tax Planning", subject: "EOFY Tax Planning — Action before 30 June", body: "Dear {{first_name}},\n\nWith 30 June approaching, we recommend reviewing:\n\n• Concessional super contributions (cap: $30,000)\n• Non-concessional top-ups\n• Capital gains realisation strategy\n• Prepaid expenses and deductions\n• Trust distributions and resolutions\n\nBook a 45-min session to action these before the deadline.\n\nRegards,\n{{adviser_name}}" },
  { id: "review_reminder", name: "Annual Review Reminder", subject: "Time for your annual wealth review, {{first_name}}", body: "Dear {{first_name}},\n\nIt has been 11 months since your last formal review. Our agreement requires an annual review covering:\n\n• Risk profile reconfirmation\n• Portfolio performance vs benchmark\n• Life event changes\n• Tax position\n• Insurance adequacy\n• Estate planning\n\nPlease book a slot in the next 30 days.\n\nRegards,\n{{adviser_name}}" },
  { id: "super_changes", name: "Super Legislation Update", subject: "New super rules from 1 July — what changes for you", body: "Dear {{first_name}},\n\nEffective 1 July, new super rules take effect:\n\n• Concessional cap: ${{new_cap}} (indexed)\n• Transfer balance cap: $1.9M (unchanged)\n• Div 293 threshold: $250,000\n• NCC bring-forward — 3-year rolling window\n\nWe've run the new rules through your Super Optimiser — book in to discuss.\n\nRegards,\n{{adviser_name}}" },
  { id: "welcome", name: "New Client Welcome", subject: "Welcome to Halcyon Wealth, {{first_name}}", body: "Dear {{first_name}},\n\nWelcome aboard! Your onboarding checklist:\n\n☐ FSG signed and stored\n☐ Fact Find completed\n☐ Risk profile determined\n☐ SOA delivered\n☐ Xplan file established\n☐ Portal credentials issued\n\nYour first review is scheduled. Any questions, reach out any time.\n\nRegards,\n{{adviser_name}}" },
];

const loadCampaigns = () => { try { return JSON.parse(localStorage.getItem("crm_campaigns") || "[]"); } catch { return []; } };
const saveCampaigns = (c) => localStorage.setItem("crm_campaigns", JSON.stringify(c));

const NewsletterBuilder = () => {
  const [target, setTarget] = useState(null);
  const [campaigns, setCampaigns] = useState(loadCampaigns);
  const [active, setActive] = useState(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    try { const t = JSON.parse(localStorage.getItem("crm_campaign_target") || "null"); setTarget(t); } catch { setTarget(null); }
  }, []);

  const startNew = (tpl) => {
    setActive({
      id: `campaign_${Date.now()}`,
      name: tpl ? tpl.name : "Untitled Campaign",
      subject: tpl ? tpl.subject : "",
      body: tpl ? tpl.body : "",
      provider: "resend_mock",
      segmentName: target?.segmentName || "All Clients",
      recipientCount: target?.clientIds?.length || 0,
      status: "draft",
      created: new Date().toISOString(),
    });
    setPreview(false);
  };

  const saveDraft = () => {
    if (!active) return;
    const exists = campaigns.find((c) => c.id === active.id);
    const next = exists ? campaigns.map((c) => (c.id === active.id ? active : c)) : [active, ...campaigns];
    setCampaigns(next); saveCampaigns(next);
    toast.success("Draft saved");
  };

  const sendCampaign = () => {
    if (!active) return;
    const sent = { ...active, status: "sent", sentAt: new Date().toISOString(), deliveryStats: { sent: active.recipientCount || 0, opens: 0, clicks: 0 } };
    const next = campaigns.find((c) => c.id === active.id)
      ? campaigns.map((c) => (c.id === active.id ? sent : c))
      : [sent, ...campaigns];
    setCampaigns(next); saveCampaigns(next);
    setActive(sent);
    // Log per-recipient to comms ledger
    const ids = target?.clientIds || [];
    ids.forEach((cid) => logEvent(cid, {
      type: "campaign_sent",
      title: `Campaign: ${sent.name}`,
      body: sent.subject,
      meta: { campaignId: sent.id, provider: sent.provider, segmentName: sent.segmentName },
    }));
    toast.success(`Campaign queued to ${sent.recipientCount} recipient${sent.recipientCount !== 1 ? "s" : ""} · logged to comms timeline · MOCK — no real emails sent. Hook up Resend/SendGrid to go live.`);
  };

  const removeCampaign = (id) => { const next = campaigns.filter((c) => c.id !== id); setCampaigns(next); saveCampaigns(next); if (active?.id === id) setActive(null); toast.success("Deleted"); };

  return (
    <div className="space-y-4" data-testid="newsletter-builder">
      {/* Target banner */}
      <Card className="bg-[#D4A84C]/10 border-[#D4A84C]/30">
        <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-[#D4A84C]" />
            <div>
              <p className="text-xs text-muted-foreground">Current target segment</p>
              <p className="text-sm font-semibold">{target?.segmentName || "All Clients"} · {target?.clientIds?.length || "—"} recipients</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">Change target in Segmentations tab</p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-[1fr,1.5fr] gap-4">
        {/* Template & history column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#D4A84C]" /> Templates</CardTitle>
              <Button size="sm" variant="outline" onClick={() => startNew(null)} data-testid="btn-new-campaign"><Plus className="h-3.5 w-3.5 mr-1" /> Blank</Button>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => startNew(t)} className="w-full text-left p-2.5 border rounded hover:border-[#D4A84C] hover:bg-[#D4A84C]/5 transition-colors" data-testid={`tpl-${t.id}`}>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.subject}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Campaign History ({campaigns.length})</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {campaigns.length === 0 && <p className="text-xs text-center text-muted-foreground py-4">No campaigns yet</p>}
              {campaigns.map((c) => (
                <div key={c.id} className={`p-2.5 border rounded flex items-center justify-between gap-2 ${active?.id === c.id ? "border-[#1a2744] bg-[#1a2744]/5" : ""}`}>
                  <button onClick={() => setActive(c)} className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.segmentName} · {c.recipientCount} recipients</p>
                  </button>
                  <Badge variant={c.status === "sent" ? "default" : "outline"} className={`text-[10px] ${c.status === "sent" ? "bg-emerald-500" : ""}`}>
                    {c.status === "sent" ? <CheckCircle2 className="h-3 w-3 mr-0.5" /> : <Clock className="h-3 w-3 mr-0.5" />}{c.status}
                  </Badge>
                  <button onClick={() => removeCampaign(c.id)} className="text-muted-foreground hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Editor column */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> {active ? "Editing" : "Select a template or start blank"}</CardTitle>
            {active && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPreview(!preview)} data-testid="btn-preview"><Eye className="h-3.5 w-3.5 mr-1" /> {preview ? "Edit" : "Preview"}</Button>
                <Button size="sm" variant="outline" onClick={saveDraft} data-testid="btn-save-draft"><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
                <Button size="sm" onClick={sendCampaign} className="bg-[#10b981]" disabled={active.status === "sent"} data-testid="btn-send-campaign"><Send className="h-3.5 w-3.5 mr-1" /> Send</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {!active && <p className="text-center text-sm text-muted-foreground py-16">← Pick a template from the left</p>}
            {active && !preview && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Campaign name</Label><Input value={active.name} onChange={(e) => setActive({ ...active, name: e.target.value })} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Email provider (mock)</Label>
                    <Select value={active.provider} onValueChange={(v) => setActive({ ...active, provider: v })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="resend_mock">Resend (mock stub)</SelectItem><SelectItem value="sendgrid_mock">SendGrid (mock stub)</SelectItem><SelectItem value="mailgun_mock">Mailgun (mock stub)</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs">Subject line</Label><Input value={active.subject} onChange={(e) => setActive({ ...active, subject: e.target.value })} className="h-8 text-sm" data-testid="campaign-subject" /></div>
                <div><Label className="text-xs">Body (supports {"{{first_name}}"} etc.)</Label><Textarea rows={14} value={active.body} onChange={(e) => setActive({ ...active, body: e.target.value })} className="text-sm font-mono" data-testid="campaign-body" /></div>
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                  <strong>Merge tags:</strong> {"{{first_name}}"} · {"{{adviser_name}}"} · {"{{ytd_return}}"} · {"{{month}}"} — replaced at send time. <strong>Mock mode:</strong> no real emails sent until provider API key is configured.
                </div>
              </>
            )}
            {active && preview && (
              <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px]" data-testid="campaign-preview">
                <p className="text-xs text-muted-foreground">From: {active.adviser || "Sarah Chen &lt;sarah@halcyon.com&gt;"}</p>
                <p className="text-xs text-muted-foreground">To: {active.recipientCount} clients in "{active.segmentName}"</p>
                <p className="text-sm font-semibold mt-2">Subject: {active.subject.replace(/{{month}}/g, new Date().toLocaleString("en-AU", { month: "long" }))}</p>
                <hr className="my-3" />
                <pre className="whitespace-pre-wrap text-sm font-sans">{active.body.replace(/{{first_name}}/g, "David").replace(/{{adviser_name}}/g, "Sarah Chen").replace(/{{month}}/g, new Date().toLocaleString("en-AU", { month: "long" })).replace(/{{asx_change}}/g, "+2.1%").replace(/{{rba_rate}}/g, "4.10%").replace(/{{ytd_return}}/g, "+9.4%").replace(/{{new_cap}}/g, "32,500")}</pre>
              </div>
            )}
            {active?.status === "sent" && active.deliveryStats && (
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-3 flex gap-6 text-sm">
                  <div><TrendingUp className="h-4 w-4 inline text-emerald-600 mr-1" /><strong>{active.deliveryStats.sent}</strong> sent</div>
                  <div><strong>{active.deliveryStats.opens}</strong> opens</div>
                  <div><strong>{active.deliveryStats.clicks}</strong> clicks</div>
                  <div className="text-[11px] text-muted-foreground italic ml-auto">Stats populate when real provider is connected</div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewsletterBuilder;
