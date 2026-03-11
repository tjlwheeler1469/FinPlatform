import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Calendar,
  Clock,
  FileText,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ClipboardList,
  Timer,
  Receipt,
  Shield,
  Edit,
  Trash2,
  Play,
  Pause,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Download,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import ChartContainer from "@/components/ChartContainer";
import { CalendarExportButton, CalendarBulkExportButton } from "@/components/CalendarIntegration";
import CalendarIntegrationSettings from "@/components/CalendarIntegration";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0
  }).format(value);
};

// Mock data for clients
const MOCK_CLIENTS = [
  { id: "client_1", name: "Wheeler Family", email: "james@wheeler.com" },
  { id: "client_2", name: "Smith & Associates", email: "sarah@smith.com" },
  { id: "client_3", name: "Johnson Trust", email: "michael@johnson.com" },
  { id: "client_4", name: "Williams Family", email: "emma@williams.com" },
  { id: "client_5", name: "Brown Investments", email: "david@brown.com" },
];

// Mock initial data
const MOCK_TASKS = [
  { task_id: "task_1", client_id: "client_1", title: "Annual Review - Wheeler", description: "Complete annual review meeting prep", due_date: "2025-01-20", priority: "high", status: "pending", category: "review", assigned_to: "self", created_at: "2025-01-01" },
  { task_id: "task_2", client_id: "client_2", title: "SOA Update - Smith", description: "Prepare updated Statement of Advice", due_date: "2025-01-25", priority: "high", status: "in_progress", category: "compliance", assigned_to: "self", created_at: "2025-01-05" },
  { task_id: "task_3", client_id: "client_3", title: "KYC Verification - Johnson", description: "Update KYC documentation", due_date: "2025-02-01", priority: "medium", status: "pending", category: "compliance", assigned_to: "self", created_at: "2025-01-08" },
  { task_id: "task_4", client_id: null, title: "CPD Training", description: "Complete quarterly CPD requirements", due_date: "2025-01-30", priority: "medium", status: "pending", category: "general", assigned_to: "self", created_at: "2025-01-10" },
];

const MOCK_MEETINGS = [
  { meeting_id: "meet_1", client_id: "client_1", title: "Annual Review Meeting", scheduled_at: "2025-01-22T10:00:00", duration_minutes: 90, location: "Office", meeting_type: "review", status: "scheduled", created_at: "2025-01-01" },
  { meeting_id: "meet_2", client_id: "client_4", title: "Portfolio Discussion", scheduled_at: "2025-01-24T14:00:00", duration_minutes: 60, location: "Video Call", meeting_type: "planning", status: "scheduled", created_at: "2025-01-05" },
  { meeting_id: "meet_3", client_id: "client_5", title: "New Client Onboarding", scheduled_at: "2025-01-28T09:30:00", duration_minutes: 120, location: "Office", meeting_type: "onboarding", status: "scheduled", created_at: "2025-01-10" },
];

const MOCK_TIME_ENTRIES = [
  { entry_id: "time_1", client_id: "client_1", date: "2025-01-15", hours: 2.5, description: "Portfolio review and analysis", activity_type: "consulting", is_billable: true, hourly_rate: 350, created_at: "2025-01-15" },
  { entry_id: "time_2", client_id: "client_2", date: "2025-01-15", hours: 1.5, description: "SOA preparation", activity_type: "consulting", is_billable: true, hourly_rate: 350, created_at: "2025-01-15" },
  { entry_id: "time_3", client_id: "client_3", date: "2025-01-14", hours: 1.0, description: "Client meeting", activity_type: "meeting", is_billable: true, hourly_rate: 350, created_at: "2025-01-14" },
  { entry_id: "time_4", client_id: null, date: "2025-01-14", hours: 2.0, description: "CPD Training", activity_type: "admin", is_billable: false, hourly_rate: 0, created_at: "2025-01-14" },
  { entry_id: "time_5", client_id: "client_1", date: "2025-01-13", hours: 3.0, description: "Tax planning consultation", activity_type: "consulting", is_billable: true, hourly_rate: 350, created_at: "2025-01-13" },
];

const MOCK_INVOICES = [
  { invoice_id: "inv_1", invoice_number: "INV-2025-001", client_id: "client_1", issue_date: "2025-01-01", due_date: "2025-01-15", line_items: [{ description: "Q4 Advisory Services", amount: 4500 }], subtotal: 4500, gst: 450, total: 4950, status: "paid", created_at: "2025-01-01" },
  { invoice_id: "inv_2", invoice_number: "INV-2025-002", client_id: "client_2", issue_date: "2025-01-10", due_date: "2025-01-24", line_items: [{ description: "SOA Preparation", amount: 2500 }], subtotal: 2500, gst: 250, total: 2750, status: "sent", created_at: "2025-01-10" },
  { invoice_id: "inv_3", invoice_number: "INV-2025-003", client_id: "client_3", issue_date: "2025-01-05", due_date: "2025-01-19", line_items: [{ description: "Investment Review", amount: 1800 }], subtotal: 1800, gst: 180, total: 1980, status: "overdue", created_at: "2025-01-05" },
];

const MOCK_COMPLIANCE = [
  { record_id: "comp_1", client_id: "client_1", record_type: "annual_review", description: "Completed annual review meeting", completed_at: "2024-11-15", next_due: "2025-11-15", created_at: "2024-11-15" },
  { record_id: "comp_2", client_id: "client_1", record_type: "soa_review", description: "SOA issued and acknowledged", completed_at: "2024-11-15", next_due: "2025-11-15", created_at: "2024-11-15" },
  { record_id: "comp_3", client_id: "client_2", record_type: "kyc_update", description: "KYC documentation updated", completed_at: "2024-10-20", next_due: "2025-10-20", created_at: "2024-10-20" },
  { record_id: "comp_4", client_id: "client_3", record_type: "fds_issued", description: "Fee Disclosure Statement issued", completed_at: "2024-09-01", next_due: "2025-09-01", created_at: "2024-09-01" },
];

const COLORS = ['#0F392B', '#10B981', '#3B82F6', '#D4AF37', '#EF4444'];

const PracticeManagement = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [meetings, setMeetings] = useState(MOCK_MEETINGS);
  const [timeEntries, setTimeEntries] = useState(MOCK_TIME_ENTRIES);
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [compliance, setCompliance] = useState(MOCK_COMPLIANCE);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showNewMeetingDialog, setShowNewMeetingDialog] = useState(false);
  const [showNewTimeDialog, setShowNewTimeDialog] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getClientName = (clientId) => {
    const client = MOCK_CLIENTS.find(c => c.id === clientId);
    return client ? client.name : "Internal";
  };

  // Dashboard Stats
  const urgentTasks = tasks.filter(t => t.priority === "high" && t.status !== "completed");
  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress");
  const thisMonthHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
  const thisMonthBillable = timeEntries.filter(e => e.is_billable).reduce((sum, e) => sum + (e.hours * e.hourly_rate), 0);
  const outstandingInvoices = invoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((sum, i) => sum + i.total, 0);

  // Charts data
  const hoursBreakdown = [
    { name: "Consulting", value: timeEntries.filter(e => e.activity_type === "consulting").reduce((s, e) => s + e.hours, 0) },
    { name: "Meetings", value: timeEntries.filter(e => e.activity_type === "meeting").reduce((s, e) => s + e.hours, 0) },
    { name: "Admin", value: timeEntries.filter(e => e.activity_type === "admin").reduce((s, e) => s + e.hours, 0) },
    { name: "Research", value: timeEntries.filter(e => e.activity_type === "research").reduce((s, e) => s + e.hours, 0) },
  ].filter(d => d.value > 0);

  const weeklyHours = [
    { day: "Mon", hours: 6.5 },
    { day: "Tue", hours: 7.0 },
    { day: "Wed", hours: 5.5 },
    { day: "Thu", hours: 8.0 },
    { day: "Fri", hours: 4.5 },
  ];

  const addTask = (taskData) => {
    const newTask = {
      ...taskData,
      task_id: `task_${Date.now()}`,
      assigned_to: "self",
      created_at: new Date().toISOString()
    };
    setTasks([...tasks, newTask]);
    setShowNewTaskDialog(false);
    toast.success("Task created successfully");
  };

  const addMeeting = (meetingData) => {
    const newMeeting = {
      ...meetingData,
      meeting_id: `meet_${Date.now()}`,
      status: "scheduled",
      created_at: new Date().toISOString()
    };
    setMeetings([...meetings, newMeeting]);
    setShowNewMeetingDialog(false);
    toast.success("Meeting scheduled successfully");
  };

  const addTimeEntry = (entryData) => {
    const newEntry = {
      ...entryData,
      entry_id: `time_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setTimeEntries([...timeEntries, newEntry]);
    setShowNewTimeDialog(false);
    toast.success("Time entry recorded");
  };

  const toggleTimer = (clientId = null, description = "") => {
    if (activeTimer) {
      // Stop timer and create entry
      const hours = timerSeconds / 3600;
      if (hours > 0.1) { // Minimum 6 minutes
        addTimeEntry({
          client_id: activeTimer.clientId,
          date: new Date().toISOString().split('T')[0],
          hours: parseFloat(hours.toFixed(2)),
          description: activeTimer.description || "Timed session",
          activity_type: "consulting",
          is_billable: true,
          hourly_rate: 350
        });
      }
      setActiveTimer(null);
      setTimerSeconds(0);
    } else {
      setActiveTimer({ clientId, description });
      setTimerSeconds(0);
    }
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(tasks.map(t => 
      t.task_id === taskId ? { ...t, status: newStatus } : t
    ));
    toast.success(`Task ${newStatus === "completed" ? "completed" : "updated"}`);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="practice-management-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Practice Management</h1>
            <p className="text-muted-foreground">Manage your practice operations, billing, and compliance</p>
          </div>
          <div className="flex items-center gap-2">
            {activeTimer ? (
              <Button onClick={() => toggleTimer()} variant="destructive" className="gap-2">
                <Pause className="h-4 w-4" />
                {formatTime(timerSeconds)}
              </Button>
            ) : (
              <Button onClick={() => toggleTimer()} variant="outline" className="gap-2">
                <Play className="h-4 w-4" />
                Start Timer
              </Button>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="dashboard" data-testid="tab-practice-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
            <TabsTrigger value="meetings" data-testid="tab-meetings">Meetings</TabsTrigger>
            <TabsTrigger value="time" data-testid="tab-time">Time Tracking</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Urgent Tasks</p>
                      <p className="text-2xl font-bold text-red-600">{urgentTasks.length}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Hours This Month</p>
                      <p className="text-2xl font-bold">{thisMonthHours.toFixed(1)}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Billable Value</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(thisMonthBillable)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Outstanding</p>
                      <p className="text-2xl font-bold text-amber-600">{formatCurrency(outstandingInvoices)}</p>
                    </div>
                    <Receipt className="h-8 w-8 text-amber-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Meetings */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#D4AF37]" />
                    Upcoming Meetings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {meetings.filter(m => m.status === "scheduled").slice(0, 4).map(meeting => (
                      <div key={meeting.meeting_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(meeting.scheduled_at).toLocaleString('en-AU', { 
                              weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Badge variant="outline">{meeting.duration_minutes} min</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Urgent Tasks */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-[#D4AF37]" />
                    Priority Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.filter(t => t.status !== "completed").slice(0, 4).map(task => (
                      <div key={task.task_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 rounded-full border"
                            onClick={() => updateTaskStatus(task.task_id, "completed")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <div>
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-muted-foreground">Due: {new Date(task.due_date).toLocaleDateString('en-AU')}</p>
                          </div>
                        </div>
                        <Badge className={
                          task.priority === "high" ? "bg-red-100 text-red-800" :
                          task.priority === "medium" ? "bg-amber-100 text-amber-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Hours Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
                    Weekly Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={200}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyHours}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="hours" fill="#0F392B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Time Breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Timer className="h-5 w-5 text-[#D4AF37]" />
                    Time Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <ChartContainer height={160} className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={hoursBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            dataKey="value"
                          >
                            {hoursBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => `${v.toFixed(1)} hrs`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="space-y-2">
                      {hoursBreakdown.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">{item.value.toFixed(1)}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input placeholder="Search tasks..." className="w-64" />
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#0F392B]" data-testid="new-task-btn">
                    <Plus className="h-4 w-4 mr-2" /> New Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Add a new task to your practice management</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const clientId = formData.get("client_id");
                    addTask({
                      title: formData.get("title"),
                      description: formData.get("description"),
                      client_id: clientId === "none" ? null : clientId,
                      due_date: formData.get("due_date"),
                      priority: formData.get("priority"),
                      status: "pending",
                      category: "general"
                    });
                  }}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input id="title" name="title" required placeholder="Enter task title" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="Task description" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="client_id">Client (optional)</Label>
                          <Select name="client_id">
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Client</SelectItem>
                              {MOCK_CLIENTS.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select name="priority" defaultValue="medium">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input id="due_date" name="due_date" type="date" required />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowNewTaskDialog(false)}>Cancel</Button>
                      <Button type="submit" className="bg-[#0F392B]">Create Task</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Task List */}
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {tasks.map(task => (
                    <div key={task.task_id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-8 w-8 p-0 rounded-full border ${task.status === "completed" ? "bg-green-100 border-green-500" : ""}`}
                          onClick={() => updateTaskStatus(task.task_id, task.status === "completed" ? "pending" : "completed")}
                        >
                          <CheckCircle className={`h-5 w-5 ${task.status === "completed" ? "text-green-600" : "text-gray-300"}`} />
                        </Button>
                        <div>
                          <p className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getClientName(task.client_id)} • Due {new Date(task.due_date).toLocaleDateString('en-AU')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          task.priority === "urgent" ? "bg-red-600" :
                          task.priority === "high" ? "bg-red-100 text-red-800" :
                          task.priority === "medium" ? "bg-amber-100 text-amber-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline">{task.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Scheduled Meetings</h2>
              <div className="flex items-center gap-2">
                <CalendarBulkExportButton 
                  events={meetings.filter(m => m.status === "scheduled").map(m => ({
                    title: m.title,
                    description: `Meeting with ${getClientName(m.client_id)} - ${m.meeting_type}`,
                    location: m.location || "",
                    startTime: m.scheduled_at,
                    endTime: new Date(new Date(m.scheduled_at).getTime() + m.duration_minutes * 60000).toISOString()
                  }))}
                  filename="wheeler_meetings.ics"
                />
                <Dialog open={showNewMeetingDialog} onOpenChange={setShowNewMeetingDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#0F392B]" data-testid="new-meeting-btn">
                      <Plus className="h-4 w-4 mr-2" /> Schedule Meeting
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Meeting</DialogTitle>
                    <DialogDescription>Add a new meeting to your calendar</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    addMeeting({
                      title: formData.get("title"),
                      client_id: formData.get("client_id"),
                      scheduled_at: formData.get("scheduled_at"),
                      duration_minutes: parseInt(formData.get("duration_minutes")),
                      location: formData.get("location"),
                      meeting_type: formData.get("meeting_type")
                    });
                  }}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Meeting Title</Label>
                        <Input id="title" name="title" required placeholder="Meeting title" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client_id">Client</Label>
                        <Select name="client_id">
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {MOCK_CLIENTS.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="scheduled_at">Date & Time</Label>
                          <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                          <Select name="duration_minutes" defaultValue="60">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 min</SelectItem>
                              <SelectItem value="60">60 min</SelectItem>
                              <SelectItem value="90">90 min</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" name="location" placeholder="Office / Video Call" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="meeting_type">Type</Label>
                          <Select name="meeting_type" defaultValue="review">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="planning">Planning</SelectItem>
                              <SelectItem value="onboarding">Onboarding</SelectItem>
                              <SelectItem value="compliance">Compliance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowNewMeetingDialog(false)}>Cancel</Button>
                      <Button type="submit" className="bg-[#0F392B]">Schedule</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings.map(meeting => (
                <Card key={meeting.meeting_id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{meeting.title}</p>
                        <p className="text-sm text-muted-foreground">{getClientName(meeting.client_id)}</p>
                      </div>
                      <Badge variant="outline">{meeting.meeting_type}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(meeting.scheduled_at).toLocaleString('en-AU', { 
                          weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {meeting.duration_minutes} minutes
                      </div>
                      {meeting.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ArrowUpRight className="h-4 w-4" />
                          {meeting.location}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <CalendarExportButton 
                        event={{
                          title: meeting.title,
                          description: `Meeting with ${getClientName(meeting.client_id)} - ${meeting.meeting_type}`,
                          location: meeting.location || "",
                          startTime: meeting.scheduled_at,
                          endTime: new Date(new Date(meeting.scheduled_at).getTime() + meeting.duration_minutes * 60000).toISOString()
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={() => toggleTimer(meeting.client_id, meeting.title)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Calendar Integration Settings */}
            <CalendarIntegrationSettings />
          </TabsContent>

          {/* Time Tracking Tab */}
          <TabsContent value="time" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{thisMonthHours.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Hours This Month</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(thisMonthBillable)}</p>
                  <p className="text-sm text-muted-foreground">Billable Value</p>
                </div>
              </div>
              <Dialog open={showNewTimeDialog} onOpenChange={setShowNewTimeDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#0F392B]" data-testid="new-time-entry-btn">
                    <Plus className="h-4 w-4 mr-2" /> Log Time
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Time Entry</DialogTitle>
                    <DialogDescription>Record time spent on client work</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const clientId = formData.get("client_id");
                    addTimeEntry({
                      client_id: clientId === "internal" ? null : clientId,
                      date: formData.get("date"),
                      hours: parseFloat(formData.get("hours")),
                      description: formData.get("description"),
                      activity_type: formData.get("activity_type"),
                      is_billable: formData.get("is_billable") === "true",
                      hourly_rate: formData.get("is_billable") === "true" ? 350 : 0
                    });
                  }}>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="client_id">Client</Label>
                          <Select name="client_id">
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="internal">Internal</SelectItem>
                              {MOCK_CLIENTS.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="hours">Hours</Label>
                          <Input id="hours" name="hours" type="number" step="0.25" min="0.25" required placeholder="1.5" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="activity_type">Activity Type</Label>
                          <Select name="activity_type" defaultValue="consulting">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="consulting">Consulting</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="research">Research</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="travel">Travel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" required placeholder="What did you work on?" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="is_billable">Billable</Label>
                        <Select name="is_billable" defaultValue="true">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes - Billable</SelectItem>
                            <SelectItem value="false">No - Non-Billable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowNewTimeDialog(false)}>Cancel</Button>
                      <Button type="submit" className="bg-[#0F392B]">Log Time</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Time Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timeEntries.slice(0, 10).map(entry => (
                    <div key={entry.entry_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 text-center">
                          <p className="text-lg font-bold">{entry.hours.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">hrs</p>
                        </div>
                        <div>
                          <p className="font-medium">{entry.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {getClientName(entry.client_id)} • {new Date(entry.date).toLocaleDateString('en-AU')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {entry.is_billable ? (
                          <p className="font-bold text-green-600">{formatCurrency(entry.hours * entry.hourly_rate)}</p>
                        ) : (
                          <Badge variant="outline">Non-billable</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Invoiced (YTD)</p>
                  <p className="text-2xl font-bold">{formatCurrency(invoices.reduce((s, i) => s + i.total, 0))}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(outstandingInvoices)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Invoices</CardTitle>
                  <Button className="bg-[#0F392B]">
                    <Plus className="h-4 w-4 mr-2" /> Create Invoice
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.map(invoice => (
                    <div key={invoice.invoice_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {getClientName(invoice.client_id)} • Issued {new Date(invoice.issue_date).toLocaleDateString('en-AU')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold">{formatCurrency(invoice.total)}</p>
                        <Badge className={
                          invoice.status === "paid" ? "bg-green-100 text-green-800" :
                          invoice.status === "overdue" ? "bg-red-100 text-red-800" :
                          invoice.status === "sent" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#D4AF37]" />
                  Compliance Audit Trail
                </CardTitle>
                <CardDescription>Track regulatory requirements and compliance activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {compliance.map(record => (
                    <div key={record.record_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#0F392B]/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-[#0F392B]" />
                        </div>
                        <div>
                          <p className="font-medium">{record.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {getClientName(record.client_id)} • Completed {new Date(record.completed_at).toLocaleDateString('en-AU')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">{record.record_type.replace('_', ' ')}</Badge>
                        {record.next_due && (
                          <p className="text-xs text-muted-foreground">
                            Next due: {new Date(record.next_due).toLocaleDateString('en-AU')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[#D4AF37]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AFSL Compliance Status</p>
                    <p className="text-sm text-muted-foreground">All clients have current documentation on file</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PracticeManagement;
