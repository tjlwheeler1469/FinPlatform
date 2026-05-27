// My Settings — end-client profile, ID verification, TFN, MyGov / ATO linkage.
// Mostly read-only view with MOCK verification statuses.
// Real ID / TFN / MyGov handoff is delegated to secure provider integrations
// — this page only displays current status and provides request-update CTAs.
import { useState } from "react";
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, CheckCircle2, AlertCircle, ExternalLink, Lock, Mail, Phone,
  MapPin, Landmark, FileBadge, Fingerprint,
} from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { toast } from "sonner";

const MASK_TFN = (tfn) => tfn ? `${tfn.slice(0, 3)} •• ••${tfn.slice(-3)}` : "Not on file";

const MySettings = () => {
  const clientId = getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const p = client.profile || {};

  // Verification statuses (MOCK — real integrations will back these)
  const [verifications] = useState({
    identity: { status: "verified", verifiedAt: "2024-10-15", provider: "VOI - Frankie Financial", docType: "Driver Licence + Passport" },
    tfn: { status: "verified", verifiedAt: "2024-10-15", tfn: "123•••••876" },
    mygov: { status: "linked", linkedAt: "2024-11-02", scope: "Tax, Super, Centrelink read-only" },
    ato: { status: "linked", linkedAt: "2024-11-02", scope: "Prefill + Assessment retrieval" },
    bank: { status: "linked", linkedAt: "2024-09-01", accounts: 4 },
  });

  const [notifications, setNotifications] = useState({
    emailCampaigns: true,
    documentsForSignature: true,
    portfolioAlerts: true,
    marketUpdates: false,
    smsReminders: false,
  });

  const requestUpdate = (field) => toast.success(`Update request for ${field} has been sent to your adviser. They'll confirm by email.`);
  const openIntegration = (label) => toast.success(`Opening ${label} portal… (MOCK — real handoff requires provider API key)`);

  const statusBadge = (s) => {
    if (s === "verified" || s === "linked") return <Badge className="bg-emerald-500 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-0.5" />{s === "linked" ? "Linked" : "Verified"}</Badge>;
    if (s === "pending") return <Badge className="bg-amber-500 text-[10px]"><AlertCircle className="h-3 w-3 mr-0.5" />Pending</Badge>;
    return <Badge variant="outline" className="text-[10px]">Not set</Badge>;
  };

  return (
    <Layout>
      <PageShell
        eyebrow="ACCOUNT"
        title="My settings"
        accent="profile, ID, MyGov"
        subtitle="Profile, ID verification, Tax File Number, MyGov &amp; ATO linkage, notifications. Updates run through your adviser for compliance."
        meta={`SECURE · ${(p.name || "").toUpperCase()}`}
        metrics={[
          { label: "Identity", value: verifications.identity.status.toUpperCase() },
          { label: "TFN", value: verifications.tfn.status.toUpperCase() },
          { label: "MyGov", value: verifications.mygov.status.toUpperCase() },
          { label: "ATO", value: verifications.ato.status.toUpperCase() },
        ]}
      >
      <div data-testid="my-settings">

        <Tabs defaultValue="profile">
          <TabsList className="bg-transparent border-0 h-auto w-full justify-start gap-1.5 px-0 p-0 mb-5 overflow-x-auto">
            <TabsTrigger value="profile" className="gap-1.5 px-4 py-2 rounded-full border border-transparent flex-shrink-0 data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300" data-testid="settings-tab-profile"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
            <TabsTrigger value="identity" className="gap-1.5 px-4 py-2 rounded-full border border-transparent flex-shrink-0 data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300" data-testid="settings-tab-identity"><Fingerprint className="h-3.5 w-3.5" /> ID &amp; TFN</TabsTrigger>
            <TabsTrigger value="government" className="gap-1.5 px-4 py-2 rounded-full border border-transparent flex-shrink-0 data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300" data-testid="settings-tab-government"><Landmark className="h-3.5 w-3.5" /> MyGov / ATO</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 px-4 py-2 rounded-full border border-transparent flex-shrink-0 data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300" data-testid="settings-tab-notifications"><Mail className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile" className="pt-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Personal details</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {[
                  { label: "Full name", value: p.name, icon: User, field: "name" },
                  { label: "Partner", value: p.partner_first_name || "—", icon: User, field: "partner" },
                  { label: "Email", value: p.email, icon: Mail, field: "email" },
                  { label: "Phone", value: p.phone, icon: Phone, field: "phone" },
                  { label: "Address", value: p.address, icon: MapPin, field: "address" },
                  { label: "Occupation", value: p.occupation, icon: FileBadge, field: "occupation" },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.field} className="p-3 bg-gray-50 rounded-lg flex items-start justify-between gap-2" data-testid={`profile-${row.field}`}>
                      <div className="flex items-start gap-2 min-w-0">
                        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{row.label}</p>
                          <p className="text-sm font-medium text-[#1a2744] truncate">{row.value || "—"}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => requestUpdate(row.label)} className="h-7 text-[10px] flex-shrink-0">Update</Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1.5 mt-3"><Lock className="h-3 w-3" /> Changes route through your adviser for compliance verification</p>
          </TabsContent>

          {/* IDENTITY + TFN */}
          <TabsContent value="identity" className="pt-3 space-y-3">
            <Card data-testid="card-identity">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Verification of Identity (VOI)</CardTitle>
                {statusBadge(verifications.identity.status)}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[10px] uppercase text-muted-foreground">Provider</p><p className="font-medium">{verifications.identity.provider}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground">Documents on file</p><p className="font-medium">{verifications.identity.docType}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground">Verified</p><p className="font-medium">{verifications.identity.verifiedAt}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground">Review due</p><p className="font-medium">Annual · Oct 2026</p></div>
                </div>
                <Button size="sm" variant="outline" onClick={() => openIntegration("Frankie Financial VOI")} className="mt-2" data-testid="btn-voi-update"><ExternalLink className="h-3 w-3 mr-1" /> Update documents</Button>
              </CardContent>
            </Card>

            <Card data-testid="card-tfn">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm flex items-center gap-2"><FileBadge className="h-4 w-4 text-[#D4A84C]" /> Tax File Number (TFN)</CardTitle>
                {statusBadge(verifications.tfn.status)}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">TFN on file</p>
                    <p className="font-mono text-base font-bold text-[#1a2744]" data-testid="tfn-value">{verifications.tfn.tfn}</p>
                  </div>
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-muted-foreground">Your TFN is encrypted at rest. Only full digits are visible to your adviser on request. Changes require paper form lodged via the adviser.</p>
                <Button size="sm" variant="outline" onClick={() => requestUpdate("TFN")} data-testid="btn-tfn-update">Request TFN update</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MYGOV + ATO + BANK */}
          <TabsContent value="government" className="pt-3 space-y-3">
            <Card data-testid="card-mygov">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm flex items-center gap-2"><Landmark className="h-4 w-4 text-blue-600" /> MyGov linkage</CardTitle>
                {statusBadge(verifications.mygov.status)}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Scope:</strong> {verifications.mygov.scope}</p>
                <p className="text-xs text-muted-foreground"><strong>Linked:</strong> {verifications.mygov.linkedAt}</p>
                <Button size="sm" variant="outline" onClick={() => openIntegration("MyGov")} data-testid="btn-mygov-open"><ExternalLink className="h-3 w-3 mr-1" /> Open MyGov portal</Button>
              </CardContent>
            </Card>

            <Card data-testid="card-ato">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm flex items-center gap-2"><Landmark className="h-4 w-4 text-emerald-600" /> ATO tax agent authorisation</CardTitle>
                {statusBadge(verifications.ato.status)}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Scope:</strong> {verifications.ato.scope}</p>
                <p className="text-xs text-muted-foreground"><strong>Authorised:</strong> {verifications.ato.linkedAt} · Agent: Halcyon Wealth Advisory Pty Ltd</p>
                <Button size="sm" variant="outline" onClick={() => openIntegration("ATO Online Services")} data-testid="btn-ato-open"><ExternalLink className="h-3 w-3 mr-1" /> ATO Online Services</Button>
              </CardContent>
            </Card>

            <Card data-testid="card-bank">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm flex items-center gap-2"><Landmark className="h-4 w-4 text-[#D4A84C]" /> Bank feeds</CardTitle>
                {statusBadge(verifications.bank.status)}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>{verifications.bank.accounts}</strong> accounts linked · powered by CDR/Open Banking</p>
                <p className="text-xs text-muted-foreground"><strong>Linked:</strong> {verifications.bank.linkedAt}</p>
                <Button size="sm" variant="outline" onClick={() => openIntegration("Bank Feed management")} data-testid="btn-bank-open"><ExternalLink className="h-3 w-3 mr-1" /> Manage connected accounts</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications" className="pt-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Communication preferences</CardTitle></CardHeader>
              <CardContent className="divide-y">
                {[
                  { key: "documentsForSignature", label: "Documents to sign", desc: "SOAs, ROAs, FDSs and other compliance documents" },
                  { key: "emailCampaigns", label: "Newsletters from adviser", desc: "Monthly wrap-ups, EOFY reminders, legislation updates" },
                  { key: "portfolioAlerts", label: "Portfolio alerts", desc: "Rebalancing triggers, cap breaches, notable moves" },
                  { key: "marketUpdates", label: "Market updates", desc: "Daily briefing from Halcyon's research desk" },
                  { key: "smsReminders", label: "SMS reminders", desc: "Meeting confirmations and 24h reminders" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between py-3">
                    <div><Label className="text-sm font-medium">{n.label}</Label><p className="text-xs text-muted-foreground">{n.desc}</p></div>
                    <Switch
                      checked={notifications[n.key]}
                      onCheckedChange={(v) => { setNotifications((p) => ({ ...p, [n.key]: v })); toast.success(`${n.label} ${v ? "enabled" : "disabled"}`); }}
                      data-testid={`notif-${n.key}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </PageShell>
    </Layout>
  );
};

export default MySettings;
