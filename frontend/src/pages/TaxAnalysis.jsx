import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Calculator, 
  DollarSign, 
  Percent,
  TrendingUp,
  Building2,
  User,
  Info,
  ExternalLink,
  BookOpen
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
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

// ATO Info Tooltip Component
const ATOTooltip = ({ title, description, atoUrl }) => (
  <TooltipProvider>
    <UITooltip>
      <TooltipTrigger asChild>
        <button className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-muted hover:bg-muted/80">
          <Info className="h-3 w-3 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3">
        <p className="font-semibold text-sm mb-1">{title}</p>
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
        {atoUrl && (
          <a 
            href={atoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-[#0F392B] hover:underline flex items-center gap-1"
          >
            ATO Reference <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </TooltipContent>
    </UITooltip>
  </TooltipProvider>
);

const TaxAnalysis = () => {
  const [entityType, setEntityType] = useState("personal");
  const [taxableIncome, setTaxableIncome] = useState(120000);
  const [isBaseRateEntity, setIsBaseRateEntity] = useState(true);
  const [dividendAmount, setDividendAmount] = useState(10000);
  const [frankingPercentage, setFrankingPercentage] = useState(100);
  const [taxResult, setTaxResult] = useState(null);
  const [frankingResult, setFrankingResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateTax = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/tax`, null, {
        params: {
          taxable_income: taxableIncome,
          entity_type: entityType,
          is_base_rate_entity: isBaseRateEntity
        }
      });
      setTaxResult(response.data);
    } catch (error) {
      console.error("Error calculating tax:", error);
      toast.error("Failed to calculate tax");
    } finally {
      setLoading(false);
    }
  };

  const calculateFranking = async () => {
    try {
      const response = await axios.post(`${API}/analyze/franking`, null, {
        params: {
          dividend: dividendAmount,
          franking_percentage: frankingPercentage
        }
      });
      setFrankingResult(response.data);
    } catch (error) {
      console.error("Error calculating franking:", error);
      toast.error("Failed to calculate franking credits");
    }
  };

  useEffect(() => {
    calculateTax();
    calculateFranking();
  }, []);

  const pieChartData = taxResult ? [
    { name: "Net Income", value: taxResult.net_income || taxResult.net_profit, color: "#0F392B" },
    { name: "Income Tax", value: taxResult.income_tax || taxResult.company_tax, color: "#D4AF37" },
    { name: "Medicare Levy", value: taxResult.medicare_levy || 0, color: "#10B981" }
  ].filter(d => d.value > 0) : [];

  const bracketChartData = taxResult?.breakdown?.map((b, i) => ({
    bracket: b.bracket.replace(/\$([0-9,]+)/g, '$$$1').replace(' - ', '\n'),
    tax: b.tax,
    rate: `${b.rate}%`
  })) || [];

  return (
    <Layout>
      <div className="space-y-8" data-testid="tax-analysis-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              Tax Analysis
            </h1>
            <p className="text-muted-foreground mt-1">
              Calculate Australian personal and company taxes for 2024-25
              <ATOTooltip 
                title="2024-25 Tax Rates" 
                description="Stage 3 tax cuts applied. Rates effective 1 July 2024."
                atoUrl="https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents"
              />
            </p>
          </div>
          <Link to="/calculation-methodology">
            <Button variant="outline" size="sm">
              <BookOpen className="h-4 w-4 mr-2" />
              View Methodology
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <Tabs value={entityType} onValueChange={setEntityType} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="personal" data-testid="personal-tab">
              <User className="h-4 w-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="company" data-testid="company-tab">
              <Building2 className="h-4 w-4 mr-2" />
              Company
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Card */}
            <Card data-testid="tax-input-card">
              <CardHeader>
                <CardTitle className="font-['Manrope']">Tax Calculator</CardTitle>
                <CardDescription>
                  Enter your {entityType === "personal" ? "personal" : "company"} taxable income
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="taxable-income">
                    Taxable Income
                    <ATOTooltip 
                      title="Taxable Income" 
                      description="Total assessable income minus allowable deductions."
                      atoUrl="https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records"
                    />
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="taxable-income"
                      type="number"
                      value={taxableIncome}
                      onChange={(e) => setTaxableIncome(Number(e.target.value))}
                      className="pl-10"
                      data-testid="taxable-income-input"
                    />
                  </div>
                </div>

                {entityType === "company" && (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <Label htmlFor="base-rate">Base Rate Entity</Label>
                      <p className="text-sm text-muted-foreground">
                        Turnover under $50M
                      </p>
                    </div>
                    <Switch
                      id="base-rate"
                      checked={isBaseRateEntity}
                      onCheckedChange={setIsBaseRateEntity}
                      data-testid="base-rate-switch"
                    />
                  </div>
                )}

                <Button 
                  onClick={calculateTax} 
                  className="w-full bg-[#0F392B] hover:bg-[#0F392B]/90"
                  disabled={loading}
                  data-testid="calculate-tax-btn"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Tax
                </Button>
              </CardContent>
            </Card>

            {/* Results Card */}
            <Card className="lg:col-span-2" data-testid="tax-results-card">
              <CardHeader>
                <CardTitle className="font-['Manrope']">Tax Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {taxResult ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Summary Stats */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                        <p className="text-sm text-white/80">Net Income</p>
                        <p className="text-3xl font-bold font-['Manrope']">
                          {formatCurrency(taxResult.net_income || taxResult.net_profit)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">
                            {entityType === "personal" ? "Income Tax" : "Company Tax"}
                          </p>
                          <p className="text-xl font-bold">
                            {formatCurrency(taxResult.income_tax || taxResult.company_tax)}
                          </p>
                        </div>
                        {entityType === "personal" && (
                          <div className="p-4 rounded-lg bg-muted">
                            <p className="text-sm text-muted-foreground">Medicare Levy</p>
                            <p className="text-xl font-bold">
                              {formatCurrency(taxResult.medicare_levy)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="p-4 rounded-lg border border-[#D4AF37] bg-[#D4AF37]/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Effective Tax Rate</p>
                            <p className="text-2xl font-bold text-[#D4AF37]">
                              {(taxResult.effective_rate || (taxResult.tax_rate)).toFixed(1)}%
                            </p>
                          </div>
                          <Percent className="h-8 w-8 text-[#D4AF37]" />
                        </div>
                      </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-2">
                        {pieChartData.map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm text-muted-foreground">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center">
                    <p className="text-muted-foreground">Enter income to calculate tax</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Tabs>

        {/* Tax Bracket Breakdown */}
        {entityType === "personal" && taxResult?.breakdown && (
          <Card data-testid="tax-bracket-chart">
            <CardHeader>
              <CardTitle className="font-['Manrope']">Tax by Bracket</CardTitle>
              <CardDescription>
                How your tax is calculated across each bracket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bracketChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      dataKey="bracket" 
                      type="category" 
                      width={120}
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="tax" fill="#0F392B" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Franking Credits Calculator */}
        <Card data-testid="franking-calculator">
          <CardHeader>
            <CardTitle className="font-['Manrope'] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
              Franking Credits Calculator
              <ATOTooltip 
                title="Dividend Imputation" 
                description="Franking credits represent tax already paid by the company. You're entitled to a tax offset for these credits."
                atoUrl="https://www.ato.gov.au/individuals-and-families/investments-and-assets/in-detail/investing-in-shares/dividends-and-shares/receiving-dividends"
              />
            </CardTitle>
            <CardDescription>
              Calculate imputation credits for Australian dividends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dividend">
                  Dividend Amount
                  <ATOTooltip 
                    title="Cash Dividend" 
                    description="The actual cash amount received from the dividend payment."
                  />
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dividend"
                    type="number"
                    value={dividendAmount}
                    onChange={(e) => setDividendAmount(Number(e.target.value))}
                    className="pl-10"
                    data-testid="dividend-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="franking">
                  Franking %
                  <ATOTooltip 
                    title="Franking Percentage" 
                    description="100% = fully franked (company paid full tax). 0% = unfranked. Check your dividend statement."
                  />
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="franking"
                    type="number"
                    value={frankingPercentage}
                    onChange={(e) => setFrankingPercentage(Number(e.target.value))}
                    className="pl-10"
                    max={100}
                    min={0}
                    data-testid="franking-percentage-input"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={calculateFranking}
                  className="w-full bg-[#D4AF37] text-[#0F392B] hover:bg-[#D4AF37]/90"
                  data-testid="calculate-franking-btn"
                >
                  Calculate
                </Button>
              </div>

              {frankingResult && (
                <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]">
                  <p className="text-sm text-muted-foreground">Grossed-up Dividend</p>
                  <p className="text-2xl font-bold text-[#D4AF37]">
                    {formatCurrency(frankingResult.grossed_up_dividend)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Franking Credit: {formatCurrency(frankingResult.franking_credit)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card data-testid="personal-tax-info">
            <CardHeader>
              <CardTitle className="font-['Manrope'] text-lg">Personal Tax Rates 2024-25</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 rounded bg-muted/50">
                  <span>$0 - $18,200</span>
                  <span className="font-semibold text-[#10B981]">Nil</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/50">
                  <span>$18,201 - $45,000</span>
                  <span className="font-semibold">16%</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/50">
                  <span>$45,001 - $135,000</span>
                  <span className="font-semibold">30%</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/50">
                  <span>$135,001 - $190,000</span>
                  <span className="font-semibold">37%</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/50">
                  <span>$190,001+</span>
                  <span className="font-semibold">45%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="company-tax-info">
            <CardHeader>
              <CardTitle className="font-['Manrope'] text-lg">Company Tax Rates 2024-25</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                  <p className="text-sm text-white/80">Base Rate Entities</p>
                  <p className="text-3xl font-bold">25%</p>
                  <p className="text-sm text-white/60 mt-2">
                    Aggregated turnover {"<"} $50 million
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Full Rate</p>
                  <p className="text-3xl font-bold">30%</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    All other companies
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TaxAnalysis;
