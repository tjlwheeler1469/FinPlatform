import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { ScrollArea } from '../components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import {
  Bell, BellOff, BellRing, Check, CheckCheck, Trash2, Settings, Filter,
  AlertTriangle, AlertCircle, Info, CheckCircle2, Clock, ArrowRight,
  Smartphone, Monitor, Mail, MessageSquare, Moon, Sun, Volume2, VolumeX,
  RefreshCw, Send, Zap, Activity, Database, Wifi, WifiOff, Play, Pause,
  BarChart3, TrendingUp, Users, Shield, FileText
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const WS_URL = API_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

// Notification type icons and colors
const NOTIFICATION_STYLES = {
  breach: { icon: Shield, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
  sync: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
  alert: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
  success: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
  warning: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200' },
  portfolio: { icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' },
  meeting: { icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-200' },
  document: { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' }
};

const PRIORITY_COLORS = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-gray-400'
};

export default function NotificationCenterPage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    in_app_enabled: true,
    desktop_push_enabled: true,
    mobile_push_enabled: true,
    email_enabled: true,
    sms_enabled: false,
    categories: {
      compliance: true,
      platform_sync: true,
      portfolio: true,
      meeting: true,
      document: true,
      breach: true,
      general: true
    },
    quiet_hours_enabled: false,
    quiet_start: '22:00',
    quiet_end: '07:00',
    digest_mode: false,
    digest_frequency: 'daily'
  });
  
  // Service status
  const [serviceStatus, setServiceStatus] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Desktop notification permission
  const [desktopPermission, setDesktopPermission] = useState('default');
  
  // WebSocket ref
  const wsRef = useRef(null);
  
  // User ID (would come from auth context in production)
  const userId = 'demo_user';

  // Check desktop notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setDesktopPermission(Notification.permission);
    }
  }, []);

  // Request desktop notification permission
  const requestDesktopPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setDesktopPermission(permission);
      if (permission === 'granted') {
        toast.success('Desktop notifications enabled!');
        // Send a test notification
        new Notification('AdviceOS Notifications', {
          body: 'Desktop notifications are now enabled!',
          icon: '/favicon.ico'
        });
      } else {
        toast.error('Desktop notifications were denied');
      }
    }
  };

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/push/notifications/${userId}?limit=100&unread_only=${filterType === 'unread'}`
      );
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
    setLoading(false);
  }, [filterType]);

  // Load preferences
  const loadPreferences = async () => {
    try {
      const response = await fetch(`${API_URL}/api/push/preferences/${userId}`);
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  // Load service status
  const loadServiceStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/push/status`);
      const data = await response.json();
      setServiceStatus(data);
    } catch (error) {
      console.error('Failed to load service status:', error);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    try {
      await fetch(`${API_URL}/api/push/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preferences, user_id: userId })
      });
      toast.success('Preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/push/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/push/notifications/${userId}/read-all`, {
        method: 'PUT'
      });
      toast.success('All notifications marked as read');
      loadNotifications();
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  // Dismiss notification
  const dismissNotification = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/push/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await fetch(`${API_URL}/api/push/notifications/${userId}/clear-all`, {
        method: 'DELETE'
      });
      toast.success('All notifications cleared');
      loadNotifications();
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      await fetch(`${API_URL}/api/push/test/send-all?user_id=${userId}`, {
        method: 'POST'
      });
      toast.success('Test notification sent!');
      loadNotifications();
    } catch (error) {
      toast.error('Failed to send test notification');
    }
  };

  // Seed demo notifications
  const seedDemoNotifications = async () => {
    try {
      await fetch(`${API_URL}/api/push/demo/seed-notifications?user_id=${userId}`, {
        method: 'POST'
      });
      toast.success('Demo notifications created!');
      loadNotifications();
    } catch (error) {
      toast.error('Failed to seed demo notifications');
    }
  };

  // Connect to WebSocket for real-time notifications
  const connectWebSocket = useCallback(() => {
    if (!WS_URL) return;
    
    try {
      const ws = new WebSocket(`${WS_URL}/api/ws/notifications`);
      
      ws.onopen = () => {
        setWsConnected(true);
        console.log('Notification WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event_type === 'notification') {
            // New notification received
            const notif = data.data;
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show desktop notification if enabled
            if (desktopPermission === 'granted' && preferences.desktop_push_enabled) {
              new Notification(notif.title, {
                body: notif.message,
                icon: '/favicon.ico',
                tag: notif.notification_id
              });
            }
            
            // Show toast
            toast.info(notif.title, { description: notif.message });
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };
      
      ws.onclose = () => {
        setWsConnected(false);
        // Attempt reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [desktopPermission, preferences.desktop_push_enabled]);

  useEffect(() => {
    loadNotifications();
    loadPreferences();
    loadServiceStatus();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [loadNotifications, connectWebSocket]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filterCategory !== 'all' && notif.category !== filterCategory) return false;
    if (filterType === 'unread' && notif.read) return false;
    return true;
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const NotificationItem = ({ notification }) => {
    const style = NOTIFICATION_STYLES[notification.notification_type] || NOTIFICATION_STYLES.info;
    const IconComponent = style.icon;
    
    return (
      <div
        className={`p-4 rounded-lg border transition-all ${style.bg} ${!notification.read ? 'ring-2 ring-primary/20' : ''}`}
        data-testid={`notification-${notification.notification_id}`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full bg-white ${style.color}`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-sm truncate">{notification.title}</h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge className={`${PRIORITY_COLORS[notification.priority]} text-white text-xs`}>
                  {notification.priority}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatTime(notification.created_at)}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
            {notification.action_url && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto mt-2 text-primary"
                onClick={() => window.location.href = notification.action_url}
              >
                {notification.action_label || 'View Details'} <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {!notification.read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => markAsRead(notification.notification_id)}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => dismissNotification(notification.notification_id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6 p-6" data-testid="notification-center-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              Notification Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your notifications, alerts, and notification preferences
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* WebSocket Status */}
            <Badge variant={wsConnected ? "default" : "secondary"} className="flex items-center gap-1">
              {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {wsConnected ? 'Live' : 'Offline'}
            </Badge>
            
            {/* Unread Badge */}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <BellRing className="h-3 w-3" />
                {unreadCount} unread
              </Badge>
            )}
            
            <Button variant="outline" onClick={loadNotifications} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Desktop Notification Permission Alert */}
        {desktopPermission !== 'granted' && (
          <Alert>
            <Monitor className="h-4 w-4" />
            <AlertTitle>Enable Desktop Notifications</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Get instant desktop notifications for important alerts.</span>
              <Button size="sm" onClick={requestDesktopPermission}>
                Enable
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications" data-testid="notifications-tab">
              <Bell className="h-4 w-4 mr-2" /> Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preferences" data-testid="preferences-tab">
              <Settings className="h-4 w-4 mr-2" /> Preferences
            </TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="subscriptions-tab">
              <Smartphone className="h-4 w-4 mr-2" /> Devices
            </TabsTrigger>
            <TabsTrigger value="status" data-testid="status-tab">
              <Activity className="h-4 w-4 mr-2" /> Status
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="platform_sync">Platform Sync</SelectItem>
                    <SelectItem value="portfolio">Portfolio</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="breach">Breach</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={sendTestNotification}>
                  <Send className="h-4 w-4 mr-1" /> Test
                </Button>
                <Button variant="outline" size="sm" onClick={seedDemoNotifications}>
                  <Database className="h-4 w-4 mr-1" /> Seed Demo
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
                  <CheckCheck className="h-4 w-4 mr-1" /> Mark All Read
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" /> Clear All
                </Button>
              </div>
            </div>
            
            {/* Notification List */}
            <Card>
              <CardContent className="p-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem key={notification.notification_id} notification={notification} />
                    ))}
                    {filteredNotifications.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <BellOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No notifications</p>
                        <p className="text-sm">You're all caught up!</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={seedDemoNotifications}>
                          Generate Demo Notifications
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Notification Channels */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Channels</CardTitle>
                  <CardDescription>Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">In-App Notifications</p>
                        <p className="text-sm text-muted-foreground">Show notifications in the app</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.in_app_enabled}
                      onCheckedChange={(checked) => setPreferences({...preferences, in_app_enabled: checked})}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Desktop Push Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          {desktopPermission === 'granted' ? 'Enabled' : 'Click to enable'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.desktop_push_enabled && desktopPermission === 'granted'}
                      onCheckedChange={(checked) => {
                        if (checked && desktopPermission !== 'granted') {
                          requestDesktopPermission();
                        } else {
                          setPreferences({...preferences, desktop_push_enabled: checked});
                        }
                      }}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Mobile Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Requires mobile app</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.mobile_push_enabled}
                      onCheckedChange={(checked) => setPreferences({...preferences, mobile_push_enabled: checked})}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Important alerts via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.email_enabled}
                      onCheckedChange={(checked) => setPreferences({...preferences, email_enabled: checked})}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-muted-foreground">Urgent alerts via SMS</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.sms_enabled}
                      onCheckedChange={(checked) => setPreferences({...preferences, sms_enabled: checked})}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Category Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Preferences</CardTitle>
                  <CardDescription>Enable or disable notifications by category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(preferences.categories || {}).map(([category, enabled]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {NOTIFICATION_STYLES[category]?.icon && 
                          React.createElement(NOTIFICATION_STYLES[category].icon, {
                            className: `h-4 w-4 ${NOTIFICATION_STYLES[category].color}`
                          })
                        }
                        <span className="capitalize">{category.replace('_', ' ')}</span>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => setPreferences({
                          ...preferences,
                          categories: { ...preferences.categories, [category]: checked }
                        })}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quiet Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5" /> Quiet Hours
                  </CardTitle>
                  <CardDescription>Pause notifications during specific hours</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Enable Quiet Hours</span>
                    <Switch
                      checked={preferences.quiet_hours_enabled}
                      onCheckedChange={(checked) => setPreferences({...preferences, quiet_hours_enabled: checked})}
                    />
                  </div>
                  
                  {preferences.quiet_hours_enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={preferences.quiet_start}
                          onChange={(e) => setPreferences({...preferences, quiet_start: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={preferences.quiet_end}
                          onChange={(e) => setPreferences({...preferences, quiet_end: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Digest Mode */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Digest Mode
                  </CardTitle>
                  <CardDescription>Batch notifications into a summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Enable Digest Mode</span>
                    <Switch
                      checked={preferences.digest_mode}
                      onCheckedChange={(checked) => setPreferences({...preferences, digest_mode: checked})}
                    />
                  </div>
                  
                  {preferences.digest_mode && (
                    <div>
                      <Label>Frequency</Label>
                      <Select
                        value={preferences.digest_frequency}
                        onValueChange={(value) => setPreferences({...preferences, digest_frequency: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Button onClick={savePreferences} className="w-full md:w-auto">
              Save Preferences
            </Button>
          </TabsContent>

          {/* Subscriptions/Devices Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registered Devices</CardTitle>
                <CardDescription>Devices that can receive push notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No devices registered</p>
                  <p className="text-sm">Push notification subscriptions will appear here</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Badge variant="outline">Web Push</Badge>
                    <Badge variant="outline">Firebase (Android)</Badge>
                    <Badge variant="outline">APNs (iOS)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Mobile App Push Notifications</AlertTitle>
              <AlertDescription>
                To receive push notifications on mobile devices, you'll need to download the AdviceOS mobile app (coming soon) 
                or enable browser notifications on your mobile device.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceStatus && Object.entries(serviceStatus.services || {}).map(([service, data]) => (
                <Card key={service}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{service.replace('_', ' ')}</span>
                      <Badge className={data.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {data.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{data.note}</p>
                    {data.subscriptions !== undefined && (
                      <p className="text-sm mt-2">
                        <strong>{data.subscriptions}</strong> active subscriptions
                      </p>
                    )}
                    {data.total_notifications !== undefined && (
                      <p className="text-sm">
                        <strong>{data.total_notifications}</strong> total notifications
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {serviceStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{serviceStatus.total_subscriptions || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Subscriptions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{serviceStatus.services?.in_app?.total_notifications || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Notifications</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{serviceStatus.services?.in_app?.unread || 0}</p>
                      <p className="text-sm text-muted-foreground">Unread</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{serviceStatus.push_logs || 0}</p>
                      <p className="text-sm text-muted-foreground">Push Logs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
