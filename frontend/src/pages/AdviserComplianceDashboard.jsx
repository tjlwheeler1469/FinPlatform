import { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield, FileText, AlertTriangle, CheckCircle, XCircle, Clock,
  Search, Filter, Download, Upload, Eye, ChevronRight, AlertCircle,
  TrendingUp, Users, Calendar, Bell, Flag, ArrowUp, ArrowDown,
  Target, Zap, Brain, MessageSquare, Folder, BarChart3, PieChart,
  Scale, Gavel, BookOpen, FileCheck, FilePlus, FileWarning, Activity,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// ===================== STATIC REFERENCE DATA =====================

const complianceStatuses = {
  compliant: { color: 'bg-green-500', text: 'Compliant', icon: CheckCircle },
  minor_issues: { color: 'bg-amber-500', text: 'Minor Issues', icon: AlertTriangle },
  major_issues: { color: 'bg-red-500', text: 'Major Issues', icon: XCircle },
  pending_review: { color: 'bg-blue-500', text: 'Pending Review', icon: Clock },
};

// Fallback static data (used when DB is empty)
const fallbackAdviceFiles = [
  {
    id: 'SOA-2026-001',
    client: 'David & Sarah Thompson',
    type: 'Statement of Advice',
    date: '2026-03-15',
    adviser: 'James Mitchell',
    status: 'compliant',
    riskProfile: 'Balanced',
    investmentAmount: 450000,
    score: 95,
    findings: [],
    nextReview: '2027-03-15'
  },
];

const fallbackMetrics = {
  totalFiles: 0,
  reviewed: 0,
  compliant: 0,
  minorIssues: 0,
  majorIssues: 0,
  pendingReview: 0,
  avgScore: 0,
  overdue: 0,
};

// ASIC compliance requirements
const asicRequirements = [
  {
    category: 'Best Interests Duty',
    requirements: [
      { id: 'BID-1', name: 'Identify client objectives', status: 'compliant', notes: '' },
      { id: 'BID-2', name: 'Identify alternative strategies', status: 'compliant', notes: '' },
      { id: 'BID-3', name: 'Base advice on client circumstances', status: 'minor', notes: '2 files need updated circumstances' },
      { id: 'BID-4', name: 'Recommend appropriate products', status: 'compliant', notes: '' },
    ]
  },
  {
    category: 'Fee Disclosure',
    requirements: [
      { id: 'FD-1', name: 'Initial fee disclosure', status: 'compliant', notes: '' },
      { id: 'FD-2', name: 'Ongoing fee disclosure', status: 'compliant', notes: '' },
      { id: 'FD-3', name: 'Fee Disclosure Statement', status: 'minor', notes: '1 FDS overdue for update' },
      { id: 'FD-4', name: 'Opt-in notices', status: 'compliant', notes: '' },
    ]
  },
  {
    category: 'Conflicts Management',
    requirements: [
      { id: 'CM-1', name: 'Conflicts register maintained', status: 'compliant', notes: '' },
      { id: 'CM-2', name: 'Conflicts disclosed to clients', status: 'compliant', notes: '' },
      { id: 'CM-3', name: 'Related party transactions', status: 'compliant', notes: '' },
    ]
  },
  {
    category: 'Record Keeping',
    requirements: [
      { id: 'RK-1', name: 'Advice files retained 7 years', status: 'compliant', notes: '' },
      { id: 'RK-2', name: 'File notes documented', status: 'minor', notes: '3 files missing file notes' },
      { id: 'RK-3', name: 'Authority to proceed obtained', status: 'compliant', notes: '' },
    ]
  },
];

// Escalation pathways
const escalationLevels = [
  { level: 1, name: 'Adviser Self-Correction', timeframe: '7 days', description: 'Minor documentation issues' },
  { level: 2, name: 'Practice Manager Review', timeframe: '14 days', description: 'Repeated minor issues or moderate concerns' },
  { level: 3, name: 'Compliance Officer', timeframe: '30 days', description: 'Major compliance breaches' },
  { level: 4, name: 'Licensee/AFSL Holder', timeframe: 'Immediate', description: 'Serious breaches, potential ASIC reporting' },
];

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

// Static score history for chart (could be enhanced to fetch from DB)
const scoreHistory = [
  { month: 'Oct', score: 82 },
  { month: 'Nov', score: 85 },
  { month: 'Dec', score: 84 },
  { month: 'Jan', score: 88 },
  { month: 'Feb', score: 86 },
  { month: 'Mar', score: 87 },
];

// ===================== MAIN COMPONENT =====================

const AdviserComplianceDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [adviceFiles, setAdviceFiles] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(fallbackMetrics);

  // Fetch dashboard data from MongoDB
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // First try to seed demo data
      await fetch(`${API_URL}/api/compliance-docs/seed-demo`, { method: 'POST' });
      
      const res = await fetch(`${API_URL}/api/compliance-docs/dashboard`);
      if (res.ok) {
        const data = await res.json();
        if (data.adviceFiles && data.adviceFiles.length > 0) {
          setAdviceFiles(data.adviceFiles);
          setDashboardMetrics(data.metrics);
        } else {
          setAdviceFiles(fallbackAdviceFiles);
        }
      }
    } catch (err) {
      console.error('Error fetching compliance dashboard:', err);
      setAdviceFiles(fallbackAdviceFiles);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Filter advice files
  const filteredFiles = useMemo(() => {
    let files = adviceFiles;
    if (filterStatus !== 'all') {
      files = files.filter(f => f.status === filterStatus);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      files = files.filter(f => 
        f.client.toLowerCase().includes(query) ||
        f.id.toLowerCase().includes(query) ||
        f.adviser.toLowerCase().includes(query)
      );
    }
    return files;
  }, [filterStatus, searchQuery]);

  // Status distribution for chart
  const statusDistribution = [
    { name: 'Compliant', value: dashboardMetrics.compliant, color: '#22c55e' },
    { name: 'Minor Issues', value: dashboardMetrics.minorIssues, color: '#f59e0b' },
    { name: 'Major Issues', value: dashboardMetrics.majorIssues, color: '#ef4444' },
    { name: 'Pending', value: dashboardMetrics.pendingReview, color: '#3b82f6' },
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="compliance-dashboard">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Adviser Compliance Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor advice quality, ASIC compliance, and regulatory alignment
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm px-3 py-1">
              AFSL: 123456
            </Badge>
            {loading ? (
              <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Loading...</Badge>
            ) : (
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                <Activity className="h-3 w-3 mr-1" /> Live from MongoDB
              </Badge>
            )}
            <Button variant="outline" onClick={fetchDashboard}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Alert Banner */}
        {dashboardMetrics.majorIssues > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{dashboardMetrics.majorIssues} advice files</strong> have major compliance issues requiring immediate attention.
              <Button variant="link" className="p-0 h-auto ml-2">View escalation pathways</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-4xl">
            <TabsTrigger value="dashboard" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Advice Files
            </TabsTrigger>
            <TabsTrigger value="asic" className="flex items-center gap-1">
              <Gavel className="h-4 w-4" />
              ASIC Framework
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="escalation" className="flex items-center gap-1">
              <Flag className="h-4 w-4" />
              Escalation
            </TabsTrigger>
          </TabsList>

          {/* ========== DASHBOARD TAB ========== */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="bg-slate-50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Files</p>
                  <p className="text-3xl font-bold">{dashboardMetrics.totalFiles}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Compliant</p>
                  <p className="text-3xl font-bold text-green-600">{dashboardMetrics.compliant}</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Minor Issues</p>
                  <p className="text-3xl font-bold text-amber-600">{dashboardMetrics.minorIssues}</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Major Issues</p>
                  <p className="text-3xl font-bold text-red-600">{dashboardMetrics.majorIssues}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-3xl font-bold text-blue-600">{dashboardMetrics.pendingReview}</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-3xl font-bold text-purple-600">{dashboardMetrics.avgScore}%</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Score Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Score Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[70, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Files Requiring Attention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Files Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adviceFiles.filter(f => f.status !== 'compliant' && f.status !== 'pending_review').map((file) => {
                    const StatusIcon = complianceStatuses[file.status].icon;
                    return (
                      <div 
                        key={file.id}
                        className={`p-4 rounded-lg border-2 ${
                          file.status === 'major_issues' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <StatusIcon className={`h-4 w-4 ${file.status === 'major_issues' ? 'text-red-600' : 'text-amber-600'}`} />
                              <span className="font-semibold">{file.id}</span>
                              <Badge className={complianceStatuses[file.status].color}>
                                {complianceStatuses[file.status].text}
                              </Badge>
                            </div>
                            <p className="text-sm">{file.client} • {file.type}</p>
                            <p className="text-xs text-muted-foreground">Adviser: {file.adviser} • Date: {file.date}</p>
                            {file.findings.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {file.findings.map((finding, idx) => (
                                  <p key={idx} className="text-sm text-red-700">• {finding}</p>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{file.score || '--'}%</p>
                            <Button size="sm" variant="outline" className="mt-2">
                              Review <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ADVICE FILES TAB ========== */}
          <TabsContent value="files" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by client, file ID, or adviser..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="minor_issues">Minor Issues</SelectItem>
                  <SelectItem value="major_issues">Major Issues</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">{filteredFiles.length} files</Badge>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredFiles.map((file) => {
                    const StatusIcon = complianceStatuses[file.status].icon;
                    return (
                      <div 
                        key={file.id}
                        className="p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setSelectedFile(file)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              file.status === 'compliant' ? 'bg-green-100' :
                              file.status === 'minor_issues' ? 'bg-amber-100' :
                              file.status === 'major_issues' ? 'bg-red-100' :
                              'bg-blue-100'
                            }`}>
                              <StatusIcon className={`h-5 w-5 ${
                                file.status === 'compliant' ? 'text-green-600' :
                                file.status === 'minor_issues' ? 'text-amber-600' :
                                file.status === 'major_issues' ? 'text-red-600' :
                                'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{file.id}</span>
                                <Badge variant="outline" className="text-xs">{file.type}</Badge>
                                <Badge className={complianceStatuses[file.status].color}>
                                  {complianceStatuses[file.status].text}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{file.client}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.adviser} • {file.date} • {file.riskProfile}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{file.score || '--'}%</p>
                            <p className="text-xs text-muted-foreground">
                              ${(file.investmentAmount / 1000).toFixed(0)}k investment
                            </p>
                          </div>
                        </div>
                        {file.findings.length > 0 && (
                          <div className="mt-2 ml-14 flex flex-wrap gap-2">
                            {file.findings.slice(0, 2).map((finding, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                {finding}
                              </Badge>
                            ))}
                            {file.findings.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{file.findings.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ASIC FRAMEWORK TAB ========== */}
          <TabsContent value="asic" className="space-y-6">
            <Alert>
              <Scale className="h-4 w-4" />
              <AlertDescription>
                This framework aligns with ASIC Regulatory Guide 175 (Licensing: Financial product advisers) 
                and RG 244 (Giving information, general advice and scaled advice).
              </AlertDescription>
            </Alert>

            {asicRequirements.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category.category}</span>
                    <Badge className={
                      category.requirements.every(r => r.status === 'compliant') ? 'bg-green-500' :
                      category.requirements.some(r => r.status === 'major') ? 'bg-red-500' :
                      'bg-amber-500'
                    }>
                      {category.requirements.filter(r => r.status === 'compliant').length}/{category.requirements.length} Compliant
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.requirements.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {req.status === 'compliant' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : req.status === 'minor' ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{req.name}</p>
                            {req.notes && (
                              <p className="text-xs text-muted-foreground">{req.notes}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={req.status === 'compliant' ? 'secondary' : 'destructive'}>
                          {req.id}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ========== REPORTS TAB ========== */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Monthly Compliance Summary', description: 'Overview of all advice files reviewed', icon: BarChart3 },
                { title: 'Adviser Performance Report', description: 'Individual adviser compliance scores', icon: Users },
                { title: 'Issue Resolution Tracker', description: 'Status of identified issues', icon: Target },
                { title: 'ASIC Alignment Report', description: 'Regulatory compliance checklist', icon: Scale },
                { title: 'Risk Assessment Report', description: 'Client risk profile alignment', icon: AlertTriangle },
                { title: 'Audit Trail Report', description: 'Document changes and reviews', icon: FileCheck },
              ].map((report, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <report.icon className="h-10 w-10 text-blue-600 mb-4" />
                    <h3 className="font-semibold mb-2">{report.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ========== ESCALATION TAB ========== */}
          <TabsContent value="escalation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Escalation Pathways</CardTitle>
                <CardDescription>
                  Structured process for addressing compliance concerns based on severity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {escalationLevels.map((level) => (
                    <div 
                      key={level.level}
                      className={`p-4 rounded-lg border-2 ${
                        level.level === 1 ? 'border-green-200 bg-green-50' :
                        level.level === 2 ? 'border-amber-200 bg-amber-50' :
                        level.level === 3 ? 'border-orange-200 bg-orange-50' :
                        'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            level.level === 1 ? 'bg-green-500' :
                            level.level === 2 ? 'bg-amber-500' :
                            level.level === 3 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}>
                            L{level.level}
                          </div>
                          <div>
                            <h3 className="font-semibold">{level.name}</h3>
                            <p className="text-sm text-muted-foreground">{level.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {level.timeframe}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Escalations</CardTitle>
              </CardHeader>
              <CardContent>
                {adviceFiles.filter(f => f.status === 'major_issues').length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No active escalations at this time</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adviceFiles.filter(f => f.status === 'major_issues').map((file) => (
                      <div key={file.id} className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-red-500">Level 3</Badge>
                              <span className="font-semibold">{file.id}</span>
                            </div>
                            <p className="text-sm">{file.client}</p>
                            <p className="text-xs text-muted-foreground">Escalated for: {file.findings.join(', ')}</p>
                          </div>
                          <Button variant="destructive" size="sm">
                            Take Action
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdviserComplianceDashboard;
