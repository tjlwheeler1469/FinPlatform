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

import { PersonalSection, EmploymentSection, AssetsSection, LiabilitiesSection, InsuranceSection, GoalsSection, RiskSection } from './onboarding';

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
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  
  const defaultFactFindData = {
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
  
  const [factFindData, setFactFindData] = useState(defaultFactFindData);
  const [isSaving, setIsSaving] = useState(false);

  // Load fact-find data from MongoDB on mount
  useEffect(() => {
    const loadFactFind = async () => {
      if (!clientId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/factfind/${clientId}`);
        if (response.ok) {
          const data = await response.json();
          setFactFindData(data.data || defaultFactFindData);
          setLastSaved(data.updated_at);
          toast.success("Fact-find loaded from database");
        } else if (response.status === 404) {
          // No existing fact-find, use defaults
          setFactFindData(defaultFactFindData);
        }
      } catch (error) {
        console.error("Error loading fact-find:", error);
        // Fall back to localStorage if API fails
        const saved = localStorage.getItem(`halcyon_factfind_${clientId}`);
        if (saved) {
          setFactFindData(JSON.parse(saved));
          toast.info("Loaded from local cache");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFactFind();
  }, [clientId]);

  // Also keep localStorage as backup
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(`halcyon_factfind_${clientId || 'new'}`, JSON.stringify(factFindData));
    }
  }, [factFindData, clientId, isLoading]);

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

  // Save fact-find to MongoDB
  const saveFactFind = async () => {
    setIsSaving(true);
    
    try {
      const progress = overallProgress();
      const status = progress >= 100 ? "completed" : progress >= 80 ? "pending_review" : "in_progress";
      
      const response = await fetch(`${API_URL}/api/factfind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId || "new_client",
          data: factFindData,
          progress: progress,
          status: status
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setLastSaved(new Date().toISOString());
        toast.success("Fact-find saved to database", {
          description: `Progress: ${progress}%`
        });
        
        if (onComplete && progress >= 80) {
          onComplete(factFindData);
        }
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Error saving fact-find:", error);
      toast.error("Failed to save to database", {
        description: "Data saved locally as backup"
      });
    } finally {
      setIsSaving(false);
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a2744]" />
        <span className="ml-2">Loading fact-find data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="digital-onboarding">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#D4A84C]" />
            Client Fact-Find
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Complete client information for comprehensive advice</span>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Database className="h-3 w-3" /> MongoDB
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            <p className="text-xl font-bold text-[#1a2744]">{overallProgress()}%</p>
            {lastSaved && (
              <p className="text-xs text-muted-foreground">
                Last saved: {new Date(lastSaved).toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button 
            onClick={saveFactFind} 
            disabled={isSaving}
            className="bg-[#1a2744]"
            data-testid="save-factfind-btn"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save to Database"}
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
              className={`flex-shrink-0 ${activeSection === section.id ? "bg-[#1a2744]" : ""}`}
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

      {/* Sections - extracted into sub-components */}
      {activeSection === "personal" && <PersonalSection factFindData={factFindData} updateField={updateField} addDependant={addDependant} />}
      {activeSection === "employment" && <EmploymentSection factFindData={factFindData} updateField={updateField} />}
      {activeSection === "assets" && <AssetsSection factFindData={factFindData} updateField={updateField} />}
      {activeSection === "liabilities" && <LiabilitiesSection factFindData={factFindData} updateField={updateField} />}
      {activeSection === "insurance" && <InsuranceSection factFindData={factFindData} updateField={updateField} />}
      {activeSection === "goals" && <GoalsSection factFindData={factFindData} updateField={updateField} addGoal={addGoal} />}
      {activeSection === "risk" && <RiskSection factFindData={factFindData} updateRiskAnswer={updateRiskAnswer} riskQuestions={RISK_QUESTIONS} riskScore={riskScore} riskProfile={riskProfile} />}

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
          className="bg-[#1a2744]"
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
