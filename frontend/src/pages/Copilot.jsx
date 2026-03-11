import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles,
  Send,
  Bot,
  User,
  Calculator,
  TrendingUp,
  Building2,
  Wallet,
  FileText,
  Shield,
  Target,
  DollarSign,
  PieChart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Loader2,
  LineChart,
  Landmark,
  RefreshCw,
  Download,
  Play,
  X,
  Lightbulb,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { usePortfolio } from "@/App";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";
import ChartContainer from "@/components/ChartContainer";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartPie,
  Pie,
  Cell
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0
  }).format(value);
};

// Command patterns for intent recognition
const INTENT_PATTERNS = {
  bas: ["bas", "business activity statement", "gst", "payg", "lodge", "ato"],
  tax: ["tax", "deduction", "taxable", "income tax", "tax return", "stage 3"],
  scenario: ["scenario", "what if", "sell", "buy", "simulate", "projection", "forecast"],
  cashflow: ["cashflow", "cash flow", "budget", "expenses", "income", "spending"],
  risk: ["risk", "profile", "tolerance", "aggressive", "conservative", "balanced"],
  stocks: ["stock", "share", "portfolio", "dividend", "cba", "bhp", "asx"],
  property: ["property", "real estate", "rental", "negative gearing", "yield"],
  super: ["super", "superannuation", "smsf", "retirement", "pension"],
  cgt: ["cgt", "capital gain", "capital loss", "50% discount"],
  loan: ["loan", "mortgage", "repayment", "interest rate", "debt"],
  soa: ["soa", "statement of advice", "recommendation", "adviser"],
  navigate: ["go to", "show me", "open", "navigate", "take me"],
  calculate: ["calculate", "compute", "work out", "figure out", "how much"],
  report: ["report", "export", "download", "pdf", "summary"],
  help: ["help", "what can", "how do", "explain"],
};

// Quick action suggestions
const QUICK_ACTIONS = [
  { icon: Calculator, label: "Calculate my tax", command: "Calculate my tax for this year" },
  { icon: TrendingUp, label: "Run stock sell scenario", command: "What if I sell all my stocks?" },
  { icon: Wallet, label: "Show cashflow", command: "Show my monthly cashflow" },
  { icon: Shield, label: "Check risk profile", command: "What's my risk profile?" },
  { icon: FileText, label: "Generate BAS", command: "Help me with my BAS" },
  { icon: Building2, label: "Property analysis", command: "Analyze my property portfolio" },
];

const Copilot = () => {
  const navigate = useNavigate();
  const { portfolio, familyMembers, sharePortfolio, budget, trust, company } = usePortfolio();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: "Hi! I'm your Financial Copilot. I can help you with tasks like calculating taxes, running scenarios, checking your cashflow, or navigating to different parts of the app. What would you like to do?",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeResult, setActiveResult] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect intent from user message
  const detectIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      if (patterns.some(pattern => lowerMessage.includes(pattern))) {
        return intent;
      }
    }
    return "general";
  };

  // Calculate tax helper
  const calculateTax = (income) => {
    // 2024-25 tax brackets (Stage 3)
    if (income <= 18200) return 0;
    if (income <= 45000) return (income - 18200) * 0.16;
    if (income <= 135000) return 4288 + (income - 45000) * 0.30;
    if (income <= 190000) return 31288 + (income - 135000) * 0.37;
    return 51638 + (income - 190000) * 0.45;
  };

  // Process user command
  const processCommand = async (userMessage) => {
    const intent = detectIntent(userMessage);
    const lowerMessage = userMessage.toLowerCase();
    
    let response = { content: "", result: null, action: null };

    switch (intent) {
      case "tax":
        const totalIncome = familyMembers.reduce((sum, m) => sum + (m.taxableIncome || 0), 0);
        const primaryIncome = familyMembers[0]?.taxableIncome || 185000;
        const tax = calculateTax(primaryIncome);
        const effectiveRate = ((tax / primaryIncome) * 100).toFixed(1);
        
        response.content = `Based on your primary income of ${formatCurrency(primaryIncome)}, your estimated tax is ${formatCurrency(tax)} (effective rate: ${effectiveRate}%).`;
        response.result = {
          type: "tax",
          data: {
            income: primaryIncome,
            tax: tax,
            effectiveRate: effectiveRate,
            medicare: primaryIncome * 0.02,
            netIncome: primaryIncome - tax - (primaryIncome * 0.02)
          }
        };
        response.action = { label: "View Tax Analysis", path: "/tax-analysis-sync" };
        break;

      case "scenario":
        if (lowerMessage.includes("sell") && (lowerMessage.includes("stock") || lowerMessage.includes("share"))) {
          const totalStockValue = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
          const totalCost = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
          const gain = totalStockValue - totalCost;
          const cgt = gain > 0 ? gain * 0.5 * 0.37 : 0; // 50% discount, 37% bracket
          
          response.content = `If you sold all your stocks today:\n\n• Total Value: ${formatCurrency(totalStockValue)}\n• Total Cost Base: ${formatCurrency(totalCost)}\n• Capital ${gain >= 0 ? 'Gain' : 'Loss'}: ${formatCurrency(Math.abs(gain))}\n• Estimated CGT (with 50% discount): ${formatCurrency(cgt)}`;
          response.result = {
            type: "scenario",
            title: "Sell All Stocks Scenario",
            data: {
              totalValue: totalStockValue,
              costBase: totalCost,
              capitalGain: gain,
              cgtPayable: cgt,
              netProceeds: totalStockValue - cgt
            }
          };
          response.action = { label: "Run Detailed Scenario", path: "/strategic-planning" };
        } else {
          response.content = "I can run various scenarios for you. Try asking:\n• 'What if I sell all my stocks?'\n• 'What if property prices drop 10%?'\n• 'Show retirement projection'\n\nOr visit Strategic Planning for advanced modeling.";
          response.action = { label: "Open Strategic Planning", path: "/strategic-planning" };
        }
        break;

      case "cashflow":
        const monthlyIncome = Object.values(budget.income).reduce((a, b) => a + b, 0);
        const monthlyExpenses = Object.values(budget.expenses).reduce((a, b) => a + b, 0);
        const surplus = monthlyIncome - monthlyExpenses;
        
        response.content = `Your monthly cashflow:\n\n• Income: ${formatCurrency(monthlyIncome)}\n• Expenses: ${formatCurrency(monthlyExpenses)}\n• ${surplus >= 0 ? 'Surplus' : 'Shortfall'}: ${formatCurrency(Math.abs(surplus))}`;
        response.result = {
          type: "cashflow",
          data: {
            income: monthlyIncome,
            expenses: monthlyExpenses,
            surplus: surplus,
            projection: Array.from({length: 12}, (_, i) => ({
              month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(new Date().getMonth() + i) % 12],
              income: monthlyIncome,
              expenses: monthlyExpenses,
              cumulative: surplus * (i + 1)
            }))
          }
        };
        response.action = { label: "View Budget Details", path: "/budget" };
        break;

      case "risk":
        const savedProfile = localStorage.getItem("wheeler_risk_profiles");
        const profile = savedProfile ? JSON.parse(savedProfile)[0] : null;
        
        if (profile) {
          response.content = `Your risk profile is **${profile.profile}** (Score: ${profile.score}/40).\n\nThis suggests you're comfortable with a ${profile.profile.toLowerCase()} approach to investing.`;
        } else {
          response.content = "You haven't completed a risk assessment yet. Would you like to take the Risk Profiler questionnaire?";
        }
        response.action = { label: "Open Risk Profiler", path: "/risk-profiler" };
        break;

      case "stocks":
        const stockValue = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
        const dividends = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.currentPrice * s.dividendYield / 100), 0);
        
        response.content = `Your share portfolio summary:\n\n• Total Value: ${formatCurrency(stockValue)}\n• Annual Dividends: ${formatCurrency(dividends)}\n• Holdings: ${sharePortfolio.length} stocks`;
        response.result = {
          type: "stocks",
          data: {
            totalValue: stockValue,
            dividends: dividends,
            holdings: sharePortfolio.length,
            topHoldings: sharePortfolio.slice(0, 3).map(s => ({
              symbol: s.symbol,
              value: s.quantity * s.currentPrice
            }))
          }
        };
        response.action = { label: "View Share Portfolio", path: "/share-portfolio" };
        break;

      case "property":
        const properties = portfolio.investments?.properties || [];
        const propertyValue = properties.reduce((sum, p) => sum + p.value, 0);
        const rentalIncome = properties.reduce((sum, p) => sum + p.rental_income, 0);
        const mortgages = properties.reduce((sum, p) => sum + p.mortgage_amount, 0);
        
        response.content = `Your property portfolio:\n\n• Total Value: ${formatCurrency(propertyValue)}\n• Annual Rental: ${formatCurrency(rentalIncome)}\n• Mortgages: ${formatCurrency(mortgages)}\n• Equity: ${formatCurrency(propertyValue - mortgages)}`;
        response.action = { label: "View Properties", path: "/property-portfolio" };
        break;

      case "super":
        const totalSuper = familyMembers.reduce((sum, m) => sum + (m.superBalance || 0), 0);
        
        response.content = `Total superannuation balance: ${formatCurrency(totalSuper)}\n\nFamily members:\n${familyMembers.map(m => `• ${m.name}: ${formatCurrency(m.superBalance || 0)}`).join('\n')}`;
        response.action = { label: "Open SMSF Optimizer", path: "/smsf-optimizer" };
        break;

      case "bas":
        response.content = "I can help you with your BAS! The BAS Calculator lets you:\n\n• Calculate GST on sales and purchases\n• Track PAYG withholding\n• Import data from Xero/MYOB\n• Export for ATO lodgement\n\nWould you like me to open the BAS Calculator?";
        response.action = { label: "Open BAS Calculator", path: "/bas-calculator" };
        break;

      case "cgt":
        response.content = "For Capital Gains Tax calculations, I can help you:\n\n• Track CGT events\n• Calculate 50% discount eligibility\n• Manage loss carry-forwards\n• Run sell scenarios\n\nThe CGT page has all your historical events and calculator.";
        response.action = { label: "Open CGT Calculator", path: "/cgt" };
        break;

      case "loan":
        const totalDebt = portfolio.summary?.totalDebt || 942000;
        response.content = `Your total debt: ${formatCurrency(totalDebt)}\n\nI can help you:\n• Calculate loan repayments\n• Compare interest rates\n• Model debt payoff strategies`;
        response.action = { label: "Open Loan Calculator", path: "/loan-calculator" };
        break;

      case "soa":
        response.content = "I can help you generate a Statement of Advice. The SOA Generator creates RG 175 compliant documents with:\n\n• Client details\n• Risk profile summary\n• Recommendations\n• Fee disclosure";
        response.action = { label: "Open SOA Generator", path: "/statement-of-advice" };
        break;

      case "navigate":
        // Extract destination
        const destinations = {
          "dashboard": "/dashboard",
          "tax": "/tax-analysis-sync",
          "property": "/property-portfolio",
          "shares": "/share-portfolio",
          "budget": "/budget",
          "bas": "/bas-calculator",
          "cgt": "/cgt",
          "super": "/smsf-optimizer",
          "loan": "/loan-calculator",
          "report": "/reports",
          "soa": "/statement-of-advice",
          "risk": "/risk-profiler",
          "calendar": "/tax-calendar",
          "recommendations": "/recommendations",
        };
        
        for (const [key, path] of Object.entries(destinations)) {
          if (lowerMessage.includes(key)) {
            response.content = `Taking you to ${key}...`;
            setTimeout(() => navigate(path), 500);
            break;
          }
        }
        if (!response.content) {
          response.content = "Where would you like to go? I can take you to: Dashboard, Tax Analysis, Properties, Shares, Budget, BAS Calculator, CGT, Super, Loans, Reports, or SOA Generator.";
        }
        break;

      case "report":
        response.content = "I can generate various reports:\n\n• Full portfolio summary\n• Tax analysis report\n• Property performance\n• Investment recommendations\n\nThe Report Generator has all export options.";
        response.action = { label: "Open Reports", path: "/reports" };
        break;

      case "help":
        response.content = "I can help you with:\n\n🧮 **Calculations**: Tax, CGT, loan repayments, cashflow\n📊 **Scenarios**: What-if analysis, sell stocks, property changes\n📍 **Navigation**: Go to any page by asking\n📋 **Reports**: Generate summaries and exports\n⚡ **Quick Actions**: BAS, risk profile, recommendations\n\nJust ask naturally! For example: 'What's my tax?', 'Show cashflow', or 'What if I sell all stocks?'";
        break;

      default:
        response.content = "I'm not sure what you're looking for. Try asking about:\n\n• Tax calculations\n• Investment scenarios\n• Cashflow analysis\n• Risk profile\n• BAS/GST\n• Property or shares\n\nOr say 'help' for more options!";
    }

    return response;
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    setActiveResult(null);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const response = await processCommand(input);

    const botMessage = {
      id: Date.now() + 1,
      type: "bot",
      content: response.content,
      result: response.result,
      action: response.action,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, botMessage]);
    if (response.result) {
      setActiveResult(response.result);
    }
    setIsProcessing(false);
  };

  const handleQuickAction = (command) => {
    setInput(command);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const COLORS = ['#0F392B', '#10B981', '#3B82F6', '#D4AF37', '#EF4444'];

  return (
    <Layout>
      <div className="space-y-6" data-testid="copilot-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-[#D4AF37]" />
              Financial Copilot
            </h1>
            <p className="text-muted-foreground mt-1">
              Your AI assistant for financial tasks and analysis
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3 text-[#D4AF37]" />
            Demo Mode
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Chat with Copilot
                </CardTitle>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${msg.type === 'user' ? 'order-1' : ''}`}>
                        <div className={`flex items-start gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.type === 'user' ? 'bg-[#0F392B]' : 'bg-[#D4AF37]'
                          }`}>
                            {msg.type === 'user' ? (
                              <User className="h-4 w-4 text-white" />
                            ) : (
                              <Bot className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div className={`p-3 rounded-lg ${
                            msg.type === 'user' 
                              ? 'bg-[#0F392B] text-white' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm whitespace-pre-line">{msg.content}</p>
                            {msg.action && (
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="mt-2 w-full"
                                onClick={() => navigate(msg.action.path)}
                              >
                                {msg.action.label} <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="p-3 rounded-lg bg-muted">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything... e.g., 'Calculate my tax' or 'What if I sell all stocks?'"
                    className="flex-1"
                    disabled={isProcessing}
                  />
                  <Button onClick={handleSend} disabled={isProcessing || !input.trim()} className="bg-[#0F392B]">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar with Quick Actions and Results */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#D4AF37]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <Button 
                    key={i}
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={() => handleQuickAction(action.command)}
                  >
                    <action.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Active Result Display */}
            {activeResult && (
              <Card className="border-t-4 border-t-[#D4AF37]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {activeResult.title || "Result"}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setActiveResult(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeResult.type === "tax" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-muted rounded text-center">
                          <p className="text-xs text-muted-foreground">Gross Income</p>
                          <p className="font-bold">{formatCurrency(activeResult.data.income)}</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded text-center">
                          <p className="text-xs text-muted-foreground">Tax Payable</p>
                          <p className="font-bold text-red-600">{formatCurrency(activeResult.data.tax)}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-[#0F392B]/5 rounded">
                        <div className="flex justify-between text-sm">
                          <span>Net Income</span>
                          <span className="font-bold text-[#0F392B]">{formatCurrency(activeResult.data.netIncome)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Effective Rate</span>
                          <span>{activeResult.data.effectiveRate}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeResult.type === "scenario" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-muted rounded text-center">
                          <p className="text-xs text-muted-foreground">Total Value</p>
                          <p className="font-bold">{formatCurrency(activeResult.data.totalValue)}</p>
                        </div>
                        <div className="p-2 bg-muted rounded text-center">
                          <p className="text-xs text-muted-foreground">Cost Base</p>
                          <p className="font-bold">{formatCurrency(activeResult.data.costBase)}</p>
                        </div>
                      </div>
                      <div className={`p-2 rounded text-center ${activeResult.data.capitalGain >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className="text-xs text-muted-foreground">Capital {activeResult.data.capitalGain >= 0 ? 'Gain' : 'Loss'}</p>
                        <p className={`font-bold ${activeResult.data.capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(activeResult.data.capitalGain))}
                        </p>
                      </div>
                      <div className="p-3 bg-[#0F392B]/5 rounded">
                        <div className="flex justify-between text-sm">
                          <span>Net Proceeds</span>
                          <span className="font-bold text-[#0F392B]">{formatCurrency(activeResult.data.netProceeds)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>CGT (50% discount)</span>
                          <span>{formatCurrency(activeResult.data.cgtPayable)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeResult.type === "cashflow" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-green-50 rounded text-center">
                          <p className="text-[10px] text-muted-foreground">Income</p>
                          <p className="font-bold text-green-600 text-sm">{formatCurrency(activeResult.data.income)}</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded text-center">
                          <p className="text-[10px] text-muted-foreground">Expenses</p>
                          <p className="font-bold text-red-600 text-sm">{formatCurrency(activeResult.data.expenses)}</p>
                        </div>
                        <div className={`p-2 rounded text-center ${activeResult.data.surplus >= 0 ? 'bg-[#0F392B]/10' : 'bg-amber-50'}`}>
                          <p className="text-[10px] text-muted-foreground">Surplus</p>
                          <p className="font-bold text-sm">{formatCurrency(activeResult.data.surplus)}</p>
                        </div>
                      </div>
                      <ChartContainer height={120}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activeResult.data.projection}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Area type="monotone" dataKey="cumulative" stroke="#0F392B" fill="#0F392B" fillOpacity={0.3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  )}

                  {activeResult.type === "stocks" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-muted rounded text-center">
                          <p className="text-xs text-muted-foreground">Total Value</p>
                          <p className="font-bold">{formatCurrency(activeResult.data.totalValue)}</p>
                        </div>
                        <div className="p-2 bg-green-50 rounded text-center">
                          <p className="text-xs text-muted-foreground">Dividends p.a.</p>
                          <p className="font-bold text-green-600">{formatCurrency(activeResult.data.dividends)}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Top Holdings</p>
                        {activeResult.data.topHoldings.map((h, i) => (
                          <div key={i} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                            <span>{h.symbol}</span>
                            <span className="font-medium">{formatCurrency(h.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Try Asking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="cursor-pointer hover:text-foreground" onClick={() => handleQuickAction("What if property prices drop 10%?")}>
                    "What if property prices drop 10%?"
                  </p>
                  <p className="cursor-pointer hover:text-foreground" onClick={() => handleQuickAction("How can I reduce my tax?")}>
                    "How can I reduce my tax?"
                  </p>
                  <p className="cursor-pointer hover:text-foreground" onClick={() => handleQuickAction("Show my retirement projection")}>
                    "Show my retirement projection"
                  </p>
                  <p className="cursor-pointer hover:text-foreground" onClick={() => handleQuickAction("Generate a report")}>
                    "Generate a report"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default Copilot;
