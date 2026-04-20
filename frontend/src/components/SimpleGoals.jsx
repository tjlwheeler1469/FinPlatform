// SimpleGoals — 5-section calm template for client goals (retirement, home upgrade, legacy).
// Answers: Am I on track for each goal? What's blocking me? What's my next step?
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Target, Home, Heart, Plane, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { projectRetirement } from "@/components/ScenarioEngine";

const fmt = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v || 0}`;
};

const GoalCard = ({ icon: Icon, title, target, current, targetDate, status, tone, cta, onCta }) => {
  const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
  const ringColor = tone === "emerald" ? "text-emerald-700 bg-emerald-50" :
                    tone === "amber" ? "text-amber-700 bg-amber-50" :
                    "text-rose-700 bg-rose-50";
  return (
    <Card className="border border-gray-200" data-testid={`goal-${title.replace(/\s/g, '-').toLowerCase()}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-[#1a2744]/5 flex items-center justify-center flex-shrink-0">
            <Icon className="h-6 w-6 text-[#1a2744]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-base font-semibold text-[#1a2744]">{title}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${ringColor}`}>{status}</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-lg font-bold text-[#1a2744]">{fmt(current)}</span>
              <span className="text-xs text-muted-foreground">of {fmt(target)} · by {targetDate}</span>
            </div>
            <Progress value={pct} className="h-1.5" />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-muted-foreground">{pct}% funded</span>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onCta} data-testid={`goal-cta-${title.replace(/\s/g, '-').toLowerCase()}`}>
                {cta} <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SimpleGoals = ({ clientId: propClientId, embedded = false }) => {
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  const liquidAssets = useMemo(() =>
    client.assets.filter(a => ["Super", "Shares", "Managed Fund", "Cash", "Trust Portfolio"].includes(a.type))
      .reduce((s, a) => s + a.value, 0),
  [client]);

  const baseYears = Math.max(1, client.retirement.retirement_age - client.profile.age);
  const retirementScenario = useMemo(() => projectRetirement({
    currentPortfolio: liquidAssets,
    annualContributions: client.retirement.annual_contributions,
    annualSpending: client.retirement.retirement_spending,
    yearsToRetirement: baseYears,
  }), [liquidAssets, client, baseYears]);

  const retirementTarget = client.retirement.retirement_spending * 25; // 4% rule
  const retirementTone = retirementScenario.confidence >= 85 ? "emerald" : retirementScenario.confidence >= 70 ? "amber" : "rose";

  // Three example goals — retirement is real, others derived sensibly
  const goals = [
    {
      icon: Target, title: "Retirement",
      target: retirementTarget,
      current: retirementScenario.portfolioAtRetirement,
      targetDate: `Age ${client.retirement.retirement_age}`,
      status: retirementTone === "emerald" ? "On track" : retirementTone === "amber" ? "Close" : "At risk",
      tone: retirementTone,
      cta: "Adjust plan",
      onCta: () => toast.info("Switch to Retirement tab to adjust"),
    },
    {
      icon: Home, title: "Home renovation",
      target: 250000,
      current: Math.min(250000, Math.round(liquidAssets * 0.08)),
      targetDate: "Within 3 years",
      status: "On track",
      tone: "emerald",
      cta: "Fund plan",
      onCta: () => toast.success("Savings plan drafted"),
    },
    {
      icon: Heart, title: "Legacy & estate",
      target: 2000000,
      current: Math.round(client.assets.reduce((s, a) => s + a.value, 0) - liquidAssets * 0.3),
      targetDate: "Ongoing",
      status: "Review needed",
      tone: "amber",
      cta: "Open estate doc",
      onCta: () => toast.info("Opening estate planning doc..."),
    },
  ];

  const topBlocker = retirementScenario.confidence < 85
    ? "Retirement contributions are below max — closing the gap would lift all goals"
    : "No major blockers — your plan is well-balanced across priorities";

  const nextStep = "Book a 20-min call with your adviser to prioritise the next 12 months";

  return (
    <div className={embedded ? "" : "max-w-3xl mx-auto py-10 px-4"} data-testid="simple-goals">
      <div className="space-y-8">
        {/* SECTION 1 — Hero status */}
        <div className="text-center" data-testid="goals-hero">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-2">Your Goals</p>
          <h1 className="text-4xl font-bold text-[#1a2744]">3 goals in play</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            {goals.filter(g => g.tone === "emerald").length} on track · {goals.filter(g => g.tone === "amber").length} to review
          </p>
        </div>

        {/* SECTION 2 — Top blocker (single focus) */}
        <Card className="border border-amber-200 bg-amber-50/40" data-testid="goals-blocker">
          <CardContent className="p-5 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-[11px] text-amber-700 uppercase tracking-wide font-semibold mb-0.5">What's holding you back</p>
              <p className="text-sm text-gray-800">{topBlocker}</p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 — The 3 goals (simple cards, progress bars) */}
        <div className="space-y-3" data-testid="goals-list">
          {goals.map((g, i) => <GoalCard key={i} {...g} />)}
        </div>

        {/* SECTION 4 — One clear next step */}
        <Card className="border-0 shadow-none bg-[#1a2744] text-white" data-testid="goals-next-step">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-white/70 uppercase tracking-wide mb-1">Next step</p>
              <p className="text-base font-semibold">{nextStep}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success("Calendar invite sent")}>
              Book <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* SECTION 5 — Primary CTA */}
        <div className="flex justify-center pt-2">
          <Button size="lg" className="bg-[#1a2744] hover:bg-[#1a2744]/90 text-base px-8" data-testid="goals-primary-cta"
            onClick={() => toast.success("Goal review scheduled")}>
            <TrendingUp className="h-4 w-4 mr-2" /> Review all goals with adviser
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleGoals;
