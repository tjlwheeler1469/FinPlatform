import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  AlertOctagon, AlertTriangle, Clock, FileText, Shield, Download, Plus,
  RefreshCw, ExternalLink, Bell, CheckCircle2, XCircle, User, Calendar
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function BreachRegister() {
  const [activeTab, setActiveTab] = useState('register');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [breaches, setBreaches] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedBreach, setSelectedBreach] = useState(null);
  
  // Dialogs
  const [showNewBreachDialog, setShowNewBreachDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showAsicDialog, setShowAsicDialog] = useState(false);
  
  // New Breach Form
  const [newBreach, setNewBreach] = useState({
    title: '',
    description: '',
    severity: 'medium',
    category: 'documentation',
    adviser_id: '',
    adviser_name: '',
    client_id: '',
    client_name: '',
    identified_by: 'compliance_team',
    identified_date: new Date().toISOString().split('T')[0],
    root_cause: ''
  });
  
  // Update Form
  const [updateForm, setUpdateForm] = useState({
    status: '',
    update_notes: '',
    updated_by: 'compliance_team',
    remediation_action: '',
    client_notified: false,
    compensation_required: false,
    compensation_amount: 0
  });
  
  // ASIC Report Form
  const [asicForm, setAsicForm] = useState({
    reportable_reason: 'significant_breach',
    report_reference: '',
    reported_by: 'compliance_officer',
    report_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [breachesRes, dashRes] = await Promise.all([
        fetch(`${API_URL}/api/breaches/register`).then(r => r.json()),
        fetch(`${API_URL}/api/breaches/dashboard`).then(r => r.json())
      ]);
      setBreaches(breachesRes.breaches || []);
      setDashboard(dashRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const seedDemoData = async () => {
    try {
      await fetch(`${API_URL}/api/breaches/demo/seed-data`, { method: 'POST' });
      loadData();
    } catch (error) {
      console.error('Failed to seed data:', error);
    }
  };

  const registerBreach = async () => {
    try {
      await fetch(`${API_URL}/api/breaches/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBreach)
      });
      setShowNewBreachDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to register breach:', error);
    }
  };

  const updateBreach = async () => {
    if (!selectedBreach) return;
    try {
      await fetch(`${API_URL}/api/breaches/register/${selectedBreach.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateForm)
      });
      setShowUpdateDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to update breach:', error);
    }
  };

  const reportToAsic = async () => {
    if (!selectedBreach) return;
    try {
      await fetch(`${API_URL}/api/breaches/register/${selectedBreach.id}/report-asic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...asicForm, breach_id: selectedBreach.id })
      });
      setShowAsicDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to report to ASIC:', error);
    }
  };

  const downloadReport = async () => {
    try {
      const data = await fetch(`${API_URL}/api/breaches/report/regulatory`).then(r => r.json());
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `breach_report_${data.report_id}.json`;
      a.click();
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'identified': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'investigating': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'remediated': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'reported_to_asic': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  
  const severityChartData = dashboard ? [
    { name: 'Critical', value: dashboard.by_severity?.critical || 0 },
    { name: 'High', value: dashboard.by_severity?.high || 0 },
    { name: 'Medium', value: dashboard.by_severity?.medium || 0 },
    { name: 'Low', value: dashboard.by_severity?.low || 0 }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="breach-register-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertOctagon className="h-7 w-7 text-red-600" />
              Breach Register
            </h1>
            <p className="text-gray-600 mt-1">
              CPS 230 compliant breach management with ASIC reporting
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={seedDemoData} data-testid="seed-breaches-btn">
              <RefreshCw className="h-4 w-4 mr-2" />
              Seed Demo Data
            </Button>
            <Button variant="outline" onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Regulatory Report
            </Button>
            <Button onClick={() => setShowNewBreachDialog(true)} data-testid="register-breach-btn">
              <Plus className="h-4 w-4 mr-2" />
              Register Breach
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold">{dashboard.summary.total_breaches}</div>
                  <div className="text-xs text-gray-500">Total Breaches</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{dashboard.summary.ytd_breaches}</div>
                  <div className="text-xs text-gray-500">Year to Date</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{dashboard.summary.open_breaches}</div>
                  <div className="text-xs text-gray-500">Open Breaches</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={dashboard.asic_reporting.pending_report > 0 ? 'border-red-300 bg-red-50' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{dashboard.asic_reporting.pending_report}</div>
                  <div className="text-xs text-gray-500">Pending ASIC Reports</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">${(dashboard.remediation.compensation_total || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Compensation Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ASIC Alert */}
      {dashboard && dashboard.asic_reporting.overdue > 0 && (
        <Alert variant="destructive" className="mb-6">
          <Bell className="h-4 w-4" />
          <AlertTitle>ASIC Reporting Overdue</AlertTitle>
          <AlertDescription>
            {dashboard.asic_reporting.overdue} breach(es) have exceeded their ASIC reporting deadline. Immediate action required.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="register" data-testid="register-tab">Breach Register</TabsTrigger>
          <TabsTrigger value="asic" data-testid="asic-tab">ASIC Reporting</TabsTrigger>
          <TabsTrigger value="dashboard" data-testid="dashboard-tab">Dashboard</TabsTrigger>
          <TabsTrigger value="criteria" data-testid="criteria-tab">Reporting Criteria</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>All Breaches</CardTitle>
              <CardDescription>Complete breach register with status tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Adviser</TableHead>
                    <TableHead>ASIC Reportable</TableHead>
                    <TableHead>Identified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breaches.map((breach) => (
                    <TableRow key={breach.id}>
                      <TableCell className="font-mono text-xs">{breach.id}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{breach.title}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(breach.severity)}>
                          {breach.severity?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{breach.category?.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(breach.status)}>
                          {breach.status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{breach.adviser_name || '-'}</TableCell>
                      <TableCell>
                        {breach.asic_reportable ? (
                          breach.asic_reported ? (
                            <Badge className="bg-purple-500 text-white">Reported</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200">Required</Badge>
                          )
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {breach.identified_date ? new Date(breach.identified_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedBreach(breach);
                              setUpdateForm({
                                status: breach.status,
                                update_notes: '',
                                updated_by: 'compliance_team',
                                remediation_action: '',
                                client_notified: breach.client_notified || false,
                                compensation_required: breach.compensation_required || false,
                                compensation_amount: breach.compensation_amount || 0
                              });
                              setShowUpdateDialog(true);
                            }}
                          >
                            Update
                          </Button>
                          {breach.asic_reportable && !breach.asic_reported && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedBreach(breach);
                                setShowAsicDialog(true);
                              }}
                            >
                              Report
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {breaches.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No breaches registered. Use "Seed Demo Data" to populate sample breaches.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asic">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Pending ASIC Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {breaches.filter(b => b.asic_reportable && !b.asic_reported).map((breach) => (
                    <div key={breach.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{breach.title}</div>
                          <div className="text-sm text-gray-500">{breach.id}</div>
                        </div>
                        <Badge className={getSeverityColor(breach.severity)}>
                          {breach.severity?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-red-600 font-medium">
                          Deadline: {breach.asic_assessment?.deadline_date 
                            ? new Date(breach.asic_assessment.deadline_date).toLocaleDateString() 
                            : 'Not set'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setSelectedBreach(breach);
                          setShowAsicDialog(true);
                        }}
                      >
                        Report to ASIC
                      </Button>
                    </div>
                  ))}
                  {breaches.filter(b => b.asic_reportable && !b.asic_reported).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                      No pending ASIC reports
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Reported to ASIC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {breaches.filter(b => b.asic_reported).map((breach) => (
                    <div key={breach.id} className="border rounded-lg p-4 bg-purple-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{breach.title}</div>
                          <div className="text-sm text-gray-500">{breach.id}</div>
                        </div>
                        <Badge className="bg-purple-500 text-white">Reported</Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Reference: {breach.asic_report_reference || 'N/A'}
                      </div>
                    </div>
                  ))}
                  {breaches.filter(b => b.asic_reported).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No ASIC reports submitted yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Breaches by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                {severityChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={severityChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {severityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Breaches by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.by_category && Object.keys(dashboard.by_category).length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.entries(dashboard.by_category).map(([k, v]) => ({ name: k.replace('_', ' '), value: v }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Remediation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <span>Pending</span>
                    <Badge variant="outline">{dashboard?.remediation?.pending || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <span>In Progress</span>
                    <Badge variant="outline">{dashboard?.remediation?.in_progress || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span>Completed</span>
                    <Badge variant="outline">{dashboard?.remediation?.completed || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ASIC Reporting Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Total Reportable</span>
                    <Badge>{dashboard?.asic_reporting?.total_reportable || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                    <span>Reported</span>
                    <Badge className="bg-purple-500 text-white">{dashboard?.asic_reporting?.reported || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <span>Pending</span>
                    <Badge variant="destructive">{dashboard?.asic_reporting?.pending_report || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-100 rounded">
                    <span>Overdue</span>
                    <Badge variant="destructive">{dashboard?.asic_reporting?.overdue || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="criteria">
          <Card>
            <CardHeader>
              <CardTitle>ASIC Reporting Criteria</CardTitle>
              <CardDescription>Guidelines for determining reportable breaches under Corporations Act 2001</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboard?.criteria && Object.entries(dashboard.criteria).map(([key, value]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{value.description}</p>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">REPORTING TIMELINE</div>
                      <Badge className="bg-red-100 text-red-700">{value.timeline_days} days</Badge>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">EXAMPLES</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {value.examples?.map((ex, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Register Breach Dialog */}
      <Dialog open={showNewBreachDialog} onOpenChange={setShowNewBreachDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register New Breach</DialogTitle>
            <DialogDescription>Document a compliance breach in the breach register</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              <div>
                <label className="text-sm font-medium">Breach Title</label>
                <Input value={newBreach.title} onChange={(e) => setNewBreach({ ...newBreach, title: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={newBreach.description} onChange={(e) => setNewBreach({ ...newBreach, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Select value={newBreach.severity} onValueChange={(v) => setNewBreach({ ...newBreach, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newBreach.category} onValueChange={(v) => setNewBreach({ ...newBreach, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advice_quality">Advice Quality</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="disclosure">Disclosure</SelectItem>
                      <SelectItem value="conflict_of_interest">Conflict of Interest</SelectItem>
                      <SelectItem value="product_suitability">Product Suitability</SelectItem>
                      <SelectItem value="fee_disclosure">Fee Disclosure</SelectItem>
                      <SelectItem value="privacy">Privacy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Adviser ID</label>
                  <Input value={newBreach.adviser_id} onChange={(e) => setNewBreach({ ...newBreach, adviser_id: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Adviser Name</label>
                  <Input value={newBreach.adviser_name} onChange={(e) => setNewBreach({ ...newBreach, adviser_name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Client ID</label>
                  <Input value={newBreach.client_id} onChange={(e) => setNewBreach({ ...newBreach, client_id: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Client Name</label>
                  <Input value={newBreach.client_name} onChange={(e) => setNewBreach({ ...newBreach, client_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Root Cause</label>
                <Textarea value={newBreach.root_cause} onChange={(e) => setNewBreach({ ...newBreach, root_cause: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Identified Date</label>
                <Input type="date" value={newBreach.identified_date} onChange={(e) => setNewBreach({ ...newBreach, identified_date: e.target.value })} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBreachDialog(false)}>Cancel</Button>
            <Button onClick={registerBreach}>Register Breach</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Breach Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Breach Status</DialogTitle>
            <DialogDescription>Update the status and add notes for {selectedBreach?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={updateForm.status} onValueChange={(v) => setUpdateForm({ ...updateForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="identified">Identified</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="remediated">Remediated</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Update Notes</label>
              <Textarea value={updateForm.update_notes} onChange={(e) => setUpdateForm({ ...updateForm, update_notes: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Remediation Action</label>
              <Textarea value={updateForm.remediation_action} onChange={(e) => setUpdateForm({ ...updateForm, remediation_action: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={updateForm.client_notified} onCheckedChange={(c) => setUpdateForm({ ...updateForm, client_notified: c })} />
              <label className="text-sm">Client has been notified</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={updateForm.compensation_required} onCheckedChange={(c) => setUpdateForm({ ...updateForm, compensation_required: c })} />
              <label className="text-sm">Compensation required</label>
            </div>
            {updateForm.compensation_required && (
              <div>
                <label className="text-sm font-medium">Compensation Amount ($)</label>
                <Input type="number" value={updateForm.compensation_amount} onChange={(e) => setUpdateForm({ ...updateForm, compensation_amount: parseFloat(e.target.value) || 0 })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>Cancel</Button>
            <Button onClick={updateBreach}>Update Breach</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASIC Report Dialog */}
      <Dialog open={showAsicDialog} onOpenChange={setShowAsicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report to ASIC</DialogTitle>
            <DialogDescription>Record ASIC notification for {selectedBreach?.id}</DialogDescription>
          </DialogHeader>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Regulatory Submission</AlertTitle>
            <AlertDescription>
              This will record the ASIC report. Ensure you have submitted the report through official ASIC channels.
            </AlertDescription>
          </Alert>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reportable Reason</label>
              <Select value={asicForm.reportable_reason} onValueChange={(v) => setAsicForm({ ...asicForm, reportable_reason: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="significant_breach">Significant Breach</SelectItem>
                  <SelectItem value="systemic_issue">Systemic Issue</SelectItem>
                  <SelectItem value="client_detriment">Client Detriment</SelectItem>
                  <SelectItem value="reportable_situation">Reportable Situation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">ASIC Report Reference</label>
              <Input value={asicForm.report_reference} onChange={(e) => setAsicForm({ ...asicForm, report_reference: e.target.value })} placeholder="e.g., ASIC-2026-001234" />
            </div>
            <div>
              <label className="text-sm font-medium">Report Date</label>
              <Input type="date" value={asicForm.report_date} onChange={(e) => setAsicForm({ ...asicForm, report_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAsicDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={reportToAsic}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Record ASIC Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
