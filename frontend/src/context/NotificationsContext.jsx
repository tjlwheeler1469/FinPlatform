import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationsContext = createContext(null);

// Mock notifications data
const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_1',
    type: 'task',
    title: 'Task Due Tomorrow',
    message: 'Annual Review - Wheeler is due tomorrow',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    read: false,
    priority: 'high',
    link: '/practice-management'
  },
  {
    id: 'notif_2',
    type: 'meeting',
    title: 'Meeting in 2 Hours',
    message: 'Portfolio Discussion with Williams Family at 2:00 PM',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    read: false,
    priority: 'medium',
    link: '/practice-management'
  },
  {
    id: 'notif_3',
    type: 'market',
    title: 'Market Update',
    message: 'ASX 200 is up 1.2% today',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    read: true,
    priority: 'low',
    link: '/share-portfolio'
  },
  {
    id: 'notif_4',
    type: 'compliance',
    title: 'Compliance Reminder',
    message: 'KYC update due for Johnson Trust in 7 days',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    priority: 'medium',
    link: '/practice-management'
  },
  {
    id: 'notif_5',
    type: 'invoice',
    title: 'Invoice Overdue',
    message: 'INV-2025-003 for Johnson Trust is 5 days overdue',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: false,
    priority: 'high',
    link: '/practice-management'
  }
];

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('wheeler_notifications');
    return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
  });
  
  const [preferences, setPreferences] = useState(() => {
    const stored = localStorage.getItem('wheeler_notification_preferences');
    return stored ? JSON.parse(stored) : {
      taskReminders: true,
      meetingReminders: true,
      marketUpdates: true,
      complianceAlerts: true,
      invoiceAlerts: true,
      emailNotifications: false, // Mock - not actually sending emails
      pushNotifications: false
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('wheeler_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('wheeler_notification_preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Add notification
  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // Mark as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Delete notification
  const deleteNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update preferences
  const updatePreferences = useCallback((newPrefs) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);

  // Simulate new notification (for demo)
  const simulateNotification = useCallback(() => {
    const types = ['task', 'meeting', 'market', 'compliance', 'invoice'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const messages = {
      task: { title: 'New Task Assigned', message: 'Review portfolio strategy for Brown Investments' },
      meeting: { title: 'Meeting Reminder', message: 'Client call with Smith & Associates in 30 minutes' },
      market: { title: 'Stock Alert', message: 'BHP has moved 3% today' },
      compliance: { title: 'Document Required', message: 'Annual review documentation needed for Wheeler Family' },
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

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

export default NotificationsContext;
