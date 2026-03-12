import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Rocket,
  Shield,
  Target,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  User,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowRight,
  PartyPopper,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { usePortfolio } from "@/App";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";
import ChartContainer from "@/components/ChartContainer";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0
  }).format(value);
};

// Onboarding Steps
const STEPS = [
  { id: "welcome", title: "Welcome", icon: Rocket },
  { id: "profile", title: "Your Profile", icon: User },
  { id: "risk", title: "Risk Assessment", icon: Shield },
  { id: "goals", title: "Your Goals", icon: Target },
  { id: "review", title: "Review & SOA", icon: FileText },
  { id: "complete", title: "Complete", icon: PartyPopper },
];

// Risk Questions (condensed version)
const RISK_QUESTIONS = [
  {
    id: 1,
    question: "When do you expect to need this money?",
    options: [
      { value: 1, label: "Within 2 years" },
      { value: 2, label: "2-5 years" },
      { value: 3, label: "5-10 years" },
      { value: 4, label: "10+ years" },
    ]
  },
  {
    id: 2,
    question: "How would you react if your investments dropped 20%?",
    options: [
      { value: 1, label: "Sell everything immediately" },
      { value: 2, label: "Sell some to reduce risk" },
      { value: 3, label: "Hold and wait" },
      { value: 4, label: "Buy more at lower prices" },
    ]
  },
  {
    id: 3,
    question: "What's your primary investment goal?",
    options: [
      { value: 1, label: "Protect my capital at all costs" },
      { value: 2, label: "Stable income with some growth" },
      { value: 3, label: "Balance between growth and security" },
      { value: 4, label: "Maximum growth, accept volatility" },
    ]
  },
  {
    id: 4,
    question: "How long could you maintain your lifestyle without income?",
    options: [
      { value: 1, label: "Less than 3 months" },
      { value: 2, label: "3-12 months" },
      { value: 3, label: "1-2 years" },
      { value: 4, label: "More than 2 years" },
    ]
  },
];

// Risk Profiles
const RISK_PROFILES = {
  conservative: { name: "Conservative", color: "#3B82F6", allocation: { defensive: 70, growth: 30 }, expectedReturn: "3-5%" },
  balanced: { name: "Balanced", color: "#D4A84C", allocation: { defensive: 40, growth: 60 }, expectedReturn: "5-7%" },
  growth: { name: "Growth", color: "#10B981", allocation: { defensive: 20, growth: 80 }, expectedReturn: "7-10%" },
  aggressive: { name: "Aggressive", color: "#EF4444", allocation: { defensive: 5, growth: 95 }, expectedReturn: "8-12%" },
};

const getProfile = (score) => {
  if (score <= 6) return RISK_PROFILES.conservative;
  if (score <= 10) return RISK_PROFILES.balanced;
  if (score <= 14) return RISK_PROFILES.growth;
  return RISK_PROFILES.aggressive;
};

const ClientOnboarding = () => {
  const navigate = useNavigate();
  const { familyMembers, portfolio } = usePortfolio();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    // Profile
    firstName: familyMembers[0]?.name?.split(' ')[0] || "",
    lastName: familyMembers[0]?.name?.split(' ')[1] || "",
    email: "",
    phone: "",
    age: familyMembers[0]?.age || 45,
    spouse: familyMembers[1]?.name || "",
    dependents: familyMembers.filter(m => m.relationship === "adult_child" || m.relationship === "child").length,
    occupation: "",
    
    // Risk Assessment
    riskAnswers: {},
    riskScore: 0,
    riskProfile: null,
    
    // Goals
    primaryGoal: "",
    retirementAge: 65,
    targetRetirementIncome: 80000,
    shortTermGoals: [],
    longTermGoals: [],
    
    // Financial Snapshot
    estimatedAssets: portfolio.summary?.totalAssets || 0,
    estimatedLiabilities: portfolio.summary?.totalDebt || 0,
    annualIncome: portfolio.summary?.annualIncome || 0,
  });

  const [newGoal, setNewGoal] = useState({ description: "", amount: "", timeframe: "short" });

  const updateData = (field, value) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }));
  };

  const handleRiskAnswer = (questionId, value) => {
    const newAnswers = { ...onboardingData.riskAnswers, [questionId]: value };
    const score = Object.values(newAnswers).reduce((sum, v) => sum + v, 0);
    const profile = getProfile(score);
    
    setOnboardingData(prev => ({
      ...prev,
      riskAnswers: newAnswers,
      riskScore: score,
      riskProfile: profile
    }));
  };

  const addGoal = () => {
    if (!newGoal.description || !newGoal.amount) return;
    
    const goalList = newGoal.timeframe === "short" ? "shortTermGoals" : "longTermGoals";
    setOnboardingData(prev => ({
      ...prev,
      [goalList]: [...prev[goalList], { id: Date.now(), ...newGoal }]
    }));
    setNewGoal({ description: "", amount: "", timeframe: "short" });
  };

  const removeGoal = (goalList, id) => {
    setOnboardingData(prev => ({
      ...prev,
      [goalList]: prev[goalList].filter(g => g.id !== id)
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case "welcome":
        return true;
      case "profile":
        return onboardingData.firstName && onboardingData.lastName;
      case "risk":
        return Object.keys(onboardingData.riskAnswers).length === RISK_QUESTIONS.length;
      case "goals":
        return onboardingData.primaryGoal;
      case "review":
        return true;
      default:
        return true;
    }
  };

  const completeOnboarding = () => {
    // Save to localStorage
    localStorage.setItem("wheeler_onboarding_complete", JSON.stringify({
      data: onboardingData,
      completedAt: new Date().toISOString()
    }));
    
    toast.success("Onboarding complete! Welcome to Wheeler Family Portfolio");
    nextStep();
  };

  const generateQuickSOA = () => {
    const content = `
QUICK STATEMENT OF ADVICE SUMMARY
=================================
Generated: ${new Date().toLocaleDateString('en-AU')}

CLIENT: ${onboardingData.firstName} ${onboardingData.lastName}
${onboardingData.spouse ? `Spouse: ${onboardingData.spouse}` : ''}

RISK PROFILE: ${onboardingData.riskProfile?.name || 'Not assessed'}
Expected Return: ${onboardingData.riskProfile?.expectedReturn || 'N/A'}
Allocation: ${onboardingData.riskProfile?.allocation.defensive || 0}% Defensive / ${onboardingData.riskProfile?.allocation.growth || 0}% Growth

PRIMARY GOAL: ${onboardingData.primaryGoal}
Target Retirement Age: ${onboardingData.retirementAge}
Target Retirement Income: ${formatCurrency(onboardingData.targetRetirementIncome)}

FINANCIAL SNAPSHOT:
- Estimated Assets: ${formatCurrency(onboardingData.estimatedAssets)}
- Estimated Liabilities: ${formatCurrency(onboardingData.estimatedLiabilities)}
- Net Worth: ${formatCurrency(onboardingData.estimatedAssets - onboardingData.estimatedLiabilities)}
- Annual Income: ${formatCurrency(onboardingData.annualIncome)}

SHORT-TERM GOALS:
${onboardingData.shortTermGoals.map(g => `- ${g.description}: ${formatCurrency(parseInt(g.amount))}`).join('\n') || 'None specified'}

LONG-TERM GOALS:
${onboardingData.longTermGoals.map(g => `- ${g.description}: ${formatCurrency(parseInt(g.amount))}`).join('\n') || 'None specified'}

---
This is a summary only. For a full Statement of Advice, visit the SOA Generator.
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quick_SOA_${onboardingData.firstName}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Quick SOA downloaded");
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const allocationData = onboardingData.riskProfile ? [
    { name: 'Defensive', value: onboardingData.riskProfile.allocation.defensive, color: '#3B82F6' },
    { name: 'Growth', value: onboardingData.riskProfile.allocation.growth, color: '#10B981' },
  ] : [];

  return (
    <Layout>
      <div className="space-y-6" data-testid="client-onboarding-page">
        {/* Progress Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Client Onboarding</h2>
              <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
            </div>
            <Progress value={progress} className="h-2 mb-4" />
            <div className="flex justify-between">
              {STEPS.map((step, index) => (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center ${index <= currentStep ? 'text-[#1a2744]' : 'text-muted-foreground'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    index < currentStep ? 'bg-[#10B981] text-white' :
                    index === currentStep ? 'bg-[#1a2744] text-white' :
                    'bg-muted'
                  }`}>
                    {index < currentStep ? <CheckCircle className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                  </div>
                  <span className="text-xs hidden md:block">{step.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {STEPS[currentStep].id === "welcome" && (
          <Card className="border-t-4 border-t-[#D4A84C]">
            <CardContent className="p-8 text-center">
              <Sparkles className="h-16 w-16 mx-auto text-[#D4A84C] mb-4" />
              <h1 className="text-3xl font-bold mb-4">Welcome to Your Financial Journey</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                In the next few minutes, we'll help you understand your risk profile, set financial goals, 
                and create a personalized plan. This information will be used to generate your Statement of Advice.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Shield className="h-8 w-8 mx-auto text-[#3B82F6] mb-2" />
                  <p className="text-sm font-medium">Risk Assessment</p>
                  <p className="text-xs text-muted-foreground">4 quick questions</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Target className="h-8 w-8 mx-auto text-[#10B981] mb-2" />
                  <p className="text-sm font-medium">Set Goals</p>
                  <p className="text-xs text-muted-foreground">Short & long term</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto text-[#D4A84C] mb-2" />
                  <p className="text-sm font-medium">Get Your SOA</p>
                  <p className="text-xs text-muted-foreground">Personalized advice</p>
                </div>
              </div>
              <Button onClick={nextStep} size="lg" className="bg-[#1a2744]">
                Let's Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {STEPS[currentStep].id === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Tell Us About Yourself
              </CardTitle>
              <CardDescription>Basic information to personalize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input 
                    value={onboardingData.firstName}
                    onChange={(e) => updateData("firstName", e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input 
                    value={onboardingData.lastName}
                    onChange={(e) => updateData("lastName", e.target.value)}
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={onboardingData.email}
                    onChange={(e) => updateData("email", e.target.value)}
                    placeholder="john@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    value={onboardingData.phone}
                    onChange={(e) => updateData("phone", e.target.value)}
                    placeholder="04XX XXX XXX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input 
                    type="number"
                    value={onboardingData.age}
                    onChange={(e) => updateData("age", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spouse/Partner</Label>
                  <Input 
                    value={onboardingData.spouse}
                    onChange={(e) => updateData("spouse", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dependents</Label>
                  <Input 
                    type="number"
                    min={0}
                    value={onboardingData.dependents}
                    onChange={(e) => updateData("dependents", parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Occupation</Label>
                <Input 
                  value={onboardingData.occupation}
                  onChange={(e) => updateData("occupation", e.target.value)}
                  placeholder="e.g., Business Owner, Employee, Retired"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {STEPS[currentStep].id === "risk" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Risk Assessment
                </CardTitle>
                <CardDescription>Help us understand your investment preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {RISK_QUESTIONS.map((q, index) => (
                  <div key={q.id} className="p-4 border rounded-lg">
                    <p className="font-medium mb-3">{index + 1}. {q.question}</p>
                    <RadioGroup 
                      value={onboardingData.riskAnswers[q.id]?.toString()}
                      onValueChange={(v) => handleRiskAnswer(q.id, parseInt(v))}
                      className="space-y-2"
                    >
                      {q.options.map((opt) => (
                        <div 
                          key={opt.value}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            onboardingData.riskAnswers[q.id] === opt.value 
                              ? 'border-[#1a2744] bg-[#1a2744]/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleRiskAnswer(q.id, opt.value)}
                        >
                          <RadioGroupItem value={opt.value.toString()} />
                          <Label className="flex-1 cursor-pointer text-sm">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </CardContent>
            </Card>

            {onboardingData.riskProfile && (
              <Card className="border-t-4" style={{ borderTopColor: onboardingData.riskProfile.color }}>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-bold mb-2">Your Risk Profile</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <Badge style={{ backgroundColor: onboardingData.riskProfile.color }} className="text-white text-lg px-4 py-1">
                          {onboardingData.riskProfile.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Score: {onboardingData.riskScore}/16</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Expected Return: <strong>{onboardingData.riskProfile.expectedReturn}</strong> p.a.
                      </p>
                      <div className="flex gap-4">
                        <div className="p-3 bg-[#3B82F6]/10 rounded-lg flex-1 text-center">
                          <p className="text-2xl font-bold text-[#3B82F6]">{onboardingData.riskProfile.allocation.defensive}%</p>
                          <p className="text-xs text-muted-foreground">Defensive</p>
                        </div>
                        <div className="p-3 bg-[#10B981]/10 rounded-lg flex-1 text-center">
                          <p className="text-2xl font-bold text-[#10B981]">{onboardingData.riskProfile.allocation.growth}%</p>
                          <p className="text-xs text-muted-foreground">Growth</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2 text-center">Recommended Allocation</p>
                      <ChartContainer height={150}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={allocationData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              dataKey="value"
                              label={({ name, value }) => `${value}%`}
                            >
                              {allocationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {STEPS[currentStep].id === "goals" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" /> Your Financial Goals
                </CardTitle>
                <CardDescription>What are you working towards?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Primary Financial Goal *</Label>
                  <Select value={onboardingData.primaryGoal} onValueChange={(v) => updateData("primaryGoal", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your main goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retirement">Comfortable Retirement</SelectItem>
                      <SelectItem value="wealth">Build Wealth</SelectItem>
                      <SelectItem value="income">Generate Income</SelectItem>
                      <SelectItem value="education">Children's Education</SelectItem>
                      <SelectItem value="property">Buy Property</SelectItem>
                      <SelectItem value="debt">Pay Off Debt</SelectItem>
                      <SelectItem value="business">Start/Grow Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Retirement Age</Label>
                    <Input 
                      type="number"
                      min={55}
                      max={85}
                      value={onboardingData.retirementAge}
                      onChange={(e) => updateData("retirementAge", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Retirement Income (p.a.)</Label>
                    <Input 
                      type="number"
                      value={onboardingData.targetRetirementIncome}
                      onChange={(e) => updateData("targetRetirementIncome", parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {/* Add Goals */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Add Specific Goals</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <Input 
                      placeholder="Goal description"
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      className="col-span-2"
                    />
                    <Input 
                      placeholder="Amount ($)"
                      type="number"
                      value={newGoal.amount}
                      onChange={(e) => setNewGoal({ ...newGoal, amount: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Select value={newGoal.timeframe} onValueChange={(v) => setNewGoal({ ...newGoal, timeframe: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short (1-3y)</SelectItem>
                          <SelectItem value="long">Long (5+y)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addGoal} size="icon" className="bg-[#1a2744]">+</Button>
                    </div>
                  </div>
                </div>

                {/* Goals Lists */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Short-Term Goals (1-3 years)</h4>
                    {onboardingData.shortTermGoals.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3 border rounded-lg">No short-term goals added</p>
                    ) : (
                      <div className="space-y-2">
                        {onboardingData.shortTermGoals.map((goal) => (
                          <div key={goal.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{goal.description}</p>
                              <p className="text-xs text-muted-foreground">{formatCurrency(parseInt(goal.amount))}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeGoal("shortTermGoals", goal.id)}>×</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Long-Term Goals (5+ years)</h4>
                    {onboardingData.longTermGoals.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3 border rounded-lg">No long-term goals added</p>
                    ) : (
                      <div className="space-y-2">
                        {onboardingData.longTermGoals.map((goal) => (
                          <div key={goal.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{goal.description}</p>
                              <p className="text-xs text-muted-foreground">{formatCurrency(parseInt(goal.amount))}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeGoal("longTermGoals", goal.id)}>×</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Financial Snapshot
                </CardTitle>
                <CardDescription>Estimate your current financial position</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Estimated Assets</Label>
                    <Input 
                      type="number"
                      value={onboardingData.estimatedAssets}
                      onChange={(e) => updateData("estimatedAssets", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Liabilities</Label>
                    <Input 
                      type="number"
                      value={onboardingData.estimatedLiabilities}
                      onChange={(e) => updateData("estimatedLiabilities", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Income</Label>
                    <Input 
                      type="number"
                      value={onboardingData.annualIncome}
                      onChange={(e) => updateData("annualIncome", parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="p-4 bg-[#1a2744]/5 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">Estimated Net Worth</span>
                    <span className="font-bold text-[#1a2744]">
                      {formatCurrency(onboardingData.estimatedAssets - onboardingData.estimatedLiabilities)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {STEPS[currentStep].id === "review" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Review Your Information
                </CardTitle>
                <CardDescription>Confirm your details before generating your SOA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Profile</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {onboardingData.firstName} {onboardingData.lastName}</p>
                    <p><span className="text-muted-foreground">Age:</span> {onboardingData.age}</p>
                    {onboardingData.spouse && <p><span className="text-muted-foreground">Spouse:</span> {onboardingData.spouse}</p>}
                    <p><span className="text-muted-foreground">Dependents:</span> {onboardingData.dependents}</p>
                  </div>
                </div>

                {/* Risk Profile Summary */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: `${onboardingData.riskProfile?.color}15` }}>
                  <h4 className="font-semibold mb-2">Risk Profile</h4>
                  <div className="flex items-center gap-4">
                    <Badge style={{ backgroundColor: onboardingData.riskProfile?.color }} className="text-white">
                      {onboardingData.riskProfile?.name}
                    </Badge>
                    <span className="text-sm">
                      {onboardingData.riskProfile?.allocation.defensive}% Defensive / {onboardingData.riskProfile?.allocation.growth}% Growth
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Expected: {onboardingData.riskProfile?.expectedReturn} p.a.
                    </span>
                  </div>
                </div>

                {/* Goals Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Goals</h4>
                  <p className="text-sm mb-2">
                    <span className="text-muted-foreground">Primary Goal:</span> {onboardingData.primaryGoal?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-sm mb-2">
                    <span className="text-muted-foreground">Retirement:</span> Age {onboardingData.retirementAge} with {formatCurrency(onboardingData.targetRetirementIncome)}/year
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Goals Set:</span> {onboardingData.shortTermGoals.length} short-term, {onboardingData.longTermGoals.length} long-term
                  </p>
                </div>

                {/* Financial Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Financial Snapshot</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Assets</p>
                      <p className="font-bold text-[#10B981]">{formatCurrency(onboardingData.estimatedAssets)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Liabilities</p>
                      <p className="font-bold text-red-500">{formatCurrency(onboardingData.estimatedLiabilities)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Net Worth</p>
                      <p className="font-bold text-[#1a2744]">{formatCurrency(onboardingData.estimatedAssets - onboardingData.estimatedLiabilities)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={generateQuickSOA}>
                    <Download className="h-4 w-4 mr-2" /> Download Quick SOA
                  </Button>
                  <Button className="flex-1 bg-[#1a2744]" onClick={() => navigate("/statement-of-advice")}>
                    <FileText className="h-4 w-4 mr-2" /> Open Full SOA Builder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {STEPS[currentStep].id === "complete" && (
          <Card className="border-t-4 border-t-[#10B981]">
            <CardContent className="p-8 text-center">
              <PartyPopper className="h-16 w-16 mx-auto text-[#10B981] mb-4" />
              <h1 className="text-3xl font-bold mb-4">You're All Set!</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                Your profile has been created. You can now explore the full suite of financial planning tools, 
                or talk to our AI Copilot for personalized assistance.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
                <Button className="bg-[#1a2744]" onClick={() => navigate("/copilot")}>
                  <Sparkles className="h-4 w-4 mr-2" /> Talk to Copilot
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        {STEPS[currentStep].id !== "welcome" && STEPS[currentStep].id !== "complete" && (
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            {STEPS[currentStep].id === "review" ? (
              <Button onClick={completeOnboarding} className="bg-[#10B981]">
                Complete Onboarding <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canProceed()} className="bg-[#1a2744]">
                Continue <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default ClientOnboarding;
