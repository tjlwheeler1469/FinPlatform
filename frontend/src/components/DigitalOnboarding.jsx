import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle,
  User,
  Briefcase,
  Home,
  DollarSign,
  Shield,
  Target,
  FileText,
  Heart,
  Users,
  Building2,
  Car,
  GraduationCap,
  PiggyBank,
  TrendingUp,
  AlertCircle,
  Clock,
  Loader2,
  Database
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// Fact-Find Sections
const FACT_FIND_SECTIONS = [
  { id: "personal", title: "Personal Details", icon: User, progress: 0 },
  { id: "employment", title: "Employment & Income", icon: Briefcase, progress: 0 },
  { id: "assets", title: "Assets", icon: Building2, progress: 0 },
  { id: "liabilities", title: "Liabilities", icon: DollarSign, progress: 0 },
  { id: "insurance", title: "Insurance & Estate", icon: Shield, progress: 0 },
  { id: "goals", title: "Goals & Objectives", icon: Target, progress: 0 },
  { id: "risk", title: "Risk Profile", icon: TrendingUp, progress: 0 },
];

// Risk Assessment Questions (expanded)
const RISK_QUESTIONS = [
  {
    id: "investment_timeframe",
    question: "What is your investment timeframe?",
    options: [
      { value: 1, label: "Less than 2 years" },
      { value: 2, label: "2-5 years" },
      { value: 3, label: "5-10 years" },
      { value: 4, label: "10-20 years" },
      { value: 5, label: "20+ years" }
    ]
  },
  {
    id: "investment_knowledge",
    question: "How would you describe your investment knowledge?",
    options: [
      { value: 1, label: "Very limited - I'm new to investing" },
      { value: 2, label: "Basic - I understand savings accounts and term deposits" },
      { value: 3, label: "Moderate - I understand shares and managed funds" },
      { value: 4, label: "Good - I actively manage my investments" },
      { value: 5, label: "Expert - I have professional investment experience" }
    ]
  },
  {
    id: "loss_tolerance",
    question: "If your investments dropped 20% in value, what would you do?",
    options: [
      { value: 1, label: "Sell everything immediately to prevent further losses" },
      { value: 2, label: "Sell a significant portion to reduce exposure" },
      { value: 3, label: "Hold and wait for recovery" },
      { value: 4, label: "Buy more at the lower prices" },
      { value: 5, label: "Significantly increase my investment" }
    ]
  },
  {
    id: "return_preference",
    question: "Which statement best describes your investment preference?",
    options: [
      { value: 1, label: "Protect my capital, accept minimal returns" },
      { value: 2, label: "Mostly stable with occasional small fluctuations" },
      { value: 3, label: "Balance of growth and stability" },
      { value: 4, label: "Higher returns, accept significant fluctuations" },
      { value: 5, label: "Maximum growth, accept high volatility" }
    ]
  },
  {
    id: "income_needs",
    question: "How important is regular income from your investments?",
    options: [
      { value: 1, label: "Essential - I depend on investment income" },
      { value: 2, label: "Very important - supplements my other income" },
      { value: 3, label: "Somewhat important - nice to have" },
      { value: 4, label: "Not important - focus on growth" },
      { value: 5, label: "Not needed - reinvest all returns" }
    ]
  },
  {
    id: "financial_stability",
    question: "How would you describe your financial stability?",
    options: [
      { value: 1, label: "Unstable - often worried about bills" },
      { value: 2, label: "Tight - little room for unexpected expenses" },
      { value: 3, label: "Comfortable - can handle most situations" },
      { value: 4, label: "Secure - significant emergency funds" },
      { value: 5, label: "Very secure - substantial assets and income" }
    ]
  },
  {
    id: "risk_experience",
    question: "Have you experienced significant investment losses before?",
    options: [
      { value: 1, label: "Yes, and it was very stressful" },
      { value: 2, label: "Yes, but I managed" },
      { value: 3, label: "Minor losses only" },
      { value: 4, label: "No significant losses" },
      { value: 5, label: "Yes, and I used it as a buying opportunity" }
    ]
  },
  {
    id: "volatility_comfort",
    question: "How comfortable are you with short-term volatility for long-term gains?",
    options: [
      { value: 1, label: "Very uncomfortable - I check investments daily" },
      { value: 2, label: "Somewhat uncomfortable" },
      { value: 3, label: "Neutral" },
      { value: 4, label: "Comfortable - I focus on long-term" },
      { value: 5, label: "Very comfortable - volatility doesn't concern me" }
    ]
  }
];

// Risk Profiles
const RISK_PROFILES = {
  conservative: { name: "Conservative", range: [8, 16], color: "bg-green-100 text-green-800" },
  moderately_conservative: { name: "Moderately Conservative", range: [17, 22], color: "bg-blue-100 text-blue-800" },
  balanced: { name: "Balanced", range: [23, 28], color: "bg-purple-100 text-purple-800" },
  growth: { name: "Growth", range: [29, 34], color: "bg-amber-100 text-amber-800" },
  high_growth: { name: "High Growth", range: [35, 40], color: "bg-red-100 text-red-800" }
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0
  }).format(value || 0);
};

const DigitalOnboarding = ({ clientId, onComplete }) => {
  const [activeSection, setActiveSection] = useState("personal");
  const [factFindData, setFactFindData] = useState(() => {
    const saved = localStorage.getItem(`wheeler_factfind_${clientId || 'new'}`);
    return saved ? JSON.parse(saved) : {
      personal: {
        title: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        preferred_name: "",
        date_of_birth: "",
        gender: "",
        marital_status: "",
        citizenship: "australian",
        tax_file_number: "",
        address_street: "",
        address_suburb: "",
        address_state: "",
        address_postcode: "",
        phone_mobile: "",
        phone_home: "",
        email: "",
        spouse: {
          first_name: "",
          last_name: "",
          date_of_birth: "",
          occupation: "",
          employer: "",
          income: 0
        },
        dependants: []
      },
      employment: {
        employment_status: "",
        occupation: "",
        employer_name: "",
        employer_address: "",
        years_employed: 0,
        employment_type: "",
        salary_gross: 0,
        salary_net: 0,
        bonus_commission: 0,
        other_income: 0,
        rental_income: 0,
        dividend_income: 0,
        centrelink: 0,
        spouse_income: 0,
        anticipated_changes: ""
      },
      assets: {
        cash_bank: 0,
        term_deposits: 0,
        shares_managed_funds: 0,
        superannuation: 0,
        investment_property: 0,
        home_residence: 0,
        motor_vehicles: 0,
        household_contents: 0,
        other_assets: 0,
        business_interests: 0,
        property_details: [],
        share_details: [],
        super_details: {
          fund_name: "",
          member_number: "",
          balance: 0,
          insurance_in_super: false,
          investment_option: ""
        }
      },
      liabilities: {
        home_loan: 0,
        investment_loan: 0,
        car_loan: 0,
        personal_loan: 0,
        credit_cards: 0,
        hecs_help: 0,
        other_debts: 0,
        loan_details: []
      },
      insurance: {
        life_insurance: 0,
        tpd_insurance: 0,
        income_protection: 0,
        trauma_insurance: 0,
        health_insurance: "",
        has_will: false,
        will_date: "",
        has_power_of_attorney: false,
        has_enduring_guardian: false,
        estate_beneficiaries: []
      },
      goals: {
        retirement_age: 65,
        retirement_income: 0,
        short_term_goals: [],
        long_term_goals: [],
        concerns: [],
        priorities: []
      },
      risk: {
        answers: {},
        score: 0,
        profile: ""
      }
    };
  });
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(`wheeler_factfind_${clientId || 'new'}`, JSON.stringify(factFindData));
  }, [factFindData, clientId]);

  // Update field
  const updateField = (section, field, value) => {
    setFactFindData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Update nested field
  const updateNestedField = (section, parent, field, value) => {
    setFactFindData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parent]: {
          ...prev[section][parent],
          [field]: value
        }
      }
    }));
  };

  // Calculate risk score
  const calculateRiskScore = () => {
    const answers = factFindData.risk.answers;
    const total = Object.values(answers).reduce((sum, val) => sum + (val || 0), 0);
    return total;
  };

  // Get risk profile from score
  const getRiskProfile = (score) => {
    for (const [key, profile] of Object.entries(RISK_PROFILES)) {
      if (score >= profile.range[0] && score <= profile.range[1]) {
        return { key, ...profile };
      }
    }
    return { key: "balanced", ...RISK_PROFILES.balanced };
  };

  // Update risk answer
  const updateRiskAnswer = (questionId, value) => {
    const newAnswers = { ...factFindData.risk.answers, [questionId]: value };
    const score = Object.values(newAnswers).reduce((sum, val) => sum + (val || 0), 0);
    const profile = getRiskProfile(score);
    
    setFactFindData(prev => ({
      ...prev,
      risk: {
        answers: newAnswers,
        score: score,
        profile: profile.key
      }
    }));
  };

  // Calculate section progress
  const calculateSectionProgress = (section) => {
    const data = factFindData[section];
    if (!data) return 0;
    
    const requiredFields = {
      personal: ['first_name', 'last_name', 'date_of_birth', 'email', 'phone_mobile', 'address_street'],
      employment: ['employment_status', 'salary_gross'],
      assets: ['superannuation'],
      liabilities: [],
      insurance: ['has_will'],
      goals: ['retirement_age'],
      risk: Object.keys(RISK_QUESTIONS).length > 0 ? ['answers'] : []
    };
    
    const fields = requiredFields[section] || [];
    if (fields.length === 0) return 100;
    
    let filled = 0;
    fields.forEach(field => {
      if (section === 'risk') {
        filled += Object.keys(data.answers || {}).length >= RISK_QUESTIONS.length ? 1 : 0;
      } else if (data[field] && data[field] !== '' && data[field] !== 0) {
        filled++;
      }
    });
    
    return Math.round((filled / fields.length) * 100);
  };

  // Calculate overall progress
  const overallProgress = () => {
    const sections = FACT_FIND_SECTIONS.map(s => calculateSectionProgress(s.id));
    return Math.round(sections.reduce((a, b) => a + b, 0) / sections.length);
  };

  // Save fact-find
  const saveFactFind = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Fact-find saved successfully");
    setIsSaving(false);
    
    if (onComplete && overallProgress() >= 80) {
      onComplete(factFindData);
    }
  };

  // Add dependant
  const addDependant = () => {
    setFactFindData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        dependants: [...prev.personal.dependants, { name: "", dob: "", relationship: "" }]
      }
    }));
  };

  // Add goal
  const addGoal = (type) => {
    const field = type === 'short' ? 'short_term_goals' : 'long_term_goals';
    setFactFindData(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        [field]: [...prev.goals[field], { description: "", target_amount: 0, target_date: "", priority: "medium" }]
      }
    }));
  };

  const riskScore = calculateRiskScore();
  const riskProfile = getRiskProfile(riskScore);

  return (
    <div className="space-y-6" data-testid="digital-onboarding">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#D4AF37]" />
            Client Fact-Find
          </h2>
          <p className="text-sm text-muted-foreground">Complete client information for comprehensive advice</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            <p className="text-xl font-bold text-[#0F392B]">{overallProgress()}%</p>
          </div>
          <Button 
            onClick={saveFactFind} 
            disabled={isSaving}
            className="bg-[#0F392B]"
            data-testid="save-factfind-btn"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Progress"}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={overallProgress()} className="h-2" />

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FACT_FIND_SECTIONS.map((section) => {
          const progress = calculateSectionProgress(section.id);
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              className={`flex-shrink-0 ${activeSection === section.id ? "bg-[#0F392B]" : ""}`}
              onClick={() => setActiveSection(section.id)}
              data-testid={`section-${section.id}`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {section.title}
              {progress === 100 && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
            </Button>
          );
        })}
      </div>

      {/* Personal Details Section */}
      {activeSection === "personal" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-[#D4AF37]" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Select value={factFindData.personal.title} onValueChange={(v) => updateField('personal', 'title', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mr">Mr</SelectItem>
                    <SelectItem value="mrs">Mrs</SelectItem>
                    <SelectItem value="ms">Ms</SelectItem>
                    <SelectItem value="miss">Miss</SelectItem>
                    <SelectItem value="dr">Dr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={factFindData.personal.first_name}
                  onChange={(e) => updateField('personal', 'first_name', e.target.value)}
                  data-testid="first-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={factFindData.personal.last_name}
                  onChange={(e) => updateField('personal', 'last_name', e.target.value)}
                  data-testid="last-name-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Input
                  type="date"
                  value={factFindData.personal.date_of_birth}
                  onChange={(e) => updateField('personal', 'date_of_birth', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Marital Status</Label>
                <Select value={factFindData.personal.marital_status} onValueChange={(v) => updateField('personal', 'marital_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="de_facto">De Facto</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax File Number</Label>
                <Input
                  value={factFindData.personal.tax_file_number}
                  onChange={(e) => updateField('personal', 'tax_file_number', e.target.value)}
                  placeholder="XXX XXX XXX"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Contact Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={factFindData.personal.email}
                    onChange={(e) => updateField('personal', 'email', e.target.value)}
                    data-testid="email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Phone *</Label>
                  <Input
                    value={factFindData.personal.phone_mobile}
                    onChange={(e) => updateField('personal', 'phone_mobile', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Street Address *</Label>
                  <Input
                    value={factFindData.personal.address_street}
                    onChange={(e) => updateField('personal', 'address_street', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Suburb</Label>
                  <Input
                    value={factFindData.personal.address_suburb}
                    onChange={(e) => updateField('personal', 'address_suburb', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={factFindData.personal.address_state} onValueChange={(v) => updateField('personal', 'address_state', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NSW">NSW</SelectItem>
                      <SelectItem value="VIC">VIC</SelectItem>
                      <SelectItem value="QLD">QLD</SelectItem>
                      <SelectItem value="WA">WA</SelectItem>
                      <SelectItem value="SA">SA</SelectItem>
                      <SelectItem value="TAS">TAS</SelectItem>
                      <SelectItem value="ACT">ACT</SelectItem>
                      <SelectItem value="NT">NT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Postcode</Label>
                  <Input
                    value={factFindData.personal.address_postcode}
                    onChange={(e) => updateField('personal', 'address_postcode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Dependants */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Dependants</h4>
                <Button variant="outline" size="sm" onClick={addDependant}>
                  <Users className="h-4 w-4 mr-2" /> Add Dependant
                </Button>
              </div>
              {factFindData.personal.dependants.map((dep, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 mb-4 p-4 border rounded-lg">
                  <Input
                    placeholder="Name"
                    value={dep.name}
                    onChange={(e) => {
                      const newDeps = [...factFindData.personal.dependants];
                      newDeps[index].name = e.target.value;
                      updateField('personal', 'dependants', newDeps);
                    }}
                  />
                  <Input
                    type="date"
                    placeholder="Date of Birth"
                    value={dep.dob}
                    onChange={(e) => {
                      const newDeps = [...factFindData.personal.dependants];
                      newDeps[index].dob = e.target.value;
                      updateField('personal', 'dependants', newDeps);
                    }}
                  />
                  <Select
                    value={dep.relationship}
                    onValueChange={(v) => {
                      const newDeps = [...factFindData.personal.dependants];
                      newDeps[index].relationship = v;
                      updateField('personal', 'dependants', newDeps);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Relationship" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employment Section */}
      {activeSection === "employment" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#D4AF37]" />
              Employment & Income
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employment Status *</Label>
                <Select value={factFindData.employment.employment_status} onValueChange={(v) => updateField('employment', 'employment_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time Employed</SelectItem>
                    <SelectItem value="part_time">Part Time Employed</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="self_employed">Self Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="home_duties">Home Duties</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Occupation</Label>
                <Input
                  value={factFindData.employment.occupation}
                  onChange={(e) => updateField('employment', 'occupation', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employer Name</Label>
                <Input
                  value={factFindData.employment.employer_name}
                  onChange={(e) => updateField('employment', 'employer_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Years with Employer</Label>
                <Input
                  type="number"
                  value={factFindData.employment.years_employed}
                  onChange={(e) => updateField('employment', 'years_employed', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Income Details (Annual)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Gross Salary *</Label>
                  <Input
                    type="number"
                    value={factFindData.employment.salary_gross}
                    onChange={(e) => updateField('employment', 'salary_gross', Number(e.target.value))}
                    data-testid="salary-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bonus/Commission</Label>
                  <Input
                    type="number"
                    value={factFindData.employment.bonus_commission}
                    onChange={(e) => updateField('employment', 'bonus_commission', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Other Income</Label>
                  <Input
                    type="number"
                    value={factFindData.employment.other_income}
                    onChange={(e) => updateField('employment', 'other_income', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Rental Income</Label>
                  <Input
                    type="number"
                    value={factFindData.employment.rental_income}
                    onChange={(e) => updateField('employment', 'rental_income', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dividend Income</Label>
                  <Input
                    type="number"
                    value={factFindData.employment.dividend_income}
                    onChange={(e) => updateField('employment', 'dividend_income', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Centrelink Benefits</Label>
                  <Input
                    type="number"
                    value={factFindData.employment.centrelink}
                    onChange={(e) => updateField('employment', 'centrelink', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Total Annual Income</p>
              <p className="text-2xl font-bold text-[#0F392B]">
                {formatCurrency(
                  (factFindData.employment.salary_gross || 0) +
                  (factFindData.employment.bonus_commission || 0) +
                  (factFindData.employment.other_income || 0) +
                  (factFindData.employment.rental_income || 0) +
                  (factFindData.employment.dividend_income || 0) +
                  (factFindData.employment.centrelink || 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assets Section */}
      {activeSection === "assets" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#D4AF37]" />
              Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cash at Bank</Label>
                <Input
                  type="number"
                  value={factFindData.assets.cash_bank}
                  onChange={(e) => updateField('assets', 'cash_bank', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Term Deposits</Label>
                <Input
                  type="number"
                  value={factFindData.assets.term_deposits}
                  onChange={(e) => updateField('assets', 'term_deposits', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shares & Managed Funds</Label>
                <Input
                  type="number"
                  value={factFindData.assets.shares_managed_funds}
                  onChange={(e) => updateField('assets', 'shares_managed_funds', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Superannuation *</Label>
                <Input
                  type="number"
                  value={factFindData.assets.superannuation}
                  onChange={(e) => updateField('assets', 'superannuation', Number(e.target.value))}
                  data-testid="super-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Home (Residence)</Label>
                <Input
                  type="number"
                  value={factFindData.assets.home_residence}
                  onChange={(e) => updateField('assets', 'home_residence', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Investment Property</Label>
                <Input
                  type="number"
                  value={factFindData.assets.investment_property}
                  onChange={(e) => updateField('assets', 'investment_property', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Motor Vehicles</Label>
                <Input
                  type="number"
                  value={factFindData.assets.motor_vehicles}
                  onChange={(e) => updateField('assets', 'motor_vehicles', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Household Contents</Label>
                <Input
                  type="number"
                  value={factFindData.assets.household_contents}
                  onChange={(e) => updateField('assets', 'household_contents', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Other Assets</Label>
                <Input
                  type="number"
                  value={factFindData.assets.other_assets}
                  onChange={(e) => updateField('assets', 'other_assets', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Total Assets</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  Object.values(factFindData.assets)
                    .filter(v => typeof v === 'number')
                    .reduce((a, b) => a + b, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liabilities Section */}
      {activeSection === "liabilities" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#D4AF37]" />
              Liabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Home Loan</Label>
                <Input
                  type="number"
                  value={factFindData.liabilities.home_loan}
                  onChange={(e) => updateField('liabilities', 'home_loan', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Investment Loan</Label>
                <Input
                  type="number"
                  value={factFindData.liabilities.investment_loan}
                  onChange={(e) => updateField('liabilities', 'investment_loan', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Car Loan</Label>
                <Input
                  type="number"
                  value={factFindData.liabilities.car_loan}
                  onChange={(e) => updateField('liabilities', 'car_loan', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Personal Loan</Label>
                <Input
                  type="number"
                  value={factFindData.liabilities.personal_loan}
                  onChange={(e) => updateField('liabilities', 'personal_loan', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Credit Cards</Label>
                <Input
                  type="number"
                  value={factFindData.liabilities.credit_cards}
                  onChange={(e) => updateField('liabilities', 'credit_cards', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>HECS/HELP</Label>
                <Input
                  type="number"
                  value={factFindData.liabilities.hecs_help}
                  onChange={(e) => updateField('liabilities', 'hecs_help', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Other Debts</Label>
                <Input
                  type="number"
                  value={factFindData.liabilities.other_debts}
                  onChange={(e) => updateField('liabilities', 'other_debts', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-800">Total Liabilities</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  Object.values(factFindData.liabilities)
                    .filter(v => typeof v === 'number')
                    .reduce((a, b) => a + b, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insurance & Estate Section */}
      {activeSection === "insurance" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#D4AF37]" />
              Insurance & Estate Planning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Life Insurance Cover</Label>
                <Input
                  type="number"
                  value={factFindData.insurance.life_insurance}
                  onChange={(e) => updateField('insurance', 'life_insurance', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>TPD Insurance Cover</Label>
                <Input
                  type="number"
                  value={factFindData.insurance.tpd_insurance}
                  onChange={(e) => updateField('insurance', 'tpd_insurance', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Income Protection (monthly)</Label>
                <Input
                  type="number"
                  value={factFindData.insurance.income_protection}
                  onChange={(e) => updateField('insurance', 'income_protection', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Trauma Insurance Cover</Label>
                <Input
                  type="number"
                  value={factFindData.insurance.trauma_insurance}
                  onChange={(e) => updateField('insurance', 'trauma_insurance', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Estate Planning *</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Valid Will</p>
                      <p className="text-sm text-muted-foreground">Do you have a current, valid will?</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={factFindData.insurance.has_will}
                    onCheckedChange={(checked) => updateField('insurance', 'has_will', checked)}
                    data-testid="has-will-checkbox"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Power of Attorney</p>
                      <p className="text-sm text-muted-foreground">Enduring Power of Attorney in place?</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={factFindData.insurance.has_power_of_attorney}
                    onCheckedChange={(checked) => updateField('insurance', 'has_power_of_attorney', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Enduring Guardian</p>
                      <p className="text-sm text-muted-foreground">Appointment of Enduring Guardian?</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={factFindData.insurance.has_enduring_guardian}
                    onCheckedChange={(checked) => updateField('insurance', 'has_enduring_guardian', checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals Section */}
      {activeSection === "goals" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-[#D4AF37]" />
              Goals & Objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Retirement Age *</Label>
                <Input
                  type="number"
                  value={factFindData.goals.retirement_age}
                  onChange={(e) => updateField('goals', 'retirement_age', Number(e.target.value))}
                  data-testid="retirement-age-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Desired Retirement Income (annual)</Label>
                <Input
                  type="number"
                  value={factFindData.goals.retirement_income}
                  onChange={(e) => updateField('goals', 'retirement_income', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Short-Term Goals (1-3 years)</h4>
                <Button variant="outline" size="sm" onClick={() => addGoal('short')}>
                  <Target className="h-4 w-4 mr-2" /> Add Goal
                </Button>
              </div>
              {factFindData.goals.short_term_goals.map((goal, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 mb-4 p-4 border rounded-lg">
                  <Textarea
                    placeholder="Goal description"
                    value={goal.description}
                    onChange={(e) => {
                      const newGoals = [...factFindData.goals.short_term_goals];
                      newGoals[index].description = e.target.value;
                      updateField('goals', 'short_term_goals', newGoals);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Target amount"
                    value={goal.target_amount}
                    onChange={(e) => {
                      const newGoals = [...factFindData.goals.short_term_goals];
                      newGoals[index].target_amount = Number(e.target.value);
                      updateField('goals', 'short_term_goals', newGoals);
                    }}
                  />
                  <Input
                    type="date"
                    value={goal.target_date}
                    onChange={(e) => {
                      const newGoals = [...factFindData.goals.short_term_goals];
                      newGoals[index].target_date = e.target.value;
                      updateField('goals', 'short_term_goals', newGoals);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Long-Term Goals (3+ years)</h4>
                <Button variant="outline" size="sm" onClick={() => addGoal('long')}>
                  <Target className="h-4 w-4 mr-2" /> Add Goal
                </Button>
              </div>
              {factFindData.goals.long_term_goals.map((goal, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 mb-4 p-4 border rounded-lg">
                  <Textarea
                    placeholder="Goal description"
                    value={goal.description}
                    onChange={(e) => {
                      const newGoals = [...factFindData.goals.long_term_goals];
                      newGoals[index].description = e.target.value;
                      updateField('goals', 'long_term_goals', newGoals);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Target amount"
                    value={goal.target_amount}
                    onChange={(e) => {
                      const newGoals = [...factFindData.goals.long_term_goals];
                      newGoals[index].target_amount = Number(e.target.value);
                      updateField('goals', 'long_term_goals', newGoals);
                    }}
                  />
                  <Input
                    type="date"
                    value={goal.target_date}
                    onChange={(e) => {
                      const newGoals = [...factFindData.goals.long_term_goals];
                      newGoals[index].target_date = e.target.value;
                      updateField('goals', 'long_term_goals', newGoals);
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Profile Section */}
      {activeSection === "risk" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
              Risk Profile Assessment
            </CardTitle>
            <CardDescription>
              Answer these questions to determine your investment risk profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {RISK_QUESTIONS.map((question, qIndex) => (
              <div key={question.id} className="p-4 border rounded-lg">
                <p className="font-medium mb-4">
                  {qIndex + 1}. {question.question}
                </p>
                <RadioGroup
                  value={String(factFindData.risk.answers[question.id] || '')}
                  onValueChange={(v) => updateRiskAnswer(question.id, Number(v))}
                >
                  {question.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3 p-2 rounded hover:bg-muted">
                      <RadioGroupItem value={String(option.value)} id={`${question.id}_${option.value}`} />
                      <Label htmlFor={`${question.id}_${option.value}`} className="cursor-pointer flex-1">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            {/* Risk Profile Result */}
            {Object.keys(factFindData.risk.answers).length === RISK_QUESTIONS.length && (
              <Card className="bg-[#0F392B] text-white">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-white/80 mb-2">Your Risk Profile</p>
                    <p className="text-3xl font-bold mb-2">{riskProfile.name}</p>
                    <p className="text-sm text-white/80">Score: {riskScore} / 40</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = FACT_FIND_SECTIONS.findIndex(s => s.id === activeSection);
            if (currentIndex > 0) {
              setActiveSection(FACT_FIND_SECTIONS[currentIndex - 1].id);
            }
          }}
          disabled={activeSection === FACT_FIND_SECTIONS[0].id}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <Button
          onClick={() => {
            const currentIndex = FACT_FIND_SECTIONS.findIndex(s => s.id === activeSection);
            if (currentIndex < FACT_FIND_SECTIONS.length - 1) {
              setActiveSection(FACT_FIND_SECTIONS[currentIndex + 1].id);
            } else {
              saveFactFind();
            }
          }}
          className="bg-[#0F392B]"
        >
          {activeSection === FACT_FIND_SECTIONS[FACT_FIND_SECTIONS.length - 1].id ? (
            <>Complete <CheckCircle className="h-4 w-4 ml-2" /></>
          ) : (
            <>Next <ChevronRight className="h-4 w-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DigitalOnboarding;
