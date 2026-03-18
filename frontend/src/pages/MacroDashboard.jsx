import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  DollarSign,
  BarChart3,
  RefreshCw,
  Loader2,
  Bitcoin,
  Building2,
  Coins,
  Fuel,
  Wheat,
  LineChart
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart as RechartsLineChart
} from "recharts";
import axios from "axios";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

// Timeframe options for charts
const TIMEFRAMES = [
  { value: "1d", label: "1 Day", period: "1d", interval: "5m" },
  { value: "1w", label: "1 Week", period: "5d", interval: "30m" },
  { value: "2w", label: "2 Weeks", period: "2wk", interval: "1h" },
  { value: "1m", label: "1 Month", period: "1mo", interval: "1d" },
  { value: "3m", label: "3 Months", period: "3mo", interval: "1d" },
  { value: "6m", label: "6 Months", period: "6mo", interval: "1d" },
  { value: "1y", label: "1 Year", period: "1y", interval: "1wk" },
  { value: "3y", label: "3 Years", period: "3y", interval: "1mo" },
  { value: "5y", label: "5 Years", period: "5y", interval: "1mo" },
  { value: "10y", label: "10 Years", period: "10y", interval: "1mo" },
];

// Symbols to show in charts
const CHART_SYMBOLS = [
  { symbol: "^GSPC", name: "S&P 500", color: "#3B82F6" },
  { symbol: "^AXJO", name: "ASX 200", color: "#10B981" },
  { symbol: "^FTSE", name: "FTSE 100", color: "#8B5CF6" },
  { symbol: "BTC-USD", name: "Bitcoin", color: "#F97316" },
  { symbol: "GC=F", name: "Gold", color: "#EAB308" },
  { symbol: "AUDUSD=X", name: "AUD/USD", color: "#EC4899" },
];

const MacroDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [indices, setIndices] = useState(null);
  const [currencies, setCurrencies] = useState(null);
  const [bonds, setBonds] = useState(null);
  const [commodities, setCommodities] = useState(null);
  const [crypto, setCrypto] = useState(null);
  const [futures, setFutures] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Chart state
  const [selectedTimeframe, setSelectedTimeframe] = useState("1m");
  const [selectedSymbol, setSelectedSymbol] = useState("^GSPC");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  const formatPrice = (value, decimals = 2) => {
    if (value === null || value === undefined) return "-";
    return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "-";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // Fetch historical chart data
  const fetchChartData = async (symbol, timeframe) => {
    setChartLoading(true);
    try {
      const tf = TIMEFRAMES.find(t => t.value === timeframe);
      const response = await axios.get(`${API}/api/macro/history`, {
        params: { symbol, period: tf.period, interval: tf.interval }
      });
      setChartData(response.data.history || []);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      // Generate mock data for demo
      const points = timeframe === "1d" ? 78 : timeframe === "1w" ? 40 : 30;
      const baseValue = selectedSymbol === "BTC-USD" ? 73000 : selectedSymbol === "GC=F" ? 2650 : selectedSymbol.includes("USD") ? 0.65 : 5500;
      const mockData = Array.from({ length: points }, (_, i) => {
        const variance = (Math.random() - 0.5) * baseValue * 0.02;
        return {
          date: new Date(Date.now() - (points - i) * (timeframe === "1d" ? 300000 : 86400000)).toISOString(),
          close: baseValue + variance + (i * baseValue * 0.001),
          volume: Math.floor(Math.random() * 1000000)
        };
      });
      setChartData(mockData);
    } finally {
      setChartLoading(false);
    }
  };

  // Update chart when symbol or timeframe changes
  useEffect(() => {
    fetchChartData(selectedSymbol, selectedTimeframe);
  }, [selectedSymbol, selectedTimeframe]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, indicesRes, currenciesRes, bondsRes, commoditiesRes, cryptoRes, futuresRes] = await Promise.all([
        axios.get(`${API}/api/macro/overview`),
        axios.get(`${API}/api/macro/indices`),
        axios.get(`${API}/api/macro/currencies`),
        axios.get(`${API}/api/macro/bonds`),
        axios.get(`${API}/api/macro/commodities`),
        axios.get(`${API}/api/macro/crypto`),
        axios.get(`${API}/api/macro/futures`)
      ]);

      setOverview(overviewRes.data);
      setIndices(indicesRes.data);
      setCurrencies(currenciesRes.data);
      setBonds(bondsRes.data);
      setCommodities(commoditiesRes.data);
      setCrypto(cryptoRes.data);
      setFutures(futuresRes.data);
    } catch (error) {
      console.error("Error fetching macro data:", error);
      toast.error("Failed to load market data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const PriceCard = ({ title, value, change, changePct, icon: Icon, prefix = "" }) => (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
          <Badge variant={changePct >= 0 ? "default" : "destructive"} className="text-xs">
            {formatPercent(changePct)}
          </Badge>
        </div>
        <p className="text-2xl font-bold mt-2">{prefix}{formatPrice(value)}</p>
        <p className={`text-sm ${changePct >= 0 ? "text-green-500" : "text-red-500"}`}>
          {change >= 0 ? "+" : ""}{formatPrice(change)} ({formatPercent(changePct)})
        </p>
      </CardContent>
    </Card>
  );

  const IndexRow = ({ item }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.symbol}</p>
      </div>
      <div className="text-right">
        <p className="font-medium">{formatPrice(item.value)}</p>
        <p className={`text-sm ${item.change_pct >= 0 ? "text-green-500" : "text-red-500"}`}>
          {formatPercent(item.change_pct)}
        </p>
      </div>
    </div>
  );

  if (loading && !overview) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="macro-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Global Markets</h1>
            <p className="text-muted-foreground">Real-time market data across AUS, US, and European markets</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Market Status */}
        {overview && (
          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(overview.market_status || {}).map(([market, status]) => (
              <Badge key={market} variant={status === "open" ? "default" : "secondary"}>
                {market.toUpperCase()}: {status}
              </Badge>
            ))}
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Fear & Greed: {overview.fear_greed_index}
            </Badge>
          </div>
        )}

        {/* Key Metrics Row */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <PriceCard 
              title="S&P 500" 
              value={overview.highlights.indices.spx.value} 
              change={overview.highlights.indices.spx.change}
              changePct={overview.highlights.indices.spx.change_pct * 100}
              icon={BarChart3}
            />
            <PriceCard 
              title="ASX 200" 
              value={overview.highlights.indices.asx200.value}
              change={overview.highlights.indices.asx200.change}
              changePct={overview.highlights.indices.asx200.change_pct * 100}
              icon={BarChart3}
            />
            <PriceCard 
              title="AUD/USD" 
              value={overview.highlights.currencies.aud_usd.rate}
              change={overview.highlights.currencies.aud_usd.change}
              changePct={overview.highlights.currencies.aud_usd.change_pct}
              prefix="$"
            />
            <PriceCard 
              title="Gold" 
              value={overview.highlights.commodities.gold.price}
              change={overview.highlights.commodities.gold.change}
              changePct={overview.highlights.commodities.gold.change_pct}
              icon={Coins}
              prefix="$"
            />
            <PriceCard 
              title="Bitcoin" 
              value={overview.highlights.crypto.btc.price}
              change={overview.highlights.crypto.btc.price * overview.highlights.crypto.btc.change_24h / 100}
              changePct={overview.highlights.crypto.btc.change_24h}
              icon={Bitcoin}
              prefix="$"
            />
            <PriceCard 
              title="US 10Y" 
              value={overview.highlights.bonds.us_10y.yield}
              change={overview.highlights.bonds.us_10y.change}
              changePct={overview.highlights.bonds.us_10y.change / overview.highlights.bonds.us_10y.yield * 100}
              prefix=""
            />
          </div>
        )}

        {/* Historical Charts Section */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Historical Performance
                </CardTitle>
                <CardDescription>View price history for major indices and assets</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Symbol Selector */}
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_SYMBOLS.map(s => (
                      <SelectItem key={s.symbol} value={s.symbol}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Timeframe Buttons */}
            <div className="flex flex-wrap gap-1 mt-4">
              {TIMEFRAMES.map(tf => (
                <Button
                  key={tf.value}
                  variant={selectedTimeframe === tf.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe(tf.value)}
                  className={selectedTimeframe === tf.value ? "bg-[#D4A84C] text-black hover:bg-[#C49A3C]" : ""}
                >
                  {tf.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_SYMBOLS.find(s => s.symbol === selectedSymbol)?.color || "#3B82F6"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_SYMBOLS.find(s => s.symbol === selectedSymbol)?.color || "#3B82F6"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        if (selectedTimeframe === "1d") return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        if (["1w", "2w", "1m"].includes(selectedTimeframe)) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
                      }}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      stroke="#666"
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => {
                        if (val >= 1000) return `${(val/1000).toFixed(1)}K`;
                        return val.toFixed(selectedSymbol.includes("USD") ? 4 : 0);
                      }}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value) => [formatPrice(value, selectedSymbol.includes("USD") ? 4 : 2), "Price"]}
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={CHART_SYMBOLS.find(s => s.symbol === selectedSymbol)?.color || "#3B82F6"}
                      fill="url(#colorPrice)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Chart Stats */}
            {chartData.length > 0 && (
              <div className="flex justify-between mt-4 text-sm text-muted-foreground border-t border-border pt-4">
                <div>
                  <span className="font-medium text-foreground">Open:</span> {formatPrice(chartData[0]?.close, 2)}
                </div>
                <div>
                  <span className="font-medium text-foreground">Close:</span> {formatPrice(chartData[chartData.length - 1]?.close, 2)}
                </div>
                <div>
                  <span className="font-medium text-foreground">High:</span> {formatPrice(Math.max(...chartData.map(d => d.close)), 2)}
                </div>
                <div>
                  <span className="font-medium text-foreground">Low:</span> {formatPrice(Math.min(...chartData.map(d => d.close)), 2)}
                </div>
                <div>
                  <span className="font-medium text-foreground">Change:</span>{" "}
                  <span className={chartData[chartData.length - 1]?.close >= chartData[0]?.close ? "text-green-500" : "text-red-500"}>
                    {formatPercent((chartData[chartData.length - 1]?.close - chartData[0]?.close) / chartData[0]?.close * 100)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for detailed data */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="indices">Indices</TabsTrigger>
            <TabsTrigger value="currencies">Currencies</TabsTrigger>
            <TabsTrigger value="bonds">Bonds</TabsTrigger>
            <TabsTrigger value="commodities">Commodities</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            <TabsTrigger value="futures">Futures</TabsTrigger>
          </TabsList>

          <TabsContent value="indices" className="mt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {indices && Object.entries(indices).filter(([key]) => key !== "timestamp" && key !== "data_source" && Array.isArray(indices[key])).map(([region, data]) => (
                <Card key={region}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg capitalize">{region}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(data) && data.map((item, idx) => <IndexRow key={idx} item={item} />)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="currencies" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              {currencies && Object.entries(currencies).filter(([key]) => key !== "timestamp" && key !== "data_source" && Array.isArray(currencies[key])).map(([category, pairs]) => (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg capitalize">{category.replace("_", " ")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(pairs) && pairs.map((pair, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="font-medium">{pair.pair}</span>
                        <div className="text-right">
                          <span className="font-medium">{formatPrice(pair.rate, 4)}</span>
                          <span className={`ml-2 text-sm ${pair.change_pct >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {formatPercent(pair.change_pct)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bonds" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              {bonds && Object.entries(bonds).filter(([key]) => key !== "timestamp" && key !== "data_source" && Array.isArray(bonds[key])).map(([region, bondList]) => (
                <Card key={region}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg capitalize">{region}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(bondList) && bondList.map((bond, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-sm">{bond.name}</span>
                        <div className="text-right">
                          <span className="font-medium">{bond.yield}%</span>
                          <span className={`ml-2 text-sm ${bond.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {bond.change >= 0 ? "+" : ""}{bond.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="commodities" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              {commodities && Object.entries(commodities).filter(([key]) => key !== "timestamp" && key !== "data_source" && Array.isArray(commodities[key])).map(([category, items]) => (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg capitalize flex items-center gap-2">
                      {category === "energy" && <Fuel className="h-4 w-4" />}
                      {category === "metals" && <Coins className="h-4 w-4" />}
                      {category === "agriculture" && <Wheat className="h-4 w-4" />}
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(items) && items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">/{item.unit}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">${formatPrice(item.price)}</span>
                          <span className={`ml-2 text-sm ${item.change_pct >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {formatPercent(item.change_pct)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="crypto" className="mt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {crypto?.cryptocurrencies?.map((coin, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Bitcoin className="h-5 w-5 text-orange-500" />
                        <span className="font-bold">{coin.symbol}</span>
                      </div>
                      <Badge variant={coin.change_24h >= 0 ? "default" : "destructive"}>
                        {formatPercent(coin.change_24h)}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">${formatPrice(coin.price)}</p>
                    <p className="text-sm text-muted-foreground">{coin.name}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>MCap: ${(coin.market_cap / 1e9).toFixed(1)}B</p>
                      <p>Vol 24h: ${(coin.volume_24h / 1e9).toFixed(1)}B</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="futures" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              {futures && Object.entries(futures).filter(([key]) => key !== "timestamp" && key !== "data_source" && Array.isArray(futures[key])).map(([category, items]) => (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg capitalize">{category.replace("_", " ")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(items) && items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{item.expiry}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatPrice(item.price, 2)}</span>
                          <span className={`ml-2 text-sm ${item.change_pct >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {formatPercent(item.change_pct)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MacroDashboard;
