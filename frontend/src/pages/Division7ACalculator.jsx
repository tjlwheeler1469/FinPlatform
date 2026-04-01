import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Building2,
  DollarSign,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Calendar,
  Percent,
  TrendingUp,
  FileText,
  Info
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Division 7A benchmark interest rate (updated annually by ATO)
const DIV7A_BENCHMARK_RATE = 8.77; // 2024-25 rate

const Division7ACalculator = ({ embedded = false }) => {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [loanDate, setLoanDate] = useState("2024-07-01");
  const [loanTerm, setLoanTerm] = useState(7); // 7 years unsecured, 25 years secured
  const [isSecured, setIsSecured] = useState(false);
  const [interestRate, setInterestRate] = useState(DIV7A_BENCHMARK_RATE);
  const [existingRepayments, setExistingRepayments] = useState(0);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("calculator");

  useEffect(() => {
    // Update loan term based on secured status
    setLoanTerm(isSecured ? 25 : 7);
  }, [isSecured]);

  const calculateDiv7ALoan = () => {
    const P = loanAmount;
    const r = interestRate / 100; // Annual rate
    const n = loanTerm;
    
    // Calculate minimum yearly repayment (principal + interest)
    // Using amortization formula
    const annualPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    // First year interest only
    const firstYearInterest = P * r;
    
    // Generate amortization schedule
    const schedule = [];
    let balance = P;
    let totalInterest = 0;
    let totalPrincipal = 0;
    
    for (let year = 1; year <= n; year++) {
      const interestPayment = balance * r;
      const principalPayment = annualPayment - interestPayment;
      balance = Math.max(0, balance - principalPayment);
      totalInterest += interestPayment;
      totalPrincipal += principalPayment;
      
      schedule.push({
        year,
        opening_balance: balance + principalPayment,
        minimum_repayment: Math.round(annualPayment),
        interest_component: Math.round(interestPayment),
        principal_component: Math.round(principalPayment),
        closing_balance: Math.round(balance)
      });
    }

    // Check compliance
    const shortfall = Math.max(0, annualPayment - existingRepayments);
    const isCompliant = existingRepayments >= annualPayment;
    const deemedDividend = isCompliant ? 0 : shortfall;
    
    // Tax impact of deemed dividend (at top marginal rate)
    const taxOnDeemedDividend = deemedDividend * 0.47;

    setResult({
      loan_amount: P,
      benchmark_rate: interestRate,
      loan_term: n,
      annual_minimum_repayment: Math.round(annualPayment),
      first_year_interest: Math.round(firstYearInterest),
      total_repayments: Math.round(annualPayment * n),
      total_interest: Math.round(totalInterest),
      existing_repayments: existingRepayments,
      shortfall: Math.round(shortfall),
      is_compliant: isCompliant,
      deemed_dividend: Math.round(deemedDividend),
      tax_on_deemed_dividend: Math.round(taxOnDeemedDividend),
      schedule
    });
  };

  // Chart data
  const balanceChartData = result?.schedule.map(s => ({
    year: `Year ${s.year}`,
    balance: s.closing_balance,
    interest: s.interest_component,
    principal: s.principal_component
  })) || [];

  const content = (
      <div className="space-y-6" data-testid="div7a-calculator-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold  text-foreground">
            Division 7A Loan Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate compliant loan repayments to avoid deemed dividends
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Section */}
              <Card className="lg:col-span-1" data-testid="div7a-inputs">
                <CardHeader>
                  <CardTitle className="">Loan Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Loan Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="pl-10"
                        data-testid="loan-amount-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Loan Start Date</Label>
                    <Input
                      type="date"
                      value={loanDate}
                      onChange={(e) => setLoanDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Benchmark Interest Rate (%)</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ATO benchmark rate 2024-25: {DIV7A_BENCHMARK_RATE}%
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <Label>Secured Loan?</Label>
                      <p className="text-xs text-muted-foreground">
                        {isSecured ? "25 year term" : "7 year term"}
                      </p>
                    </div>
                    <Switch
                      checked={isSecured}
                      onCheckedChange={setIsSecured}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Repayments Made This Year</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={existingRepayments}
                        onChange={(e) => setExistingRepayments(Number(e.target.value))}
                        className="pl-10"
                        data-testid="repayments-input"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={calculateDiv7ALoan}
                    className="w-full bg-[#1a2744] hover:bg-[#1a2744]/90"
                    data-testid="calculate-btn"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              <div className="lg:col-span-2 space-y-6">
                {result ? (
                  <>
                    {/* Compliance Status */}
                    <Card className={result.is_compliant ? "border-[#10B981]" : "border-destructive"}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          {result.is_compliant ? (
                            <CheckCircle className="h-12 w-12 text-[#10B981]" />
                          ) : (
                            <AlertTriangle className="h-12 w-12 text-destructive" />
                          )}
                          <div>
                            <h3 className="text-xl font-bold">
                              {result.is_compliant ? "Compliant" : "Non-Compliant"}
                            </h3>
                            <p className="text-muted-foreground">
                              {result.is_compliant 
                                ? "Your repayments meet Division 7A requirements"
                                : `Shortfall of ${formatCurrency(result.shortfall)} will be treated as deemed dividend`
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Minimum Annual Repayment</p>
                          <p className="text-xl font-bold text-[#1a2744]">
                            {formatCurrency(result.annual_minimum_repayment)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Your Repayments</p>
                          <p className="text-xl font-bold">
                            {formatCurrency(result.existing_repayments)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className={result.deemed_dividend > 0 ? "bg-destructive/10" : ""}>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Deemed Dividend</p>
                          <p className={`text-xl font-bold ${result.deemed_dividend > 0 ? 'text-destructive' : 'text-[#10B981]'}`}>
                            {formatCurrency(result.deemed_dividend)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className={result.tax_on_deemed_dividend > 0 ? "bg-destructive/10" : ""}>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Tax Payable</p>
                          <p className={`text-xl font-bold ${result.tax_on_deemed_dividend > 0 ? 'text-destructive' : 'text-[#10B981]'}`}>
                            {formatCurrency(result.tax_on_deemed_dividend)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Loan Balance Chart */}
                    <Card data-testid="balance-chart">
                      <CardHeader>
                        <CardTitle className="">Loan Balance Over Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] min-h-[300px]">
                          <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                            <AreaChart data={balanceChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                              <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                              <Tooltip formatter={(v) => formatCurrency(v)} />
                              <Area 
                                type="monotone" 
                                dataKey="balance" 
                                stroke="#1a2744" 
                                fill="#1a2744" 
                                fillOpacity={0.3}
                                name="Loan Balance"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Breakdown */}
                    <Card data-testid="payment-breakdown">
                      <CardHeader>
                        <CardTitle className="">Annual Payment Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px] min-h-[250px]">
                          <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                            <BarChart data={balanceChartData.slice(0, 10)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                              <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                              <Tooltip formatter={(v) => formatCurrency(v)} />
                              <Legend />
                              <Bar dataKey="principal" name="Principal" fill="#1a2744" stackId="a" />
                              <Bar dataKey="interest" name="Interest" fill="#D4A84C" stackId="a" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Required */}
                    {!result.is_compliant && (
                      <Card className="border-[#D4A84C]">
                        <CardHeader>
                          <CardTitle className=" flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-[#D4A84C]" />
                            Action Required
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm">
                            To avoid the {formatCurrency(result.deemed_dividend)} deemed dividend:
                          </p>
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#10B981]/10">
                            <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                            <p className="text-sm">
                              Make an additional repayment of <strong>{formatCurrency(result.shortfall)}</strong> before 
                              the lodgement day of the company's tax return
                            </p>
                          </div>
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              This will save you {formatCurrency(result.tax_on_deemed_dividend)} in personal tax
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="h-[400px]">
                    <CardContent className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium">Division 7A Calculator</p>
                        <p className="text-muted-foreground">
                          Enter loan details to calculate minimum repayments
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            {result ? (
              <Card data-testid="amortization-schedule">
                <CardHeader>
                  <CardTitle className="">Amortization Schedule</CardTitle>
                  <CardDescription>
                    {result.loan_term} year repayment schedule at {result.benchmark_rate}% interest
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Year</th>
                          <th className="text-right p-3 font-semibold">Opening Balance</th>
                          <th className="text-right p-3 font-semibold">Min. Repayment</th>
                          <th className="text-right p-3 font-semibold">Interest</th>
                          <th className="text-right p-3 font-semibold">Principal</th>
                          <th className="text-right p-3 font-semibold">Closing Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.schedule.map((row) => (
                          <tr key={row.year} className="border-b">
                            <td className="p-3 font-medium">Year {row.year}</td>
                            <td className="text-right p-3">{formatCurrency(row.opening_balance)}</td>
                            <td className="text-right p-3 font-medium text-[#1a2744]">
                              {formatCurrency(row.minimum_repayment)}
                            </td>
                            <td className="text-right p-3 text-[#D4A84C]">
                              {formatCurrency(row.interest_component)}
                            </td>
                            <td className="text-right p-3">{formatCurrency(row.principal_component)}</td>
                            <td className="text-right p-3">{formatCurrency(row.closing_balance)}</td>
                          </tr>
                        ))}
                        <tr className="bg-muted/30 font-semibold">
                          <td className="p-3" colSpan={2}>Total</td>
                          <td className="text-right p-3 text-[#1a2744]">{formatCurrency(result.total_repayments)}</td>
                          <td className="text-right p-3 text-[#D4A84C]">{formatCurrency(result.total_interest)}</td>
                          <td className="text-right p-3">{formatCurrency(result.loan_amount)}</td>
                          <td className="p-3"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                Calculate a loan first to see the amortization schedule
              </Card>
            )}
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="">What is Division 7A?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Division 7A of the Income Tax Assessment Act 1936 prevents private companies 
                    from making tax-free distributions to shareholders or their associates.
                  </p>
                  <p>
                    If a private company loans money to a shareholder or associate without a 
                    complying loan agreement, the amount may be treated as a <strong>deemed dividend</strong> 
                    and taxed at the shareholder's marginal rate.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="">Complying Loan Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0" />
                    <p className="text-sm">Written loan agreement in place</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0" />
                    <p className="text-sm">Interest rate at least the ATO benchmark rate ({DIV7A_BENCHMARK_RATE}% for 2024-25)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0" />
                    <p className="text-sm">Maximum term: 7 years (unsecured) or 25 years (secured)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0" />
                    <p className="text-sm">Minimum yearly repayments made before company tax return lodgement</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="">Key Dates & Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">2024-25 Benchmark Rate</p>
                      <p className="text-lg font-bold text-[#1a2744]">{DIV7A_BENCHMARK_RATE}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Unsecured Term</p>
                      <p className="text-lg font-bold">7 years</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Secured Term</p>
                      <p className="text-lg font-bold">25 years</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Deemed Dividend Tax</p>
                      <p className="text-lg font-bold text-destructive">Up to 47%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default Division7ACalculator;
