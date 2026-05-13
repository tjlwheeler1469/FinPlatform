// BudgetReforms2027 — "What changes for you" calculator under the
// 2026–27 Federal Budget Negative Gearing + CGT + Trust reforms (announced
// 12 May 2026, effective 1 July 2027 for property, 1 July 2028 for trusts).
//
// Pulls every input from the global scenario store (lib/scenarioStore) so any
// number edited here flows to Retirement Workshop / Tax tab / SOA builder and
// vice-versa.
import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, AlertTriangle, CheckCircle2, Home, Landmark, ShieldCheck, FileText, Info } from "lucide-react";
import { useScenario, useScenarioUpdater } from "@/lib/scenarioStore";
import { clampInput, fmtCurrencyCompact, fmtCurrencyFull } from "@/lib/inputBounds";
import {
  calculateCGT, negativeGearingStatus, applyRentalLossDeduction, calculateTrustMinimumTax,
  ANNOUNCEMENT_DATE, NG_REFORM_DATE, TRUST_REFORM_DATE,
} from "@/lib/auTax";

const F = fmtCurrencyFull;

const PropertyImpactCard = ({ scenario }) => {
  const purchaseDate = new Date(scenario.propertyPurchaseDate);
  const ngStatus = negativeGearingStatus({
    purchaseDate, propertyType: scenario.propertyType, refDate: new Date("2027-07-01"),
  });

  // CGT what-if: sell today vs 1 July 2027 vs 5 years post-reform
  const todayCgt = calculateCGT({
    income: scenario.monthlyIncome * 12,
    costBase: scenario.propertyCostBase,
    saleProceeds: scenario.propertyValue,
    purchaseDate, saleDate: new Date(),
    propertyType: scenario.propertyType,
    cumulativeCpi: scenario.cumulativeCpi,
    isMeansTested: scenario.isMeansTested,
  });
  const reform5yCgt = calculateCGT({
    income: scenario.monthlyIncome * 12,
    costBase: scenario.propertyCostBase,
    saleProceeds: scenario.propertyValue * 1.25, // assume 25% growth over 5y
    purchaseDate, saleDate: new Date("2032-07-01"),
    propertyType: scenario.propertyType,
    cumulativeCpi: (scenario.cumulativeCpi || 1) * 1.12, // ~12% additional CPI over 5y
    isMeansTested: scenario.isMeansTested,
  });

  // Rental loss this FY
  const annualRent = scenario.propertyRentalIncome || 0;
  const annualExpenses = scenario.propertyExpenses || 0;
  const rentalLoss = Math.max(0, annualExpenses - annualRent);
  const lossDeduction = applyRentalLossDeduction({
    rentalLoss, otherResidentialIncome: 0, status: ngStatus,
  });

  return (
    <Card className="border-l-4 border-[#1a2744]" data-testid="property-impact-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Home className="h-5 w-5 text-[#D4A84C]" /> Property impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* NG status pill */}
        <div className={`p-3 rounded border ${ngStatus.canNegativelyGear ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
          <div className="flex items-center gap-2 mb-1">
            {ngStatus.canNegativelyGear
              ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              : <AlertTriangle className="h-4 w-4 text-rose-600" />}
            <p className="text-sm font-semibold text-[#1a2744]">Negative gearing — {ngStatus.status.replace(/_/g, " ")}</p>
          </div>
          <p className="text-xs text-gray-700">{ngStatus.rationale}</p>
          {rentalLoss > 0 && (
            <p className="text-xs mt-2 text-gray-700">
              Rental loss this FY: <strong>{F(rentalLoss)}</strong> · against wages: <strong>{F(lossDeduction.appliedAgainstWages)}</strong> · carried forward: <strong>{F(lossDeduction.carriedForward)}</strong>
            </p>
          )}
        </div>

        {/* CGT comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border rounded p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">If sold today</p>
            <p className="text-lg font-bold text-[#1a2744]">{F(todayCgt.cgtPayable)}</p>
            <p className="text-[10px] text-muted-foreground">CGT payable · {todayCgt.regime}</p>
          </div>
          <div className="border rounded p-3 bg-amber-50 border-amber-200">
            <p className="text-[10px] uppercase tracking-wide text-amber-700">If sold +5y post-reform</p>
            <p className="text-lg font-bold text-[#1a2744]">{F(reform5yCgt.cgtPayable)}</p>
            <p className="text-[10px] text-amber-700">{reform5yCgt.regime}</p>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground border-t pt-3 leading-5">
          <p><strong>Source:</strong> 2026–27 Federal Budget · Tax explainer — Negative Gearing and Capital Gains Tax Reform (announced 12 May 2026 19:30 AEST).</p>
        </div>
      </CardContent>
    </Card>
  );
};

const TrustImpactCard = ({ scenario }) => {
  if (!scenario.hasDiscretionaryTrust) return null;
  const r = calculateTrustMinimumTax({
    distributedIncome: scenario.trustDistributedIncome,
    isCorporateBeneficiary: scenario.trustIsCorporate,
    isTestamentaryExisting: scenario.trustIsTestamentaryExisting,
    frankingCreditsAvailable: scenario.trustFrankingCredits,
    refDate: new Date("2028-07-01"),
  });
  return (
    <Card className="border-l-4 border-[#D4A84C]" data-testid="trust-impact-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Landmark className="h-5 w-5 text-[#D4A84C]" /> Discretionary trust impact (from 1 Jul 2028)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="border rounded p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Distributed income</p>
            <p className="text-lg font-bold text-[#1a2744]">{F(scenario.trustDistributedIncome)}</p>
          </div>
          <div className="border rounded p-3 bg-rose-50">
            <p className="text-[10px] uppercase text-rose-700">30% min tax</p>
            <p className="text-lg font-bold text-rose-700">{F(r.minimumTax)}</p>
          </div>
          <div className="border rounded p-3 bg-emerald-50">
            <p className="text-[10px] uppercase text-emerald-700">Beneficiary credit</p>
            <p className="text-lg font-bold text-emerald-700">{F(r.beneficiaryCredit)}</p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-5">
          Regime: <strong>{r.regime}</strong>. Franking credits ({F(scenario.trustFrankingCredits)}) reduce net trustee tax to <strong>{F(r.netTrustTax)}</strong>.
        </p>
        <div className="text-[11px] text-muted-foreground border-t pt-3 leading-5">
          <p><strong>Source:</strong> 2026–27 Federal Budget · Tax explainer — Minimum tax on discretionary trusts (effective 1 July 2028).</p>
        </div>
      </CardContent>
    </Card>
  );
};

const Field = ({ label, children, hint }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <Label className="text-xs text-gray-700">{label}</Label>
      {hint && <Info className="h-3 w-3 text-gray-400" title={hint} />}
    </div>
    {children}
  </div>
);

const BudgetReforms2027 = () => {
  const scenario = useScenario();
  const update = useScenarioUpdater();

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto p-4 space-y-4" data-testid="budget-reforms-2027">
        <Card className="bg-gradient-to-r from-[#1a2744] to-[#2a3954] text-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#D4A84C]" />
              <div className="flex-1">
                <h1 className="text-xl font-bold">2026–27 Budget · Negative Gearing, CGT & Trust Reforms</h1>
                <p className="text-xs text-white/70">Announced 12 May 2026 19:30 AEST · Property reforms effective 1 July 2027 · Trust reforms effective 1 July 2028</p>
              </div>
              <Badge variant="outline" className="bg-white/10 border-white/30 text-white text-[10px]">LIVE ENGINE</Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="property" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="property" data-testid="tab-property"><Home className="h-3.5 w-3.5 mr-1.5" /> Property</TabsTrigger>
            <TabsTrigger value="trust" data-testid="tab-trust"><Landmark className="h-3.5 w-3.5 mr-1.5" /> Trust</TabsTrigger>
            <TabsTrigger value="summary" data-testid="tab-summary"><ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> What changed</TabsTrigger>
          </TabsList>

          <TabsContent value="property" className="space-y-4 pt-4">
            <Card>
              <CardContent className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Property type">
                  <Select value={scenario.propertyType} onValueChange={(v) => update({ propertyType: v })}>
                    <SelectTrigger data-testid="select-property-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New build (full NG retained)</SelectItem>
                      <SelectItem value="existing">Existing dwelling</SelectItem>
                      <SelectItem value="affordable">Affordable housing (60% CGT)</SelectItem>
                      <SelectItem value="non-property">Other (shares, business)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Purchase date" hint="Pre 12 May 2026 = grandfathered NG">
                  <Input type="date" value={scenario.propertyPurchaseDate} onChange={(e) => update({ propertyPurchaseDate: e.target.value })} data-testid="input-purchase-date" />
                </Field>
                <Field label="Means-tested?" hint="Age Pension / JobSeeker recipients exempt from 30% min tax">
                  <div className="h-10 flex items-center">
                    <Switch checked={scenario.isMeansTested} onCheckedChange={(v) => update({ isMeansTested: v })} data-testid="switch-means-tested" />
                  </div>
                </Field>
                <Field label="Cost base ($)">
                  <Input type="number" min="0" max="100000000" value={scenario.propertyCostBase} onChange={(e) => update({ propertyCostBase: clampInput(e.target.value, "currentPortfolio") })} data-testid="input-cost-base" />
                </Field>
                <Field label="Current value ($)">
                  <Input type="number" min="0" max="100000000" value={scenario.propertyValue} onChange={(e) => update({ propertyValue: clampInput(e.target.value, "currentPortfolio") })} data-testid="input-property-value" />
                </Field>
                <Field label="Cumulative CPI multiplier" hint="e.g. 1.20 = 20% inflation since purchase">
                  <Input type="number" step="0.01" min="1" max="10" value={scenario.cumulativeCpi} onChange={(e) => update({ cumulativeCpi: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })} data-testid="input-cpi" />
                </Field>
                <Field label="Annual rental income ($)">
                  <Input type="number" min="0" max="5000000" value={scenario.propertyRentalIncome} onChange={(e) => update({ propertyRentalIncome: clampInput(e.target.value, "annualContributions") })} data-testid="input-rental-income" />
                </Field>
                <Field label="Annual rental expenses ($)">
                  <Input type="number" min="0" max="5000000" value={scenario.propertyExpenses} onChange={(e) => update({ propertyExpenses: clampInput(e.target.value, "annualContributions") })} data-testid="input-rental-expenses" />
                </Field>
              </CardContent>
            </Card>
            <PropertyImpactCard scenario={scenario} />
          </TabsContent>

          <TabsContent value="trust" className="space-y-4 pt-4">
            <Card>
              <CardContent className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Has discretionary trust">
                  <div className="h-10 flex items-center">
                    <Switch checked={scenario.hasDiscretionaryTrust} onCheckedChange={(v) => update({ hasDiscretionaryTrust: v })} data-testid="switch-has-trust" />
                  </div>
                </Field>
                <Field label="Distributed income ($)">
                  <Input type="number" min="0" max="5000000" disabled={!scenario.hasDiscretionaryTrust} value={scenario.trustDistributedIncome} onChange={(e) => update({ trustDistributedIncome: clampInput(e.target.value, "annualContributions") })} data-testid="input-trust-income" />
                </Field>
                <Field label="Franking credits ($)">
                  <Input type="number" min="0" max="5000000" disabled={!scenario.hasDiscretionaryTrust} value={scenario.trustFrankingCredits} onChange={(e) => update({ trustFrankingCredits: clampInput(e.target.value, "annualContributions") })} data-testid="input-trust-franking" />
                </Field>
                <Field label="Corporate beneficiary?" hint="Corporates get NO refund of trustee tax">
                  <div className="h-10 flex items-center">
                    <Switch checked={scenario.trustIsCorporate} onCheckedChange={(v) => update({ trustIsCorporate: v })} disabled={!scenario.hasDiscretionaryTrust} data-testid="switch-trust-corporate" />
                  </div>
                </Field>
                <Field label="Testamentary trust (existing at announcement)" hint="Excluded from min tax">
                  <div className="h-10 flex items-center">
                    <Switch checked={scenario.trustIsTestamentaryExisting} onCheckedChange={(v) => update({ trustIsTestamentaryExisting: v })} disabled={!scenario.hasDiscretionaryTrust} data-testid="switch-trust-testamentary" />
                  </div>
                </Field>
              </CardContent>
            </Card>
            <TrustImpactCard scenario={scenario} />
          </TabsContent>

          <TabsContent value="summary" className="pt-4">
            <Card><CardContent className="p-6 space-y-5 text-[13px] leading-7" style={{ fontFamily: "Georgia, serif" }}>
              <SummaryItem
                title="50% CGT discount → replaced by indexation + 30% minimum tax"
                effective="Sales settling on/after 1 July 2027"
                detail="Investors pay tax on the real (inflation-adjusted) gain at marginal rates, with a 30% floor. Means-tested income-support recipients are exempt from the 30% floor. Main residence remains exempt; affordable housing keeps the 60% discount; small-business CGT concessions unchanged; pre-1985 gains accrued before 1 July 2027 stay exempt." />
              <SummaryItem
                title="New builds — investor election"
                effective="Sales settling on/after 1 July 2027"
                detail="For new builds, the investor can ELECT either the existing 50% discount OR the new indexation + 30% min tax — whichever delivers the better outcome at sale. Full negative gearing is also retained on new builds." />
              <SummaryItem
                title="Negative gearing — quarantined for existing dwellings"
                effective="1 July 2027 (with grandfathering)"
                detail="Properties HELD at 12 May 2026 19:30 AEST: grandfathered forever (until sold). Purchased between announcement and 30 June 2027: NG allowed until 30 June 2027 only. Purchased on/after 1 July 2027: NO negative gearing — losses quarantined to other residential property income (including residential capital gains)." />
              <SummaryItem
                title="Transitional CGT for assets straddling the cut-over"
                effective="Acquired before 1 July 2027, sold after"
                detail="50% discount applies to gains accrued up to 30 June 2027. Indexation + 30% min tax applies to gains from 1 July 2027 onward. Asset's value at 1 July 2027 is determined by the taxpayer at sale (valuation or apportionment formula)." />
              <SummaryItem
                title="30% minimum tax on discretionary trust distributions"
                effective="1 July 2028"
                detail="A 30% minimum tax payable by the trustee on distributed income. Non-corporate beneficiaries receive a non-refundable credit; corporate beneficiaries do NOT (prevents conversion to refundable franking credits). Trustees must use their franking credits first. Testamentary trusts existing at announcement are excluded. 3-year rollover relief (from 1 July 2027) to assist restructuring out of discretionary trusts." />
              <SummaryItem
                title="Working Australians Tax Offset (WATO)"
                effective="1 July 2027"
                detail="Up to $250 annual offset for working Australians. Effective tax-free threshold rises to $19,985 (or $24,985 with LITO). Applied automatically by the engine after 1 July 2027." />
              <p className="text-[10px] text-muted-foreground italic pt-3 border-t">
                Engine source: <code>/app/frontend/src/lib/auTax.js</code> · 26/26 unit tests passing · Verbatim policy text on file at <code>/app/memory/CHANGELOG.md</code>.
              </p>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const SummaryItem = ({ title, effective, detail }) => (
  <div>
    <div className="flex items-baseline gap-2 mb-1">
      <ArrowRight className="h-3.5 w-3.5 text-[#D4A84C] flex-shrink-0" />
      <p className="font-bold text-[#1a2744]">{title}</p>
    </div>
    <p className="text-[11px] text-amber-700 uppercase tracking-wide ml-5 mb-1">{effective}</p>
    <p className="text-gray-700 ml-5">{detail}</p>
  </div>
);

export default BudgetReforms2027;
