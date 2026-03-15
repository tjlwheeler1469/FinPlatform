import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Filter
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

const DocumentVault = () => {
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
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
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting:", error);
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
              Securely store and manage all your financial documents
            </p>
          </div>
          <Button>
            <Upload className="h-4 w-4 mr-2" /> Upload Document
          </Button>
        </div>

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
                <Clock className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{documents?.recent_documents?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Recent Uploads</p>
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
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" /> Filter
                </Button>
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
                            <span>{formatFileSize(doc.size)}</span>
                            <span>•</span>
                            <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{doc.uploaded_by}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.tags?.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Documents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recently Uploaded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {documents?.recent_documents?.map((doc) => {
                const Icon = CATEGORY_ICONS[doc.category] || FileText;
                return (
                  <div key={doc.id} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className={`p-2 rounded-lg ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other} w-fit mb-2`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DocumentVault;
