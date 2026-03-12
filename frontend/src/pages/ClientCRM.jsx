import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Building2,
  UserPlus,
  ClipboardList,
  Filter,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "prospect": return "bg-blue-100 text-blue-700";
    case "inactive": return "bg-gray-100 text-gray-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "urgent": return "bg-red-500 text-white";
    case "high": return "bg-orange-500 text-white";
    case "medium": return "bg-yellow-500 text-white";
    case "low": return "bg-blue-500 text-white";
    default: return "bg-gray-500 text-white";
  }
};

const getTaskStatusIcon = (status) => {
  switch (status) {
    case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "in_progress": return <Clock className="h-4 w-4 text-blue-500" />;
    case "pending": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default: return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const ClientCRM = () => {
  const [activeTab, setActiveTab] = useState("households");
  const [households, setHouseholds] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newNote, setNewNote] = useState({ content: "", note_type: "general" });
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", category: "general" });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [householdsRes, tasksRes, meetingsRes] = await Promise.all([
          axios.get(`${API}/crm/households`),
          axios.get(`${API}/crm/tasks`),
          axios.get(`${API}/crm/meetings`)
        ]);
        setHouseholds(householdsRes.data.households || []);
        setTasks(tasksRes.data.tasks || []);
        setMeetings(meetingsRes.data.meetings || []);
      } catch (error) {
        console.error("Error fetching CRM data:", error);
        toast.error("Failed to load CRM data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch notes when household selected
  useEffect(() => {
    const fetchNotes = async () => {
      if (selectedHousehold) {
        try {
          const res = await axios.get(`${API}/crm/notes/${selectedHousehold.household_id}`);
          setNotes(res.data.notes || []);
        } catch (error) {
          console.error("Error fetching notes:", error);
        }
      }
    };
    fetchNotes();
  }, [selectedHousehold]);

  // Add note
  const handleAddNote = async () => {
    if (!newNote.content || !selectedHousehold) return;
    try {
      await axios.post(`${API}/crm/notes`, {
        household_id: selectedHousehold.household_id,
        ...newNote
      });
      toast.success("Note added");
      setNewNoteOpen(false);
      setNewNote({ content: "", note_type: "general" });
      // Refresh notes
      const res = await axios.get(`${API}/crm/notes/${selectedHousehold.household_id}`);
      setNotes(res.data.notes || []);
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  // Add task
  const handleAddTask = async () => {
    if (!newTask.title) return;
    try {
      await axios.post(`${API}/crm/tasks`, {
        household_id: selectedHousehold?.household_id,
        ...newTask
      });
      toast.success("Task created");
      setNewTaskOpen(false);
      setNewTask({ title: "", description: "", priority: "medium", category: "general" });
      // Refresh tasks
      const res = await axios.get(`${API}/crm/tasks`);
      setTasks(res.data.tasks || []);
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  // Update task status
  const handleUpdateTask = async (taskId, status) => {
    try {
      await axios.put(`${API}/crm/tasks/${taskId}?status=${status}`);
      toast.success("Task updated");
      const res = await axios.get(`${API}/crm/tasks`);
      setTasks(res.data.tasks || []);
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  // Filter households
  const filteredHouseholds = households.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.primary_contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6" data-testid="client-crm-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-[#D4AF37]" />
              Client CRM
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage client relationships, tasks, and meetings
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="new-task-btn">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="Task title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      placeholder="Task description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={newTask.priority} onValueChange={(v) => setNewTask({...newTask, priority: v})}>
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
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newTask.category} onValueChange={(v) => setNewTask({...newTask, category: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="follow_up">Follow Up</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewTaskOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddTask} className="bg-[#0F392B]">Create Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button className="bg-[#0F392B]" data-testid="new-client-btn">
              <UserPlus className="h-4 w-4 mr-2" />
              New Client
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">{households.length}</p>
                </div>
                <Users className="h-8 w-8 text-[#0F392B]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total AUM</p>
                  <p className="text-2xl font-bold">{formatCurrency(households.reduce((sum, h) => sum + (h.total_assets || 0), 0))}</p>
                </div>
                <DollarSign className="h-8 w-8 text-[#D4AF37]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Tasks</p>
                  <p className="text-2xl font-bold">{tasks.filter(t => t.status !== 'completed').length}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Meetings</p>
                  <p className="text-2xl font-bold">{meetings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Client List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Client Households</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search clients..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="search-clients"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredHouseholds.map((household) => (
                <div 
                  key={household.household_id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedHousehold?.household_id === household.household_id 
                      ? 'border-[#0F392B] bg-[#0F392B]/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedHousehold(household)}
                  data-testid={`household-${household.household_id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{household.name}</p>
                      <p className="text-sm text-muted-foreground">{household.primary_contact}</p>
                    </div>
                    <Badge className={getStatusColor(household.status)}>
                      {household.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{formatCurrency(household.net_worth)}</span>
                    <Badge variant="outline" className="text-xs">
                      {household.service_level}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Right Panel - Client Details */}
          <Card className="lg:col-span-2">
            {selectedHousehold ? (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedHousehold.name}</CardTitle>
                      <CardDescription>{selectedHousehold.primary_contact}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(selectedHousehold.status)}>
                      {selectedHousehold.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                      <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 mt-4">
                      {/* Contact Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedHousehold.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedHousehold.phone}</span>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Total Assets</p>
                          <p className="text-xl font-bold text-[#0F392B]">{formatCurrency(selectedHousehold.total_assets)}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Total Debt</p>
                          <p className="text-xl font-bold text-red-500">{formatCurrency(selectedHousehold.total_debt)}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Net Worth</p>
                          <p className="text-xl font-bold">{formatCurrency(selectedHousehold.net_worth)}</p>
                        </div>
                      </div>

                      {/* Members */}
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Household Members</h4>
                        <div className="space-y-2">
                          {selectedHousehold.members?.map((member, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.occupation}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline">{member.role}</Badge>
                                <p className="text-sm text-muted-foreground">Age: {member.age}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedHousehold.tags?.map((tag, idx) => (
                            <Badge key={idx} variant="secondary">{tag.replace('_', ' ')}</Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold">Client Notes</h4>
                        <Dialog open={newNoteOpen} onOpenChange={setNewNoteOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Plus className="h-4 w-4 mr-1" />
                              Add Note
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Note</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Note Type</Label>
                                <Select value={newNote.note_type} onValueChange={(v) => setNewNote({...newNote, note_type: v})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="meeting">Meeting</SelectItem>
                                    <SelectItem value="call">Call</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="advice">Advice</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Content</Label>
                                <Textarea 
                                  value={newNote.content}
                                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                                  placeholder="Enter note..."
                                  rows={4}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setNewNoteOpen(false)}>Cancel</Button>
                              <Button onClick={handleAddNote} className="bg-[#0F392B]">Add Note</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {notes.map((note) => (
                          <div key={note.note_id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{note.note_type}</Badge>
                              <span className="text-xs text-muted-foreground">{formatDateTime(note.created_at)}</span>
                            </div>
                            <p className="text-sm">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="tasks" className="mt-4">
                      <div className="space-y-3">
                        {tasks.filter(t => t.household_id === selectedHousehold.household_id).map((task) => (
                          <div key={task.task_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {getTaskStatusIcon(task.status)}
                              <div>
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-muted-foreground">Due: {formatDate(task.due_date)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                              {task.status !== 'completed' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleUpdateTask(task.task_id, 'completed')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[400px]">
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a client to view details</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Bottom Section - Tasks & Meetings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* All Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#D4AF37]" />
                All Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
              {tasks.map((task) => (
                <div key={task.task_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    {getTaskStatusIcon(task.status)}
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {households.find(h => h.household_id === task.household_id)?.name || 'General'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#D4AF37]" />
                Upcoming Meetings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
              {meetings.map((meeting) => (
                <div key={meeting.meeting_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{meeting.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {households.find(h => h.household_id === meeting.household_id)?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{meeting.meeting_type}</Badge>
                      <span className="text-xs text-muted-foreground">{meeting.duration_minutes} min</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDateTime(meeting.scheduled_at)}</p>
                    <Badge variant="secondary">{meeting.location}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ClientCRM;
