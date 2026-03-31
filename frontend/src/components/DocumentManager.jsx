import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Calendar,
  Clock,
  Search,
  Filter,
  Plus,
  MoreVertical,
  FileCheck,
  FilePlus,
  FolderOpen,
  ChevronDown,
  Printer,
  Share2,
  Archive,
  Star,
  StarOff
} from "lucide-react";
import { toast } from "sonner";
import { usePortfolio } from "@/App";
import {
  generatePortfolioSummaryPDF,
  generateSOAPDF,
  generateTaxSummaryPDF,
  downloadPDF
} from "@/utils/pdfReportGenerator";

// Document types
const DOCUMENT_TYPES = {
  portfolio_summary: { label: 'Portfolio Summary', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  soa: { label: 'Statement of Advice', icon: FileCheck, color: 'bg-green-100 text-green-600' },
  tax_summary: { label: 'Tax Summary', icon: FileText, color: 'bg-amber-100 text-amber-600' },
  annual_review: { label: 'Annual Review', icon: Calendar, color: 'bg-purple-100 text-purple-600' },
  other: { label: 'Other', icon: FolderOpen, color: 'bg-gray-100 text-gray-600' }
};

// Mock generated documents
const INITIAL_DOCUMENTS = [
  {
    id: 'doc_1',
    name: 'Portfolio Summary - Q4 2024',
    type: 'portfolio_summary',
    generatedAt: '2024-12-15T10:30:00',
    size: '245 KB',
    status: 'final',
    starred: true
  },
  {
    id: 'doc_2',
    name: 'Statement of Advice 2024',
    type: 'soa',
    generatedAt: '2024-11-20T14:15:00',
    size: '1.2 MB',
    status: 'final',
    starred: true
  },
  {
    id: 'doc_3',
    name: 'Tax Summary FY2023-24',
    type: 'tax_summary',
    generatedAt: '2024-07-01T09:00:00',
    size: '380 KB',
    status: 'final',
    starred: false
  },
  {
    id: 'doc_4',
    name: 'Annual Review Report 2024',
    type: 'annual_review',
    generatedAt: '2024-11-15T16:45:00',
    size: '520 KB',
    status: 'draft',
    starred: false
  }
];

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const DocumentManager = ({ clientId = null, compact = false }) => {
  const { sharePortfolio, propertyPortfolio } = usePortfolio();
  const [documents, setDocuments] = useState(() => {
    const stored = localStorage.getItem('wheeler_documents');
    return stored ? JSON.parse(stored) : INITIAL_DOCUMENTS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Persist documents
  useEffect(() => {
    localStorage.setItem('wheeler_documents', JSON.stringify(documents));
  }, [documents]);

  // Filter documents - memoized to avoid recomputation
  const filteredDocuments = useMemo(() => documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  }), [documents, searchQuery, filterType]);

  // Generate report
  const handleGenerateReport = async (type, customName = null) => {
    setGenerating(true);
    
    try {
      let doc;
      let filename;
      const timestamp = new Date().toISOString().split('T')[0];
      
      const reportData = {
        clientName: 'Wheeler Family',
        shares: sharePortfolio,
        properties: propertyPortfolio,
        netWorth: 1978000,
        totalAssets: 2920000,
        totalDebt: 942000,
        riskProfile: 'Balanced',
        lastReview: new Date(),
        adviser: { name: 'David Chen', title: 'Senior Financial Adviser', afsl: '123456' }
      };

      switch (type) {
        case 'portfolio_summary':
          doc = generatePortfolioSummaryPDF(reportData);
          filename = `Portfolio_Summary_${timestamp}.pdf`;
          break;
        case 'soa':
          doc = generateSOAPDF(reportData);
          filename = `Statement_of_Advice_${timestamp}.pdf`;
          break;
        case 'tax_summary':
          doc = generateTaxSummaryPDF(reportData);
          filename = `Tax_Summary_${timestamp}.pdf`;
          break;
        default:
          throw new Error('Unknown report type');
      }

      // Download the PDF
      downloadPDF(doc, filename);

      // Add to documents list
      const newDoc = {
        id: `doc_${Date.now()}`,
        name: customName || filename.replace('.pdf', '').replace(/_/g, ' '),
        type,
        generatedAt: new Date().toISOString(),
        size: `${Math.floor(Math.random() * 500 + 200)} KB`,
        status: 'final',
        starred: false
      };
      
      setDocuments(prev => [newDoc, ...prev]);
      toast.success(`${DOCUMENT_TYPES[type].label} generated successfully`);
      setShowGenerateDialog(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  // Download existing document (regenerate)
  const handleDownload = (doc) => {
    handleGenerateReport(doc.type, doc.name);
  };

  // Toggle star
  const toggleStar = (docId) => {
    setDocuments(prev => prev.map(d => 
      d.id === docId ? { ...d, starred: !d.starred } : d
    ));
  };

  // Delete document
  const handleDelete = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    toast.success('Document removed');
  };

  // Archive document
  const handleArchive = (docId) => {
    setDocuments(prev => prev.map(d => 
      d.id === docId ? { ...d, status: 'archived' } : d
    ));
    toast.success('Document archived');
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#D4A84C]" />
              Recent Documents
            </CardTitle>
            <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Generate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Report</DialogTitle>
                  <DialogDescription>Choose a report type to generate</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 py-4">
                  {Object.entries(DOCUMENT_TYPES).filter(([k]) => k !== 'other' && k !== 'annual_review').map(([key, { label, icon: Icon, color }]) => (
                    <Button
                      key={key}
                      variant="outline"
                      className="justify-start h-auto py-3"
                      onClick={() => handleGenerateReport(key)}
                      disabled={generating}
                    >
                      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mr-3`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">Generate new PDF report</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documents.slice(0, 3).map(doc => {
              const { icon: Icon, color } = DOCUMENT_TYPES[doc.type];
              return (
                <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded ${color} flex items-center justify-center`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[180px]">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(doc.generatedAt)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Document Center</h2>
          <p className="text-sm text-muted-foreground">Generate and manage your financial reports</p>
        </div>
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#1a2744]" data-testid="generate-report-btn">
              <FilePlus className="h-4 w-4 mr-2" /> Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>Select the type of report you want to generate</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3 py-4">
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => handleGenerateReport('portfolio_summary')}
                disabled={generating}
                data-testid="generate-portfolio-btn"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Portfolio Summary</p>
                  <p className="text-sm text-muted-foreground">Single page overview of your investments</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => handleGenerateReport('soa')}
                disabled={generating}
                data-testid="generate-soa-btn"
              >
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mr-4">
                  <FileCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Statement of Advice</p>
                  <p className="text-sm text-muted-foreground">Full SOA document with recommendations</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => handleGenerateReport('tax_summary')}
                disabled={generating}
                data-testid="generate-tax-btn"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mr-4">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Tax Summary Report</p>
                  <p className="text-sm text-muted-foreground">Income, deductions, and CGT summary</p>
                </div>
              </Button>
            </div>
            {generating && (
              <div className="text-center py-2 text-sm text-muted-foreground">
                Generating report...
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              {filterType === 'all' ? 'All Types' : DOCUMENT_TYPES[filterType]?.label}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType('all')}>All Types</DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (
              <DropdownMenuItem key={key} onClick={() => setFilterType(key)}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Documents List */}
      <Card>
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No documents found</p>
              <p className="text-sm">Generate a report to get started</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredDocuments.map(doc => {
                const { icon: Icon, color, label } = DOCUMENT_TYPES[doc.type];
                return (
                  <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{doc.name}</p>
                          {doc.starred && <Star className="h-4 w-4 text-[#D4A84C] fill-[#D4A84C]" />}
                          {doc.status === 'draft' && <Badge variant="outline">Draft</Badge>}
                          {doc.status === 'archived' && <Badge variant="secondary">Archived</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{label}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(doc.generatedAt)}
                          </span>
                          <span>•</span>
                          <span>{doc.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStar(doc.id)}>
                            {doc.starred ? (
                              <><StarOff className="h-4 w-4 mr-2" /> Remove Star</>
                            ) : (
                              <><Star className="h-4 w-4 mr-2" /> Add Star</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(doc.id)}>
                            <Archive className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentManager;
