// SimpleTax — 5-section calm template for Tax Centre.
// Answers: What's my tax bill? Biggest deduction opportunity? What's coming up?
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Receipt, Sparkles, Calendar, ArrowRight, FileText, TrendingUp } from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";

const fmt = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

// Australian progressive marginal rates (simplified 2025–26)
const estimateTax = (income) => {
  if (income <= 18_200) return 0;
  if (income <= 45_000) return (income - 18_200) * 0.19;
  if (income <= 135_000) return 5_092 + (income - 45_000) * 0.30;
  if (income <= 190_000) return 32_092 + (income - 135_000) * 0.37;
  return 52_442 + (income - 190_000) * 0.45;
};

const SimpleTax = ({ clientId: propClientId, embedded = false }) => {
  const navigate = useNavigate();
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  const income = client.profile.incomeHousehold || 0;
  // For couples assume split ~60/40; tax each side then sum.
  const estTax = estimateTax(income * 0.6) + estimateTax(income * 0.4);
  const effectiveRate = income > 0 ? (estTax / income) * 100 : 0;

  // Biggest deduction opportunity — derived from client's structure
  const hasSuper = client.assets.some(a => a.type === "Super");
  const currentConcessional = 12_000; // estimate
  const concessionalCap = 30_000; // FY26
  const concessionalGap = Math.max(0, concessionalCap - currentConcessional);
  const marginalRate = income / 2 > 135_000 ? 0.37 : 0.30;
  const taxSavingFromSuper = concessionalGap * (marginalRate - 0.15);

  const topOpportunity = hasSuper && concessionalGap > 5_000
    ? {
        title: "Top up concessional super contributions",
        detail: `You have ${fmt(concessionalGap * 2)} of unused concessional cap (both partners). Contributing reduces taxable income.`,
        impact: Math.round(taxSavingFromSuper * 2),
      }
    : {
        title: "Harvest tax losses before 30 June",
        detail: "Offset capital gains by realising underperformers in non-super accounts.",
        impact: 6_300,
      };

  // Tax calendar (AU FY)
  const calendar = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const endOfFY = new Date(year, 5, 30); // 30 June
    const daysToFY = Math.max(0, Math.ceil((endOfFY - now) / (1000 * 60 * 60 * 24)));
    return [
      { label: "EOFY deadline", date: "30 Jun", urgency: daysToFY < 60 ? "high" : "low", detail: `${daysToFY} days away` },
      { label: "BAS Q4 due", date: "28 Jul", urgency: "medium", detail: "Quarterly activity statement" },
      { label: "Tax return lodgement", date: "31 Oct", urgency: "low", detail: "Or May via registered agent" },
    ];
  }, []);

  const netIncome = income - estTax;

  return (
    <div className={embedded ? "" : "max-w-3xl mx-auto py-10 px-4"} data-testid="simple-tax">
      <div className="space-y-8">
        {/* SECTION 1 — Hero: tax bill & effective rate */}
        <div className="text-center" data-testid="tax-hero">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-2">Estimated Tax This Year</p>
          <h1 className="text-5xl font-bold text-[#1a2744] leading-none">{fmt(estTax)}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-semibold text-gray-800">{effectiveRate.toFixed(1)}% effective rate</span>
            <span className="mx-2">·</span>
            <span>Net income {fmt(netIncome)}</span>
          </p>
        </div>

        {/* SECTION 2 — Income → Tax → Net visual */}
        <Card data-testid="tax-flow">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Gross Income</p>
                <p className="text-lg font-bold text-emerald-700">{fmt(income)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tax Paid</p>
                <p className="text-lg font-bold text-rose-700">{fmt(estTax)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Take Home</p>
                <p className="text-lg font-bold text-[#1a2744]">{fmt(netIncome)}</p>
              </div>
            </div>
            <div className="mt-4 h-3 rounded-full bg-gray-100 overflow-hidden flex">
              <div className="bg-rose-400" style={{ width: `${(estTax / income) * 100}%` }} title="Tax" />
              <div className="bg-emerald-500" style={{ width: `${(netIncome / income) * 100}%` }} title="Net" />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 — Biggest opportunity */}
        <Card className="border border-[#D4A84C]/40 bg-[#D4A84C]/5" data-testid="tax-opportunity">
          <CardContent className="p-5 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[#8a6d2a] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] text-[#8a6d2a] uppercase tracking-wide font-semibold mb-1">Top opportunity</p>
              <p className="text-base font-semibold text-[#1a2744]">{topOpportunity.title}</p>
              <p className="text-xs text-gray-600 mt-1">{topOpportunity.detail}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-muted-foreground uppercase">Tax saved</p>
              <p className="text-xl font-bold text-emerald-700" data-testid="tax-opportunity-impact">{fmt(topOpportunity.impact)}</p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4 — Tax calendar (3 items only) */}
        <div data-testid="tax-calendar">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-3">Upcoming deadlines</p>
          <div className="space-y-2">
            {calendar.map((c, i) => {
              const tone = c.urgency === "high" ? "text-rose-700 bg-rose-50" :
                           c.urgency === "medium" ? "text-amber-700 bg-amber-50" :
                           "text-gray-700 bg-gray-50";
              return (
                <Card key={i} className="border border-gray-200" data-testid={`tax-calendar-${i}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${tone}`}>
                      {c.date.split(" ")[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1a2744]">{c.label}</p>
                      <p className="text-[11px] text-muted-foreground">{c.detail}</p>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{c.date}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* SECTION 5 — Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2" data-testid="tax-cta">
          <Button size="lg" className="bg-[#1a2744] hover:bg-[#1a2744]/90 text-base px-8"
            onClick={() => toast.success("Tax planning call requested")}
            data-testid="tax-primary-cta">
            <FileText className="h-4 w-4 mr-2" /> Plan my tax
          </Button>
          <Button size="lg" variant="outline" className="text-base px-6"
            onClick={() => navigate("/tax-centre")}
            data-testid="tax-details-cta">
            <Receipt className="h-4 w-4 mr-2" /> Open details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleTax;
