import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  ExternalLink,
  Info,
  DollarSign,
  Percent,
  Building2,
  TrendingUp,
  Scale,
  PiggyBank,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";

const ATOReference = ({ title, url, description }) => (
  <a 
    href={url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="flex items-start gap-3 p-3 rounded-lg border hover:border-[#0F392B] hover:bg-[#0F392B]/5 transition-colors"
  >
    <ExternalLink className="h-4 w-4 text-[#0F392B] mt-1 flex-shrink-0" />
    <div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  </a>
);

const FormulaCard = ({ title, formula, explanation, atoRef }) => (
  <Card className="border-l-4 border-l-[#0F392B]">
    <CardContent className="p-4">
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-3">
        {formula}
      </div>
      <p className="text-sm text-muted-foreground">{explanation}</p>
      {atoRef && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-1">ATO Reference:</p>
          <a href={atoRef.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0F392B] hover:underline flex items-center gap-1">
            {atoRef.title} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </CardContent>
  </Card>
);

const CalculationMethodology = () => {
  return (
    <Layout>
      <div className="space-y-8" data-testid="calculation-methodology-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
            Calculation Methodology
          </h1>
          <p className="text-muted-foreground mt-1">
            Detailed explanations of all calculations with ATO/ASIC references
          </p>
        </div>

        {/* Compliance Notice */}
        <Card className="bg-[#0F392B] text-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Scale className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Regulatory Compliance</h3>
                <p className="text-white/80 mt-1 text-sm">
                  All calculations in this application are based on current Australian Tax Office (ATO) 
                  and Australian Securities and Investments Commission (ASIC) guidelines. Tax rates and 
                  thresholds are updated for the 2024-25 financial year (Stage 3 tax cuts applied).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="income-tax">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="income-tax">Income Tax</TabsTrigger>
            <TabsTrigger value="cgt">CGT</TabsTrigger>
            <TabsTrigger value="franking">Franking</TabsTrigger>
            <TabsTrigger value="super">Super</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
          </TabsList>

          {/* Income Tax */}
          <TabsContent value="income-tax" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#0F392B]" />
                  Personal Income Tax 2024-25
                </CardTitle>
                <CardDescription>
                  Stage 3 tax cuts effective from 1 July 2024
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tax Brackets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Taxable Income</th>
                        <th className="text-left p-3">Tax on this income</th>
                        <th className="text-left p-3">Effective Rate (on max)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">$0 – $18,200</td>
                        <td className="p-3">Nil</td>
                        <td className="p-3">0%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">$18,201 – $45,000</td>
                        <td className="p-3">16c for each $1 over $18,200</td>
                        <td className="p-3">9.5%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">$45,001 – $135,000</td>
                        <td className="p-3">$4,288 plus 30c for each $1 over $45,000</td>
                        <td className="p-3">23.0%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">$135,001 – $190,000</td>
                        <td className="p-3">$31,288 plus 37c for each $1 over $135,000</td>
                        <td className="p-3">27.0%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">$190,001 and over</td>
                        <td className="p-3">$51,638 plus 45c for each $1 over $190,000</td>
                        <td className="p-3">45%+ (marginal)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Formulas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormulaCard
                    title="Income Tax Calculation"
                    formula="Tax = Σ (Income in bracket × Bracket rate)"
                    explanation="Tax is calculated progressively. Each portion of income is taxed at its respective bracket rate, not the total at the highest rate."
                    atoRef={{
                      title: "Individual income tax rates",
                      url: "https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents"
                    }}
                  />
                  <FormulaCard
                    title="Medicare Levy"
                    formula="Medicare Levy = Taxable Income × 2%"
                    explanation="The Medicare levy is 2% of taxable income. Reductions apply for low-income earners below the threshold ($26,000 single, $43,846 family)."
                    atoRef={{
                      title: "Medicare levy",
                      url: "https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy"
                    }}
                  />
                  <FormulaCard
                    title="Effective Tax Rate"
                    formula="Effective Rate = (Total Tax / Taxable Income) × 100"
                    explanation="The effective rate shows your actual tax burden as a percentage of total income, which is always lower than your marginal rate."
                  />
                </div>

                {/* ATO References */}
                <div className="space-y-2">
                  <h4 className="font-semibold">ATO References</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <ATOReference
                      title="Tax rates – Australian residents"
                      url="https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents"
                      description="Official 2024-25 tax rates for Australian residents"
                    />
                    <ATOReference
                      title="Low income tax offset (LITO)"
                      url="https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-income-tax-offset"
                      description="Up to $700 offset for incomes below $66,667"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CGT */}
          <TabsContent value="cgt" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                  Capital Gains Tax (CGT)
                </CardTitle>
                <CardDescription>
                  CGT events, discounts, and calculation methodology
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CGT Discount Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Entity Type</th>
                        <th className="text-left p-3">CGT Discount</th>
                        <th className="text-left p-3">Holding Period Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Individual</td>
                        <td className="p-3 font-semibold text-[#10B981]">50%</td>
                        <td className="p-3">12+ months</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">SMSF (complying)</td>
                        <td className="p-3 font-semibold text-[#10B981]">33.33%</td>
                        <td className="p-3">12+ months</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Company</td>
                        <td className="p-3 text-muted-foreground">No discount</td>
                        <td className="p-3">N/A</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Trust (distributed to individuals)</td>
                        <td className="p-3 font-semibold text-[#10B981]">50%</td>
                        <td className="p-3">12+ months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Formulas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormulaCard
                    title="Capital Gain Calculation"
                    formula="Capital Gain = Sale Price - Cost Base"
                    explanation="Cost base includes: purchase price, stamp duty, legal fees, and any capital improvements."
                    atoRef={{
                      title: "CGT assets and cost base",
                      url: "https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/cgt-assets-and-exemptions"
                    }}
                  />
                  <FormulaCard
                    title="Discounted Capital Gain"
                    formula="Discounted Gain = Capital Gain × (1 - Discount Rate)"
                    explanation="For assets held 12+ months, individuals apply 50% discount before adding to assessable income."
                    atoRef={{
                      title: "CGT discount",
                      url: "https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/cgt-discount"
                    }}
                  />
                  <FormulaCard
                    title="Net Capital Gain"
                    formula="Net CG = Gains - Losses - Carried Losses"
                    explanation="Capital losses offset gains. Unused losses carry forward indefinitely (no time limit)."
                    atoRef={{
                      title: "Capital losses",
                      url: "https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/capital-losses"
                    }}
                  />
                  <FormulaCard
                    title="CGT Tax Payable"
                    formula="CGT Tax = Net CG × Marginal Tax Rate"
                    explanation="Net capital gain is added to your assessable income and taxed at your marginal rate."
                  />
                </div>

                {/* ATO References */}
                <div className="space-y-2">
                  <h4 className="font-semibold">ATO References</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <ATOReference
                      title="Guide to capital gains tax"
                      url="https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax"
                      description="Comprehensive CGT guide from the ATO"
                    />
                    <ATOReference
                      title="Main residence exemption"
                      url="https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/property-and-capital-gains-tax/your-main-residence-home"
                      description="CGT exemption for your primary residence"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Franking Credits */}
          <TabsContent value="franking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-[#D4AF37]" />
                  Franking Credits (Imputation)
                </CardTitle>
                <CardDescription>
                  Australian dividend imputation system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Franking Rate Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Company Type</th>
                        <th className="text-left p-3">Company Tax Rate</th>
                        <th className="text-left p-3">Maximum Franking Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Base rate entity</td>
                        <td className="p-3">25%</td>
                        <td className="p-3">25%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Full rate company</td>
                        <td className="p-3">30%</td>
                        <td className="p-3">30%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Formulas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormulaCard
                    title="Franking Credit Calculation"
                    formula="Franking Credit = Dividend × (Tax Rate / (1 - Tax Rate)) × Franking %"
                    explanation="For a 25% company rate, the formula simplifies to: Dividend × 0.3333 × Franking%"
                    atoRef={{
                      title: "Franking credits",
                      url: "https://www.ato.gov.au/individuals-and-families/investments-and-assets/in-detail/investing-in-shares/dividends-and-shares/receiving-dividends"
                    }}
                  />
                  <FormulaCard
                    title="Grossed-up Dividend"
                    formula="Grossed-up Dividend = Cash Dividend + Franking Credit"
                    explanation="You include the grossed-up amount in your assessable income, then receive a tax offset for the franking credit."
                  />
                  <FormulaCard
                    title="Franking Credit Refund"
                    formula="Refund = Franking Credits - Tax Payable"
                    explanation="If franking credits exceed tax liability, the excess is refunded (for individuals, super funds, and some charities)."
                    atoRef={{
                      title: "Excess franking credits",
                      url: "https://www.ato.gov.au/individuals-and-families/investments-and-assets/in-detail/investing-in-shares/dividends-and-shares/franking-credit-refunds"
                    }}
                  />
                </div>

                {/* Example */}
                <Card className="bg-[#D4AF37]/10 border-[#D4AF37]">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Example Calculation</h4>
                    <div className="text-sm space-y-1">
                      <p>Cash dividend received: $700</p>
                      <p>Franking percentage: 100%</p>
                      <p>Company tax rate: 30%</p>
                      <p>Franking credit: $700 × (30/70) = $300</p>
                      <p>Grossed-up dividend: $700 + $300 = $1,000</p>
                      <p className="font-medium mt-2">You report $1,000 income and receive $300 tax offset</p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Superannuation */}
          <TabsContent value="super" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-[#10B981]" />
                  Superannuation
                </CardTitle>
                <CardDescription>
                  Contribution caps, tax rates, and Division 293
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Caps Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Contribution Type</th>
                        <th className="text-left p-3">Cap (2024-25)</th>
                        <th className="text-left p-3">Tax Treatment</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Concessional (before tax)</td>
                        <td className="p-3 font-semibold">$30,000</td>
                        <td className="p-3">15% tax in fund</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Non-concessional (after tax)</td>
                        <td className="p-3 font-semibold">$120,000</td>
                        <td className="p-3">No tax (already taxed)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Bring-forward (non-concessional)</td>
                        <td className="p-3 font-semibold">$360,000</td>
                        <td className="p-3">Over 3 years if &lt;75 and TSB &lt;$1.9M</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Formulas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormulaCard
                    title="SG Contribution (2024-25)"
                    formula="SG = Ordinary Time Earnings × 11.5%"
                    explanation="Employers must contribute 11.5% of OTE for eligible employees. Rate increases to 12% from July 2025."
                    atoRef={{
                      title: "Super guarantee rate",
                      url: "https://www.ato.gov.au/tax-rates-and-codes/super-guarantee-percentage"
                    }}
                  />
                  <FormulaCard
                    title="Division 293 Tax"
                    formula="Div 293 = Concessional Contributions × 15%"
                    explanation="Additional 15% tax on concessional contributions if income + contributions exceed $250,000."
                    atoRef={{
                      title: "Division 293 tax",
                      url: "https://www.ato.gov.au/individuals-and-families/super/growing-and-keeping-track-of-your-super/caps-limits-and-tax-on-super-contributions/division-293-tax-information-for-individuals"
                    }}
                  />
                  <FormulaCard
                    title="Tax Savings from Salary Sacrifice"
                    formula="Savings = Amount × (Marginal Rate - 15%)"
                    explanation="Salary sacrifice converts income taxed at your marginal rate to 15% super tax."
                  />
                  <FormulaCard
                    title="Carry-forward Contributions"
                    formula="Available = Unused caps from last 5 years"
                    explanation="If TSB &lt;$500k, you can use unused concessional cap from previous 5 years."
                    atoRef={{
                      title: "Carry-forward contributions",
                      url: "https://www.ato.gov.au/individuals-and-families/super/growing-and-keeping-track-of-your-super/caps-limits-and-tax-on-super-contributions/concessional-contributions-cap"
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Property */}
          <TabsContent value="property" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#3B82F6]" />
                  Property Investment
                </CardTitle>
                <CardDescription>
                  Negative gearing, depreciation, and rental deductions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Depreciation Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Depreciation Type</th>
                        <th className="text-left p-3">Rate</th>
                        <th className="text-left p-3">Requirements</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Capital works (Div 43)</td>
                        <td className="p-3">2.5% per year</td>
                        <td className="p-3">Buildings constructed after 15 Sep 1987</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Plant & equipment (Div 40)</td>
                        <td className="p-3">Varies by item</td>
                        <td className="p-3">Only for new items if purchased after 9 May 2017*</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">*Second-hand plant & equipment depreciation restrictions apply to residential property from 9 May 2017</p>

                {/* Formulas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormulaCard
                    title="Net Rental Income"
                    formula="Net Rental = Gross Rent - Deductible Expenses"
                    explanation="Deductible expenses include: interest, rates, insurance, repairs, property management, depreciation."
                    atoRef={{
                      title: "Rental expenses you can claim",
                      url: "https://www.ato.gov.au/individuals-and-families/investments-and-assets/residential-rental-properties/rental-expenses-you-can-claim"
                    }}
                  />
                  <FormulaCard
                    title="Negative Gearing Benefit"
                    formula="Tax Benefit = Loss × Marginal Tax Rate"
                    explanation="Rental losses offset other income, reducing overall tax. Higher marginal rate = higher benefit."
                  />
                  <FormulaCard
                    title="Gross Rental Yield"
                    formula="Yield = (Annual Rent / Property Value) × 100"
                    explanation="Basic measure of rental return before expenses."
                  />
                  <FormulaCard
                    title="Net Rental Yield"
                    formula="Net Yield = (Net Rent / Property Value) × 100"
                    explanation="True rental return after all expenses. More accurate for investment decisions."
                  />
                </div>

                {/* ATO References */}
                <div className="space-y-2">
                  <h4 className="font-semibold">ATO References</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <ATOReference
                      title="Rental property guide"
                      url="https://www.ato.gov.au/individuals-and-families/investments-and-assets/residential-rental-properties"
                      description="Complete guide to rental property tax"
                    />
                    <ATOReference
                      title="Deductions for decline in value"
                      url="https://www.ato.gov.au/individuals-and-families/investments-and-assets/residential-rental-properties/rental-expenses-you-can-claim/decline-in-value-of-depreciating-assets"
                      description="Depreciation rules for rental properties"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tax */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#0F392B]" />
                  Company Tax
                </CardTitle>
                <CardDescription>
                  Company tax rates, base rate entities, and Division 7A
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Tax Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Company Type</th>
                        <th className="text-left p-3">Tax Rate</th>
                        <th className="text-left p-3">Eligibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Base rate entity</td>
                        <td className="p-3 font-semibold text-[#10B981]">25%</td>
                        <td className="p-3">Turnover &lt;$50M and ≤80% passive income</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Full rate company</td>
                        <td className="p-3 font-semibold">30%</td>
                        <td className="p-3">All other companies</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Formulas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormulaCard
                    title="Company Tax Calculation"
                    formula="Company Tax = Taxable Income × Tax Rate"
                    explanation="Company tax is a flat rate on all taxable income (no progressive brackets)."
                    atoRef={{
                      title: "Company tax rates",
                      url: "https://www.ato.gov.au/tax-rates-and-codes/company-tax-rates"
                    }}
                  />
                  <FormulaCard
                    title="Franking Account"
                    formula="Franking Acc = Tax Paid - Franking Credits Distributed"
                    explanation="Companies maintain a franking account tracking tax paid vs credits attached to dividends."
                  />
                  <FormulaCard
                    title="Division 7A Loan Minimum Repayment"
                    formula="Repayment = Principal × Amortization Rate"
                    explanation="Private company loans to shareholders must comply with minimum repayments or be deemed dividends."
                    atoRef={{
                      title: "Division 7A",
                      url: "https://www.ato.gov.au/businesses-and-organisations/corporate-tax-measures-and-டிivision-7a"
                    }}
                  />
                  <FormulaCard
                    title="Benchmark Interest Rate (2024-25)"
                    formula="Interest = Loan Balance × 8.77%"
                    explanation="Division 7A compliant loans must charge at least the ATO benchmark interest rate."
                    atoRef={{
                      title: "Division 7A benchmark rate",
                      url: "https://www.ato.gov.au/tax-rates-and-codes/division-7a-benchmark-interest-rate"
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Important Disclaimer
            </h3>
            <p className="text-sm text-muted-foreground">
              This application provides general information only and does not constitute financial, tax, 
              or legal advice. While calculations are based on current ATO and ASIC guidelines, tax laws 
              change frequently. Always consult a qualified tax professional or financial advisor for 
              advice specific to your circumstances. The developers accept no liability for decisions 
              made based on this information.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CalculationMethodology;
