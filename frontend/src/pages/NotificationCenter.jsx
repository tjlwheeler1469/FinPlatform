import { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Wifi,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Shield,
  Play,
  Eye,
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const NotificationCenter = () => {
  const [demoData, setDemoData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulationResult, setSimulationResult] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [demoRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/notifications/demo`),
        fetch(`${API_URL}/api/notifications/summary`)
      ]);
      
      if (demoRes.ok) {
        const data = await demoRes.json();
        setDemoData(data);
      }
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const simulateNotification = async (type) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/demo/simulate?notification_type=${type}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data);
        toast.success('Notification simulated successfully');
      }
    } catch (err) {
      toast.error('Simulation failed');
    }
  };

  const getEmailPreview = async (notificationId) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/demo/email-preview/${notificationId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPreview(data);
      }
    } catch (err) {
      toast.error('Failed to load preview');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'portfolio_drift': return <TrendingUp className="h-4 w-4" />;
      case 'tax_opportunity': return <DollarSign className="h-4 w-4" />;
      case 'compliance_due': return <Shield className="h-4 w-4" />;
      case 'idle_cash': return <DollarSign className="h-4 w-4" />;
      case 'retirement_risk': return <AlertTriangle className="h-4 w-4" />;
      case 'meeting_reminder': return <Calendar className="h-4 w-4" />;
      case 'market_event': return <TrendingUp className="h-4 w-4" />;
      case 'client_login': return <Users className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'websocket': return <Wifi className="h-4 w-4" />;
      case 'push': return <Smartphone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-[#1a2744]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="notification-center">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744]">Notification Center</h1>
            <p className="text-muted-foreground">Real-time alerts, email notifications, and push notifications</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Integration Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {demoData?.integration_status && Object.entries(demoData.integration_status).map(([channel, info]) => (
            <Card key={channel} className="border-l-4 border-l-[#1a2744]">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(channel)}
                    <span className="font-medium capitalize">{channel}</span>
                  </div>
                  <Badge variant={info.status === 'ready' ? 'default' : 'secondary'}>
                    {info.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{info.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">Sample Notifications</TabsTrigger>
            <TabsTrigger value="types">Notification Types</TabsTrigger>
            <TabsTrigger value="simulate">Simulate</TabsTrigger>
            <TabsTrigger value="preview">Email Preview</TabsTrigger>
          </TabsList>

          {/* Sample Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Sample Notifications
                </CardTitle>
                <CardDescription>
                  These are example notifications showing what would be sent when events occur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {demoData?.sample_notifications?.map((notif) => (
                      <div 
                        key={notif.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        data-testid={`notification-${notif.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-[#1a2744]/10 rounded-lg">
                              {getTypeIcon(notif.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-[#1a2744]">{notif.title}</h4>
                                <Badge className={getPriorityColor(notif.priority)} variant="secondary">
                                  {notif.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{notif.message}</p>
                              {notif.client_name && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Client: {notif.client_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Channels */}
                        <div className="mt-4 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Delivery Channels:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(notif.channels).map(([channel, info]) => (
                              <div 
                                key={channel}
                                className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded"
                              >
                                {getChannelIcon(channel)}
                                <span className="capitalize">{channel}:</span>
                                {info.status === 'would_send' ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => getEmailPreview(notif.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview Email
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => simulateNotification(notif.type)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Simulate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Types */}
          <TabsContent value="types" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>
                  Configure which notification types you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoData?.notification_types?.map((type) => (
                    <div 
                      key={type.type}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1a2744]/10 rounded-lg">
                          {getTypeIcon(type.type)}
                        </div>
                        <div>
                          <h4 className="font-medium capitalize">{type.type.replace(/_/g, ' ')}</h4>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                          <div className="flex gap-1 mt-1">
                            {type.default_channels.map(ch => (
                              <Badge key={ch} variant="outline" className="text-xs">
                                {ch}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Simulate */}
          <TabsContent value="simulate" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Simulate Notification
                  </CardTitle>
                  <CardDescription>
                    Test the notification system by simulating different alert types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {demoData?.notification_types?.map((type) => (
                      <Button
                        key={type.type}
                        variant="outline"
                        className="justify-start"
                        onClick={() => simulateNotification(type.type)}
                      >
                        {getTypeIcon(type.type)}
                        <span className="ml-2 capitalize text-xs">{type.type.replace(/_/g, ' ')}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {simulationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Simulation Result</CardTitle>
                    <CardDescription>
                      ID: {simulationResult.simulation_id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm">
                        <span className="font-medium">Type:</span>{' '}
                        <Badge variant="outline">{simulationResult.notification_type}</Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Channels Simulated:</p>
                        <div className="space-y-2">
                          {Object.entries(simulationResult.channels_simulated).map(([ch, info]) => (
                            <div key={ch} className="text-xs bg-gray-50 p-2 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                {getChannelIcon(ch)}
                                <span className="font-medium capitalize">{ch}</span>
                                <Badge variant="secondary" className="text-xs">{info.status}</Badge>
                              </div>
                              <p className="text-muted-foreground">{info.action}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {simulationResult.websocket_delivered && (
                        <Badge className="bg-green-500">WebSocket Delivered</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Email Preview */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Preview
                </CardTitle>
                <CardDescription>
                  Preview how email notifications would appear
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPreview ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm"><span className="font-medium">Subject:</span> {selectedPreview.subject}</p>
                        <p className="text-sm"><span className="font-medium">Type:</span> {selectedPreview.notification_type}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedPreview(null)}>
                        Clear
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <div 
                        className="bg-white" 
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPreview.html_preview) }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a notification and click "Preview Email" to see the email template</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* System Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-[#1a2744]">{summary.statistics?.total_notifications || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Notifications</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-500">{summary.statistics?.unread || 0}</p>
                  <p className="text-sm text-muted-foreground">Unread</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-500">{summary.active_connections?.users || 0}</p>
                  <p className="text-sm text-muted-foreground">Connected Users</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex gap-2">
                    <Badge variant={summary.configured_channels?.sendgrid ? 'default' : 'secondary'}>
                      Email {summary.configured_channels?.sendgrid ? '✓' : '○'}
                    </Badge>
                    <Badge variant={summary.configured_channels?.twilio ? 'default' : 'secondary'}>
                      SMS {summary.configured_channels?.twilio ? '✓' : '○'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Integrations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default NotificationCenter;
