import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Calculator, 
  DollarSign, 
  Percent,
  TrendingUp,
  TrendingDown,
  Calendar,
  PiggyBank
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
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

const LoanCalculator = () => {
  const [principal, setPrincipal] = useState(500000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [result, setResult] = useState(null);
  const [debtEquityResult, setDebtEquityResult] = useState(null);
  const [totalAssets, setTotalAssets] = useState(800000);
  const [totalDebt, setTotalDebt] = useState(500000);
  const [loading, setLoading] = useState(false);

  const calculateLoan = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/loan`, null, {
        params: {
          principal: principal,
          annual_rate: interestRate,
          years: loanTerm
        }
      });
      setResult(response.data);
      toast.success("Loan calculated");
    } catch (error) {
      console.error("Error calculating loan:", error);
      toast.error("Failed to calculate loan");
    } finally {
      setLoading(false);
    }
  };

  const calculateDebtEquity = async () => {
    try {
      const response = await axios.post(`${API}/analyze/debt-equity`, null, {
        params: {
          total_assets: totalAssets,
          total_debt: totalDebt
        }
      });
      setDebtEquityResult(response.data);
    } catch (error) {
      console.error("Error calculating debt/equity:", error);
      toast.error("Failed to calculate debt to equity");
    }
  };

  const scenarioChartData = result?.variable_rate_scenarios.map(s => ({
    scenario: `${s.rate_change >= 0 ? '+' : ''}${s.rate_change}%`,
    monthlyPayment: s.monthly_payment,
    totalInterest: s.total_interest,
    newRate: s.new_rate
  })) || [];

  return (
    <Layout>
      <div className="space-y-8" data-testid="loan-calculator-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
            Loan Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate repayments and analyze variable rate scenarios
          </p>
        </div>

        {/* Loan Calculator Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <Card data-testid="loan-inputs">
            <CardHeader>
              <CardTitle className="font-['Manrope']">Loan Details</CardTitle>
              <CardDescription>Enter your loan parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Principal */}
              <div className="space-y-2">
                <Label htmlFor="principal">Loan Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="principal"
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="pl-10"
                    data-testid="principal-input"
                  />
                </div>
              </div>

              {/* Interest Rate */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Interest Rate</Label>
                  <span className="text-sm font-semibold text-[#D4AF37]">{interestRate}%</span>
                </div>
                <Slider
                  value={[interestRate]}
                  onValueChange={(v) => setInterestRate(v[0])}
                  min={2}
                  max={12}
                  step={0.1}
                  className="py-2"
                  data-testid="interest-rate-slider"
                />
              </div>

              {/* Loan Term */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Loan Term</Label>
                  <span className="text-sm font-semibold">{loanTerm} years</span>
                </div>
                <Slider
                  value={[loanTerm]}
                  onValueChange={(v) => setLoanTerm(v[0])}
                  min={5}
                  max={30}
                  step={1}
                  className="py-2"
                  data-testid="loan-term-slider"
                />
              </div>

              <Button 
                onClick={calculateLoan}
                className="w-full bg-[#0F392B] hover:bg-[#0F392B]/90"
                disabled={loading}
                data-testid="calculate-loan-btn"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Repayments
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="lg:col-span-2" data-testid="loan-results">
            <CardHeader>
              <CardTitle className="font-['Manrope']">Repayment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Key Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                      <p className="text-sm text-white/80">Monthly Payment</p>
                      <p className="text-xl font-bold">{formatCurrency(result.monthly_payment)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Annual Payment</p>
                      <p className="text-xl font-bold">{formatCurrency(result.annual_payment)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#D4AF37]/10">
                      <p className="text-sm text-muted-foreground">Total Interest</p>
                      <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(result.total_interest)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Total Repayment</p>
                      <p className="text-xl font-bold">{formatCurrency(result.total_repayment)}</p>
                    </div>
                  </div>

                  {/* Loan Summary */}
                  <div className="p-4 rounded-lg border border-border">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Principal</p>
                        <p className="text-lg font-semibold">{formatCurrency(result.principal)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Interest Rate</p>
                        <p className="text-lg font-semibold">{result.annual_rate}% p.a.</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Term</p>
                        <p className="text-lg font-semibold">{result.term_years} years</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Enter loan details to calculate</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Variable Rate Scenarios */}
        {result && (
          <Card data-testid="rate-scenarios">
            <CardHeader>
              <CardTitle className="font-['Manrope']">Variable Rate Scenarios</CardTitle>
              <CardDescription>
                See how rate changes affect your repayments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scenario Table */}
                <div className="space-y-3">
                  {result.variable_rate_scenarios.map((scenario, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${
                        scenario.rate_change === 0 
                          ? 'border-[#0F392B] bg-[#0F392B]/5' 
                          : 'border-border'
                      }`}
                      data-testid={`scenario-${index}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {scenario.rate_change > 0 ? (
                            <TrendingUp className="h-5 w-5 text-destructive" />
                          ) : scenario.rate_change < 0 ? (
                            <TrendingDown className="h-5 w-5 text-[#10B981]" />
                          ) : (
                            <Percent className="h-5 w-5 text-[#0F392B]" />
                          )}
                          <div>
                            <p className="font-semibold">
                              {scenario.rate_change > 0 ? '+' : ''}{scenario.rate_change}% Change
                            </p>
                            <p className="text-sm text-muted-foreground">
                              New rate: {scenario.new_rate}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(scenario.monthly_payment)}/mo</p>
                          <p className={`text-sm ${
                            scenario.rate_change > 0 ? 'text-destructive' : 
                            scenario.rate_change < 0 ? 'text-[#10B981]' : 'text-muted-foreground'
                          }`}>
                            {scenario.rate_change !== 0 && (
                              <>
                                {scenario.rate_change > 0 ? '+' : ''}
                                {formatCurrency(scenario.monthly_payment - result.monthly_payment)}
                              </>
                            )}
                            {scenario.rate_change === 0 && 'Current rate'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scenarioChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="scenario" stroke="hsl(var(--muted-foreground))" />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                      <Legend />
                      <Bar dataKey="monthlyPayment" fill="#0F392B" name="Monthly Payment" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debt to Equity Calculator */}
        <Card data-testid="debt-equity-calculator">
          <CardHeader>
            <CardTitle className="font-['Manrope'] flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-[#D4AF37]" />
              Debt to Equity Ratio
            </CardTitle>
            <CardDescription>
              Analyze your leverage and financial health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="total-assets">Total Assets</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="total-assets"
                    type="number"
                    value={totalAssets}
                    onChange={(e) => setTotalAssets(Number(e.target.value))}
                    className="pl-10"
                    data-testid="total-assets-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-debt">Total Debt</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="total-debt"
                    type="number"
                    value={totalDebt}
                    onChange={(e) => setTotalDebt(Number(e.target.value))}
                    className="pl-10"
                    data-testid="total-debt-input"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={calculateDebtEquity}
                  className="w-full bg-[#D4AF37] text-[#0F392B] hover:bg-[#D4AF37]/90"
                  data-testid="calculate-debt-equity-btn"
                >
                  Calculate Ratio
                </Button>
              </div>

              {debtEquityResult && (
                <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                  <p className="text-sm text-white/80">Debt to Equity</p>
                  <p className="text-2xl font-bold">
                    {debtEquityResult.debt_to_equity_ratio === Infinity 
                      ? '∞' 
                      : debtEquityResult.debt_to_equity_ratio.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {debtEquityResult && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Equity</p>
                  <p className="text-xl font-bold text-[#10B981]">
                    {formatCurrency(debtEquityResult.equity)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Debt to Assets</p>
                  <p className="text-xl font-bold">
                    {(debtEquityResult.debt_to_assets_ratio * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Equity Ratio</p>
                  <p className="text-xl font-bold text-[#10B981]">
                    {(debtEquityResult.equity_ratio * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Leverage Multiple</p>
                  <p className="text-xl font-bold">
                    {debtEquityResult.leverage_multiple === Infinity 
                      ? '∞' 
                      : debtEquityResult.leverage_multiple.toFixed(2)}x
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card data-testid="loan-info">
          <CardHeader>
            <CardTitle className="font-['Manrope']">Understanding Loan Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Variable Rate Impact</h4>
                <p>
                  Interest rates can change significantly over a loan term. A 2% increase 
                  on a $500,000 loan can add over $500 to monthly repayments. Always budget 
                  for potential rate rises.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Debt to Equity Ratio</h4>
                <p>
                  A healthy debt-to-equity ratio is typically below 1.0, meaning you have more 
                  equity than debt. Higher ratios indicate more leverage and risk, but can 
                  amplify returns when asset values increase.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default LoanCalculator;
