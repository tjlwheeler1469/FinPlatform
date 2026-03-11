import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Download,
  Target,
  Scale,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { ComplianceFooter, CalculatorDisclaimer } from "@/components/ComplianceDisclaimer";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import ChartContainer from "@/components/ChartContainer";

// Risk Profile Questions (Based on ASIC/FSC guidelines)
const QUESTIONS = [
  {
    id: 1,
    category: "Investment Timeframe",
    question: "When do you expect to start withdrawing a significant portion of this investment?",
    options: [
      { value: 1, label: "Within 2 years" },
      { value: 2, label: "2-5 years" },
      { value: 3, label: "5-10 years" },
      { value: 4, label: "10-20 years" },
      { value: 5, label: "More than 20 years" }
    ]
  },
  {
    id: 2,
    category: "Investment Knowledge",
    question: "How would you describe your investment knowledge and experience?",
    options: [
      { value: 1, label: "Very limited - I've never invested before" },
      { value: 2, label: "Basic - I understand savings accounts and term deposits" },
      { value: 3, label: "Moderate - I understand shares and managed funds" },
      { value: 4, label: "Good - I actively manage a diversified portfolio" },
      { value: 5, label: "Advanced - I understand complex products including derivatives" }
    ]
  },
  {
    id: 3,
    category: "Risk Tolerance",
    question: "If your investment fell 20% in value over a short period, what would you do?",
    options: [
      { value: 1, label: "Sell everything immediately to prevent further loss" },
      { value: 2, label: "Sell some to reduce risk" },
      { value: 3, label: "Hold and wait for recovery" },
      { value: 4, label: "Buy more at the lower price" },
      { value: 5, label: "Buy significantly more - this is an opportunity" }
    ]
  },
  {
    id: 4,
    category: "Return vs Security",
    question: "Which statement best describes your investment priority?",
    options: [
      { value: 1, label: "Protecting my capital is most important - I cannot afford any loss" },
      { value: 2, label: "I prefer stable, modest returns with minimal fluctuation" },
      { value: 3, label: "I seek a balance between growth and stability" },
      { value: 4, label: "I'm willing to accept moderate volatility for higher returns" },
      { value: 5, label: "I prioritize maximum growth and can tolerate significant volatility" }
    ]
  },
  {
    id: 5,
    category: "Income Needs",
    question: "How important is regular income from your investments?",
    options: [
      { value: 1, label: "Essential - I depend on investment income for living expenses" },
      { value: 2, label: "Important - I need some income to supplement other sources" },
      { value: 3, label: "Moderate - Income is nice but not essential" },
      { value: 4, label: "Low priority - I prefer growth over income" },
      { value: 5, label: "Not important - I reinvest all returns for maximum growth" }
    ]
  },
  {
    id: 6,
    category: "Financial Stability",
    question: "If you lost your primary income source tomorrow, how long could you maintain your current lifestyle?",
    options: [
      { value: 1, label: "Less than 3 months" },
      { value: 2, label: "3-6 months" },
      { value: 3, label: "6-12 months" },
      { value: 4, label: "1-2 years" },
      { value: 5, label: "More than 2 years" }
    ]
  },
  {
    id: 7,
    category: "Portfolio Scenario",
    question: "Which portfolio would you be most comfortable with over a 5-year period?",
    options: [
      { value: 1, label: "Expected return: 3% p.a. | Worst year: 0% | Best year: 6%" },
      { value: 2, label: "Expected return: 5% p.a. | Worst year: -5% | Best year: 15%" },
      { value: 3, label: "Expected return: 7% p.a. | Worst year: -15% | Best year: 25%" },
      { value: 4, label: "Expected return: 9% p.a. | Worst year: -25% | Best year: 35%" },
      { value: 5, label: "Expected return: 11% p.a. | Worst year: -35% | Best year: 50%" }
    ]
  },
  {
    id: 8,
    category: "Loss Acceptance",
    question: "What is the maximum loss you could accept in a single year before you would change your investment strategy?",
    options: [
      { value: 1, label: "0% - I cannot accept any loss" },
      { value: 2, label: "Up to 5% loss" },
      { value: 3, label: "Up to 15% loss" },
      { value: 4, label: "Up to 25% loss" },
      { value: 5, label: "Up to 40% or more - short-term losses don't concern me" }
    ]
  }
];

// Risk Profiles
const RISK_PROFILES = {
  conservative: {
    name: "Conservative",
    color: "#3B82F6",
    minScore: 8,
    maxScore: 16,
    description: "You prefer security over high returns and have a low tolerance for market volatility.",
    allocation: { defensive: 70, growth: 30 },
    assets: { cash: 20, fixedIncome: 50, property: 10, australianShares: 15, internationalShares: 5 },
    expectedReturn: "3-5%",
    riskLevel: 1
  },
  moderatelyConservative: {
    name: "Moderately Conservative",
    color: "#10B981",
    minScore: 17,
    maxScore: 22,
    description: "You seek steady returns with limited downside risk and can accept some short-term volatility.",
    allocation: { defensive: 50, growth: 50 },
    assets: { cash: 10, fixedIncome: 40, property: 15, australianShares: 25, internationalShares: 10 },
    expectedReturn: "5-7%",
    riskLevel: 2
  },
  balanced: {
    name: "Balanced",
    color: "#D4AF37",
    minScore: 23,
    maxScore: 28,
    description: "You seek a balance between growth and security, accepting moderate volatility for better returns.",
    allocation: { defensive: 30, growth: 70 },
    assets: { cash: 5, fixedIncome: 25, property: 15, australianShares: 35, internationalShares: 20 },
    expectedReturn: "6-8%",
    riskLevel: 3
  },
  growth: {
    name: "Growth",
    color: "#F59E0B",
    minScore: 29,
    maxScore: 34,
    description: "You prioritize capital growth over income and can tolerate significant short-term volatility.",
    allocation: { defensive: 15, growth: 85 },
    assets: { cash: 2, fixedIncome: 13, property: 10, australianShares: 45, internationalShares: 30 },
    expectedReturn: "7-10%",
    riskLevel: 4
  },
  highGrowth: {
    name: "High Growth",
    color: "#EF4444",
    minScore: 35,
    maxScore: 40,
    description: "You seek maximum long-term growth and are comfortable with high volatility and potential for significant losses.",
    allocation: { defensive: 5, growth: 95 },
    assets: { cash: 0, fixedIncome: 5, property: 5, australianShares: 50, internationalShares: 40 },
    expectedReturn: "8-12%",
    riskLevel: 5
  }
};

const getProfile = (score) => {
  for (const [key, profile] of Object.entries(RISK_PROFILES)) {
    if (score >= profile.minScore && score <= profile.maxScore) {
      return { key, ...profile };
    }
  }
  return { key: "balanced", ...RISK_PROFILES.balanced };
};

const RiskProfiler = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState([]);

  const totalQuestions = QUESTIONS.length;
  const progress = (Object.keys(answers).length / totalQuestions) * 100;
  const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
  const profile = getProfile(totalScore);

  const handleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const nextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (Object.keys(answers).length === totalQuestions) {
      setShowResults(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const saveProfile = () => {
    const newProfile = {
      id: Date.now(),
      date: new Date().toISOString(),
      score: totalScore,
      profile: profile.name,
      answers: { ...answers }
    };
    setSavedProfiles([newProfile, ...savedProfiles]);
    localStorage.setItem('wheeler_risk_profiles', JSON.stringify([newProfile, ...savedProfiles]));
    toast.success("Risk profile saved");
  };

  const exportProfile = () => {
    const content = `
RISK PROFILE ASSESSMENT
=======================
Date: ${new Date().toLocaleDateString('en-AU')}
Score: ${totalScore}/40

PROFILE: ${profile.name}
------------------------
${profile.description}

RECOMMENDED ALLOCATION
----------------------
Defensive: ${profile.allocation.defensive}%
Growth: ${profile.allocation.growth}%

ASSET ALLOCATION
----------------
Cash: ${profile.assets.cash}%
Fixed Income: ${profile.assets.fixedIncome}%
Property: ${profile.assets.property}%
Australian Shares: ${profile.assets.australianShares}%
International Shares: ${profile.assets.internationalShares}%

Expected Return: ${profile.expectedReturn} p.a.

DISCLAIMER
----------
This assessment provides general guidance only and does not constitute personal financial advice. 
Individual circumstances vary. Consult a licensed financial adviser before making investment decisions.
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Risk_Profile_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Profile exported");
  };

  const assetData = Object.entries(profile.assets).map(([key, value]) => ({
    name: key.replace(/([A-Z])/g, ' $1').trim(),
    value,
    color: key === 'cash' ? '#6B7280' : 
           key === 'fixedIncome' ? '#3B82F6' : 
           key === 'property' ? '#10B981' : 
           key === 'australianShares' ? '#0F392B' : '#D4AF37'
  }));

  const radarData = [
    { subject: 'Timeframe', value: answers[1] || 0 },
    { subject: 'Knowledge', value: answers[2] || 0 },
    { subject: 'Risk Tolerance', value: answers[3] || 0 },
    { subject: 'Growth Focus', value: answers[4] || 0 },
    { subject: 'Income Needs', value: 6 - (answers[5] || 0) },
    { subject: 'Stability', value: answers[6] || 0 },
    { subject: 'Volatility Accept.', value: answers[7] || 0 },
    { subject: 'Loss Accept.', value: answers[8] || 0 },
  ];

  if (showResults) {
    return (
      <Layout>
        <div className="space-y-6" data-testid="risk-profiler-results">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-['Manrope']">Your Risk Profile</h1>
              <p className="text-muted-foreground mt-1">Based on your responses to 8 questions</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetQuiz}>
                <RotateCcw className="h-4 w-4 mr-2" /> Retake
              </Button>
              <Button variant="outline" onClick={exportProfile}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
              <Button onClick={saveProfile} className="bg-[#0F392B]">
                <CheckCircle className="h-4 w-4 mr-2" /> Save Profile
              </Button>
            </div>
          </div>

          <CalculatorDisclaimer calculatorName="risk profiler" />

          {/* Profile Result Card */}
          <Card className="border-t-4" style={{ borderTopColor: profile.color }}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${profile.color}20` }}
                    >
                      <Target className="h-8 w-8" style={{ color: profile.color }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{profile.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge style={{ backgroundColor: profile.color }}>
                          Score: {totalScore}/40
                        </Badge>
                        <Badge variant="outline">
                          Risk Level: {profile.riskLevel}/5
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{profile.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Expected Return</p>
                      <p className="text-xl font-bold" style={{ color: profile.color }}>
                        {profile.expectedReturn} p.a.
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Defensive</p>
                          <p className="text-xl font-bold text-[#3B82F6]">{profile.allocation.defensive}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Growth</p>
                          <p className="text-xl font-bold text-[#10B981]">{profile.allocation.growth}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Asset Allocation Pie */}
                <div>
                  <p className="text-sm font-medium mb-2 text-center">Recommended Asset Allocation</p>
                  <ChartContainer height={200}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={assetData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${value}%`}
                        >
                          {assetData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {assetData.map((item, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Profile Radar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Risk Profile Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 5]} />
                    <Radar
                      name="Your Profile"
                      dataKey="value"
                      stroke={profile.color}
                      fill={profile.color}
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* All Profiles Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Profile Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {Object.entries(RISK_PROFILES).map(([key, p]) => (
                  <div 
                    key={key}
                    className={`flex-1 p-3 rounded-lg text-center transition-all ${
                      key === profile.key ? 'ring-2 ring-offset-2' : 'opacity-60'
                    }`}
                    style={{ 
                      backgroundColor: `${p.color}15`,
                      ringColor: p.color
                    }}
                  >
                    <p className="text-xs font-medium" style={{ color: p.color }}>{p.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{p.minScore}-{p.maxScore}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Progress value={(totalScore / 40) * 100} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Conservative</span>
                  <span>Your Score: {totalScore}</span>
                  <span>High Growth</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <ComplianceFooter />
        </div>
      </Layout>
    );
  }

  const question = QUESTIONS[currentQuestion];

  return (
    <Layout>
      <div className="space-y-6" data-testid="risk-profiler-page">
        <div>
          <h1 className="text-3xl font-bold font-['Manrope']">Risk Profiler</h1>
          <p className="text-muted-foreground mt-1">
            Answer 8 questions to determine your investment risk profile
          </p>
        </div>

        <CalculatorDisclaimer calculatorName="risk profiler" />

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Question {currentQuestion + 1} of {totalQuestions}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question */}
        <Card>
          <CardHeader>
            <Badge variant="outline" className="w-fit mb-2">{question.category}</Badge>
            <CardTitle className="text-xl">{question.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={answers[question.id]?.toString()} 
              onValueChange={(v) => handleAnswer(question.id, parseInt(v))}
              className="space-y-3"
            >
              {question.options.map((option) => (
                <div 
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    answers[question.id] === option.value 
                      ? 'border-[#0F392B] bg-[#0F392B]/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleAnswer(question.id, option.value)}
                >
                  <RadioGroupItem value={option.value.toString()} id={`q${question.id}-${option.value}`} />
                  <Label htmlFor={`q${question.id}-${option.value}`} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          <Button 
            onClick={nextQuestion}
            disabled={!answers[question.id]}
            className="bg-[#0F392B]"
          >
            {currentQuestion === totalQuestions - 1 ? (
              <>See Results <CheckCircle className="h-4 w-4 ml-2" /></>
            ) : (
              <>Next <ChevronRight className="h-4 w-4 ml-2" /></>
            )}
          </Button>
        </div>

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default RiskProfiler;
