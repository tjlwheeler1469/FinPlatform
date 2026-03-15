import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Filter,
  MoreVertical,
  MessageSquare,
  ListTodo,
  FolderOpen,
  User,
  Building2
} from "lucide-react";
import axios from "axios";

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

const STATUS_COLORS = {
  active: 'bg-green-500',
  prospect: 'bg-blue-500',
  review: 'bg-amber-500',
  inactive: 'bg-gray-400'
};

const STAGE_COLORS = {
  discovery: 'bg-blue-500',
  analysis: 'bg-indigo-500',
  strategy: 'bg-purple-500',
  presentation: 'bg-pink-500',
  implementation: 'bg-orange-500',
  review: 'bg-green-500',
  complete: 'bg-emerald-500'
};

const PRIORITY_COLORS = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-blue-500 text-white'
};

const ClientCRM = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('clients');
  const [selectedClient, setSelectedClient] = useState(null);

  // Handle selecting a client - save to localStorage for Layout to pick up
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    // Save to localStorage so Layout can show client-specific navigation
    localStorage.setItem("selected_client", JSON.stringify({
      id: client.client_id,
      name: client.name,
      email: client.email
    }));
    // Navigate to the client's financial plan
    navigate("/financial-plan-generator");
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsRes, tasksRes] = await Promise.all([
        axios.get(`${API}/crm/clients`),
        axios.get(`${API}/crm/tasks`)
      ]);
      
      setClients(clientsRes.data.clients);
      setSummary(clientsRes.data.summary);
      setTasks(tasksRes.data.tasks);
    } catch (error) {
      console.error("Error fetching CRM data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const upcomingTasks = tasks.filter(t => t.status === 'pending').slice(0, 5);
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date() && t.status === 'pending';
  });

  return (
    <Layout>
      <div className="space-y-6" data-testid="client-crm-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Client CRM
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage clients, tasks, and advice workflows
            </p>
          </div>
          <Button className="bg-[#1a2744] hover:bg-[#1a2744]/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1a2744]/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#1a2744]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.total}</p>
                    <p className="text-xs text-muted-foreground">Total Clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{summary.active}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{summary.prospects}</p>
                    <p className="text-xs text-muted-foreground">Prospects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{summary.review_due}</p>
                    <p className="text-xs text-muted-foreground">Review Due</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-[#1a2744] to-[#1a2744]/80 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-[#D4A84C]" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatCurrency(summary.total_aum)}</p>
                    <p className="text-xs text-white/70">Total AUM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Tasks
              {overdueTasks.length > 0 && (
                <Badge className="bg-red-500 text-white ml-1">{overdueTasks.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-2">
              <FileText className="h-4 w-4" />
              Workflows
            </TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            {/* Search */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Client List */}
            <div className="space-y-3">
              {filteredClients.map((client) => (
                <Card 
                  key={client.client_id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedClient(client)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-[#1a2744] flex items-center justify-center text-white font-semibold text-lg">
                        {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{client.name}</h3>
                          <Badge className={`${STATUS_COLORS[client.status]} text-white text-xs`}>
                            {client.status}
                          </Badge>
                          {client.advice_stage && (
                            <Badge variant="outline" className="text-xs">
                              {client.advice_stage}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </span>
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Financial Summary */}
                      <div className="hidden md:flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#1a2744]">
                            {formatCurrency(client.financial_summary.net_worth)}
                          </p>
                          <p className="text-xs text-muted-foreground">Net Worth</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(client.financial_summary.annual_income)}
                          </p>
                          <p className="text-xs text-muted-foreground">Income</p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {client.notes_count} notes
                          </span>
                          <span className="flex items-center gap-1">
                            <ListTodo className="h-3 w-3" />
                            {client.tasks_count} tasks
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overdue Tasks */}
              {overdueTasks.length > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      Overdue Tasks ({overdueTasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {overdueTasks.map((task) => {
                        const client = clients.find(c => c.client_id === task.client_id);
                        return (
                          <div key={task.task_id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-200">
                            <Badge className={PRIORITY_COLORS[task.priority]}>
                              {task.priority}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">{client?.name}</p>
                            </div>
                            <div className="text-xs text-red-600">
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Tasks */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-[#D4A84C]" />
                    Upcoming Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingTasks.map((task) => {
                      const client = clients.find(c => c.client_id === task.client_id);
                      return (
                        <div key={task.task_id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <Badge className={PRIORITY_COLORS[task.priority]}>
                            {task.priority}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{client?.name}</p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-[#D4A84C]" />
                  Advice Workflow Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Workflow stages */}
                <div className="grid grid-cols-6 gap-2 mb-6">
                  {['discovery', 'analysis', 'strategy', 'presentation', 'implementation', 'review'].map((stage, index) => {
                    const clientsInStage = clients.filter(c => c.advice_stage === stage);
                    return (
                      <div key={stage} className="text-center">
                        <div className={`w-full h-2 rounded-full ${STAGE_COLORS[stage]} mb-2`} />
                        <p className="text-xs font-medium capitalize">{stage}</p>
                        <p className="text-lg font-bold">{clientsInStage.length}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Client cards by stage */}
                <div className="space-y-4">
                  {clients.map((client) => (
                    <div key={client.client_id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-[#1a2744] flex items-center justify-center text-white font-semibold">
                        {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{client.name}</p>
                        <Badge className={`${STAGE_COLORS[client.advice_stage]} text-white text-xs`}>
                          {client.advice_stage}
                        </Badge>
                      </div>
                      <div className="w-48">
                        <Progress 
                          value={
                            client.advice_stage === 'discovery' ? 15 :
                            client.advice_stage === 'analysis' ? 30 :
                            client.advice_stage === 'strategy' ? 45 :
                            client.advice_stage === 'presentation' ? 60 :
                            client.advice_stage === 'implementation' ? 75 :
                            client.advice_stage === 'review' ? 90 : 100
                          } 
                          className="h-2"
                        />
                      </div>
                      <Button variant="outline" size="sm">
                        View Workflow
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ClientCRM;
