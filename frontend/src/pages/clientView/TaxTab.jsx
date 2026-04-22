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
      <Card>
        <CardContent className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Estimated Annual Tax Position</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Gross Income</p>
              <p className="text-lg font-bold text-[#1a2744]">{fmtShort(income)}</p>
            </div>
            <div className="p-3 bg-[#D4A84C]/10 rounded">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Super Salary-Sac</p>
              <p className="text-lg font-bold text-[#D4A84C]">{fmtShort(superConcessional)}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded">
              <p className="text-[10px] uppercase tracking-wide text-rose-700">Est. Tax + Medicare</p>
              <p className="text-lg font-bold text-rose-700">{fmtShort(totalTax)}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded">
              <p className="text-[10px] uppercase tracking-wide text-emerald-700">Net (After Tax)</p>
              <p className="text-lg font-bold text-emerald-700">{fmtShort(netIncome)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Marginal Tax Bands Applied</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {bands.filter((b) => taxable > b.from).map((b, i) => {
              const applied = Math.min(taxable, b.to) - b.from;
              return (
                <div key={i} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground">{fmt(b.from)}{b.to !== Infinity ? ` – ${fmt(b.to)}` : "+"} · {(b.rate * 100).toFixed(0)}%</span>
                  <span className="font-semibold">{fmt(applied * b.rate)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between pt-3 mt-2 border-t">
            <span className="font-semibold text-[#1a2744]">Effective tax rate</span>
            <span className="font-bold text-[#D4A84C]">{effectiveRate.toFixed(1)}%</span>
          </div>
          <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 pt-3"><Lock className="h-3 w-3" /> Illustrative only — your adviser's tax models include your full entity structure &amp; deductions</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxTab;
