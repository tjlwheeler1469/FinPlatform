import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Activity, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock, Zap,
  ArrowLeftRight, Database, Users, Wifi, WifiOff, Bell, Mail, MessageSquare,
  TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Globe, Server
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const WS_URL = API_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

const PLATFORM_ICONS = {
  amp_north: '🔷',
  netwealth: '🟢',
  hub24: '🔶',
  class: '🟣',
  iress: '🔵',
  xplan: '🔵'
};

export default function LiveSyncDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Live data
  const [platformStatus, setPlatformStatus] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsStats, setWsStats] = useState({});
  
  // Metrics
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [allClients, setAllClients] = useState([]);
  const [mockNotifications, setMockNotifications] = useState([]);
  
  // WebSocket ref
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  // Auto-refresh interval
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = useRef(null);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!WS_URL) return;
    
    try {
      const ws = new WebSocket(`${WS_URL}/api/ws/platform-sync`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        addLiveEvent('system', 'WebSocket connected', 'success');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        addLiveEvent('system', 'WebSocket disconnected', 'warning');
        
        // Attempt reconnect after 5 seconds
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting WebSocket reconnect...');
          connectWebSocket();
        }, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        addLiveEvent('system', 'WebSocket error', 'error');
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, []);

  const handleWebSocketMessage = (data) => {
    const eventType = data.event_type || data.type;
    
    // Add to live events
    addLiveEvent(eventType, data.message || JSON.stringify(data.data || {}), 
      eventType.includes('error') ? 'error' : eventType.includes('alert') ? 'warning' : 'info');
    
    // Handle specific event types
    if (eventType === 'platform_status') {
      setPlatformStatus(data.data || []);
    } else if (eventType === 'sync_completed' || eventType === 'sync_started') {
      loadSyncLogs();
    } else if (eventType === 'notification' || eventType === 'email' || eventType === 'sms') {
      setNotifications(prev => [{
        id: Date.now(),
        type: eventType,
        title: data.title || eventType,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString()
      }, ...prev.slice(0, 49)]);
    }
  };

  const addLiveEvent = (type, message, severity = 'info') => {
    const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setLiveEvents(prev => [{
      id: eventId,
      type,
      message,
      severity,
      timestamp: new Date().toISOString()
    }, ...prev.slice(0, 99)]);
  };

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [status, logs, clients, portfolio, wsStatsRes, mockNotifs] = await Promise.all([
        fetch(`${API_URL}/api/platforms/status`).then(r => r.json()),
        fetch(`${API_URL}/api/platforms/sync-logs?limit=30`).then(r => r.json()),
        fetch(`${API_URL}/api/platforms/demo/all-clients`).then(r => r.json()),
        fetch(`${API_URL}/api/platforms/demo/portfolio-summary`).then(r => r.json()),
        fetch(`${API_URL}/api/ws/stats`).then(r => r.json()).catch(() => ({})),
        fetch(`${API_URL}/api/notifications/mock-notifications?limit=20`).then(r => r.json()).catch(() => ({ notifications: [] }))
      ]);
      
      setPlatformStatus(status.connections || []);
      setSyncLogs(logs.logs || []);
      setAllClients(clients.clients || []);
      setPortfolioSummary(portfolio);
      setWsStats(wsStatsRes);
      setMockNotifications(mockNotifs.notifications || []);
      
      addLiveEvent('data_refresh', 'Dashboard data refreshed', 'success');
    } catch (error) {
      console.error('Failed to load data:', error);
      addLiveEvent('data_refresh', 'Failed to refresh data', 'error');
    }
    setLoading(false);
  };

  const loadSyncLogs = async () => {
    try {
      const logs = await fetch(`${API_URL}/api/platforms/sync-logs?limit=30`).then(r => r.json());
      setSyncLogs(logs.logs || []);
    } catch (error) {
      console.error('Failed to load sync logs:', error);
    }
  };

  // Sync a platform
  const syncPlatform = async (platformId) => {
    addLiveEvent('sync', `Syncing ${platformId}...`, 'info');
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
      addLiveEvent('sync', `${platformId} sync completed`, 'success');
      loadData();
    } catch (error) {
      addLiveEvent('sync', `${platformId} sync failed`, 'error');
    }
  };

  // Connect platform
  const connectPlatform = async (platformId) => {
    try {
      await fetch(`${API_URL}/api/platforms/connect/${platformId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      addLiveEvent('connection', `Connected to ${platformId}`, 'success');
      loadData();
    } catch (error) {
      addLiveEvent('connection', `Failed to connect ${platformId}`, 'error');
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/send-test-mock`, { method: 'POST' });
      addLiveEvent('notification', 'Test notification sent', 'success');
      // Reload mock notifications
      const mockNotifs = await fetch(`${API_URL}/api/notifications/mock-notifications?limit=20`).then(r => r.json());
      setMockNotifications(mockNotifs.notifications || []);
    } catch (error) {
      addLiveEvent('notification', 'Failed to send test notification', 'error');
    }
  };

  useEffect(() => {
    loadData();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [connectWebSocket]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(loadData, 30000); // Every 30 seconds
    } else {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    }
    
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh]);

  const formatCurrency = (value) => `AUD $${(value || 0).toLocaleString()}`;
  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString();

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'syncing': return 'bg-blue-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <Layout>
      <div className="space-y-6 p-6" data-testid="live-sync-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              Live Sync Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time platform sync status, notifications, and portfolio updates
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* WebSocket Status */}
            <Badge variant={wsConnected ? "default" : "secondary"} className="flex items-center gap-1">
              {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {wsConnected ? 'Live' : 'Offline'}
            </Badge>
            
            {/* Auto-refresh toggle */}
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {platformStatus.map((platform) => (
            <Card key={platform.platform} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(platform.status)}`} />
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{PLATFORM_ICONS[platform.platform]}</span>
                    <div>
                      <p className="font-medium text-sm">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">{platform.clients_synced} clients</p>
                    </div>
                  </div>
                  {platform.status === 'connected' ? (
                    <Button size="sm" variant="ghost" onClick={() => syncPlatform(platform.platform)}>
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => connectPlatform(platform.platform)}>
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Total AUM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(portfolioSummary?.total_aum)}
              </div>
              <p className="text-xs text-muted-foreground">{portfolioSummary?.total_portfolios || 0} portfolios</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allClients.length}</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4" /> Sync Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncLogs.length}</div>
              <p className="text-xs text-muted-foreground">Last 30 operations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockNotifications.length}</div>
              <p className="text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">Mock Mode</Badge>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="overview-tab">
              <Activity className="h-4 w-4 mr-2" /> Live Events
            </TabsTrigger>
            <TabsTrigger value="sync" data-testid="sync-tab">
              <ArrowLeftRight className="h-4 w-4 mr-2" /> Sync Logs
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="notifications-tab">
              <Bell className="h-4 w-4 mr-2" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="portfolio" data-testid="portfolio-tab">
              <PieChart className="h-4 w-4 mr-2" /> Portfolio
            </TabsTrigger>
          </TabsList>

          {/* Live Events Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Live Event Stream
                    </CardTitle>
                    <CardDescription>Real-time events from all connected platforms</CardDescription>
                  </div>
                  <Badge variant={wsConnected ? "default" : "secondary"}>
                    {wsConnected ? 'Connected' : 'Reconnecting...'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {liveEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border ${getSeverityColor(event.severity)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{event.type}</Badge>
                            <span className="text-sm">{event.message}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatTime(event.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                    {liveEvents.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Waiting for live events...</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Logs Tab */}
          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sync Operation Logs</CardTitle>
                <CardDescription>All bi-directional sync operations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Log ID</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Time</TableHead>
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
                          <Badge variant={log.direction === 'inbound' ? 'default' : 'secondary'}>
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
                          {formatTime(log.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>Mock Mode Active</AlertTitle>
              <AlertDescription>
                Email and SMS notifications are logged to database (not actually sent). 
                Add SendGrid/Twilio API keys for real delivery.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Notification Log</CardTitle>
                    <CardDescription>Mock email and SMS notifications</CardDescription>
                  </div>
                  <Button onClick={sendTestNotification}>
                    <Bell className="h-4 w-4 mr-2" /> Send Test
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {mockNotifications.map((notif, idx) => (
                      <div key={notif.log_id || idx} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {notif.type === 'email' ? (
                              <Mail className="h-4 w-4 text-blue-500" />
                            ) : (
                              <MessageSquare className="h-4 w-4 text-green-500" />
                            )}
                            <Badge variant="outline">{notif.type?.toUpperCase()}</Badge>
                            <Badge variant="secondary">{notif.mode}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notif.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {notif.type === 'email' && (
                          <>
                            <p className="font-medium">{notif.subject}</p>
                            <p className="text-sm text-muted-foreground">To: {notif.to?.join(', ')}</p>
                          </>
                        )}
                        {notif.type === 'sms' && (
                          <>
                            <p className="text-sm">{notif.message}</p>
                            <p className="text-sm text-muted-foreground">To: {notif.to?.join(', ')}</p>
                          </>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 italic">{notif.note}</p>
                      </div>
                    ))}
                    {mockNotifications.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No notifications yet. Click "Send Test" to create one.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio by Platform</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(portfolioSummary?.portfolios || []).map((portfolio, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{PLATFORM_ICONS[portfolio.platform]}</span>
                          <div>
                            <p className="font-medium text-sm">{portfolio.account_name}</p>
                            <p className="text-xs text-muted-foreground">{portfolio.platform_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(portfolio.total_value)}</p>
                          <p className="text-xs text-muted-foreground">{portfolio.holdings_count} holdings</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Clients by Platform</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      allClients.reduce((acc, client) => {
                        acc[client.platform] = (acc[client.platform] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([platform, count]) => (
                      <div key={platform} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{PLATFORM_ICONS[platform]}</span>
                          <span className="font-medium">{platform}</span>
                        </div>
                        <Badge>{count} clients</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
