import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
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
  FileSignature,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
  RefreshCw,
  User,
  Mail,
  FileText,
  Pen,
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Database
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// Document Templates
const DOCUMENT_TEMPLATES = [
  { 
    id: "soa", 
    name: "Statement of Advice (SOA)", 
    description: "Comprehensive financial advice document",
    required_signatures: ["client", "adviser"],
    pages: 12
  },
  { 
    id: "fds", 
    name: "Fee Disclosure Statement", 
    description: "Annual fee disclosure as required by ASIC",
    required_signatures: ["client"],
    pages: 4
  },
  { 
    id: "kyc", 
    name: "KYC Verification Form", 
    description: "Know Your Customer identity verification",
    required_signatures: ["client"],
    pages: 2
  },
  { 
    id: "consent", 
    name: "Privacy Consent Form", 
    description: "Data collection and privacy consent",
    required_signatures: ["client"],
    pages: 3
  },
  { 
    id: "authority", 
    name: "Authority to Proceed", 
    description: "Client authorization to implement advice",
    required_signatures: ["client", "adviser"],
    pages: 1
  },
  { 
    id: "ipa", 
    name: "Investment Policy Agreement", 
    description: "Agreement on investment strategy and risk tolerance",
    required_signatures: ["client", "adviser"],
    pages: 6
  }
];

// Mock signature requests
const INITIAL_SIGNATURE_REQUESTS = [
  {
    id: "sig_001",
    document_id: "soa",
    document_name: "Statement of Advice (SOA)",
    client_name: "Wheeler Family",
    client_email: "james@wheeler.com",
    status: "completed",
    sent_at: "2025-03-10T09:00:00Z",
    completed_at: "2025-03-11T14:30:00Z",
    signatures: [
      { role: "client", name: "James Wheeler", signed_at: "2025-03-11T10:15:00Z" },
      { role: "adviser", name: "Financial Adviser", signed_at: "2025-03-11T14:30:00Z" }
    ]
  },
  {
    id: "sig_002",
    document_id: "fds",
    document_name: "Fee Disclosure Statement",
    client_name: "Smith & Associates",
    client_email: "sarah@smith.com",
    status: "pending",
    sent_at: "2025-03-12T10:00:00Z",
    completed_at: null,
    signatures: []
  },
  {
    id: "sig_003",
    document_id: "authority",
    document_name: "Authority to Proceed",
    client_name: "Johnson Trust",
    client_email: "michael@johnson.com",
    status: "expired",
    sent_at: "2025-02-15T08:00:00Z",
    completed_at: null,
    expires_at: "2025-03-01T08:00:00Z",
    signatures: []
  }
];

// Mock clients
const MOCK_CLIENTS = [
  { id: "client_1", name: "Wheeler Family", email: "james@wheeler.com" },
  { id: "client_2", name: "Smith & Associates", email: "sarah@smith.com" },
  { id: "client_3", name: "Johnson Trust", email: "michael@johnson.com" },
  { id: "client_4", name: "Williams Family", email: "emma@williams.com" },
  { id: "client_5", name: "Brown Investments", email: "david@brown.com" },
];

const DocuSignIntegration = ({ onSignatureComplete }) => {
  const [signatureRequests, setSignatureRequests] = useState(() => {
    const saved = localStorage.getItem("wheeler_docusign_requests");
    return saved ? JSON.parse(saved) : INITIAL_SIGNATURE_REQUESTS;
  });
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newRequest, setNewRequest] = useState({
    document_id: "",
    client_id: "",
    message: ""
  });
  const [signingStep, setSigningStep] = useState(0);
  const [signatureData, setSignatureData] = useState("");

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("wheeler_docusign_requests", JSON.stringify(signatureRequests));
  }, [signatureRequests]);

  // Send signature request
  const sendSignatureRequest = () => {
    if (!newRequest.document_id || !newRequest.client_id) {
      toast.error("Please select a document and client");
      return;
    }

    const template = DOCUMENT_TEMPLATES.find(t => t.id === newRequest.document_id);
    const client = MOCK_CLIENTS.find(c => c.id === newRequest.client_id);

    const request = {
      id: `sig_${Date.now()}`,
      document_id: newRequest.document_id,
      document_name: template.name,
      client_name: client.name,
      client_email: client.email,
      status: "pending",
      sent_at: new Date().toISOString(),
      completed_at: null,
      message: newRequest.message,
      signatures: []
    };

    setSignatureRequests([request, ...signatureRequests]);
    setShowSendDialog(false);
    setNewRequest({ document_id: "", client_id: "", message: "" });
    
    toast.success(`Signature request sent to ${client.name}`, {
      description: `Document: ${template.name}`
    });
  };

  // Simulate signing process
  const startSigning = (request) => {
    setSelectedRequest(request);
    setSigningStep(0);
    setSignatureData("");
    setShowSignDialog(true);
  };

  // Complete signing
  const completeSigning = () => {
    if (!signatureData.trim()) {
      toast.error("Please type your signature");
      return;
    }

    const updatedRequests = signatureRequests.map(req => {
      if (req.id === selectedRequest.id) {
        const template = DOCUMENT_TEMPLATES.find(t => t.id === req.document_id);
        const newSignature = {
          role: "client",
          name: signatureData,
          signed_at: new Date().toISOString()
        };
        
        const allSigned = template.required_signatures.length === 1 || 
          req.signatures.length + 1 >= template.required_signatures.length;
        
        return {
          ...req,
          status: allSigned ? "completed" : "partially_signed",
          completed_at: allSigned ? new Date().toISOString() : null,
          signatures: [...req.signatures, newSignature]
        };
      }
      return req;
    });

    setSignatureRequests(updatedRequests);
    setShowSignDialog(false);
    toast.success("Document signed successfully!");
    
    if (onSignatureComplete) {
      onSignatureComplete(selectedRequest);
    }
  };

  // Resend expired request
  const resendRequest = (requestId) => {
    setSignatureRequests(signatureRequests.map(req => 
      req.id === requestId 
        ? { ...req, status: "pending", sent_at: new Date().toISOString() }
        : req
    ));
    toast.success("Signature request resent");
  };

  // Cancel request
  const cancelRequest = (requestId) => {
    setSignatureRequests(signatureRequests.map(req => 
      req.id === requestId 
        ? { ...req, status: "cancelled" }
        : req
    ));
    toast.info("Signature request cancelled");
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "partially_signed":
        return <Badge className="bg-blue-100 text-blue-800"><Pen className="h-3 w-3 mr-1" /> Partially Signed</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" /> Expired</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800"><X className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Stats
  const pendingCount = signatureRequests.filter(r => r.status === "pending" || r.status === "partially_signed").length;
  const completedCount = signatureRequests.filter(r => r.status === "completed").length;
  const expiredCount = signatureRequests.filter(r => r.status === "expired").length;

  return (
    <div className="space-y-6" data-testid="docusign-integration">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-[#D4AF37]" />
            E-Signature Management
          </h2>
          <p className="text-sm text-muted-foreground">Send and manage document signatures (DocuSign MOCK)</p>
        </div>
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#0F392B]" data-testid="send-signature-btn">
              <Send className="h-4 w-4 mr-2" /> Send for Signature
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send Document for Signature</DialogTitle>
              <DialogDescription>Select a document template and recipient</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Document Template</Label>
                <Select value={newRequest.document_id} onValueChange={(v) => setNewRequest({...newRequest, document_id: v})}>
                  <SelectTrigger data-testid="document-select">
                    <SelectValue placeholder="Select document" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">{template.pages} pages</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Select value={newRequest.client_id} onValueChange={(v) => setNewRequest({...newRequest, client_id: v})}>
                  <SelectTrigger data-testid="client-select">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_CLIENTS.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex flex-col">
                          <span>{client.name}</span>
                          <span className="text-xs text-muted-foreground">{client.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Message (optional)</Label>
                <Textarea
                  placeholder="Add a personal message to the recipient..."
                  value={newRequest.message}
                  onChange={(e) => setNewRequest({...newRequest, message: e.target.value})}
                  rows={3}
                />
              </div>
              
              {newRequest.document_id && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <p className="text-sm">
                      <strong>Required signatures:</strong>{" "}
                      {DOCUMENT_TEMPLATES.find(t => t.id === newRequest.document_id)?.required_signatures.join(", ")}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSendDialog(false)}>Cancel</Button>
              <Button onClick={sendSignatureRequest} className="bg-[#0F392B]" data-testid="confirm-send-btn">
                <Send className="h-4 w-4 mr-2" /> Send Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signature Requests List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Signature Requests</CardTitle>
          <CardDescription>{signatureRequests.length} total requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {signatureRequests.map(request => (
              <div 
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                data-testid={`signature-request-${request.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#0F392B]/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[#0F392B]" />
                  </div>
                  <div>
                    <p className="font-semibold">{request.document_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{request.client_name}</span>
                      <span>•</span>
                      <Mail className="h-3 w-3" />
                      <span>{request.client_email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sent: {formatDate(request.sent_at)}
                      {request.completed_at && ` • Completed: ${formatDate(request.completed_at)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(request.status)}
                  <div className="flex gap-1">
                    {request.status === "pending" && (
                      <Button 
                        size="sm" 
                        onClick={() => startSigning(request)}
                        data-testid={`sign-btn-${request.id}`}
                      >
                        <Pen className="h-4 w-4 mr-1" /> Sign Now
                      </Button>
                    )}
                    {request.status === "expired" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => resendRequest(request.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" /> Resend
                      </Button>
                    )}
                    {request.status === "completed" && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    )}
                    {(request.status === "pending" || request.status === "partially_signed") && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => cancelRequest(request.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mock Signing Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-[#D4AF37]" />
              Sign Document
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.document_name} - MOCK SIGNING INTERFACE
            </DialogDescription>
          </DialogHeader>
          
          {signingStep === 0 && (
            <div className="space-y-4 py-4">
              {/* Mock Document Preview */}
              <Card className="bg-gray-50">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <Badge variant="outline" className="mb-2">MOCK DOCUMENT PREVIEW</Badge>
                    <h3 className="text-xl font-bold">{selectedRequest?.document_name}</h3>
                    <p className="text-sm text-muted-foreground">Wheeler Financial Advisers</p>
                  </div>
                  <div className="border-t pt-4 space-y-2 text-sm">
                    <p><strong>Client:</strong> {selectedRequest?.client_name}</p>
                    <p><strong>Email:</strong> {selectedRequest?.client_email}</p>
                    <p><strong>Date:</strong> {new Date().toLocaleDateString('en-AU')}</p>
                    <p className="text-muted-foreground mt-4">
                      [Document content would appear here in a real DocuSign integration]
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>By signing, you agree to the terms and conditions of this document.</span>
              </div>
              
              <Button onClick={() => setSigningStep(1)} className="w-full">
                Continue to Signature <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          
          {signingStep === 1 && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type Your Full Name as Signature</Label>
                <Input
                  value={signatureData}
                  onChange={(e) => setSignatureData(e.target.value)}
                  placeholder="Type your full legal name"
                  className="text-center text-xl font-['Satisfy'] italic"
                  data-testid="signature-input"
                />
              </div>
              
              {signatureData && (
                <Card className="bg-[#FFFEF0] border-[#D4AF37]">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-2">Signature Preview</p>
                    <p className="text-3xl font-['Satisfy'] italic text-[#0F392B]">{signatureData}</p>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSigningStep(0)} className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button onClick={completeSigning} className="flex-1 bg-[#0F392B]" data-testid="complete-signature-btn">
                  <CheckCircle className="h-4 w-4 mr-2" /> Complete Signature
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Integration Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">MOCK Integration Mode</p>
              <p className="text-sm text-amber-700 mt-1">
                This is a simulated DocuSign integration. In production, this would connect to the DocuSign API 
                for legally binding electronic signatures. Documents signed here are for demonstration purposes only.
              </p>
              <Button variant="link" className="p-0 h-auto text-amber-700 mt-2" asChild>
                <a href="https://developers.docusign.com/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" /> DocuSign Developer Documentation
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocuSignIntegration;
