import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Shield,
  Heart,
  Umbrella,
  Home,
  Car,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calculator,
  RefreshCw,
  Info
} from "lucide-react";
import { usePortfolio } from "@/App";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

const INSURANCE_TYPES = [
  { 
    type: "life", 
    label: "Life Insurance", 
    icon: Heart, 
    color: "#EF4444",
    description: "Provides a lump sum to your family if you pass away"
  },
  { 
    type: "income_protection", 
    label: "Income Protection", 
    icon: Umbrella, 
    color: "#3B82F6",
    description: "Replaces up to 75% of income if you can't work due to illness/injury"
  },
  { 
    type: "tpd", 
    label: "TPD Insurance", 
    icon: Shield, 
    color: "#8B5CF6",
    description: "Lump sum if you're totally and permanently disabled"
  },
  { 
    type: "trauma", 
    label: "Trauma/Critical Illness", 
    icon: Heart, 
    color: "#EC4899",
    description: "Lump sum on diagnosis of specified critical illnesses"
  }
];

const InsuranceGapAnalysis = () => {
  const { portfolio, familyMembers, budget } = usePortfolio();
  
  // User inputs
  const [age, setAge] = useState(45);
  const [annualIncome, setAnnualIncome] = useState(185000);
  const [yearsToRetirement, setYearsToRetirement] = useState(20);
  const [dependents, setDependents] = useState(2);
  const [totalDebt, setTotalDebt] = useState(942000);
  const [annualExpenses, setAnnualExpenses] = useState(120000);
  
  // Current coverage
  const [currentLifeCover, setCurrentLifeCover] = useState(500000);
  const [currentIPCover, setCurrentIPCover] = useState(8000);
  const [currentTPDCover, setCurrentTPDCover] = useState(300000);
  const [currentTraumaCover, setCurrentTraumaCover] = useState(100000);

  // Initialize from portfolio
  useEffect(() => {
    if (familyMembers[0]?.age) setAge(familyMembers[0].age);
    if (portfolio.summary.totalDebt) setTotalDebt(portfolio.summary.totalDebt);
    const totalIncome = Object.values(budget.income).reduce((a, b) => a + b, 0) * 12;
    if (totalIncome > 0) setAnnualIncome(totalIncome);
    const totalExpenses = Object.values(budget.expenses).reduce((a, b) => a + b, 0) * 12;
    if (totalExpenses > 0) setAnnualExpenses(totalExpenses);
  }, [familyMembers, portfolio, budget]);

  // Calculate recommended coverage
  const calculateRecommendedCoverage = () => {
    // Life Insurance: 10x income + debts + education costs - assets
    const educationCost = dependents * 100000; // $100k per child
    const funeralCosts = 25000;
    const incomeReplacement = annualIncome * 10;
    const recommendedLife = Math.max(0, totalDebt + incomeReplacement + educationCost + funeralCosts);
    
    // Income Protection: 75% of monthly income
    const recommendedIP = Math.round((annualIncome * 0.75) / 12);
    
    // TPD: Similar to life but focused on own care costs
    const careCosts = 500000; // Estimated lifetime care costs
    const recommendedTPD = totalDebt + careCosts + educationCost;
    
    // Trauma: 2-3 years of expenses plus treatment costs
    const recommendedTrauma = (annualExpenses * 2) + 100000; // Treatment buffer
    
    return {
      life: recommendedLife,
      income_protection: recommendedIP,
      tpd: recommendedTPD,
      trauma: recommendedTrauma
    };
  };

  const recommended = calculateRecommendedCoverage();

  // Calculate gaps
  const gaps = {
    life: {
      current: currentLifeCover,
      recommended: recommended.life,
      gap: recommended.life - currentLifeCover,
      coverage: Math.min(100, (currentLifeCover / recommended.life) * 100)
    },
    income_protection: {
      current: currentIPCover,
      recommended: recommended.income_protection,
      gap: recommended.income_protection - currentIPCover,
      coverage: Math.min(100, (currentIPCover / recommended.income_protection) * 100)
    },
    tpd: {
      current: currentTPDCover,
      recommended: recommended.tpd,
      gap: recommended.tpd - currentTPDCover,
      coverage: Math.min(100, (currentTPDCover / recommended.tpd) * 100)
    },
    trauma: {
      current: currentTraumaCover,
      recommended: recommended.trauma,
      gap: recommended.trauma - currentTraumaCover,
      coverage: Math.min(100, (currentTraumaCover / recommended.trauma) * 100)
    }
  };

  // Overall protection score
  const overallScore = Math.round(
    (gaps.life.coverage + gaps.income_protection.coverage + gaps.tpd.coverage + gaps.trauma.coverage) / 4
  );

  // Chart data
  const chartData = INSURANCE_TYPES.map(type => ({
    name: type.label.split(' ')[0],
    current: type.type === 'income_protection' 
      ? gaps[type.type].current * 12 
      : gaps[type.type].current,
    recommended: type.type === 'income_protection' 
      ? gaps[type.type].recommended * 12 
      : gaps[type.type].recommended,
    color: type.color
  }));

  const getStatusBadge = (coverage) => {
    if (coverage >= 90) return <Badge className="bg-green-500">Adequate</Badge>;
    if (coverage >= 60) return <Badge className="bg-yellow-500">Partial</Badge>;
    return <Badge className="bg-red-500">Underinsured</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="insurance-gap-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#D4A84C]" />
              Insurance Gap Analysis
            </h1>
            <p className="text-muted-foreground mt-1">
              Assess your insurance coverage against recommended levels
            </p>
          </div>
          <Badge 
            className={`text-lg py-2 px-4 ${
              overallScore >= 80 ? 'bg-green-500' :
              overallScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          >
            Protection Score: {overallScore}/100
          </Badge>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#D4A84C]" />
              Your Situation
            </CardTitle>
            <CardDescription>Adjust these values to get personalized recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Age: {age}</Label>
                <Slider
                  value={[age]}
                  onValueChange={(v) => setAge(v[0])}
                  min={25}
                  max={65}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Annual Income</Label>
                <Input
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Years to Retirement: {yearsToRetirement}</Label>
                <Slider
                  value={[yearsToRetirement]}
                  onValueChange={(v) => setYearsToRetirement(v[0])}
                  min={5}
                  max={40}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Number of Dependents: {dependents}</Label>
                <Slider
                  value={[dependents]}
                  onValueChange={(v) => setDependents(v[0])}
                  min={0}
                  max={5}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Debt</Label>
                <Input
                  type="number"
                  value={totalDebt}
                  onChange={(e) => setTotalDebt(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Annual Expenses</Label>
                <Input
                  type="number"
                  value={annualExpenses}
                  onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coverage Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coverage Comparison</CardTitle>
            <CardDescription>Current coverage vs recommended levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="current" name="Current Coverage" fill="#1a2744" />
                  <Bar dataKey="recommended" name="Recommended" fill="#D4A84C" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Insurance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INSURANCE_TYPES.map((type) => {
            const gap = gaps[type.type];
            const Icon = type.icon;
            
            return (
              <Card key={type.type}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon className="h-5 w-5" style={{ color: type.color }} />
                      {type.label}
                    </CardTitle>
                    {getStatusBadge(gap.coverage)}
                  </div>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Coverage Level</span>
                      <span className="font-semibold">{gap.coverage.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={gap.coverage} 
                      className={`h-3 ${
                        gap.coverage >= 80 ? '[&>div]:bg-green-500' :
                        gap.coverage >= 50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
                      }`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p className="text-xl font-bold">
                        {type.type === 'income_protection' 
                          ? `${formatCurrency(gap.current)}/mo`
                          : formatCurrency(gap.current)
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recommended</p>
                      <p className="text-xl font-bold" style={{ color: type.color }}>
                        {type.type === 'income_protection' 
                          ? `${formatCurrency(gap.recommended)}/mo`
                          : formatCurrency(gap.recommended)
                        }
                      </p>
                    </div>
                  </div>
                  
                  {gap.gap > 0 && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-orange-800">Coverage Gap</AlertTitle>
                      <AlertDescription className="text-orange-700">
                        {type.type === 'income_protection'
                          ? `Consider increasing by ${formatCurrency(gap.gap)}/month`
                          : `Consider increasing by ${formatCurrency(gap.gap)}`
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {gap.coverage >= 90 && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Adequately Covered</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Your coverage meets or exceeds recommended levels.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="pt-2 border-t">
                    <Label>Adjust Current Coverage</Label>
                    <Input
                      type="number"
                      value={type.type === 'life' ? currentLifeCover :
                             type.type === 'income_protection' ? currentIPCover :
                             type.type === 'tpd' ? currentTPDCover : currentTraumaCover}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (type.type === 'life') setCurrentLifeCover(val);
                        else if (type.type === 'income_protection') setCurrentIPCover(val);
                        else if (type.type === 'tpd') setCurrentTPDCover(val);
                        else setCurrentTraumaCover(val);
                      }}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recommendations Summary */}
        <Card className="border-[#1a2744] bg-[#1a2744]/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-[#1a2744] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#1a2744]">Insurance Recommendations</p>
                <ul className="text-sm text-[#1a2744]/80 mt-2 space-y-2">
                  {overallScore < 80 && (
                    <li>• Your overall protection score is {overallScore}/100. Consider reviewing your coverage.</li>
                  )}
                  {gaps.life.coverage < 80 && (
                    <li>• <strong>Life Insurance:</strong> With {dependents} dependents and {formatCurrency(totalDebt)} in debt, consider increasing coverage.</li>
                  )}
                  {gaps.income_protection.coverage < 80 && (
                    <li>• <strong>Income Protection:</strong> Protects your ability to earn. Critical for families relying on your income.</li>
                  )}
                  {gaps.tpd.coverage < 80 && (
                    <li>• <strong>TPD:</strong> Provides funds if you can never work again. Often bundled with super.</li>
                  )}
                  {gaps.trauma.coverage < 80 && (
                    <li>• <strong>Trauma:</strong> Provides immediate funds upon critical illness diagnosis.</li>
                  )}
                  {overallScore >= 80 && (
                    <li>• Your insurance coverage appears adequate. Review annually or when circumstances change.</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Note</AlertTitle>
          <AlertDescription>
            This analysis provides general guidance only. Insurance needs vary based on individual circumstances.
            Consult a licensed financial adviser for personalized insurance advice.
            Premiums and coverage terms vary between insurers.
          </AlertDescription>
        </Alert>
      </div>
    </Layout>
  );
};

export default InsuranceGapAnalysis;
