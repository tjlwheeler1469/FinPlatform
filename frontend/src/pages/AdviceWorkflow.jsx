import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Edit,
  Eye,
  Download,
  Plus,
  ChevronRight,
  Users,
  FileCheck,
  Shield,
  Sparkles,
  MessageSquare,
  Calendar,
  ArrowRight,
  MoreHorizontal,
  Trash2,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Workflow stages
const WORKFLOW_STAGES = [
  { id: "draft", label: "Draft", icon: Edit, color: "bg-slate-500" },
  { id: "review", label: "Review", icon: Eye, color: "bg-amber-500" },
  { id: "approved", label: "Approved", icon: CheckCircle, color: "bg-green-500" },
  { id: "delivered", label: "Delivered", icon: Send, color: "bg-blue-500" },
];

// Sample advice records
const INITIAL_ADVICE = [
  {
    id: "adv_001",
    client: "Thompson Family",
    clientId: "hh_thompson001",
    type: "soa",
    title: "Retirement Strategy Review",
    status: "draft",
    createdAt: "2024-03-10T10:00:00Z",
    updatedAt: "2024-03-11T14:30:00Z",
    adviser: "Sarah Chen",
    summary: "Comprehensive review of retirement strategy including super contributions, investment allocation, and insurance needs.",
    recommendations: [
      { id: 1, text: "Increase salary sacrifice to $2,000/month", impact: "+$480,000 at retirement", status: "pending" },
      { id: 2, text: "Consolidate super funds", impact: "Save $1,200/year in fees", status: "pending" },
      { id: 3, text: "Review income protection insurance", impact: "Ensure adequate coverage", status: "pending" },
    ],
    complianceNotes: "",
    documents: ["fact_find.pdf", "risk_profile.pdf"]
  },
  {
    id: "adv_002",
    client: "Chen Family",
    clientId: "hh_chen001",
    type: "soa",
    title: "Investment Property Strategy",
    status: "review",
    createdAt: "2024-03-05T09:00:00Z",
    updatedAt: "2024-03-10T11:00:00Z",
    adviser: "Sarah Chen",
    summary: "Analysis of investment property acquisition strategy and tax implications.",
    recommendations: [
      { id: 1, text: "Purchase property in trust structure", impact: "Tax efficiency", status: "approved" },
      { id: 2, text: "Set up offset account", impact: "Save $15,000 interest/year", status: "pending" },
    ],
    complianceNotes: "Client understands risks of property investment",
    documents: ["fact_find.pdf", "property_analysis.pdf"]
  },
  {
    id: "adv_003",
    client: "Patel Family",
    clientId: "hh_patel001",
    type: "roi",
    title: "SMSF Establishment",
    status: "approved",
    createdAt: "2024-02-28T14:00:00Z",
    updatedAt: "2024-03-08T16:00:00Z",
    adviser: "Sarah Chen",
    summary: "Record of advice for SMSF establishment and initial investment strategy.",
    recommendations: [
      { id: 1, text: "Establish SMSF with corporate trustee", impact: "Greater flexibility", status: "approved" },
      { id: 2, text: "Rollover existing super balances", impact: "Consolidate $1.2M", status: "approved" },
    ],
    complianceNotes: "Client has sufficient balance and understanding for SMSF",
    documents: ["fact_find.pdf", "smsf_strategy.pdf", "trust_deed.pdf"]
  },
  {
    id: "adv_004",
    client: "Thompson Family",
    clientId: "hh_thompson001",
    type: "soa",
    title: "Insurance Review 2024",
    status: "delivered",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-02-01T09:00:00Z",
    deliveredAt: "2024-02-01T09:00:00Z",
    adviser: "Sarah Chen",
    summary: "Annual insurance review covering life, TPD, income protection, and trauma cover.",
    recommendations: [
      { id: 1, text: "Increase life cover to $2M", impact: "Adequate family protection", status: "implemented" },
      { id: 2, text: "Add trauma cover $200K", impact: "Critical illness protection", status: "implemented" },
    ],
    complianceNotes: "All recommendations accepted and implemented",
    documents: ["fact_find.pdf", "insurance_analysis.pdf", "pds_documents.pdf"]
  }
];

const AdviceWorkflow = () => {
  const navigate = useNavigate();
  const [adviceRecords, setAdviceRecords] = useState(INITIAL_ADVICE);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [newAdviceOpen, setNewAdviceOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filter records by status
  const filteredRecords = filterStatus === "all" 
    ? adviceRecords 
    : adviceRecords.filter(r => r.status === filterStatus);

  // Count by status
  const countByStatus = WORKFLOW_STAGES.reduce((acc, stage) => {
    acc[stage.id] = adviceRecords.filter(r => r.status === stage.id).length;
    return acc;
  }, {});

  // Move to next stage
  const advanceStage = (recordId) => {
    setAdviceRecords(prev => prev.map(record => {
      if (record.id === recordId) {
        const currentIndex = WORKFLOW_STAGES.findIndex(s => s.id === record.status);
        if (currentIndex < WORKFLOW_STAGES.length - 1) {
          const nextStatus = WORKFLOW_STAGES[currentIndex + 1].id;
          toast.success(`Moved to ${WORKFLOW_STAGES[currentIndex + 1].label}`);
          return { 
            ...record, 
            status: nextStatus,
            updatedAt: new Date().toISOString(),
            ...(nextStatus === 'delivered' && { deliveredAt: new Date().toISOString() })
          };
        }
      }
      return record;
    }));
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const stage = WORKFLOW_STAGES.find(s => s.id === status);
    if (!stage) return null;
    return (
      <Badge className={`${stage.color} text-white`}>
        <stage.icon className="h-3 w-3 mr-1" />
        {stage.label}
      </Badge>
    );
  };

  // Open record details
  const openDetails = (record) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="advice-workflow">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileCheck className="h-8 w-8 text-[#D4A84C]" />
              Advice Workflow
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage advice documents from draft to delivery
            </p>
          </div>
          <Dialog open={newAdviceOpen} onOpenChange={setNewAdviceOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a2744] hover:bg-[#1a2744]/90">
                <Plus className="h-4 w-4 mr-2" />
                New Advice Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Advice Record</DialogTitle>
                <DialogDescription>
                  Start a new Statement of Advice or Record of Advice
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thompson">Thompson Family</SelectItem>
                      <SelectItem value="chen">Chen Family</SelectItem>
                      <SelectItem value="patel">Patel Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soa">Statement of Advice (SOA)</SelectItem>
                      <SelectItem value="roi">Record of Advice (ROI)</SelectItem>
                      <SelectItem value="fsg">Financial Services Guide (FSG)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="e.g., Retirement Strategy Review" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewAdviceOpen(false)}>Cancel</Button>
                <Button onClick={() => {
                  toast.success("Advice record created");
                  setNewAdviceOpen(false);
                }}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create with AI
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workflow Pipeline */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              {WORKFLOW_STAGES.map((stage, index) => (
                <div key={stage.id} className="flex items-center flex-1">
                  <button
                    onClick={() => setFilterStatus(stage.id === filterStatus ? "all" : stage.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors w-full ${
                      filterStatus === stage.id ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full ${stage.color} text-white flex items-center justify-center`}>
                      <stage.icon className="h-6 w-6" />
                    </div>
                    <span className="font-medium">{stage.label}</span>
                    <span className="text-2xl font-bold">{countByStatus[stage.id] || 0}</span>
                  </button>
                  {index < WORKFLOW_STAGES.length - 1 && (
                    <ArrowRight className="h-6 w-6 text-muted-foreground mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {filterStatus === "all" ? "All Advice Records" : `${WORKFLOW_STAGES.find(s => s.id === filterStatus)?.label} Records`}
              </CardTitle>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {WORKFLOW_STAGES.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <div 
                  key={record.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openDetails(record)}
                >
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{record.title}</p>
                      {getStatusBadge(record.status)}
                      <Badge variant="outline" className="uppercase text-[10px]">{record.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {record.client}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(record.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.status !== "delivered" && (
                      <Button 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); advanceStage(record.id); }}
                      >
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Advance
                      </Button>
                    )}
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredRecords.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No advice records found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Record Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            {selectedRecord && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <DialogTitle>{selectedRecord.title}</DialogTitle>
                    {getStatusBadge(selectedRecord.status)}
                  </div>
                  <DialogDescription>
                    {selectedRecord.client} • {selectedRecord.type.toUpperCase()} • Created {formatDate(selectedRecord.createdAt)}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Summary */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Summary</Label>
                    <p className="mt-1">{selectedRecord.summary}</p>
                  </div>
                  
                  {/* Recommendations */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Recommendations</Label>
                    <div className="mt-2 space-y-2">
                      {selectedRecord.recommendations.map(rec => (
                        <div key={rec.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            rec.status === 'implemented' ? 'bg-green-100 text-green-600' :
                            rec.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {rec.status === 'implemented' ? <CheckCircle className="h-4 w-4" /> :
                             rec.status === 'approved' ? <CheckCircle className="h-4 w-4" /> :
                             <Clock className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{rec.text}</p>
                            <p className="text-xs text-muted-foreground">{rec.impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Compliance Notes */}
                  {selectedRecord.complianceNotes && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Compliance Notes</Label>
                      <p className="mt-1 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 text-sm">
                        <Shield className="h-4 w-4 inline mr-2" />
                        {selectedRecord.complianceNotes}
                      </p>
                    </div>
                  )}
                  
                  {/* Documents */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Attached Documents</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedRecord.documents.map((doc, i) => (
                        <Badge key={`item-${i}`} variant="outline" className="cursor-pointer hover:bg-muted">
                          <FileText className="h-3 w-3 mr-1" />
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  {selectedRecord.status !== "delivered" && (
                    <Button onClick={() => { advanceStage(selectedRecord.id); setDetailsOpen(false); }}>
                      <ChevronRight className="h-4 w-4 mr-2" />
                      Advance to {WORKFLOW_STAGES[WORKFLOW_STAGES.findIndex(s => s.id === selectedRecord.status) + 1]?.label}
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdviceWorkflow;
