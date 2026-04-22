import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { FlaskConical, Landmark, Lock } from "lucide-react";
import ClientSandbox from "@/components/ClientSandbox";
import { projectRetirement } from "@/lib/retirementEngine";
import { fmt, fmtShort } from "./utils";

const RetirementTab = ({ client }) => {
  const liquidAssets = client.assets.filter((a) => ["Super", "Shares", "Managed Fund", "Cash", "SMSF", "Bonds", "Alternatives"].includes(a.type)).reduce((s, a) => s + a.value, 0);
  const superAssets = client.assets.filter((a) => ["Super", "SMSF"].includes(a.type));
  const totalSuper = superAssets.reduce((s, a) => s + a.value, 0);
  const result = projectRetirement({
    currentPortfolio: liquidAssets,
    annualContributions: client.retirement.annual_contributions,
    annualSpending: client.retirement.retirement_spending,
    yearsToRetirement: Math.max(0, client.retirement.retirement_age - client.retirement.current_age),
    yearsInRetirement: Math.max(1, client.retirement.life_expectancy - client.retirement.retirement_age),
    numSims: 300,
  });

  const chartData = result.trajectory.map((t, i) => ({ age: client.retirement.current_age + i, p10: t.p10, p50: t.p50, p90: t.p90 }));
  const tone = result.confidence >= 80 ? "text-emerald-600" : result.confidence >= 60 ? "text-blue-600" : "text-amber-600";

  const concessionalCap = 30000;
  const concessionalUsed = Math.min(client.retirement.annual_contributions, concessionalCap);
  const capUsedPct = Math.round((concessionalUsed / concessionalCap) * 100);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Retirement Confidence</p>
          <p className={`text-6xl font-bold ${tone} my-2`} data-testid="client-retirement-confidence">{result.confidence}%</p>
          <p className="text-sm">You can retire at age <strong>{client.retirement.retirement_age}</strong> spending <strong>{fmt(client.retirement.retirement_spending)}</strong>/yr.</p>
          <p className="text-[11px] text-muted-foreground mt-2">Based on {result.numSims} Monte Carlo simulations · {client.retirement.retirement_age - client.retirement.current_age} years to go</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-4" data-testid="client-retirement-current">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Your Current Plan · Projected balance (P10 · P50 · P90)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} width={55} />
                    <Tooltip formatter={(v) => fmt(v)} labelFormatter={(v) => `Age ${v}`} />
                    <Line type="monotone" dataKey="p10" stroke="#f43f5e" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="P10 (pessimistic)" />
                    <Line type="monotone" dataKey="p50" stroke="#1a2744" strokeWidth={2.5} dot={false} name="P50 (median)" />
                    <Line type="monotone" dataKey="p90" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="P90 (optimistic)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Landmark className="h-4 w-4 text-[#D4A84C]" /> Super &amp; Pension</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Super Balance</p>
                  <p className="text-xl font-bold text-[#1a2744]">{fmtShort(totalSuper)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Annual Contributions</p>
                  <p className="text-xl font-bold text-[#1a2744]">{fmt(client.retirement.annual_contributions)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Retirement Age</p>
                  <p className="text-xl font-bold text-[#1a2744]">{client.retirement.retirement_age}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1"><span>Concessional cap usage (FY25 ${(concessionalCap/1000).toFixed(0)}k)</span><span className="font-semibold">{capUsedPct}%</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#D4A84C]" style={{ width: `${Math.min(100, capUsedPct)}%` }} /></div>
              </div>

              {superAssets.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  {superAssets.map((s, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-semibold">{fmt(s.value)}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 pt-1"><Lock className="h-3 w-3" /> View only — speak to your adviser to adjust contributions</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#D4A84C]/40 bg-gradient-to-br from-amber-50/40 to-white" data-testid="client-retirement-sandbox">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-[#D4A84C]" /> Try Your Own Scenarios
            </CardTitle>
            <p className="text-xs text-muted-foreground">Experiment with contributions, retirement age, and spending — results update live, side-by-side with your current plan.</p>
          </CardHeader>
          <CardContent>
            <ClientSandbox
              seed={{
                startingBalance: liquidAssets,
                annualContrib: client.retirement.annual_contributions,
                annualSpending: client.retirement.retirement_spending,
                currentAge: client.retirement.current_age,
                retireAge: client.retirement.retirement_age,
                lifeExpectancy: client.retirement.life_expectancy,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RetirementTab;
