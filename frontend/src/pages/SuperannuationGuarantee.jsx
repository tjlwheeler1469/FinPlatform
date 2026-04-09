import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ChartContainer from "@/components/ChartContainer";
import { 
  Calculator, DollarSign, Percent, PiggyBank, TrendingUp, Info, Calendar, Shield, ArrowUpRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value);
};

const SG_RATE = 12.0; // Current SG rate %
const CONCESSIONAL_CAP = 30000; // 2025-26 concessional cap

const SuperannuationGuarantee = ({ embedded = false }) => {
  // Personal inputs matching Thompson family
  const [currentAge, setCurrentAge] = useState(50);
  const [retirementAge, setRetirementAge] = useState(67);
  const [superBalance, setSuperBalance] = useState(245000); // David's AustralianSuper
  const [spouseBalance, setSpouseBalance] = useState(198000); // Sarah's REST Super
  const [salary, setSalary] = useState(120000);
  const [spouseSalary, setSpouseSalary] = useState(65000);
  const [voluntaryContrib, setVoluntaryContrib] = useState(5000);
  const [spouseVoluntary, setSpouseVoluntary] = useState(2000);
  const [investmentReturn, setInvestmentReturn] = useState(7.0);
  const [inflation, setInflation] = useState(3.0);
  const [salaryGrowth, setSalaryGrowth] = useState(2.5);

  const projections = useMemo(() => {
    const years = retirementAge - currentAge;
    const data = [];
    let bal = superBalance;
    let sBal = spouseBalance;
    let sal = salary;
    let sSal = spouseSalary;
    const realReturn = (investmentReturn - inflation) / 100;
    const sgRate = SG_RATE / 100;
    const growthRate = salaryGrowth / 100;

    for (let y = 0; y <= years; y++) {
      const age = currentAge + y;
      data.push({
        age,
        year: new Date().getFullYear() + y,
        primary: Math.round(bal),
        spouse: Math.round(sBal),
        combined: Math.round(bal + sBal),
      });

      if (y < years) {
        // Employer SG contributions
        const sgPrimary = Math.min(sal * sgRate, CONCESSIONAL_CAP);
        const sgSpouse = Math.min(sSal * sgRate, CONCESSIONAL_CAP);

        // Total contributions (employer + voluntary)
        const contribPrimary = sgPrimary + voluntaryContrib;
        const contribSpouse = sgSpouse + spouseVoluntary;

        // Grow balances
        bal = (bal + contribPrimary) * (1 + realReturn);
        sBal = (sBal + contribSpouse) * (1 + realReturn);

        // Salary growth
        sal *= (1 + growthRate);
        sSal *= (1 + growthRate);
      }
    }
    return data;
  }, [currentAge, retirementAge, superBalance, spouseBalance, salary, spouseSalary, voluntaryContrib, spouseVoluntary, investmentReturn, inflation, salaryGrowth]);

  const finalCombined = projections[projections.length - 1]?.combined || 0;
  const finalPrimary = projections[projections.length - 1]?.primary || 0;
  const finalSpouse = projections[projections.length - 1]?.spouse || 0;
  const totalGrowth = finalCombined - (superBalance + spouseBalance);
  const yearsToRetire = retirementAge - currentAge;
  const annualSG = Math.min(salary * (SG_RATE / 100), CONCESSIONAL_CAP);
  const spouseAnnualSG = Math.min(spouseSalary * (SG_RATE / 100), CONCESSIONAL_CAP);

  const content = (
    <div className="space-y-6" data-testid="sg-calculator-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-[#D4A84C]" />
            Superannuation Projection Calculator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Project your personal super & SMSF balance to retirement
          </p>
        </div>
        <Badge className="bg-[#1a2744] text-sm px-3 py-1">SG Rate: {SG_RATE}%</Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-[#1a2744] text-white">
          <CardContent className="p-4">
            <p className="text-xs text-white/70">Combined at Retirement</p>
            <p className="text-xl font-bold text-[#D4A84C]">{formatCurrency(finalCombined)}</p>
            <p className="text-xs text-white/50">Age {retirementAge}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Growth</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalGrowth)}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />{((totalGrowth / (superBalance + spouseBalance)) * 100).toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Current Combined</p>
            <p className="text-xl font-bold">{formatCurrency(superBalance + spouseBalance)}</p>
            <p className="text-xs text-muted-foreground">{yearsToRetire} years to go</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Annual SG (Combined)</p>
            <p className="text-xl font-bold">{formatCurrency(annualSG + spouseAnnualSG)}</p>
            <p className="text-xs text-muted-foreground">Employer contributions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Your Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Current Age</Label>
                <Input type="number" value={currentAge} onChange={(e) => setCurrentAge(+e.target.value)} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Retirement Age</Label>
                <Input type="number" value={retirementAge} onChange={(e) => setRetirementAge(+e.target.value)} className="h-8" />
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">PRIMARY (DAVID)</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Super Balance</Label>
                  <Input type="number" value={superBalance} onChange={(e) => setSuperBalance(+e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">Annual Salary (OTE)</Label>
                  <Input type="number" value={salary} onChange={(e) => setSalary(+e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">Voluntary Contributions p.a.</Label>
                  <Input type="number" value={voluntaryContrib} onChange={(e) => setVoluntaryContrib(+e.target.value)} className="h-8" />
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">SPOUSE (SARAH)</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Super Balance</Label>
                  <Input type="number" value={spouseBalance} onChange={(e) => setSpouseBalance(+e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">Annual Salary (OTE)</Label>
                  <Input type="number" value={spouseSalary} onChange={(e) => setSpouseSalary(+e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">Voluntary Contributions p.a.</Label>
                  <Input type="number" value={spouseVoluntary} onChange={(e) => setSpouseVoluntary(+e.target.value)} className="h-8" />
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">ASSUMPTIONS</p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Return %</Label>
                    <Input type="number" step="0.1" value={investmentReturn} onChange={(e) => setInvestmentReturn(+e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Inflation %</Label>
                    <Input type="number" step="0.1" value={inflation} onChange={(e) => setInflation(+e.target.value)} className="h-8" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Salary Growth %</Label>
                  <Input type="number" step="0.1" value={salaryGrowth} onChange={(e) => setSalaryGrowth(+e.target.value)} className="h-8" />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Concessional cap: {formatCurrency(CONCESSIONAL_CAP)}/yr</p>
                  <p className="mt-1">Returns shown in real (inflation-adjusted) terms. SG rate: {SG_RATE}% from 1 July 2025.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" /> Super Balance Projection
            </CardTitle>
            <CardDescription>
              Projected super balance from age {currentAge} to {retirementAge} (real terms)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer height={380}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={projections} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sgPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1a2744" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#1a2744" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="sgSpouse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4A84C" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#D4A84C" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    labelFormatter={(v) => `Age ${v}`}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="primary" name="David (Primary)" stroke="#1a2744" fill="url(#sgPrimary)" strokeWidth={2} />
                  <Area type="monotone" dataKey="spouse" name="Sarah (Spouse)" stroke="#D4A84C" fill="url(#sgSpouse)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projection Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Year-by-Year Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="super-projection-table">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium text-muted-foreground">Age</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground">Year</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground text-right">David</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground text-right">Sarah</th>
                  <th className="py-2 font-medium text-muted-foreground text-right">Combined</th>
                </tr>
              </thead>
              <tbody>
                {projections.filter((_, i) => i === 0 || i === projections.length - 1 || i % 3 === 0).map((row) => (
                  <tr key={row.age} className={`border-b ${row.age === retirementAge ? 'bg-green-50 font-bold' : ''}`}>
                    <td className="py-1.5 pr-4">{row.age}</td>
                    <td className="py-1.5 pr-4">{row.year}</td>
                    <td className="py-1.5 pr-4 text-right">{formatCurrency(row.primary)}</td>
                    <td className="py-1.5 pr-4 text-right">{formatCurrency(row.spouse)}</td>
                    <td className="py-1.5 text-right font-medium">{formatCurrency(row.combined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default SuperannuationGuarantee;
