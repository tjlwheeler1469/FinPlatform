import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import {
  FileText, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, Plus,
  Eye, Edit, Calendar, User, Shield, Search, Filter, Download, Upload,
  ClipboardCheck, AlertOctagon, FileCheck, History
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DOCUMENT_TYPES = {
  soa: { label: 'Statement of Advice', color: 'bg-blue-500' },
  roa: { label: 'Record of Advice', color: 'bg-green-500' },
  soa_supplementary: { label: 'SOA Supplementary', color: 'bg-purple-500' },
  fsg: { label: 'Financial Services Guide', color: 'bg-orange-500' },
  ips: { label: 'Investment Policy Statement', color: 'bg-teal-500' }
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  pending_review: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  pending_signature: 'bg-purple-100 text-purple-800',
  signed: 'bg-green-100 text-green-800',
  implemented: 'bg-green-200 text-green-900',
  superseded: 'bg-gray-200 text-gray-600',
  withdrawn: 'bg-red-100 text-red-800'
};

export default function AdviserComplianceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [adviserId, setAdviserId] = useState('ADV001');
  
  // Data
  const [documents, setDocuments] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [reviewsDue, setReviewsDue] = useState({ reviews_due: [], overdue_reviews: [] });
  const [complianceSummary, setComplianceSummary] = useState(null);
  
  // Dialogs
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // New document form
  const [newDoc, setNewDoc] = useState({
    client_id: '',
    client_name: '',
    document_type: 'soa',
    advice_type: 'personal',
    title: '',
    description: '',
    advice_areas: [],
    advice_fee: 0
  });

  useEffect(() => {
    loadData();
  }, [adviserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, pendingRes, dueRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/compliance-docs/adviser/${adviserId}`).then(r => r.json()),
        fetch(`${API_URL}/api/compliance-docs/reviews/pending`).then(r => r.json()),
        fetch(`${API_URL}/api/compliance-docs/reviews/due?days=30`).then(r => r.json()),
        fetch(`${API_URL}/api/compliance-docs/compliance-summary`).then(r => r.json())
      ]);
      
      setDocuments(docsRes.documents || []);
      setPendingReviews(pendingRes.pending_reviews || []);
      setReviewsDue(dueRes);
      setComplianceSummary(summaryRes);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const createDocument = async () => {
    try {
      const payload = {
        ...newDoc,
        adviser_id: adviserId,
        adviser_name: 'Demo Adviser',
        advice_date: new Date().toISOString(),
        status: 'draft'
      };
      
      const response = await fetch(`${API_URL}/api/compliance-docs/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.document_id) {
        toast.success(`${DOCUMENT_TYPES[newDoc.document_type].label} created: ${data.document_id}`);
        setShowNewDocDialog(false);
        setNewDoc({
          client_id: '',
          client_name: '',
          document_type: 'soa',
          advice_type: 'personal',
          title: '',
          description: '',
          advice_areas: [],
          advice_fee: 0
        });
        loadData();
      }
    } catch (error) {
      toast.error('Failed to create document');
    }
  };

  const updateStatus = async (documentId, newStatus, notes = '') => {
    try {
      await fetch(`${API_URL}/api/compliance-docs/document/${documentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes, date: new Date().toISOString() })
      });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      loadData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const submitReview = async (documentId, outcome, notes) => {
    try {
      await fetch(`${API_URL}/api/compliance-docs/document/${documentId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_id: 'REV001',
          reviewer_name: 'Compliance Officer',
          outcome,
          notes
        })
      });
      toast.success(`Review submitted: ${outcome}`);
      setShowReviewDialog(false);
      loadData();
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const getStatusBadge = (status) => (
    <Badge className={STATUS_COLORS[status] || 'bg-gray-100'}>{status?.replace('_', ' ')}</Badge>
  );

  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '-';

  return (
    <Layout>
      <div className="space-y-6 p-6" data-testid="adviser-compliance-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Compliance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              SOA/ROA tracking, reviews, breaches, and audit trails
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={adviserId} onValueChange={setAdviserId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select adviser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADV001">Demo Adviser</SelectItem>
                <SelectItem value="ADV002">John Smith</SelectItem>
                <SelectItem value="ADV003">Sarah Wilson</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> New SOA/ROA
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Compliance Document</DialogTitle>
                  <DialogDescription>Create a new Statement of Advice or Record of Advice</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <Label>Document Type</Label>
                    <Select value={newDoc.document_type} onValueChange={(v) => setNewDoc({...newDoc, document_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(DOCUMENT_TYPES).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Advice Type</Label>
                    <Select value={newDoc.advice_type} onValueChange={(v) => setNewDoc({...newDoc, advice_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="scaled">Scaled</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Client ID</Label>
                    <Input value={newDoc.client_id} onChange={(e) => setNewDoc({...newDoc, client_id: e.target.value})} placeholder="e.g., CLIENT-001" />
                  </div>
                  <div>
                    <Label>Client Name</Label>
                    <Input value={newDoc.client_name} onChange={(e) => setNewDoc({...newDoc, client_name: e.target.value})} placeholder="e.g., John Smith" />
                  </div>
                  <div className="col-span-2">
                    <Label>Title</Label>
                    <Input value={newDoc.title} onChange={(e) => setNewDoc({...newDoc, title: e.target.value})} placeholder="e.g., Superannuation Rollover Advice" />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea value={newDoc.description} onChange={(e) => setNewDoc({...newDoc, description: e.target.value})} placeholder="Brief description of the advice..." />
                  </div>
                  <div>
                    <Label>Advice Fee (AUD)</Label>
                    <Input type="number" value={newDoc.advice_fee} onChange={(e) => setNewDoc({...newDoc, advice_fee: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewDocDialog(false)}>Cancel</Button>
                  <Button onClick={createDocument}>Create Document</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> Total Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
              <p className="text-xs text-muted-foreground">SOA: {documents.filter(d => d.document_type === 'soa').length} | ROA: {documents.filter(d => d.document_type === 'roa').length}</p>
            </CardContent>
          </Card>

          <Card className={pendingReviews.length > 0 ? 'border-yellow-500 border-2' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" /> Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingReviews.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting compliance review</p>
            </CardContent>
          </Card>

          <Card className={reviewsDue.overdue_reviews?.length > 0 ? 'border-red-500 border-2' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" /> Overdue Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{reviewsDue.overdue_reviews?.length || 0}</div>
              <p className="text-xs text-muted-foreground">{reviewsDue.reviews_due?.length || 0} due in 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Implemented
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.status === 'implemented').length}
              </div>
              <p className="text-xs text-muted-foreground">Advice implemented</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {reviewsDue.overdue_reviews?.length > 0 && (
          <Alert variant="destructive">
            <AlertOctagon className="h-4 w-4" />
            <AlertTitle>Overdue Annual Reviews</AlertTitle>
            <AlertDescription>
              {reviewsDue.overdue_reviews.length} client(s) have overdue annual reviews. Immediate action required.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="overview-tab">
              <FileText className="h-4 w-4 mr-2" /> All Documents
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="pending-tab">
              <Clock className="h-4 w-4 mr-2" /> Pending Review
              {pendingReviews.length > 0 && <Badge className="ml-2 bg-yellow-500">{pendingReviews.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="reviews" data-testid="reviews-tab">
              <Calendar className="h-4 w-4 mr-2" /> Reviews Due
              {(reviewsDue.overdue_reviews?.length || 0) > 0 && <Badge className="ml-2 bg-red-500">{reviewsDue.overdue_reviews.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="workflow" data-testid="workflow-tab">
              <ClipboardCheck className="h-4 w-4 mr-2" /> Workflow
            </TabsTrigger>
          </TabsList>

          {/* All Documents Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Documents</CardTitle>
                <CardDescription>All SOA, ROA, and related documents</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Advice Date</TableHead>
                        <TableHead>Review Due</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.document_id}>
                          <TableCell className="font-mono text-sm">{doc.document_id}</TableCell>
                          <TableCell>
                            <Badge className={DOCUMENT_TYPES[doc.document_type]?.color || 'bg-gray-500'}>
                              {doc.document_type?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>{doc.client_name}</div>
                            <div className="text-xs text-muted-foreground">{doc.client_id}</div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{doc.title}</TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell>{formatDate(doc.advice_date)}</TableCell>
                          <TableCell>
                            {doc.review_due_date && (
                              <span className={new Date(doc.review_due_date) < new Date() ? 'text-red-600 font-bold' : ''}>
                                {formatDate(doc.review_due_date)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => { setSelectedDoc(doc); }}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              {doc.status === 'draft' && (
                                <Button size="sm" variant="ghost" onClick={() => updateStatus(doc.document_id, 'pending_review')}>
                                  Submit
                                </Button>
                              )}
                              {doc.status === 'reviewed' && (
                                <Button size="sm" variant="ghost" onClick={() => updateStatus(doc.document_id, 'pending_signature')}>
                                  Present
                                </Button>
                              )}
                              {doc.status === 'pending_signature' && (
                                <Button size="sm" variant="ghost" onClick={() => updateStatus(doc.document_id, 'signed')}>
                                  Sign
                                </Button>
                              )}
                              {doc.status === 'signed' && (
                                <Button size="sm" variant="ghost" onClick={() => updateStatus(doc.document_id, 'implemented')}>
                                  Implement
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {documents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No documents found. Create a new SOA or ROA to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Review Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents Awaiting Compliance Review</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingReviews.length > 0 ? (
                  <div className="space-y-4">
                    {pendingReviews.map((doc) => (
                      <div key={doc.document_id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={DOCUMENT_TYPES[doc.document_type]?.color}>{doc.document_type?.toUpperCase()}</Badge>
                              <span className="font-medium">{doc.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Client: {doc.client_name} | Adviser: {doc.adviser_name} | Submitted: {formatDate(doc.created_at)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedDoc(doc); setShowReviewDialog(true); }}>
                              <ClipboardCheck className="h-4 w-4 mr-1" /> Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No documents pending review</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Due Tab */}
          <TabsContent value="reviews" className="space-y-4">
            {reviewsDue.overdue_reviews?.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertOctagon className="h-5 w-5" /> Overdue Reviews ({reviewsDue.overdue_reviews.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reviewsDue.overdue_reviews.map((doc) => (
                      <div key={doc.document_id} className="p-3 bg-white rounded border border-red-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{doc.client_name}</span>
                            <span className="text-sm text-muted-foreground ml-2">{doc.title}</span>
                          </div>
                          <Badge variant="destructive">Due: {formatDate(doc.review_due_date)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Reviews Due Within 30 Days ({reviewsDue.reviews_due?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsDue.reviews_due?.length > 0 ? (
                  <div className="space-y-2">
                    {reviewsDue.reviews_due.map((doc) => (
                      <div key={doc.document_id} className="p-3 border rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{doc.client_name}</span>
                            <span className="text-sm text-muted-foreground ml-2">{doc.title}</span>
                          </div>
                          <Badge variant="outline">{formatDate(doc.review_due_date)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">No reviews due in the next 30 days</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SOA/ROA Workflow</CardTitle>
                <CardDescription>Standard compliance workflow for advice documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4">
                  {['Draft', 'Pending Review', 'Reviewed', 'Pending Signature', 'Signed', 'Implemented'].map((step, i) => (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i < 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                          {i + 1}
                        </div>
                        <span className="text-xs mt-2 text-center max-w-[80px]">{step}</span>
                      </div>
                      {i < 5 && <div className="flex-1 h-1 bg-gray-200 mx-2" />}
                    </React.Fragment>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Draft</h4>
                    <p className="text-muted-foreground">Adviser prepares the advice document</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Compliance Review</h4>
                    <p className="text-muted-foreground">Document reviewed for compliance requirements</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Implementation</h4>
                    <p className="text-muted-foreground">Advice presented, signed, and implemented</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compliance Review</DialogTitle>
              <DialogDescription>Review document: {selectedDoc?.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded">
                <p><strong>Client:</strong> {selectedDoc?.client_name}</p>
                <p><strong>Type:</strong> {selectedDoc?.document_type?.toUpperCase()}</p>
                <p><strong>Adviser:</strong> {selectedDoc?.adviser_name}</p>
              </div>
              <div>
                <Label>Review Outcome</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="approved_with_conditions">Approved with Conditions</SelectItem>
                    <SelectItem value="requires_changes">Requires Changes</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Review Notes</Label>
                <Textarea placeholder="Enter review notes..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
              <Button onClick={() => submitReview(selectedDoc?.document_id, 'approved', 'Review completed')}>Submit Review</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
