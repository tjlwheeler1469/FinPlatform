// SimpleGoals — airy calm goals page for the client view (retirement, home upgrade, legacy).
// Answers: Am I on track for each goal? What's blocking me? What's my next step?
//
// Aesthetic strictly aligned with the Retirement Planner reference:
// navy serif numbers · gold accents · slate muted text · NO emerald/rose/amber blocks.
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Target, Home, Heart, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { projectRetirement } from "@/components/ScenarioEngine";

const fmt = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v || 0}`;
};

const STATUS_TONE = {
  on_track: { label: "On track", dot: "bg-[#1a2744]" },
  monitor:  { label: "Monitor",  dot: "bg-[#D4A84C]" },
  review:   { label: "Review",   dot: "bg-[#D4A84C]" },
  at_risk:  { label: "At risk",  dot: "bg-slate-400" },
};

const GoalCard = ({ icon: Icon, title, target, current, targetDate, status, cta, onCta }) => {
  const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const tone = STATUS_TONE[status] || STATUS_TONE.monitor;
  return (
    <Card className="border-slate-200" data-testid={`goal-${slug}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-full border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
            <Icon className="h-4 w-4 text-[#1a2744]" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-medium text-[#1a2744]">{title}</p>
              <span className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">
                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                {tone.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-serif text-lg text-[#1a2744] tabular-nums">{fmt(current)}</span>
              <span className="text-[11px] text-slate-500">of {fmt(target)} · by {targetDate}</span>
            </div>
            <Progress value={pct} className="h-1.5" />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">{pct}% funded</span>
              <Button variant="ghost" size="sm" className="text-[11px] h-7 text-[#1a2744] hover:bg-slate-50" onClick={onCta} data-testid={`goal-cta-${slug}`}>
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
  const retirementStatus = retirementScenario.confidence >= 85
    ? "on_track"
    : retirementScenario.confidence >= 70 ? "monitor" : "at_risk";

  const goals = [
    {
      icon: Target, title: "Retirement",
      target: retirementTarget,
      current: retirementScenario.portfolioAtRetirement,
      targetDate: `Age ${client.retirement.retirement_age}`,
      status: retirementStatus,
      cta: "Adjust plan",
      onCta: () => toast.info("Switch to Retirement tab to adjust"),
    },
    {
      icon: Home, title: "Home renovation",
      target: 250000,
      current: Math.min(250000, Math.round(liquidAssets * 0.08)),
      targetDate: "Within 3 years",
      status: "on_track",
      cta: "Fund plan",
      onCta: () => toast.success("Savings plan drafted"),
    },
    {
      icon: Heart, title: "Legacy & estate",
      target: 2000000,
      current: Math.round(client.assets.reduce((s, a) => s + a.value, 0) - liquidAssets * 0.3),
      targetDate: "Ongoing",
      status: "review",
      cta: "Open estate doc",
      onCta: () => toast.info("Opening estate planning doc..."),
    },
  ];

  const topBlocker = retirementScenario.confidence < 85
    ? "Retirement contributions are below max — closing the gap would lift all goals"
    : "No major blockers — your plan is well-balanced across priorities";

  const nextStep = "Book a 20-min call with your adviser to prioritise the next 12 months";

  const onTrackCount = goals.filter(g => g.status === "on_track").length;
  const reviewCount = goals.length - onTrackCount;

  return (
    <div className={embedded ? "" : "max-w-3xl mx-auto py-10 px-4"} data-testid="simple-goals">
      <div className="space-y-6">
        {/* SECTION 1 — Hero status */}
        <div className="text-center" data-testid="goals-hero">
          <p className="text-[10px] tracking-[0.18em] uppercase text-[#D4A84C] font-semibold mb-2">Your goals</p>
          <h1 className="font-serif text-4xl text-[#1a2744]">{goals.length} goals in play</h1>
          <p className="text-[11px] text-slate-500 mt-2 max-w-md mx-auto">
            <span className="font-mono text-[#1a2744]">{onTrackCount}</span> on track · <span className="font-mono text-[#1a2744]">{reviewCount}</span> to review
          </p>
        </div>

        {/* SECTION 2 — Top blocker (single focus) — airy gold-bordered card */}
        <Card className="border-[#D4A84C]/40 bg-white" data-testid="goals-blocker">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full border border-[#D4A84C]/40 bg-white flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#8a6c1a] font-semibold mb-0.5">What's holding you back</p>
              <p className="text-sm text-slate-700 leading-snug">{topBlocker}</p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 — The 3 goals (simple cards, progress bars) */}
        <div className="space-y-3" data-testid="goals-list">
          {goals.map((g, i) => <GoalCard key={i} {...g} />)}
        </div>

        {/* SECTION 4 — One clear next step — airy navy with gold accent */}
        <Card className="border-slate-200 bg-[#1a2744]" data-testid="goals-next-step">
          <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#D4A84C] font-semibold mb-1">Next step</p>
              <p className="text-base text-white font-medium">{nextStep}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#D4A84C]/60 text-[#D4A84C] hover:bg-[#D4A84C] hover:text-[#1a2744] bg-transparent rounded-full"
              onClick={() => toast.success("Calendar invite sent")}
              data-testid="goals-next-step-cta"
            >
              Book <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* SECTION 5 — Primary CTA */}
        <div className="flex justify-center pt-2">
          <Button
            size="lg"
            variant="outline"
            className="border-[#1a2744] text-[#1a2744] hover:bg-[#1a2744] hover:text-white text-sm px-8 rounded-full"
            data-testid="goals-primary-cta"
            onClick={() => toast.success("Goal review scheduled")}
          >
            <TrendingUp className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} /> Review all goals with adviser
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleGoals;
