import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, CheckCircle, AlertTriangle, Clock, FileText, Users, Calendar, 
  BarChart3, History, ChevronRight, Eye, Edit, Download, Send
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClientCompliance() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [clientCheck, setClientCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const clientId = localStorage.getItem("active_client_id") || "client_1";

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, checkRes] = await Promise.all([
        axios.get(`${API}/compliance/dashboard`),
        axios.post(`${API}/compliance/check?client_id=${clientId}&check_type=full`)
      ]);
      setDashboard(dashboardRes.data);
      setClientCheck(checkRes.data);
    } catch (error) {
      console.error("Error fetching compliance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSOA = async () => {
    try {
      const response = await axios.post(`${API}/compliance/soa/generate`, {
        client_id: clientId,
        client_name: "Client",
        advice_type: "comprehensive",
        recommendations: [
          { title: "Increase super contributions", summary: "Maximize concessional cap", implementation_cost: 0, ongoing_fee: 0 },
          { title: "Portfolio rebalancing", summary: "Reduce sector concentration", implementation_cost: 500, ongoing_fee: 1000 },
        ],
        risk_profile: "balanced",
        goals: ["Comfortable retirement", "Pay off mortgage"],
        current_situation: {
          personal: { age: 45, occupation: "Professional" },
          financial: { income: 180000, expenses: 120000 }
        }
      });
      toast.success(`SOA generated: ${response.data.soa_id}`);
    } catch (error) {
      console.error("Error generating SOA:", error);
      toast.error("Failed to generate SOA");
    }
  };

  const createAuditLog = async (action) => {
    try {
      await axios.post(`${API}/compliance/audit-log`, {
        client_id: clientId,
        action_type: action,
        description: `${action} completed for client`,
        advisor_id: "advisor_1"
      });
      toast.success("Audit log created");
    } catch (error) {
      console.error("Error creating audit log:", error);
    }
  };

  const handleActionClick = (action) => {
    switch (action.type) {
      case "review":
        navigate("/client-crm");
        break;
      case "soa":
        generateSOA();
        break;
      case "risk_profile":
        navigate("/client-wealth");
        break;
      default:
        toast.info(`Action: ${action.label}`);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-[#D4A84C] border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="client-compliance-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-[#D4A84C]" />
              Compliance Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Audit trails, SOA generation & regulatory compliance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-green-600">
              <Shield className="h-3 w-3" />
              AFSL Compliant
            </Badge>
            <Button onClick={generateSOA} className="bg-[#1a2744]">
              <FileText className="h-4 w-4 mr-2" />
              Generate SOA
            </Button>
          </div>
        </div>

        {/* Client Compliance Score */}
        {clientCheck && (
          <Card className={`border-l-4 ${clientCheck.overall_status === 'compliant' ? 'border-l-green-500' : 'border-l-amber-500'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    clientCheck.overall_status === 'compliant' ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    {clientCheck.overall_status === 'compliant' ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Client Compliance Score: {clientCheck.score}%
                    </h2>
                    <p className="text-muted-foreground">
                      Status: <span className={`font-medium ${clientCheck.overall_status === 'compliant' ? 'text-green-600' : 'text-amber-600'}`}>
                        {clientCheck.overall_status === 'compliant' ? 'Fully Compliant' : 'Action Required'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-sm">Next Review</p>
                  <p className="font-semibold">{clientCheck.next_review_date}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Compliance Rate</p>
                  <p className="text-2xl font-bold text-green-600">{dashboard?.overview?.compliance_rate || 0}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">SOAs This Month</p>
                  <p className="text-2xl font-bold">{dashboard?.metrics?.soas_generated_mtd || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-[#D4A84C]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Reviews Completed</p>
                  <p className="text-2xl font-bold">{dashboard?.metrics?.reviews_completed_mtd || 0}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className={dashboard?.overview?.action_required > 0 ? 'border-amber-500 border-l-4' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Action Required</p>
                  <p className="text-2xl font-bold text-amber-600">{dashboard?.overview?.action_required || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Compliance Checks</TabsTrigger>
            <TabsTrigger value="reviews">Upcoming Reviews</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Check Results</CardTitle>
                <CardDescription>Current status of all compliance requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientCheck && Object.entries(clientCheck.checks).map(([key, check]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        {check.status === 'pass' ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-amber-600" />
                        )}
                        <div>
                          <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-muted-foreground text-sm">{check.details}</p>
                          {check.last_verified && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last verified: {check.last_verified}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {check.next_review && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Next Review</p>
                            <p className="text-sm font-medium">{check.next_review}</p>
                          </div>
                        )}
                        <Badge className={check.status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                          {check.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#D4A84C]" />
                  Upcoming Reviews
                </CardTitle>
                <CardDescription>Scheduled compliance reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.upcoming_reviews?.map((review, idx) => (
                    <div key={`item-${idx}`} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a2744] to-[#2d3a5c] flex items-center justify-center text-white font-semibold">
                          {review.client_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{review.client_name}</p>
                          <p className="text-muted-foreground text-sm">{review.review_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Due Date</p>
                          <p className="font-medium">{review.due_date}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              localStorage.setItem("active_client_id", review.client_id);
                              navigate("/client-wealth");
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => generateSOA()}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            SOA
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-[#D4A84C]" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.recent_activity?.map((activity, idx) => (
                    <div key={`item-${idx}`} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-[#D4A84C]/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#D4A84C]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-muted-foreground text-sm">Client: {activity.client}</p>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Risk Alerts - Actionable */}
        {dashboard?.risk_alerts && dashboard.risk_alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Action Items
              </CardTitle>
              <CardDescription>Items requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.risk_alerts.map((alert, idx) => (
                  <div 
                    key={`item-${idx}`} 
                    className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                      alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                      alert.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => handleActionClick({ type: 'review', label: alert.message })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={
                          alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {alert.severity}
                        </Badge>
                        <span className="font-medium">{alert.message}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
