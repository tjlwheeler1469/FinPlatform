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
      <Card>
        <CardContent className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Household Cash Flow</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-emerald-50 rounded">
              <p className="text-[10px] uppercase tracking-wide text-emerald-700">Monthly In</p>
              <p className="text-xl font-bold text-emerald-700">{fmtShort(b.monthlyIncome)}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded">
              <p className="text-[10px] uppercase tracking-wide text-rose-700">Monthly Out</p>
              <p className="text-xl font-bold text-rose-700">{fmtShort(b.monthlyExpenses)}</p>
            </div>
            <div className="p-3 bg-[#1a2744]/5 rounded">
              <p className="text-[10px] uppercase tracking-wide text-[#1a2744]">Monthly Saved</p>
              <p className="text-xl font-bold text-[#1a2744]">{fmtShort(monthlySavings)}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1"><span>Savings rate</span><span className="font-semibold text-[#D4A84C]">{b.savingsRate}%</span></div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-[#D4A84C]" style={{ width: `${Math.min(100, b.savingsRate)}%` }} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Annual Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b"><span className="text-sm text-muted-foreground">Household income (annual)</span><span className="font-semibold">{fmt(annualIncome)}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-sm text-muted-foreground">Household expenses (annual)</span><span className="font-semibold">{fmt(annualExpenses)}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-sm text-muted-foreground">Annual savings</span><span className="font-semibold text-emerald-600">{fmt(annualIncome - annualExpenses)}</span></div>
            <div className="flex justify-between py-2"><span className="text-sm font-semibold text-[#1a2744]">Effective savings rate</span><span className="font-bold text-[#D4A84C]">{b.savingsRate}%</span></div>
          </div>
          <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 pt-3"><Lock className="h-3 w-3" /> View only — all cash flow data is managed by your adviser</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetTab;
