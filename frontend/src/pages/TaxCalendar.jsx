import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellRing,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Building2,
  PiggyBank,
  Briefcase,
  X,
  RefreshCw,
  Mail,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Australian Tax Calendar Events for 2024-25 Financial Year
const AUSTRALIAN_TAX_DATES = [
  // BAS Quarterly
  { id: "bas-q1", title: "BAS Q1 Due", date: "2024-10-28", category: "bas", description: "Business Activity Statement for July-September quarter", recurring: true },
  { id: "bas-q2", title: "BAS Q2 Due", date: "2025-02-28", category: "bas", description: "Business Activity Statement for October-December quarter", recurring: true },
  { id: "bas-q3", title: "BAS Q3 Due", date: "2025-04-28", category: "bas", description: "Business Activity Statement for January-March quarter", recurring: true },
  { id: "bas-q4", title: "BAS Q4 Due", date: "2025-07-28", category: "bas", description: "Business Activity Statement for April-June quarter", recurring: true },
  
  // Super Guarantee
  { id: "super-q1", title: "Super Guarantee Q1", date: "2024-10-28", category: "super", description: "Super guarantee contributions for July-September", recurring: true },
  { id: "super-q2", title: "Super Guarantee Q2", date: "2025-01-28", category: "super", description: "Super guarantee contributions for October-December", recurring: true },
  { id: "super-q3", title: "Super Guarantee Q3", date: "2025-04-28", category: "super", description: "Super guarantee contributions for January-March", recurring: true },
  { id: "super-q4", title: "Super Guarantee Q4", date: "2025-07-28", category: "super", description: "Super guarantee contributions for April-June", recurring: true },
  
  // PAYG Installments
  { id: "payg-q1", title: "PAYG Installment Q1", date: "2024-10-28", category: "payg", description: "PAYG installment for July-September quarter", recurring: true },
  { id: "payg-q2", title: "PAYG Installment Q2", date: "2025-02-28", category: "payg", description: "PAYG installment for October-December quarter", recurring: true },
  { id: "payg-q3", title: "PAYG Installment Q3", date: "2025-04-28", category: "payg", description: "PAYG installment for January-March quarter", recurring: true },
  { id: "payg-q4", title: "PAYG Installment Q4", date: "2025-07-28", category: "payg", description: "PAYG installment for April-June quarter", recurring: true },
  
  // Tax Returns
  { id: "tax-return-self", title: "Individual Tax Return Due", date: "2024-10-31", category: "tax-return", description: "Self-lodged individual tax return deadline", recurring: true },
  { id: "tax-return-agent", title: "Tax Agent Lodgment Due", date: "2025-05-15", category: "tax-return", description: "Tax return due if lodging via registered tax agent", recurring: true },
  { id: "company-tax", title: "Company Tax Return Due", date: "2025-02-28", category: "tax-return", description: "Company tax return for 30 June year end", recurring: true },
  
  // FBT
  { id: "fbt-return", title: "FBT Return Due", date: "2025-05-21", category: "fbt", description: "Fringe Benefits Tax return lodgment deadline", recurring: true },
  { id: "fbt-q1", title: "FBT Installment Q1", date: "2024-10-28", category: "fbt", description: "FBT quarterly installment", recurring: true },
  { id: "fbt-q2", title: "FBT Installment Q2", date: "2025-01-28", category: "fbt", description: "FBT quarterly installment", recurring: true },
  { id: "fbt-q3", title: "FBT Installment Q3", date: "2025-04-28", category: "fbt", description: "FBT quarterly installment", recurring: true },
  
  // Other Important Dates
  { id: "fy-end", title: "Financial Year End", date: "2025-06-30", category: "important", description: "End of 2024-25 financial year - review tax position", recurring: true },
  { id: "fy-start", title: "New Financial Year", date: "2025-07-01", category: "important", description: "Start of 2025-26 financial year", recurring: true },
  { id: "super-cap-review", title: "Review Super Contributions", date: "2025-05-01", category: "super", description: "Review concessional contribution cap usage before EOFY", recurring: true },
  { id: "cgt-review", title: "CGT Planning Review", date: "2025-05-15", category: "cgt", description: "Review capital gains/losses position before EOFY", recurring: true },
  { id: "div7a-review", title: "Division 7A Review", date: "2025-06-01", category: "important", description: "Review Division 7A loan repayments before EOFY", recurring: true },
  { id: "trust-dist", title: "Trust Distribution Resolution", date: "2025-06-30", category: "important", description: "Trustee resolution for trust distributions must be made", recurring: true },
];

const CATEGORY_CONFIG = {
  bas: { label: "BAS", color: "#3B82F6", icon: FileText },
  super: { label: "Super", color: "#10B981", icon: PiggyBank },
  payg: { label: "PAYG", color: "#D4AF37", icon: DollarSign },
  "tax-return": { label: "Tax Return", color: "#8B5CF6", icon: FileText },
  fbt: { label: "FBT", color: "#EC4899", icon: Briefcase },
  important: { label: "Important", color: "#EF4444", icon: AlertTriangle },
  cgt: { label: "CGT", color: "#F59E0B", icon: Building2 },
  custom: { label: "Custom", color: "#6B7280", icon: Bell }
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const TaxCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [customEvents, setCustomEvents] = useState([]);
  const [hiddenEvents, setHiddenEvents] = useState([]);
  const [completedEvents, setCompletedEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", description: "", category: "custom" });
  const [activeTab, setActiveTab] = useState("calendar");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2024-25");
  const [apiDeadlines, setApiDeadlines] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: "",
    reminderDays: 7
  });

  // Financial years
  const financialYears = [
    { value: "2023-24", label: "FY 2023-24" },
    { value: "2024-25", label: "FY 2024-25" },
    { value: "2025-26", label: "FY 2025-26" },
    { value: "all", label: "All Years" }
  ];

  // Fetch tax deadlines from API on mount
  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        const response = await axios.get(`${API}/notifications/tax-deadlines`);
        setApiDeadlines(response.data);
      } catch (error) {
        console.error("Error fetching deadlines:", error);
      }
    };
    fetchDeadlines();
  }, []);

  // Load from localStorage
  useEffect(() => {
    const savedCustom = localStorage.getItem("taxCalendarEvents");
    const savedHidden = localStorage.getItem("taxCalendarHidden");
    const savedCompleted = localStorage.getItem("taxCalendarCompleted");
    const savedNotifPrefs = localStorage.getItem("taxNotificationPrefs");
    if (savedCustom) setCustomEvents(JSON.parse(savedCustom));
    if (savedHidden) setHiddenEvents(JSON.parse(savedHidden));
    if (savedCompleted) setCompletedEvents(JSON.parse(savedCompleted));
    if (savedNotifPrefs) {
      const prefs = JSON.parse(savedNotifPrefs);
      setNotificationPrefs(prefs);
      setNotificationsEnabled(!!prefs.email);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("taxCalendarEvents", JSON.stringify(customEvents));
  }, [customEvents]);

  useEffect(() => {
    localStorage.setItem("taxCalendarHidden", JSON.stringify(hiddenEvents));
  }, [hiddenEvents]);

  useEffect(() => {
    localStorage.setItem("taxCalendarCompleted", JSON.stringify(completedEvents));
  }, [completedEvents]);

  // Combine standard and custom events, excluding hidden
  const allEvents = [...AUSTRALIAN_TAX_DATES, ...customEvents].filter(e => !hiddenEvents.includes(e.id));

  // Filter by financial year
  const getFinancialYear = (dateStr) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 6) return `${year}-${(year + 1).toString().slice(2)}`;
    return `${year - 1}-${year.toString().slice(2)}`;
  };

  const filteredByYear = selectedYear === "all" 
    ? allEvents 
    : allEvents.filter(e => getFinancialYear(e.date) === selectedYear);

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return filteredByYear.filter(event => event.date === dateStr);
  };

  // Get events for current month
  const getEventsForMonth = (year, month) => {
    return filteredByYear.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  };

  // Get upcoming events (next 30 days)
  const getUpcomingEvents = () => {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return filteredByYear
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= thirtyDaysLater;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Get overdue events
  const getOverdueEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return filteredByYear
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < today && !completedEvents.includes(event.id);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };

  // Mark event as completed
  const handleCompleteEvent = (eventId) => {
    if (completedEvents.includes(eventId)) {
      setCompletedEvents(completedEvents.filter(id => id !== eventId));
      toast.success("Event marked as incomplete");
    } else {
      setCompletedEvents([...completedEvents, eventId]);
      toast.success("Event marked as completed");
    }
  };

  // Hide/show event
  const handleHideEvent = (eventId) => {
    setHiddenEvents([...hiddenEvents, eventId]);
    toast.success("Event hidden");
  };

  // Restore hidden event
  const handleRestoreEvent = (eventId) => {
    setHiddenEvents(hiddenEvents.filter(id => id !== eventId));
    toast.success("Event restored");
  };

  // Calendar navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // 0 = Sunday
    const days = [];

    // Add padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Add custom event
  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error("Please fill in title and date");
      return;
    }

    const event = {
      id: `custom-${Date.now()}`,
      ...newEvent,
      recurring: false
    };

    setCustomEvents([...customEvents, event]);
    setNewEvent({ title: "", date: "", description: "", category: "custom" });
    setShowAddEvent(false);
    toast.success("Event added to calendar");
  };

  // Remove custom event
  const handleRemoveEvent = (eventId) => {
    setCustomEvents(customEvents.filter(e => e.id !== eventId));
    toast.success("Event removed");
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date && 
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-AU", { 
      weekday: "short", 
      day: "numeric", 
      month: "short",
      year: "numeric"
    });
  };

  // Days until event
  const daysUntil = (dateStr) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const upcomingEvents = getUpcomingEvents();
  const overdueEvents = getOverdueEvents();
  const calendarDays = generateCalendarDays();
  const monthEvents = getEventsForMonth(currentDate.getFullYear(), currentDate.getMonth());

  return (
    <Layout>
      <div className="space-y-6" data-testid="tax-calendar-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              Tax Planning Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              Australian tax dates, deadlines, and reminders
            </p>
          </div>
          <Button 
            onClick={() => setShowAddEvent(true)}
            className="bg-[#0F392B] hover:bg-[#0F392B]/90"
            data-testid="add-event-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={overdueEvents.length > 0 ? "bg-destructive/10 border-destructive/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${overdueEvents.length > 0 ? 'bg-destructive/20' : 'bg-muted'}`}>
                  <AlertTriangle className={`h-5 w-5 ${overdueEvents.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className={`text-2xl font-bold ${overdueEvents.length > 0 ? 'text-destructive' : ''}`}>
                    {overdueEvents.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next 7 Days</p>
                  <p className="text-2xl font-bold">
                    {upcomingEvents.filter(e => daysUntil(e.date) <= 7).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{monthEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Custom Events</p>
                  <p className="text-2xl font-bold">{customEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="all">All Events</TabsTrigger>
          </TabsList>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <Card className="lg:col-span-2" data-testid="calendar-grid">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <h3 className="text-lg font-semibold">
                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </h3>
                      <Button variant="ghost" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Today
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day Headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar Days */}
                    {calendarDays.map((date, index) => {
                      const events = date ? getEventsForDate(date) : [];
                      const hasEvents = events.length > 0;
                      const isSelected = selectedDate && date && 
                        selectedDate.toDateString() === date.toDateString();
                      
                      return (
                        <div
                          key={index}
                          onClick={() => date && setSelectedDate(date)}
                          className={`
                            min-h-[80px] p-1 border rounded-lg cursor-pointer transition-colors
                            ${!date ? 'bg-muted/30' : 'hover:bg-muted/50'}
                            ${isToday(date) ? 'border-[#0F392B] border-2' : 'border-border'}
                            ${isSelected ? 'bg-[#0F392B]/10' : ''}
                          `}
                        >
                          {date && (
                            <>
                              <div className={`text-sm font-medium mb-1 ${isToday(date) ? 'text-[#0F392B]' : ''}`}>
                                {date.getDate()}
                              </div>
                              <div className="space-y-0.5">
                                {events.slice(0, 2).map(event => {
                                  const config = CATEGORY_CONFIG[event.category];
                                  return (
                                    <div 
                                      key={event.id}
                                      className="text-xs px-1 py-0.5 rounded truncate"
                                      style={{ backgroundColor: `${config.color}20`, color: config.color }}
                                    >
                                      {event.title}
                                    </div>
                                  );
                                })}
                                {events.length > 2 && (
                                  <div className="text-xs text-muted-foreground px-1">
                                    +{events.length - 2} more
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Date Events / Upcoming */}
              <Card data-testid="selected-events">
                <CardHeader>
                  <CardTitle className="font-['Manrope']">
                    {selectedDate 
                      ? formatDate(selectedDate.toISOString().split("T")[0])
                      : "Upcoming Deadlines"
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(selectedDate ? getEventsForDate(selectedDate) : upcomingEvents.slice(0, 5)).map(event => {
                      const config = CATEGORY_CONFIG[event.category];
                      const Icon = config.icon;
                      const days = daysUntil(event.date);
                      
                      return (
                        <div 
                          key={event.id}
                          className="p-3 rounded-lg border"
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${config.color}20` }}
                            >
                              <Icon className="h-4 w-4" style={{ color: config.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{event.title}</p>
                                {!selectedDate && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs flex-shrink-0"
                                    style={{ 
                                      borderColor: days <= 7 ? "#EF4444" : config.color,
                                      color: days <= 7 ? "#EF4444" : config.color
                                    }}
                                  >
                                    {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                              {!selectedDate && (
                                <p className="text-xs text-muted-foreground mt-1">{formatDate(event.date)}</p>
                              )}
                            </div>
                            {event.id.startsWith("custom") && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveEvent(event.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(selectedDate ? getEventsForDate(selectedDate) : upcomingEvents).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No events {selectedDate ? "on this date" : "upcoming"}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upcoming Events Tab */}
          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overdue */}
              {overdueEvents.length > 0 && (
                <Card className="md:col-span-2 bg-destructive/5 border-destructive/20">
                  <CardHeader>
                    <CardTitle className="font-['Manrope'] flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Overdue Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {overdueEvents.map(event => {
                        const config = CATEGORY_CONFIG[event.category];
                        const Icon = config.icon;
                        
                        return (
                          <div key={event.id} className="p-3 rounded-lg bg-white border border-destructive/20">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                                <Icon className="h-4 w-4 text-destructive" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{event.title}</p>
                                <p className="text-xs text-destructive">{formatDate(event.date)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Next 7 Days */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Manrope'] flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#D4AF37]" />
                    Next 7 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingEvents.filter(e => daysUntil(e.date) <= 7).map(event => {
                      const config = CATEGORY_CONFIG[event.category];
                      const Icon = config.icon;
                      const days = daysUntil(event.date);
                      
                      return (
                        <div key={event.id} className="p-3 rounded-lg border flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${config.color}20` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: config.color }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                          </div>
                          <Badge variant={days <= 3 ? "destructive" : "outline"}>
                            {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
                          </Badge>
                        </div>
                      );
                    })}
                    {upcomingEvents.filter(e => daysUntil(e.date) <= 7).length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No events in the next 7 days</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Next 30 Days */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Manrope'] flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#10B981]" />
                    Next 30 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingEvents.filter(e => daysUntil(e.date) > 7).slice(0, 6).map(event => {
                      const config = CATEGORY_CONFIG[event.category];
                      const Icon = config.icon;
                      const days = daysUntil(event.date);
                      
                      return (
                        <div key={event.id} className="p-3 rounded-lg border flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${config.color}20` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: config.color }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                          </div>
                          <Badge variant="outline">{days} days</Badge>
                        </div>
                      );
                    })}
                    {upcomingEvents.filter(e => daysUntil(e.date) > 7).length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No more events this month</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* All Events Tab */}
          <TabsContent value="all" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory("all")}
                className={filterCategory === "all" ? "bg-[#0F392B]" : ""}
              >
                All
              </Button>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <Button
                  key={key}
                  variant={filterCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory(key)}
                  style={filterCategory === key ? { backgroundColor: config.color } : { borderColor: config.color, color: config.color }}
                >
                  {config.label}
                </Button>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-['Manrope']">All Tax Events</CardTitle>
                <CardDescription>
                  {filterCategory === "all" ? allEvents.length : allEvents.filter(e => e.category === filterCategory).length} events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(filterCategory === "all" ? allEvents : allEvents.filter(e => e.category === filterCategory))
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(event => {
                      const config = CATEGORY_CONFIG[event.category];
                      const Icon = config.icon;
                      const days = daysUntil(event.date);
                      const isPast = days < 0;
                      
                      return (
                        <div 
                          key={event.id} 
                          className={`p-3 rounded-lg border flex items-center gap-3 ${isPast ? 'opacity-50' : ''}`}
                        >
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${config.color}20` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: config.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{event.title}</p>
                              <Badge variant="outline" style={{ borderColor: config.color, color: config.color }}>
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-medium">{formatDate(event.date)}</p>
                            <p className={`text-xs ${isPast ? 'text-destructive' : days <= 7 ? 'text-[#D4AF37]' : 'text-muted-foreground'}`}>
                              {isPast ? `${Math.abs(days)} days ago` : days === 0 ? "Today" : `${days} days`}
                            </p>
                          </div>
                          {event.id.startsWith("custom") && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Event Modal */}
        {showAddEvent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddEvent(false)}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-['Manrope']">Add Custom Event</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowAddEvent(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Event Title</Label>
                  <Input
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="e.g., Review investment portfolio"
                    data-testid="event-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    data-testid="event-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Additional details..."
                  />
                </div>
                <Button 
                  onClick={handleAddEvent}
                  className="w-full bg-[#0F392B] hover:bg-[#0F392B]/90"
                  data-testid="save-event-btn"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TaxCalendar;
