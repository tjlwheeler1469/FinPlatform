import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Database,
  Wifi,
  WifiOff,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  BarChart3,
  LineChart,
  AlertTriangle,
  Zap
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const RealtimeDataDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [driftAnalysis, setDriftAnalysis] = useState([]);
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("portfolios");
  const [selectedClient, setSelectedClient] = useState("");
  const [tradeForm, setTradeForm] = useState({
    symbol: "AAPL",
    action: "buy",
    shares: 10
  });
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(fetchAllData, 30000);
    return () => clearInterval(refreshIntervalRef.current);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statusRes, portfoliosRes, marketRes, driftRes, integrationRes] = await Promise.all([
        fetch(`${API_URL}/api/realtime-data/status`),
        fetch(`${API_URL}/api/realtime-data/portfolios`),
        fetch(`${API_URL}/api/realtime-data/market-data`),
        fetch(`${API_URL}/api/realtime-data/insights/drift`),
        fetch(`${API_URL}/api/realtime-data/integration-status`)
      ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (portfoliosRes.ok) {
        const data = await portfoliosRes.json();
        setPortfolios(data.portfolios || []);
        if (data.portfolios?.length > 0 && !selectedClient) {
          setSelectedClient(data.portfolios[0].client_id);
        }
      }
      if (marketRes.ok) {
        const data = await marketRes.json();
        setMarketData(data.prices || {});
      }
      if (driftRes.ok) {
        const data = await driftRes.json();
        setDriftAnalysis(data.drift_analysis || []);
      }
      if (integrationRes.ok) setIntegrationStatus(await integrationRes.json());
    } catch (error) {
      console.error("Error fetching realtime data:", error);
      toast.error("Failed to load realtime data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const response = await fetch(`${API_URL}/api/realtime-data/refresh`, {
        method: "POST"
      });
      if (response.ok) {
        toast.success("Data refreshed from source");
        fetchAllData();
      }
    } catch (error) {
      toast.error("Failed to refresh data");
    }
  };

  const handleTrade = async () => {
    if (!selectedClient) {
      toast.error("Please select a client first");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/realtime-data/execute-trade?client_id=${selectedClient}&symbol=${tradeForm.symbol}&action=${tradeForm.action}&shares=${tradeForm.shares}`,
        { method: "POST" }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(`Trade executed: ${tradeForm.action} ${tradeForm.shares} ${tradeForm.symbol}`);
        fetchAllData();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Trade failed");
      }
    } catch (error) {
      toast.error("Failed to execute trade");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
      case "demo_mode":
        return "text-emerald-600 bg-emerald-100";
      case "syncing":
        return "text-blue-600 bg-blue-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getChangeIcon = (change) => {
    return change >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-600" />
    );
  };

  if (loading && !status) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#1a2744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading real-time data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const selectedPortfolio = portfolios.find(p => p.client_id === selectedClient);

  return (
    <Layout>
      <div className="space-y-6" data-testid="realtime-data-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <Activity className="h-7 w-7 text-[#D4A84C]" />
              Real-Time Data Layer
            </h1>
            <p className="text-muted-foreground mt-1">
              Single source of truth for all financial data
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(status?.mode || "demo")}>
              {status?.mode === "demo" ? <Database className="h-3 w-3 mr-1" /> : <Wifi className="h-3 w-3 mr-1" />}
              {status?.mode?.toUpperCase() || "DEMO"} MODE
            </Badge>
            <Button onClick={handleRefresh} variant="outline" data-testid="refresh-data-btn">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total AUM</p>
                  <p className="text-2xl font-bold">
                    ${(portfolios.reduce((sum, p) => sum + p.total_value, 0) / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clients Tracked</p>
                  <p className="text-2xl font-bold">{portfolios.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Symbols Tracked</p>
                  <p className="text-2xl font-bold">{Object.keys(marketData).length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <LineChart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Drift Alerts</p>
                  <p className="text-2xl font-bold">{driftAnalysis.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
            <TabsTrigger value="market">Market Data</TabsTrigger>
            <TabsTrigger value="drift">Drift Analysis</TabsTrigger>
            <TabsTrigger value="trade">Execute Trade</TabsTrigger>
          </TabsList>

          {/* Portfolios Tab */}
          <TabsContent value="portfolios" className="space-y-4">
            <div className="flex gap-4 items-center mb-4">
              <Label>Select Client:</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[250px]" data-testid="client-selector">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map(p => (
                    <SelectItem key={p.client_id} value={p.client_id}>
                      {p.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPortfolio && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>{selectedPortfolio.client_name}</CardTitle>
                    <CardDescription>
                      Last updated: {new Date(selectedPortfolio.last_updated).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedPortfolio.holdings.map((holding, index) => (
                        <div 
                          key={`item-${index}`} 
                          className="flex items-center justify-between p-3 rounded-lg border"
                          data-testid={`holding-${holding.symbol}`}
                        >
                          <div>
                            <p className="font-medium">{holding.symbol}</p>
                            <p className="text-sm text-muted-foreground">
                              {holding.shares} shares @ ${holding.avg_cost.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${holding.market_value.toLocaleString()}</p>
                            <p className={`text-sm flex items-center justify-end gap-1 ${
                              holding.unrealized_pnl >= 0 ? "text-emerald-600" : "text-red-600"
                            }`}>
                              {getChangeIcon(holding.unrealized_pnl)}
                              ${Math.abs(holding.unrealized_pnl).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Value</span>
                        <span className="font-bold">${selectedPortfolio.total_value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cash</span>
                        <span className="font-bold">${selectedPortfolio.cash.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Holdings</span>
                        <span className="font-bold">{selectedPortfolio.holdings.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unrealized P&L</span>
                        <span className={`font-bold ${
                          selectedPortfolio.holdings.reduce((sum, h) => sum + h.unrealized_pnl, 0) >= 0 
                            ? "text-emerald-600" : "text-red-600"
                        }`}>
                          ${selectedPortfolio.holdings.reduce((sum, h) => sum + h.unrealized_pnl, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Market Data Tab */}
          <TabsContent value="market">
            <Card>
              <CardHeader>
                <CardTitle>Live Market Data</CardTitle>
                <CardDescription>Real-time prices (demo mode - simulated updates)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.entries(marketData).map(([symbol, data]) => (
                    <div 
                      key={symbol} 
                      className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                      data-testid={`market-${symbol}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">{symbol}</span>
                        {getChangeIcon(data.change)}
                      </div>
                      <p className="text-2xl font-bold">${data.price.toFixed(2)}</p>
                      <p className={`text-sm ${data.change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {data.change >= 0 ? "+" : ""}{data.change.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vol: {(data.volume / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drift Analysis Tab */}
          <TabsContent value="drift">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Portfolio Drift Analysis
                </CardTitle>
                <CardDescription>Portfolios that need rebalancing</CardDescription>
              </CardHeader>
              <CardContent>
                {driftAnalysis.length > 0 ? (
                  <div className="space-y-4">
                    {driftAnalysis.map((drift, index) => (
                      <div 
                        key={drift.client_id} 
                        className="p-4 rounded-lg border"
                        data-testid={`drift-${drift.client_id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{drift.client_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Portfolio: ${drift.total_value.toLocaleString()}
                            </p>
                          </div>
                          <Badge className={drift.priority === "high" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-amber-100 text-amber-800"
                          }>
                            {drift.priority} priority
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Tech Allocation</p>
                            <p className="font-medium">{drift.sector_allocation.tech.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tech Drift</p>
                            <p className={`font-medium ${drift.drift.tech > 0 ? "text-red-600" : "text-emerald-600"}`}>
                              {drift.drift.tech > 0 ? "+" : ""}{drift.drift.tech.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        {drift.requires_rebalance && (
                          <Badge className="mt-3 bg-red-100 text-red-800">
                            Requires Rebalance
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
                    <p>All portfolios are within target allocation!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade Execution Tab */}
          <TabsContent value="trade">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Execute Trade
                  </CardTitle>
                  <CardDescription>
                    Execute trades and update portfolios in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Client</Label>
                      <Select value={selectedClient} onValueChange={setSelectedClient}>
                        <SelectTrigger data-testid="trade-client-selector">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {portfolios.map(p => (
                            <SelectItem key={p.client_id} value={p.client_id}>
                              {p.client_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Symbol</Label>
                      <Select 
                        value={tradeForm.symbol} 
                        onValueChange={(v) => setTradeForm(prev => ({ ...prev, symbol: v }))}
                      >
                        <SelectTrigger data-testid="trade-symbol-selector">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(marketData).map(symbol => (
                            <SelectItem key={symbol} value={symbol}>
                              {symbol} - ${marketData[symbol]?.price.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Action</Label>
                      <Select 
                        value={tradeForm.action} 
                        onValueChange={(v) => setTradeForm(prev => ({ ...prev, action: v }))}
                      >
                        <SelectTrigger data-testid="trade-action-selector">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy</SelectItem>
                          <SelectItem value="sell">Sell</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Shares</Label>
                      <Input
                        type="number"
                        value={tradeForm.shares}
                        onChange={(e) => setTradeForm(prev => ({ ...prev, shares: parseInt(e.target.value) || 0 }))}
                        data-testid="trade-shares-input"
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Estimated Value</p>
                      <p className="text-2xl font-bold">
                        ${(tradeForm.shares * (marketData[tradeForm.symbol]?.price || 0)).toLocaleString()}
                      </p>
                    </div>

                    <Button 
                      onClick={handleTrade} 
                      className="w-full bg-[#1a2744] hover:bg-[#1a2744]/90"
                      data-testid="execute-trade-btn"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Execute Trade
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Integration Status</CardTitle>
                  <CardDescription>Available data integrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {integrationStatus?.available_integrations && Object.entries(integrationStatus.available_integrations).map(([name, config]) => (
                      <div key={name} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{name.replace(/_/g, " ")}</span>
                          <Badge className={config.ready 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-amber-100 text-amber-800"
                          }>
                            {config.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {config.capabilities?.join(", ")}
                        </p>
                        {config.requires && (
                          <p className="text-xs text-amber-600 mt-2">
                            Requires: {config.requires}
                          </p>
                        )}
                      </div>
                    ))}
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

export default RealtimeDataDashboard;
