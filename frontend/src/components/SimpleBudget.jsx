// SimpleBudget — 5-section calm template for household budget.
// Answers: Am I living within my means? What's my biggest leak? What one change matters most?
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, ArrowRight, AlertTriangle, Sparkles, PiggyBank,
  Home, Utensils, Car, Plane, ShoppingBag,
} from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";

const fmt = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v || 0}`;
};

const SimpleBudget = ({ clientId: propClientId, embedded = false }) => {
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  const income = client.profile.incomeHousehold || 0;
  const expenses = client.profile.expensesAnnual || 0;
  const surplus = income - expenses;
  const savingsRate = income > 0 ? (surplus / income) * 100 : 0;

  // Derive expense categories proportionally (approximation — real data would come from cashflow)
  const categories = useMemo(() => ([
    { icon: Home, label: "Housing & utilities", pct: 32, value: Math.round(expenses * 0.32) },
    { icon: Utensils, label: "Food & groceries", pct: 14, value: Math.round(expenses * 0.14) },
    { icon: Car, label: "Transport", pct: 10, value: Math.round(expenses * 0.10) },
    { icon: ShoppingBag, label: "Lifestyle & entertainment", pct: 18, value: Math.round(expenses * 0.18) },
    { icon: Plane, label: "Travel & holidays", pct: 12, value: Math.round(expenses * 0.12) },
    { icon: PiggyBank, label: "Insurance & fees", pct: 14, value: Math.round(expenses * 0.14) },
  ].sort((a, b) => b.value - a.value)), [expenses]);

  const biggestCategory = categories[0];
  const secondCategory = categories[1];

  // Status
  const status = savingsRate >= 20 ? "Strong" : savingsRate >= 10 ? "Healthy" : savingsRate >= 0 ? "Tight" : "Overspending";
  const statusTone = savingsRate >= 20 ? "emerald" : savingsRate >= 10 ? "emerald" : savingsRate >= 0 ? "amber" : "rose";

  // One actionable suggestion
  const suggestion = savingsRate < 10
    ? `Trimming ${biggestCategory.label.toLowerCase()} by 5% frees ${fmt(biggestCategory.value * 0.05)}/yr — enough to lift savings rate past 10%.`
    : savingsRate < 20
    ? `You're saving ${fmt(surplus)}/yr. Redirect ${fmt(surplus * 0.15)} more into super/ETFs to compound faster.`
    : `Strong surplus. Consider maxing concessional super contributions to reduce tax and accelerate retirement.`;

  return (
    <div className={embedded ? "" : "max-w-3xl mx-auto py-10 px-4"} data-testid="simple-budget">
      <div className="space-y-8">
        {/* SECTION 1 — Hero status */}
        <div className="text-center" data-testid="budget-hero">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-2">Household Budget</p>
          <h1 className="text-5xl font-bold text-[#1a2744] leading-none">
            {fmt(surplus)}<span className="text-2xl text-muted-foreground ml-1">/yr surplus</span>
          </h1>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              statusTone === "emerald" ? "bg-emerald-100 text-emerald-700" :
              statusTone === "amber" ? "bg-amber-100 text-amber-700" :
              "bg-rose-100 text-rose-700"
            }`}>{status}</span>
            <span className="text-sm text-muted-foreground">· {savingsRate.toFixed(0)}% savings rate</span>
          </div>
        </div>

        {/* SECTION 2 — Income vs expenses visual (simple split bar) */}
        <Card data-testid="budget-flow">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Income</p>
                </div>
                <p className="text-2xl font-bold text-emerald-700">{fmt(income)}<span className="text-sm text-muted-foreground font-normal">/yr</span></p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Expenses</p>
                </div>
                <p className="text-2xl font-bold text-rose-700">{fmt(expenses)}<span className="text-sm text-muted-foreground font-normal">/yr</span></p>
              </div>
            </div>
            <div className="mt-4 h-3 rounded-full bg-gray-100 overflow-hidden flex">
              <div className="bg-emerald-500" style={{ width: `${(income / (income + expenses)) * 100}%` }} />
              <div className="bg-rose-400" style={{ width: `${(expenses / (income + expenses)) * 100}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 — Top 2 spending categories */}
        <div data-testid="budget-top-categories">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-3">Where your money goes</p>
          <div className="space-y-3">
            {[biggestCategory, secondCategory].map((cat, i) => (
              <Card key={i} className="border border-gray-200" data-testid={`budget-category-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#1a2744]/5 flex items-center justify-center flex-shrink-0">
                    <cat.icon className="h-5 w-5 text-[#1a2744]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <p className="text-sm font-semibold text-[#1a2744]">{cat.label}</p>
                      <p className="text-sm font-bold text-[#1a2744]">{fmt(cat.value)}<span className="text-[10px] text-muted-foreground font-normal">/yr</span></p>
                    </div>
                    <Progress value={cat.pct * 2.5} className="h-1.5" />
                    <p className="text-[11px] text-muted-foreground mt-1">{cat.pct}% of annual spend</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 4 — The one suggestion */}
        <Card className="border border-[#D4A84C]/40 bg-[#D4A84C]/5" data-testid="budget-suggestion">
          <CardContent className="p-5 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[#8a6d2a] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-[#8a6d2a] uppercase tracking-wide font-semibold mb-1">What matters most</p>
              <p className="text-sm text-gray-800 leading-relaxed">{suggestion}</p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 5 — Primary CTA */}
        <div className="flex justify-center pt-2">
          <Button size="lg" className="bg-[#1a2744] hover:bg-[#1a2744]/90 text-base px-8"
            onClick={() => toast.success("Budget review scheduled")}
            data-testid="budget-primary-cta">
            <PiggyBank className="h-4 w-4 mr-2" /> Tune my budget
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleBudget;
