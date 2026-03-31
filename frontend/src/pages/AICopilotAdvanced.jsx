import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import {
  MessageSquare,
  Send,
  Sparkles,
  Users,
  PieChart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Shield,
  Target,
  Zap,
  RefreshCw,
  ChevronRight,
  Lightbulb,
  Clock
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL;

const AICopilotAdvanced = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [quickInsights, setQuickInsights] = useState([]);
  const [conversationStarters, setConversationStarters] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      const [suggestionsRes, insightsRes, startersRes, tasksRes] = await Promise.all([
        fetch(`${API_URL}/api/ai-copilot/suggestions`),
        fetch(`${API_URL}/api/ai-copilot/quick-insights`),
        fetch(`${API_URL}/api/ai-copilot/conversation-starters`),
        fetch(`${API_URL}/api/workflows/tasks`)
      ]);

      if (suggestionsRes.ok) setSuggestions((await suggestionsRes.json()).suggestions || []);
      if (insightsRes.ok) setQuickInsights((await insightsRes.json()).insights || []);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks((tasksData.tasks || tasksData.data || []).slice(0, 6));
      }
      if (startersRes.ok) {
        const data = await startersRes.json();
        setConversationStarters(data.starters || []);
        // Add welcome message
        setMessages([{
          type: "assistant",
          content: data.daily_focus || "Good morning! How can I help you today?",
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  };

  const sendQuery = async (queryText = query) => {
    if (!queryText.trim()) return;

    const userMessage = {
      type: "user",
      content: queryText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/ai-copilot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage = {
          type: "assistant",
          content: data.response.answer,
          data: data.response.data,
          summary: data.response.summary,
          suggestions: data.response.suggestions,
          category: data.category,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        toast.error("Failed to process query");
      }
    } catch (error) {
      toast.error("Failed to send query");
    }
    setLoading(false);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      clients: Users,
      portfolios: PieChart,
      performance: TrendingUp,
      compliance: Shield,
      revenue: DollarSign,
      risk: AlertTriangle,
      tasks: Target,
      tax: DollarSign
    };
    return icons[category] || Sparkles;
  };

  const getInsightColor = (category) => {
    const colors = {
      portfolios: "bg-blue-100 text-blue-700",
      compliance: "bg-yellow-100 text-yellow-700",
      tax: "bg-green-100 text-green-700",
      clients: "bg-red-100 text-red-700",
      revenue: "bg-purple-100 text-purple-700"
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-120px)] gap-4" data-testid="ai-copilot-advanced">
        {/* Sidebar - Quick Insights */}
        <div className="w-80 space-y-4 hidden lg:block">
          {/* Quick Insights */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Quick Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickInsights.map((insight, idx) => (
                <div 
                  key={`item-${idx}`} 
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => sendQuery(insight.action)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${getInsightColor(insight.category)}`}>
                      {insight.category}
                    </span>
                    <span className="text-lg font-bold">{insight.value}</span>
                  </div>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.change}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Suggested Queries */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-orange-500" />
                Suggested Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestions.slice(0, 5).map((suggestion, idx) => (
                <Button 
                  key={`item-${idx}`}
                  variant="ghost" 
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => sendQuery(suggestion.query)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{suggestion.query}</p>
                    <p className="text-xs text-muted-foreground truncate">{suggestion.preview}</p>
                  </div>
                  <Badge variant={suggestion.urgency === 'high' ? 'destructive' : 'secondary'} className="ml-2 text-xs">
                    {suggestion.urgency}
                  </Badge>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>AI Copilot</CardTitle>
                    <CardDescription>Ask anything about your practice</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchInitialData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, idx) => (
                <div key={`item-${idx}`} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : 'order-2'}`}>
                    {message.type === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <Sparkles className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs text-muted-foreground">AI Copilot</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-md' 
                        : 'bg-muted rounded-bl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Data Display */}
                    {message.data && (
                      <div className="mt-3 space-y-2">
                        {Array.isArray(message.data) ? (
                          message.data.slice(0, 5).map((item, i) => (
                            <div key={`item-${i}`} className="p-3 bg-white border rounded-lg shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{item.name || item.client_name}</span>
                                {item.priority && (
                                  <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                                    {item.priority}
                                  </Badge>
                                )}
                              </div>
                              {item.aum && <p className="text-sm text-muted-foreground">AUM: ${item.aum.toLocaleString()}</p>}
                              {item.drift && <p className="text-sm text-muted-foreground">Drift: {item.drift}%</p>}
                              {item.shortfall && <p className="text-sm text-red-600">Shortfall: ${item.shortfall.toLocaleString()}</p>}
                              {item.issue && <p className="text-sm text-orange-600">{item.issue}</p>}
                              {item.revenue_at_risk && <p className="text-sm text-red-600">Revenue at risk: ${item.revenue_at_risk.toLocaleString()}</p>}
                              {item.harvestable_losses && <p className="text-sm text-green-600">Tax savings: ${item.tax_savings.toLocaleString()}</p>}
                            </div>
                          ))
                        ) : message.data.top_performers && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-green-50 rounded-lg">
                              <p className="text-xs text-green-700 font-medium mb-1">Top Performers</p>
                              {message.data.top_performers.map((p, i) => (
                                <p key={`item-${i}`} className="text-sm">{p.name}: +{p.alpha}% alpha</p>
                              ))}
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                              <p className="text-xs text-red-700 font-medium mb-1">Underperformers</p>
                              {message.data.underperformers.map((p, i) => (
                                <p key={`item-${i}`} className="text-sm">{p.name}: {p.alpha}% alpha</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Summary */}
                    {message.summary && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <div className="flex flex-wrap gap-4 text-sm">
                          {Object.entries(message.summary).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                              <span className="font-medium">
                                {typeof value === 'number' && key.includes('revenue') || key.includes('savings') || key.includes('aum')
                                  ? `$${value.toLocaleString()}`
                                  : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, i) => (
                          <Button 
                            key={`item-${i}`}
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                            onClick={() => sendQuery(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white animate-pulse" />
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
              <form onSubmit={(e) => { e.preventDefault(); sendQuery(); }} className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask about clients, portfolios, compliance, revenue..."
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !query.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <div className="flex flex-wrap gap-2 mt-3">
                {conversationStarters.slice(0, 3).map((starter, idx) => (
                  <Button 
                    key={`item-${idx}`}
                    variant="ghost" 
                    size="sm"
                    className="text-xs"
                    onClick={() => sendQuery(starter.includes('!') ? starter.split('!')[0].trim() : starter)}
                  >
                    {starter.length > 50 ? starter.substring(0, 47) + '...' : starter}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right sidebar - Tasks & Workflows */}
        <div className="w-80 space-y-4 hidden xl:block">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-[#D4A84C]" />
                Tasks & Workflows
              </CardTitle>
              <CardDescription className="text-xs">Active tasks from AI and manual workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.map((task, idx) => (
                <div key={`task-${idx}`} className="p-2 rounded-lg bg-muted/50 border text-sm" data-testid={`task-item-${idx}`}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'} className="text-[10px]">
                      {task.priority}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{task.due}
                    </span>
                  </div>
                  <p className="text-xs font-medium">{task.title}</p>
                  <p className="text-[10px] text-muted-foreground">{task.client}</p>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No active tasks</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-blue-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: "Create SOA", action: "Draft a Statement of Advice for my next client meeting" },
                { label: "Compliance Check", action: "Run a compliance audit across all client portfolios" },
                { label: "Revenue Report", action: "Generate a revenue summary for this quarter" },
                { label: "Review Pack", action: "Prepare quarterly review pack for all clients" },
              ].map((qa, idx) => (
                <Button key={`qa-${idx}`} variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => sendQuery(qa.action)} data-testid={`quick-action-${idx}`}>
                  {qa.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AICopilotAdvanced;
