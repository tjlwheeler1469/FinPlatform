import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Search,
  Folder,
  FolderOpen,
  Download,
  Trash2,
  Eye,
  Calculator,
  Shield,
  TrendingUp,
  PiggyBank,
  Home,
  Users,
  File,
  Clock,
  Filter,
  Mail,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Brain,
  Lightbulb,
  X
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatFileSize = (bytes) => {
  if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
  if (bytes >= 1000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${bytes} B`;
};

const CATEGORY_ICONS = {
  tax: Calculator,
  insurance: Shield,
  investments: TrendingUp,
  super: PiggyBank,
  property: Home,
  legal: FileText,
  estate: Users,
  other: Folder
};

const CATEGORY_COLORS = {
  tax: "bg-blue-100 text-blue-700",
  insurance: "bg-green-100 text-green-700",
  investments: "bg-purple-100 text-purple-700",
  super: "bg-amber-100 text-amber-700",
  property: "bg-red-100 text-red-700",
  legal: "bg-slate-100 text-slate-700",
  estate: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700"
};

// Lazy-load the Reports generator so it only mounts when the Reports tab is opened.
const LazyReportGenerator = lazy(() => import("@/pages/ReportGenerator"));

const DocumentVault = () => {
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchResults, setSearchResults] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingDoc, setAnalyzingDoc] = useState(false);
  const [portfolioInsights, setPortfolioInsights] = useState(null);
  const [activeTab, setActiveTab] = useState("documents");
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: "",
    category: "other",
    description: "",
    tags: ""
  });

  useEffect(() => {
    fetchDocuments();
    fetchPortfolioInsights();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioInsights = async () => {
    try {
      const docsResponse = await axios.get(`${API}/documents`);
      if (docsResponse.data?.all_documents) {
        const response = await axios.post(`${API}/documents/insights`, docsResponse.data.all_documents);
        setPortfolioInsights(response.data);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const response = await axios.get(`${API}/documents/search`, { params: { query: searchQuery } });
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error searching:", error);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await axios.delete(`${API}/documents/${docId}`);
      toast.success("Document deleted");
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.name) {
      toast.error("Please enter a document name");
      return;
    }
    
    try {
      await axios.post(`${API}/documents/upload`, {
        name: uploadForm.name,
        category: uploadForm.category,
        description: uploadForm.description,
        tags: uploadForm.tags.split(",").map(t => t.trim()).filter(t => t),
        file_type: "pdf",
        size: Math.floor(Math.random() * 500000) + 50000
      });
      
      toast.success("Document uploaded successfully");
      setUploadDialogOpen(false);
      setUploadForm({ name: "", category: "other", description: "", tags: "" });
      fetchDocuments();
      fetchPortfolioInsights();
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Failed to upload document");
    }
  };

  const handleAnalyzeDocument = async (doc) => {
    setSelectedDocument(doc);
    setAnalysisDialogOpen(true);
    setAnalyzingDoc(true);
    setAiAnalysis(null);
    
    try {
      const response = await axios.post(`${API}/documents/analyze`, {
        document_name: doc.name,
        document_type: doc.file_type || "pdf",
        document_category: doc.category
      });
      setAiAnalysis(response.data);
    } catch (error) {
      console.error("Error analyzing document:", error);
      toast.error("Failed to analyze document");
    } finally {
      setAnalyzingDoc(false);
    }
  };

  const filteredDocuments = documents?.all_documents?.filter(doc => 
    selectedCategory === "all" || doc.category === selectedCategory
  ) || [];

  const displayDocuments = searchResults || filteredDocuments;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="document-vault">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Document Vault</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Securely store and manage financial documents with AI-powered analysis
            </p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)} data-testid="upload-document-btn">
            <Upload className="h-4 w-4 mr-2" /> Upload Document
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="reports" data-testid="vault-tab-reports">Reports</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4 mt-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{documents?.total_documents || 0}</p>
                      <p className="text-xs text-muted-foreground">Total Documents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{formatFileSize(documents?.total_size || 0)}</p>
                      <p className="text-xs text-muted-foreground">Storage Used</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Folder className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="text-2xl font-bold">{documents?.categories?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Brain className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">AI</p>
                      <p className="text-xs text-muted-foreground">Analysis Ready</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search & Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10"
                      data-testid="search-documents-input"
                    />
                  </div>
                  <Button onClick={handleSearch}>Search</Button>
                  {searchResults && (
                    <Button variant="outline" onClick={() => { setSearchResults(null); setSearchQuery(""); }}>
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Categories & Documents */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Category Sidebar */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        selectedCategory === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span className="text-sm">All Documents</span>
                      <span className="ml-auto text-xs">{documents?.total_documents || 0}</span>
                    </button>
                    
                    {documents?.categories?.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.id] || Folder;
                      const catData = documents?.by_category?.[cat.id];
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{cat.name}</span>
                          <span className="ml-auto text-xs">{catData?.count || 0}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Document List */}
              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {searchResults ? `Search Results (${searchResults.length})` : `Documents (${displayDocuments.length})`}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {displayDocuments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No documents found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayDocuments.map((doc) => {
                        const Icon = CATEGORY_ICONS[doc.category] || FileText;
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className={`p-2 rounded-lg ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.name}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span>{formatFileSize(doc.file_size ?? doc.size ?? 0)}</span>
                                <span>•</span>
                                <span>{doc.created_at || doc.uploaded_at ? new Date(doc.created_at || doc.uploaded_at).toLocaleDateString() : "—"}</span>
                                <span>•</span>
                                <span>{doc.uploaded_by || "System"}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {doc.tags?.slice(0, 2).map((tag, i) => (
                                <Badge key={`item-${i}`} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleAnalyzeDocument(doc)}
                                title="AI Analysis"
                                data-testid={`analyze-doc-${doc.id}`}
                              >
                                <Sparkles className="h-4 w-4 text-purple-500" />
                              </Button>
                              <Button variant="ghost" size="sm" title="View">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Download">
                                <Download className="h-4 w-4" />
                              </Button>
                              {localStorage.getItem("app_mode") === "client" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Request a copy / message my adviser"
                                  onClick={() => {
                                    sessionStorage.setItem("client_msg_prefill", JSON.stringify({
                                      subject: `Request: copy of "${doc.name}"`,
                                      message: `Hi, could you send me a copy of "${doc.name}" (${doc.type || doc.category || "document"})? Thanks.`,
                                    }));
                                    window.location.href = "/client-portal?tab=msgs";
                                  }}
                                  data-testid={`vault-request-copy-${doc.id}`}
                                >
                                  <Mail className="h-4 w-4 text-[#1a2744]" />
                                </Button>
                              )}
                              {localStorage.getItem("app_mode") !== "client" && (
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} title="Delete" data-testid="vault-delete-btn">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab — embeds the Report Generator so reports live in the Vault */}
          <TabsContent value="reports" className="space-y-4 mt-4" data-testid="vault-reports-tab-content">
            <Suspense fallback={<div className="py-8 text-center text-muted-foreground text-sm">Loading reports…</div>}>
              <LazyReportGenerator embedded />
            </Suspense>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-4 mt-4">
            {portfolioInsights ? (
              <>
                {/* Coverage Analysis */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Document Coverage Analysis</CardTitle>
                    <CardDescription>AI-powered analysis of your document portfolio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(portfolioInsights.coverage_analysis || {}).map(([key, value]) => (
                        <div key={key} className="p-3 border rounded-lg text-center">
                          {value ? (
                            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                          )}
                          <p className="text-xs font-medium capitalize">
                            {key.replace(/_/g, " ")}
                          </p>
                          <Badge variant={value ? "secondary" : "outline"} className={value ? "bg-green-100 text-green-700" : ""}>
                            {value ? "Found" : "Missing"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Gaps Identified */}
                {portfolioInsights.gaps_identified?.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-base">Document Gaps Identified</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {portfolioInsights.gaps_identified.map((gap, i) => (
                          <div key={`item-${i}`} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                            <AlertTriangle className={`h-5 w-5 ${gap.priority === "High" ? "text-red-500" : "text-amber-500"}`} />
                            <div className="flex-1">
                              <p className="font-medium">{gap.type}</p>
                              <p className="text-sm text-muted-foreground">{gap.recommendation}</p>
                            </div>
                            <Badge variant={gap.priority === "High" ? "destructive" : "secondary"}>
                              {gap.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming Renewals */}
                {portfolioInsights.upcoming_renewals?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-base">Upcoming Renewals</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {portfolioInsights.upcoming_renewals.map((renewal, i) => (
                          <div key={`item-${i}`} className="flex items-center gap-4 p-3 border rounded-lg">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <div className="flex-1">
                              <p className="font-medium">{renewal.document}</p>
                              <p className="text-sm text-muted-foreground">
                                Expires: {new Date(renewal.expiry_date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={renewal.days_until < 30 ? "destructive" : "secondary"}>
                              {renewal.days_until} days
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Items */}
                {portfolioInsights.action_items?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recommended Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {portfolioInsights.action_items.map((action, i) => (
                          <div key={`item-${i}`} className="flex items-center gap-4 p-3 border rounded-lg">
                            <Lightbulb className="h-5 w-5 text-amber-500" />
                            <div className="flex-1">
                              <p className="font-medium">{action.action}</p>
                            </div>
                            <Badge variant={action.priority === "High" ? "destructive" : "secondary"}>
                              {action.count} items
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Upload documents to see AI-powered insights</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Add a new document to your vault. AI analysis will be available after upload.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Document Name</label>
                <Input
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="e.g., 2025 Tax Return"
                  data-testid="upload-doc-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={uploadForm.category} onValueChange={(v) => setUploadForm({ ...uploadForm, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tax">Tax Returns</SelectItem>
                    <SelectItem value="insurance">Insurance Policies</SelectItem>
                    <SelectItem value="investments">Investment Statements</SelectItem>
                    <SelectItem value="super">Superannuation</SelectItem>
                    <SelectItem value="property">Property Documents</SelectItem>
                    <SelectItem value="estate">Estate Planning</SelectItem>
                    <SelectItem value="legal">Legal Documents</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Brief description of the document..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="e.g., 2025, personal, annual"
                />
              </div>
              <Button onClick={handleUpload} className="w-full" data-testid="confirm-upload-btn">
                <Upload className="h-4 w-4 mr-2" /> Upload Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Analysis Dialog */}
        <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Document Analysis
              </DialogTitle>
              <DialogDescription>
                {selectedDocument?.name}
              </DialogDescription>
            </DialogHeader>
            
            {analyzingDoc ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-muted-foreground">Analyzing document with AI...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4 mt-4">
                {/* Document Type */}
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <p className="font-medium">Document Type</p>
                  </div>
                  <p className="text-lg font-semibold text-purple-700">{aiAnalysis.document_type}</p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {(aiAnalysis.confidence_score * 100).toFixed(0)}%
                  </p>
                </div>

                {/* Extracted Data */}
                {aiAnalysis.extracted_data && Object.keys(aiAnalysis.extracted_data).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Extracted Information</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(aiAnalysis.extracted_data).map(([key, value]) => {
                        if (typeof value === 'object' && !Array.isArray(value)) return null;
                        if (Array.isArray(value)) return null;
                        return (
                          <div key={key} className="p-2 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                            <p className="font-medium text-sm">
                              {typeof value === 'number' 
                                ? key.includes('rate') || key.includes('percentage')
                                  ? `${value}%`
                                  : `$${value.toLocaleString()}`
                                : value}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                {aiAnalysis.key_insights?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Key Insights</h4>
                    <div className="space-y-2">
                      {aiAnalysis.key_insights.map((insight, i) => (
                        <div key={`item-${i}`} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                          <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {aiAnalysis.recommendations?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <div key={`item-${i}`} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analysis unavailable</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DocumentVault;
