import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Users, Clock, AlertTriangle, CheckCircle, TrendingUp, FileText, Zap, Target, DollarSign } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MeetingPrep() {
  const [clients] = useState([
    { id: "client_1", name: "John Smith", portfolio_value: 1500000, ytd_return: 0.12, retirement_probability: 72, meeting_time: "10:00 AM" },
    { id: "client_2", name: "Sarah Johnson", portfolio_value: 2200000, ytd_return: 0.08, retirement_probability: 85, meeting_time: "11:30 AM" },
    { id: "client_3", name: "Michael Brown", portfolio_value: 850000, ytd_return: 0.15, retirement_probability: 58, meeting_time: "2:00 PM" },
  ]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [meetingPrep, setMeetingPrep] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePrep = async (client) => {
    setLoading(true);
    setSelectedClient(client);
    try {
      const response = await axios.post(`${API}/meeting-prep/generate`, {
        client_id: client.id,
        client_name: client.name,
        portfolio_value: client.portfolio_value,
        ytd_return: client.ytd_return,
        retirement_probability: client.retirement_probability,
      });
      setMeetingPrep(response.data);
    } catch (error) {
      console.error("Error generating meeting prep:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/50";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "positive": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      case "opportunity": return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "warning": return "bg-amber-500/20 text-amber-400 border-amber-500/50";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-400";
      case "medium": return "bg-amber-500/20 text-amber-400";
      case "low": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="space-y-6" data-testid="meeting-prep-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Meeting Prep</h1>
          <p className="text-slate-400">30-second comprehensive client briefings</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 px-4 py-2">
          <Zap className="w-4 h-4 mr-2" />
          AI-Powered
        </Badge>
      </div>

      {/* Today's Meetings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Today's Meetings
          </CardTitle>
          <CardDescription className="text-slate-400">
            Click on a client to generate AI meeting prep
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Card 
                key={client.id}
                className={`cursor-pointer transition-all hover:border-blue-500 ${
                  selectedClient?.id === client.id ? 'border-blue-500 bg-blue-500/10' : 'bg-slate-900/50 border-slate-700'
                }`}
                onClick={() => generatePrep(client)}
                data-testid={`client-card-${client.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        <p className="text-sm text-slate-400">{client.meeting_time}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Portfolio</span>
                      <span className="text-white font-medium">${(client.portfolio_value / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">YTD Return</span>
                      <span className="text-emerald-400 font-medium">+{(client.ytd_return * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Retirement Prob.</span>
                      <span className={`font-medium ${client.retirement_probability >= 80 ? 'text-emerald-400' : client.retirement_probability >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                        {client.retirement_probability}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meeting Prep Results */}
      {loading && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-400">Generating AI Meeting Prep...</p>
          </CardContent>
        </Card>
      )}

      {meetingPrep && !loading && (
        <div className="space-y-6" data-testid="meeting-prep-results">
          {/* Client Snapshot */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Client Snapshot: {meetingPrep.client_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm">Net Worth</p>
                  <p className="text-2xl font-bold text-white">${(meetingPrep.client_snapshot.net_worth / 1000000).toFixed(2)}M</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm">YTD Return</p>
                  <p className="text-2xl font-bold text-emerald-400">{meetingPrep.client_snapshot.ytd_return_formatted}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm">Retirement Probability</p>
                  <p className={`text-2xl font-bold ${meetingPrep.client_snapshot.retirement_probability >= 80 ? 'text-emerald-400' : meetingPrep.client_snapshot.retirement_probability >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {meetingPrep.client_snapshot.retirement_probability}%
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm">Years to Retirement</p>
                  <p className="text-2xl font-bold text-white">{meetingPrep.client_snapshot.years_to_retirement}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="insights" className="data-[state=active]:bg-blue-600">
                Portfolio Insights ({meetingPrep.portfolio_insights.length})
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-blue-600">
                Risk Alerts ({meetingPrep.risk_alerts.length})
              </TabsTrigger>
              <TabsTrigger value="talking" className="data-[state=active]:bg-blue-600">
                Talking Points
              </TabsTrigger>
              <TabsTrigger value="actions" className="data-[state=active]:bg-blue-600">
                Action Items
              </TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="mt-4">
              <div className="grid gap-4">
                {meetingPrep.portfolio_insights.map((insight, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Badge className={getSeverityColor(insight.severity)}>
                          {insight.type}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{insight.title}</h4>
                          <p className="text-slate-400 text-sm mt-1">{insight.detail}</p>
                          <p className="text-blue-400 text-sm mt-2">
                            <Target className="w-4 h-4 inline mr-1" />
                            {insight.recommendation}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="mt-4">
              <div className="grid gap-4">
                {meetingPrep.risk_alerts.map((alert, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className={`w-5 h-5 ${alert.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{alert.title}</h4>
                            <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          </div>
                          <p className="text-slate-400 text-sm">{alert.detail}</p>
                          <p className="text-amber-400 text-sm mt-2">
                            <Zap className="w-4 h-4 inline mr-1" />
                            {alert.action}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="talking" className="mt-4">
              <div className="grid gap-4">
                {meetingPrep.talking_points.map((topic, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-white">{topic.topic}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {topic.points.map((point, pidx) => (
                          <li key={pidx} className="flex items-center gap-2 text-slate-300">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="actions" className="mt-4">
              <div className="grid gap-4">
                {meetingPrep.action_items.map((item, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{item.action}</h4>
                          <p className="text-slate-400 text-sm mt-1">{item.reason}</p>
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-500">Deadline: {item.deadline}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
