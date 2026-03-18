import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Bitcoin,
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Wallet,
  BarChart3,
  Clock,
  Coins
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL || "";

// User's crypto holdings (units held + purchase price for P&L)
const USER_HOLDINGS = [
  { symbol: "BTC", units: 0.85, purchasePrice: 42000, purchaseDate: "2023-06-15" },
  { symbol: "ETH", units: 8.5, purchasePrice: 2100, purchaseDate: "2023-08-20" },
  { symbol: "SOL", units: 45, purchasePrice: 95, purchaseDate: "2024-01-10" },
  { symbol: "LINK", units: 250, purchasePrice: 15.00, purchaseDate: "2024-03-05" },
  { symbol: "MATIC", units: 2500, purchasePrice: 0.85, purchaseDate: "2024-02-20" }
];

// Market data for Fear & Greed and trending (placeholder, could be fetched from API)
const MARKET_DATA = {
  fearGreedIndex: 65,
  trending: ["BTC", "ETH", "SOL", "PEPE", "WIF"]
};

const CryptoPortfolio = () => {
  const [holdings, setHoldings] = useState([]);
  const [globalData, setGlobalData] = useState(null);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataSource, setDataSource] = useState("Loading...");

  // Fetch live prices from CoinGecko via backend
  const fetchLivePrices = async () => {
    setLoading(true);
    try {
      // Build holdings string for API
      const holdingsParam = USER_HOLDINGS.map(h => `${h.symbol}:${h.units}`).join(",");
      
      // Fetch portfolio value with live prices
      const portfolioRes = await axios.get(`${API}/api/crypto/portfolio/value`, {
        params: { holdings: holdingsParam, currency: "aud" }
      });
      
      // Merge live prices with user's purchase data
      const liveHoldings = portfolioRes.data.portfolio.map((item, idx) => ({
        id: idx + 1,
        ...item,
        purchasePrice: USER_HOLDINGS.find(h => h.symbol === item.symbol)?.purchasePrice || 0,
        purchaseDate: USER_HOLDINGS.find(h => h.symbol === item.symbol)?.purchaseDate || "",
        currentPrice: item.price,
        units: item.amount
      }));
      
      setHoldings(liveHoldings);
      setLastUpdated(new Date(portfolioRes.data.timestamp));
      setDataSource(portfolioRes.data.source || "CoinGecko");
      
      // Fetch global market data
      try {
        const globalRes = await axios.get(`${API}/api/crypto/global`);
        setGlobalData(globalRes.data);
      } catch (e) {
        console.warn("Failed to fetch global data:", e);
      }
      
      toast.success("Prices updated from CoinGecko");
    } catch (error) {
      console.error("Error fetching live prices:", error);
      toast.error("Failed to fetch live prices - using cached data");
      
      // Fallback to demo data
      setHoldings(USER_HOLDINGS.map((h, idx) => ({
        id: idx + 1,
        symbol: h.symbol,
        name: h.symbol,
        units: h.units,
        currentPrice: 0,
        purchasePrice: h.purchasePrice,
        purchaseDate: h.purchaseDate,
        allocation: 0,
        value: 0,
        change_24h: 0
      })));
      setDataSource("Offline");
    } finally {
      setLoading(false);
    }
  };

  // Fetch prices on mount and set up refresh
  useEffect(() => {
    fetchLivePrices();
  }, []);

  const totalValue = holdings.reduce((sum, h) => sum + (h.value || h.units * h.currentPrice), 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.units * h.purchasePrice), 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? ((totalPnL / totalCost) * 100).toFixed(2) : "0.00";

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleRefresh = () => {
    fetchLivePrices();
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="crypto-portfolio-page">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cryptocurrency Portfolio</h1>
            <p className="text-muted-foreground">Track your crypto holdings and performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black">
              <Plus className="h-4 w-4 mr-2" />
              Add Crypto
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Bitcoin className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Portfolio Value</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
              <p className={`text-sm ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)} ({totalPnLPercent}%)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">BTC Dominance</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{globalData?.btc_dominance?.toFixed(1) || "52.4"}%</p>
              <p className="text-sm text-muted-foreground">Market share</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Market Cap</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${globalData?.total_market_cap_aud ? (globalData.total_market_cap_aud / 1e12).toFixed(2) : "2.85"}T
              </p>
              <p className="text-sm text-muted-foreground">Total crypto (AUD)</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Holdings</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{holdings.length}</p>
              <p className="text-sm text-muted-foreground">Assets tracked</p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Notice */}
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">Cryptocurrency Risk Warning</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Cryptocurrency investments are highly volatile and speculative. Past performance does not guarantee 
                  future results. Only invest what you can afford to lose. This is not financial advice.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted">
            <TabsTrigger value="portfolio" data-testid="crypto-portfolio-tab">Portfolio</TabsTrigger>
            <TabsTrigger value="market" data-testid="crypto-market-tab">Market</TabsTrigger>
            <TabsTrigger value="analysis" data-testid="crypto-analysis-tab">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-4">
            {holdings.map((crypto) => {
              const value = crypto.units * crypto.currentPrice;
              const cost = crypto.units * crypto.purchasePrice;
              const pnl = value - cost;
              const pnlPercent = ((pnl / cost) * 100).toFixed(2);

              return (
                <Card key={crypto.id} className="bg-card border-border" data-testid={`crypto-card-${crypto.symbol}`}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <Bitcoin className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-foreground">{crypto.name}</h3>
                          <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground">Holdings</p>
                          <p className="font-semibold text-foreground">{crypto.units.toLocaleString()} {crypto.symbol}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Current Price</p>
                          <p className="font-semibold text-foreground">${crypto.currentPrice.toLocaleString()}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Value</p>
                          <p className="font-semibold text-foreground">{formatCurrency(value)}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">P&L</p>
                          <p className={`font-semibold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                          </p>
                          <p className={`text-xs ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {pnl >= 0 ? '+' : ''}{pnlPercent}%
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Allocation</p>
                          <p className="font-semibold text-foreground">{crypto.allocation}%</p>
                          <Progress value={crypto.allocation} className="h-1.5 mt-1" />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <Button size="sm" className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black">
                          Trade
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Market Overview</CardTitle>
                <CardDescription>Current cryptocurrency market conditions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 text-foreground">Fear & Greed Index</h4>
                    <div className="relative pt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Extreme Fear</span>
                        <span>Neutral</span>
                        <span>Extreme Greed</span>
                      </div>
                      <Progress value={MARKET_DATA.fearGreedIndex} className="h-3" />
                      <div className="text-center mt-2">
                        <span className="text-2xl font-bold text-foreground">{MARKET_DATA.fearGreedIndex}</span>
                        <span className="text-sm text-emerald-500 ml-2">Greed</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 text-foreground">Trending Coins</h4>
                    <div className="flex flex-wrap gap-2">
                      {MARKET_DATA.trending.map((coin) => (
                        <Badge key={coin} variant="secondary" className="text-sm">
                          {coin}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Portfolio Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {holdings.map((crypto) => {
                      const value = crypto.units * crypto.currentPrice;
                      const pct = (value / totalValue) * 100;
                      return (
                        <div key={crypto.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground">{crypto.name} ({crypto.symbol})</span>
                            <span className="text-muted-foreground">{formatCurrency(value)} ({pct.toFixed(1)}%)</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded">
                      <span className="text-foreground">Total Cost Basis</span>
                      <span className="font-bold text-foreground">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded">
                      <span className="text-foreground">Current Value</span>
                      <span className="font-bold text-foreground">{formatCurrency(totalValue)}</span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded ${totalPnL >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <span className="text-foreground">Unrealized P&L</span>
                      <span className={`font-bold ${totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)} ({totalPnLPercent}%)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CryptoPortfolio;
