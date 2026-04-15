import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Calculator,
  Receipt,
  Clock,
  Calendar,
  Percent,
  Building,
  ShoppingCart,
  Minus,
  Plus,
  ChevronRight,
  Eye,
  FileText,
  Zap,
  BookOpen,
  Globe,
  Lightbulb,
  BarChart3,
  PieChart,
  History,
  Target,
  Activity,
  Newspaper,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercent = (value) => {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
};

const formatTimeAgo = (dateStr) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return dateStr;
  }
};

// Backtest results (static reference data)
const backtestResults = {
  strategy: 'Buffett Value + Momentum',
  yearly_returns: [
    { year: '2020', strategy: 8.5, benchmark: 1.4 },
    { year: '2021', strategy: 25.8, benchmark: 17.2 },
    { year: '2022', strategy: -5.2, benchmark: -10.1 },
    { year: '2023', strategy: 15.2, benchmark: 12.1 },
    { year: '2024', strategy: 18.5, benchmark: 11.8 },
    { year: '2025', strategy: 14.8, benchmark: 8.5 },
  ],
  returns: { strategy: 14.2, benchmark: 9.8, alpha: 4.4 },
  metrics: { sharpe_ratio: 1.25, max_drawdown: -18.5, win_rate: 68 }
};

// ===================== MAIN COMPONENT =====================

const StockTrading = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get('client');
  
  const [activeTab, setActiveTab] = useState('portfolio');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(clientIdFromUrl || "client_1");
  const [holdings, setHoldings] = useState(null);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [cgtSummary, setCgtSummary] = useState(null);
  const [orderPreview, setOrderPreview] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderForm, setOrderForm] = useState({
    side: "sell",
    units: 0,
    price: 0
  });
  
  // Live market data state
  const [marketData, setMarketData] = useState([]);
  const [marketSource, setMarketSource] = useState('loading');
  const [newsFeeds, setNewsFeeds] = useState([]);

  // Buffett Engine state (live API)
  const [buffettData, setBuffettData] = useState(null);
  const [buffettLoading, setBuffettLoading] = useState(false);
  const [buffettSource, setBuffettSource] = useState('idle');

  const clients = [
    { id: "client_1", name: "Thompson Family" },
    { id: "client_2", name: "Chen Investment Trust" },
    { id: "client_3", name: "Thompson SMSF" },
    { id: "client_4", name: "Patel Holdings" }
  ];

  // Fetch live market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/market-data/indicators`);
        if (response.ok) {
          const data = await response.json();
          if (data.indicators && data.indicators.length > 0) {
            setMarketData(data.indicators);
            setMarketSource(data.source);
          }
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 300000); // 5 min refresh
    return () => clearInterval(interval);
  }, []);

  // Fetch live news from backend
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`${API_URL}/api/news/headlines`);
        if (response.ok) {
          const data = await response.json();
          if (data.headlines && data.headlines.length > 0) {
            setNewsFeeds(data.headlines.slice(0, 20).map((item, idx) => ({
              id: idx + 1,
              headline: item.title,
              summary: item.summary || '',
              source: item.source,
              time: item.published ? formatTimeAgo(item.published) : '',
              link: item.link,
              category: item.category || 'markets',
              sentiment: 'neutral'
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 600000); // 10 min refresh
    return () => clearInterval(interval);
  }, []);

  // Fetch Buffett Engine data from live API
  const fetchBuffettData = useCallback(async () => {
    setBuffettLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/buffett-engine/screen`);
      if (response.ok) {
        const data = await response.json();
        setBuffettData(data);
        setBuffettSource(data.source || 'live');
      }
    } catch {
      toast.error("Failed to load Buffett screening data");
    } finally {
      setBuffettLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'buffett' || activeTab === 'valuations') {
      if (!buffettData) fetchBuffettData();
    }
  }, [activeTab, buffettData, fetchBuffettData]);

  const fetchHoldings = useCallback(async () => {
    setLoading(true);
    try {
      const [holdingsRes, cgtRes] = await Promise.all([
        fetch(`${API_URL}/api/trading/holdings/${selectedClient}`),
        fetch(`${API_URL}/api/trading/cgt-summary/${selectedClient}`)
      ]);
      
      if (holdingsRes.ok) {
        const data = await holdingsRes.json();
        // Normalize field names from API to what the UI expects
        if (data.holdings) {
          data.holdings = data.holdings.map(h => ({
            ...h,
            average_cost_per_unit: h.avg_cost ?? h.average_cost_per_unit,
            market_value: h.current_value ?? h.market_value,
            cgt_discount_eligible: h.eligible_for_cgt_discount ?? h.cgt_discount_eligible,
          }));
        }
        setHoldings(data);
      }
      if (cgtRes.ok) {
        const data = await cgtRes.json();
        setCgtSummary(data);
      }
    } catch (err) {
      console.error("Error fetching holdings:", err);
      toast.error("Failed to load holdings");
    } finally {
      setLoading(false);
    }
  }, [selectedClient]);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const calculateCGTPreview = async (symbol, units) => {
    try {
      const res = await fetch(`${API_URL}/api/trading/calculate-cgt?client_id=${selectedClient}&symbol=${symbol}&units_to_sell=${units}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("Error calculating CGT:", err);
    }
    return null;
  };

  const openOrderDialog = async (holding, side) => {
    setSelectedHolding(holding);
    setOrderForm({
      side,
      units: side === "sell" ? Math.floor(holding.units * 0.5) : 100,
      price: holding.current_price
    });
    setShowOrderDialog(true);
    
    if (side === "sell") {
      const preview = await calculateCGTPreview(holding.symbol, Math.floor(holding.units * 0.5));
      setOrderPreview(preview);
    } else {
      setOrderPreview(null);
    }
  };

  const updateOrderUnits = async (units) => {
    setOrderForm(prev => ({ ...prev, units }));
    if (orderForm.side === "sell" && selectedHolding) {
      const preview = await calculateCGTPreview(selectedHolding.symbol, units);
      setOrderPreview(preview);
    }
  };

  const executeOrder = async () => {
    try {
      const endpoint = orderForm.side === "sell" ? "decrease-holding" : "increase-holding";
      const params = new URLSearchParams({
        client_id: selectedClient,
        symbol: selectedHolding.symbol,
        ...(orderForm.side === "sell" 
          ? { units_to_sell: orderForm.units, sale_price: orderForm.price }
          : { additional_units: orderForm.units, purchase_price: orderForm.price }
        )
      });
      
      const res = await fetch(`${API_URL}/api/trading/${endpoint}?${params}`, {
        method: 'POST'
      });
      
      if (res.ok) {
        toast.success(`Order executed: ${orderForm.side === "sell" ? "Sold" : "Bought"} ${orderForm.units} units of ${selectedHolding.symbol}`);
        setShowOrderDialog(false);
        fetchHoldings();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Order failed");
      }
    } catch (err) {
      toast.error("Order execution failed");
    }
  };

  // PE Band Chart
  const PEBandChart = ({ symbol, data }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold">{symbol}</span>
        <Badge className={data.pe_current && data.pe_current <= data.pe_avg ? 'bg-green-500' : 'bg-amber-500'}>
          PE: {data.pe_current || 'N/A'}
        </Badge>
      </div>
      <div className="h-4 bg-slate-100 rounded-full relative overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-green-500 via-blue-500 to-red-500 opacity-30"
          style={{ width: '100%' }}
        />
        {data.pe_current && (
          <div
            className="absolute h-full w-1 bg-slate-800"
            style={{ left: `${((data.pe_current - data.pe_low) / (data.pe_high - data.pe_low)) * 100}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{data.pe_low}</span>
        <span className="text-blue-600">{data.pe_avg} avg</span>
        <span>{data.pe_high}</span>
      </div>
    </div>
  );

  if (loading && activeTab === 'portfolio') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-[#1a2744]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="stock-trading-page">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-[#D4A84C]" />
              Shares & ETFs
            </h1>
            <p className="text-muted-foreground">Trade, analyze, and optimize your equity portfolio</p>
          </div>
          
          <div className="flex items-center gap-3">
            {marketSource === 'live' && (
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                <Activity className="h-3 w-3 mr-1" /> Live Data
              </Badge>
            )}
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={fetchHoldings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Live Market Ticker */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <CardContent className="py-3">
            <div className="flex items-center justify-between overflow-x-auto gap-6">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Live Markets</span>
              </div>
              {marketData.slice(0, 5).map((indicator, idx) => (
                <div key={`item-${idx}`} className="flex items-center gap-2 min-w-fit">
                  <span className="text-sm text-slate-300">{indicator.name}</span>
                  <span className="font-semibold">{indicator.value?.toLocaleString()}</span>
                  <span className={`text-sm ${indicator.change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {indicator.change_percent >= 0 ? '+' : ''}{indicator.change_percent}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="portfolio" className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="buffett" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Buffett Ideas
            </TabsTrigger>
            <TabsTrigger value="valuations" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Valuations
            </TabsTrigger>
            <TabsTrigger value="backtest" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              Backtest
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-1">
              <Newspaper className="h-4 w-4" />
              News
            </TabsTrigger>
          </TabsList>

          {/* ========== PORTFOLIO TAB ========== */}
          <TabsContent value="portfolio" className="space-y-6">
            {/* Demo Mode Alert */}
            <Alert className="border-yellow-200 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Demo Mode:</strong> All trades are simulated. No real money is used.
              </AlertDescription>
            </Alert>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold text-[#1a2744]">
                    {formatCurrency(holdings?.summary?.total_value || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Cost Base</p>
                  <p className="text-2xl font-bold text-[#1a2744]">
                    {formatCurrency(holdings?.summary?.total_cost_base || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card className={holdings?.summary?.total_unrealized_gain >= 0 ? "bg-green-50" : "bg-red-50"}>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Unrealized Gain/Loss</p>
                  <p className={`text-2xl font-bold ${holdings?.summary?.total_unrealized_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(holdings?.summary?.total_unrealized_gain || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Gains</p>
                  <p className="text-2xl font-bold text-green-600">{holdings?.summary?.gains_count || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Losses</p>
                  <p className="text-2xl font-bold text-red-600">{holdings?.summary?.losses_count || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Holdings List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Holdings - {holdings?.client_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {holdings?.holdings?.map((holding, idx) => (
                    <div key={`item-${idx}`} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            holding.unrealized_gain >= 0 ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {holding.unrealized_gain >= 0 ? (
                              <ArrowUpRight className="h-6 w-6 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{holding.symbol}</span>
                              <Badge variant="outline">{holding.units} units</Badge>
                              {holding.cgt_discount_eligible && (
                                <Badge className="bg-purple-100 text-purple-700">12m+ Held</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Avg Cost: {formatCurrency(holding.average_cost_per_unit)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{formatCurrency(holding.market_value)}</p>
                          <p className={`text-sm ${holding.unrealized_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(holding.unrealized_gain)} ({formatPercent(holding.unrealized_gain_pct)})
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openOrderDialog(holding, "buy")}>
                            <Plus className="h-4 w-4 mr-1" /> Buy
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => openOrderDialog(holding, "sell")}>
                            <Minus className="h-4 w-4 mr-1" /> Sell
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== BUFFETT IDEAS TAB ========== */}
          <TabsContent value="buffett" className="space-y-6">
            {buffettLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="h-8 w-8 animate-spin text-[#D4A84C]" />
              </div>
            ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-amber-500" />
                          Today's Value Opportunities
                        </CardTitle>
                        <CardDescription>Buffett-style screening via live Yahoo Finance data</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {buffettSource && (
                          <Badge variant="outline" className={buffettSource === 'live' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}>
                            {buffettSource === 'live' ? 'Live' : 'Cached'}
                          </Badge>
                        )}
                        <Button variant="outline" size="sm" onClick={fetchBuffettData}>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(buffettData?.ideas || []).map((idea, idx) => (
                      <div
                        key={`idea-${idx}`}
                        className={`p-4 rounded-lg border-2 ${
                          idea.action === 'BUY' ? 'border-green-200 bg-green-50' :
                          idea.action === 'HOLD' ? 'border-blue-200 bg-blue-50' :
                          'border-red-200 bg-red-50'
                        }`}
                        data-testid={`buffett-idea-${idea.symbol}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-lg">{idea.symbol}</span>
                              <span className="text-muted-foreground">{idea.name}</span>
                              <Badge className={
                                idea.action === 'BUY' ? 'bg-green-500' :
                                idea.action === 'HOLD' ? 'bg-blue-500' : 'bg-red-500'
                              }>
                                {idea.action}
                              </Badge>
                              <Badge variant="outline">{idea.sector}</Badge>
                            </div>
                            <p className="text-sm mb-2">{idea.reason}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span>PE: <strong>{idea.pe_current || 'N/A'}</strong> vs avg <strong>{idea.pe_avg}</strong></span>
                              <span className={idea.upside.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                                Upside: <strong>{idea.upside}</strong>
                              </span>
                              {idea.dividend_yield && (
                                <span>Yield: <strong>{idea.dividend_yield}%</strong></span>
                              )}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="w-14 h-14 relative">
                              <svg className="w-14 h-14 transform -rotate-90">
                                <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                <circle
                                  cx="28" cy="28" r="24" fill="none"
                                  stroke={idea.confidence >= 75 ? '#22c55e' : idea.confidence >= 50 ? '#f59e0b' : '#ef4444'}
                                  strokeWidth="4"
                                  strokeDasharray={`${idea.confidence * 1.5} 150`}
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                                {idea.confidence}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Confidence</p>
                          </div>
                        </div>
                        <div className="mt-2 p-2 bg-white/50 rounded text-sm">
                          <strong>Catalyst:</strong> {idea.catalyst}
                        </div>
                      </div>
                    ))}
                    {(!buffettData?.ideas || buffettData.ideas.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="h-8 w-8 mx-auto mb-2" />
                        <p>No screening data available. Click Refresh to load.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Market Sentiment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center">
                        <span className="text-3xl font-bold text-amber-700" data-testid="sentiment-score">
                          {buffettData?.sentiment_score || '--'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground" data-testid="sentiment-label">
                        {buffettData?.sentiment_label || 'Loading...'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sector Rankings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(buffettData?.sector_rankings || []).map((item, idx) => (
                      <div key={`sector-${idx}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-sm">{item.sector}</span>
                        </div>
                        <Badge variant={item.score >= 70 ? 'default' : 'secondary'}>{item.score}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
            )}
          </TabsContent>

          {/* ========== VALUATIONS TAB ========== */}
          <TabsContent value="valuations" className="space-y-6">
            {buffettLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="h-8 w-8 animate-spin text-[#D4A84C]" />
              </div>
            ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(buffettData?.ideas || []).map((stock) => (
                <Card key={stock.symbol} className={`${
                  stock.pe_current && stock.pe_current <= stock.pe_avg ? 'border-green-200' :
                  stock.pe_current && stock.pe_current <= stock.pe_avg * 1.1 ? 'border-blue-200' : 'border-red-200'
                }`}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{stock.name}</p>
                    <PEBandChart symbol={stock.symbol} data={stock} />
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <Badge className={
                        stock.pe_current && stock.pe_current <= stock.pe_avg ? 'bg-green-500' :
                        stock.pe_current && stock.pe_current <= stock.pe_avg * 1.1 ? 'bg-blue-500' : 'bg-red-500'
                      }>
                        {stock.pe_current && stock.pe_current <= stock.pe_avg ? 'Undervalued' :
                         stock.pe_current && stock.pe_current <= stock.pe_avg * 1.1 ? 'Fair' : 'Overvalued'}
                      </Badge>
                      <Badge variant="outline">{stock.sector}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!buffettData?.ideas || buffettData.ideas.length === 0) && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p>No valuation data available. Switch to Buffett Ideas tab to load data.</p>
                </div>
              )}
            </div>
            )}
          </TabsContent>

          {/* ========== BACKTEST TAB ========== */}
          <TabsContent value="backtest" className="space-y-6">
            <div className="grid lg:grid-cols-4 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Strategy CAGR</p>
                  <p className="text-3xl font-bold text-green-600">{backtestResults.returns.strategy}%</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Benchmark (ASX)</p>
                  <p className="text-3xl font-bold text-blue-600">{backtestResults.returns.benchmark}%</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Alpha</p>
                  <p className="text-3xl font-bold text-amber-600">+{backtestResults.returns.alpha}%</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-3xl font-bold text-purple-600">{backtestResults.metrics.sharpe_ratio}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance vs Benchmark (6 Years)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={backtestResults.yearly_returns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Legend />
                      <Bar dataKey="strategy" name="Buffett Strategy" fill="#22c55e" />
                      <Bar dataKey="benchmark" name="ASX 200" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== NEWS TAB ========== */}
          <TabsContent value="news" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Market News & Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {newsFeeds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Loading latest news...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {newsFeeds.map((news) => (
                      <a
                        key={news.id}
                        href={news.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        data-testid={`news-item-${news.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium leading-tight">{news.headline}</p>
                            {news.summary && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{news.summary}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{news.source}</Badge>
                              {news.category && <Badge variant="secondary" className="text-xs">{news.category}</Badge>}
                              <span>{news.time}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Order Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {orderForm.side === "sell" ? (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                )}
                {orderForm.side === "sell" ? "Sell" : "Buy"} {selectedHolding?.symbol}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Units</Label>
                  <Input
                    type="number"
                    value={orderForm.units}
                    onChange={(e) => updateOrderUnits(parseInt(e.target.value) || 0)}
                    min={1}
                    max={orderForm.side === "sell" ? selectedHolding?.units : undefined}
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={orderForm.price}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>Order Value:</span>
                  <span className="font-bold">{formatCurrency(orderForm.units * orderForm.price)}</span>
                </div>
              </div>

              {orderPreview && orderForm.side === "sell" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <p className="font-semibold text-amber-800">CGT Estimate:</p>
                  <div className="flex justify-between text-sm">
                    <span>Capital Gain:</span>
                    <span className={orderPreview.capital_gain >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(orderPreview.capital_gain)}
                    </span>
                  </div>
                  {orderPreview.cgt_discount_applied && (
                    <div className="flex justify-between text-sm">
                      <span>50% CGT Discount Applied</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium">
                    <span>Estimated Tax:</span>
                    <span>{formatCurrency(orderPreview.estimated_tax)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOrderDialog(false)}>Cancel</Button>
              <Button 
                onClick={executeOrder}
                className={orderForm.side === "sell" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Execute {orderForm.side === "sell" ? "Sell" : "Buy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default StockTrading;
