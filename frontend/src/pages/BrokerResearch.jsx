import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Search,
  Star,
  FileText,
  AlertTriangle,
  Target,
  Loader2,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ChevronRight
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

const BrokerResearch = () => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [topRated, setTopRated] = useState([]);
  const [ratingChanges, setRatingChanges] = useState([]);
  const [sectorRatings, setSectorRatings] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockDetail, setStockDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("top-rated");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topRatedRes, changesRes, sectorsRes] = await Promise.all([
        axios.get(`${API}/api/broker-research/top-rated`),
        axios.get(`${API}/api/broker-research/upgrades-downgrades`),
        axios.get(`${API}/api/broker-research/sectors`)
      ]);

      setTopRated(topRatedRes.data.top_rated || []);
      setRatingChanges(changesRes.data.changes || []);
      setSectorRatings(sectorsRes.data.sectors || []);
    } catch (error) {
      console.error("Error fetching research data:", error);
      toast.error("Failed to load research data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStockDetail = async (symbol) => {
    try {
      const res = await axios.get(`${API}/api/broker-research/stock/${symbol}`);
      setStockDetail(res.data);
      setSelectedStock(symbol);
    } catch (error) {
      console.error("Error fetching stock detail:", error);
      toast.error("Failed to load stock details");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await fetchStockDetail(searchQuery.toUpperCase());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRatingColor = (rating) => {
    const lowerRating = rating?.toLowerCase() || "";
    if (lowerRating.includes("strong buy") || lowerRating.includes("outperform")) return "bg-green-600";
    if (lowerRating.includes("buy") || lowerRating.includes("overweight")) return "bg-green-500";
    if (lowerRating.includes("hold") || lowerRating.includes("neutral") || lowerRating.includes("equal")) return "bg-yellow-500";
    if (lowerRating.includes("sell") || lowerRating.includes("underweight")) return "bg-red-500";
    if (lowerRating.includes("strong sell") || lowerRating.includes("underperform")) return "bg-red-600";
    return "bg-gray-500";
  };

  const formatPrice = (value) => {
    if (!value) return "-";
    return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading && topRated.length === 0) {
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
      <div className="space-y-6" data-testid="broker-research">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Broker Research</h1>
            <p className="text-muted-foreground">Analyst ratings, price targets, and investment recommendations</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stock symbol (e.g., AAPL, NVDA, CBA)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
              data-testid="stock-search-input"
            />
          </div>
          <Button onClick={handleSearch} data-testid="search-btn">
            Search
          </Button>
        </div>

        {/* Stock Detail Modal */}
        {stockDetail && (
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {stockDetail.symbol}
                    <Badge className={getRatingColor(stockDetail.consensus_rating)}>
                      {stockDetail.consensus_rating}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{stockDetail.company} • {stockDetail.sector}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStockDetail(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price & Target */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-2xl font-bold">${formatPrice(stockDetail.current_price)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Price Target (Mean)</p>
                  <p className="text-2xl font-bold">${formatPrice(stockDetail.price_target?.mean)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Upside</p>
                  <p className={`text-2xl font-bold ${stockDetail.upside_to_target >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {stockDetail.upside_to_target >= 0 ? "+" : ""}{stockDetail.upside_to_target}%
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Analyst Coverage</p>
                  <p className="text-2xl font-bold">{stockDetail.analyst_coverage} analysts</p>
                </div>
              </div>

              {/* Ratings Breakdown */}
              <div>
                <h3 className="font-semibold mb-3">Ratings Breakdown</h3>
                <div className="flex gap-2">
                  {Object.entries(stockDetail.ratings_breakdown || {}).map(([rating, count]) => (
                    <div key={rating} className="flex flex-col items-center p-2 bg-muted rounded-lg min-w-[80px]">
                      <span className="text-xs text-muted-foreground capitalize">{rating.replace("_", " ")}</span>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reports */}
              <div>
                <h3 className="font-semibold mb-3">Recent Analyst Reports</h3>
                <div className="space-y-2">
                  {stockDetail.recent_reports?.map((report, idx) => (
                    <div key={`item-${idx}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{report.broker}</p>
                        <p className="text-sm text-muted-foreground">{report.analyst} • {report.date}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getRatingColor(report.rating)}>{report.rating}</Badge>
                        <p className="text-sm font-medium mt-1">Target: ${report.target}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investment Thesis */}
              <div>
                <h3 className="font-semibold mb-2">Investment Thesis</h3>
                <p className="text-muted-foreground">{stockDetail.investment_thesis}</p>
              </div>

              {/* Risks & Catalysts */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" /> Key Risks
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {stockDetail.risks?.map((risk, idx) => (
                      <li key={`item-${idx}`}>{risk}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" /> Catalysts
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {stockDetail.catalysts?.map((catalyst, idx) => (
                      <li key={`item-${idx}`}>{catalyst}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
            <TabsTrigger value="changes">Upgrades/Downgrades</TabsTrigger>
            <TabsTrigger value="sectors">Sector Ratings</TabsTrigger>
          </TabsList>

          <TabsContent value="top-rated" className="mt-4">
            <div className="grid gap-4">
              {topRated.map((stock, idx) => (
                <Card 
                  key={`item-${idx}`} 
                  className="hover:border-primary cursor-pointer transition-colors"
                  onClick={() => fetchStockDetail(stock.symbol)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center font-bold">
                          {stock.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{stock.symbol}</span>
                            <Badge className={getRatingColor(stock.consensus_rating)}>
                              {stock.consensus_rating}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{stock.company}</p>
                          <p className="text-xs text-muted-foreground">{stock.sector} • {stock.analyst_coverage} analysts</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${formatPrice(stock.current_price)}</p>
                        <p className="text-sm text-muted-foreground">Target: ${formatPrice(stock.price_target)}</p>
                        <p className={`font-medium ${stock.upside >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {stock.upside >= 0 ? "+" : ""}{stock.upside}% upside
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="changes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Rating Changes (7 Days)</CardTitle>
                <CardDescription>
                  {ratingChanges.filter(c => c.change === "upgrade").length} upgrades, {" "}
                  {ratingChanges.filter(c => c.change === "downgrade").length} downgrades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ratingChanges.map((change, idx) => (
                    <div 
                      key={`item-${idx}`} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                      onClick={() => fetchStockDetail(change.symbol)}
                    >
                      <div className="flex items-center gap-3">
                        {change.change === "upgrade" && <ArrowUp className="h-5 w-5 text-green-500" />}
                        {change.change === "downgrade" && <ArrowDown className="h-5 w-5 text-red-500" />}
                        {change.change === "target_raise" && <TrendingUp className="h-5 w-5 text-blue-500" />}
                        <div>
                          <p className="font-medium">{change.symbol}</p>
                          <p className="text-sm text-muted-foreground">{change.broker} • {change.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{change.old_rating}</Badge>
                          <span>→</span>
                          <Badge className={getRatingColor(change.new_rating)}>{change.new_rating}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${change.old_target} → ${change.new_target}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sectors" className="mt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectorRatings.map((sector, idx) => (
                <Card key={`item-${idx}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{sector.sector}</span>
                      <Badge className={getRatingColor(sector.rating_label)}>
                        {sector.rating_label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold">{sector.average_rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">/ 5.0</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sector.stocks_covered} stocks covered
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {sector.top_picks.map((pick, i) => (
                        <Badge 
                          key={`item-${i}`} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => fetchStockDetail(pick)}
                        >
                          {pick}
                        </Badge>
                      ))}
                    </div>
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

export default BrokerResearch;
