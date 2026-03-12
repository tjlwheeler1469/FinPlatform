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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Link2,
  Unlink,
  RefreshCw,
  Shield,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  DollarSign,
  FileText,
  Download,
  Upload,
  Database,
  Settings,
  Clock,
  Building2,
  Users,
  ArrowRight,
  Lock,
  Key
} from "lucide-react";
import { usePortfolio } from "@/App";
import { toast } from "sonner";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";

// Accounting software configurations
const ACCOUNTING_APPS = {
  xero: {
    id: "xero",
    name: "Xero",
    logo: "📊",
    color: "#13B5EA",
    description: "Cloud accounting software for small business",
    website: "https://www.xero.com/au/",
    developerPortal: "https://developer.xero.com/",
    features: ["Invoices", "Bank Feeds", "Contacts", "Reports", "BAS", "Payroll"],
    scopes: ["accounting.transactions.read", "accounting.contacts.read", "accounting.reports.read"]
  },
  myob: {
    id: "myob",
    name: "MYOB",
    logo: "📈",
    color: "#6B21A8",
    description: "Business management & accounting software",
    website: "https://www.myob.com/au",
    developerPortal: "https://developer.myob.com/",
    features: ["Accounts", "Banking", "Contacts", "Reports", "Payroll", "Inventory"],
    scopes: ["CompanyFile", "GeneralLedger", "Banking", "Contacts"]
  }
};

// Mock connected data for demo
const MOCK_XERO_DATA = {
  organisation: {
    name: "Wheeler Family Trust",
    legalName: "Wheeler Family Discretionary Trust",
    abn: "12 345 678 901",
    basReportingFrequency: "QUARTERLY"
  },
  accounts: [
    { id: "acc_1", name: "Business Bank Account", code: "1-1100", type: "BANK", balance: 45230.00 },
    { id: "acc_2", name: "Accounts Receivable", code: "1-1200", type: "CURRENT", balance: 12500.00 },
    { id: "acc_3", name: "Accounts Payable", code: "2-1100", type: "CURRLIAB", balance: -8750.00 },
    { id: "acc_4", name: "GST Collected", code: "2-1200", type: "CURRLIAB", balance: -4521.00 },
    { id: "acc_5", name: "GST Paid", code: "1-1300", type: "CURRENT", balance: 2345.00 },
  ],
  invoices: {
    outstanding: 12500,
    overdue: 3200,
    count: 8
  },
  bills: {
    outstanding: 8750,
    overdue: 1500,
    count: 12
  }
};

const MOCK_MYOB_DATA = {
  companyFile: {
    name: "Wheeler Property Holdings",
    abn: "98 765 432 109",
    lastAccessed: new Date(Date.now() - 86400000).toISOString()
  },
  accounts: [
    { id: "1-1000", name: "NAB Business Account", type: "Bank", balance: 32150.00 },
    { id: "1-2000", name: "Trade Debtors", type: "Asset", balance: 8900.00 },
    { id: "2-1000", name: "Trade Creditors", type: "Liability", balance: -5600.00 },
    { id: "2-2000", name: "GST Liabilities", type: "Liability", balance: -3200.00 },
  ]
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2
  }).format(value);
};

const AccountingIntegrations = () => {
  const { setPortfolio } = usePortfolio();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [connections, setConnections] = useState({
    xero: { connected: false, data: null, lastSynced: null },
    myob: { connected: false, data: null, lastSynced: null }
  });
  const [connecting, setConnecting] = useState(null);
  const [syncing, setSyncing] = useState(null);
  const [sandboxMode, setSandboxMode] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Load saved connections from localStorage
  useEffect(() => {
    const savedConnections = localStorage.getItem('wheeler_accounting_connections');
    if (savedConnections) {
      setConnections(JSON.parse(savedConnections));
    }
  }, []);

  // Save connections to localStorage
  useEffect(() => {
    localStorage.setItem('wheeler_accounting_connections', JSON.stringify(connections));
  }, [connections]);

  // Simulate OAuth connection flow
  const handleConnect = async (appId) => {
    setConnecting(appId);
    
    // Simulate OAuth redirect and callback
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    if (sandboxMode) {
      const mockData = appId === 'xero' ? MOCK_XERO_DATA : MOCK_MYOB_DATA;
      
      setConnections(prev => ({
        ...prev,
        [appId]: {
          connected: true,
          data: mockData,
          lastSynced: new Date().toISOString(),
          accessToken: `sandbox_${appId}_${Date.now()}` // Mock token
        }
      }));
      
      toast.success(`Connected to ${ACCOUNTING_APPS[appId].name} (Sandbox Mode)`);
    }
    
    setConnecting(null);
  };

  // Disconnect
  const handleDisconnect = (appId) => {
    setConnections(prev => ({
      ...prev,
      [appId]: { connected: false, data: null, lastSynced: null }
    }));
    toast.success(`Disconnected from ${ACCOUNTING_APPS[appId].name}`);
  };

  // Sync data
  const handleSync = async (appId) => {
    setSyncing(appId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setConnections(prev => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        lastSynced: new Date().toISOString()
      }
    }));
    
    toast.success(`Synced with ${ACCOUNTING_APPS[appId].name}`);
    setSyncing(null);
  };

  // Import data to portfolio
  const handleImport = (appId) => {
    const conn = connections[appId];
    if (!conn.connected || !conn.data) return;

    if (appId === 'xero') {
      const bankBalance = conn.data.accounts
        .filter(a => a.type === 'BANK')
        .reduce((sum, a) => sum + a.balance, 0);
      
      setPortfolio(prev => ({
        ...prev,
        company: {
          ...prev.company,
          name: conn.data.organisation.name,
          abn: conn.data.organisation.abn
        },
        investments: {
          ...prev.investments,
          cash_savings: (prev.investments?.cash_savings || 0) + bankBalance
        }
      }));
      
      toast.success(`Imported ${formatCurrency(bankBalance)} from Xero`);
    } else if (appId === 'myob') {
      const bankBalance = conn.data.accounts
        .filter(a => a.type === 'Bank')
        .reduce((sum, a) => sum + a.balance, 0);
      
      setPortfolio(prev => ({
        ...prev,
        investments: {
          ...prev.investments,
          cash_savings: (prev.investments?.cash_savings || 0) + bankBalance
        }
      }));
      
      toast.success(`Imported ${formatCurrency(bankBalance)} from MYOB`);
    }
  };

  const connectedCount = Object.values(connections).filter(c => c.connected).length;

  return (
    <Layout>
      <div className="space-y-6" data-testid="accounting-integrations-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Accounting Integrations
            </h1>
            <p className="text-muted-foreground mt-1">
              Connect Xero or MYOB for automatic data sync
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
            {connectedCount > 0 && (
              <Badge variant="outline" className="text-[#10B981] border-[#10B981]">
                {connectedCount} Connected
              </Badge>
            )}
          </div>
        </div>

        {/* Sandbox Notice */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">OAuth Sandbox Mode</p>
                <p className="text-sm text-amber-700 mt-1">
                  This demonstrates the OAuth 2.0 integration flow. In production, you would register your app 
                  with Xero/MYOB to receive API credentials and enable live data sync.
                </p>
                <div className="flex gap-4 mt-3">
                  <a 
                    href="https://developer.xero.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-[#13B5EA] hover:underline"
                  >
                    Xero Developer Portal <ExternalLink className="h-3 w-3" />
                  </a>
                  <a 
                    href="https://developer.myob.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-[#6B21A8] hover:underline"
                  >
                    MYOB Developer Portal <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(ACCOUNTING_APPS).map(app => {
            const conn = connections[app.id];
            const isConnecting = connecting === app.id;
            const isSyncing = syncing === app.id;
            
            return (
              <Card key={app.id} className={conn.connected ? 'border-[#10B981]/50' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${app.color}15` }}
                      >
                        {app.logo}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <CardDescription>{app.description}</CardDescription>
                      </div>
                    </div>
                    {conn.connected && (
                      <Badge className="bg-[#10B981]">
                        <CheckCircle className="h-3 w-3 mr-1" /> Connected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {app.features.slice(0, 4).map(feature => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {app.features.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{app.features.length - 4} more
                      </Badge>
                    )}
                  </div>

                  {/* Connected State */}
                  {conn.connected && conn.data && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Organisation</span>
                        <span className="font-medium">
                          {app.id === 'xero' ? conn.data.organisation?.name : conn.data.companyFile?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Accounts</span>
                        <span className="font-medium">{conn.data.accounts?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Synced</span>
                        <span className="text-xs">
                          {conn.lastSynced ? new Date(conn.lastSynced).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!conn.connected ? (
                      <Button 
                        className="flex-1"
                        style={{ backgroundColor: app.color }}
                        onClick={() => handleConnect(app.id)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4 mr-2" />
                            Connect {app.name}
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleSync(app.id)}
                          disabled={isSyncing}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                          {isSyncing ? 'Syncing...' : 'Sync'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleImport(app.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Import
                        </Button>
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDisconnect(app.id)}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Data Preview - When Connected */}
        {(connections.xero.connected || connections.myob.connected) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Synced Data Preview</CardTitle>
              <CardDescription>View data from connected accounting software</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={connections.xero.connected ? "xero" : "myob"}>
                <TabsList>
                  {connections.xero.connected && (
                    <TabsTrigger value="xero">Xero</TabsTrigger>
                  )}
                  {connections.myob.connected && (
                    <TabsTrigger value="myob">MYOB</TabsTrigger>
                  )}
                </TabsList>

                {connections.xero.connected && connections.xero.data && (
                  <TabsContent value="xero" className="space-y-4">
                    {/* Xero Organisation Info */}
                    <div className="p-4 rounded-lg bg-[#13B5EA]/5 border border-[#13B5EA]/20">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Organisation</p>
                          <p className="font-semibold">{connections.xero.data.organisation.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ABN</p>
                          <p className="font-medium">{connections.xero.data.organisation.abn}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">BAS Frequency</p>
                          <p className="font-medium">{connections.xero.data.organisation.basReportingFrequency}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Accounts</p>
                          <p className="font-medium">{connections.xero.data.accounts.length}</p>
                        </div>
                      </div>
                    </div>

                    {/* Xero Accounts Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3">Code</th>
                            <th className="text-left p-3">Account Name</th>
                            <th className="text-left p-3">Type</th>
                            <th className="text-right p-3">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {connections.xero.data.accounts.map(acc => (
                            <tr key={acc.id} className="border-t">
                              <td className="p-3 font-mono text-xs">{acc.code}</td>
                              <td className="p-3">{acc.name}</td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-xs">{acc.type}</Badge>
                              </td>
                              <td className={`p-3 text-right font-medium ${acc.balance < 0 ? 'text-destructive' : ''}`}>
                                {formatCurrency(acc.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                )}

                {connections.myob.connected && connections.myob.data && (
                  <TabsContent value="myob" className="space-y-4">
                    {/* MYOB Company Info */}
                    <div className="p-4 rounded-lg bg-[#6B21A8]/5 border border-[#6B21A8]/20">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Company File</p>
                          <p className="font-semibold">{connections.myob.data.companyFile.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ABN</p>
                          <p className="font-medium">{connections.myob.data.companyFile.abn}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Accounts</p>
                          <p className="font-medium">{connections.myob.data.accounts.length}</p>
                        </div>
                      </div>
                    </div>

                    {/* MYOB Accounts Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3">Account ID</th>
                            <th className="text-left p-3">Account Name</th>
                            <th className="text-left p-3">Type</th>
                            <th className="text-right p-3">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {connections.myob.data.accounts.map(acc => (
                            <tr key={acc.id} className="border-t">
                              <td className="p-3 font-mono text-xs">{acc.id}</td>
                              <td className="p-3">{acc.name}</td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-xs">{acc.type}</Badge>
                              </td>
                              <td className={`p-3 text-right font-medium ${acc.balance < 0 ? 'text-destructive' : ''}`}>
                                {formatCurrency(acc.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-5 w-5" /> Production Setup
            </CardTitle>
            <CardDescription>Steps to enable live integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Xero Setup */}
              <div className="space-y-3">
                <h4 className="font-semibold text-[#13B5EA]">Xero Setup</h4>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#13B5EA]/10 text-[#13B5EA] text-xs flex items-center justify-center flex-shrink-0">1</span>
                    Register at developer.xero.com
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#13B5EA]/10 text-[#13B5EA] text-xs flex items-center justify-center flex-shrink-0">2</span>
                    Create a new app (Web App type)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#13B5EA]/10 text-[#13B5EA] text-xs flex items-center justify-center flex-shrink-0">3</span>
                    Add redirect URI: /api/xero/callback
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#13B5EA]/10 text-[#13B5EA] text-xs flex items-center justify-center flex-shrink-0">4</span>
                    Add XERO_CLIENT_ID and XERO_CLIENT_SECRET to .env
                  </li>
                </ol>
              </div>

              {/* MYOB Setup */}
              <div className="space-y-3">
                <h4 className="font-semibold text-[#6B21A8]">MYOB Setup</h4>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#6B21A8]/10 text-[#6B21A8] text-xs flex items-center justify-center flex-shrink-0">1</span>
                    Register at developer.myob.com
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#6B21A8]/10 text-[#6B21A8] text-xs flex items-center justify-center flex-shrink-0">2</span>
                    Create a new application
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#6B21A8]/10 text-[#6B21A8] text-xs flex items-center justify-center flex-shrink-0">3</span>
                    Add redirect URI: /api/myob/callback
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#6B21A8]/10 text-[#6B21A8] text-xs flex items-center justify-center flex-shrink-0">4</span>
                    Add MYOB_CLIENT_ID and MYOB_CLIENT_SECRET to .env
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default AccountingIntegrations;
