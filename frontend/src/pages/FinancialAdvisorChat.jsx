import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot,
  User,
  Send,
  Sparkles,
  Lightbulb,
  DollarSign,
  PiggyBank,
  Home,
  TrendingUp,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FinancialAdvisorChat = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "G'day! I'm your AI Financial Advisor. I can help you with questions about Australian tax, superannuation, property investment, dividends, retirement planning, and debt management. What would you like to know?",
      suggestions: [
        "How do franking credits work?",
        "What's the best super strategy?",
        "Should I negatively gear a property?",
        "How much do I need for retirement?"
      ]
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const scrollRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text) return;

    // Add user message
    const userMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat/financial-advisor`, {
        message: text,
        conversation_id: conversationId
      });

      const { response: botResponse, conversation_id, ai_enabled, suggestions } = response.data;
      
      setConversationId(conversation_id);
      setAiEnabled(ai_enabled);

      // Add assistant message
      setMessages(prev => [...prev, {
        role: "assistant",
        content: botResponse,
        suggestions: suggestions || []
      }]);

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to get response");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        suggestions: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const startNewConversation = () => {
    setMessages([
      {
        role: "assistant",
        content: "G'day! I'm your AI Financial Advisor. I can help you with questions about Australian tax, superannuation, property investment, dividends, retirement planning, and debt management. What would you like to know?",
        suggestions: [
          "How do franking credits work?",
          "What's the best super strategy?",
          "Should I negatively gear a property?",
          "How much do I need for retirement?"
        ]
      }
    ]);
    setConversationId(null);
  };

  // Topic quick links
  const topics = [
    { icon: DollarSign, label: "Tax", query: "What are the tax rates for 2024-25?" },
    { icon: PiggyBank, label: "Super", query: "How can I maximize my super contributions?" },
    { icon: Home, label: "Property", query: "How does negative gearing work?" },
    { icon: TrendingUp, label: "Investing", query: "What's a good investment strategy?" },
  ];

  return (
    <Layout>
      <div className="space-y-6 h-[calc(100vh-200px)]" data-testid="financial-advisor-chat">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
                AI Financial Advisor
              </h1>
              <Badge variant={aiEnabled ? "default" : "secondary"} className={aiEnabled ? "bg-[#10B981]" : ""}>
                {aiEnabled ? "AI Powered" : "Demo Mode"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Get instant answers to your Australian finance questions
            </p>
          </div>
          <Button variant="outline" onClick={startNewConversation}>
            <RefreshCw className="h-4 w-4 mr-2" /> New Conversation
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col h-[600px]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0F392B] flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-['Manrope']">Financial Advisor</CardTitle>
                  <CardDescription className="text-xs">
                    {aiEnabled ? "Powered by AI" : "Using pre-defined responses"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            {/* Messages */}
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
              <div className="space-y-4 py-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-[#0F392B] flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
                      <div className={`rounded-lg p-3 ${
                        message.role === "user" 
                          ? "bg-[#0F392B] text-white" 
                          : "bg-muted"
                      }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      
                      {/* Suggestions */}
                      {message.role === "assistant" && message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleSuggestionClick(suggestion)}
                              disabled={loading}
                            >
                              <Lightbulb className="h-3 w-3 mr-1" />
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0F392B] flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about tax, super, property, investments..."
                  disabled={loading}
                  data-testid="chat-input"
                />
                <Button 
                  onClick={() => sendMessage()} 
                  disabled={loading || !input.trim()}
                  className="bg-[#0F392B]"
                  data-testid="send-message-btn"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-['Manrope']">Quick Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topics.map((topic, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSuggestionClick(topic.query)}
                    disabled={loading}
                  >
                    <topic.icon className="h-4 w-4 mr-2" />
                    {topic.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800">Demo Mode</p>
                    <p className="text-amber-700 mt-1">
                      This chatbot uses pre-defined responses. Add an LLM API key (OpenAI, Anthropic, or Emergent) to enable AI-powered responses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  <strong>Disclaimer:</strong> This AI provides general financial information only and should not be considered personal financial advice. 
                  Always consult with a licensed financial advisor for advice tailored to your specific circumstances.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FinancialAdvisorChat;
