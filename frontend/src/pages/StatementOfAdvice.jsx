import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  FileText,
  Download,
  Printer,
  Save,
  CheckCircle,
  AlertTriangle,
  User,
  Target,
  Shield,
  TrendingUp,
  PieChart,
  Calendar,
  DollarSign,
  FileCheck,
  Send,
  Clock,
  Edit,
  Eye,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { usePortfolio } from "@/App";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0
  }).format(value);
};

// SOA Template sections
const SOA_SECTIONS = [
  { id: "client", label: "Client Details", icon: User },
  { id: "objectives", label: "Goals & Objectives", icon: Target },
  { id: "risk", label: "Risk Profile", icon: Shield },
  { id: "current", label: "Current Situation", icon: PieChart },
  { id: "recommendations", label: "Recommendations", icon: TrendingUp },
  { id: "projections", label: "Projections", icon: Calendar },
  { id: "fees", label: "Fees & Disclosure", icon: DollarSign },
  { id: "authority", label: "Authority to Proceed", icon: FileCheck },
];

// Risk Profile options
const RISK_PROFILES = [
  { value: "conservative", label: "Conservative", allocation: "70% Defensive / 30% Growth" },
  { value: "moderate-conservative", label: "Moderately Conservative", allocation: "50% Defensive / 50% Growth" },
  { value: "balanced", label: "Balanced", allocation: "30% Defensive / 70% Growth" },
  { value: "growth", label: "Growth", allocation: "15% Defensive / 85% Growth" },
  { value: "high-growth", label: "High Growth", allocation: "5% Defensive / 95% Growth" },
];

const StatementOfAdvice = () => {
  const { portfolio, familyMembers, trust, company } = usePortfolio();
  const [activeTab, setActiveTab] = useState("create");
  const [activeSection, setActiveSection] = useState("client");
  const [savedSOAs, setSavedSOAs] = useState(() => {
    const saved = localStorage.getItem("wheeler_soas");
    return saved ? JSON.parse(saved) : [];
  });

  // SOA Form State
  const [soaData, setSOAData] = useState({
    // Client Details
    clientName: familyMembers[0]?.name || "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    clientDOB: "",
    spouse: familyMembers[1]?.name || "",
    dependents: familyMembers.filter(m => m.relationship === "adult_child" || m.relationship === "child").length,
    
    // Goals & Objectives
    primaryGoal: "wealth-accumulation",
    retirementAge: 65,
    incomeGoal: 80000,
    goals: [
      { id: 1, description: "Build retirement savings", priority: "high", timeframe: "long-term" },
      { id: 2, description: "Tax optimization", priority: "high", timeframe: "short-term" },
    ],
    
    // Risk Profile
    riskProfile: "balanced",
    riskScore: 25,
    investmentTimeframe: "10+ years",
    capacityForLoss: "moderate",
    
    // Current Situation
    totalAssets: portfolio.summary?.totalAssets || 2920000,
    totalLiabilities: portfolio.summary?.totalDebt || 942000,
    netWorth: portfolio.summary?.netWorth || 1978000,
    annualIncome: portfolio.summary?.annualIncome || 253400,
    insuranceCover: true,
    estatePlanningComplete: false,
    
    // Recommendations
    recommendations: [
      { id: 1, type: "superannuation", title: "Maximize salary sacrifice", description: "Increase concessional contributions to $27,500 p.a.", impact: "+$1,850/year tax savings", priority: "high" },
      { id: 2, type: "investment", title: "Diversify to international shares", description: "Allocate 20% to international ETFs for diversification", impact: "Reduced concentration risk", priority: "medium" },
      { id: 3, type: "insurance", title: "Review life insurance", description: "Ensure adequate cover for family protection", impact: "Risk mitigation", priority: "medium" },
    ],
    
    // Fees
    initialFee: 2200,
    ongoingFee: 0.5,
    implementationFee: 550,
    
    // Authority
    adviserName: "",
    adviserARN: "",
    licenseeName: "",
    licenseNumber: "",
    dateIssued: new Date().toISOString().split('T')[0],
    acknowledged: false,
  });

  const [generating, setGenerating] = useState(false);

  const updateSOA = (field, value) => {
    setSOAData({ ...soaData, [field]: value });
  };

  const addGoal = () => {
    const newGoal = {
      id: Date.now(),
      description: "",
      priority: "medium",
      timeframe: "medium-term"
    };
    setSOAData({ ...soaData, goals: [...soaData.goals, newGoal] });
  };

  const updateGoal = (id, field, value) => {
    setSOAData({
      ...soaData,
      goals: soaData.goals.map(g => g.id === id ? { ...g, [field]: value } : g)
    });
  };

  const removeGoal = (id) => {
    setSOAData({
      ...soaData,
      goals: soaData.goals.filter(g => g.id !== id)
    });
  };

  const addRecommendation = () => {
    const newRec = {
      id: Date.now(),
      type: "general",
      title: "",
      description: "",
      impact: "",
      priority: "medium"
    };
    setSOAData({ ...soaData, recommendations: [...soaData.recommendations, newRec] });
  };

  const updateRecommendation = (id, field, value) => {
    setSOAData({
      ...soaData,
      recommendations: soaData.recommendations.map(r => r.id === id ? { ...r, [field]: value } : r)
    });
  };

  const removeRecommendation = (id) => {
    setSOAData({
      ...soaData,
      recommendations: soaData.recommendations.filter(r => r.id !== id)
    });
  };

  const calculateProgress = () => {
    const fields = [
      soaData.clientName, soaData.primaryGoal, soaData.riskProfile,
      soaData.totalAssets > 0, soaData.recommendations.length > 0,
      soaData.adviserName, soaData.licenseeName
    ];
    return (fields.filter(Boolean).length / fields.length) * 100;
  };

  const generateSOA = () => {
    setGenerating(true);
    
    setTimeout(() => {
      const soaContent = `
STATEMENT OF ADVICE
===================
Date: ${new Date().toLocaleDateString('en-AU', { dateStyle: 'full' })}
SOA Reference: SOA-${Date.now()}

IMPORTANT NOTICE
----------------
This Statement of Advice (SOA) contains personal financial advice. Before acting on this advice, 
please consider the appropriateness of it having regard to your objectives, financial situation 
and needs. Read and consider any relevant Product Disclosure Statements (PDS) before making a decision.

═══════════════════════════════════════════════════════════════════════════════════════════════════

1. CLIENT DETAILS
-----------------
Client Name: ${soaData.clientName}
${soaData.spouse ? `Spouse/Partner: ${soaData.spouse}` : ''}
${soaData.dependents > 0 ? `Dependents: ${soaData.dependents}` : ''}
Date of Birth: ${soaData.clientDOB || 'Not provided'}
Contact: ${soaData.clientEmail || 'Not provided'} | ${soaData.clientPhone || 'Not provided'}
Address: ${soaData.clientAddress || 'Not provided'}

═══════════════════════════════════════════════════════════════════════════════════════════════════

2. YOUR GOALS & OBJECTIVES
--------------------------
Primary Goal: ${soaData.primaryGoal.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
Target Retirement Age: ${soaData.retirementAge}
Desired Retirement Income: ${formatCurrency(soaData.incomeGoal)} p.a.

Specific Goals:
${soaData.goals.map((g, i) => `  ${i + 1}. ${g.description} [${g.priority.toUpperCase()} priority, ${g.timeframe}]`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════════════════════════

3. RISK PROFILE
---------------
Risk Profile: ${RISK_PROFILES.find(r => r.value === soaData.riskProfile)?.label || soaData.riskProfile}
Recommended Allocation: ${RISK_PROFILES.find(r => r.value === soaData.riskProfile)?.allocation || ''}
Investment Timeframe: ${soaData.investmentTimeframe}
Capacity for Loss: ${soaData.capacityForLoss}
Risk Score: ${soaData.riskScore}/40

This risk profile was determined based on your responses to our risk profiler questionnaire.
Your profile suggests you ${soaData.riskProfile === 'conservative' ? 'prefer security and stability over higher returns' : 
  soaData.riskProfile === 'high-growth' ? 'are comfortable with significant volatility for maximum growth potential' :
  'seek a balance between growth and capital preservation'}.

═══════════════════════════════════════════════════════════════════════════════════════════════════

4. CURRENT FINANCIAL SITUATION
------------------------------
                              SUMMARY
                              -------
Total Assets:                 ${formatCurrency(soaData.totalAssets)}
Total Liabilities:            ${formatCurrency(soaData.totalLiabilities)}
                              ─────────────────
Net Worth:                    ${formatCurrency(soaData.netWorth)}

Annual Income:                ${formatCurrency(soaData.annualIncome)}
Insurance in Place:           ${soaData.insuranceCover ? 'Yes' : 'No - Review Recommended'}
Estate Planning Complete:     ${soaData.estatePlanningComplete ? 'Yes' : 'No - Review Recommended'}

═══════════════════════════════════════════════════════════════════════════════════════════════════

5. ADVICE & RECOMMENDATIONS
---------------------------
Based on our analysis of your situation, goals, and risk profile, we recommend the following:

${soaData.recommendations.map((r, i) => `
RECOMMENDATION ${i + 1}: ${r.title.toUpperCase()}
Type: ${r.type}
Priority: ${r.priority.toUpperCase()}

Description:
${r.description}

Expected Impact:
${r.impact}
`).join('\n─────────────────────────────────────────────────────────────────────────────────\n')}

═══════════════════════════════════════════════════════════════════════════════════════════════════

6. PROJECTED OUTCOMES
---------------------
Based on the recommended strategies and assumed market returns:

• 10-Year Projected Net Worth: ${formatCurrency(soaData.netWorth * 1.8)}
• Projected Retirement Balance: ${formatCurrency(soaData.netWorth * 2.5)}
• Estimated Tax Savings (Annual): ${formatCurrency(5000)}

Note: Projections are estimates based on assumed growth rates and are not guaranteed.
Actual results may vary significantly from projections.

═══════════════════════════════════════════════════════════════════════════════════════════════════

7. FEES & REMUNERATION
----------------------
                              FEE SCHEDULE
                              ------------
Initial Advice Fee:           ${formatCurrency(soaData.initialFee)}
Implementation Fee:           ${formatCurrency(soaData.implementationFee)}
Ongoing Service Fee:          ${soaData.ongoingFee}% of funds under advice p.a.

Total Initial Cost:           ${formatCurrency(soaData.initialFee + soaData.implementationFee)}

Fee Method: Fees are deducted from your investment portfolio or invoiced directly.

We may receive commissions from product providers. These will be disclosed separately.

═══════════════════════════════════════════════════════════════════════════════════════════════════

8. AUTHORITY TO PROCEED
-----------------------
Adviser Details:
Name: ${soaData.adviserName || '[Adviser Name]'}
Authorised Representative Number: ${soaData.adviserARN || '[ARN]'}

Licensee: ${soaData.licenseeName || '[Licensee Name]'}
AFSL Number: ${soaData.licenseNumber || '[AFSL Number]'}

Date Issued: ${soaData.dateIssued}

───────────────────────────────────────────────────────────────────────────────

CLIENT ACKNOWLEDGEMENT

I/We have read and understood the advice contained in this SOA. I/We wish to proceed 
with the recommendations as outlined.

Client Signature: _________________________  Date: ________________

Client Name: ${soaData.clientName}

${soaData.spouse ? `
Spouse Signature: _________________________  Date: ________________

Spouse Name: ${soaData.spouse}` : ''}

═══════════════════════════════════════════════════════════════════════════════════════════════════

GENERAL ADVICE WARNING

This document contains general advice which has been prepared without taking into account 
your objectives, financial situation or needs. Before acting on this advice, you should 
consider the appropriateness of it having regard to your own objectives, financial situation 
and needs. You should obtain and consider the relevant Product Disclosure Statement (PDS) 
before you make any decision about a product.

Past performance is not a reliable indicator of future performance.

This advice is provided by [${soaData.licenseeName || 'Licensee Name'}] (AFSL ${soaData.licenseNumber || 'XXXXXX'}).
      `.trim();

      // Save SOA
      const newSOA = {
        id: Date.now(),
        clientName: soaData.clientName,
        dateCreated: new Date().toISOString(),
        status: "draft",
        content: soaContent
      };
      
      const updatedSOAs = [newSOA, ...savedSOAs];
      setSavedSOAs(updatedSOAs);
      localStorage.setItem("wheeler_soas", JSON.stringify(updatedSOAs));
      
      // Download
      const blob = new Blob([soaContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SOA_${soaData.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      setGenerating(false);
      toast.success("Statement of Advice generated and saved");
    }, 1500);
  };

  const completionProgress = calculateProgress();

  return (
    <Layout>
      <div className="space-y-6" data-testid="soa-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              Statement of Advice
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate compliant SOA documents for your clients
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <FileText className="h-3 w-3" />
              {savedSOAs.length} Saved
            </Badge>
            <Button 
              onClick={generateSOA} 
              className="bg-[#0F392B]"
              disabled={generating || completionProgress < 70 || !soaData.acknowledged}
              title={!soaData.acknowledged ? "Please acknowledge compliance requirements" : ""}
            >
              {generating ? (
                <><Clock className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Generate SOA</>
              )}
            </Button>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Document Completion</span>
              <span className="text-sm text-muted-foreground">{Math.round(completionProgress)}%</span>
            </div>
            <Progress value={completionProgress} className="h-2" />
            <div className="flex items-center justify-between mt-3">
              {completionProgress < 70 && (
                <p className="text-xs text-muted-foreground">
                  Complete at least 70% of required fields to generate the SOA
                </p>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <Checkbox 
                  id="soa-acknowledge"
                  checked={soaData.acknowledged || false}
                  onCheckedChange={(checked) => updateSOA("acknowledged", checked)}
                />
                <label htmlFor="soa-acknowledge" className="text-xs text-muted-foreground cursor-pointer">
                  I confirm this advice meets ASIC RG 175 and best interests duty requirements
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Notice */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Regulatory Compliance</p>
                <p className="text-sm text-amber-700 mt-1">
                  This SOA generator creates documents aligned with ASIC Regulatory Guide 175 (Licensing: Financial product advisers—Conduct and disclosure). 
                  Ensure all advice meets the best interests duty under s961B of the Corporations Act 2001.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="create">
              <Edit className="h-4 w-4 mr-1" /> Create SOA
            </TabsTrigger>
            <TabsTrigger value="saved">
              <FileText className="h-4 w-4 mr-1" /> Saved ({savedSOAs.length})
            </TabsTrigger>
          </TabsList>

          {/* Create SOA Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Section Navigation */}
              <div className="col-span-12 lg:col-span-3">
                <Card className="sticky top-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Sections</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {SOA_SECTIONS.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeSection === section.id
                              ? "bg-[#0F392B] text-white"
                              : "hover:bg-muted"
                          }`}
                        >
                          <section.icon className="h-4 w-4" />
                          {section.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section Content */}
              <div className="col-span-12 lg:col-span-9">
                {/* Client Details */}
                {activeSection === "client" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" /> Client Details
                      </CardTitle>
                      <CardDescription>Basic client information for the SOA</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Client Name *</Label>
                          <Input 
                            value={soaData.clientName}
                            onChange={(e) => updateSOA("clientName", e.target.value)}
                            placeholder="Full legal name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Spouse/Partner</Label>
                          <Input 
                            value={soaData.spouse}
                            onChange={(e) => updateSOA("spouse", e.target.value)}
                            placeholder="If applicable"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input 
                            type="email"
                            value={soaData.clientEmail}
                            onChange={(e) => updateSOA("clientEmail", e.target.value)}
                            placeholder="client@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input 
                            value={soaData.clientPhone}
                            onChange={(e) => updateSOA("clientPhone", e.target.value)}
                            placeholder="04XX XXX XXX"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date of Birth</Label>
                          <Input 
                            type="date"
                            value={soaData.clientDOB}
                            onChange={(e) => updateSOA("clientDOB", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Number of Dependents</Label>
                          <Input 
                            type="number"
                            min={0}
                            value={soaData.dependents}
                            onChange={(e) => updateSOA("dependents", parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Textarea 
                          value={soaData.clientAddress}
                          onChange={(e) => updateSOA("clientAddress", e.target.value)}
                          placeholder="Full residential address"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Goals & Objectives */}
                {activeSection === "objectives" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" /> Goals & Objectives
                      </CardTitle>
                      <CardDescription>Client's financial goals and objectives</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Primary Goal *</Label>
                          <Select value={soaData.primaryGoal} onValueChange={(v) => updateSOA("primaryGoal", v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="wealth-accumulation">Wealth Accumulation</SelectItem>
                              <SelectItem value="retirement-planning">Retirement Planning</SelectItem>
                              <SelectItem value="debt-reduction">Debt Reduction</SelectItem>
                              <SelectItem value="income-generation">Income Generation</SelectItem>
                              <SelectItem value="estate-planning">Estate Planning</SelectItem>
                              <SelectItem value="tax-optimization">Tax Optimization</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Target Retirement Age</Label>
                          <Input 
                            type="number"
                            min={55}
                            max={85}
                            value={soaData.retirementAge}
                            onChange={(e) => updateSOA("retirementAge", parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Desired Retirement Income (p.a.)</Label>
                        <Input 
                          type="number"
                          value={soaData.incomeGoal}
                          onChange={(e) => updateSOA("incomeGoal", parseInt(e.target.value))}
                        />
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <Label>Specific Goals</Label>
                          <Button variant="outline" size="sm" onClick={addGoal}>
                            <Plus className="h-4 w-4 mr-1" /> Add Goal
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {soaData.goals.map((goal, index) => (
                            <div key={goal.id} className="p-3 border rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">Goal {index + 1}</Badge>
                                <Button variant="ghost" size="sm" onClick={() => removeGoal(goal.id)}>
                                  Remove
                                </Button>
                              </div>
                              <Input 
                                placeholder="Goal description"
                                value={goal.description}
                                onChange={(e) => updateGoal(goal.id, "description", e.target.value)}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Select value={goal.priority} onValueChange={(v) => updateGoal(goal.id, "priority", v)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="high">High Priority</SelectItem>
                                    <SelectItem value="medium">Medium Priority</SelectItem>
                                    <SelectItem value="low">Low Priority</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select value={goal.timeframe} onValueChange={(v) => updateGoal(goal.id, "timeframe", v)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Timeframe" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="short-term">Short Term (1-2 years)</SelectItem>
                                    <SelectItem value="medium-term">Medium Term (3-5 years)</SelectItem>
                                    <SelectItem value="long-term">Long Term (5+ years)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Risk Profile */}
                {activeSection === "risk" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" /> Risk Profile
                      </CardTitle>
                      <CardDescription>Client's risk tolerance and investment preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Risk Profile *</Label>
                        <Select value={soaData.riskProfile} onValueChange={(v) => updateSOA("riskProfile", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RISK_PROFILES.map((profile) => (
                              <SelectItem key={profile.value} value={profile.value}>
                                <div>
                                  <span className="font-medium">{profile.label}</span>
                                  <span className="text-xs text-muted-foreground ml-2">({profile.allocation})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Risk Score (from Risk Profiler)</Label>
                          <Input 
                            type="number"
                            min={8}
                            max={40}
                            value={soaData.riskScore}
                            onChange={(e) => updateSOA("riskScore", parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Investment Timeframe</Label>
                          <Select value={soaData.investmentTimeframe} onValueChange={(v) => updateSOA("investmentTimeframe", v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0-2 years">0-2 years</SelectItem>
                              <SelectItem value="2-5 years">2-5 years</SelectItem>
                              <SelectItem value="5-10 years">5-10 years</SelectItem>
                              <SelectItem value="10+ years">10+ years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Capacity for Loss</Label>
                        <Select value={soaData.capacityForLoss} onValueChange={(v) => updateSOA("capacityForLoss", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - Cannot afford any significant loss</SelectItem>
                            <SelectItem value="moderate">Moderate - Can absorb some loss</SelectItem>
                            <SelectItem value="high">High - Can withstand significant volatility</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm">
                          <strong>Selected Profile:</strong> {RISK_PROFILES.find(r => r.value === soaData.riskProfile)?.label}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Recommended Allocation: {RISK_PROFILES.find(r => r.value === soaData.riskProfile)?.allocation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Current Situation */}
                {activeSection === "current" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" /> Current Financial Situation
                      </CardTitle>
                      <CardDescription>Summary of client's current financial position</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Total Assets</Label>
                          <Input 
                            type="number"
                            value={soaData.totalAssets}
                            onChange={(e) => updateSOA("totalAssets", parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Total Liabilities</Label>
                          <Input 
                            type="number"
                            value={soaData.totalLiabilities}
                            onChange={(e) => updateSOA("totalLiabilities", parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-medium">Net Worth</span>
                          <span className="font-bold text-[#0F392B]">
                            {formatCurrency(soaData.totalAssets - soaData.totalLiabilities)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Annual Income</Label>
                        <Input 
                          type="number"
                          value={soaData.annualIncome}
                          onChange={(e) => updateSOA("annualIncome", parseInt(e.target.value))}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={soaData.insuranceCover}
                            onCheckedChange={(checked) => updateSOA("insuranceCover", checked)}
                          />
                          <Label className="text-sm">Insurance in Place</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={soaData.estatePlanningComplete}
                            onCheckedChange={(checked) => updateSOA("estatePlanningComplete", checked)}
                          />
                          <Label className="text-sm">Estate Planning Complete</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {activeSection === "recommendations" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" /> Recommendations
                      </CardTitle>
                      <CardDescription>Advice recommendations for the client</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={addRecommendation}>
                          <Plus className="h-4 w-4 mr-1" /> Add Recommendation
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {soaData.recommendations.map((rec, index) => (
                          <div key={rec.id} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">Recommendation {index + 1}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => removeRecommendation(rec.id)}>
                                Remove
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Select value={rec.type} onValueChange={(v) => updateRecommendation(rec.id, "type", v)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="superannuation">Superannuation</SelectItem>
                                  <SelectItem value="investment">Investment</SelectItem>
                                  <SelectItem value="insurance">Insurance</SelectItem>
                                  <SelectItem value="debt">Debt Management</SelectItem>
                                  <SelectItem value="tax">Tax Planning</SelectItem>
                                  <SelectItem value="estate">Estate Planning</SelectItem>
                                  <SelectItem value="general">General</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select value={rec.priority} onValueChange={(v) => updateRecommendation(rec.id, "priority", v)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">High Priority</SelectItem>
                                  <SelectItem value="medium">Medium Priority</SelectItem>
                                  <SelectItem value="low">Low Priority</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Input 
                              placeholder="Recommendation title"
                              value={rec.title}
                              onChange={(e) => updateRecommendation(rec.id, "title", e.target.value)}
                            />
                            <Textarea 
                              placeholder="Detailed description..."
                              value={rec.description}
                              onChange={(e) => updateRecommendation(rec.id, "description", e.target.value)}
                              rows={2}
                            />
                            <Input 
                              placeholder="Expected impact (e.g., +$1,850/year tax savings)"
                              value={rec.impact}
                              onChange={(e) => updateRecommendation(rec.id, "impact", e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Projections */}
                {activeSection === "projections" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" /> Projections
                      </CardTitle>
                      <CardDescription>Future financial projections based on recommendations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-4">
                          Projections are automatically calculated based on the recommendations and current situation.
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-white rounded border">
                            <p className="text-xs text-muted-foreground">10-Year Net Worth</p>
                            <p className="text-lg font-bold text-[#0F392B]">
                              {formatCurrency((soaData.totalAssets - soaData.totalLiabilities) * 1.8)}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded border">
                            <p className="text-xs text-muted-foreground">Retirement Balance</p>
                            <p className="text-lg font-bold text-[#0F392B]">
                              {formatCurrency((soaData.totalAssets - soaData.totalLiabilities) * 2.5)}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded border">
                            <p className="text-xs text-muted-foreground">Annual Tax Savings</p>
                            <p className="text-lg font-bold text-[#10B981]">
                              {formatCurrency(5000)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700">
                          Note: Projections are estimates based on assumed growth rates and are not guaranteed.
                          Actual results may vary significantly.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fees */}
                {activeSection === "fees" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" /> Fees & Disclosure
                      </CardTitle>
                      <CardDescription>Fee structure for the advice</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Initial Advice Fee ($)</Label>
                          <Input 
                            type="number"
                            value={soaData.initialFee}
                            onChange={(e) => updateSOA("initialFee", parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Implementation Fee ($)</Label>
                          <Input 
                            type="number"
                            value={soaData.implementationFee}
                            onChange={(e) => updateSOA("implementationFee", parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ongoing Fee (% p.a.)</Label>
                          <Input 
                            type="number"
                            step="0.1"
                            value={soaData.ongoingFee}
                            onChange={(e) => updateSOA("ongoingFee", parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Total Initial Cost</span>
                          <span className="font-bold">{formatCurrency(soaData.initialFee + soaData.implementationFee)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Authority */}
                {activeSection === "authority" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5" /> Authority to Proceed
                      </CardTitle>
                      <CardDescription>Adviser and licensee details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Adviser Name *</Label>
                          <Input 
                            value={soaData.adviserName}
                            onChange={(e) => updateSOA("adviserName", e.target.value)}
                            placeholder="Financial adviser name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Authorised Rep Number (ARN)</Label>
                          <Input 
                            value={soaData.adviserARN}
                            onChange={(e) => updateSOA("adviserARN", e.target.value)}
                            placeholder="ARN"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Licensee Name *</Label>
                          <Input 
                            value={soaData.licenseeName}
                            onChange={(e) => updateSOA("licenseeName", e.target.value)}
                            placeholder="AFSL holder name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>AFSL Number</Label>
                          <Input 
                            value={soaData.licenseNumber}
                            onChange={(e) => updateSOA("licenseNumber", e.target.value)}
                            placeholder="AFSL number"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Date Issued</Label>
                        <Input 
                          type="date"
                          value={soaData.dateIssued}
                          onChange={(e) => updateSOA("dateIssued", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Saved SOAs Tab */}
          <TabsContent value="saved" className="space-y-4">
            {savedSOAs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No saved Statements of Advice</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first SOA using the form above
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {savedSOAs.map((soa) => (
                  <Card key={soa.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#0F392B]/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-[#0F392B]" />
                          </div>
                          <div>
                            <p className="font-semibold">{soa.clientName}</p>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(soa.dateCreated).toLocaleDateString('en-AU')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={soa.status === "final" ? "default" : "secondary"}>
                            {soa.status}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const blob = new Blob([soa.content], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `SOA_${soa.clientName.replace(/\s+/g, '_')}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default StatementOfAdvice;

// Export SOA Modal for use in other pages
export const SOAModal = ({ open, onClose, clientData }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" data-testid="soa-modal">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Quick SOA Generator
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
          <CardDescription>Generate a quick Statement of Advice summary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Client Details from Profile:</p>
            <p className="font-medium">{clientData?.name || "Client Name"}</p>
            <p className="text-sm">Net Worth: {formatCurrency(clientData?.netWorth || 0)}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-[#0F392B]"
              onClick={() => {
                window.location.href = "/statement-of-advice";
              }}
            >
              Open Full SOA Builder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
