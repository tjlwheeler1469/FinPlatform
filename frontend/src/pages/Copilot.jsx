import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Zap,
  Bell,
  Clock,
  Globe,
  HelpCircle,
  BookOpen,
  GraduationCap,
  MessageCircle,
  Info
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
} from "recharts";

// Top 15 Global Languages
const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "zh", name: "中文 (Chinese)", flag: "🇨🇳" },
  { code: "es", name: "Español (Spanish)", flag: "🇪🇸" },
  { code: "hi", name: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "ar", name: "العربية (Arabic)", flag: "🇸🇦" },
  { code: "pt", name: "Português (Portuguese)", flag: "🇧🇷" },
  { code: "bn", name: "বাংলা (Bengali)", flag: "🇧🇩" },
  { code: "ru", name: "Русский (Russian)", flag: "🇷🇺" },
  { code: "ja", name: "日本語 (Japanese)", flag: "🇯🇵" },
  { code: "de", name: "Deutsch (German)", flag: "🇩🇪" },
  { code: "fr", name: "Français (French)", flag: "🇫🇷" },
  { code: "ko", name: "한국어 (Korean)", flag: "🇰🇷" },
  { code: "vi", name: "Tiếng Việt (Vietnamese)", flag: "🇻🇳" },
  { code: "it", name: "Italiano (Italian)", flag: "🇮🇹" },
  { code: "tr", name: "Türkçe (Turkish)", flag: "🇹🇷" },
];

// Translations for key phrases
const TRANSLATIONS = {
  en: {
    greeting: "Hi! I'm your Financial Copilot. I can help with tax calculations, investment scenarios, budgeting, and financial planning. Ask me anything!",
    inputPlaceholder: "Ask me anything about finance, tax, investments...",
    quickActions: "Quick Actions",
    smartAlerts: "Smart Alerts",
    tryAsking: "Try Asking",
    language: "Language",
    demoMode: "Demo Mode",
    send: "Send",
  },
  zh: {
    greeting: "你好！我是您的财务助手。我可以帮助您进行税务计算、投资场景分析、预算和财务规划。有什么问题尽管问！",
    inputPlaceholder: "询问有关财务、税务、投资的任何问题...",
    quickActions: "快速操作",
    smartAlerts: "智能提醒",
    tryAsking: "试着问",
    language: "语言",
    demoMode: "演示模式",
    send: "发送",
  },
  es: {
    greeting: "¡Hola! Soy tu Copiloto Financiero. Puedo ayudarte con cálculos de impuestos, escenarios de inversión, presupuestos y planificación financiera. ¡Pregúntame lo que quieras!",
    inputPlaceholder: "Pregúntame sobre finanzas, impuestos, inversiones...",
    quickActions: "Acciones Rápidas",
    smartAlerts: "Alertas Inteligentes",
    tryAsking: "Prueba Preguntar",
    language: "Idioma",
    demoMode: "Modo Demo",
    send: "Enviar",
  },
  hi: {
    greeting: "नमस्ते! मैं आपका वित्तीय सहायक हूं। मैं कर गणना, निवेश परिदृश्य, बजट और वित्तीय योजना में मदद कर सकता हूं। कुछ भी पूछें!",
    inputPlaceholder: "वित्त, कर, निवेश के बारे में कुछ भी पूछें...",
    quickActions: "त्वरित कार्रवाई",
    smartAlerts: "स्मार्ट अलर्ट",
    tryAsking: "पूछने का प्रयास करें",
    language: "भाषा",
    demoMode: "डेमो मोड",
    send: "भेजें",
  },
  ar: {
    greeting: "مرحباً! أنا مساعدك المالي. يمكنني المساعدة في حسابات الضرائب وسيناريوهات الاستثمار والميزانية والتخطيط المالي. اسألني أي شيء!",
    inputPlaceholder: "اسألني عن المالية والضرائب والاستثمارات...",
    quickActions: "إجراءات سريعة",
    smartAlerts: "تنبيهات ذكية",
    tryAsking: "جرب السؤال",
    language: "اللغة",
    demoMode: "وضع العرض",
    send: "إرسال",
  },
  pt: {
    greeting: "Olá! Sou seu Copiloto Financeiro. Posso ajudar com cálculos de impostos, cenários de investimento, orçamento e planejamento financeiro. Pergunte-me qualquer coisa!",
    inputPlaceholder: "Pergunte-me sobre finanças, impostos, investimentos...",
    quickActions: "Ações Rápidas",
    smartAlerts: "Alertas Inteligentes",
    tryAsking: "Tente Perguntar",
    language: "Idioma",
    demoMode: "Modo Demo",
    send: "Enviar",
  },
  bn: {
    greeting: "হ্যালো! আমি আপনার আর্থিক সহকারী। আমি কর গণনা, বিনিয়োগ পরিস্থিতি, বাজেট এবং আর্থিক পরিকল্পনায় সাহায্য করতে পারি। যেকোনো কিছু জিজ্ঞাসা করুন!",
    inputPlaceholder: "অর্থ, কর, বিনিয়োগ সম্পর্কে জিজ্ঞাসা করুন...",
    quickActions: "দ্রুত কার্যক্রম",
    smartAlerts: "স্মার্ট সতর্কতা",
    tryAsking: "জিজ্ঞাসা করুন",
    language: "ভাষা",
    demoMode: "ডেমো মোড",
    send: "পাঠান",
  },
  ru: {
    greeting: "Привет! Я ваш финансовый помощник. Я могу помочь с расчетами налогов, инвестиционными сценариями, бюджетированием и финансовым планированием. Спрашивайте что угодно!",
    inputPlaceholder: "Спросите о финансах, налогах, инвестициях...",
    quickActions: "Быстрые действия",
    smartAlerts: "Умные оповещения",
    tryAsking: "Попробуйте спросить",
    language: "Язык",
    demoMode: "Демо режим",
    send: "Отправить",
  },
  ja: {
    greeting: "こんにちは！私はあなたのファイナンシャルコパイロットです。税金計算、投資シナリオ、予算、財務計画のお手伝いができます。何でも聞いてください！",
    inputPlaceholder: "財務、税金、投資について何でも聞いてください...",
    quickActions: "クイックアクション",
    smartAlerts: "スマートアラート",
    tryAsking: "質問してみる",
    language: "言語",
    demoMode: "デモモード",
    send: "送信",
  },
  de: {
    greeting: "Hallo! Ich bin Ihr Finanz-Copilot. Ich kann bei Steuerberechnungen, Investitionsszenarien, Budgetierung und Finanzplanung helfen. Fragen Sie mich alles!",
    inputPlaceholder: "Fragen Sie mich zu Finanzen, Steuern, Investitionen...",
    quickActions: "Schnellaktionen",
    smartAlerts: "Smarte Warnungen",
    tryAsking: "Versuchen Sie zu fragen",
    language: "Sprache",
    demoMode: "Demo-Modus",
    send: "Senden",
  },
  fr: {
    greeting: "Bonjour! Je suis votre Copilote Financier. Je peux vous aider avec les calculs d'impôts, les scénarios d'investissement, le budget et la planification financière. Demandez-moi n'importe quoi!",
    inputPlaceholder: "Demandez-moi sur les finances, impôts, investissements...",
    quickActions: "Actions Rapides",
    smartAlerts: "Alertes Intelligentes",
    tryAsking: "Essayez de demander",
    language: "Langue",
    demoMode: "Mode Démo",
    send: "Envoyer",
  },
  ko: {
    greeting: "안녕하세요! 저는 당신의 금융 코파일럿입니다. 세금 계산, 투자 시나리오, 예산 및 재무 계획을 도와드릴 수 있습니다. 무엇이든 물어보세요!",
    inputPlaceholder: "금융, 세금, 투자에 대해 물어보세요...",
    quickActions: "빠른 작업",
    smartAlerts: "스마트 알림",
    tryAsking: "질문해 보세요",
    language: "언어",
    demoMode: "데모 모드",
    send: "보내기",
  },
  vi: {
    greeting: "Xin chào! Tôi là Trợ lý Tài chính của bạn. Tôi có thể giúp tính thuế, kịch bản đầu tư, ngân sách và lập kế hoạch tài chính. Hãy hỏi tôi bất cứ điều gì!",
    inputPlaceholder: "Hỏi tôi về tài chính, thuế, đầu tư...",
    quickActions: "Hành động nhanh",
    smartAlerts: "Cảnh báo thông minh",
    tryAsking: "Thử hỏi",
    language: "Ngôn ngữ",
    demoMode: "Chế độ Demo",
    send: "Gửi",
  },
  it: {
    greeting: "Ciao! Sono il tuo Copilota Finanziario. Posso aiutarti con calcoli fiscali, scenari di investimento, budget e pianificazione finanziaria. Chiedimi qualsiasi cosa!",
    inputPlaceholder: "Chiedimi di finanze, tasse, investimenti...",
    quickActions: "Azioni Rapide",
    smartAlerts: "Avvisi Intelligenti",
    tryAsking: "Prova a chiedere",
    language: "Lingua",
    demoMode: "Modalità Demo",
    send: "Invia",
  },
  tr: {
    greeting: "Merhaba! Ben sizin Finansal Yardımcınızım. Vergi hesaplamaları, yatırım senaryoları, bütçeleme ve finansal planlama konusunda yardımcı olabilirim. Bana her şeyi sorabilirsiniz!",
    inputPlaceholder: "Finans, vergi, yatırımlar hakkında sorun...",
    quickActions: "Hızlı İşlemler",
    smartAlerts: "Akıllı Uyarılar",
    tryAsking: "Sormayı Deneyin",
    language: "Dil",
    demoMode: "Demo Modu",
    send: "Gönder",
  },
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0
  }).format(value);
};

// Enhanced intent patterns including general knowledge
const INTENT_PATTERNS = {
  bas: ["bas", "business activity statement", "gst", "payg", "lodge", "ato"],
  tax: ["tax", "deduction", "taxable", "income tax", "tax return", "stage 3", "bracket", "marginal"],
  scenario: ["scenario", "what if", "sell", "buy", "simulate", "projection", "forecast"],
  cashflow: ["cashflow", "cash flow", "budget", "expenses", "income", "spending"],
  risk: ["risk", "profile", "tolerance", "aggressive", "conservative", "balanced"],
  stocks: ["stock", "share", "portfolio", "dividend", "cba", "bhp", "asx", "etf"],
  property: ["property", "real estate", "rental", "negative gearing", "yield", "stamp duty"],
  super: ["super", "superannuation", "smsf", "retirement", "pension", "contribution"],
  cgt: ["cgt", "capital gain", "capital loss", "50% discount", "cost base"],
  loan: ["loan", "mortgage", "repayment", "interest rate", "debt", "lvr"],
  soa: ["soa", "statement of advice", "recommendation", "adviser"],
  navigate: ["go to", "show me", "open", "navigate", "take me"],
  calculate: ["calculate", "compute", "work out", "figure out", "how much"],
  report: ["report", "export", "download", "pdf", "summary"],
  help: ["help", "what can", "how do", "explain", "guide", "tutorial"],
  // General knowledge patterns
  whatIs: ["what is", "what are", "what's", "define", "meaning of", "explain"],
  howTo: ["how to", "how do i", "how can i", "steps to", "process for"],
  compare: ["compare", "difference between", "versus", "vs", "better"],
  strategy: ["strategy", "best way", "should i", "recommend", "advice"],
  australia: ["australia", "australian", "ato", "asic", "apra"],
};

// Comprehensive Financial Knowledge Base
const KNOWLEDGE_BASE = {
  // Tax concepts
  "franking credits": "Franking credits (imputation credits) represent tax already paid by Australian companies on dividends. If you receive a $70 dividend with $30 franking credit, the grossed-up amount is $100. You pay tax on $100 but get a $30 credit, potentially resulting in a refund if your tax rate is below 30%.",
  "negative gearing": "Negative gearing occurs when the costs of owning an investment property (interest, maintenance, depreciation) exceed the rental income. In Australia, these losses can be deducted from your other income, reducing your overall tax. It's most beneficial for high-income earners.",
  "stage 3 tax cuts": "From July 1, 2024, Australia's Stage 3 tax cuts restructured tax brackets: 0% up to $18,200, 16% from $18,201-$45,000, 30% from $45,001-$135,000, 37% from $135,001-$190,000, and 45% above $190,000. This replaces the previous 32.5% and 37% brackets.",
  "medicare levy": "The Medicare Levy is 2% of your taxable income to help fund Australia's public health system. There's also a Medicare Levy Surcharge (1-1.5%) for high-income earners without private hospital cover.",
  "division 7a": "Division 7A prevents private companies from making tax-free distributions to shareholders/associates. Loans from a company to shareholders must be on a complying loan agreement (benchmark interest rate, max 7-year term) or be treated as unfranked dividends.",
  
  // Investment concepts
  "etf": "ETFs (Exchange Traded Funds) are investment funds traded on stock exchanges. They typically track an index (like ASX200), offer diversification, low fees (0.1-0.5% p.a.), and liquidity. Popular Australian ETFs include VAS (Australian shares), VGS (international), and VDHG (diversified).",
  "dollar cost averaging": "Dollar Cost Averaging (DCA) involves investing fixed amounts at regular intervals regardless of market conditions. This reduces the impact of volatility and removes the need to time the market. E.g., investing $500/month automatically.",
  "compound interest": "Compound interest is earning interest on both your principal and accumulated interest. With $10,000 at 7% p.a. compounded annually: Year 1: $10,700, Year 5: $14,026, Year 20: $38,697. The Rule of 72: divide 72 by the interest rate to estimate doubling time.",
  "asset allocation": "Asset allocation divides investments across asset classes (shares, bonds, property, cash) based on risk tolerance and goals. Conservative: 30% growth/70% defensive. Balanced: 50/50. Growth: 70% growth/30% defensive. Aggressive: 90% growth/10% defensive.",
  
  // Super concepts  
  "concessional contributions": "Concessional super contributions (before-tax) include employer SG, salary sacrifice, and personal deductible contributions. The cap is $30,000/year (2024-25). Tax: 15% in super vs your marginal rate outside. Catch-up contributions allow unused caps from previous 5 years if balance under $500k.",
  "non-concessional contributions": "Non-concessional super contributions are after-tax. The annual cap is $120,000 (or $360,000 using bring-forward for under 75s). These aren't taxed in super. Useful for building tax-free retirement savings.",
  "smsf": "A Self-Managed Super Fund (SMSF) is a private super fund you manage yourself. Benefits: control, flexibility, direct property investment. Requirements: 1-6 members, annual audit, comply with super laws. Typical costs: $2,000-5,000/year. Generally suitable for balances over $200,000.",
  "preservation age": "Preservation age is when you can access your super if retired. It's 60 for those born after July 1, 1964 (55-60 for earlier births). You can access earlier for severe financial hardship, terminal illness, or compassionate grounds.",
  
  // Property concepts
  "stamp duty": "Stamp duty is a state government tax on property purchases. Rates vary by state and value. NSW example: $8,990 + 4.5% of value over $310k. First home buyers often get concessions or exemptions. Can add 3-5% to purchase costs.",
  "lvr": "Loan-to-Value Ratio (LVR) is your loan amount as a percentage of property value. LVR = (Loan / Property Value) × 100. Above 80% LVR typically requires Lenders Mortgage Insurance (LMI). Lower LVR = better interest rates.",
  "depreciation": "Property depreciation allows tax deductions for wear and tear on building (2.5% p.a. for 40 years) and fixtures (varied rates). A depreciation schedule from a quantity surveyor can claim $5,000-15,000+ annually, especially for newer properties.",
  
  // Planning concepts
  "bucket strategy": "The bucket strategy divides retirement savings into time-based 'buckets': Short-term (1-3 years) in cash, Medium-term (4-10 years) in balanced investments, Long-term (10+ years) in growth assets. Provides income security while maintaining growth exposure.",
  "4% rule": "The 4% rule suggests withdrawing 4% of your portfolio in Year 1, then adjusting for inflation. A $1M portfolio would provide ~$40,000/year. Based on US data, it aims for a 30-year portfolio survival rate. Australian equivalent often suggests 3.5-4.5% due to different market conditions.",
};

// Quick action suggestions
const QUICK_ACTIONS = [
  { icon: Calculator, label: "Calculate my tax", command: "Calculate my tax for this year" },
  { icon: TrendingUp, label: "Run stock scenario", command: "What if I sell all my stocks?" },
  { icon: Wallet, label: "Show cashflow", command: "Show my monthly cashflow" },
  { icon: Shield, label: "Check risk profile", command: "What's my risk profile?" },
  { icon: FileText, label: "BAS help", command: "Help me with my BAS" },
  { icon: HelpCircle, label: "Explain concepts", command: "Explain franking credits" },
];

const Copilot = () => {
  const navigate = useNavigate();
  const { portfolio, familyMembers, sharePortfolio, budget, trust, company } = usePortfolio();
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("copilot_language") || "en";
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeResult, setActiveResult] = useState(null);
  const [smartAlerts, setSmartAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    const saved = localStorage.getItem("dismissed_alerts");
    return saved ? JSON.parse(saved) : [];
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Initialize with greeting in selected language
  useEffect(() => {
    setMessages([{
      id: 1,
      type: "bot",
      content: t.greeting,
      timestamp: new Date().toISOString(),
    }]);
  }, [language]);

  // Generate Smart Alerts based on context
  useEffect(() => {
    const alerts = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    // BAS due dates (quarterly)
    const basQuarters = [
      { month: 1, day: 28, label: "Q2 BAS (Oct-Dec)", period: "Q2" },
      { month: 4, day: 28, label: "Q3 BAS (Jan-Mar)", period: "Q3" },
      { month: 6, day: 28, label: "Q4 BAS (Apr-Jun)", period: "Q4" },
      { month: 9, day: 28, label: "Q1 BAS (Jul-Sep)", period: "Q1" },
    ];

    basQuarters.forEach(q => {
      const dueDate = new Date(today.getFullYear(), q.month, q.day);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil > 0 && daysUntil <= 14) {
        alerts.push({
          id: `bas-${q.period}`,
          type: "urgent",
          icon: Calendar,
          title: `${q.label} Due Soon`,
          description: `${daysUntil} days remaining to lodge`,
          action: { label: "Open BAS Calculator", path: "/bas-calculator" },
        });
      } else if (daysUntil <= 0 && daysUntil > -7) {
        alerts.push({
          id: `bas-${q.period}-overdue`,
          type: "critical",
          icon: AlertTriangle,
          title: `${q.label} OVERDUE`,
          description: `${Math.abs(daysUntil)} days overdue - lodge immediately`,
          action: { label: "Open BAS Calculator", path: "/bas-calculator" },
        });
      }
    });

    // Tax return deadline (October 31 for self-lodgers)
    const taxDeadline = new Date(today.getFullYear(), 9, 31);
    const daysUntilTax = Math.ceil((taxDeadline - today) / (1000 * 60 * 60 * 24));
    if (daysUntilTax > 0 && daysUntilTax <= 30 && currentMonth >= 6) {
      alerts.push({
        id: "tax-return",
        type: "warning",
        icon: FileText,
        title: "Tax Return Due Soon",
        description: `${daysUntilTax} days until Oct 31 deadline`,
        action: { label: "View Tax Analysis", path: "/tax-analysis-sync" },
      });
    }

    // Portfolio alerts
    const totalAssets = portfolio.summary?.totalAssets || 0;
    const totalDebt = portfolio.summary?.totalDebt || 0;
    const debtRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;

    if (debtRatio > 60) {
      alerts.push({
        id: "high-debt",
        type: "warning",
        icon: TrendingUp,
        title: "High Debt-to-Asset Ratio",
        description: `${debtRatio.toFixed(0)}% debt ratio - consider reviewing`,
        action: { label: "View Loan Calculator", path: "/loan-calculator" },
      });
    }

    // Super contribution reminder (end of financial year)
    if (currentMonth >= 4 && currentMonth <= 5) {
      alerts.push({
        id: "super-contrib",
        type: "info",
        icon: PieChart,
        title: "Super Contribution Deadline",
        description: "Maximize contributions before June 30",
        action: { label: "Open SMSF Optimizer", path: "/smsf-optimizer" },
      });
    }

    // Risk profile check
    const savedProfile = localStorage.getItem("wheeler_risk_profiles");
    if (!savedProfile) {
      alerts.push({
        id: "risk-profile",
        type: "info",
        icon: Shield,
        title: "Complete Risk Profile",
        description: "Get personalized investment recommendations",
        action: { label: "Take Assessment", path: "/risk-profiler" },
      });
    }

    // Filter out dismissed alerts
    const filteredAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));
    setSmartAlerts(filteredAlerts);
  }, [portfolio, dismissedAlerts]);

  // Save language preference
  useEffect(() => {
    localStorage.setItem("copilot_language", language);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const dismissAlert = (alertId) => {
    const updated = [...dismissedAlerts, alertId];
    setDismissedAlerts(updated);
    localStorage.setItem("dismissed_alerts", JSON.stringify(updated));
    toast.success("Alert dismissed");
  };

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

  // Search knowledge base
  const searchKnowledge = (query) => {
    const lowerQuery = query.toLowerCase();
    for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
      if (lowerQuery.includes(key)) {
        return { topic: key, explanation: value };
      }
    }
    return null;
  };

  // Calculate tax helper
  const calculateTax = (income) => {
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
    const knowledge = searchKnowledge(userMessage);
    
    let response = { content: "", result: null, action: null };

    // Check knowledge base first for "what is" type questions
    if ((intent === "whatIs" || intent === "help") && knowledge) {
      response.content = `**${knowledge.topic.charAt(0).toUpperCase() + knowledge.topic.slice(1)}**\n\n${knowledge.explanation}`;
      return response;
    }

    // Check for specific concept explanations
    if (lowerMessage.includes("explain") || lowerMessage.includes("what is") || lowerMessage.includes("what are")) {
      if (knowledge) {
        response.content = `**${knowledge.topic.charAt(0).toUpperCase() + knowledge.topic.slice(1)}**\n\n${knowledge.explanation}`;
        return response;
      }
    }

    switch (intent) {
      case "tax":
        const primaryIncome = familyMembers[0]?.taxableIncome || 185000;
        const tax = calculateTax(primaryIncome);
        const effectiveRate = ((tax / primaryIncome) * 100).toFixed(1);
        
        response.content = `Based on your primary income of ${formatCurrency(primaryIncome)}, your estimated tax is ${formatCurrency(tax)} (effective rate: ${effectiveRate}%).\n\n**2024-25 Tax Brackets:**\n• $0-$18,200: 0%\n• $18,201-$45,000: 16%\n• $45,001-$135,000: 30%\n• $135,001-$190,000: 37%\n• $190,001+: 45%`;
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
          const cgt = gain > 0 ? gain * 0.5 * 0.37 : 0;
          
          response.content = `**Sell All Stocks Scenario:**\n\n• Total Value: ${formatCurrency(totalStockValue)}\n• Cost Base: ${formatCurrency(totalCost)}\n• Capital ${gain >= 0 ? 'Gain' : 'Loss'}: ${formatCurrency(Math.abs(gain))}\n• CGT (50% discount, 37% bracket): ${formatCurrency(cgt)}\n• Net Proceeds: ${formatCurrency(totalStockValue - cgt)}\n\n*Note: 50% CGT discount applies if held >12 months*`;
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
          response.content = "I can run various scenarios:\n\n• **Stock scenarios**: 'What if I sell all my stocks?'\n• **Property scenarios**: 'What if property prices drop 10%?'\n• **Retirement**: 'Show retirement projection'\n• **Debt payoff**: 'What if I pay extra on mortgage?'\n\nFor advanced modeling, try Strategic Planning.";
          response.action = { label: "Open Strategic Planning", path: "/strategic-planning" };
        }
        break;

      case "cashflow":
        const monthlyIncome = Object.values(budget.income).reduce((a, b) => a + b, 0);
        const monthlyExpenses = Object.values(budget.expenses).reduce((a, b) => a + b, 0);
        const surplus = monthlyIncome - monthlyExpenses;
        
        response.content = `**Monthly Cashflow Summary:**\n\n• Income: ${formatCurrency(monthlyIncome)}\n• Expenses: ${formatCurrency(monthlyExpenses)}\n• ${surplus >= 0 ? 'Surplus' : 'Shortfall'}: ${formatCurrency(Math.abs(surplus))}\n\n${surplus >= 0 ? '✅ Positive cashflow - consider investing surplus' : '⚠️ Review expenses to improve position'}`;
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
          response.content = `**Your Risk Profile: ${profile.profile}**\n\nScore: ${profile.score}/40\nExpected Return: ${profile.expectedReturn}\n\nThis profile suggests:\n• ${profile.profile === 'Conservative' ? 'Focus on capital preservation with stable income' : profile.profile === 'High Growth' ? 'Comfortable with volatility for maximum growth' : 'Balanced approach between growth and stability'}`;
        } else {
          response.content = "You haven't completed a risk assessment yet.\n\n**Why it matters:**\n• Personalized investment recommendations\n• Appropriate asset allocation\n• Better decision-making during volatility\n\nTake 2 minutes to complete the questionnaire.";
        }
        response.action = { label: "Open Risk Profiler", path: "/risk-profiler" };
        break;

      case "stocks":
        const stockValue = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
        const dividends = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.currentPrice * s.dividendYield / 100), 0);
        
        response.content = `**Share Portfolio Summary:**\n\n• Total Value: ${formatCurrency(stockValue)}\n• Annual Dividends: ${formatCurrency(dividends)}\n• Yield: ${stockValue > 0 ? ((dividends / stockValue) * 100).toFixed(1) : 0}%\n• Holdings: ${sharePortfolio.length} stocks\n\n**Top 3 Holdings:**\n${sharePortfolio.slice(0, 3).map(s => `• ${s.symbol}: ${formatCurrency(s.quantity * s.currentPrice)}`).join('\n')}`;
        response.action = { label: "View Share Portfolio", path: "/share-portfolio" };
        break;

      case "property":
        const properties = portfolio.investments?.properties || [];
        const propertyValue = properties.reduce((sum, p) => sum + p.value, 0);
        const rentalIncome = properties.reduce((sum, p) => sum + p.rental_income, 0);
        const mortgages = properties.reduce((sum, p) => sum + p.mortgage_amount, 0);
        const equity = propertyValue - mortgages;
        
        response.content = `**Property Portfolio:**\n\n• Total Value: ${formatCurrency(propertyValue)}\n• Mortgages: ${formatCurrency(mortgages)}\n• Equity: ${formatCurrency(equity)}\n• Annual Rental: ${formatCurrency(rentalIncome)}\n• Gross Yield: ${propertyValue > 0 ? ((rentalIncome / propertyValue) * 100).toFixed(1) : 0}%\n• LVR: ${propertyValue > 0 ? ((mortgages / propertyValue) * 100).toFixed(0) : 0}%`;
        response.action = { label: "View Properties", path: "/property-portfolio" };
        break;

      case "super":
        const totalSuper = familyMembers.reduce((sum, m) => sum + (m.superBalance || 0), 0);
        
        response.content = `**Superannuation Summary:**\n\nTotal Balance: ${formatCurrency(totalSuper)}\n\n**By Member:**\n${familyMembers.map(m => `• ${m.name}: ${formatCurrency(m.superBalance || 0)}`).join('\n')}\n\n**Contribution Caps 2024-25:**\n• Concessional: $30,000/year\n• Non-concessional: $120,000/year`;
        response.action = { label: "Open SMSF Optimizer", path: "/smsf-optimizer" };
        break;

      case "bas":
        response.content = "**BAS (Business Activity Statement) Help:**\n\nI can help you with:\n• GST calculation (G1-G20 fields)\n• PAYG withholding (W1-W5)\n• PAYG instalments (T7-T11)\n• Import from Xero/MYOB\n\n**Due Dates:**\n• Q1 (Jul-Sep): Oct 28\n• Q2 (Oct-Dec): Feb 28\n• Q3 (Jan-Mar): Apr 28\n• Q4 (Apr-Jun): Jul 28";
        response.action = { label: "Open BAS Calculator", path: "/bas-calculator" };
        break;

      case "cgt":
        response.content = "**Capital Gains Tax (CGT) Guide:**\n\n**Key Rules:**\n• 50% discount if asset held >12 months\n• CGT added to taxable income\n• Losses can offset gains\n• Main residence is exempt\n\n**Cost Base includes:**\n• Purchase price\n• Stamp duty, legal fees\n• Improvements\n• Holding costs (in some cases)";
        response.action = { label: "Open CGT Calculator", path: "/cgt" };
        break;

      case "loan":
        const totalDebt = portfolio.summary?.totalDebt || 942000;
        response.content = `**Debt Overview:**\n\nTotal Debt: ${formatCurrency(totalDebt)}\n\n**Loan Strategies:**\n• Extra repayments: Even $100/week can save years\n• Offset accounts: Reduce interest while keeping liquidity\n• Debt recycling: Convert non-deductible to deductible\n• Refinancing: Compare rates annually`;
        response.action = { label: "Open Loan Calculator", path: "/loan-calculator" };
        break;

      case "soa":
        response.content = "**Statement of Advice (SOA):**\n\nAn SOA is a legal document that financial advisers provide containing:\n\n• Your personal details & goals\n• Risk profile assessment\n• Current financial situation\n• Recommendations & strategies\n• Fee disclosure\n• Authority to proceed\n\nRequired under ASIC RG 175 for personal financial advice.";
        response.action = { label: "Open SOA Generator", path: "/statement-of-advice" };
        break;

      case "navigate":
        const destinations = {
          "dashboard": "/dashboard",
          "tax": "/tax-analysis-sync",
          "property": "/property-portfolio",
          "shares": "/share-portfolio",
          "stock": "/share-portfolio",
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
          "onboarding": "/onboarding",
        };
        
        for (const [key, path] of Object.entries(destinations)) {
          if (lowerMessage.includes(key)) {
            response.content = `Taking you to ${key}...`;
            setTimeout(() => navigate(path), 500);
            return response;
          }
        }
        response.content = "Where would you like to go? I can navigate to:\n\n• Dashboard, Tax Analysis, Properties\n• Shares, Budget, BAS Calculator\n• CGT, Super, Loans, Reports\n• SOA Generator, Risk Profiler";
        break;

      case "howTo":
        if (lowerMessage.includes("save tax") || lowerMessage.includes("reduce tax")) {
          response.content = "**How to Reduce Your Tax:**\n\n1. **Maximize Super** - Salary sacrifice up to $30k cap\n2. **Claim Deductions** - Work expenses, home office, car\n3. **Negative Gearing** - Investment property losses\n4. **Franking Credits** - Invest in Australian shares\n5. **Tax Loss Harvesting** - Sell losing investments\n6. **Income Splitting** - Through trusts or spouse super\n7. **Timing** - Defer income, prepay expenses";
        } else if (lowerMessage.includes("invest") || lowerMessage.includes("start investing")) {
          response.content = "**How to Start Investing:**\n\n1. **Emergency Fund** - 3-6 months expenses first\n2. **Clear Bad Debt** - Pay off credit cards\n3. **Maximize Super** - Free employer contributions\n4. **Determine Risk** - Complete risk profiler\n5. **Start Simple** - Index ETFs (VAS, VGS, VDHG)\n6. **Regular Investing** - Dollar cost average\n7. **Review Annually** - Rebalance as needed";
          response.action = { label: "Take Risk Assessment", path: "/risk-profiler" };
        } else {
          response.content = "I can guide you on:\n\n• How to reduce tax\n• How to start investing\n• How to plan for retirement\n• How to structure investments\n• How to optimize super\n\nJust ask!";
        }
        break;

      case "compare":
        response.content = "I can help compare:\n\n• **Property vs Shares** - Yield, capital growth, liquidity\n• **Inside vs Outside Super** - Tax implications\n• **Own Name vs Trust** - Asset protection, tax flexibility\n• **Fixed vs Variable Loans** - Rate risk, flexibility\n\nWhat would you like to compare?";
        break;

      case "strategy":
        response.content = "**Key Financial Strategies:**\n\n1. **Tax Minimization** - Maximize deductions, time income\n2. **Wealth Building** - Regular investing, compound growth\n3. **Debt Reduction** - Debt recycling, extra repayments\n4. **Retirement Planning** - Super optimization, transition\n5. **Estate Planning** - Wills, trusts, succession\n\nI can explain any of these in detail.";
        break;

      case "help":
        response.content = "**I'm your Financial Guide!**\n\nI can help with:\n\n🧮 **Calculations** - Tax, CGT, loans, cashflow\n📊 **Scenarios** - What-if analysis, projections\n📚 **Explanations** - Franking credits, negative gearing, etc.\n🧭 **Navigation** - Go to any page\n📋 **Reports** - Generate summaries\n💡 **Strategies** - Tax reduction, investing, retirement\n\n**Try asking:**\n• 'Explain franking credits'\n• 'How do I reduce my tax?'\n• 'What if I sell all my stocks?'\n• 'Compare property vs shares'";
        break;

      default:
        // Check knowledge base for any matching concepts
        if (knowledge) {
          response.content = `**${knowledge.topic.charAt(0).toUpperCase() + knowledge.topic.slice(1)}**\n\n${knowledge.explanation}`;
        } else {
          response.content = "I can help with:\n\n• **Tax** - Calculations, deductions, brackets\n• **Investments** - Shares, property, super\n• **Concepts** - 'Explain [topic]'\n• **Scenarios** - 'What if...'\n• **Strategies** - 'How do I...'\n\nTry asking about franking credits, negative gearing, CGT, super contributions, or any financial topic!";
        }
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

    try {
      // Try backend AI copilot first
      const sessionId = localStorage.getItem("copilot_session_id") || `session_${Date.now()}`;
      localStorage.setItem("copilot_session_id", sessionId);
      
      const aiResponse = await axios.post(`${API}/copilot/chat`, {
        session_id: sessionId,
        message: input,
        client_context: {
          name: "Wheeler Family",
          age: 45,
          income: 185000,
          net_worth: portfolio.summary?.netWorth || 2850000,
          super_balance: 580000,
          risk_profile: "moderate",
          goals: ["retirement", "wealth building", "education funding"]
        }
      });
      
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: aiResponse.data.response,
        insights: aiResponse.data.insights,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Backend AI error, falling back to local:", error);
      // Fallback to local processing
      await new Promise(resolve => setTimeout(resolve, 600));
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
    }
    
    setIsProcessing(false);
  };

  const handleQuickAction = (command) => {
    setInput(command);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case "critical": return "bg-red-50 border-red-200 text-red-800";
      case "urgent": return "bg-amber-50 border-amber-200 text-amber-800";
      case "warning": return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default: return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="copilot-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-[#D4A84C]" />
              Financial Copilot
            </h1>
            <p className="text-muted-foreground mt-1">
              Your AI guide for financial planning and analysis
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[180px]" data-testid="language-selector">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3 text-[#D4A84C]" />
              {t.demoMode}
            </Badge>
          </div>
        </div>

        {/* Smart Alerts */}
        {smartAlerts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#D4A84C]" />
                {t.smartAlerts}
                <Badge variant="secondary">{smartAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {smartAlerts.slice(0, 3).map((alert) => (
                <div 
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-center gap-3">
                    <alert.icon className="h-5 w-5" />
                    <div>
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs opacity-80">{alert.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => navigate(alert.action.path)}
                    >
                      {alert.action.label}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[550px] flex flex-col">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Chat with Copilot
                  <Badge variant="outline" className="ml-2">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Financial Guide
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${msg.type === 'user' ? 'order-1' : ''}`}>
                        <div className={`flex items-start gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.type === 'user' ? 'bg-[#1a2744]' : 'bg-[#D4A84C]'
                          }`}>
                            {msg.type === 'user' ? (
                              <User className="h-4 w-4 text-white" />
                            ) : (
                              <Bot className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div className={`p-3 rounded-lg ${
                            msg.type === 'user' 
                              ? 'bg-[#1a2744] text-white' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm whitespace-pre-line">{msg.content}</p>
                            {msg.action && (
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="mt-2"
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
                        <div className="w-8 h-8 rounded-full bg-[#D4A84C] flex items-center justify-center">
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
                    placeholder={t.inputPlaceholder}
                    className="flex-1"
                    disabled={isProcessing}
                  />
                  <Button onClick={handleSend} disabled={isProcessing || !input.trim()} className="bg-[#1a2744]">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#D4A84C]" />
                  {t.quickActions}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <Button 
                    key={`item-${i}`}
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

            {/* Results Panel */}
            {activeResult && (
              <Card className="border-t-4 border-t-[#D4A84C]">
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
                      <div className="p-3 bg-[#1a2744]/5 rounded">
                        <div className="flex justify-between text-sm">
                          <span>Net Income</span>
                          <span className="font-bold text-[#1a2744]">{formatCurrency(activeResult.data.netIncome)}</span>
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
                          <p className="font-bold text-sm">{formatCurrency(activeResult.data.totalValue)}</p>
                        </div>
                        <div className="p-2 bg-muted rounded text-center">
                          <p className="text-xs text-muted-foreground">Cost Base</p>
                          <p className="font-bold text-sm">{formatCurrency(activeResult.data.costBase)}</p>
                        </div>
                      </div>
                      <div className={`p-2 rounded text-center ${activeResult.data.capitalGain >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className="text-xs text-muted-foreground">Capital {activeResult.data.capitalGain >= 0 ? 'Gain' : 'Loss'}</p>
                        <p className={`font-bold ${activeResult.data.capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(activeResult.data.capitalGain))}
                        </p>
                      </div>
                      <div className="p-3 bg-[#1a2744]/5 rounded">
                        <div className="flex justify-between text-sm">
                          <span>Net Proceeds</span>
                          <span className="font-bold text-[#1a2744]">{formatCurrency(activeResult.data.netProceeds)}</span>
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
                        <div className={`p-2 rounded text-center ${activeResult.data.surplus >= 0 ? 'bg-[#1a2744]/10' : 'bg-amber-50'}`}>
                          <p className="text-[10px] text-muted-foreground">Surplus</p>
                          <p className="font-bold text-sm">{formatCurrency(activeResult.data.surplus)}</p>
                        </div>
                      </div>
                      <ChartContainer height={100}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activeResult.data.projection}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Area type="monotone" dataKey="cumulative" stroke="#1a2744" fill="#1a2744" fillOpacity={0.3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Try Asking */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  {t.tryAsking}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="cursor-pointer hover:text-foreground" onClick={() => handleQuickAction("Explain franking credits")}>
                    "Explain franking credits"
                  </p>
                  <p className="cursor-pointer hover:text-foreground" onClick={() => handleQuickAction("How do I reduce my tax?")}>
                    "How do I reduce my tax?"
                  </p>
                  <p className="cursor-pointer hover:text-foreground" onClick={() => handleQuickAction("Compare property vs shares")}>
                    "Compare property vs shares"
                  </p>
                  <p className="cursor-pointer hover:text-foreground" onClick={() => handleQuickAction("What is dollar cost averaging?")}>
                    "What is dollar cost averaging?"
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
