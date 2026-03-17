import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Loader2, 
  Lightbulb,
  TrendingUp,
  DollarSign,
  PiggyBank,
  Shield,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const API = process.env.REACT_APP_BACKEND_URL;

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp, text: "Can I retire at 60?", category: "retirement" },
  { icon: DollarSign, text: "How can I reduce my tax?", category: "tax" },
  { icon: PiggyBank, text: "Should I increase super contributions?", category: "super" },
  { icon: Shield, text: "Is my portfolio diversified enough?", category: "investment" },
  { icon: Lightbulb, text: "What if I increased savings by $500/month?", category: "scenario" }
];

const AICopilot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);

  // Client context - in production this would come from selected client
  const clientContext = {
    name: "Wheeler Family",
    age: 45,
    retirement_age: 65,
    annual_income: 180000,
    annual_expenses: 120000,
    super_balance: 580000,
    savings: 200000,
    property_value: 950000,
    mortgage: 450000,
    risk_profile: "balanced"
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Add welcome message on mount
  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: `Hello! I'm your AI Wealth Copilot. I can help you with:

• **Retirement Planning** - "Can Sarah retire at 60?"
• **Tax Optimization** - "How can I reduce my tax?"
• **Super Strategies** - "Should I maximize super contributions?"
• **Scenario Analysis** - "What if I increased savings by $500/month?"
• **Investment Advice** - "Is my portfolio balanced?"

What would you like to explore today?`,
      timestamp: new Date().toISOString()
    }]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/api/copilot/ask`, {
        question: input,
        session_id: sessionId,
        client_context: clientContext
      });

      if (response.data.success) {
        setSessionId(response.data.session_id);
        
        setMessages(prev => [...prev, {
          role: "assistant",
          content: response.data.answer,
          parsed: response.data.parsed,
          timestamp: response.data.timestamp
        }]);
      } else {
        toast.error("Failed to get response");
      }
    } catch (error) {
      console.error("Copilot error:", error);
      toast.error("Failed to get AI response");
      
      // Add error message
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Chat cleared. How can I help you today?",
      timestamp: new Date().toISOString()
    }]);
    setSessionId(null);
  };

  return (
    <div className="p-6 space-y-6" data-testid="ai-copilot-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Wealth Copilot</h1>
            <p className="text-muted-foreground">Ask anything about financial planning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Connected
          </Badge>
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col h-[600px]">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Chat</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-[#1a2744] text-white"
                          : message.isError
                          ? "bg-red-50 border border-red-200"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                      
                      {message.parsed?.has_probability && (
                        <Badge className="mt-2 bg-green-100 text-green-700">
                          Success Probability: {message.parsed.probability}%
                        </Badge>
                      )}
                    </div>
                    
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-[#1a2744] flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about retirement, tax, investments, scenarios..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                  data-testid="copilot-input"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                  className="bg-[#1a2744] hover:bg-[#1a2744]/90"
                  data-testid="copilot-send"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Client Context */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Client Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{clientContext.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age</span>
                <span>{clientContext.age}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Worth</span>
                <span>${(clientContext.super_balance + clientContext.savings + clientContext.property_value - clientContext.mortgage).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Profile</span>
                <Badge variant="outline">{clientContext.risk_profile}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Questions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Suggested Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => handleSuggestedQuestion(q.text)}
                  disabled={isLoading}
                >
                  <q.icon className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{q.text}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* AI Tips */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-purple-600" />
                <CardTitle className="text-sm font-medium text-purple-900">Pro Tip</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-700">
                Ask follow-up questions to dive deeper. The AI remembers your conversation context.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AICopilot;
