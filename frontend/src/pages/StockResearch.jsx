import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Search, Filter, Target, DollarSign, Percent, BarChart3, Calendar, Bell, Building2 } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function StockResearch() {
  const [stocks, setStocks] = useState([]);
  const [intrinsicValues, setIntrinsicValues] = useState([]);
  const [dividends, setDividends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [filters, setFilters] = useState({
    sector: "all",
    moat: "all",
    sortBy: "market_cap"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [screenerRes, intrinsicRes, dividendsRes, alertsRes, sectorsRes] = await Promise.all([
        axios.post(`${API}/research/screener`, { limit: 20 }),
        axios.get(`${API}/research/intrinsic-values?limit=10`),
        axios.get(`${API}/research/dividends/calendar`),
        axios.get(`${API}/research/market-alerts`),
        axios.get(`${API}/research/sectors`)
      ]);
      setStocks(screenerRes.data.stocks);
      setIntrinsicValues(intrinsicRes.data.stocks);
      setDividends(dividendsRes.data.dividends);
      setAlerts(alertsRes.data.alerts);
      setSectors(sectorsRes.data.sectors);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 20,
        sort_by: filters.sortBy
      };
      if (filters.sector !== "all") params.sectors = [filters.sector];
      if (filters.moat !== "all") params.moat_rating = [filters.moat];
      
      const response = await axios.post(`${API}/research/screener`, params);
      setStocks(response.data.stocks);
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewStockDetails = async (ticker) => {
    try {
      const response = await axios.get(`${API}/research/stock/${ticker}`);
      setSelectedStock(response.data);
    } catch (error) {
      console.error("Error fetching stock details:", error);
    }
  };

  const getMoatColor = (moat) => {
    switch (moat) {
      case "wide": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "narrow": return "bg-amber-100 text-amber-800 border-amber-200";
      case "none": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getValuationColor = (valuation) => {
    switch (valuation) {
      case "undervalued": return "text-emerald-600";
      case "fairly_valued": return "text-amber-600";
      case "overvalued": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "high": return <Bell className="w-4 h-4 text-red-500" />;
      case "medium": return <Bell className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading && stocks.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-[#1a2744] border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="stock-research-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744]">Stock Screener</h1>
            <p className="text-muted-foreground">ASX stock screening, moat analysis & broker research</p>
          </div>
          <Badge className="bg-[#D4A84C]/20 text-[#1a2744] border-[#D4A84C]/50 px-4 py-2">
            <BarChart3 className="w-4 h-4 mr-2" />
            50+ ASX Stocks
          </Badge>
        </div>

        {/* Market Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-amber-500" />
              Market Alerts
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex-shrink-0 bg-card rounded-lg p-3 border border min-w-[280px]">
                <div className="flex items-start gap-2">
                  {getSeverityIcon(alert.severity)}
                  <div>
                    <p className="text-foreground font-medium text-sm">{alert.title}</p>
                    <p className="text-muted-foreground text-xs mt-1">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="screener" className="w-full">
        <TabsList className="bg-muted border border">
          <TabsTrigger value="screener" className="data-[state=active]:bg-[#1a2744]">Stock Screener</TabsTrigger>
          <TabsTrigger value="intrinsic" className="data-[state=active]:bg-[#1a2744]">Intrinsic Values</TabsTrigger>
          <TabsTrigger value="dividends" className="data-[state=active]:bg-[#1a2744]">Dividend Calendar</TabsTrigger>
          <TabsTrigger value="sectors" className="data-[state=active]:bg-[#1a2744]">Sector Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="screener" className="mt-4 space-y-4">
          {/* Filters */}
          <Card className="bg-card border">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <Select value={filters.sector} onValueChange={(v) => setFilters({...filters, sector: v})}>
                  <SelectTrigger className="w-[180px] bg-background border">
                    <SelectValue placeholder="Sector" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    <SelectItem value="all">All Sectors</SelectItem>
                    <SelectItem value="Financials">Financials</SelectItem>
                    <SelectItem value="Materials">Materials</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Energy">Energy</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Consumer Discretionary">Consumer Discretionary</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.moat} onValueChange={(v) => setFilters({...filters, moat: v})}>
                  <SelectTrigger className="w-[180px] bg-background border">
                    <SelectValue placeholder="Moat Rating" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    <SelectItem value="all">All Moats</SelectItem>
                    <SelectItem value="wide">Wide Moat</SelectItem>
                    <SelectItem value="narrow">Narrow Moat</SelectItem>
                    <SelectItem value="none">No Moat</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.sortBy} onValueChange={(v) => setFilters({...filters, sortBy: v})}>
                  <SelectTrigger className="w-[180px] bg-background border">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    <SelectItem value="market_cap">Market Cap</SelectItem>
                    <SelectItem value="pe">P/E Ratio</SelectItem>
                    <SelectItem value="dividend_yield">Dividend Yield</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={applyFilters} className="bg-[#1a2744] hover:bg-[#1a2744]/90">
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stock Table */}
          <Card className="bg-card border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border">
                    <tr>
                      <th className="text-left p-4 text-muted-foreground font-medium">Stock</th>
                      <th className="text-right p-4 text-muted-foreground font-medium">Price</th>
                      <th className="text-right p-4 text-muted-foreground font-medium">Change</th>
                      <th className="text-right p-4 text-muted-foreground font-medium">Market Cap</th>
                      <th className="text-right p-4 text-muted-foreground font-medium">P/E</th>
                      <th className="text-right p-4 text-muted-foreground font-medium">Yield</th>
                      <th className="text-center p-4 text-muted-foreground font-medium">Moat</th>
                      <th className="text-center p-4 text-muted-foreground font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock) => (
                      <tr key={stock.ticker} className="border-b border/50 hover:bg-card">
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-foreground">{stock.ticker}</p>
                            <p className="text-sm text-muted-foreground">{stock.name}</p>
                          </div>
                        </td>
                        <td className="p-4 text-right text-foreground font-medium">${stock.price.toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <span className={`flex items-center justify-end gap-1 ${stock.change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stock.change_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-4 text-right text-slate-300">{stock.market_cap_formatted}</td>
                        <td className="p-4 text-right text-slate-300">{stock.pe.toFixed(1)}</td>
                        <td className="p-4 text-right text-emerald-400">{stock.dividend_yield.toFixed(1)}%</td>
                        <td className="p-4 text-center">
                          <Badge className={getMoatColor(stock.moat)}>{stock.moat}</Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-slate-600 hover:bg-slate-700"
                            onClick={() => viewStockDetails(stock.ticker)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intrinsic" className="mt-4">
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Intrinsic Value Analysis
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Stocks sorted by margin of safety (potential upside)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {intrinsicValues.map((stock) => (
                  <div key={stock.ticker} className="bg-muted rounded-lg p-4 border border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-foreground font-bold">
                        {stock.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{stock.ticker} - {stock.name}</p>
                        <p className="text-sm text-muted-foreground">{stock.sector}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Current Price</p>
                        <p className="text-foreground font-medium">${stock.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Intrinsic Value</p>
                        <p className="text-purple-400 font-medium">${stock.intrinsic_value.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Margin of Safety</p>
                        <p className={`font-bold text-lg ${stock.margin_of_safety > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {stock.margin_of_safety > 0 ? '+' : ''}{stock.margin_of_safety.toFixed(1)}%
                        </p>
                      </div>
                      <Badge className={getMoatColor(stock.moat)}>{stock.moat}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dividends" className="mt-4">
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Dividend Calendar
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Upcoming dividend payments this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border">
                    <tr>
                      <th className="text-left p-3 text-muted-foreground font-medium">Stock</th>
                      <th className="text-center p-3 text-muted-foreground font-medium">Ex-Div Date</th>
                      <th className="text-center p-3 text-muted-foreground font-medium">Payment Date</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Dividend/Share</th>
                      <th className="text-center p-3 text-muted-foreground font-medium">Franking</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dividends.slice(0, 15).map((div, idx) => (
                      <tr key={idx} className="border-b border/50 hover:bg-card">
                        <td className="p-3">
                          <p className="font-semibold text-foreground">{div.ticker}</p>
                          <p className="text-sm text-muted-foreground">{div.name}</p>
                        </td>
                        <td className="p-3 text-center text-slate-300">{div.ex_dividend_date}</td>
                        <td className="p-3 text-center text-slate-300">{div.payment_date}</td>
                        <td className="p-3 text-right text-emerald-400 font-medium">${div.dividend_per_share.toFixed(4)}</td>
                        <td className="p-3 text-center">
                          <Badge className={div.franking === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}>
                            {div.franking}%
                          </Badge>
                        </td>
                        <td className="p-3 text-right text-blue-400">{div.yield.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sectors" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectors.map((sector) => (
              <Card key={sector.sector} className="bg-card border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{sector.sector}</p>
                        <p className="text-sm text-muted-foreground">{sector.stock_count} stocks</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 ${sector.change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sector.change_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-medium">{sector.change_percent >= 0 ? '+' : ''}{sector.change_percent.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Market Cap</p>
                      <p className="text-foreground font-medium">{sector.market_cap_formatted}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg P/E</p>
                      <p className="text-foreground font-medium">{sector.avg_pe.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Yield</p>
                      <p className="text-emerald-400 font-medium">{sector.avg_dividend_yield.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border">
                    <p className="text-xs text-muted-foreground">Top: {sector.top_stocks.slice(0, 3).join(', ')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStock(null)}>
          <Card className="bg-background border max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground text-xl">{selectedStock.ticker} - {selectedStock.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{selectedStock.sector}</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setSelectedStock(null)}>×</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-lg p-3 border border">
                  <p className="text-muted-foreground text-sm">Price</p>
                  <p className="text-xl font-bold text-foreground">${selectedStock.price.toFixed(2)}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border border">
                  <p className="text-muted-foreground text-sm">Intrinsic Value</p>
                  <p className="text-xl font-bold text-purple-400">${selectedStock.intrinsic_value.toFixed(2)}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border border">
                  <p className="text-muted-foreground text-sm">Margin of Safety</p>
                  <p className={`text-xl font-bold ${selectedStock.margin_of_safety > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedStock.margin_of_safety > 0 ? '+' : ''}{selectedStock.margin_of_safety.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Valuation & Moat */}
              <div className="flex gap-4">
                <Badge className={getValuationColor(selectedStock.valuation) + ' bg-muted border border-current'}>
                  {selectedStock.valuation?.replace('_', ' ')}
                </Badge>
                <Badge className={getMoatColor(selectedStock.moat)}>
                  {selectedStock.moat} moat
                </Badge>
              </div>

              {/* Moat Analysis */}
              {selectedStock.moat_analysis?.factors && (
                <div>
                  <h4 className="text-foreground font-semibold mb-3">Moat Analysis</h4>
                  <div className="space-y-2">
                    {selectedStock.moat_analysis.factors.map((factor, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-card rounded-lg p-3">
                        <div>
                          <p className="text-foreground font-medium">{factor.factor}</p>
                          <p className="text-muted-foreground text-sm">{factor.description}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-foreground font-bold">
                          {factor.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </Layout>
  );
}
