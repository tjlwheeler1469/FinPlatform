import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Wheat
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

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

  const formatPrice = (value, decimals = 2) => {
    if (value === null || value === undefined) return "-";
    return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "-";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

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
