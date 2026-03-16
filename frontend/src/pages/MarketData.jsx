import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Plus,
  BarChart3,
  Globe,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart,
  Calendar
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value, currency = "AUD") => {
  if (value === undefined || value === null || isNaN(value)) return "$0.00";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2
  }).format(value);
};

const formatLargeCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return "$0";
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
};

const COLORS = ['#1a2744', '#D4A84C', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// Default portfolio holdings
const DEFAULT_HOLDINGS = [
  { symbol: "VAS.AX", units: 500, cost_basis: 95.00 },
  { symbol: "VGS.AX", units: 300, cost_basis: 98.00 },
  { symbol: "VAF.AX", units: 200, cost_basis: 50.00 },
  { symbol: "BHP.AX", units: 100, cost_basis: 42.00 },
  { symbol: "CBA.AX", units: 50, cost_basis: 95.00 },
];

const MarketData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [indices, setIndices] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockHistory, setStockHistory] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [indicesRes, portfolioRes, sectorsRes] = await Promise.all([
        axios.get(`${API}/market/indices`),
        axios.post(`${API}/market/portfolio-value`, { holdings: DEFAULT_HOLDINGS }),
        axios.get(`${API}/market/sectors`)
      ]);
      
      setIndices(indicesRes.data.indices || []);
      setPortfolio(portfolioRes.data);
      setSectors(sectorsRes.data.sectors || []);
    } catch (error) {
      console.error("Error fetching market data:", error);
      toast.error("Failed to load market data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success("Market data refreshed");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await axios.get(`${API}/market/search`, {
        params: { query: searchQuery }
      });
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleSelectStock = async (symbol) => {
    setSelectedStock(symbol);
    try {
      const [quoteRes, historyRes] = await Promise.all([
        axios.get(`${API}/market/quote/${symbol}`),
        axios.get(`${API}/market/history/${symbol}`, { params: { period: "3mo" } })
      ]);
      
      setSelectedStock(quoteRes.data);
      setStockHistory(historyRes.data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="market-data-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Live Market Data
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time prices powered by Yahoo Finance
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Market Indices */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {indices.map((index) => (
            <Card key={index.symbol} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{index.name}</p>
                <p className="text-lg font-bold">{(index.value || 0).toLocaleString()}</p>
                <div className={`flex items-center text-sm ${
                  (index.change_percent || 0) >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {(index.change_percent || 0) >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{Math.abs(index.change_percent || 0).toFixed(2)}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Portfolio</TabsTrigger>
            <TabsTrigger value="sectors">Sectors</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Portfolio Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolio?.total_value || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolio?.total_cost || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
                  <p className={`text-2xl font-bold ${
                    (portfolio?.total_gain_loss || 0) >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {formatCurrency(portfolio?.total_gain_loss || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Return</p>
                  <p className={`text-2xl font-bold ${
                    (portfolio?.total_return_percent || 0) >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {(portfolio?.total_return_percent || 0).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Holdings Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Holdings (Live Prices)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground border-b">
                        <th className="pb-2">Symbol</th>
                        <th className="pb-2">Name</th>
                        <th className="pb-2 text-right">Units</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Value</th>
                        <th className="pb-2 text-right">Gain/Loss</th>
                        <th className="pb-2 text-right">Day</th>
                        <th className="pb-2 text-right">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio?.positions?.map((position) => (
                        <tr 
                          key={position.symbol} 
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleSelectStock(position.symbol)}
                        >
                          <td className="py-3 font-medium">{position.symbol}</td>
                          <td className="py-3 text-muted-foreground">{position.name || position.symbol}</td>
                          <td className="py-3 text-right">{(position.units || 0).toLocaleString()}</td>
                          <td className="py-3 text-right">{formatCurrency(position.current_price || 0)}</td>
                          <td className="py-3 text-right font-medium">{formatCurrency(position.market_value || position.current_value || 0)}</td>
                          <td className={`py-3 text-right ${(position.gain_loss || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(position.gain_loss || 0)} ({(position.gain_loss_percent || 0).toFixed(1)}%)
                          </td>
                          <td className={`py-3 text-right ${(position.day_change_percent || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {(position.day_change_percent || 0) >= 0 ? "+" : ""}{(position.day_change_percent || 0).toFixed(2)}%
                          </td>
                          <td className="py-3 text-right">
                            <Badge variant="outline">{(position.weight || 0).toFixed(1)}%</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Allocation Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Portfolio Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={portfolio?.positions || []}
                        dataKey="weight"
                        nameKey="symbol"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ symbol, weight }) => `${symbol} (${weight.toFixed(0)}%)`}
                      >
                        {portfolio?.positions?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sectors Tab */}
          <TabsContent value="sectors" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sector ETF Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sectors.map((sector) => (
                    <div 
                      key={sector.symbol} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSelectStock(sector.symbol)}
                    >
                      <div>
                        <p className="font-medium">{sector.name}</p>
                        <p className="text-sm text-muted-foreground">{sector.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(sector.current_price)}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={sector.day_change >= 0 ? "text-green-600" : "text-red-600"}>
                            Day: {sector.day_change >= 0 ? "+" : ""}{sector.day_change.toFixed(2)}%
                          </span>
                          <span className={sector.ytd_return >= 0 ? "text-green-600" : "text-red-600"}>
                            YTD: {sector.ytd_return >= 0 ? "+" : ""}{sector.ytd_return.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search stocks (e.g., BHP, Apple, VAS)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearch}>Search</Button>
                </div>
              </CardContent>
            </Card>

            {searchResults.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <div 
                        key={result.symbol}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleSelectStock(result.symbol)}
                      >
                        <div>
                          <p className="font-medium">{result.symbol}</p>
                          <p className="text-sm text-muted-foreground">{result.name}</p>
                        </div>
                        <Badge variant="outline">{result.exchange}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Stock Details */}
            {selectedStock && typeof selectedStock === "object" && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{selectedStock.name}</CardTitle>
                      <CardDescription>{selectedStock.symbol}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(selectedStock.current_price)}</p>
                      <p className={`text-sm ${selectedStock.change_percent >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {selectedStock.change >= 0 ? "+" : ""}{selectedStock.change.toFixed(2)} ({selectedStock.change_percent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Day High</p>
                      <p className="font-medium">{formatCurrency(selectedStock.day_high)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Day Low</p>
                      <p className="font-medium">{formatCurrency(selectedStock.day_low)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">52W High</p>
                      <p className="font-medium">{formatCurrency(selectedStock["52_week_high"] || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">52W Low</p>
                      <p className="font-medium">{formatCurrency(selectedStock["52_week_low"] || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Volume</p>
                      <p className="font-medium">{(selectedStock.volume || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Market Cap</p>
                      <p className="font-medium">{formatLargeCurrency(selectedStock.market_cap || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">P/E Ratio</p>
                      <p className="font-medium">{selectedStock.pe_ratio?.toFixed(2) || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dividend Yield</p>
                      <p className="font-medium">
                        {selectedStock.dividend_yield ? `${(selectedStock.dividend_yield * 100).toFixed(2)}%` : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Price Chart */}
                  {stockHistory?.history && (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stockHistory.history}>
                          <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1a2744" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#1a2744" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Area type="monotone" dataKey="close" stroke="#1a2744" fill="url(#priceGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MarketData;
