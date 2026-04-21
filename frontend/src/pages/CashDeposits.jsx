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
  Trash2,
  Building2,
  TrendingUp,
  ArrowUpRight,
  Info,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

// Cash & TDs aligned with CLIENT_DATA.thompson_family: ING Emergency Fund $180k, Westpac 12m TD $350k
const DEMO_ACCOUNTS = [
  {
    id: 1,
    name: "Emergency Fund",
    bank: "ING",
    type: "savings",
    balance: 180000,
    interestRate: 5.50,
    bonusRate: 0.55,
    effectiveRate: 5.50,
    interestEarned: 7830,
    lastInterestPaid: "2025-11-30"
  }
];

const DEMO_TERM_DEPOSITS = [
  {
    id: 1,
    name: "12 Month TD",
    bank: "Westpac",
    principal: 350000,
    interestRate: 4.65,
    term: 12,
    startDate: "2025-01-15",
    maturityDate: "2026-01-15",
    interestAtMaturity: 16275,
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

const CashDeposits = ({ embedded = false }) => {
  const [accounts, setAccounts] = useState(DEMO_ACCOUNTS);
  const [termDeposits, setTermDeposits] = useState(DEMO_TERM_DEPOSITS);
  const [showTDDialog, setShowTDDialog] = useState(false);
  const [showSavingsDialog, setShowSavingsDialog] = useState(false);
  const emptyTD = { name: "", bank: "", principal: "", interestRate: "", term: 12, startDate: new Date().toISOString().split("T")[0] };
  const emptySavings = { name: "", bank: "", balance: "", interestRate: "" };
  const [newTD, setNewTD] = useState(emptyTD);
  const [newSavings, setNewSavings] = useState(emptySavings);

  const addTD = () => {
    if (!newTD.name || !newTD.principal) { toast.error("Name and principal required"); return; }
    const principal = parseFloat(newTD.principal);
    const rate = parseFloat(newTD.interestRate) || 0;
    const term = parseInt(newTD.term) || 12;
    const start = new Date(newTD.startDate);
    const maturity = new Date(start); maturity.setMonth(maturity.getMonth() + term);
    setTermDeposits([...termDeposits, {
      id: Math.max(0, ...termDeposits.map((t) => t.id)) + 1,
      ...newTD,
      principal, interestRate: rate, term,
      maturityDate: maturity.toISOString().split("T")[0],
      interestAtMaturity: Math.round(principal * rate / 100 * (term / 12)),
      status: "active",
    }]);
    setShowTDDialog(false);
    setNewTD(emptyTD);
    toast.success("Term deposit added");
  };

  const addSavings = () => {
    if (!newSavings.name || !newSavings.balance) { toast.error("Name and balance required"); return; }
    setAccounts([...accounts, {
      id: Math.max(0, ...accounts.map((a) => a.id)) + 1,
      ...newSavings,
      type: "savings",
      balance: parseFloat(newSavings.balance),
      interestRate: parseFloat(newSavings.interestRate) || 0,
      bonusRate: 0,
      effectiveRate: parseFloat(newSavings.interestRate) || 0,
      interestEarned: 0,
      lastInterestPaid: new Date().toISOString().split("T")[0],
    }]);
    setShowSavingsDialog(false);
    setNewSavings(emptySavings);
    toast.success("Savings account added");
  };

  const deleteTD = (id) => { if (window.confirm("Remove this TD?")) { setTermDeposits(termDeposits.filter((t) => t.id !== id)); toast.success("Removed"); } };
  const deleteSavings = (id) => { if (window.confirm("Remove this account?")) { setAccounts(accounts.filter((a) => a.id !== id)); toast.success("Removed"); } };
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

  const content = (
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
          <div className="flex gap-2">
            <Button variant="outline" data-testid="new-savings-btn" onClick={() => setShowSavingsDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Savings Account
            </Button>
            <Button className="bg-[#1a2744] hover:bg-[#1a2744]/90" data-testid="new-deposit-btn" onClick={() => setShowTDDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Term Deposit
            </Button>
          </div>
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
                          <div className="text-right flex flex-col items-end gap-1">
                            <div>
                              <p className="font-bold">{formatCurrency(account.balance)}</p>
                              <p className="text-sm text-emerald-600">{account.effectiveRate}% p.a.</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600" onClick={() => deleteSavings(account.id)} data-testid={`delete-savings-${account.id}`}><Trash2 className="h-3 w-3" /></Button>
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
                          <div className="text-right flex flex-col items-end gap-1">
                            <div>
                              <p className="font-bold">{formatCurrency(td.principal)}</p>
                              <p className="text-sm text-emerald-600">{td.interestRate}% p.a.</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600" onClick={() => deleteTD(td.id)} data-testid={`delete-td-${td.id}`}><Trash2 className="h-3 w-3" /></Button>
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

        {/* Savings Account Dialog */}
        {showSavingsDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSavingsDialog(false)}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">Add Savings Account</h2>
              <div className="space-y-3">
                <div><Label>Account Name *</Label><Input value={newSavings.name} onChange={(e) => setNewSavings({ ...newSavings, name: e.target.value })} data-testid="savings-name" /></div>
                <div><Label>Bank</Label><Input value={newSavings.bank} onChange={(e) => setNewSavings({ ...newSavings, bank: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Balance *</Label><Input type="number" value={newSavings.balance} onChange={(e) => setNewSavings({ ...newSavings, balance: e.target.value })} data-testid="savings-balance" /></div>
                  <div><Label>Interest %</Label><Input type="number" step="0.01" value={newSavings.interestRate} onChange={(e) => setNewSavings({ ...newSavings, interestRate: e.target.value })} /></div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowSavingsDialog(false)}>Cancel</Button>
                <Button className="flex-1 bg-[#1a2744]" onClick={addSavings} data-testid="confirm-add-savings">Add</Button>
              </div>
            </div>
          </div>
        )}

        {/* TD Dialog */}
        {showTDDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTDDialog(false)}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">New Term Deposit</h2>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={newTD.name} onChange={(e) => setNewTD({ ...newTD, name: e.target.value })} data-testid="td-name" placeholder="e.g. 12 Month TD" /></div>
                <div><Label>Bank</Label><Input value={newTD.bank} onChange={(e) => setNewTD({ ...newTD, bank: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Principal *</Label><Input type="number" value={newTD.principal} onChange={(e) => setNewTD({ ...newTD, principal: e.target.value })} data-testid="td-principal" /></div>
                  <div><Label>Interest %</Label><Input type="number" step="0.01" value={newTD.interestRate} onChange={(e) => setNewTD({ ...newTD, interestRate: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Term (months)</Label><Input type="number" value={newTD.term} onChange={(e) => setNewTD({ ...newTD, term: e.target.value })} /></div>
                  <div><Label>Start Date</Label><Input type="date" value={newTD.startDate} onChange={(e) => setNewTD({ ...newTD, startDate: e.target.value })} /></div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowTDDialog(false)}>Cancel</Button>
                <Button className="flex-1 bg-[#1a2744]" onClick={addTD} data-testid="confirm-add-td">Add TD</Button>
              </div>
            </div>
          </div>
        )}
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default CashDeposits;
