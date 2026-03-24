import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Play, Rewind, FastForward, FileText, Clock, User, CheckCircle2,
  AlertTriangle, Download, Eye, RefreshCw, History, ArrowRight, Shield
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ReplayAdvicePage() {
  const [activeTab, setActiveTab] = useState('sessions');
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionTimeline, setSessionTimeline] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [newSession, setNewSession] = useState({
    client_id: '',
    client_name: '',
    adviser_id: 'ADV001',
    adviser_name: 'Current Adviser',
    session_type: 'scenario_analysis'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/replay/sessions?limit=50`).then(r => r.json()),
        fetch(`${API_URL}/api/replay/dashboard/stats`).then(r => r.json())
      ]);
      setSessions(sessionsRes.sessions || []);
      setDashboardStats(statsRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const loadSessionTimeline = async (sessionId) => {
    try {
      const timeline = await fetch(`${API_URL}/api/replay/session/${sessionId}/timeline`).then(r => r.json());
      setSessionTimeline(timeline);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    }
  };

  const viewSession = async (sessionId) => {
    try {
      const session = await fetch(`${API_URL}/api/replay/session/${sessionId}`).then(r => r.json());
      setSelectedSession(session);
      loadSessionTimeline(sessionId);
      setActiveTab('replay');
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const exportSession = async (sessionId, format = 'json') => {
    try {
      const response = await fetch(`${API_URL}/api/replay/session/${sessionId}/export?format=${format}`);
      if (format === 'pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asic_export_${sessionId}.pdf`;
        a.click();
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asic_export_${sessionId}.json`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const createSampleSession = async () => {
    try {
      const result = await fetch(`${API_URL}/api/replay/demo/create-sample-session`, {
        method: 'POST'
      }).then(r => r.json());
      alert(`Sample session created: ${result.session_id}`);
      loadData();
    } catch (error) {
      console.error('Failed to create sample:', error);
    }
  };

  const startNewSession = async () => {
    try {
      const result = await fetch(`${API_URL}/api/replay/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      }).then(r => r.json());
      alert(`Session started: ${result.session_id}`);
      setShowNewSessionDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const getSeverityColor = (result) => {
    switch (result) {
      case 'PASS': return 'bg-green-100 text-green-800 border-green-200';
      case 'WARN': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BLOCK': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="replay-advice-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <History className="h-7 w-7 text-blue-600" />
              Replay Advice - Audit Mode
            </h1>
            <p className="text-gray-600 mt-1">
              Full audit replay capability for ASIC-ready advice documentation
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={createSampleSession} data-testid="create-sample-btn">
              <Play className="h-4 w-4 mr-2" />
              Create Demo Session
            </Button>
            <Button onClick={() => setShowNewSessionDialog(true)} data-testid="new-session-btn">
              <FileText className="h-4 w-4 mr-2" />
              New Advice Session
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{dashboardStats.total_sessions}</div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{dashboardStats.monthly_sessions}</div>
              <div className="text-sm text-gray-600">This Month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-600">{dashboardStats.completion_rate}%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">{dashboardStats.sessions_with_compliance_issues}</div>
              <div className="text-sm text-gray-600">With Issues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">{dashboardStats.exports_generated}</div>
              <div className="text-sm text-gray-600">Exports Generated</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="sessions" data-testid="sessions-tab">Advice Sessions</TabsTrigger>
          <TabsTrigger value="replay" data-testid="replay-tab">Replay View</TabsTrigger>
          <TabsTrigger value="exports" data-testid="exports-tab">ASIC Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>All Advice Sessions</CardTitle>
              <CardDescription>View and replay past advice sessions with full audit trails</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => viewSession(session.id)}
                    data-testid={`session-${session.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${session.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <div>
                          <div className="font-medium">{session.client_name}</div>
                          <div className="text-sm text-gray-500">
                            {session.adviser_name} | {session.session_type?.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{session.id}</Badge>
                        <div className="text-sm text-gray-500">
                          {new Date(session.started_at).toLocaleDateString()}
                        </div>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); viewSession(session.id); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); exportSession(session.id, 'pdf'); }}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No advice sessions found. Create a demo session to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replay">
          {selectedSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Session Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {selectedSession.timeline?.map((event, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              event.event.includes('started') ? 'bg-blue-500' :
                              event.event.includes('ended') ? 'bg-green-500' :
                              event.event.includes('compliance') ? 'bg-purple-500' :
                              'bg-gray-400'
                            }`} />
                            {idx < selectedSession.timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="text-sm font-medium">{event.event.replace(/_/g, ' ')}</div>
                            <div className="text-xs text-gray-500">{event.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Session Details */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedSession.client_name}</CardTitle>
                      <CardDescription>Session: {selectedSession.id}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => exportSession(selectedSession.id, 'json')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                      </Button>
                      <Button onClick={() => exportSession(selectedSession.id, 'pdf')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Inputs Section */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Captured Inputs ({selectedSession.inputs?.length || 0})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedSession.inputs?.map((input, idx) => (
                          <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                            <Badge variant="outline" className="mb-2">{input.input_type}</Badge>
                            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-24">
                              {JSON.stringify(input.data, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Scenarios Section */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Generated Scenarios ({selectedSession.scenarios?.length || 0})
                      </h3>
                      {selectedSession.scenarios?.map((scenario, idx) => (
                        <div key={idx} className="border rounded-lg p-4 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge>{scenario.scenario_id}</Badge>
                            <span className="text-xs text-gray-500">
                              Generated: {new Date(scenario.generated_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            {scenario.scenarios_generated?.map((opt, optIdx) => (
                              <div key={optIdx} className="bg-gray-50 rounded p-3">
                                <div className="font-medium text-sm">Option {opt.option}</div>
                                <div className="text-xs text-gray-600">{opt.allocation}</div>
                                <div className="text-lg font-bold mt-1">
                                  ${(opt.projected_value || 0).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Decisions Section */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Recorded Decisions ({selectedSession.decisions?.length || 0})
                      </h3>
                      {selectedSession.decisions?.map((decision, idx) => (
                        <div key={idx} className="border rounded-lg p-4 bg-green-50 border-green-200">
                          <div className="font-medium">{decision.selected_option}</div>
                          <div className="text-sm text-gray-600 mt-2">{decision.justification}</div>
                          <div className="flex gap-4 mt-3 text-xs">
                            <span className={decision.adviser_confirmation ? 'text-green-600' : 'text-gray-400'}>
                              {decision.adviser_confirmation ? '✓' : '○'} Adviser Confirmed
                            </span>
                            <span className={decision.client_acknowledgment ? 'text-green-600' : 'text-gray-400'}>
                              {decision.client_acknowledgment ? '✓' : '○'} Client Acknowledged
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Compliance Section */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Compliance Checks ({selectedSession.compliance_checks?.length || 0})
                      </h3>
                      {selectedSession.compliance_checks?.map((check, idx) => (
                        <div key={idx} className={`border rounded-lg p-4 ${getSeverityColor(check.overall_result)}`}>
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={getSeverityColor(check.overall_result)}>
                              {check.overall_result}
                            </Badge>
                            <span className="text-xs">{new Date(check.checked_at).toLocaleString()}</span>
                          </div>
                          <div className="space-y-2">
                            {check.checks_performed?.map((c, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-2 text-sm">
                                {c.result === 'PASS' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                )}
                                <span>{c.check}: {c.details}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Select an advice session from the Sessions tab to view replay
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="exports">
          <Card>
            <CardHeader>
              <CardTitle>ASIC-Ready Exports</CardTitle>
              <CardDescription>
                Generate regulatory-compliant export packages with full audit trails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Shield className="h-4 w-4" />
                <AlertTitle>Regulatory Compliance</AlertTitle>
                <AlertDescription>
                  All exports include cryptographic hashes, timestamps, and are formatted for ASIC record-keeping requirements (7-year retention).
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.slice(0, 6).map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{session.client_name}</div>
                        <div className="text-sm text-gray-500">{session.id}</div>
                      </div>
                      <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => exportSession(session.id, 'json')}>
                        JSON Export
                      </Button>
                      <Button size="sm" onClick={() => exportSession(session.id, 'pdf')}>
                        PDF Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Session Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Advice Session</DialogTitle>
            <DialogDescription>
              Begin capturing advice journey for full replay capability
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Client ID</label>
              <Input
                value={newSession.client_id}
                onChange={(e) => setNewSession({ ...newSession, client_id: e.target.value })}
                placeholder="XP-001"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Client Name</label>
              <Input
                value={newSession.client_name}
                onChange={(e) => setNewSession({ ...newSession, client_name: e.target.value })}
                placeholder="James Mitchell"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Session Type</label>
              <Select
                value={newSession.session_type}
                onValueChange={(v) => setNewSession({ ...newSession, session_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scenario_analysis">Scenario Analysis</SelectItem>
                  <SelectItem value="review">Annual Review</SelectItem>
                  <SelectItem value="rebalance">Portfolio Rebalance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>Cancel</Button>
            <Button onClick={startNewSession}>Start Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
