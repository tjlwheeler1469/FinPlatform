import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Printer,
  Calendar,
  DollarSign,
  Building2,
  TrendingUp,
  PieChart
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '$0';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ReportGenerator = () => {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingScenarios, setFetchingScenarios] = useState(false);

  const fetchScenarios = async () => {
    setFetchingScenarios(true);
    try {
      const response = await axios.get(`${API}/scenarios`, { withCredentials: true });
      setScenarios(response.data);
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      toast.error("Failed to load scenarios");
    } finally {
      setFetchingScenarios(false);
    }
  };

  useState(() => {
    fetchScenarios();
  }, []);

  const generateReport = async (scenario) => {
    setLoading(true);
    setSelectedScenario(scenario);
    try {
      const response = await axios.post(`${API}/analyze/full-scenario/report`, {
        name: scenario.name,
        entity_type: scenario.entity_type,
        taxable_income: scenario.taxable_income || 0,
        investments: scenario.investments || {},
        expenses: scenario.expenses || {},
        simulation_years: scenario.simulation_years || 10
      });
      setReportData(response.data);
      toast.success("Report generated");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  const downloadReport = () => {
    if (!reportData) return;
    
    const reportText = generateReportText(reportData);
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.report_title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const generateReportText = (data) => {
    let text = `${data.report_title}\n`;
    text += `${'='.repeat(60)}\n`;
    text += `Generated: ${formatDate(data.generated_at)}\n\n`;

    data.sections.forEach(section => {
      text += `\n${section.title}\n`;
      text += `${'-'.repeat(40)}\n`;
      
      if (Array.isArray(section.data)) {
        section.data.forEach((item, index) => {
          text += `\n[${index + 1}] ${item.property_name || `Item ${index + 1}`}\n`;
          Object.entries(item).forEach(([key, value]) => {
            if (typeof value === 'number') {
              text += `  ${key}: ${formatCurrency(value)}\n`;
            } else if (typeof value === 'boolean') {
              text += `  ${key}: ${value ? 'Yes' : 'No'}\n`;
            } else if (value !== null && value !== undefined) {
              text += `  ${key}: ${value}\n`;
            }
          });
        });
      } else if (typeof section.data === 'object' && section.data !== null) {
        Object.entries(section.data).forEach(([key, value]) => {
          if (typeof value === 'number') {
            text += `${key}: ${formatCurrency(value)}\n`;
          } else if (typeof value === 'object' && value !== null) {
            text += `${key}:\n`;
            Object.entries(value).forEach(([k, v]) => {
              if (typeof v === 'number') {
                text += `  ${k}: ${formatCurrency(v)}\n`;
              } else {
                text += `  ${k}: ${v}\n`;
              }
            });
          } else if (value !== null && value !== undefined) {
            text += `${key}: ${value}\n`;
          }
        });
      }
    });

    text += `\n\n${'-'.repeat(60)}\n`;
    text += `DISCLAIMER\n`;
    text += data.disclaimer;

    return text;
  };

  return (
    <Layout>
      <div className="space-y-8" data-testid="report-generator-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              Report Generator
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate comprehensive PDF reports for your investment scenarios
            </p>
          </div>
          {reportData && (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={printReport}
                data-testid="print-btn"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button 
                onClick={downloadReport}
                className="bg-[#0F392B] hover:bg-[#0F392B]/90"
                data-testid="download-btn"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario Selection */}
          <Card className="lg:col-span-1" data-testid="scenario-selection">
            <CardHeader>
              <CardTitle className="font-['Manrope']">Select Scenario</CardTitle>
              <CardDescription>Choose a scenario to generate report</CardDescription>
            </CardHeader>
            <CardContent>
              {fetchingScenarios ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : scenarios.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No scenarios found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a scenario first to generate reports
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.scenario_id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedScenario?.scenario_id === scenario.scenario_id
                          ? 'border-[#0F392B] bg-[#0F392B]/5'
                          : 'border-border hover:border-[#0F392B]/50'
                      }`}
                      onClick={() => generateReport(scenario)}
                      data-testid={`scenario-${scenario.scenario_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          scenario.entity_type === 'company' 
                            ? 'bg-[#D4AF37]/10' 
                            : 'bg-[#0F392B]/10'
                        }`}>
                          {scenario.entity_type === 'company' 
                            ? <Building2 className="h-4 w-4 text-[#D4AF37]" />
                            : <DollarSign className="h-4 w-4 text-[#0F392B]" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-sm">{scenario.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {scenario.entity_type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Preview */}
          <Card className="lg:col-span-2 print:col-span-3" data-testid="report-preview">
            <CardHeader>
              <CardTitle className="font-['Manrope']">Report Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F392B] mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Generating report...</p>
                  </div>
                </div>
              ) : reportData ? (
                <div className="space-y-6 print:space-y-4" id="report-content">
                  {/* Report Header */}
                  <div className="p-6 rounded-lg bg-[#0F392B] text-white print:bg-gray-100 print:text-black">
                    <h2 className="text-2xl font-bold font-['Manrope']">{reportData.report_title}</h2>
                    <div className="flex items-center gap-2 mt-2 text-white/80 print:text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Generated: {formatDate(reportData.generated_at)}</span>
                    </div>
                  </div>

                  {/* Report Sections */}
                  {reportData.sections.map((section, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border">
                      <h3 className="text-lg font-semibold font-['Manrope'] mb-4 flex items-center gap-2">
                        {section.title === 'Executive Summary' && <PieChart className="h-5 w-5 text-[#0F392B]" />}
                        {section.title === 'Income Breakdown' && <DollarSign className="h-5 w-5 text-[#10B981]" />}
                        {section.title === 'Tax Analysis' && <FileText className="h-5 w-5 text-[#D4AF37]" />}
                        {section.title === 'Property Portfolio' && <Building2 className="h-5 w-5 text-[#3B82F6]" />}
                        {section.title === 'Investment Projections' && <TrendingUp className="h-5 w-5 text-[#0F392B]" />}
                        {section.title}
                      </h3>

                      {Array.isArray(section.data) ? (
                        section.data.length > 0 ? (
                          <div className="space-y-3">
                            {section.data.map((item, i) => (
                              <div key={i} className="p-3 rounded bg-muted/50">
                                <p className="font-medium">{item.property_name || `Item ${i + 1}`}</p>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                  {Object.entries(item)
                                    .filter(([k]) => k !== 'property_name')
                                    .slice(0, 6)
                                    .map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-muted-foreground capitalize">
                                          {key.replace(/_/g, ' ')}:
                                        </span>
                                        <span className="font-medium">
                                          {typeof value === 'number' 
                                            ? formatCurrency(value) 
                                            : typeof value === 'boolean'
                                              ? (value ? 'Yes' : 'No')
                                              : value
                                          }
                                        </span>
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No data available</p>
                        )
                      ) : typeof section.data === 'object' && section.data !== null ? (
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(section.data)
                            .filter(([_, v]) => v !== null && v !== undefined)
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground capitalize text-sm">
                                  {key.replace(/_/g, ' ')}:
                                </span>
                                <span className="font-semibold text-sm">
                                  {typeof value === 'number' 
                                    ? (key.includes('rate') 
                                        ? `${value.toFixed(1)}%` 
                                        : formatCurrency(value))
                                    : typeof value === 'boolean'
                                      ? (value ? 'Yes' : 'No')
                                      : JSON.stringify(value)
                                  }
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No data available</p>
                      )}
                    </div>
                  ))}

                  {/* Disclaimer */}
                  <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <p className="font-semibold mb-2">Disclaimer</p>
                    <p>{reportData.disclaimer}</p>
                  </div>
                </div>
              ) : (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a scenario to generate report</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content, #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default ReportGenerator;
