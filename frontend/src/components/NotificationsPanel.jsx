import { useState } from "react";
import { useNotifications } from "@/context/NotificationsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bell,
  CheckCircle,
  Trash2,
  Settings,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  ClipboardList,
  Shield,
  X,
  Check,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const getNotificationIcon = (type) => {
  switch (type) {
    case 'task': return ClipboardList;
    case 'meeting': return Calendar;
    case 'market': return TrendingUp;
    case 'compliance': return Shield;
    case 'invoice': return DollarSign;
    default: return Bell;
  }
};

const getNotificationColor = (type, priority) => {
  if (priority === 'high') return 'text-red-600 bg-red-50';
  switch (type) {
    case 'task': return 'text-blue-600 bg-blue-50';
    case 'meeting': return 'text-purple-600 bg-purple-50';
    case 'market': return 'text-green-600 bg-green-50';
    case 'compliance': return 'text-amber-600 bg-amber-50';
    case 'invoice': return 'text-emerald-600 bg-emerald-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-AU');
};

const NotificationItem = ({ notification, onMarkRead, onDelete, onClick }) => {
  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type, notification.priority);
  
  return (
    <div 
      className={`p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
        !notification.read ? 'bg-blue-50/30' : ''
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`font-medium text-sm truncate ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
              {notification.title}
            </p>
            {notification.priority === 'high' && (
              <Badge variant="destructive" className="text-xs px-1 py-0">Urgent</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.timestamp)}</p>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {!notification.read && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={() => onMarkRead(notification.id)}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
            onClick={() => onDelete(notification.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const NotificationsPanel = ({ trigger }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    simulateNotification
  } = useNotifications();

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : activeTab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === activeTab);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} new</Badge>
              )}
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={simulateNotification}
                title="Add test notification"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription>
            Stay updated with your tasks, meetings, and alerts
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-4 pt-2">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
              <TabsTrigger value="task" className="text-xs">Tasks</TabsTrigger>
              <TabsTrigger value="meeting" className="text-xs">Meetings</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-xs text-muted-foreground">
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
                  <CheckCircle className="h-3 w-3 mr-1" /> Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearAll}>
                  <Trash2 className="h-3 w-3 mr-1" /> Clear all
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              ))
            )}
          </div>
        </Tabs>

        {/* Preferences Section */}
        <div className="border-t p-4">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" /> Notification Settings
              </span>
              <span className="text-xs text-muted-foreground group-open:hidden">Show</span>
              <span className="text-xs text-muted-foreground hidden group-open:block">Hide</span>
            </summary>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="task-notifs" className="text-sm">Task Reminders</Label>
                <Switch 
                  id="task-notifs" 
                  checked={preferences.taskReminders}
                  onCheckedChange={(checked) => updatePreferences({ taskReminders: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="meeting-notifs" className="text-sm">Meeting Reminders</Label>
                <Switch 
                  id="meeting-notifs" 
                  checked={preferences.meetingReminders}
                  onCheckedChange={(checked) => updatePreferences({ meetingReminders: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="market-notifs" className="text-sm">Market Updates</Label>
                <Switch 
                  id="market-notifs" 
                  checked={preferences.marketUpdates}
                  onCheckedChange={(checked) => updatePreferences({ marketUpdates: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="compliance-notifs" className="text-sm">Compliance Alerts</Label>
                <Switch 
                  id="compliance-notifs" 
                  checked={preferences.complianceAlerts}
                  onCheckedChange={(checked) => updatePreferences({ complianceAlerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="invoice-notifs" className="text-sm">Invoice Alerts</Label>
                <Switch 
                  id="invoice-notifs" 
                  checked={preferences.invoiceAlerts}
                  onCheckedChange={(checked) => updatePreferences({ invoiceAlerts: checked })}
                />
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Email notifications (mock)</p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifs" className="text-sm text-muted-foreground">Email Notifications</Label>
                  <Switch 
                    id="email-notifs" 
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => updatePreferences({ emailNotifications: checked })}
                  />
                </div>
              </div>
            </div>
          </details>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsPanel;
