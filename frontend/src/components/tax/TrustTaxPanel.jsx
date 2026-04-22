// Trust Tax Panel — AU discretionary trust quick tax calculator.
// Shows effect of distribution strategy vs retaining income (taxed at top rate).
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Landmark, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { toast } from "sonner";

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

// 2025 AU individual brackets (s4-15 ITAA)
const calcIndividualTax = (income) => {
  if (income <= 18200) return 0;
  if (income <= 45000) return (income - 18200) * 0.16;
  if (income <= 135000) return 4288 + (income - 45000) * 0.30;
  if (income <= 190000) return 31288 + (income - 135000) * 0.37;
  return 51638 + (income - 190000) * 0.45;
};

const TRUSTEE_TAX_RATE = 0.45; // Undistributed trust income taxed to trustee at top MTR (s99A)

const TrustTaxPanel = () => {
  const [trustIncome, setTrustIncome] = useState(250000);
  const [beneficiaries, setBeneficiaries] = useState([
    { id: 1, name: "Primary Beneficiary", otherIncome: 45000, pct: 100 },
  ]);

  const addBeneficiary = () => {
    if (beneficiaries.length >= 6) return toast.error("Max 6 beneficiaries");
    setBeneficiaries([...beneficiaries, { id: Date.now(), name: `Beneficiary ${beneficiaries.length + 1}`, otherIncome: 0, pct: 0 }]);
  };
  const removeBeneficiary = (id) => setBeneficiaries(beneficiaries.filter((b) => b.id !== id));
  const updateBeneficiary = (id, field, value) => setBeneficiaries(beneficiaries.map((b) => (b.id === id ? { ...b, [field]: value } : b)));

  const totalPct = beneficiaries.reduce((s, b) => s + Number(b.pct || 0), 0);
  const undistributedPct = Math.max(0, 100 - totalPct);
  const undistributedIncome = trustIncome * (undistributedPct / 100);

  const calc = useMemo(() => {
    const rows = beneficiaries.map((b) => {
      const distribution = trustIncome * (b.pct / 100);
      const otherIncome = Number(b.otherIncome || 0);
      const taxBefore = calcIndividualTax(otherIncome);
      const taxAfter = calcIndividualTax(otherIncome + distribution);
      const taxOnDistribution = taxAfter - taxBefore;
      const medicare = distribution > 0 ? distribution * 0.02 : 0;
      return {
        ...b,
        distribution,
        otherIncome,
        taxOnDistribution,
        medicare,
        totalTax: taxOnDistribution + medicare,
        marginalOnDist: distribution > 0 ? (taxOnDistribution / distribution) * 100 : 0,
      };
    });
    const beneficiaryTax = rows.reduce((s, r) => s + r.totalTax, 0);
    const trusteeTax = undistributedIncome * TRUSTEE_TAX_RATE;
    const totalTax = beneficiaryTax + trusteeTax;
    const effectiveRate = trustIncome > 0 ? (totalTax / trustIncome) * 100 : 0;
    // Alternative: fully retain (worst case)
    const worstCase = trustIncome * TRUSTEE_TAX_RATE;
    const savings = worstCase - totalTax;
    return { rows, beneficiaryTax, trusteeTax, totalTax, effectiveRate, worstCase, savings };
  }, [beneficiaries, trustIncome, undistributedIncome]);

  const overAllocated = totalPct > 100;

  return (
    <div className="space-y-6" data-testid="trust-tax-panel">
      {/* Summary */}
      <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3754] text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Landmark className="h-5 w-5 text-[#D4A84C]" />
            <span className="text-xs uppercase tracking-[0.15em] text-white/60">Discretionary Trust · 2024-25</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-white/60">Trust Income</p><p className="text-2xl font-bold">{fmt(trustIncome)}</p></div>
            <div><p className="text-xs text-white/60">Beneficiary Tax</p><p className="text-2xl font-bold">{fmt(calc.beneficiaryTax)}</p></div>
            <div><p className="text-xs text-white/60">Trustee Tax (s99A)</p><p className="text-2xl font-bold text-rose-300">{fmt(calc.trusteeTax)}</p></div>
            <div><p className="text-xs text-white/60">Total Tax</p><p className="text-2xl font-bold text-[#D4A84C]">{fmt(calc.totalTax)}</p><p className="text-[10px] text-white/50">{calc.effectiveRate.toFixed(1)}% effective</p></div>
          </div>
          {calc.savings > 0 && (
            <div className="mt-4 p-3 bg-emerald-500/20 rounded text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Saving <strong>{fmt(calc.savings)}</strong> vs fully retaining income (which would be taxed at 45% via s99A).</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trust income input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><DollarSignIcon /> Trust Net Income</CardTitle>
          <CardDescription>Enter the trust's net income for the financial year (after deductions)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trust-income" className="text-xs">Net income</Label>
              <Input id="trust-income" type="number" value={trustIncome} onChange={(e) => setTrustIncome(Number(e.target.value) || 0)} data-testid="trust-income-input" />
            </div>
            <div className="flex items-end">
              <p className="text-xs text-muted-foreground flex items-start gap-1"><Info className="h-3 w-3 mt-0.5" /> Capital gains flow through to beneficiaries; 50% CGT discount is preserved when streamed correctly per s115-227.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beneficiary distribution */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Distribution Strategy</CardTitle>
            <CardDescription>Allocate % of trust income to each beneficiary. Undistributed income taxed at 45% to trustee (s99A).</CardDescription>
          </div>
          <Button size="sm" onClick={addBeneficiary} className="bg-[#1a2744]" data-testid="add-beneficiary-btn"><Plus className="h-3 w-3 mr-1" /> Add Beneficiary</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {beneficiaries.map((b, idx) => {
            const row = calc.rows[idx];
            return (
              <div key={b.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg" data-testid={`beneficiary-row-${b.id}`}>
                <div className="col-span-3"><Label className="text-xs">Name</Label><Input value={b.name} onChange={(e) => updateBeneficiary(b.id, "name", e.target.value)} className="h-8 text-sm" /></div>
                <div className="col-span-3"><Label className="text-xs">Other income</Label><Input type="number" value={b.otherIncome} onChange={(e) => updateBeneficiary(b.id, "otherIncome", Number(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div className="col-span-2"><Label className="text-xs">Allocation %</Label><Input type="number" min="0" max="100" value={b.pct} onChange={(e) => updateBeneficiary(b.id, "pct", Number(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div className="col-span-3">
                  <p className="text-[10px] text-muted-foreground">Distribution · Tax</p>
                  <p className="text-sm font-semibold">{fmt(row.distribution)} <span className="text-rose-600">· {fmt(row.totalTax)}</span></p>
                  <p className="text-[10px] text-muted-foreground">Marginal on dist: {row.marginalOnDist.toFixed(1)}%</p>
                </div>
                <div className="col-span-1 text-right">
                  {beneficiaries.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeBeneficiary(b.id)} className="h-8 w-8 p-0"><Trash2 className="h-3 w-3 text-rose-600" /></Button>}
                </div>
              </div>
            );
          })}

          <div className={`p-3 rounded-lg flex items-center gap-2 ${overAllocated ? "bg-rose-50 border border-rose-200" : undistributedPct > 0 ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"}`}>
            {overAllocated ? <AlertTriangle className="h-4 w-4 text-rose-600" /> : undistributedPct > 0 ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <Info className="h-4 w-4 text-emerald-600" />}
            <p className="text-sm">
              <strong>{totalPct}%</strong> distributed · <strong>{undistributedPct}%</strong> retained ({fmt(undistributedIncome)} taxed at 45% trustee rate = <strong>{fmt(calc.trusteeTax)}</strong>)
              {overAllocated && <span className="text-rose-700"> — over-allocated, trim beneficiaries</span>}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// local stub since we don't import another DollarSign
const DollarSignIcon = () => <span className="h-4 w-4 inline-block text-[#D4A84C]">$</span>;

export default TrustTaxPanel;
