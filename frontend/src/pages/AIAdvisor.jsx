import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Sparkles,
  Send,
  RefreshCw,
  Lightbulb,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Brain,
  MessageSquare,
  History,
  Zap,
  ChevronRight
} from "lucide-react";
import { usePortfolio } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const AIAdvisor = () => {
  const { portfolio, budget, familyMembers } = usePortfolio();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [advice, setAdvice] = useState(null);
  const [adviceHistory, setAdviceHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("ask");

  // Quick questions
  const quickQuestions = [
    "What are the top 3 actions I should take right now?",
    "How can I reduce my tax this year?",
    "Am I on track for retirement?",
    "Should I pay down debt or invest more?",
    "How should I rebalance my portfolio?"
  ];

  // Build context from portfolio
  const buildContext = () => {
    const totalIncome = Object.values(budget.income).reduce((a, b) => a + b, 0) * 12;
    const totalExpenses = Object.values(budget.expenses).reduce((a, b) => a + b, 0) * 12;
    
    return {
      net_worth: portfolio.summary.netWorth,
      total_assets: portfolio.summary.totalAssets,
      total_debt: portfolio.summary.totalDebt,
      annual_income: totalIncome || portfolio.personal.taxableIncome,
      annual_expenses: totalExpenses || 120000,
      age: familyMembers[0]?.age || 45,
      retirement_age: 65,
      risk_profile: "moderate",
      super_balance: portfolio.investments.smsf_balance,
      investment_portfolio: portfolio.investments.shares_value + portfolio.investments.etf_value,
      property_value: portfolio.investments.properties.reduce((sum, p) => sum + p.value, 0),
      cash_savings: portfolio.investments.cash_savings + portfolio.investments.term_deposit_amount
    };
  };

  // Fetch advice history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API}/ai/advice-history/hh_thompson001`);
        setAdviceHistory(res.data.advice_history || []);
      } catch (error) {
        console.error("Error fetching advice history:", error);
      }
    };
    fetchHistory();
  }, []);

  // Generate AI advice
  const handleAskQuestion = async (q = question) => {
    if (!q.trim()) {
      toast.error("Please enter a question");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/ai/generate-advice`, {
        household_id: "hh_thompson001",
        context: buildContext(),
        question: q,
        advice_type: "general"
      });
      setAdvice(res.data);
      setQuestion("");
      toast.success("AI advice generated");
      
      // Refresh history
      const historyRes = await axios.get(`${API}/ai/advice-history/hh_thompson001`);
      setAdviceHistory(historyRes.data.advice_history || []);
    } catch (error) {
      console.error("Error generating advice:", error);
      toast.error("Failed to generate advice");
    } finally {
      setLoading(false);
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.7) return "text-blue-600";
    return "text-yellow-600";
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="ai-advisor-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground flex items-center gap-3">
              <Brain className="h-8 w-8 text-[#D4A84C]" />
              AI Financial Advisor
            </h1>
            <p className="text-muted-foreground mt-1">
              Get personalized financial advice powered by AI
            </p>
          </div>
          <Badge className="bg-[#1a2744] text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            Multi-LLM Powered
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="ask" data-testid="tab-ask">
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask AI
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Ask AI Tab */}
          <TabsContent value="ask" className="space-y-6">
            {/* Question Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ask a Financial Question</CardTitle>
                <CardDescription>
                  Get personalized advice based on your financial situation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Question</Label>
                  <Textarea 
                    placeholder="e.g., What should I do to maximize my tax savings this year?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={3}
                    data-testid="question-input"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={() => handleAskQuestion()}
                    disabled={loading || !question.trim()}
                    className="bg-[#1a2744]"
                    data-testid="ask-btn"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {loading ? "Analyzing..." : "Get AI Advice"}
                  </Button>
                </div>

                {/* Quick Questions */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Quick Questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickQuestions.map((q, idx) => (
                      <Button
                        key={`item-${idx}`}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAskQuestion(q)}
                        disabled={loading}
                        className="text-xs"
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Response */}
            {advice && (
              <div className="space-y-6">
                {/* Analysis Summary */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-[#D4A84C]" />
                        AI Analysis
                      </CardTitle>
                      <Badge variant="outline" className={getConfidenceColor(advice.llm_metadata?.confidence_score || 0.85)}>
                        {((advice.llm_metadata?.confidence_score || 0.85) * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <CardDescription>
                      Question: "{advice.question}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-2">Key Strengths</p>
                        <ul className="text-sm text-green-700 space-y-1">
                          {advice.analysis?.key_strengths?.map((s, i) => (
                            <li key={`item-${i}`}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800 mb-2">Areas to Improve</p>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {advice.analysis?.areas_for_improvement?.map((s, i) => (
                            <li key={`item-${i}`}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-2">Retirement Outlook</p>
                        <p className="text-sm text-blue-700">{advice.retirement_outlook?.current_trajectory}</p>
                        <p className="text-lg font-bold text-blue-800 mt-2">
                          {advice.retirement_outlook?.success_probability} success
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-[#D4A84C]" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {advice.recommendations?.map((rec, idx) => (
                      <div 
                        key={`item-${idx}`}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate("/decision-engine")}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          idx === 0 ? 'bg-[#1a2744]' : idx === 1 ? 'bg-[#D4A84C]' : 'bg-blue-500'
                        }`}>
                          {rec.rank}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <Badge variant="outline" className={getConfidenceColor(rec.confidence)}>
                              {(rec.confidence * 100).toFixed(0)}% confident
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge className="bg-green-100 text-green-700">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {rec.impact}
                            </Badge>
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {rec.timeframe}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Rationale: {rec.rationale}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Disclaimers */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important Disclaimers</AlertTitle>
                  <AlertDescription>
                    <ul className="text-sm space-y-1 mt-2">
                      {advice.disclaimers?.map((d, i) => (
                        <li key={`item-${i}`}>• {d}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advice History</CardTitle>
                <CardDescription>
                  Previous AI-generated advice sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adviceHistory.length > 0 ? (
                  <div className="space-y-4">
                    {adviceHistory.map((item, idx) => (
                      <div 
                        key={`item-${idx}`}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setAdvice(item)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{item.advice_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.generated_at).toLocaleDateString('en-AU')}
                          </span>
                        </div>
                        <p className="font-medium">"{item.question}"</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.recommendations?.length || 0} recommendations
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No advice history yet</p>
                    <p className="text-sm">Ask your first question to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Context Card */}
        <Card className="border-[#1a2744]/20 bg-[#1a2744]/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-[#1a2744] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#1a2744]">About AI Financial Advisor</p>
                <p className="text-sm text-[#1a2744]/70 mt-1">
                  Our AI advisor uses your complete financial profile to generate personalized recommendations.
                  It analyzes your assets, liabilities, income, goals, and risk tolerance to provide 
                  actionable insights. The advice is generated using multiple AI models for accuracy and 
                  is tailored specifically to Australian tax laws and financial regulations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AIAdvisor;
