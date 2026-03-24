import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  RefreshCw, Database, Users, Briefcase, FileText, Clock, CheckCircle2,
  XCircle, AlertTriangle, Link2, Unlink, Activity, Download, Send, Eye
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function XplanSyncPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('status');
  
  // Data
  const [status, setStatus] = useState(null);
  const [clients, setClients] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [apiLogs, setApiLogs] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPortfolio, setClientPortfolio] = useState(null);
  const [clientTransactions, setClientTransactions] = useState([]);
  
  // File note modal
  const [showFileNoteModal, setShowFileNoteModal] = useState(false);
  const [fileNote, setFileNote] = useState({
    client_id: '',
    title: '',
    content: '',
    adviser_id: 'ADV001'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, syncRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/api/xplan/status`).then(r => r.json()),
        fetch(`${API_URL}/api/xplan/sync/status`).then(r => r.json()),
        fetch(`${API_URL}/api/xplan/logs?limit=20`).then(r => r.json())
      ]);
      
      setStatus(statusRes);
      setSyncStatus(syncRes);
      setApiLogs(logsRes.logs || []);
    } catch (error) {
      console.error('Failed to load Xplan data:', error);
    }
    setLoading(false);
  };

  const connectToXplan = async () => {
    try {
      const result = await fetch(`${API_URL}/api/xplan/connect`, { method: 'POST' }).then(r => r.json());
      alert(result.success ? 'Connected to Xplan!' : `Connection failed: ${result.message}`);
      loadData();
    } catch (error) {
      alert('Connection failed: ' + error.message);
    }
  };

  const syncAllClients = async () => {
    setSyncing(true);
    try {
      const result = await fetch(`${API_URL}/api/xplan/sync/all`, { method: 'POST' }).then(r => r.json());
      alert(`Synced ${result.clients_synced} clients in ${result.duration_seconds}s`);
      loadData();
      loadClients();
    } catch (error) {
      alert('Sync failed: ' + error.message);
    }
    setSyncing(false);
  };

  const loadClients = async () => {
    try {
      const result = await fetch(`${API_URL}/api/xplan/clients?sync_first=true`).then(r => r.json());
      setClients(result.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const selectClient = async (clientId) => {
    setSelectedClient(clientId);
    try {
      const [portfolio, transactions] = await Promise.all([
        fetch(`${API_URL}/api/xplan/clients/${clientId}/portfolio`).then(r => r.json()),
        fetch(`${API_URL}/api/xplan/clients/${clientId}/transactions`).then(r => r.json())
      ]);
      setClientPortfolio(portfolio);
      setClientTransactions(transactions.transactions || []);
    } catch (error) {
      console.error('Failed to load client data:', error);
    }
  };

  const syncSingleClient = async (clientId) => {
    try {
      const result = await fetch(`${API_URL}/api/xplan/sync/client/${clientId}`, { method: 'POST' }).then(r => r.json());
      alert(`Client synced in ${result.duration_seconds}s`);
      loadData();
    } catch (error) {
      alert('Sync failed: ' + error.message);
    }
  };

  const writeFileNote = async () => {
    try {
      const result = await fetch(`${API_URL}/api/xplan/file-notes/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileNote)
      }).then(r => r.json());
      
      if (result.success) {
        alert(`File note created: ${result.note_id}`);
        setShowFileNoteModal(false);
        setFileNote({ client_id: '', title: '', content: '', adviser_id: 'ADV001' });
        loadData();
      } else {
        alert('Failed to create file note');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading Xplan Integration...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" data-testid="xplan-sync-page">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Xplan Integration</h1>
          <p className="text-muted-foreground">Phase 1 MVP - Read clients, portfolios, transactions | Write file notes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button 
            onClick={connectToXplan}
            variant={status?.oauth_valid ? 'outline' : 'default'}
            data-testid="connect-btn"
          >
            {status?.oauth_valid ? (
              <><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Connected</>
            ) : (
              <><Link2 className="w-4 h-4 mr-2" /> Connect to Xplan</>
            )}
          </Button>
        </div>
      </div>

      {/* Connection Status Banner */}
      <Alert className={`mb-6 ${status?.oauth_valid ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
        {status?.oauth_valid ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        )}
        <AlertTitle className={status?.oauth_valid ? 'text-green-800' : 'text-yellow-800'}>
          {status?.oauth_valid ? 'Connected to Xplan' : 'Not Connected'}
        </AlertTitle>
        <AlertDescription className={status?.oauth_valid ? 'text-green-700' : 'text-yellow-700'}>
          Mode: {status?.mode?.toUpperCase()} | Phase: {status?.phase} | 
          Clients Synced: {status?.clients_synced || 0} | 
          API Calls (24h): {status?.api_calls_24h || 0}
        </AlertDescription>
      </Alert>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card data-testid="metric-clients">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Synced Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStatus?.total_synced_clients || 0}</div>
            <p className="text-xs text-muted-foreground">From Xplan</p>
          </CardContent>
        </Card>

        <Card data-testid="metric-oauth">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link2 className="w-4 h-4 text-green-500" /> OAuth Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.oauth_valid ? 'Valid' : 'Expired'}</div>
            <Badge variant={status?.oauth_valid ? 'default' : 'destructive'} className="mt-1">
              {status?.status || 'Unknown'}
            </Badge>
          </CardContent>
        </Card>

        <Card data-testid="metric-api-calls">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" /> API Calls (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.api_calls_24h || 0}</div>
            <p className="text-xs text-muted-foreground">All logged</p>
          </CardContent>
        </Card>

        <Card data-testid="metric-last-sync">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" /> Last Full Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {syncStatus?.last_full_sync?.last_sync?.slice(0, 10) || 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncStatus?.last_full_sync?.clients_synced || 0} clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="status" data-testid="tab-status">Status</TabsTrigger>
          <TabsTrigger value="clients" data-testid="tab-clients">Clients</TabsTrigger>
          <TabsTrigger value="sync" data-testid="tab-sync">Sync</TabsTrigger>
          <TabsTrigger value="file-notes" data-testid="tab-file-notes">File Notes</TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">API Logs</TabsTrigger>
        </TabsList>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Integration Capabilities</CardTitle>
                <CardDescription>Phase 1 MVP - Read-first approach</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">READ Operations</h4>
                  <div className="space-y-1">
                    {status?.capabilities?.read?.map((cap, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        {cap}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">WRITE Operations</h4>
                  <div className="space-y-1">
                    {status?.capabilities?.write?.map((cap, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-blue-700">
                        <CheckCircle2 className="w-4 h-4" />
                        {cap}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Flow Rules</CardTitle>
                <CardDescription>Source of truth management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Xplan = System of Record</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clients, portfolios, transactions - Xplan is the source of truth
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">AdviceOS = Workflow Layer</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Compliance, scenarios, decisions - AdviceOS adds value without overwriting
                  </p>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Critical Rule</AlertTitle>
                  <AlertDescription>
                    AdviceOS will NEVER overwrite financial data in Xplan
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Xplan Clients</CardTitle>
                <CardDescription>Synced client data with portfolios</CardDescription>
              </div>
              <Button onClick={loadClients} variant="outline">
                <Download className="w-4 h-4 mr-2" /> Load Clients
              </Button>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No clients loaded. Click "Load Clients" to sync from Xplan.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Client List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {clients.map((client, i) => (
                      <div 
                        key={i}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedClient === client.external_id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                        }`}
                        onClick={() => selectClient(client.external_id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{client.first_name} {client.last_name}</p>
                            <p className="text-sm text-muted-foreground">{client.external_id}</p>
                          </div>
                          <Badge variant="outline">{client.risk_profile || 'N/A'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{client.email}</p>
                      </div>
                    ))}
                  </div>

                  {/* Client Details */}
                  {selectedClient && clientPortfolio && (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Portfolio Summary</h4>
                        <p className="text-2xl font-bold">
                          ${clientPortfolio.portfolio_value?.toLocaleString() || 0}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {clientPortfolio.allocation && Object.entries(clientPortfolio.allocation).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="ml-1 font-medium">{value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Recent Transactions</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {clientTransactions.slice(0, 5).map((tx, i) => (
                            <div key={i} className="flex justify-between text-sm p-2 bg-muted rounded">
                              <span>{tx.transaction_type}</span>
                              <span>${tx.amount?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={() => {
                          setFileNote({ ...fileNote, client_id: selectedClient });
                          setShowFileNoteModal(true);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" /> Write File Note
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Operations</CardTitle>
              <CardDescription>Real-time and scheduled synchronization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={syncAllClients} 
                  disabled={syncing}
                  className="h-20"
                  data-testid="sync-all-btn"
                >
                  {syncing ? (
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  ) : (
                    <Database className="w-6 h-6 mr-2" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold">Full Sync</p>
                    <p className="text-xs opacity-80">Sync all clients from Xplan</p>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-20" onClick={loadData}>
                  <Activity className="w-6 h-6 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Check Status</p>
                    <p className="text-xs opacity-80">Refresh sync status</p>
                  </div>
                </Button>
              </div>

              {/* Recent Syncs */}
              <div>
                <h4 className="font-semibold mb-2">Recent Client Syncs</h4>
                <div className="space-y-2">
                  {syncStatus?.recent_client_syncs?.map((sync, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{sync.client_id}</span>
                        <span className="text-sm text-muted-foreground ml-2">{sync.sync_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={sync.status === 'success' ? 'default' : 'destructive'}>
                          {sync.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {sync.duration_seconds?.toFixed(2)}s
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!syncStatus?.recent_client_syncs || syncStatus.recent_client_syncs.length === 0) && (
                    <p className="text-muted-foreground text-center py-4">No recent syncs</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Notes Tab */}
        <TabsContent value="file-notes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>File Notes</CardTitle>
                <CardDescription>Write file notes back to Xplan</CardDescription>
              </div>
              <Dialog open={showFileNoteModal} onOpenChange={setShowFileNoteModal}>
                <DialogTrigger asChild>
                  <Button data-testid="new-file-note-btn">
                    <FileText className="w-4 h-4 mr-2" /> New File Note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Write File Note to Xplan</DialogTitle>
                    <DialogDescription>
                      This note will be synced to the client's file in Xplan
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Select
                      value={fileNote.client_id}
                      onValueChange={(v) => setFileNote({ ...fileNote, client_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c, i) => (
                          <SelectItem key={i} value={c.external_id}>
                            {c.first_name} {c.last_name} ({c.external_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Note Title"
                      value={fileNote.title}
                      onChange={(e) => setFileNote({ ...fileNote, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Note content (plain text)"
                      value={fileNote.content}
                      onChange={(e) => setFileNote({ ...fileNote, content: e.target.value })}
                      rows={6}
                    />
                    <Input
                      placeholder="Adviser ID"
                      value={fileNote.adviser_id}
                      onChange={(e) => setFileNote({ ...fileNote, adviser_id: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowFileNoteModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={writeFileNote}>
                      <Send className="w-4 h-4 mr-2" /> Write to Xplan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>File Note Write-back</AlertTitle>
                <AlertDescription>
                  File notes created here are automatically synced to Xplan and logged in the audit trail.
                  Notes are formatted as plain text with adviser ID and timestamp.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Interaction Logs</CardTitle>
              <CardDescription>Full audit trail of all Xplan API calls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {apiLogs.map((log, i) => (
                  <div key={i} className="p-3 border rounded-lg text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.status_code === 200 ? 'default' : 'destructive'}>
                          {log.status_code || 'N/A'}
                        </Badge>
                        <span className="font-medium">{log.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp?.slice(0, 19)}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">{log.xplan_endpoint}</p>
                    <div className="flex gap-4 mt-1 text-xs">
                      <span>User: {log.user_id}</span>
                      {log.duration_ms && <span>Duration: {log.duration_ms.toFixed(0)}ms</span>}
                      {log.error && <span className="text-red-500">Error: {log.error}</span>}
                    </div>
                  </div>
                ))}
                {apiLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No API logs yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
