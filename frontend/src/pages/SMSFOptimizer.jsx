import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Landmark,
  Calculator,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Inline number-input field used across the "Your Details" form.
const NumberField = ({ label, value, onChange, testid, prefix, suffix, step = 1 }) => (
  <div className="space-y-1">
    <Label className="text-[11px] text-muted-foreground">{label}</Label>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{prefix}</span>}
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-9 text-sm ${prefix ? "pl-6" : ""} ${suffix ? "pr-12" : ""}`}
        data-testid={testid}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{suffix}</span>}
    </div>
  </div>
);

const SMSFOptimizer = ({ embedded = false }) => {
  const [age, setAge] = useState(45);
  const [superBalance, setSuperBalance] = useState(350000);
  const [taxableIncome, setTaxableIncome] = useState(150000);
  const [employerContribution, setEmployerContribution] = useState(15000);
  const [salarySacrifice, setSalarySacrifice] = useState(5000);
  const [personalContribution, setPersonalContribution] = useState(0);
  const [spouseContribution, setSpouseContribution] = useState(0);
  const [nonConcessional, setNonConcessional] = useState(0);
  const [expectedReturn, setExpectedReturn] = useState(7.0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateStrategy = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/smsf`, null, {
        params: {
          age,
          current_super_balance: superBalance,
          taxable_income: taxableIncome,
          employer_contribution: employerContribution,
          salary_sacrifice: salarySacrifice,
          personal_contribution: personalContribution,
          spouse_contribution: spouseContribution,
          non_concessional_contribution: nonConcessional,
          expected_return: expectedReturn,
        }
      });
      setResult(response.data);
      toast.success("Calculated");
    } catch (error) {
      console.error("Error calculating SMSF strategy:", error);
      toast.error("Failed to calculate");
    } finally {
      setLoading(false);
    }
  };

  // Generate projection chart data
  const generateProjectionData = () => {
    if (!result?.projections) return [];

    const data = [];
    let balance = superBalance;
    const totalConcessional = result.current_contributions?.total_concessional || 0;
    const totalNonConcessional = result.current_contributions?.total_non_concessional || 0;
    const netConcessional = totalConcessional * 0.85;
    const annualContribution = netConcessional + totalNonConcessional;
    const growthRate = expectedReturn / 100;
    const yearsToRetirement = result.projections?.years_to_retirement || 20;

    for (let year = 0; year <= yearsToRetirement; year++) {
      data.push({
        year: `Age ${age + year}`,
        balance: Math.round(balance)
      });
      balance = balance * (1 + growthRate) + annualContribution;
    }
    
    return data;
  };

  const projectionData = generateProjectionData();
  const concessionalCapUsed = result?.contributions?.total_concessional ? (result.contributions.total_concessional / 30000) * 100 : 0;

  const content = (
      <div className="space-y-6" data-testid="smsf-optimizer-page">
        {/* Header + 3 info cards rendered ONLY when standalone. Embedded mode
            (inside Contribution Calculator tab) skips them so the page flows
            as one cohesive calculator — per iter 213 user feedback. */}
        {!embedded && (
          <>
            <div>
              <h1 className="text-3xl font-bold text-foreground">SMSF Contribution Optimizer</h1>
              <p className="text-muted-foreground mt-1">Maximize your superannuation tax benefits and retirement savings</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="concessional-info"><CardHeader><CardTitle className="text-lg ">Concessional Cap</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-[#1a2744] mb-2">$30,000</div><p className="text-sm text-muted-foreground">Annual limit for pre-tax contributions including employer super, salary sacrifice, and personal deductible contributions. Taxed at 15%.</p></CardContent></Card>
              <Card data-testid="nonconcessional-info"><CardHeader><CardTitle className="text-lg ">Non-Concessional Cap</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-[#D4A84C] mb-2">$120,000</div><p className="text-sm text-muted-foreground">Annual limit for after-tax contributions. Can bring forward up to 3 years ($360,000) if under 75 and TSB under $1.9M.</p></CardContent></Card>
              <Card data-testid="div293-info"><CardHeader><CardTitle className="text-lg ">Division 293</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-destructive mb-2">$250,000</div><p className="text-sm text-muted-foreground">If income + super contributions exceed $250,000, an additional 15% tax applies to some concessional contributions.</p></CardContent></Card>
            </div>
          </>
        )}

        {/* Top: single full-width "Your Details" card with ALL inputs as manual
            number entries. Results section flows below at full width. */}
        <Card data-testid="smsf-inputs">
          <CardHeader className="pb-3">
            <CardTitle>Your Details</CardTitle>
            <CardDescription>Enter your current situation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumberField label="Current Age" value={age} onChange={setAge} testid="age-input" suffix="years" />
              <NumberField label="Taxable Income" value={taxableIncome} onChange={setTaxableIncome} testid="taxable-income-input" prefix="$" />
              <NumberField label="Current Super Balance" value={superBalance} onChange={setSuperBalance} testid="super-balance-input" prefix="$" />
              <NumberField label="Employer (SG)" value={employerContribution} onChange={setEmployerContribution} testid="employer-contribution-input" prefix="$" suffix="/yr" />
              <NumberField label="Salary Sacrifice" value={salarySacrifice} onChange={setSalarySacrifice} testid="salary-sacrifice-input" prefix="$" suffix="/yr" />
              <NumberField label="Personal Deductible" value={personalContribution} onChange={setPersonalContribution} testid="personal-contribution-input" prefix="$" suffix="/yr" />
              <NumberField label="Non-Concessional (post-tax)" value={nonConcessional} onChange={setNonConcessional} testid="non-concessional-input" prefix="$" suffix="/yr" />
              <NumberField label="Spouse Contribution" value={spouseContribution} onChange={setSpouseContribution} testid="spouse-contribution-input" prefix="$" suffix="/yr" />
              <NumberField label="Expected Return" value={expectedReturn} onChange={setExpectedReturn} testid="expected-return-input" suffix="%" step={0.1} />
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-[11px] text-muted-foreground">
                Total concessional: <strong>{formatCurrency(employerContribution + salarySacrifice + personalContribution)}</strong> / $30,000 cap
                {nonConcessional + spouseContribution > 0 && (
                  <> · Non-concessional: <strong>{formatCurrency(nonConcessional + spouseContribution)}</strong> / $120,000 cap</>
                )}
              </p>
              <Button
                onClick={calculateStrategy}
                className="bg-[#1a2744] hover:bg-[#1a2744]/90"
                disabled={loading}
                data-testid="calculate-smsf-btn"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {loading ? "Calculating…" : "Calculate"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result ? (
            <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Tax Saved</p>
                      <p className="text-xl font-bold text-[#10B981]">
                        {formatCurrency(result?.tax_analysis?.total_tax_benefit || 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Years to 67</p>
                      <p className="text-xl font-bold">{result?.projections?.years_to_retirement || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Marginal Rate</p>
                      <p className="text-xl font-bold">{result?.tax_analysis?.marginal_tax_rate || 0}%</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a2744] text-white">
                    <CardContent className="p-4">
                      <p className="text-sm text-white/80">Projected at 67</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(result?.projections?.projected_balance_at_67 || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Contribution Cap Progress */}
                <Card data-testid="cap-progress">
                  <CardHeader>
                    <CardTitle className="">Concessional Cap Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used: {formatCurrency(result?.contributions?.total_concessional || 0)}</span>
                        <span>Cap: {formatCurrency(result?.caps?.concessional_cap || 30000)}</span>
                      </div>
                      <Progress 
                        value={Math.min(concessionalCapUsed, 100)} 
                        className={concessionalCapUsed > 100 ? "bg-destructive/20" : ""}
                      />
                      {result?.caps?.cap_exceeded && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Cap exceeded by {formatCurrency(result?.caps?.excess_amount || 0)}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground">Concessional Remaining</p>
                        <p className="text-lg font-bold text-[#10B981]">
                          {formatCurrency(result?.caps?.concessional_remaining || 0)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground">Non-Concessional Remaining</p>
                        <p className="text-lg font-bold text-[#10B981]">
                          {formatCurrency(result?.caps?.non_concessional_remaining || 0)}
                        </p>
                      </div>
                    </div>

                    {result?.caps?.bring_forward_available && (
                      <div className="p-3 rounded-lg bg-[#D4A84C]/10 border border-[#D4A84C]/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[#D4A84C]" />
                          <p className="font-medium text-sm">Bring Forward Available</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          You can contribute up to {formatCurrency(result?.caps?.bring_forward_cap || 0)} non-concessional over 3 years
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Projection Chart */}
                <Card data-testid="projection-chart">
                  <CardHeader>
                    <CardTitle className="">Balance Projection to Retirement</CardTitle>
                    <CardDescription>
                      Assuming {result?.projections?.assumed_growth_rate || 7}% annual return
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={projectionData}>
                          <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1a2744" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#1a2744" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <YAxis 
                            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <Tooltip 
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#1a2744"
                            strokeWidth={2}
                            fill="url(#colorBalance)"
                            name="Super Balance"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Analysis */}
                <Card data-testid="tax-analysis">
                  <CardHeader>
                    <CardTitle className="">Tax Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-[#10B981]/10">
                        <p className="text-sm text-muted-foreground">Salary Sacrifice Savings</p>
                        <p className="text-lg font-bold text-[#10B981]">
                          {formatCurrency(result?.tax_analysis?.tax_saved_salary_sacrifice || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result?.tax_analysis?.marginal_tax_rate || 0}% → 15% tax
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground">Spouse Tax Offset</p>
                        <p className="text-lg font-bold">
                          {formatCurrency(result?.tax_analysis?.spouse_tax_offset || 0)}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${result?.tax_analysis?.div_293_applicable ? 'bg-destructive/10' : 'bg-muted'}`}>
                        <p className="text-sm text-muted-foreground">Division 293</p>
                        <p className={`text-lg font-bold ${result?.tax_analysis?.div_293_applicable ? 'text-destructive' : ''}`}>
                          {result?.tax_analysis?.div_293_applicable 
                            ? `-${formatCurrency(result?.tax_analysis?.div_293_additional_tax || 0)}`
                            : "Not Applicable"
                          }
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#1a2744] text-white">
                        <p className="text-sm text-white/80">Net Tax Benefit</p>
                        <p className="text-lg font-bold">
                          {formatCurrency(result?.tax_analysis?.total_tax_benefit || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card data-testid="recommendations">
                  <CardHeader>
                    <CardTitle className=" flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-[#D4A84C]" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(result?.recommendations || []).map((rec, index) => {
                        // Backend may return either a plain string or a structured
                        // object with { type, title, description, impact, priority }.
                        const title = typeof rec === "string" ? rec : (rec?.title || rec?.type || "");
                        const body = typeof rec === "string" ? "" : (rec?.description || "");
                        const impact = typeof rec === "string" ? "" : (rec?.impact || "");
                        const priority = typeof rec === "string" ? "" : (rec?.priority || "");
                        return (
                          <div 
                            key={`item-${index}`} 
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                          >
                            <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              {title && <p className="text-sm font-semibold">{title}</p>}
                              {body && <p className="text-sm text-muted-foreground mt-0.5">{body}</p>}
                              {(impact || priority) && (
                                <div className="flex gap-2 mt-2">
                                  {impact && <Badge variant="secondary" className="text-[10px]">{impact}</Badge>}
                                  {priority && <Badge variant="outline" className="text-[10px] capitalize">{priority} priority</Badge>}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-[400px]">
                <CardContent className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Landmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Enter your details to calculate SMSF strategy
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default SMSFOptimizer;
