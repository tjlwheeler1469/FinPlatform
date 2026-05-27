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
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">Retirement confidence</p>
        <p className={`font-serif text-6xl ${tone} mt-3 tabular-nums`} data-testid="client-retirement-confidence">{result.confidence}%</p>
        <p className="text-sm text-slate-600 mt-3">You can retire at age <span className="font-semibold text-[#1a2744]">{client.retirement.retirement_age}</span> spending <span className="font-semibold text-[#1a2744]">{fmt(client.retirement.retirement_spending)}</span>/yr.</p>
        <p className="text-[11px] text-slate-400 mt-2">Based on {result.numSims} Monte Carlo simulations · {client.retirement.retirement_age - client.retirement.current_age} years to go</p>
      </div>

      {/* Current Plan (chart) + Super & Pension — stacked top section */}
      <div className="space-y-4" data-testid="client-retirement-current">
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Your current plan · projected balance (P10 · P50 · P90)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} width={55} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => fmt(v)} labelFormatter={(v) => `Age ${v}`} />
                  <Line type="monotone" dataKey="p10" stroke="#f43f5e" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="P10 (pessimistic)" />
                  <Line type="monotone" dataKey="p50" stroke="#1a2744" strokeWidth={2.5} dot={false} name="P50 (median)" />
                  <Line type="monotone" dataKey="p90" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="P90 (optimistic)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2"><Landmark className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Super &amp; pension</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Total super balance</p>
                <p className="font-serif text-2xl text-[#1a2744] mt-1 tabular-nums">{fmtShort(totalSuper)}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Annual contributions</p>
                <p className="font-serif text-2xl text-[#1a2744] mt-1 tabular-nums">{fmt(client.retirement.annual_contributions)}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Retirement age</p>
                <p className="font-serif text-2xl text-[#1a2744] mt-1 tabular-nums">{client.retirement.retirement_age}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-600">Concessional cap usage (FY25 ${(concessionalCap/1000).toFixed(0)}k)</span><span className="font-mono text-[#1a2744] font-semibold">{capUsedPct}%</span></div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#D4A84C]" style={{ width: `${Math.min(100, capUsedPct)}%` }} /></div>
            </div>

            {superAssets.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-3 border-t border-slate-100">
                {superAssets.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-slate-500">{s.name}</span>
                    <span className="font-mono text-[#1a2744]">{fmt(s.value)}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 pt-1"><Lock className="h-3 w-3" /> View only — speak to your adviser to adjust contributions</p>
          </CardContent>
        </Card>
      </div>

      {/* Try Your Own Scenarios — landscape, below */}
      <Card className="border-slate-200" data-testid="client-retirement-sandbox">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Try your own scenarios
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">Experiment with contributions, retirement age, and spending — results update live, side-by-side with your current plan.</p>
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
  );
};

export default RetirementTab;
