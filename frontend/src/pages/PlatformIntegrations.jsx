import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Cable, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock, Download, Upload,
  ArrowLeftRight, Database, Users, Building2, Shield, Activity, FileText, Wallet,
  Link2, Unlink, Eye, BarChart3, Server
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PLATFORM_ICONS = {
  amp_north: '🔷',
  netwealth: '🟢',
  hub24: '🔶',
  class: '🟣',
  iress: '🔵'
};

const PLATFORM_COLORS = {
  amp_north: '#0066cc',
  netwealth: '#00a651',
  hub24: '#ff6600',
  class: '#7c3aed',
  iress: '#2563eb'
};

export default function PlatformIntegrations() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [platforms, setPlatforms] = useState([]);
  const [connections, setConnections] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [platformClients, setPlatformClients] = useState([]);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [platformsRes, statusRes, logsRes, clientsRes, portfolioRes] = await Promise.all([
        fetch(`${API_URL}/api/platforms/available`).then(r => r.json()),
        fetch(`${API_URL}/api/platforms/status`).then(r => r.json()),
        fetch(`${API_URL}/api/platforms/sync-logs?limit=20`).then(r => r.json()),
        fetch(`${API_URL}/api/platforms/demo/all-clients`).then(r => r.json()),
        fetch(`${API_URL}/api/platforms/demo/portfolio-summary`).then(r => r.json())
      ]);
      
      setPlatforms(platformsRes.platforms || []);
      setConnections(statusRes.connections || []);
      setSyncLogs(logsRes.logs || []);
      setAllClients(clientsRes.clients || []);
      setPortfolioSummary(portfolioRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const connectToPlatform = async (platformId) => {
    try {
      const response = await fetch(`${API_URL}/api/platforms/connect/${platformId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      
      if (data.status === 'connected') {
        loadData();
        setShowConnectDialog(false);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const disconnectPlatform = async (platformId) => {
    try {
      await fetch(`${API_URL}/api/platforms/disconnect/${platformId}`, {
        method: 'DELETE'
      });
      loadData();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const syncPlatform = async (platformId) => {
    try {
      await fetch(`${API_URL}/api/platforms/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformId,
          data_categories: ['client', 'portfolio', 'balance'],
          direction: 'bidirectional'
        })
      });
      loadData();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const loadPlatformClients = async (platformId) => {
    try {
      const response = await fetch(`${API_URL}/api/platforms/${platformId}/clients`);
      const data = await response.json();
      setPlatformClients(data.clients || []);
      setSelectedPlatform(platformId);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const formatCurrency = (value) => `AUD $${(value || 0).toLocaleString()}`;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-500"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Syncing</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Disconnected</Badge>;
    }
  };

  const getConnectionForPlatform = (platformId) => {
    return connections.find(c => c.platform === platformId);
  };

  return (
    <Layout>
      <div className="space-y-6 p-6" data-testid="platform-integrations">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Cable className="h-8 w-8 text-primary" />
              Platform Integrations
            </h1>
            <p className="text-muted-foreground mt-1">
              Bi-directional data sync with AMP North, Netwealth, Hub24, Class, IRESS
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Platforms Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platforms.length}</div>
              <p className="text-xs text-muted-foreground">All support bi-directional sync</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {connections.filter(c => c.status === 'connected').length}
              </div>
              <p className="text-xs text-muted-foreground">Active connections</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allClients.length}</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total AUM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(portfolioSummary?.total_aum)}
              </div>
              <p className="text-xs text-muted-foreground">{portfolioSummary?.total_portfolios || 0} portfolios</p>
            </CardContent>
          </Card>
        </div>

        {/* Bi-directional Data Flow Info */}
        <Alert>
          <ArrowLeftRight className="h-4 w-4" />
          <AlertTitle>Bi-Directional Data Flow</AlertTitle>
          <AlertDescription>
            <strong>READ:</strong> Pull clients, portfolios, transactions, balances from platforms.{' '}
            <strong>WRITE:</strong> Push scenarios, file notes, retirement projections back to platforms.{' '}
            All sync operations are logged for audit compliance.
          </AlertDescription>
        </Alert>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="overview-tab">
              <Server className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="connections" data-testid="connections-tab">
              <Link2 className="h-4 w-4 mr-2" /> Connections
            </TabsTrigger>
            <TabsTrigger value="clients" data-testid="clients-tab">
              <Users className="h-4 w-4 mr-2" /> Clients
            </TabsTrigger>
            <TabsTrigger value="portfolios" data-testid="portfolios-tab">
              <Wallet className="h-4 w-4 mr-2" /> Portfolios
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="logs-tab">
              <Activity className="h-4 w-4 mr-2" /> Sync Logs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platforms.map((platform) => {
                const connection = getConnectionForPlatform(platform.platform_id);
                const isConnected = connection?.status === 'connected';
                
                return (
                  <Card key={platform.platform_id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">{PLATFORM_ICONS[platform.platform_id]}</span>
                          {platform.name}
                        </CardTitle>
                        {getStatusBadge(connection?.status)}
                      </div>
                      <CardDescription>{platform.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Capabilities */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">READ Capabilities</p>
                          <div className="flex flex-wrap gap-1">
                            {platform.read_capabilities.slice(0, 4).map(cap => (
                              <Badge key={cap} variant="outline" className="text-xs">
                                <Download className="h-2 w-2 mr-1" /> {cap}
                              </Badge>
                            ))}
                            {platform.read_capabilities.length > 4 && (
                              <Badge variant="outline" className="text-xs">+{platform.read_capabilities.length - 4}</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">WRITE Capabilities</p>
                          <div className="flex flex-wrap gap-1">
                            {platform.write_capabilities.map(cap => (
                              <Badge key={cap} variant="secondary" className="text-xs">
                                <Upload className="h-2 w-2 mr-1" /> {cap}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Stats */}
                        {isConnected && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Clients:</span>{' '}
                              <span className="font-medium">{connection.clients_synced || 0}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Mode:</span>{' '}
                              <Badge variant="outline" className="text-xs">{connection.mode || 'demo'}</Badge>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          {isConnected ? (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => syncPlatform(platform.platform_id)}
                                className="flex-1"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" /> Sync
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => loadPlatformClients(platform.platform_id)}
                              >
                                <Eye className="h-3 w-3 mr-1" /> View
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => disconnectPlatform(platform.platform_id)}
                              >
                                <Unlink className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => connectToPlatform(platform.platform_id)}
                              className="w-full"
                            >
                              <Link2 className="h-3 w-3 mr-1" /> Connect (Demo)
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Connections</CardTitle>
                <CardDescription>Manage your platform connections and sync settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Connected At</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead>Clients</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connections.map((conn) => (
                      <TableRow key={conn.platform}>
                        <TableCell className="font-medium">
                          <span className="mr-2">{PLATFORM_ICONS[conn.platform]}</span>
                          {conn.name}
                        </TableCell>
                        <TableCell>{getStatusBadge(conn.status)}</TableCell>
                        <TableCell>
                          <Badge variant={conn.mode === 'production' ? 'default' : 'secondary'}>
                            {conn.mode || 'demo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {conn.connected_at ? new Date(conn.connected_at).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {conn.last_sync ? new Date(conn.last_sync).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell>{conn.clients_synced || 0}</TableCell>
                        <TableCell className="text-right">
                          {conn.status === 'connected' ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => syncPlatform(conn.platform)}>
                                <RefreshCw className="h-3 w-3 mr-1" /> Sync
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => disconnectPlatform(conn.platform)}>
                                <Unlink className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => connectToPlatform(conn.platform)}>
                              <Link2 className="h-3 w-3 mr-1" /> Connect
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {connections.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No connections yet. Connect to a platform from the Overview tab.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Platform Clients</CardTitle>
                    <CardDescription>Clients synced from all connected platforms</CardDescription>
                  </div>
                  <Badge variant="outline">{allClients.length} total</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>Client ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Risk Profile</TableHead>
                      <TableHead className="text-right">Total Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allClients.map((client, idx) => (
                      <TableRow key={`${client.platform}-${client.client_id}-${idx}`}>
                        <TableCell>
                          <Badge 
                            style={{ backgroundColor: PLATFORM_COLORS[client.platform] + '20', color: PLATFORM_COLORS[client.platform] }}
                          >
                            {PLATFORM_ICONS[client.platform]} {client.platform_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{client.client_id}</TableCell>
                        <TableCell className="font-medium">{client.name || client.fund_name}</TableCell>
                        <TableCell>
                          {client.risk_profile && (
                            <Badge variant="outline">{client.risk_profile}</Badge>
                          )}
                          {client.compliance_status && (
                            <Badge className="bg-green-100 text-green-700">{client.compliance_status}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(client.total_balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolios Tab */}
          <TabsContent value="portfolios" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Portfolio Summary</CardTitle>
                    <CardDescription>All portfolios across connected platforms</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatCurrency(portfolioSummary?.total_aum)}</div>
                    <p className="text-sm text-muted-foreground">Total AUM</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>Client ID</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account Type</TableHead>
                      <TableHead>Holdings</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(portfolioSummary?.portfolios || []).map((portfolio, idx) => (
                      <TableRow key={`item-${idx}`}>
                        <TableCell>
                          <Badge 
                            style={{ backgroundColor: PLATFORM_COLORS[portfolio.platform] + '20', color: PLATFORM_COLORS[portfolio.platform] }}
                          >
                            {PLATFORM_ICONS[portfolio.platform]} {portfolio.platform_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{portfolio.client_id}</TableCell>
                        <TableCell className="font-medium">{portfolio.account_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{portfolio.account_type?.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>{portfolio.holdings_count} holdings</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(portfolio.total_value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sync Audit Logs</CardTitle>
                <CardDescription>All synchronization operations are logged for compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Log ID</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncLogs.map((log) => (
                        <TableRow key={log.log_id}>
                          <TableCell className="font-mono text-xs">{log.log_id}</TableCell>
                          <TableCell>
                            <span className="mr-1">{PLATFORM_ICONS[log.platform]}</span>
                            {log.platform}
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.direction === 'inbound' ? 'default' : log.direction === 'outbound' ? 'secondary' : 'outline'}>
                              {log.direction === 'inbound' && <Download className="h-3 w-3 mr-1" />}
                              {log.direction === 'outbound' && <Upload className="h-3 w-3 mr-1" />}
                              {log.direction === 'bidirectional' && <ArrowLeftRight className="h-3 w-3 mr-1" />}
                              {log.direction}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.category}</TableCell>
                          <TableCell>
                            <Badge className={log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.records_affected}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {syncLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No sync logs yet. Connect and sync a platform to see logs.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
