import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { fmt, fmtShort } from "./utils";

const BudgetTab = ({ client }) => {
  const b = client.budget || { monthlyIncome: 0, monthlyExpenses: 0, savingsRate: 0 };
  const monthlySavings = b.monthlyIncome - b.monthlyExpenses;
  const annualIncome = (client.profile?.incomeHousehold) || (b.monthlyIncome * 12);
  const annualExpenses = (client.profile?.expensesAnnual) || (b.monthlyExpenses * 12);

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold mb-4">Household cash flow</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Monthly in</p>
              <p className="font-serif text-2xl text-emerald-600 mt-1 tabular-nums">{fmtShort(b.monthlyIncome)}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Monthly out</p>
              <p className="font-serif text-2xl text-rose-600 mt-1 tabular-nums">{fmtShort(b.monthlyExpenses)}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Monthly saved</p>
              <p className="font-serif text-2xl text-[#1a2744] mt-1 tabular-nums">{fmtShort(monthlySavings)}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-600">Savings rate</span><span className="font-mono text-[#D4A84C] font-semibold">{b.savingsRate}%</span></div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#D4A84C]" style={{ width: `${Math.min(100, b.savingsRate)}%` }} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Annual summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-500">Household income (annual)</span><span className="font-mono text-[#1a2744]">{fmt(annualIncome)}</span></div>
            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-500">Household expenses (annual)</span><span className="font-mono text-[#1a2744]">{fmt(annualExpenses)}</span></div>
            <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-500">Annual savings</span><span className="font-mono text-emerald-600">{fmt(annualIncome - annualExpenses)}</span></div>
            <div className="flex justify-between py-2"><span className="text-sm font-semibold text-[#1a2744]">Effective savings rate</span><span className="font-serif text-lg text-[#D4A84C]">{b.savingsRate}%</span></div>
          </div>
          <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 pt-3"><Lock className="h-3 w-3" /> View only — all cash flow data is managed by your adviser</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetTab;
