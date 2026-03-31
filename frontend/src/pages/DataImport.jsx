import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Upload,
  FileSpreadsheet,
  FileText,
  Database,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  RefreshCw,
  Eye,
  ArrowRight,
  FileUp,
  Table,
  Zap
} from "lucide-react";
import { usePortfolio } from "@/App";
import { toast } from "sonner";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";

const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '$0';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Supported import formats
const IMPORT_FORMATS = [
  {
    id: "csv",
    name: "CSV File",
    icon: FileText,
    description: "Comma-separated values",
    extensions: [".csv"],
    color: "#10B981"
  },
  {
    id: "excel",
    name: "Excel",
    icon: FileSpreadsheet,
    description: "Microsoft Excel (.xlsx, .xls)",
    extensions: [".xlsx", ".xls"],
    color: "#217346"
  },
  {
    id: "xero",
    name: "Xero Export",
    icon: Database,
    description: "Exported from Xero accounting",
    extensions: [".csv", ".xlsx"],
    color: "#13B5EA"
  },
  {
    id: "myob",
    name: "MYOB Export",
    icon: Database,
    description: "Exported from MYOB AccountRight",
    extensions: [".txt", ".csv"],
    color: "#6B21A8"
  }
];

// Data type templates
const DATA_TEMPLATES = {
  family_members: {
    name: "Family Members",
    description: "Import family member details including income and super",
    fields: ["name", "relationship", "age", "taxableIncome", "salaryIncome", "superBalance"],
    required: ["name", "relationship"],
    sample: [
      { name: "John Wheeler", relationship: "primary", age: 52, taxableIncome: 185000, salaryIncome: 160000, superBalance: 420000 },
      { name: "Sarah Wheeler", relationship: "spouse", age: 48, taxableIncome: 95000, salaryIncome: 95000, superBalance: 280000 }
    ]
  },
  properties: {
    name: "Properties",
    description: "Import property portfolio data",
    fields: ["name", "value", "rental_income", "mortgage_amount", "mortgage_rate", "annual_expenses", "suburb", "city"],
    required: ["name", "value"],
    sample: [
      { name: "Family Home", value: 1250000, rental_income: 0, mortgage_amount: 380000, mortgage_rate: 6.5, suburb: "Chatswood", city: "Sydney" },
      { name: "Investment Unit", value: 720000, rental_income: 32000, mortgage_amount: 432000, mortgage_rate: 6.8, suburb: "Parramatta", city: "Sydney" }
    ]
  },
  shares: {
    name: "Share Holdings",
    description: "Import share portfolio from broker export",
    fields: ["symbol", "name", "quantity", "purchasePrice", "currentPrice", "dividendYield", "frankingPercentage", "ownership"],
    required: ["symbol", "quantity", "purchasePrice"],
    sample: [
      { symbol: "CBA", name: "Commonwealth Bank", quantity: 500, purchasePrice: 95.50, currentPrice: 118.50, dividendYield: 4.2, frankingPercentage: 100, ownership: "personal" },
      { symbol: "BHP", name: "BHP Group", quantity: 1000, purchasePrice: 38.20, currentPrice: 42.80, dividendYield: 5.1, frankingPercentage: 100, ownership: "personal" }
    ]
  },
  transactions: {
    name: "Transactions",
    description: "Import transaction history for budgeting",
    fields: ["date", "description", "amount", "category", "type"],
    required: ["date", "amount", "type"],
    sample: [
      { date: "2024-01-15", description: "Salary", amount: 8500, category: "Income", type: "income" },
      { date: "2024-01-20", description: "Mortgage Payment", amount: -3200, category: "Housing", type: "expense" }
    ]
  }
};

const DataImport = () => {
  const { 
    updateFamilyMember, 
    addFamilyMember,
    addShare,
    portfolio,
    setPortfolio 
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [selectedDataType, setSelectedDataType] = useState("family_members");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [mappings, setMappings] = useState({});
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Parse CSV content
  const parseCSV = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return { headers: [], rows: [] };
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, i) => {
        let value = values[i] || '';
        // Try to parse numbers
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
          value = parseFloat(value);
        }
        row[header] = value;
      });
      return row;
    });
    
    return { headers, rows };
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setErrors([]);
    
    try {
      const content = await file.text();
      const { headers, rows } = parseCSV(content);
      
      if (rows.length === 0) {
        setErrors(["No data found in file"]);
        return;
      }

      setParsedData({ headers, rows, fileName: file.name });
      
      // Auto-map fields if headers match
      const template = DATA_TEMPLATES[selectedDataType];
      const autoMappings = {};
      headers.forEach(header => {
        const normalizedHeader = header.toLowerCase().replace(/[_\s]/g, '');
        const matchingField = template.fields.find(f => 
          f.toLowerCase().replace(/[_\s]/g, '') === normalizedHeader ||
          header.toLowerCase().includes(f.toLowerCase())
        );
        if (matchingField) {
          autoMappings[matchingField] = header;
        }
      });
      setMappings(autoMappings);
      
      toast.success(`Loaded ${rows.length} rows from ${file.name}`);
      setActiveTab("map");
    } catch (error) {
      console.error("Error parsing file:", error);
      setErrors(["Failed to parse file. Please check the format."]);
      toast.error("Failed to parse file");
    }
  };

  // Handle data import
  const handleImport = async () => {
    if (!parsedData) return;
    
    setImporting(true);
    setImportProgress(0);
    const newErrors = [];
    const template = DATA_TEMPLATES[selectedDataType];
    
    try {
      const total = parsedData.rows.length;
      let imported = 0;

      for (const row of parsedData.rows) {
        // Map fields
        const mappedRow = {};
        template.fields.forEach(field => {
          const sourceField = mappings[field];
          if (sourceField && row[sourceField] !== undefined) {
            mappedRow[field] = row[sourceField];
          }
        });

        // Validate required fields
        const missingRequired = template.required.filter(f => !mappedRow[f]);
        if (missingRequired.length > 0) {
          newErrors.push(`Row ${imported + 1}: Missing required fields: ${missingRequired.join(', ')}`);
          imported++;
          setImportProgress((imported / total) * 100);
          continue;
        }

        // Import based on data type
        try {
          if (selectedDataType === "family_members") {
            addFamilyMember({
              id: Date.now() + imported,
              name: mappedRow.name,
              relationship: mappedRow.relationship || 'other',
              age: mappedRow.age || 30,
              taxableIncome: mappedRow.taxableIncome || 0,
              salaryIncome: mappedRow.salaryIncome || mappedRow.taxableIncome || 0,
              superBalance: mappedRow.superBalance || 0,
              isTrustBeneficiary: false
            });
          } else if (selectedDataType === "shares") {
            addShare({
              id: Date.now() + imported,
              symbol: mappedRow.symbol,
              name: mappedRow.name || mappedRow.symbol,
              quantity: mappedRow.quantity || 0,
              purchasePrice: mappedRow.purchasePrice || 0,
              currentPrice: mappedRow.currentPrice || mappedRow.purchasePrice || 0,
              dividendYield: mappedRow.dividendYield || 0,
              frankingPercentage: mappedRow.frankingPercentage || 100,
              ownership: mappedRow.ownership || 'personal',
              ownerId: 1,
              purchaseDate: new Date().toISOString().split('T')[0],
              sector: 'Other'
            });
          } else if (selectedDataType === "properties") {
            // Update portfolio with new property
            const newProperty = {
              name: mappedRow.name,
              value: mappedRow.value || 0,
              rental_income: mappedRow.rental_income || 0,
              mortgage_amount: mappedRow.mortgage_amount || 0,
              mortgage_rate: mappedRow.mortgage_rate || 6.5,
              annual_expenses: mappedRow.annual_expenses || 0,
              suburb: mappedRow.suburb || '',
              city: mappedRow.city || 'Sydney',
              property_type: 'house'
            };
            setPortfolio(prev => ({
              ...prev,
              investments: {
                ...prev.investments,
                properties: [...(prev.investments?.properties || []), newProperty]
              }
            }));
          }
        } catch (rowError) {
          newErrors.push(`Row ${imported + 1}: ${rowError.message}`);
        }

        imported++;
        setImportProgress((imported / total) * 100);
        
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setErrors(newErrors);
      
      if (newErrors.length === 0) {
        toast.success(`Successfully imported ${total} records`);
      } else {
        toast.warning(`Imported with ${newErrors.length} errors`);
      }
      
      setActiveTab("complete");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Import failed");
      setErrors([error.message]);
    } finally {
      setImporting(false);
    }
  };

  // Download sample template
  const downloadTemplate = (dataType) => {
    const template = DATA_TEMPLATES[dataType];
    const headers = template.fields.join(',');
    const sampleRows = template.sample.map(row => 
      template.fields.map(f => row[f] ?? '').join(',')
    ).join('\n');
    
    const csv = `${headers}\n${sampleRows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Template downloaded");
  };

  // Reset import
  const resetImport = () => {
    setUploadedFile(null);
    setParsedData(null);
    setMappings({});
    setErrors([]);
    setImportProgress(0);
    setActiveTab("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="data-import-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Import Data
            </h1>
            <p className="text-muted-foreground mt-1">
              Import data from CSV, Excel, Xero, or MYOB exports
            </p>
          </div>
          {parsedData && (
            <Button variant="outline" onClick={resetImport}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          )}
        </div>

        {/* Import Wizard */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="">Import Wizard</CardTitle>
                <CardDescription>Follow the steps to import your data</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {["upload", "map", "preview", "complete"].map((step, i) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      activeTab === step ? 'bg-[#1a2744] text-white' :
                      ["upload", "map", "preview", "complete"].indexOf(activeTab) > i ? 'bg-[#10B981] text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {["upload", "map", "preview", "complete"].indexOf(activeTab) > i ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : i + 1}
                    </div>
                    {i < 3 && <div className={`w-8 h-0.5 ${
                      ["upload", "map", "preview", "complete"].indexOf(activeTab) > i ? 'bg-[#10B981]' : 'bg-muted'
                    }`} />}
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="hidden">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="map">Map Fields</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="complete">Complete</TabsTrigger>
              </TabsList>

              {/* Step 1: Upload */}
              <TabsContent value="upload" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Data Type Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">What data are you importing?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(DATA_TEMPLATES).map(([key, template]) => (
                        <div
                          key={key}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedDataType === key 
                              ? 'border-[#1a2744] bg-[#1a2744]/5' 
                              : 'border-border hover:border-[#1a2744]/50'
                          }`}
                          onClick={() => setSelectedDataType(key)}
                        >
                          <p className="font-semibold text-sm">{template.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadTemplate(selectedDataType)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Upload your file</Label>
                    
                    {/* Format Selection */}
                    <div className="grid grid-cols-2 gap-2">
                      {IMPORT_FORMATS.map(format => (
                        <div
                          key={format.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedFormat === format.id 
                              ? 'border-[#1a2744] bg-[#1a2744]/5' 
                              : 'border-border hover:border-[#1a2744]/50'
                          }`}
                          onClick={() => setSelectedFormat(format.id)}
                        >
                          <div className="flex items-center gap-2">
                            <format.icon className="h-4 w-4" style={{ color: format.color }} />
                            <span className="text-sm font-medium">{format.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{format.extensions.join(', ')}</p>
                        </div>
                      ))}
                    </div>

                    {/* Drop Zone */}
                    <div 
                      className="border-2 border-dashed rounded-lg p-8 text-center hover:border-[#1a2744]/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="font-medium">Drop your file here or click to browse</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supports CSV, Excel (.xlsx, .xls), and text files
                      </p>
                    </div>

                    {uploadedFile && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#10B981]/10 text-[#10B981]">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{uploadedFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Import from Accounting Software Info */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <Database className="h-4 w-4" />
                      Importing from Accounting Software
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-[#13B5EA]">From Xero:</p>
                        <ol className="list-decimal list-inside text-muted-foreground space-y-1 mt-1">
                          <li>Go to Reports → Account Transactions</li>
                          <li>Select date range and accounts</li>
                          <li>Click Export → Excel/CSV</li>
                          <li>Upload the exported file here</li>
                        </ol>
                      </div>
                      <div>
                        <p className="font-medium text-[#6B21A8]">From MYOB:</p>
                        <ol className="list-decimal list-inside text-muted-foreground space-y-1 mt-1">
                          <li>Go to Reports → Transaction Journal</li>
                          <li>Set filters and date range</li>
                          <li>Click Send To → Tab-Delimited File</li>
                          <li>Upload the exported file here</li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {errors.length > 0 && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Errors</span>
                    </div>
                    <ul className="text-sm text-destructive space-y-1">
                      {errors.map((error, i) => (
                        <li key={`item-${i}`}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              {/* Step 2: Map Fields */}
              <TabsContent value="map" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Map Your Columns</h3>
                    <p className="text-sm text-muted-foreground">
                      Match your file columns to the required fields
                    </p>
                  </div>
                  <Badge variant="outline">
                    {parsedData?.rows.length || 0} rows found
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DATA_TEMPLATES[selectedDataType].fields.map(field => {
                    const isRequired = DATA_TEMPLATES[selectedDataType].required.includes(field);
                    return (
                      <div key={field} className="space-y-2">
                        <Label className="flex items-center gap-2">
                          {field}
                          {isRequired && <Badge variant="destructive" className="text-[10px]">Required</Badge>}
                        </Label>
                        <Select
                          value={mappings[field] || ""}
                          onValueChange={(value) => setMappings({ ...mappings, [field]: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Not mapped --</SelectItem>
                            {parsedData?.headers.map(header => (
                              <SelectItem key={header} value={header}>{header}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab("upload")}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("preview")}
                    className="bg-[#1a2744]"
                  >
                    Preview Data
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 3: Preview */}
              <TabsContent value="preview" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Preview Import</h3>
                    <p className="text-sm text-muted-foreground">
                      Review your data before importing
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Showing first 5 rows</span>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        {DATA_TEMPLATES[selectedDataType].fields.map(field => (
                          <th key={field} className="text-left p-3 font-medium">
                            {field}
                            {mappings[field] && (
                              <span className="block text-xs text-muted-foreground font-normal">
                                ← {mappings[field]}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData?.rows.slice(0, 5).map((row, i) => (
                        <tr key={`item-${i}`} className="border-t">
                          {DATA_TEMPLATES[selectedDataType].fields.map(field => {
                            const sourceField = mappings[field];
                            const value = sourceField ? row[sourceField] : '-';
                            return (
                              <td key={field} className="p-3">
                                {typeof value === 'number' && field.toLowerCase().includes('value') 
                                  ? formatCurrency(value) 
                                  : String(value || '-')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {importing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Importing...</span>
                      <span>{Math.round(importProgress)}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab("map")}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleImport}
                    className="bg-[#1a2744]"
                    disabled={importing}
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Import {parsedData?.rows.length || 0} Records
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* Step 4: Complete */}
              <TabsContent value="complete" className="space-y-6">
                <div className="text-center py-8">
                  {errors.length === 0 ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-[#10B981]" />
                      </div>
                      <h3 className="text-xl font-semibold">Import Complete!</h3>
                      <p className="text-muted-foreground mt-2">
                        Successfully imported {parsedData?.rows.length || 0} records
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="h-8 w-8 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-semibold">Import Complete with Warnings</h3>
                      <p className="text-muted-foreground mt-2">
                        {parsedData?.rows.length - errors.length} records imported, {errors.length} skipped
                      </p>
                    </>
                  )}
                </div>

                {errors.length > 0 && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-amber-800 mb-2">Import Warnings</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <ul className="text-sm text-amber-700 space-y-1">
                          {errors.slice(0, 10).map((error, i) => (
                            <li key={`item-${i}`}>{error}</li>
                          ))}
                          {errors.length > 10 && (
                            <li className="text-amber-600">...and {errors.length - 10} more</li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-center gap-4 pt-4">
                  <Button variant="outline" onClick={resetImport}>
                    Import More Data
                  </Button>
                  <Button className="bg-[#1a2744]" onClick={() => window.location.href = '/dashboard'}>
                    Go to Dashboard
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default DataImport;
