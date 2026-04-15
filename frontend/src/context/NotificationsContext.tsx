import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: string;
  link?: string;
}

interface NotificationPreferences {
  taskReminders: boolean;
  meetingReminders: boolean;
  marketUpdates: boolean;
  complianceAlerts: boolean;
  invoiceAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  addNotification: (notification: Partial<Notification>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  updatePreferences: (newPrefs: Partial<NotificationPreferences>) => void;
  simulateNotification: () => void;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1', type: 'task', title: 'Task Due Tomorrow',
    message: 'Annual Review - Thompson is due tomorrow',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false, priority: 'high', link: '/practice-management'
  },
  {
    id: 'notif_2', type: 'meeting', title: 'Meeting in 2 Hours',
    message: 'Portfolio Discussion with Williams Family at 2:00 PM',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: false, priority: 'medium', link: '/practice-management'
  },
  {
    id: 'notif_3', type: 'market', title: 'Market Update',
    message: 'ASX 200 is up 1.2% today',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true, priority: 'low', link: '/share-portfolio'
  },
  {
    id: 'notif_4', type: 'compliance', title: 'Compliance Reminder',
    message: 'KYC update due for Johnson Trust in 7 days',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true, priority: 'medium', link: '/practice-management'
  },
  {
    id: 'notif_5', type: 'invoice', title: 'Invoice Overdue',
    message: 'INV-2025-003 for Johnson Trust is 5 days overdue',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: false, priority: 'high', link: '/practice-management'
  }
];

const NotificationsContext = createContext<NotificationsContextType | null>(null);

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem('halcyon_notifications');
    return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
  });

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    const stored = localStorage.getItem('halcyon_notification_preferences');
    return stored ? JSON.parse(stored) : {
      taskReminders: true,
      meetingReminders: true,
      marketUpdates: true,
      complianceAlerts: true,
      invoiceAlerts: true,
      emailNotifications: false,
      pushNotifications: false
    };
  });

  useEffect(() => {
    localStorage.setItem('halcyon_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('halcyon_notification_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notification: Partial<Notification>) => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      type: 'info',
      title: '',
      message: '',
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'medium',
      ...notification
    } as Notification;
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);

  const simulateNotification = useCallback(() => {
    const types = ['task', 'meeting', 'market', 'compliance', 'invoice'];
    const type = types[Math.floor(Math.random() * types.length)];

    const messages: Record<string, { title: string; message: string }> = {
      task: { title: 'New Task Assigned', message: 'Review portfolio strategy for Brown Investments' },
      meeting: { title: 'Meeting Reminder', message: 'Client call with Smith & Associates in 30 minutes' },
      market: { title: 'Stock Alert', message: 'BHP has moved 3% today' },
      compliance: { title: 'Document Required', message: 'Annual review documentation needed for Thompson Family' },
      invoice: { title: 'Payment Received', message: 'INV-2025-002 has been paid' }
    };

    addNotification({
      type,
      ...messages[type],
      priority: Math.random() > 0.7 ? 'high' : 'medium',
      link: '/practice-management'
    });
  }, [addNotification]);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      preferences,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      updatePreferences,
      simulateNotification
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

export default NotificationsContext;
