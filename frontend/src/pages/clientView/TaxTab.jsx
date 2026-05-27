import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { fmt, fmtShort } from "./utils";

const TaxTab = ({ client }) => {
  const income = client.profile?.incomeHousehold || (client.budget?.monthlyIncome * 12) || 0;
  const superConcessional = Math.min(client.retirement?.annual_contributions || 0, 30000);
  const bands = [
    { from: 0, to: 18200, rate: 0 },
    { from: 18200, to: 45000, rate: 0.16 },
    { from: 45000, to: 135000, rate: 0.30 },
    { from: 135000, to: 190000, rate: 0.37 },
    { from: 190000, to: Infinity, rate: 0.45 },
  ];
  const taxable = Math.max(0, income - superConcessional);
  let tax = 0;
  for (const b of bands) {
    if (taxable > b.from) tax += (Math.min(taxable, b.to) - b.from) * b.rate;
  }
  const medicare = taxable * 0.02;
  const totalTax = tax + medicare;
  const netIncome = income - totalTax - superConcessional;
  const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold mb-4">Estimated annual tax position</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Gross income</p>
              <p className="font-serif text-xl text-[#1a2744] mt-1 tabular-nums">{fmtShort(income)}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Super salary-sac</p>
              <p className="font-serif text-xl text-[#D4A84C] mt-1 tabular-nums">{fmtShort(superConcessional)}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Est. tax + medicare</p>
              <p className="font-serif text-xl text-rose-600 mt-1 tabular-nums">{fmtShort(totalTax)}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Net (after tax)</p>
              <p className="font-serif text-xl text-emerald-600 mt-1 tabular-nums">{fmtShort(netIncome)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Marginal tax bands applied</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-0.5">
            {bands.filter((b) => taxable > b.from).map((b, i) => {
              const applied = Math.min(taxable, b.to) - b.from;
              return (
                <div key={i} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500">{fmt(b.from)}{b.to !== Infinity ? ` – ${fmt(b.to)}` : "+"} · {(b.rate * 100).toFixed(0)}%</span>
                  <span className="font-mono text-[#1a2744]">{fmt(applied * b.rate)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-end pt-4 mt-2 border-t border-slate-100">
            <span className="font-semibold text-[#1a2744]">Effective tax rate</span>
            <span className="font-serif text-xl text-[#D4A84C] tabular-nums">{effectiveRate.toFixed(1)}%</span>
          </div>
          <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 pt-3"><Lock className="h-3 w-3" /> Illustrative only — your adviser's tax models include your full entity structure &amp; deductions</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxTab;
