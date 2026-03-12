import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Briefcase,
  Database,
  File,
  X
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const DataImportExport = () => {
  const [activeTab, setActiveTab] = useState("import");
  const [importType, setImportType] = useState("client");
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Download template
  const downloadTemplate = async (format) => {
    try {
      const response = await fetch(`${API_URL}/api/import/template/${importType}?format=${format}`);
      
      if (format === "json") {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.template, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${importType}_template.json`;
        a.click();
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${importType}_template.${format}`;
        a.click();
      }
      
      toast.success(`Template downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validExtensions = [".json", ".csv", ".xlsx", ".xls"];
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
      
      if (!validExtensions.includes(ext)) {
        toast.error("Invalid file type. Please use JSON, CSV, or Excel files.");
        return;
      }
      
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  // Upload file
  const uploadFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const endpoint = importType === "client" ? "/api/import/clients" : "/api/import/advisers";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        setUploadResult({
          success: true,
          ...result
        });
        toast.success(`Successfully imported ${result.imported} records`);
      } else {
        setUploadResult({
          success: false,
          error: result.detail || "Import failed"
        });
        toast.error(result.detail || "Import failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadResult({
        success: false,
        error: error.message
      });
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  // Export data
  const exportData = async (type) => {
    setIsExporting(true);

    try {
      const endpoint = type === "client" ? "/api/export/clients" : "/api/export/advisers";
      const response = await fetch(`${API_URL}${endpoint}?format=${exportFormat}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Export failed");
      }

      if (exportFormat === "json") {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}s_export.json`;
        a.click();
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}s_export.${exportFormat}`;
        a.click();
      }

      toast.success(`${type === "client" ? "Client" : "Adviser"} data exported as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error(error.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  // Get file icon
  const getFileIcon = (filename) => {
    if (!filename) return <File className="h-8 w-8 text-muted-foreground" />;
    const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
    if (ext === ".json") return <FileJson className="h-8 w-8 text-blue-500" />;
    if (ext === ".csv") return <FileText className="h-8 w-8 text-green-500" />;
    return <FileSpreadsheet className="h-8 w-8 text-emerald-500" />;
  };

  return (
    <div className="space-y-6" data-testid="data-import-export">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-[#D4AF37]" />
            Data Import / Export
          </h2>
          <p className="text-sm text-muted-foreground">
            Import client and adviser data from CSV, JSON, or Excel files
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import" data-testid="tab-import">
            <Upload className="h-4 w-4 mr-2" /> Import Data
          </TabsTrigger>
          <TabsTrigger value="export" data-testid="tab-export">
            <Download className="h-4 w-4 mr-2" /> Export Data
          </TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          {/* Data Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Data Type</CardTitle>
              <CardDescription>Choose what type of data you want to import</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    importType === "client" ? "border-[#0F392B] bg-[#0F392B]/5" : "border-muted hover:border-muted-foreground"
                  }`}
                  onClick={() => setImportType("client")}
                  data-testid="import-type-client"
                >
                  <div className="flex items-center gap-3">
                    <Users className={`h-6 w-6 ${importType === "client" ? "text-[#0F392B]" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-semibold">Client Data</p>
                      <p className="text-sm text-muted-foreground">Personal info, assets, liabilities, goals</p>
                    </div>
                  </div>
                </div>
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    importType === "adviser" ? "border-[#0F392B] bg-[#0F392B]/5" : "border-muted hover:border-muted-foreground"
                  }`}
                  onClick={() => setImportType("adviser")}
                  data-testid="import-type-adviser"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className={`h-6 w-6 ${importType === "adviser" ? "text-[#0F392B]" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-semibold">Adviser Data</p>
                      <p className="text-sm text-muted-foreground">Practice info, credentials, AFSL details</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 1: Download Template</CardTitle>
              <CardDescription>Get a template file to fill with your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => downloadTemplate("csv")} data-testid="download-csv-template">
                  <FileText className="h-4 w-4 mr-2" /> CSV Template
                </Button>
                <Button variant="outline" onClick={() => downloadTemplate("xlsx")} data-testid="download-xlsx-template">
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel Template
                </Button>
                <Button variant="outline" onClick={() => downloadTemplate("json")} data-testid="download-json-template">
                  <FileJson className="h-4 w-4 mr-2" /> JSON Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upload File */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 2: Upload Your File</CardTitle>
              <CardDescription>Upload your filled template file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  selectedFile ? "border-[#0F392B] bg-[#0F392B]/5" : "border-muted hover:border-muted-foreground"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="file-input"
                />
                
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-4">
                    {getFileIcon(selectedFile.name)}
                    <div className="text-left">
                      <p className="font-semibold">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setUploadResult(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">Click to select a file</p>
                    <p className="text-sm text-muted-foreground">
                      Supports CSV, JSON, and Excel files
                    </p>
                  </>
                )}
              </div>

              <Button
                onClick={uploadFile}
                disabled={!selectedFile || isUploading}
                className="w-full bg-[#0F392B]"
                data-testid="upload-btn"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Importing..." : "Import Data"}
              </Button>

              {/* Upload Result */}
              {uploadResult && (
                <Alert className={uploadResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {uploadResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <AlertTitle className={uploadResult.success ? "text-green-800" : "text-red-800"}>
                    {uploadResult.success ? "Import Successful" : "Import Failed"}
                  </AlertTitle>
                  <AlertDescription className={uploadResult.success ? "text-green-700" : "text-red-700"}>
                    {uploadResult.success ? (
                      <>
                        Imported {uploadResult.imported} of {uploadResult.total} records
                        {uploadResult.errors?.length > 0 && (
                          <span className="block mt-1">
                            {uploadResult.errors.length} errors occurred
                          </span>
                        )}
                      </>
                    ) : (
                      uploadResult.error
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Format</CardTitle>
              <CardDescription>Choose the format for your exported data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                {["xlsx", "csv", "json"].map((format) => (
                  <div
                    key={format}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors flex-1 text-center ${
                      exportFormat === format ? "border-[#0F392B] bg-[#0F392B]/5" : "border-muted hover:border-muted-foreground"
                    }`}
                    onClick={() => setExportFormat(format)}
                  >
                    {format === "xlsx" && <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-emerald-500" />}
                    {format === "csv" && <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />}
                    {format === "json" && <FileJson className="h-8 w-8 mx-auto mb-2 text-blue-500" />}
                    <p className="font-semibold">{format.toUpperCase()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#D4AF37]" />
                  Export Client Data
                </CardTitle>
                <CardDescription>Export all client fact-find data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => exportData("client")}
                  disabled={isExporting}
                  className="w-full bg-[#0F392B]"
                  data-testid="export-clients-btn"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Clients ({exportFormat.toUpperCase()})
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[#D4AF37]" />
                  Export Adviser Data
                </CardTitle>
                <CardDescription>Export all adviser information</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => exportData("adviser")}
                  disabled={isExporting}
                  className="w-full bg-[#0F392B]"
                  data-testid="export-advisers-btn"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Advisers ({exportFormat.toUpperCase()})
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataImportExport;
