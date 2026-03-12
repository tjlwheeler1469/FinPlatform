import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  FileText,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Calendar,
  Building2,
  Lock,
  Unlock,
  FileCheck,
  Activity,
  Users,
  AlertCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

// KYC/AML Checklist Items
const KYC_CHECKLIST = [
  { id: "id_verified", label: "Identity Verified (100 point check)", category: "identity", mandatory: true },
  { id: "address_verified", label: "Address Verified", category: "identity", mandatory: true },
  { id: "pep_check", label: "PEP (Politically Exposed Person) Check", category: "aml", mandatory: true },
  { id: "sanctions_check", label: "Sanctions List Check", category: "aml", mandatory: true },
  { id: "source_of_funds", label: "Source of Funds Documented", category: "aml", mandatory: true },
  { id: "risk_assessment", label: "Risk Assessment Completed", category: "risk", mandatory: true },
  { id: "risk_profile", label: "Risk Profile Questionnaire", category: "risk", mandatory: true },
  { id: "soa_issued", label: "Statement of Advice Issued", category: "compliance", mandatory: true },
  { id: "soa_acknowledged", label: "SOA Acknowledged by Client", category: "compliance", mandatory: true },
  { id: "fds_issued", label: "Fee Disclosure Statement Issued", category: "compliance", mandatory: true },
  { id: "consent_obtained", label: "Privacy Consent Obtained", category: "compliance", mandatory: true },
  { id: "beneficial_owner", label: "Beneficial Ownership Identified", category: "aml", mandatory: false },
  { id: "trust_deed_verified", label: "Trust Deed Reviewed (if applicable)", category: "entity", mandatory: false },
  { id: "company_extract", label: "Company Extract Obtained (if applicable)", category: "entity", mandatory: false }
];

// Mock clients
const MOCK_CLIENTS = [
  { id: "client_1", name: "Wheeler Family", type: "family", risk_level: "medium" },
  { id: "client_2", name: "Smith & Associates", type: "trust", risk_level: "low" },
  { id: "client_3", name: "Johnson Trust", type: "trust", risk_level: "high" },
  { id: "client_4", name: "Williams Family", type: "family", risk_level: "medium" },
  { id: "client_5", name: "Brown Investments", type: "company", risk_level: "low" },
];

// Mock activity log
const INITIAL_ACTIVITY_LOG = [
  { id: "log_1", client_id: "client_1", action: "soa_generated", description: "Statement of Advice generated", user: "James Wheeler", timestamp: "2025-03-15T10:30:00Z", category: "document" },
  { id: "log_2", client_id: "client_1", action: "meeting_held", description: "Annual review meeting conducted", user: "James Wheeler", timestamp: "2025-03-14T14:00:00Z", category: "meeting" },
  { id: "log_3", client_id: "client_2", action: "kyc_updated", description: "KYC documentation refreshed", user: "James Wheeler", timestamp: "2025-03-13T09:15:00Z", category: "compliance" },
  { id: "log_4", client_id: "client_3", action: "risk_review", description: "Risk profile reviewed - upgraded to High", user: "James Wheeler", timestamp: "2025-03-12T11:45:00Z", category: "compliance" },
  { id: "log_5", client_id: "client_1", action: "portfolio_change", description: "Portfolio rebalancing executed", user: "James Wheeler", timestamp: "2025-03-11T16:20:00Z", category: "transaction" },
  { id: "log_6", client_id: "client_4", action: "phone_call", description: "Phone consultation regarding super contributions", user: "James Wheeler", timestamp: "2025-03-10T13:00:00Z", category: "communication" },
  { id: "log_7", client_id: "client_5", action: "email_sent", description: "Quarterly report sent via email", user: "James Wheeler", timestamp: "2025-03-09T08:30:00Z", category: "communication" },
];

const ComplianceAuditTools = ({ clientId, onComplianceUpdate }) => {
  const [activeTab, setActiveTab] = useState("audit-log");
  const [activityLog, setActivityLog] = useState(() => {
    const saved = localStorage.getItem("wheeler_activity_log");
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOG;
  });
  const [kycStatus, setKycStatus] = useState(() => {
    const saved = localStorage.getItem("wheeler_kyc_status");
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedClient, setSelectedClient] = useState(clientId || "client_1");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    action: "",
    description: "",
    category: "communication"
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("wheeler_activity_log", JSON.stringify(activityLog));
  }, [activityLog]);

  useEffect(() => {
    localStorage.setItem("wheeler_kyc_status", JSON.stringify(kycStatus));
  }, [kycStatus]);

  // Get client KYC status
  const getClientKyc = (clientIdParam) => {
    return kycStatus[clientIdParam] || {};
  };

  // Update KYC item
  const updateKycItem = (clientIdParam, itemId, checked) => {
    const clientKyc = getClientKyc(clientIdParam);
    const newKyc = {
      ...kycStatus,
      [clientIdParam]: {
        ...clientKyc,
        [itemId]: {
          completed: checked,
          completed_at: checked ? new Date().toISOString() : null,
          completed_by: "James Wheeler"
        }
      }
    };
    setKycStatus(newKyc);
    
    // Log the activity
    if (checked) {
      addActivityLog({
        client_id: clientIdParam,
        action: "kyc_item_completed",
        description: `KYC item completed: ${KYC_CHECKLIST.find(k => k.id === itemId)?.label}`,
        category: "compliance"
      });
    }
    
    toast.success(checked ? "KYC item completed" : "KYC item unchecked");
  };

  // Add activity log entry
  const addActivityLog = (entry) => {
    const newEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "James Wheeler",
      ...entry
    };
    setActivityLog([newEntry, ...activityLog]);
  };

  // Handle new activity submission
  const handleAddActivity = () => {
    if (!newActivity.description) {
      toast.error("Please enter a description");
      return;
    }
    
    addActivityLog({
      client_id: selectedClient,
      action: newActivity.action || "note_added",
      description: newActivity.description,
      category: newActivity.category
    });
    
    setNewActivity({ action: "", description: "", category: "communication" });
    setShowNewActivity(false);
    toast.success("Activity logged");
  };

  // Calculate KYC completion percentage
  const getKycCompletion = (clientIdParam) => {
    const clientKyc = getClientKyc(clientIdParam);
    const mandatoryItems = KYC_CHECKLIST.filter(k => k.mandatory);
    const completedMandatory = mandatoryItems.filter(k => clientKyc[k.id]?.completed).length;
    return Math.round((completedMandatory / mandatoryItems.length) * 100);
  };

  // Filter activity log
  const filteredLog = activityLog.filter(entry => {
    const matchesClient = !selectedClient || entry.client_id === selectedClient || selectedClient === "all";
    const matchesSearch = !searchQuery || 
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    return matchesClient && matchesSearch && matchesCategory;
  });

  // Get client name
  const getClientName = (clientIdParam) => {
    return MOCK_CLIENTS.find(c => c.id === clientIdParam)?.name || "Unknown";
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case "document": return <FileText className="h-4 w-4" />;
      case "meeting": return <Users className="h-4 w-4" />;
      case "compliance": return <Shield className="h-4 w-4" />;
      case "transaction": return <Activity className="h-4 w-4" />;
      case "communication": return <User className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case "document": return "bg-blue-100 text-blue-800";
      case "meeting": return "bg-purple-100 text-purple-800";
      case "compliance": return "bg-green-100 text-green-800";
      case "transaction": return "bg-amber-100 text-amber-800";
      case "communication": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Export audit log
  const exportAuditLog = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      exported_by: "James Wheeler",
      client: selectedClient === "all" ? "All Clients" : getClientName(selectedClient),
      entries: filteredLog
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Audit log exported");
  };

  return (
    <div className="space-y-6" data-testid="compliance-audit-tools">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#D4A84C]" />
            Compliance & Audit Tools
          </h2>
          <p className="text-sm text-muted-foreground">Activity logging, KYC/AML checklists, and compliance tracking</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-48" data-testid="client-filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {MOCK_CLIENTS.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="audit-log" data-testid="tab-audit-log">
            <Activity className="h-4 w-4 mr-2" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="kyc-aml" data-testid="tab-kyc-aml">
            <FileCheck className="h-4 w-4 mr-2" />
            KYC/AML Checklist
          </TabsTrigger>
          <TabsTrigger value="compliance-status" data-testid="tab-compliance-status">
            <Shield className="h-4 w-4 mr-2" />
            Compliance Status
          </TabsTrigger>
        </TabsList>

        {/* Audit Log Tab */}
        <TabsContent value="audit-log" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                data-testid="search-activities"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="meeting">Meetings</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="transaction">Transactions</SelectItem>
                <SelectItem value="communication">Communications</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportAuditLog} data-testid="export-audit-log">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Dialog open={showNewActivity} onOpenChange={setShowNewActivity}>
              <DialogTrigger asChild>
                <Button className="bg-[#1a2744]" data-testid="new-activity-btn">
                  <Plus className="h-4 w-4 mr-2" /> Log Activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log New Activity</DialogTitle>
                  <DialogDescription>Record a client interaction or compliance event</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Activity Type</Label>
                    <Select value={newActivity.category} onValueChange={(v) => setNewActivity({...newActivity, category: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="communication">Communication</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="transaction">Transaction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newActivity.description}
                      onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                      placeholder="Describe the activity..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewActivity(false)}>Cancel</Button>
                  <Button onClick={handleAddActivity} className="bg-[#1a2744]">Log Activity</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Activity Log */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activity Timeline</CardTitle>
              <CardDescription>{filteredLog.length} activities found</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {filteredLog.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`activity-${entry.id}`}
                    >
                      <div className={`p-2 rounded-lg h-fit ${getCategoryColor(entry.category)}`}>
                        {getCategoryIcon(entry.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{entry.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{entry.user}</span>
                              <span>•</span>
                              <span>{getClientName(entry.client_id)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {entry.category}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(entry.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KYC/AML Tab */}
        <TabsContent value="kyc-aml" className="space-y-4">
          {selectedClient !== "all" ? (
            <>
              {/* Progress */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">{getClientName(selectedClient)} - KYC Verification</p>
                      <p className="text-sm text-muted-foreground">
                        {getKycCompletion(selectedClient)}% of mandatory items completed
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getKycCompletion(selectedClient) === 100 
                        ? 'bg-green-100 text-green-800' 
                        : getKycCompletion(selectedClient) >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {getKycCompletion(selectedClient) === 100 ? 'Complete' : 'In Progress'}
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        getKycCompletion(selectedClient) === 100 
                          ? 'bg-green-500' 
                          : 'bg-[#1a2744]'
                      }`}
                      style={{ width: `${getKycCompletion(selectedClient)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Checklist by Category */}
              {['identity', 'aml', 'risk', 'compliance', 'entity'].map(category => {
                const items = KYC_CHECKLIST.filter(k => k.category === category);
                if (items.length === 0) return null;
                
                return (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base capitalize flex items-center gap-2">
                        {category === 'identity' && <User className="h-4 w-4 text-[#D4A84C]" />}
                        {category === 'aml' && <Shield className="h-4 w-4 text-[#D4A84C]" />}
                        {category === 'risk' && <AlertTriangle className="h-4 w-4 text-[#D4A84C]" />}
                        {category === 'compliance' && <FileCheck className="h-4 w-4 text-[#D4A84C]" />}
                        {category === 'entity' && <Building2 className="h-4 w-4 text-[#D4A84C]" />}
                        {category.replace('_', ' ')} Verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {items.map(item => {
                          const itemStatus = getClientKyc(selectedClient)[item.id];
                          return (
                            <div 
                              key={item.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                              data-testid={`kyc-item-${item.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={itemStatus?.completed || false}
                                  onCheckedChange={(checked) => updateKycItem(selectedClient, item.id, checked)}
                                  data-testid={`checkbox-${item.id}`}
                                />
                                <div>
                                  <p className={`font-medium ${itemStatus?.completed ? 'text-muted-foreground line-through' : ''}`}>
                                    {item.label}
                                  </p>
                                  {itemStatus?.completed && (
                                    <p className="text-xs text-muted-foreground">
                                      Completed by {itemStatus.completed_by} on {formatTimestamp(itemStatus.completed_at)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.mandatory && (
                                  <Badge variant="outline" className="text-red-600 border-red-200">
                                    Mandatory
                                  </Badge>
                                )}
                                {itemStatus?.completed ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Select a Client</p>
                <p className="text-sm">Choose a specific client to view their KYC/AML checklist</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Compliance Status Tab */}
        <TabsContent value="compliance-status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Compliance Overview</CardTitle>
              <CardDescription>KYC/AML status and risk levels for all clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_CLIENTS.map(client => {
                  const completion = getKycCompletion(client.id);
                  const riskColors = {
                    low: "bg-green-100 text-green-800",
                    medium: "bg-amber-100 text-amber-800",
                    high: "bg-red-100 text-red-800"
                  };
                  
                  return (
                    <div 
                      key={client.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`compliance-status-${client.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#1a2744]/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-[#1a2744]" />
                        </div>
                        <div>
                          <p className="font-semibold">{client.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{client.type}</Badge>
                            <Badge className={`text-xs ${riskColors[client.risk_level]}`}>
                              {client.risk_level} risk
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">KYC Status</p>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  completion === 100 ? 'bg-green-500' : 'bg-[#1a2744]'
                                }`}
                                style={{ width: `${completion}%` }}
                              />
                            </div>
                            <span className="text-sm">{completion}%</span>
                          </div>
                        </div>
                        {completion === 100 ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : completion >= 50 ? (
                          <AlertCircle className="h-6 w-6 text-amber-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AFSL Compliance Summary */}
          <Card className="border-[#D4A84C]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#D4A84C]" />
                AFSL Compliance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {MOCK_CLIENTS.filter(c => getKycCompletion(c.id) === 100).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Fully Compliant</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {MOCK_CLIENTS.filter(c => getKycCompletion(c.id) >= 50 && getKycCompletion(c.id) < 100).length}
                  </p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {MOCK_CLIENTS.filter(c => getKycCompletion(c.id) < 50).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Needs Attention</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{activityLog.length}</p>
                  <p className="text-sm text-muted-foreground">Audit Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceAuditTools;
