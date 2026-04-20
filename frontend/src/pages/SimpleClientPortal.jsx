// SimpleClientPortal — radically simplified client-facing portal.
// Honours user spec: Only show Confidence, plain English summary, 2–3 actions, one simple visual.
import { useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sparkles, ArrowRight, TrendingUp, FileText, Zap, MessageCircle, Phone,
} from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { projectRetirement } from "@/components/ScenarioEngine";

const fmt = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v || 0}`;
};

const ConfidenceGauge = ({ value, size = 300 }) => {
  const tone = value >= 85 ? { ring: "#10b981", bg: "#d1fae5", label: "On Track" } :
               value >= 70 ? { ring: "#f59e0b", bg: "#fef3c7", label: "Close" } :
                             { ring: "#f43f5e", bg: "#ffe4e6", label: "Needs Attention" };
  const arcLen = Math.PI * 110;
  const stroke = (Math.max(0, Math.min(100, value)) / 100) * arcLen;
  return (
    <div className="relative" style={{ width: size, height: size * 0.65 }}>
      <svg viewBox="0 0 260 170" width={size} height={size * 0.65}>
        <path d="M 20 150 A 110 110 0 0 1 240 150" fill="none" stroke="#e5e7eb" strokeWidth="18" strokeLinecap="round" />
        <path d="M 20 150 A 110 110 0 0 1 240 150" fill="none" stroke={tone.ring} strokeWidth="18" strokeLinecap="round" strokeDasharray={`${stroke} ${arcLen}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <span className="text-7xl font-bold text-[#1a2744] leading-none">{value}<span className="text-4xl">%</span></span>
        <span className="mt-3 px-4 py-1 rounded-full text-sm font-semibold" style={{ background: tone.bg, color: tone.ring }}>{tone.label}</span>
      </div>
    </div>
  );
};

const SimpleClientPortal = () => {
  const clientId = getActiveClientId() || "thompson_family";
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  const liquidAssets = useMemo(() =>
    client.assets.filter(a => ["Super", "Shares", "Managed Fund", "Cash", "Trust Portfolio"].includes(a.type))
      .reduce((s, a) => s + a.value, 0),
  [client]);

  const baseYears = Math.max(1, client.retirement.retirement_age - client.profile.age);
  const scenario = useMemo(() => projectRetirement({
    currentPortfolio: liquidAssets,
    annualContributions: client.retirement.annual_contributions,
    annualSpending: client.retirement.retirement_spending,
    yearsToRetirement: baseYears,
  }), [liquidAssets, client, baseYears]);

  // Plain English summary
  const summary = scenario.confidence >= 85
    ? `You're on track to retire at ${client.retirement.retirement_age}. Keep doing what you're doing — small check-ins each year will keep it that way.`
    : scenario.confidence >= 70
    ? `You're close to being fully on-track for retirement at ${client.retirement.retirement_age}. A couple of small tweaks below will lift your outlook meaningfully.`
    : `Your plan needs a conversation. The actions below will strengthen your retirement outlook — your adviser is ready to help you pick the right path.`;

  // Simple 2–3 actions
  const actions = [
    {
      icon: Sparkles,
      title: scenario.confidence >= 85 ? "Book your next annual check-in" : "Talk to your adviser",
      subtitle: scenario.confidence >= 85 ? "We'll review your plan and celebrate progress." : "A 30-min call can unlock meaningful upside.",
      cta: "Book Call",
      onClick: () => toast.success("Request sent", { description: "Your adviser will call you within 1 business day." }),
    },
    {
      icon: TrendingUp,
      title: "Review your monthly spending",
      subtitle: "Small changes compound — a 5% trim adds years of retirement security.",
      cta: "Open Budget",
      href: "/household-budget",
    },
    {
      icon: FileText,
      title: "Download your plain-English statement",
      subtitle: "One page. Real numbers. What matters, what's next.",
      cta: "Download",
      onClick: () => toast.success("Statement ready", { description: "Check your email in a moment." }),
    },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 px-4" data-testid="simple-client-portal">
        {/* SECTION 1 — Greeting + confidence */}
        <div className="text-center mb-10" data-testid="portal-greeting">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-2">Welcome back</p>
          <h1 className="text-3xl font-bold text-[#1a2744]">{client.profile.first_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Net worth: <span className="font-semibold text-[#1a2744]">{fmt(client.assets.reduce((s, a) => s + a.value, 0))}</span></p>
        </div>

        {/* SECTION 2 — The ONE visual */}
        <div className="flex flex-col items-center mb-10" data-testid="portal-confidence">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-4">Your retirement confidence</p>
          <ConfidenceGauge value={scenario.confidence} size={320} />
        </div>

        {/* SECTION 3 — Plain English summary */}
        <Card className="border-0 shadow-none bg-[#1a2744] text-white mb-8" data-testid="portal-summary">
          <CardContent className="p-8 text-center">
            <p className="text-lg leading-relaxed">{summary}</p>
          </CardContent>
        </Card>

        {/* SECTION 4 — 2–3 actions */}
        <div className="space-y-3 mb-8" data-testid="portal-actions">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-3">What you can do now</p>
          {actions.map((a, i) => (
            <Card key={i} className="border border-gray-200 hover:border-[#1a2744]/30 transition-colors" data-testid={`portal-action-${i}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-[#1a2744]/5 flex items-center justify-center flex-shrink-0">
                  <a.icon className="h-5 w-5 text-[#1a2744]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-[#1a2744] leading-tight">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.subtitle}</p>
                </div>
                {a.href ? (
                  <Button variant="outline" size="sm" onClick={() => { window.location.href = a.href; }} data-testid={`portal-action-${i}-cta`}>
                    {a.cta} <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={a.onClick} data-testid={`portal-action-${i}-cta`}>
                    {a.cta} <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SECTION 5 — Contact (always visible — calm anchor) */}
        <div className="text-center pt-4 border-t" data-testid="portal-contact">
          <p className="text-xs text-muted-foreground mb-2">Questions or concerns?</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => toast.info("Opening secure chat...")}>
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Message adviser
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = "tel:1300425296"}>
              <Phone className="h-3.5 w-3.5 mr-1.5" /> 1300 425 296
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SimpleClientPortal;
