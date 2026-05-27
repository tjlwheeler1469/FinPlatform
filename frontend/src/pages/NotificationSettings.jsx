import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { PageShell, PillButton } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Save, Check } from "lucide-react";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

const NOTIFICATION_OPTIONS = [
  { key: "review_due", label: "Review Due Reminders", desc: "Get notified when client reviews are approaching", category: "Clients" },
  { key: "client_contact", label: "Client Contact Activity", desc: "Alerts when clients reach out or respond", category: "Clients" },
  { key: "new_client_onboarding", label: "New Client Onboarding", desc: "Steps and reminders for new client setup", category: "Clients" },
  { key: "birthday_reminders", label: "Birthday Reminders", desc: "Client and family member birthdays", category: "Clients" },
  { key: "portfolio_rebalance", label: "Portfolio Rebalance Alerts", desc: "When portfolios drift beyond target allocation", category: "Investments" },
  { key: "market_alerts", label: "Market Movement Alerts", desc: "Significant market moves affecting client portfolios", category: "Investments" },
  { key: "compliance_deadlines", label: "Compliance Deadlines", desc: "Regulatory and compliance due dates", category: "Compliance" },
  { key: "fee_disclosure", label: "Fee Disclosure Statements", desc: "When FDS documents are due", category: "Compliance" },
  { key: "document_signed", label: "Document Signatures", desc: "When clients sign SOAs and other documents", category: "Documents" },
  { key: "insurance_renewal", label: "Insurance Renewals", desc: "Upcoming insurance policy renewals", category: "Insurance" },
];

const NotificationSettings = ({ embedded = false }) => {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/adviser-notifications/settings/adviser_1`)
      .then(r => r.json())
      .then(d => { setSettings(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const save = async () => {
    try {
      await fetch(`${API}/api/adviser-notifications/settings/adviser_1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      toast.success("Notification preferences saved");
    } catch { toast.error("Failed to save"); }
  };

  const categories = [...new Set(NOTIFICATION_OPTIONS.map(o => o.category))];

  const content = (
    <div className="space-y-5" data-testid="notification-settings">
      {categories.map(cat => (
        <Card key={cat} className="border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] tracking-[0.18em] uppercase text-slate-500 font-semibold">{cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {NOTIFICATION_OPTIONS.filter(o => o.category === cat).map(opt => (
              <div key={opt.key} className="flex items-center justify-between gap-4 py-1" data-testid={`notif-${opt.key}`}>
                <div>
                  <p className="text-sm font-medium text-[#1a2744]">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
                <Switch checked={!!settings[opt.key]} onCheckedChange={() => toggle(opt.key)} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const enabledCount = Object.values(settings).filter(Boolean).length;

  return embedded ? content : (
    <Layout>
      <PageShell
        eyebrow="PROFILE · NOTIFICATIONS"
        title="What you want to hear about"
        accent="and what you don't"
        subtitle="Tune the signals — review reminders, client activity, market moves, compliance, and document events. Saved instantly to your profile."
        meta={loading ? "LOADING…" : `${enabledCount} OF ${NOTIFICATION_OPTIONS.length} ENABLED`}
        actions={(
          <PillButton variant="primary" onClick={save} disabled={saved} data-testid="save-notifications">
            {saved ? <><Check className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Saved</> : <><Save className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Save changes</>}
          </PillButton>
        )}
      >
        {content}
      </PageShell>
    </Layout>
  );
};

export default NotificationSettings;
