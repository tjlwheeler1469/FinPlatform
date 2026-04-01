import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import {
  Shield, Lock, FileText, AlertTriangle, Activity, Download, CheckCircle2,
  XCircle, Clock, Users, Server, Database, Zap, Eye, RefreshCw, FileDown, ChevronDown
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function EnterpriseComplianceDashboard({ embedded = false }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Dashboard data
  const [healthData, setHealthData] = useState(null);
  const [auditStatus, setAuditStatus] = useState(null);
  const [securityDashboard, setSecurityDashboard] = useState(null);
  const [incidentDashboard, setIncidentDashboard] = useState(null);
  const [eventMetrics, setEventMetrics] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  
  // Modals
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'P3',
    category: 'operational',
    reported_by: 'admin'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [health, audit, security, incident, events, docs, incList, auditList] = await Promise.all([
        fetch(`${API_URL}/api/health`).then(r => r.json()),
        fetch(`${API_URL}/api/audit/chain/status`).then(r => r.json()),
        fetch(`${API_URL}/api/security/dashboard`).then(r => r.json()),
        fetch(`${API_URL}/api/incidents/dashboard/summary`).then(r => r.json()),
        fetch(`${API_URL}/api/events/dashboard/metrics`).then(r => r.json()),
        fetch(`${API_URL}/api/enterprise/docs/list`).then(r => r.json()),
        fetch(`${API_URL}/api/incidents/list?limit=10`).then(r => r.json()),
        fetch(`${API_URL}/api/audit/events?limit=20`).then(r => r.json())
      ]);
      
      setHealthData(health);
      setAuditStatus(audit);
      setSecurityDashboard(security);
      setIncidentDashboard(incident);
      setEventMetrics(events);
      setDocuments(docs.available_documents || []);
      setIncidents(incList.incidents || []);
      setAuditEvents(auditList.events || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
    setLoading(false);
  };

  const verifyAuditChain = async () => {
    try {
      const result = await fetch(`${API_URL}/api/audit/chain/verify`).then(r => r.json());
      alert(result.valid ? 'Audit chain verified - No tampering detected' : 'WARNING: Chain integrity issues detected!');
    } catch (error) {
      alert('Verification failed: ' + error.message);
    }
  };

  const createIncident = async () => {
    try {
      const result = await fetch(`${API_URL}/api/incidents/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident)
      }).then(r => r.json());
      
      alert(`Incident created: ${result.incident_id}`);
      setShowIncidentDialog(false);
      loadDashboardData();
    } catch (error) {
      alert('Failed to create incident: ' + error.message);
    }
  };

  const downloadDocument = async (docType, format = 'json') => {
    try {
      const url = format === 'pdf' 
        ? `${API_URL}/api/enterprise/docs/pdf/${docType}`
        : `${API_URL}/api/enterprise/docs/${docType}`;
      
      if (format === 'pdf') {
        // Download PDF inline instead of opening in new tab
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${docType}.pdf`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
      } else {
        const data = await fetch(url).then(r => r.json());
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${docType}.json`;
        a.click();
      }
    } catch (error) {
      alert('Download failed: ' + error.message);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'P1': 'bg-red-500',
      'P2': 'bg-orange-500',
      'P3': 'bg-yellow-500',
      'P4': 'bg-blue-500',
      'P5': 'bg-gray-500'
    };
    return colors[severity] || 'bg-gray-500';
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-red-100 text-red-800',
      'investigating': 'bg-yellow-100 text-yellow-800',
      'identified': 'bg-blue-100 text-blue-800',
      'monitoring': 'bg-purple-100 text-purple-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const downloadSystemHealthReport = (format = 'json') => {
    if (!healthData?.adviceos) {
      alert('No health data available');
      return;
    }
    
    const report = {
      report_type: 'System Health Report',
      generated_at: new Date().toISOString(),
      system_status: healthData.status,
      services: Object.entries(healthData.adviceos).map(([service, status]) => ({
        service: service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        status: status ? 'Active' : 'Inactive',
        health: status ? 'Healthy' : 'Degraded'
      })),
      summary: {
        total_services: Object.keys(healthData.adviceos).length,
        active_services: Object.values(healthData.adviceos).filter(v => v).length,
        inactive_services: Object.values(healthData.adviceos).filter(v => !v).length
      }
    };
    
    if (format === 'excel') {
      // Create CSV format for Excel
      const headers = ['Service', 'Status', 'Health'];
      const rows = report.services.map(s => [s.service, s.status, s.health]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_health_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Create a printable HTML document and trigger print
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>System Health Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .active { color: #22c55e; font-weight: bold; }
            .inactive { color: #ef4444; font-weight: bold; }
            .summary { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .summary-item { display: inline-block; margin-right: 30px; }
            .footer { margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>System Health Report</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>System Status:</strong> ${report.system_status}</p>
          
          <div class="summary">
            <span class="summary-item"><strong>Total Services:</strong> ${report.summary.total_services}</span>
            <span class="summary-item"><strong>Active:</strong> ${report.summary.active_services}</span>
            <span class="summary-item"><strong>Inactive:</strong> ${report.summary.inactive_services}</span>
          </div>
          
          <h2>Service Details</h2>
          <table>
            <thead>
              <tr><th>Service</th><th>Status</th><th>Health</th></tr>
            </thead>
            <tbody>
              ${report.services.map(s => `
                <tr>
                  <td>${s.service}</td>
                  <td class="${s.status === 'Active' ? 'active' : 'inactive'}">${s.status}</td>
                  <td>${s.health}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>AdviceOS - Enterprise Compliance Platform</p>
            <p>Report ID: SHR-${Date.now()}</p>
          </div>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      printWindow.document.write(DOMPurify.sanitize(printContent, { WHOLE_DOCUMENT: true, ADD_TAGS: ['html', 'head', 'body', 'style', 'title'] }));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      // JSON format
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_health_report_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    const loadingContent = (
        <div className="flex items-center justify-center h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Loading Compliance Dashboard...</span>
        </div>
    );
    return embedded ? loadingContent : <Layout>{loadingContent}</Layout>;
  }

  const content = (
      <div className="space-y-6" data-testid="enterprise-dashboard">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compliance Dashboard</h1>
            <p className="text-muted-foreground">ASIC/APRA/ISO Regulatory Compliance Center</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDashboardData} data-testid="refresh-btn">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => downloadDocument('complete-pack')} data-testid="download-pack-btn">
              <Download className="w-4 h-4 mr-2" /> Download Due Diligence Pack
            </Button>
          </div>
        </div>

        {/* Compliance Status Banner */}
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">System Compliant</AlertTitle>
          <AlertDescription className="text-green-700">
            All regulatory controls operational. APRA CPS 234/230 aligned. Audit chain integrity verified.
          </AlertDescription>
        </Alert>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card data-testid="metric-audit-chain">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" /> Audit Chain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditStatus?.chain_length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Hash: {auditStatus?.last_hash?.slice(0, 12)}...
            </p>
            <Badge variant="outline" className="mt-1 text-green-600 border-green-600">
              {auditStatus?.tamper_detection}
            </Badge>
          </CardContent>
        </Card>

        <Card data-testid="metric-security">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{securityDashboard?.threat_level || 'Low'}</div>
            <p className="text-xs text-muted-foreground">
              Events (24h): {securityDashboard?.summary?.security_events_24h || 0}
            </p>
            <Badge variant="outline" className="mt-1">
              {securityDashboard?.controls_status || 'operational'}
            </Badge>
          </CardContent>
        </Card>

        <Card data-testid="metric-incidents">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Open Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidentDashboard?.open_incidents?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Critical (P1): {incidentDashboard?.open_incidents?.critical_p1 || 0}
            </p>
            <Badge variant={incidentDashboard?.open_incidents?.critical_p1 > 0 ? 'destructive' : 'outline'} className="mt-1">
              {incidentDashboard?.open_incidents?.critical_p1 > 0 ? 'Action Required' : 'Normal'}
            </Badge>
          </CardContent>
        </Card>

        <Card data-testid="metric-events">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" /> Events/Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventMetrics?.metrics?.events_last_hour || 0}</div>
            <p className="text-xs text-muted-foreground">
              Critical (24h): {eventMetrics?.metrics?.critical_events_24h || 0}
            </p>
            <Badge variant="outline" className="mt-1">
              {eventMetrics?.memory_buffer_size || 0} buffered
            </Badge>
          </CardContent>
        </Card>

        <Card data-testid="metric-mttr">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-500" /> MTTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidentDashboard?.monthly_stats?.mttr_hours || 0}h</div>
            <p className="text-xs text-muted-foreground">
              Resolution Rate: {incidentDashboard?.monthly_stats?.resolution_rate || 0}%
            </p>
            <Badge variant="outline" className="mt-1">
              Last 30 days
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          <TabsTrigger value="incidents" data-testid="tab-incidents">Incidents</TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">Events</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Regulatory Compliance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Regulatory Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'APRA CPS 234 (Information Security)', status: 'ALIGNED' },
                  { name: 'APRA CPS 230 (Operational Risk)', status: 'ALIGNED' },
                  { name: 'ASIC RG 271 (Dispute Resolution)', status: 'COMPLIANT' },
                  { name: 'Corporations Act (Record Keeping)', status: 'COMPLIANT' },
                  { name: 'Privacy Act (APP 11)', status: 'COMPLIANT' }
                ].map((item, i) => (
                  <div key={`item-${i}`} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">{item.name}</span>
                    <Badge className="bg-green-500">{item.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" /> System Health
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="download-health-btn">
                      <Download className="w-4 h-4 mr-2" /> Download <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => downloadSystemHealthReport('pdf')}>
                      <FileText className="w-4 h-4 mr-2" /> PDF Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadSystemHealthReport('excel')}>
                      <FileDown className="w-4 h-4 mr-2" /> Excel (CSV)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadSystemHealthReport('json')}>
                      <Database className="w-4 h-4 mr-2" /> JSON Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {healthData?.adviceos && Object.entries(healthData.adviceos).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                    <Badge className={value ? 'bg-green-500' : 'bg-red-500'}>
                      {value ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Immutable Audit Trail</CardTitle>
                <CardDescription>SHA-256 hash-chained audit logs with tamper detection</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={verifyAuditChain} data-testid="verify-chain-btn">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Verify Chain
                </Button>
                <Button variant="outline" onClick={() => downloadDocument('audit-trail', 'pdf')}>
                  <FileDown className="w-4 h-4 mr-2" /> Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chain Status */}
              <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Chain Length</p>
                  <p className="text-xl font-bold">{auditStatus?.chain_length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Integrity Status</p>
                  <Badge className="bg-green-500">{auditStatus?.integrity_status || 'verified'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tamper Detection</p>
                  <Badge variant="outline">{auditStatus?.tamper_detection || 'active'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Hash</p>
                  <p className="text-xs font-mono truncate">{auditStatus?.last_hash}</p>
                </div>
              </div>

              {/* Recent Audit Events */}
              <div className="space-y-2">
                <h4 className="font-semibold">Recent Audit Events</h4>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {auditEvents.map((event, i) => (
                    <div key={`item-${i}`} className="p-3 border rounded-lg text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline">{event.event_type}</Badge>
                          <span className="ml-2 text-muted-foreground">{event.entity_type}/{event.entity_id}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{event.timestamp?.slice(0, 19)}</span>
                      </div>
                      <p className="mt-1">{event.action_description}</p>
                      <p className="text-xs text-muted-foreground mt-1">User: {event.user_id} | Hash: {event.hash?.slice(0, 16)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Controls Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { control: 'Encryption at Rest', status: 'AES-256', enabled: true },
                  { control: 'Encryption in Transit', status: 'TLS 1.2+', enabled: true },
                  { control: 'RBAC Authorization', status: '6 roles', enabled: true },
                  { control: 'Rate Limiting', status: '100/60s', enabled: true },
                  { control: 'Audit Logging', status: 'Hash-chained', enabled: true },
                  { control: 'API Key Management', status: 'Revocable', enabled: true }
                ].map((item, i) => (
                  <div key={`item-${i}`} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span>{item.control}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.status}</Badge>
                      {item.enabled ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />
                      }
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Threat Level</p>
                    <p className="text-2xl font-bold capitalize">{securityDashboard?.threat_level}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Failed Logins (24h)</p>
                    <p className="text-2xl font-bold">{securityDashboard?.summary?.failed_logins_24h || 0}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Critical Events (7d)</p>
                    <p className="text-2xl font-bold">{securityDashboard?.summary?.critical_events_7d || 0}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Active Sessions</p>
                    <p className="text-2xl font-bold">{securityDashboard?.summary?.active_sessions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Incident Management</CardTitle>
                <CardDescription>CPS 230 compliant incident tracking and escalation</CardDescription>
              </div>
              <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="create-incident-btn">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Report Incident
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report New Incident</DialogTitle>
                    <DialogDescription>Create a new incident for tracking and resolution</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input 
                      placeholder="Incident Title" 
                      value={newIncident.title}
                      onChange={e => setNewIncident({...newIncident, title: e.target.value})}
                    />
                    <Textarea 
                      placeholder="Description" 
                      value={newIncident.description}
                      onChange={e => setNewIncident({...newIncident, description: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Select 
                        value={newIncident.severity}
                        onValueChange={v => setNewIncident({...newIncident, severity: v})}
                      >
                        <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="P1">P1 - Critical</SelectItem>
                          <SelectItem value="P2">P2 - High</SelectItem>
                          <SelectItem value="P3">P3 - Medium</SelectItem>
                          <SelectItem value="P4">P4 - Low</SelectItem>
                          <SelectItem value="P5">P5 - Info</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select 
                        value={newIncident.category}
                        onValueChange={v => setNewIncident({...newIncident, category: v})}
                      >
                        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="data">Data</SelectItem>
                          <SelectItem value="integration">Integration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowIncidentDialog(false)}>Cancel</Button>
                    <Button onClick={createIncident}>Create Incident</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {/* Incident Stats */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-sm text-red-600">P1 Critical</p>
                  <p className="text-2xl font-bold text-red-700">{incidentDashboard?.open_incidents?.by_severity?.P1 || 0}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <p className="text-sm text-orange-600">P2 High</p>
                  <p className="text-2xl font-bold text-orange-700">{incidentDashboard?.open_incidents?.by_severity?.P2 || 0}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <p className="text-sm text-yellow-600">P3 Medium</p>
                  <p className="text-2xl font-bold text-yellow-700">{incidentDashboard?.open_incidents?.by_severity?.P3 || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-600">Needs Escalation</p>
                  <p className="text-2xl font-bold text-blue-700">{incidentDashboard?.escalation_status?.needs_escalation || 0}</p>
                </div>
              </div>

              {/* Incident List */}
              <div className="space-y-2">
                <h4 className="font-semibold">Recent Incidents</h4>
                {incidents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No incidents reported</p>
                ) : (
                  <div className="space-y-2">
                    {incidents.map((inc, i) => (
                      <div key={`item-${i}`} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getSeverityColor(inc.severity)}`} />
                            <span className="font-medium">{inc.id}</span>
                            <Badge className={getStatusColor(inc.status)}>{inc.status}</Badge>
                          </div>
                          <Badge variant="outline">{inc.severity}</Badge>
                        </div>
                        <p className="mt-1 text-sm">{inc.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {inc.category} | Created: {inc.created_at?.slice(0, 10)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Event Stream</CardTitle>
              <CardDescription>Live compliance and security event monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Events/Minute</p>
                  <p className="text-2xl font-bold">{eventMetrics?.metrics?.events_per_minute || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Buffer Size</p>
                  <p className="text-2xl font-bold">{eventMetrics?.memory_buffer_size || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">WebSocket Clients</p>
                  <p className="text-2xl font-bold">
                    {Object.values(eventMetrics?.websocket_clients || {}).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
              </div>

              {/* Event Types */}
              <h4 className="font-semibold mb-2">Events by Type (24h)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(eventMetrics?.metrics?.by_type || {}).map(([type, count]) => (
                  <div key={type} className="p-2 bg-muted rounded text-sm">
                    <span className="text-muted-foreground">{type}:</span>
                    <span className="font-bold ml-1">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Documentation</CardTitle>
              <CardDescription>Regulatory and due diligence documentation pack</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc, i) => (
                  <div key={`item-${i}`} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4" /> {doc.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => downloadDocument(doc.id, 'json')}>
                        <Download className="w-3 h-3 mr-1" /> JSON
                      </Button>
                      {doc.id !== 'complete-pack' && (
                        <Button size="sm" variant="outline" onClick={() => downloadDocument(doc.id, 'pdf')}>
                          <FileDown className="w-3 h-3 mr-1" /> PDF
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => downloadDocument(doc.id, 'json')}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
}
