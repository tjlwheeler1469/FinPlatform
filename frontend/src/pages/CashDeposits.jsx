import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  PiggyBank, 
  DollarSign, 
  Percent,
  Calendar,
  Clock,
  Plus,
  Building2,
  TrendingUp,
  ArrowUpRight,
  Info,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

// Demo cash and term deposit data
const DEMO_ACCOUNTS = [
  {
    id: 1,
    name: "High Interest Savings",
    bank: "ING",
    type: "savings",
    balance: 45000,
    interestRate: 5.50,
    bonusRate: 0.55,
    effectiveRate: 5.50,
    interestEarned: 1850,
    lastInterestPaid: "2025-11-30"
  },
  {
    id: 2,
    name: "Emergency Fund",
    bank: "Ubank",
    type: "savings",
    balance: 25000,
    interestRate: 5.10,
    bonusRate: 0,
    effectiveRate: 5.10,
    interestEarned: 980,
    lastInterestPaid: "2025-11-30"
  }
];

const DEMO_TERM_DEPOSITS = [
  {
    id: 1,
    name: "12 Month TD",
    bank: "Judo Bank",
    principal: 100000,
    interestRate: 5.15,
    term: 12,
    startDate: "2025-01-15",
    maturityDate: "2026-01-15",
    interestAtMaturity: 5150,
    status: "active"
  },
  {
    id: 2,
    name: "6 Month TD",
    bank: "Macquarie",
    principal: 50000,
    interestRate: 4.95,
    term: 6,
    startDate: "2025-09-01",
    maturityDate: "2026-03-01",
    interestAtMaturity: 1237.50,
    status: "active"
  },
  {
    id: 3,
    name: "9 Month TD",
    bank: "BOQ",
    principal: 30000,
    interestRate: 5.05,
    term: 9,
    startDate: "2025-06-15",
    maturityDate: "2026-03-15",
    interestAtMaturity: 1136.25,
    status: "active"
  }
];

const BEST_RATES = [
  { bank: "Judo Bank", rate: 5.25, term: "12 months" },
  { bank: "ING", rate: 5.50, term: "Savings (conditional)" },
  { bank: "Ubank", rate: 5.10, term: "Savings" },
  { bank: "Rabobank", rate: 5.15, term: "9 months" },
  { bank: "ME Bank", rate: 4.95, term: "6 months" }
];

const CashDeposits = () => {
  const [accounts, setAccounts] = useState(DEMO_ACCOUNTS);
  const [termDeposits, setTermDeposits] = useState(DEMO_TERM_DEPOSITS);
  const [activeTab, setActiveTab] = useState("overview");

  const totalSavings = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalTermDeposits = termDeposits.reduce((sum, td) => sum + td.principal, 0);
  const totalCash = totalSavings + totalTermDeposits;
  const avgSavingsRate = accounts.reduce((sum, a) => sum + a.effectiveRate, 0) / accounts.length;
  const avgTDRate = termDeposits.reduce((sum, td) => sum + td.interestRate, 0) / termDeposits.length;
  const totalInterestEarned = accounts.reduce((sum, a) => sum + a.interestEarned, 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getMaturityProgress = (startDate, maturityDate) => {
    const start = new Date(startDate);
    const end = new Date(maturityDate);
    const now = new Date();
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now - start) / (1000 * 60 * 60 * 24);
    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  };

  const getDaysToMaturity = (maturityDate) => {
    const now = new Date();
    const maturity = new Date(maturityDate);
    const days = Math.ceil((maturity - now) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="cash-deposits-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <PiggyBank className="h-7 w-7 text-[#D4A84C]" />
              Cash & Term Deposits
            </h1>
            <p className="text-muted-foreground mt-1">
              High-interest savings accounts and term deposits
            </p>
          </div>
          <Button className="bg-[#1a2744] hover:bg-[#1a2744]/90" data-testid="new-deposit-btn">
            <Plus className="h-4 w-4 mr-2" />
            New Term Deposit
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cash</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalCash)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Savings Rate</p>
                  <p className="text-2xl font-bold">{avgSavingsRate.toFixed(2)}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Percent className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">TD Rate (Avg)</p>
                  <p className="text-2xl font-bold">{avgTDRate.toFixed(2)}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interest Earned (YTD)</p>
                  <p className="text-2xl font-bold text-emerald-600">+{formatCurrency(totalInterestEarned)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="savings">Savings Accounts</TabsTrigger>
            <TabsTrigger value="term-deposits">Term Deposits</TabsTrigger>
            <TabsTrigger value="rates">Best Rates</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Savings Accounts</CardTitle>
                  <CardDescription>Total: {formatCurrency(totalSavings)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {accounts.map((account) => (
                      <div key={account.id} className="p-3 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-sm text-muted-foreground">{account.bank}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(account.balance)}</p>
                            <p className="text-sm text-emerald-600">{account.effectiveRate}% p.a.</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Term Deposits</CardTitle>
                  <CardDescription>Total: {formatCurrency(totalTermDeposits)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {termDeposits.map((td) => (
                      <div key={td.id} className="p-3 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{td.name}</p>
                            <p className="text-sm text-muted-foreground">{td.bank}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(td.principal)}</p>
                            <p className="text-sm text-emerald-600">{td.interestRate}% p.a.</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{getDaysToMaturity(td.maturityDate)} days to maturity</span>
                            <span>+{formatCurrency(td.interestAtMaturity)}</span>
                          </div>
                          <Progress value={getMaturityProgress(td.startDate, td.maturityDate)} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Savings Tab */}
          <TabsContent value="savings">
            <Card>
              <CardHeader>
                <CardTitle>Savings Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="p-4 rounded-lg border" data-testid={`savings-${account.id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{account.name}</h4>
                            <Badge variant="outline">{account.bank}</Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Base Rate</p>
                              <p className="font-medium">{account.interestRate}%</p>
                            </div>
                            {account.bonusRate > 0 && (
                              <div>
                                <p className="text-muted-foreground">Bonus Rate</p>
                                <p className="font-medium text-emerald-600">+{account.bonusRate}%</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground">Interest Earned</p>
                              <p className="font-medium text-emerald-600">+{formatCurrency(account.interestEarned)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>
                          <p className="text-sm text-muted-foreground">
                            Last paid: {new Date(account.lastInterestPaid).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Term Deposits Tab */}
          <TabsContent value="term-deposits">
            <Card>
              <CardHeader>
                <CardTitle>Term Deposits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {termDeposits.map((td) => (
                    <div key={td.id} className="p-4 rounded-lg border" data-testid={`td-${td.id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{td.name}</h4>
                            <Badge variant="outline">{td.bank}</Badge>
                            <Badge className="bg-emerald-100 text-emerald-800">{td.term} months</Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Interest Rate</p>
                              <p className="font-medium">{td.interestRate}% p.a.</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Start Date</p>
                              <p className="font-medium">{new Date(td.startDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Maturity Date</p>
                              <p className="font-medium">{new Date(td.maturityDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Interest at Maturity</p>
                              <p className="font-medium text-emerald-600">+{formatCurrency(td.interestAtMaturity)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{formatCurrency(td.principal)}</p>
                          <p className="text-sm text-muted-foreground">
                            {getDaysToMaturity(td.maturityDate)} days remaining
                          </p>
                        </div>
                      </div>
                      <Progress value={getMaturityProgress(td.startDate, td.maturityDate)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Best Rates Tab */}
          <TabsContent value="rates">
            <Card>
              <CardHeader>
                <CardTitle>Best Available Rates</CardTitle>
                <CardDescription>Current market rates for savings and term deposits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {BEST_RATES.map((rate, index) => (
                    <div key={`item-${index}`} className="p-4 rounded-lg border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{rate.bank}</p>
                          <p className="text-sm text-muted-foreground">{rate.term}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600">{rate.rate}%</p>
                        <p className="text-xs text-muted-foreground">p.a.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CashDeposits;
