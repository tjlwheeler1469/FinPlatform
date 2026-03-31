import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  FileText, 
  Zap, 
  Target, 
  DollarSign,
  Calendar,
  Brain,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Shield,
  PieChart,
  MessageSquare,
  Play,
  Eye,
  Phone,
  Video,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const MeetingPrep = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get('client');
  
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [meetingPrep, setMeetingPrep] = useState(null);
  const [todaysMeetings, setTodaysMeetings] = useState([]);

  // Client list with full data
  const clients = [
    { id: "client_1", name: "Wheeler Family", aum: 2920000, ytd_return: 0.084, retirement_probability: 72, risk_profile: "Balanced", type: "Family", age: 45, meeting_time: "10:00 AM" },
    { id: "client_2", name: "Chen Investment Trust", aum: 4200000, ytd_return: 0.112, retirement_probability: 85, risk_profile: "Growth", type: "Trust", age: 52, meeting_time: "11:30 AM" },
    { id: "client_3", name: "Thompson SMSF", aum: 890000, ytd_return: 0.065, retirement_probability: 58, risk_profile: "Conservative", type: "SMSF", age: 62, meeting_time: "2:00 PM" },
    { id: "client_4", name: "Patel Holdings", aum: 7500000, ytd_return: 0.142, retirement_probability: 78, risk_profile: "High Growth", type: "Company", age: 48 },
    { id: "client_5", name: "Garcia Family", aum: 820000, ytd_return: 0.091, retirement_probability: 65, risk_profile: "Balanced", type: "Family", age: 38 },
    { id: "client_6", name: "Anderson SMSF", aum: 1250000, ytd_return: 0.073, retirement_probability: 82, risk_profile: "Conservative", type: "SMSF", age: 58 },
    { id: "client_7", name: "Liu Family Trust", aum: 3100000, ytd_return: 0.098, retirement_probability: 75, risk_profile: "Growth", type: "Trust", age: 42 },
    { id: "client_8", name: "Morrison Super", aum: 580000, ytd_return: 0.055, retirement_probability: 48, risk_profile: "Balanced", type: "SMSF", age: 55 }
  ];

  useEffect(() => {
    // Set today's meetings (clients with meeting times)
    setTodaysMeetings(clients.filter(c => c.meeting_time));
    
    // Auto-select client from URL if provided
    if (clientIdFromUrl) {
      const client = clients.find(c => c.id === clientIdFromUrl);
      if (client) {
        generatePrep(client);
      }
    }
  }, [clientIdFromUrl]);

  const generatePrep = async (client) => {
    setLoading(true);
    setSelectedClient(client);
    
    try {
      const response = await fetch(`${API_URL}/api/meeting-prep/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          client_name: client.name,
          meeting_type: "review",
          portfolio_value: client.aum,
          ytd_return: client.ytd_return,
          retirement_probability: client.retirement_probability,
          risk_profile: client.risk_profile,
          age: client.age
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMeetingPrep(data);
        toast.success(`Meeting prep generated for ${client.name}`);
      }
    } catch (error) {
      console.error("Error generating meeting prep:", error);
      toast.error("Failed to generate meeting prep");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-700 border-blue-200";
      case "positive": return "bg-green-100 text-green-700 border-green-200";
      case "opportunity": return "bg-purple-100 text-purple-700 border-purple-200";
      case "warning": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high": return <Badge variant="destructive">High Priority</Badge>;
      case "medium": return <Badge className="bg-yellow-500">Medium</Badge>;
      case "low": return <Badge variant="secondary">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="meeting-prep-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-[#D4A84C]" />
              AI Meeting Prep
            </h1>
            <p className="text-muted-foreground">30-second comprehensive client briefings powered by AI</p>
          </div>
          <Badge className="bg-[#1a2744] text-white px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            AI-Powered
          </Badge>
        </div>

        {/* Today's Meetings */}
        {todaysMeetings.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-[#1a2744]" />
                Today's Meetings
              </CardTitle>
              <CardDescription>Click on a client to generate AI meeting prep</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {todaysMeetings.map((client) => (
                  <Card 
                    key={client.id}
                    className={`cursor-pointer transition-all hover:shadow-md hover:border-[#D4A84C] ${
                      selectedClient?.id === client.id ? 'border-[#D4A84C] bg-amber-50' : ''
                    }`}
                    onClick={() => generatePrep(client)}
                    data-testid={`client-card-${client.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-[#1a2744] text-white text-sm">
                              {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-[#1a2744]">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.type}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {client.meeting_time}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Portfolio</p>
                          <p className="font-bold">{formatCurrency(client.aum)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">YTD Return</p>
                          <p className={`font-bold ${client.ytd_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {client.ytd_return >= 0 ? '+' : ''}{(client.ytd_return * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3"
                        disabled={loading && selectedClient?.id === client.id}
                      >
                        {loading && selectedClient?.id === client.id ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Generate Prep
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Clients Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-[#1a2744]" />
              All Clients
            </CardTitle>
            <CardDescription>Generate meeting prep for any client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {clients.map((client) => (
                <div 
                  key={client.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-[#D4A84C] ${
                    selectedClient?.id === client.id ? 'border-[#D4A84C] bg-amber-50' : ''
                  }`}
                  onClick={() => generatePrep(client)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#1a2744] text-white text-xs">
                        {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{formatCurrency(client.aum)}</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Meeting Prep Results */}
        {meetingPrep && selectedClient && (
          <Card className="border-2 border-[#D4A84C]/30">
            <CardHeader className="bg-gradient-to-r from-[#1a2744]/5 to-[#D4A84C]/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Brain className="h-6 w-6 text-[#D4A84C]" />
                    Meeting Brief: {selectedClient.name}
                  </CardTitle>
                  <CardDescription>AI-generated in 30 seconds • Ready for your meeting</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/client-wealth?client=${selectedClient.id}`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Full Profile
                  </Button>
                  <Button size="sm" className="bg-[#1a2744]">
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="snapshot" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="risks">Risks</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                {/* Client Snapshot */}
                <TabsContent value="snapshot" className="mt-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Net Worth</p>
                        <p className="text-2xl font-bold text-[#1a2744]">
                          {formatCurrency(meetingPrep.snapshot?.net_worth || selectedClient.aum * 1.5)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Portfolio Value</p>
                        <p className="text-2xl font-bold text-[#1a2744]">
                          {formatCurrency(meetingPrep.snapshot?.portfolio_value || selectedClient.aum)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">YTD Return</p>
                        <p className={`text-2xl font-bold ${(meetingPrep.snapshot?.ytd_return || selectedClient.ytd_return) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {((meetingPrep.snapshot?.ytd_return || selectedClient.ytd_return) * 100).toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Retirement Probability</p>
                        <p className="text-2xl font-bold text-[#1a2744]">
                          {meetingPrep.snapshot?.retirement_probability || selectedClient.retirement_probability}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {meetingPrep.quick_stats && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-3">Quick Stats</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Years to Retirement</p>
                          <p className="font-medium">{meetingPrep.quick_stats.years_to_retirement}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Risk Profile</p>
                          <p className="font-medium">{meetingPrep.quick_stats.risk_profile}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Super Balance</p>
                          <p className="font-medium">{formatCurrency(meetingPrep.quick_stats.super_balance || 400000)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Property Value</p>
                          <p className="font-medium">{formatCurrency(meetingPrep.quick_stats.property_value || 800000)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Portfolio Insights */}
                <TabsContent value="insights" className="mt-4">
                  <div className="space-y-3">
                    {meetingPrep.portfolio_insights?.map((insight, i) => (
                      <div key={`item-${i}`} className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{insight.title}</h4>
                            <p className="text-sm mt-1">{insight.detail}</p>
                            {insight.recommendation && (
                              <p className="text-sm mt-2 font-medium">
                                → {insight.recommendation}
                              </p>
                            )}
                          </div>
                          <Badge className={getSeverityColor(insight.severity)}>
                            {insight.type}
                          </Badge>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        No specific insights for this client
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Risk Alerts */}
                <TabsContent value="risks" className="mt-4">
                  <div className="space-y-3">
                    {meetingPrep.risk_alerts?.map((alert, i) => (
                      <div key={`item-${i}`} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                            alert.severity === 'high' ? 'text-red-500' : 
                            alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                          }`} />
                          <div>
                            <h4 className="font-semibold">{alert.title}</h4>
                            <p className="text-sm mt-1">{alert.detail}</p>
                            {alert.action && (
                              <p className="text-sm mt-2 font-medium">
                                Action: {alert.action}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        No significant risks identified
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Talking Points */}
                <TabsContent value="topics" className="mt-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#1a2744]">Suggested Discussion Topics</h4>
                    {meetingPrep.talking_points?.map((topic, i) => (
                      <div key={`item-${i}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-[#1a2744] text-white rounded-full flex items-center justify-center text-sm">
                          {i + 1}
                        </div>
                        <p className="text-sm">{topic}</p>
                      </div>
                    )) || (
                      <>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-[#1a2744] text-white rounded-full flex items-center justify-center text-sm">1</div>
                          <p className="text-sm">Review portfolio performance and allocation</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-[#1a2744] text-white rounded-full flex items-center justify-center text-sm">2</div>
                          <p className="text-sm">Discuss retirement planning and timeline</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-[#1a2744] text-white rounded-full flex items-center justify-center text-sm">3</div>
                          <p className="text-sm">Review super contribution strategy for EOFY</p>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* Action Items */}
                <TabsContent value="actions" className="mt-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#1a2744]">Post-Meeting Action Items</h4>
                    {meetingPrep.action_items?.map((action, i) => (
                      <div key={`item-${i}`} className="flex items-start gap-3 p-3 border rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{action.action}</p>
                          {action.owner && (
                            <p className="text-xs text-muted-foreground mt-1">Owner: {action.owner}</p>
                          )}
                        </div>
                        {action.deadline && (
                          <Badge variant="outline" className="text-xs">{action.deadline}</Badge>
                        )}
                      </div>
                    )) || (
                      <>
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Update client file with meeting notes</p>
                            <p className="text-xs text-muted-foreground">Owner: Adviser</p>
                          </div>
                          <Badge variant="outline">Today</Badge>
                        </div>
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Send follow-up email with recommendations</p>
                            <p className="text-xs text-muted-foreground">Owner: Adviser</p>
                          </div>
                          <Badge variant="outline">This week</Badge>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Compliance Section */}
              {meetingPrep.compliance && (
                <div className="mt-6 p-4 border-t">
                  <h4 className="font-semibold text-[#1a2744] flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5" />
                    Compliance Checklist
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {Object.entries(meetingPrep.compliance).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {value ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default MeetingPrep;
