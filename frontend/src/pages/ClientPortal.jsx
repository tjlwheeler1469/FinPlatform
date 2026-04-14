import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Clock, TrendingUp, Heart, ArrowRight,
  CheckCircle, User, Phone, Mail, CalendarDays, RefreshCw
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL;

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(val || 0);

/* ── colour helpers ── */
const statusColor = (score) => {
  if (score >= 80) return { bg: "#ecfdf5", ring: "#22c55e", text: "#15803d", label: "On Track" };
  if (score >= 60) return { bg: "#eff6ff", ring: "#3b82f6", text: "#1d4ed8", label: "Looking Good" };
  if (score >= 40) return { bg: "#fffbeb", ring: "#f59e0b", text: "#b45309", label: "Needs Attention" };
  return { bg: "#fef2f2", ring: "#ef4444", text: "#b91c1c", label: "At Risk" };
};

/* ── Confidence Gauge (clean single-arc approach) ── */
const ConfidenceGauge = ({ score }) => {
  const s = statusColor(score);
  const pct = Math.min(100, Math.max(0, score));
  // Semi-circle: total arc length for r=90, half-circle = PI * 90 ≈ 282.7
  const arcLen = Math.PI * 90;
  const filled = (pct / 100) * arcLen;

  return (
    <div className="flex flex-col items-center" data-testid="confidence-gauge">
      <div className="relative w-56">
        <svg viewBox="0 0 200 115" className="w-full h-auto">
          {/* background track */}
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* filled arc — uses dasharray to avoid endpoint blobs */}
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke={s.ring}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${arcLen}`}
          />
        </svg>
        {/* number overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-4xl font-bold leading-none" style={{ color: s.text }} data-testid="confidence-number">
            {Math.round(pct)}%
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">confidence</span>
        </div>
      </div>
      <Badge className="mt-2 text-sm px-4 py-1" style={{ backgroundColor: s.ring, color: "#fff" }} data-testid="confidence-badge">
        {s.label}
      </Badge>
    </div>
  );
};

/* ── Plain English builder ── */
const buildSummary = (confidence, dashboard) => {
  const score = confidence?.confidence_score || 0;
  const yearsTo = confidence?.inputs?.years_to_retirement || 17;
  const retireAge = confidence?.inputs?.retirement_age || 67;
  const spending = confidence?.inputs?.retirement_spending || 72000;

  const what = score >= 70
    ? `Based on your current savings and contributions, you're projected to retire comfortably at age ${retireAge}. Your plan supports an annual retirement income of around ${formatCurrency(spending)}.`
    : `Your current plan aims for retirement at age ${retireAge} with ${formatCurrency(spending)} per year. There's still time to strengthen your position over the next ${yearsTo} years.`;

  const strengths = [];
  if (score >= 70) strengths.push("Your savings rate is strong and consistent");
  if (dashboard?.summary?.goals_on_track >= 2) strengths.push("Most of your financial goals are on track");
  strengths.push("You have a diversified investment strategy");
  if (confidence?.inputs?.annual_contributions > 30000) strengths.push("Your super contributions are well above average");

  const risks = [];
  if (score < 80) risks.push("Market downturns could temporarily reduce your retirement funds");
  if (spending > 65000) risks.push("Your planned spending is above the comfortable retirement standard");
  risks.push("Unexpected health costs could impact your plan");
  if (score < 60) risks.push("Your savings growth may not keep pace with inflation");

  return { what, strengths: strengths.slice(0, 3), risks: risks.slice(0, 3) };
};

/* ── Improvement Actions ── */
const buildActions = (confidence) => {
  const score = confidence?.confidence_score || 0;
  return [
    {
      title: "Increase super contributions",
      desc: "Adding an extra $200/month to super could meaningfully boost your retirement balance.",
      impact: score < 90 ? "+8% confidence" : "+3% confidence",
      icon: TrendingUp,
      color: "#22c55e",
    },
    {
      title: "Delay retirement by 2 years",
      desc: "Working until 69 gives your investments more time to grow and reduces the years you need to fund.",
      impact: "+12% confidence",
      icon: Clock,
      color: "#3b82f6",
    },
    {
      title: "Reduce planned spending by 10%",
      desc: "A small adjustment to your retirement spending target frees up a significant buffer.",
      impact: "+6% confidence",
      icon: Heart,
      color: "#f59e0b",
    },
  ];
};

/* ── Main Component ── */
const ClientPortal = () => {
  const [loading, setLoading] = useState(true);
  const [clientId] = useState("portal_001");
  const [dashboard, setDashboard] = useState(null);
  const [retirementConfidence, setRetirementConfidence] = useState(null);

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, retireRes] = await Promise.all([
        fetch(`${API_URL}/api/client-portal/dashboard/${clientId}`),
        fetch(`${API_URL}/api/hybrid-engine/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            current_age: 50,
            retirement_age: 67,
            life_expectancy: 92,
            current_portfolio: 1609800,
            annual_contributions: 42000,
            retirement_spending: 72000,
            expected_return: 0.065,
            return_volatility: 0.12,
            inflation_rate: 0.03,
            num_simulations: 3000,
            enable_dynamic_spending: true,
            mode: "background",
          }),
        }),
      ]);
      if (dashRes.ok) setDashboard(await dashRes.json());
      if (retireRes.ok) setRetirementConfidence(await retireRes.json());
    } catch (err) {
      console.error("Client portal fetch:", err);
    }
    setLoading(false);
  };

  /* Loading state */
  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Preparing your financial overview...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const score = retirementConfidence?.confidence_score || 0;
  const s = statusColor(score);
  const summary = buildSummary(retirementConfidence, dashboard);
  const actions = buildActions(retirementConfidence);
  const yearsTo = retirementConfidence?.inputs?.years_to_retirement || 17;
  const firstName = dashboard?.name?.split(" ")[0] || "David";
  const advisorName = dashboard?.advisor?.name || "Sarah Chen";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 pb-12" data-testid="client-portal">

        {/* ── PHASE 1 — Hero ── */}
        <section className="text-center pt-4" data-testid="hero-section">
          <p className="text-muted-foreground text-sm mb-1">
            {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-6" data-testid="hero-title">
            {score >= 70
              ? `${firstName}, you're on track for a comfortable retirement.`
              : `${firstName}, let's look at where you stand.`}
          </h1>

          <ConfidenceGauge score={score} />
        </section>

        {/* ── PHASE 2 — Plain English Summary ── */}
        <section data-testid="plain-english-section">
          <Card style={{ borderLeft: `4px solid ${s.ring}` }}>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold text-base" data-testid="summary-heading">Your plan in plain English</h2>
              <p className="text-sm leading-relaxed text-foreground/80" data-testid="summary-text">
                {summary.what}
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Strengths</p>
                  {summary.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm" data-testid={`strength-${i}`}>
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                {/* Risks */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Things to watch</p>
                  {summary.risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm" data-testid={`risk-${i}`}>
                      <Shield className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── PHASE 3 — Improvement Actions ── */}
        <section data-testid="actions-section">
          <h2 className="font-semibold text-base mb-3">Ways to improve your outlook</h2>
          <div className="space-y-3">
            {actions.map((a, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow" data-testid={`action-card-${i}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${a.color}18` }}>
                    <a.icon className="h-5 w-5" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-medium text-sm">{a.title}</p>
                      <Badge variant="secondary" className="text-xs whitespace-nowrap font-semibold" style={{ color: a.color }} data-testid={`action-impact-${i}`}>
                        {a.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── PHASE 4 — Simple Timeline Visual ── */}
        <section data-testid="timeline-section">
          <h2 className="font-semibold text-base mb-3">Your retirement timeline</h2>
          <Card>
            <CardContent className="p-5">
              <div className="relative">
                {/* Track */}
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((50 - 25) / (67 - 25)) * 100)}%`,
                      backgroundColor: s.ring,
                    }}
                    data-testid="timeline-bar"
                  />
                </div>

                {/* Labels */}
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Today</p>
                    <p>Age 50</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold" style={{ color: s.ring }}>Retirement</p>
                    <p>Age 67</p>
                  </div>
                </div>

                {/* Middle info */}
                <div className="text-center mt-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{yearsTo} years</span> to grow your wealth
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── PHASE 5 — Advisor Guidance ── */}
        <section data-testid="advisor-section">
          <Card className="bg-[#1a2744] text-white">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-base" data-testid="advisor-name">
                    {advisorName} is looking after your plan
                  </h3>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Your adviser is continuously monitoring your investments, adjusting your plan as markets and life change,
                    and keeping you on track toward a comfortable retirement. You don't need to worry about the details — that's what we're here for.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border-0" data-testid="advisor-call-btn">
                      <Phone className="h-3.5 w-3.5 mr-1.5" /> Call
                    </Button>
                    <Button size="sm" variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border-0" data-testid="advisor-email-btn">
                      <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
                    </Button>
                    <Button size="sm" variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border-0" data-testid="advisor-meeting-btn">
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Book Meeting
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Refresh */}
        <div className="text-center">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={fetchData} data-testid="refresh-btn">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ClientPortal;
