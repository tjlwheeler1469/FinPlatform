import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Landmark,
  Building2,
  Link2,
  Unlink,
  RefreshCw,
  Shield,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PiggyBank,
  BarChart3,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { usePortfolio } from "@/App";
import { toast } from "sonner";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";

// Australian banks supported (mock list - Plaid supports these in sandbox)
const SUPPORTED_BANKS = [
  { id: "cba", name: "Commonwealth Bank", logo: "🏦", color: "#FFCC00" },
  { id: "westpac", name: "Westpac", logo: "🏦", color: "#D5002B" },
  { id: "nab", name: "NAB", logo: "🏦", color: "#C4161C" },
  { id: "anz", name: "ANZ", logo: "🏦", color: "#007DBA" },
  { id: "macquarie", name: "Macquarie Bank", logo: "🏦", color: "#000000" },
  { id: "ing", name: "ING Australia", logo: "🏦", color: "#FF6200" },
  { id: "bendigo", name: "Bendigo Bank", logo: "🏦", color: "#BE1E2D" },
  { id: "bankwest", name: "Bankwest", logo: "🏦", color: "#E35205" },
];

// Mock connected accounts for demo
const MOCK_ACCOUNTS = [
  {
    id: "acc_1",
    institution: "Commonwealth Bank",
    institutionId: "cba",
    name: "Smart Access",
    type: "checking",
    balance: 12450.32,
    available: 12450.32,
    currency: "AUD",
    lastSynced: new Date(Date.now() - 3600000).toISOString(),
    mask: "4523"
  },
  {
    id: "acc_2",
    institution: "Commonwealth Bank",
    institutionId: "cba",
    name: "NetBank Saver",
    type: "savings",
    balance: 45230.00,
    available: 45230.00,
    currency: "AUD",
    lastSynced: new Date(Date.now() - 3600000).toISOString(),
    mask: "7821"
  },
  {
    id: "acc_3",
    institution: "Westpac",
    institutionId: "westpac",
    name: "Choice",
    type: "checking",
    balance: 3245.67,
    available: 3100.00,
    currency: "AUD",
    lastSynced: new Date(Date.now() - 7200000).toISOString(),
    mask: "9012"
  }
];

const MOCK_TRANSACTIONS = [
  { id: "txn_1", accountId: "acc_1", date: "2024-12-10", description: "Salary - Wheeler Corp", amount: 8500.00, type: "credit", category: "Income" },
  { id: "txn_2", accountId: "acc_1", date: "2024-12-09", description: "Woolworths", amount: -156.78, type: "debit", category: "Groceries" },
  { id: "txn_3", accountId: "acc_1", date: "2024-12-08", description: "Shell Fuel", amount: -89.50, type: "debit", category: "Transport" },
  { id: "txn_4", accountId: "acc_1", date: "2024-12-07", description: "Netflix", amount: -22.99, type: "debit", category: "Entertainment" },
  { id: "txn_5", accountId: "acc_2", date: "2024-12-05", description: "Interest Payment", amount: 45.23, type: "credit", category: "Interest" },
  { id: "txn_6", accountId: "acc_3", date: "2024-12-10", description: "Transfer from CBA", amount: 500.00, type: "credit", category: "Transfer" },
];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2
  }).format(value);
};

const BankFeeds = () => {
  const { updateBudget } = usePortfolio();
  
  const [activeTab, setActiveTab] = useState("accounts");
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(true);
  const [showBalances, setShowBalances] = useState(true);

  // Load mock data on mount (simulating Plaid sandbox)
  useEffect(() => {
    if (sandboxMode) {
      // Load from localStorage or use mock data
      const savedAccounts = localStorage.getItem('wheeler_bank_accounts');
      const savedTxns = localStorage.getItem('wheeler_bank_transactions');
      
      if (savedAccounts) {
        setConnectedAccounts(JSON.parse(savedAccounts));
        setTransactions(savedTxns ? JSON.parse(savedTxns) : []);
      }
    }
  }, [sandboxMode]);

  // Save to localStorage when accounts change
  useEffect(() => {
    if (connectedAccounts.length > 0) {
      localStorage.setItem('wheeler_bank_accounts', JSON.stringify(connectedAccounts));
      localStorage.setItem('wheeler_bank_transactions', JSON.stringify(transactions));
    }
  }, [connectedAccounts, transactions]);

  // Simulate Plaid Link connection
  const handleConnectBank = async (bank) => {
    setIsConnecting(true);
    setSelectedBank(bank);
    
    // Simulate Plaid Link flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (sandboxMode) {
      // Add mock accounts for the selected bank
      const newAccounts = MOCK_ACCOUNTS.filter(a => a.institutionId === bank.id)
        .map(a => ({ ...a, id: `${a.id}_${Date.now()}` }));
      
      if (newAccounts.length === 0) {
        // Create a generic account for banks without mock data
        newAccounts.push({
          id: `acc_${Date.now()}`,
          institution: bank.name,
          institutionId: bank.id,
          name: "Transaction Account",
          type: "checking",
          balance: Math.random() * 50000 + 1000,
          available: Math.random() * 50000 + 1000,
          currency: "AUD",
          lastSynced: new Date().toISOString(),
          mask: String(Math.floor(1000 + Math.random() * 9000))
        });
      }
      
      setConnectedAccounts(prev => [...prev, ...newAccounts]);
      setTransactions(prev => [...prev, ...MOCK_TRANSACTIONS.filter(t => 
        newAccounts.some(a => MOCK_ACCOUNTS.find(m => m.id === t.accountId)?.institutionId === bank.id)
      )]);
      
      toast.success(`Connected to ${bank.name} (Sandbox Mode)`);
    }
    
    setIsConnecting(false);
    setShowLinkModal(false);
    setSelectedBank(null);
  };

  // Disconnect account
  const handleDisconnect = (accountId) => {
    setConnectedAccounts(prev => prev.filter(a => a.id !== accountId));
    setTransactions(prev => prev.filter(t => t.accountId !== accountId));
    toast.success("Account disconnected");
  };

  // Sync accounts (refresh data)
  const handleSync = async () => {
    setSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update last synced time
    setConnectedAccounts(prev => prev.map(a => ({
      ...a,
      lastSynced: new Date().toISOString(),
      balance: a.balance + (Math.random() - 0.5) * 100 // Simulate small balance change
    })));
    
    toast.success("Accounts synced successfully");
    setSyncing(false);
  };

  // Import to budget
  const handleImportToBudget = () => {
    const totalBalance = connectedAccounts.reduce((sum, a) => sum + a.balance, 0);
    updateBudget({ cashBalance: totalBalance });
    toast.success(`Imported ${formatCurrency(totalBalance)} to budget`);
  };

  // Calculate totals
  const totalBalance = connectedAccounts.reduce((sum, a) => sum + a.balance, 0);
  const bankGroups = connectedAccounts.reduce((groups, account) => {
    const bank = account.institution;
    if (!groups[bank]) groups[bank] = [];
    groups[bank].push(account);
    return groups;
  }, {});

  return (
    <Layout>
      <div className="space-y-6" data-testid="bank-feeds-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Bank Feeds
            </h1>
            <p className="text-muted-foreground mt-1">
              Connect your bank accounts to automatically sync transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Sandbox Mode</Label>
              <Switch 
                checked={sandboxMode} 
                onCheckedChange={setSandboxMode}
                disabled
              />
            </div>
            {connectedAccounts.length > 0 && (
              <Button variant="outline" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync All'}
              </Button>
            )}
            <Button onClick={() => setShowLinkModal(true)} className="bg-[#1a2744]">
              <Plus className="h-4 w-4 mr-2" /> Connect Bank
            </Button>
          </div>
        </div>

        {/* Sandbox Notice */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Sandbox Mode Active</p>
                <p className="text-sm text-amber-700 mt-1">
                  This is a demonstration using Plaid Sandbox. In production, this would connect to real bank accounts 
                  using Plaid's secure Open Banking API. Add your Plaid API keys to enable live connections.
                </p>
                <a 
                  href="https://plaid.com/au/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-amber-800 hover:underline mt-2"
                >
                  Learn more about Plaid Australia <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {connectedAccounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#1a2744] text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/70">Total Balance</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-white/70 hover:text-white"
                    onClick={() => setShowBalances(!showBalances)}
                  >
                    {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {showBalances ? formatCurrency(totalBalance) : '••••••'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Connected Banks</p>
                <p className="text-2xl font-bold text-[#1a2744]">{Object.keys(bankGroups).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-2xl font-bold text-[#D4A84C]">{connectedAccounts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-[#10B981]">{transactions.length}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="accounts">
              <Landmark className="h-4 w-4 mr-1" /> Accounts
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <CreditCard className="h-4 w-4 mr-1" /> Transactions
            </TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            {connectedAccounts.length === 0 ? (
              <Card className="p-12 text-center">
                <Landmark className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No accounts connected</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your bank accounts to automatically import transactions and balances
                </p>
                <Button onClick={() => setShowLinkModal(true)} className="bg-[#1a2744]">
                  <Link2 className="h-4 w-4 mr-2" /> Connect Your First Bank
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(bankGroups).map(([bankName, accounts]) => (
                  <Card key={bankName}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-[#1a2744]" />
                          <CardTitle className="text-base">{bankName}</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-[#10B981] border-[#10B981]">
                          <CheckCircle className="h-3 w-3 mr-1" /> Connected
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {accounts.map(account => (
                          <div 
                            key={account.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                account.type === 'savings' ? 'bg-[#10B981]/10' : 'bg-[#3B82F6]/10'
                              }`}>
                                {account.type === 'savings' ? (
                                  <PiggyBank className="h-5 w-5 text-[#10B981]" />
                                ) : (
                                  <Wallet className="h-5 w-5 text-[#3B82F6]" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{account.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ••••{account.mask} • {account.type}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold">
                                  {showBalances ? formatCurrency(account.balance) : '••••••'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Synced {new Date(account.lastSynced).toLocaleTimeString()}
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDisconnect(account.id)}
                              >
                                <Unlink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleImportToBudget}>
                    <DollarSign className="h-4 w-4 mr-2" /> Import Balances to Budget
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            {transactions.length === 0 ? (
              <Card className="p-12 text-center">
                <CreditCard className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
                <p className="text-muted-foreground">
                  Connect a bank account to see your transactions
                </p>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Transactions</CardTitle>
                  <CardDescription>Last {transactions.length} transactions from connected accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {transactions.map(txn => (
                      <div 
                        key={txn.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            txn.type === 'credit' ? 'bg-[#10B981]/10' : 'bg-destructive/10'
                          }`}>
                            {txn.type === 'credit' ? (
                              <ArrowDownRight className="h-4 w-4 text-[#10B981]" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{txn.description}</p>
                            <p className="text-xs text-muted-foreground">{txn.date} • {txn.category}</p>
                          </div>
                        </div>
                        <p className={`font-bold ${txn.type === 'credit' ? 'text-[#10B981]' : 'text-foreground'}`}>
                          {txn.type === 'credit' ? '+' : ''}{formatCurrency(txn.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Bank Selection Modal */}
        {showLinkModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Connect a Bank</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowLinkModal(false)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Select your bank to securely connect</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isConnecting ? (
                  <div className="py-12 text-center">
                    <RefreshCw className="h-12 w-12 mx-auto animate-spin text-[#1a2744] mb-4" />
                    <p className="font-medium">Connecting to {selectedBank?.name}...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This is a sandbox simulation
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {SUPPORTED_BANKS.map(bank => {
                        const isConnected = connectedAccounts.some(a => a.institutionId === bank.id);
                        return (
                          <Button
                            key={bank.id}
                            variant="outline"
                            className={`h-auto py-4 flex flex-col items-center gap-2 ${isConnected ? 'opacity-50' : ''}`}
                            onClick={() => handleConnectBank(bank)}
                            disabled={isConnected}
                          >
                            <span className="text-2xl">{bank.logo}</span>
                            <span className="text-sm">{bank.name}</span>
                            {isConnected && (
                              <Badge variant="secondary" className="text-[10px]">Connected</Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Lock className="h-4 w-4 flex-shrink-0" />
                        <p>
                          Your credentials are never stored by this application. Plaid uses bank-level 
                          encryption and is trusted by millions of users worldwide.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default BankFeeds;
