import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Shield, CheckCircle, AlertTriangle, Clock, FileText, Users, Calendar, BarChart3, History } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ComplianceCenter() {
  const [dashboard, setDashboard] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientForCheck, setSelectedClientForCheck] = useState(null);
  const [complianceCheckResult, setComplianceCheckResult] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/compliance/dashboard`);
      setDashboard(response.data);
    } catch (error) {
      console.error("Error fetching compliance dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const runComplianceCheck = async (clientId) => {
    try {
      const response = await axios.post(`${API}/compliance/check?client_id=${clientId}&check_type=full`);
      setComplianceCheckResult(response.data);
      setSelectedClientForCheck(clientId);
    } catch (error) {
      console.error("Error running compliance check:", error);
    }
  };

  const generateSOA = async (clientId, clientName) => {
    try {
      const response = await axios.post(`${API}/compliance/soa/generate`, {
        client_id: clientId,
        client_name: clientName,
        advice_type: "comprehensive",
        recommendations: [
          { title: "Increase super contributions", summary: "Maximize concessional cap", implementation_cost: 0, ongoing_fee: 0 },
          { title: "Portfolio rebalancing", summary: "Reduce sector concentration", implementation_cost: 500, ongoing_fee: 1000 },
          { title: "Insurance review", summary: "Update death and TPD cover", implementation_cost: 0, ongoing_fee: 2500 }
        ],
        risk_profile: "balanced",
        goals: ["Comfortable retirement", "Children's education", "Pay off mortgage"],
        current_situation: {
          personal: { age: 45, occupation: "Professional", dependents: 2 },
          financial: { income: 180000, expenses: 120000, net_worth: 1500000 }
        }
      });
      alert(`SOA generated successfully: ${response.data.soa_id}`);
    } catch (error) {
      console.error("Error generating SOA:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="compliance-center-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance Center</h1>
          <p className="text-slate-400">Audit trails, SOA generation & regulatory compliance</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 px-4 py-2">
          <Shield className="w-4 h-4 mr-2" />
          AFSL Compliant
        </Badge>
      </div>

      {/* Overview Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-400 text-sm">Compliance Rate</p>
                  <p className="text-3xl font-bold text-white">{dashboard.overview.compliance_rate}%</p>
                </div>
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Clients</p>
                  <p className="text-3xl font-bold text-white">{dashboard.overview.total_clients}</p>
                </div>
                <Users className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">SOAs This Month</p>
                  <p className="text-3xl font-bold text-white">{dashboard.metrics.soas_generated_mtd}</p>
                </div>
                <FileText className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-500/20 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-400 text-sm">Action Required</p>
                  <p className="text-3xl font-bold text-white">{dashboard.overview.action_required}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-blue-600">Upcoming Reviews</TabsTrigger>
          <TabsTrigger value="check" className="data-[state=active]:bg-blue-600">Compliance Check</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Risk Alerts */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Risk Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard?.risk_alerts.map((alert, idx) => (
                  <div key={`item-${idx}`} className={`p-4 rounded-lg border ${
                    alert.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                    alert.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                    'bg-blue-500/10 border-blue-500/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        alert.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }>
                        {alert.severity}
                      </Badge>
                      <span className="text-white">{alert.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{dashboard?.metrics.reviews_completed_mtd}</p>
                <p className="text-slate-400 text-sm">Reviews Completed</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{dashboard?.metrics.average_compliance_score}%</p>
                <p className="text-slate-400 text-sm">Avg Compliance Score</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <History className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{dashboard?.metrics.audit_logs_this_month}</p>
                <p className="text-slate-400 text-sm">Audit Logs</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <FileText className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{dashboard?.metrics.soas_generated_mtd}</p>
                <p className="text-slate-400 text-sm">SOAs Generated</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Upcoming Reviews
              </CardTitle>
              <CardDescription className="text-slate-400">
                Client reviews scheduled for the coming weeks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard?.upcoming_reviews.map((review, idx) => (
                  <div key={`item-${idx}`} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {review.client_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-white">{review.client_name}</p>
                        <p className="text-sm text-slate-400">{review.review_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Due Date</p>
                        <p className="text-white font-medium">{review.due_date}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => runComplianceCheck(review.client_id)}
                        >
                          Run Check
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-slate-600"
                          onClick={() => generateSOA(review.client_id, review.client_name)}
                        >
                          Generate SOA
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="check" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Run Compliance Check</CardTitle>
                <CardDescription className="text-slate-400">
                  Select a client to run a full compliance check
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["client_1", "client_2", "client_3"].map((clientId, idx) => (
                    <Button 
                      key={clientId}
                      variant="outline" 
                      className={`w-full justify-start border-slate-700 hover:bg-slate-700 ${
                        selectedClientForCheck === clientId ? 'bg-blue-600/20 border-blue-500' : ''
                      }`}
                      onClick={() => runComplianceCheck(clientId)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Client {idx + 1} ({clientId})
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {complianceCheckResult && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Compliance Check Results</CardTitle>
                    <Badge className={complianceCheckResult.overall_status === 'compliant' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}>
                      {complianceCheckResult.overall_status}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-400">
                    Score: {complianceCheckResult.score}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(complianceCheckResult.checks).map(([key, check]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-3">
                          {check.status === 'pass' ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                          )}
                          <div>
                            <p className="text-white font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                            <p className="text-slate-400 text-sm">{check.details}</p>
                          </div>
                        </div>
                        <Badge className={check.status === 'pass' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}>
                          {check.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard?.recent_activity.map((activity, idx) => (
                  <div key={`item-${idx}`} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.action}</p>
                      <p className="text-slate-400 text-sm">Client: {activity.client}</p>
                    </div>
                    <p className="text-slate-500 text-sm">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
