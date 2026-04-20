// SimpleRetirement — radically simplified 5-section retirement page.
// Answers only: Am I on track? | What's my biggest risk? | What improves my outcome? | What do I do next?
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Sparkles, Activity, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Zap,
} from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { projectRetirement } from "@/components/ScenarioEngine";
import { generateReviewPackPDF } from "@/lib/pdfGenerator";

const fmt = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v || 0}`;
};

// -------- Section 4: The ONE visual — confidence gauge ----------
const ConfidenceGauge = ({ value, size = 260 }) => {
  const tone = value >= 85 ? { ring: "#10b981", bg: "#d1fae5", label: "On Track" } :
               value >= 70 ? { ring: "#f59e0b", bg: "#fef3c7", label: "Monitor" } :
                             { ring: "#f43f5e", bg: "#ffe4e6", label: "At Risk" };
  const radius = 110;
  const circ = 2 * Math.PI * radius;
  // Semicircle: from 180° to 0° — 180° of arc (π * r)
  const arcLen = Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const stroke = (pct / 100) * arcLen;

  return (
    <div className="relative" style={{ width: size, height: size * 0.65 }}>
      <svg viewBox="0 0 260 170" width={size} height={size * 0.65}>
        {/* background arc */}
        <path
          d="M 20 150 A 110 110 0 0 1 240 150"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* progress arc */}
        <path
          d="M 20 150 A 110 110 0 0 1 240 150"
          fill="none"
          stroke={tone.ring}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${stroke} ${arcLen}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
        <span className="text-6xl font-bold text-[#1a2744] leading-none">{pct}<span className="text-3xl">%</span></span>
        <span className="mt-2 px-3 py-0.5 rounded-full text-xs font-semibold" style={{ background: tone.bg, color: tone.ring }}>
          {tone.label}
        </span>
      </div>
    </div>
  );
};

const SimpleRetirement = ({ clientId: propClientId, embedded = false }) => {
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  const liquidAssets = useMemo(() =>
    client.assets.filter(a => ["Super", "Shares", "Managed Fund", "Cash", "Trust Portfolio"].includes(a.type))
      .reduce((s, a) => s + a.value, 0),
  [client]);

  const baseYears = Math.max(1, client.retirement.retirement_age - client.profile.age);
  const baseScenario = useMemo(() => projectRetirement({
    currentPortfolio: liquidAssets,
    annualContributions: client.retirement.annual_contributions,
    annualSpending: client.retirement.retirement_spending,
    yearsToRetirement: baseYears,
  }), [liquidAssets, client, baseYears]);

  // Biggest improvements — simulate 2 options only
  const improvements = useMemo(() => {
    const delay2yrs = projectRetirement({
      currentPortfolio: liquidAssets,
      annualContributions: client.retirement.annual_contributions,
      annualSpending: client.retirement.retirement_spending,
      yearsToRetirement: baseYears + 2,
    });
    const reduceSpend8 = projectRetirement({
      currentPortfolio: liquidAssets,
      annualContributions: client.retirement.annual_contributions,
      annualSpending: client.retirement.retirement_spending * 0.92,
      yearsToRetirement: baseYears,
    });
    return [
      { title: "Delay retirement 2 years", boost: Math.max(0, delay2yrs.confidence - baseScenario.confidence), detail: `Retire at ${client.retirement.retirement_age + 2}` },
      { title: "Reduce spending 8%", boost: Math.max(0, reduceSpend8.confidence - baseScenario.confidence), detail: `${fmt(client.retirement.retirement_spending * 0.92)}/yr in retirement` },
    ].sort((a, b) => b.boost - a.boost);
  }, [liquidAssets, client, baseYears, baseScenario]);

  // The ONE top risk
  const topRisk = useMemo(() => {
    if (baseScenario.confidence < 70) return { title: "Retiring too early", detail: "Plan runs out before life expectancy under median outcomes." };
    if (client.retirement.retirement_spending / Math.max(1, liquidAssets) > 0.045) return { title: "Spending draws down capital too fast", detail: "Your target retirement spending exceeds a sustainable 4.5% drawdown rate." };
    if (baseYears <= 7) return { title: "Sequencing risk near retirement", detail: "A market downturn in the next few years would disproportionately impact outcomes." };
    if (baseScenario.confidence < 85) return { title: "Moderate volatility drag", detail: "Current allocation has ~12% σ — a small equity-bond shift could reduce shortfall risk." };
    return { title: "Sequence-of-returns risk", detail: "Outcomes are healthy — remaining risk is timing of returns during the drawdown years." };
  }, [baseScenario, client, liquidAssets, baseYears]);

  // One-line summary for the hero
  const summary = baseScenario.confidence >= 85
    ? `You are on track to retire at ${client.retirement.retirement_age}.`
    : baseScenario.confidence >= 70
    ? `You are close to on-track — small adjustments will strengthen your plan.`
    : `Your current plan falls short — the improvements below can restore confidence.`;

  const [showScenarioSlider, setShowScenarioSlider] = useState(false);
  const [retireAge, setRetireAge] = useState(client.retirement.retirement_age);
  const scenarioConf = useMemo(() => projectRetirement({
    currentPortfolio: liquidAssets,
    annualContributions: client.retirement.annual_contributions,
    annualSpending: client.retirement.retirement_spending,
    yearsToRetirement: Math.max(1, retireAge - client.profile.age),
  }).confidence, [liquidAssets, client, retireAge]);

  const handleImprove = () => setShowScenarioSlider(true);
  const handleReviewPack = () => {
    try {
      generateReviewPackPDF({
        clientId,
        confidence: baseScenario.confidence,
        changes: [],
        opportunities: improvements.map((i) => ({ title: i.title, detail: i.detail, impact: i.boost * 1000 })),
        alerts: [{ level: "yellow", title: topRisk.title, detail: topRisk.detail }],
      });
      toast.success("Review Pack downloaded", { description: `Generated for ${client.profile.name}` });
    } catch { toast.error("PDF generation failed"); }
  };

  return (
    <div className={embedded ? "" : "max-w-3xl mx-auto py-10 px-4"} data-testid="simple-retirement">
      <div className="space-y-8">
        {/* SECTION 1 — HERO STATUS */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="px-0 text-center py-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-2">Retirement Confidence</p>
            <div className="inline-flex flex-col items-center" data-testid="hero-status">
              <span className="text-7xl font-bold text-[#1a2744] leading-none">
                {baseScenario.confidence}<span className="text-4xl text-muted-foreground">%</span>
              </span>
              <span className={`mt-3 px-4 py-1 rounded-full text-sm font-semibold ${
                baseScenario.confidence >= 85 ? "bg-emerald-100 text-emerald-700" :
                baseScenario.confidence >= 70 ? "bg-amber-100 text-amber-700" :
                "bg-rose-100 text-rose-700"
              }`} data-testid="hero-status-label">
                {baseScenario.confidence >= 85 ? "On Track" : baseScenario.confidence >= 70 ? "Close" : "At Risk"}
              </span>
            </div>
            <p className="mt-5 text-base text-gray-700 max-w-lg mx-auto" data-testid="hero-summary">{summary}</p>
          </CardContent>
        </Card>

        {/* SECTION 2 — TOP RISK (single) */}
        <Card className="border border-amber-200 bg-amber-50/40" data-testid="top-risk">
          <CardContent className="p-6 flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-amber-700 uppercase tracking-wide font-semibold mb-1">Main Risk</p>
              <p className="text-lg font-semibold text-[#1a2744]" data-testid="top-risk-title">{topRisk.title}</p>
              <p className="text-sm text-gray-600 mt-1">{topRisk.detail}</p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 — BIGGEST IMPROVEMENT (top 2) */}
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-3">What Improves Your Outcome</p>
          <div className="space-y-3" data-testid="improvements">
            {improvements.slice(0, 2).map((imp, i) => (
              <Card key={i} className="border border-gray-200 hover:border-emerald-300 transition-colors" data-testid={`improvement-${i}`}>
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      {i === 0 ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <Zap className="h-5 w-5 text-emerald-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-[#1a2744] leading-tight">{imp.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{imp.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xl font-bold text-emerald-600" data-testid={`improvement-${i}-boost`}>+{imp.boost}%</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 4 — SIMPLE VISUAL (one gauge) */}
        <Card className="border-0 shadow-none bg-transparent" data-testid="retirement-visual">
          <CardContent className="p-6 flex flex-col items-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-4">Success Probability</p>
            <ConfidenceGauge value={baseScenario.confidence} size={280} />
            {showScenarioSlider && (
              <div className="w-full max-w-md mt-6 space-y-2" data-testid="inline-scenario">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Retirement Age</span>
                  <span className="font-semibold text-[#1a2744]">{retireAge} · <span className="text-emerald-600">{scenarioConf}%</span></span>
                </div>
                <Slider min={55} max={75} step={1} value={[retireAge]} onValueChange={(v) => setRetireAge(v[0])} data-testid="inline-scenario-slider" />
                <p className="text-[11px] text-muted-foreground text-center">Adjust to see how delaying retirement affects your confidence.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 5 — PRIMARY ACTION */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2" data-testid="retirement-cta">
          <Button
            size="lg"
            className="bg-[#1a2744] hover:bg-[#1a2744]/90 text-base px-8 py-6"
            onClick={handleImprove}
            data-testid="btn-improve-my-plan"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Improve My Plan
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base px-6 py-6"
            onClick={handleReviewPack}
            data-testid="btn-retirement-review-pack"
          >
            <Activity className="h-4 w-4 mr-2" />
            Generate Review Pack
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleRetirement;
