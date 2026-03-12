import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Building2,
  Users,
  User,
  Briefcase,
  PieChart,
  BarChart3,
  Percent,
  X,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Radio,
  Pause,
  Play
} from "lucide-react";
import { usePortfolio } from "@/App";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const COLORS = {
  personal: '#1a2744',
  joint: '#D4A84C',
  company: '#3B82F6'
};

const OWNERSHIP_LABELS = {
  personal: 'Personal',
  joint: 'Joint',
  company: 'Company'
};

const SharePortfolio = () => {
  const { 
    sharePortfolio, 
    addShare, 
    updateShare, 
    removeShare,
    getSharesByOwnership,
    getDividendsByOwnership,
    getPortfolioValueByOwnership,
    familyMembers,
    company,
    updateCompany,
    trust,
    updateTrust,
    updateBudget,
    budget
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState("all");
  const [showAddShare, setShowAddShare] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isMockData, setIsMockData] = useState(true);
  const [isLiveUpdates, setIsLiveUpdates] = useState(false);
  const [liveUpdateInterval, setLiveUpdateInterval] = useState(null);
  const [newShare, setNewShare] = useState({
    symbol: "",
    name: "",
    ownership: "personal",
    ownerId: 1,
    quantity: 0,
    purchasePrice: 0,
    currentPrice: 0,
    purchaseDate: "",
    dividendYield: 0,
    frankingPercentage: 100,
    sector: "Other"
  });

  // Company dividend distribution settings
  const [companyDividendDistribution, setCompanyDividendDistribution] = useState({
    toPersonal: 0,
    toTrust: 0,
    retained: 100
  });

  const portfolioValues = getPortfolioValueByOwnership();
  const dividends = getDividendsByOwnership();
  const primaryEarners = familyMembers.filter(m => m.relationship === 'primary' || m.relationship === 'spouse');

  // Calculate totals
  const totalCostBase = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
  const totalCurrentValue = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
  const totalGainLoss = totalCurrentValue - totalCostBase;
  const totalGainLossPercent = totalCostBase > 0 ? (totalGainLoss / totalCostBase) * 100 : 0;
  const totalDividendIncome = sharePortfolio.reduce((sum, s) => 
    sum + (s.quantity * s.currentPrice * (s.dividendYield / 100)), 0
  );

  // Pie chart data for ownership distribution
  const ownershipPieData = [
    { name: 'Personal', value: portfolioValues.personal, color: COLORS.personal },
    { name: 'Joint', value: portfolioValues.joint, color: COLORS.joint },
    { name: 'Company', value: portfolioValues.company, color: COLORS.company }
  ].filter(d => d.value > 0);

  // Bar chart data for sector allocation
  const sectorData = sharePortfolio.reduce((acc, share) => {
    const sector = share.sector || 'Other';
    const value = share.quantity * share.currentPrice;
    const existing = acc.find(s => s.sector === sector);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ sector, value });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  // Handle add share
  const handleAddShare = () => {
    if (!newShare.symbol || newShare.quantity <= 0) {
      toast.error("Please fill in symbol and quantity");
      return;
    }
    addShare(newShare);
    setNewShare({
      symbol: "",
      name: "",
      ownership: "personal",
      ownerId: 1,
      quantity: 0,
      purchasePrice: 0,
      currentPrice: 0,
      purchaseDate: "",
      dividendYield: 0,
      frankingPercentage: 100,
      sector: "Other"
    });
    setShowAddShare(false);
    toast.success("Share added to portfolio");
  };

  // Handle delete share
  const handleDeleteShare = (id) => {
    removeShare(id);
    toast.success("Share removed from portfolio");
  };

  // Refresh stock prices from backend
  const handleRefreshPrices = async () => {
    if (sharePortfolio.length === 0) {
      toast.error("No shares to refresh");
      return;
    }

    setRefreshing(true);
    try {
      const symbols = sharePortfolio.map(s => s.symbol);
      const response = await axios.post(`${API}/stocks/get-prices`, { symbols });
      
      const { prices, is_mock_data } = response.data;
      setIsMockData(is_mock_data);
      
      // Update each share with new price
      let updatedCount = 0;
      prices.forEach(priceData => {
        if (!priceData.error) {
          const share = sharePortfolio.find(s => s.symbol === priceData.symbol);
          if (share) {
            updateShare(share.id, { 
              currentPrice: priceData.price,
              name: priceData.name || share.name,
              sector: priceData.sector || share.sector
            });
            updatedCount++;
          }
        }
      });

      setLastRefreshed(new Date());
      
      if (is_mock_data) {
        toast.success(`${updatedCount} prices updated (simulated data)`, {
          description: "Add Alpha Vantage API key for real-time prices"
        });
      } else {
        toast.success(`${updatedCount} prices updated from live data`);
      }
    } catch (error) {
      console.error("Error refreshing prices:", error);
      toast.error("Failed to refresh prices");
    } finally {
      setRefreshing(false);
    }
  };

  // Live price simulation - generates realistic price fluctuations
  const simulatePriceChange = useCallback((currentPrice) => {
    // More realistic distribution: smaller changes more likely
    const volatility = 0.02; // 2% max change
    const random = (Math.random() - 0.5) * 2; // -1 to 1
    const change = random * volatility * currentPrice;
    // Apply slight upward bias (market tends to go up long term)
    const bias = currentPrice * 0.0002; // 0.02% upward bias
    return Math.max(0.01, currentPrice + change + bias);
  }, []);

  // Update prices with simulated fluctuations
  const updateLivePrices = useCallback(() => {
    if (sharePortfolio.length === 0) return;
    
    sharePortfolio.forEach(share => {
      const newPrice = parseFloat(simulatePriceChange(share.currentPrice).toFixed(2));
      updateShare(share.id, { currentPrice: newPrice });
    });
    
    setLastRefreshed(new Date());
  }, [sharePortfolio, simulatePriceChange, updateShare]);

  // Toggle live updates
  const toggleLiveUpdates = useCallback(() => {
    if (isLiveUpdates) {
      // Stop live updates
      if (liveUpdateInterval) {
        clearInterval(liveUpdateInterval);
        setLiveUpdateInterval(null);
      }
      setIsLiveUpdates(false);
      toast.info("Live price updates paused");
    } else {
      // Start live updates every 30 seconds
      updateLivePrices(); // Immediate update
      const interval = setInterval(updateLivePrices, 30000);
      setLiveUpdateInterval(interval);
      setIsLiveUpdates(true);
      toast.success("Live price updates started (updates every 30s)");
    }
  }, [isLiveUpdates, liveUpdateInterval, updateLivePrices]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (liveUpdateInterval) {
        clearInterval(liveUpdateInterval);
      }
    };
  }, [liveUpdateInterval]);

  // Format last updated time
  const formatLastUpdate = () => {
    if (!lastRefreshed) return 'Never';
    const seconds = Math.floor((new Date() - lastRefreshed) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Update budget with dividend income
  const syncDividendsToBudget = () => {
    // Calculate personal dividends (including 50% of joint)
    const personalDividends = Object.values(dividends.personal).reduce((sum, d) => sum + d.gross, 0);
    const jointDividendsPerPerson = dividends.joint.gross / 2;
    const totalPersonalDividends = personalDividends + jointDividendsPerPerson;
    
    // Update budget monthly dividend income
    const monthlyDividends = Math.round(totalPersonalDividends / 12);
    updateBudget('income', 'dividends', monthlyDividends);
    toast.success(`Budget updated: ${formatCurrency(monthlyDividends)}/month in dividends`);
  };

  // Distribute company dividends
  const handleDistributeCompanyDividends = () => {
    const companyDividendTotal = dividends.company.gross;
    const toPersonal = companyDividendTotal * (companyDividendDistribution.toPersonal / 100);
    const toTrust = companyDividendTotal * (companyDividendDistribution.toTrust / 100);
    
    // Update trust income with company dividends
    if (toTrust > 0) {
      updateTrust({ companyDividendsReceived: toTrust });
    }
    
    // Update franking account
    const frankingUsed = (toPersonal + toTrust) * (company.taxRate / (1 - company.taxRate));
    updateCompany({ 
      frankingAccountBalance: Math.max(0, company.frankingAccountBalance - frankingUsed)
    });
    
    toast.success(`Distributed ${formatCurrency(toPersonal)} to personal, ${formatCurrency(toTrust)} to trust`);
  };

  // Filter shares by tab
  const getFilteredShares = () => {
    if (activeTab === 'all') return sharePortfolio;
    return sharePortfolio.filter(s => s.ownership === activeTab);
  };

  const filteredShares = getFilteredShares();

  return (
    <Layout>
      <div className="space-y-6" data-testid="share-portfolio-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Share Portfolio
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage personal, joint, and company share holdings
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Live Updates Toggle */}
            <Button 
              variant={isLiveUpdates ? "default" : "outline"}
              onClick={toggleLiveUpdates}
              className={isLiveUpdates ? "bg-green-600 hover:bg-green-700" : ""}
              data-testid="live-updates-btn"
            >
              {isLiveUpdates ? (
                <>
                  <Radio className="h-4 w-4 mr-2 animate-pulse" />
                  Live • {formatLastUpdate()}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Live
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefreshPrices}
              disabled={refreshing || isLiveUpdates}
              data-testid="refresh-prices-btn"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" onClick={syncDividendsToBudget}>
              Sync to Budget
            </Button>
            <Button onClick={() => setShowAddShare(true)} className="bg-[#1a2744]" data-testid="add-share-btn">
              <Plus className="h-4 w-4 mr-2" /> Add Holding
            </Button>
          </div>
        </div>

        {/* Data Source Indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isLiveUpdates ? (
            <>
              <Radio className="h-4 w-4 text-green-500 animate-pulse" />
              <span className="text-green-600 font-medium">Live updates active</span>
              <span>• Updates every 30 seconds</span>
              {lastRefreshed && <span>• Last: {lastRefreshed.toLocaleTimeString()}</span>}
            </>
          ) : lastRefreshed ? (
            <>
              {isMockData ? (
                <WifiOff className="h-4 w-4 text-amber-500" />
              ) : (
                <Wifi className="h-4 w-4 text-green-500" />
              )}
              <span>
                {isMockData ? 'Simulated prices' : 'Live prices'} • 
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-gray-400" />
              <span>Prices not refreshed yet</span>
            </>
          )}
          {isMockData && !isLiveUpdates && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Demo Mode
            </Badge>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#1a2744] text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/80">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</p>
              <p className="text-xs text-white/60 mt-1">{sharePortfolio.length} holdings</p>
            </CardContent>
          </Card>
          <Card className={totalGainLoss >= 0 ? "bg-[#10B981]/10 border-[#10B981]/20" : "bg-destructive/10 border-destructive/20"}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Unrealised Gain/Loss</p>
              <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                {formatCurrency(totalGainLoss)}
              </p>
              <p className={`text-xs mt-1 ${totalGainLoss >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                {formatPercent(totalGainLossPercent)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Annual Dividends</p>
              <p className="text-2xl font-bold text-[#D4A84C]">{formatCurrency(totalDividendIncome)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {((totalDividendIncome / totalCurrentValue) * 100).toFixed(1)}% yield
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Company Franking</p>
              <p className="text-2xl font-bold text-[#3B82F6]">{formatCurrency(company.frankingAccountBalance)}</p>
              <p className="text-xs text-muted-foreground mt-1">Available credits</p>
            </CardContent>
          </Card>
        </div>

        {/* Ownership Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center gap-1">
              <User className="h-3 w-3" /> Personal
            </TabsTrigger>
            <TabsTrigger value="joint" className="flex items-center gap-1">
              <Users className="h-3 w-3" /> Joint
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Company
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Holdings List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold">
                  {activeTab === 'all' ? 'All Holdings' : `${OWNERSHIP_LABELS[activeTab]} Holdings`}
                  <Badge variant="outline" className="ml-2">{filteredShares.length}</Badge>
                </h3>
                
                {filteredShares.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No holdings in this category</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredShares.map(share => {
                    const value = share.quantity * share.currentPrice;
                    const costBase = share.quantity * share.purchasePrice;
                    const gainLoss = value - costBase;
                    const gainLossPercent = costBase > 0 ? (gainLoss / costBase) * 100 : 0;
                    const annualDividend = value * (share.dividendYield / 100);
                    const owner = share.ownerId ? familyMembers.find(m => m.id === share.ownerId) : null;
                    
                    return (
                      <Card key={share.id} className="hover:border-[#1a2744]/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: COLORS[share.ownership] }}
                              >
                                {share.symbol.slice(0, 3)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-lg">{share.symbol}</p>
                                  <Badge 
                                    variant="outline"
                                    style={{ borderColor: COLORS[share.ownership], color: COLORS[share.ownership] }}
                                  >
                                    {OWNERSHIP_LABELS[share.ownership]}
                                  </Badge>
                                  {owner && (
                                    <Badge variant="secondary" className="text-xs">
                                      {owner.name.split(' ')[0]}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{share.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {share.quantity} shares @ {formatCurrency(share.currentPrice)} • {share.sector}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <div>
                                <p className="text-lg font-bold">{formatCurrency(value)}</p>
                                <p className={`text-sm font-medium ${gainLoss >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                                  {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({formatPercent(gainLossPercent)})
                                </p>
                                <p className="text-xs text-[#D4A84C]">
                                  {formatCurrency(annualDividend)}/yr ({share.dividendYield}%)
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteShare(share.id)}
                                data-testid={`delete-share-${share.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Side Panel */}
              <div className="space-y-4">
                {/* Ownership Distribution */}
                <Card data-testid="ownership-distribution">
                  <CardHeader>
                    <CardTitle className=" text-base">Ownership Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer height={200}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={ownershipPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            dataKey="value"
                          >
                            {ownershipPieData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="space-y-2 mt-2">
                      {ownershipPieData.map(item => (
                        <div key={item.name} className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Dividend Summary */}
                <Card data-testid="dividend-summary">
                  <CardHeader>
                    <CardTitle className=" text-base">Annual Dividends</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-[#1a2744]/5">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-[#1a2744]" />
                        <span className="font-medium text-sm">Personal</span>
                      </div>
                      <p className="text-lg font-bold">
                        {formatCurrency(Object.values(dividends.personal).reduce((sum, d) => sum + d.gross, 0))}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#D4A84C]/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-[#D4A84C]" />
                        <span className="font-medium text-sm">Joint (50% each)</span>
                      </div>
                      <p className="text-lg font-bold">{formatCurrency(dividends.joint.gross)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#3B82F6]/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-[#3B82F6]" />
                        <span className="font-medium text-sm">Company</span>
                      </div>
                      <p className="text-lg font-bold">{formatCurrency(dividends.company.gross)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Company Dividend Distribution */}
                {dividends.company.gross > 0 && (
                  <Card data-testid="company-distribution">
                    <CardHeader>
                      <CardTitle className=" text-base flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Company Dividend Distribution
                      </CardTitle>
                      <CardDescription>
                        Distribute {formatCurrency(dividends.company.gross)} from {company.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>To Personal: {companyDividendDistribution.toPersonal}%</span>
                          <span>{formatCurrency(dividends.company.gross * companyDividendDistribution.toPersonal / 100)}</span>
                        </div>
                        <Input
                          type="range"
                          min={0}
                          max={100 - companyDividendDistribution.toTrust}
                          value={companyDividendDistribution.toPersonal}
                          onChange={(e) => setCompanyDividendDistribution(prev => ({
                            ...prev,
                            toPersonal: Number(e.target.value),
                            retained: 100 - Number(e.target.value) - prev.toTrust
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>To Trust: {companyDividendDistribution.toTrust}%</span>
                          <span>{formatCurrency(dividends.company.gross * companyDividendDistribution.toTrust / 100)}</span>
                        </div>
                        <Input
                          type="range"
                          min={0}
                          max={100 - companyDividendDistribution.toPersonal}
                          value={companyDividendDistribution.toTrust}
                          onChange={(e) => setCompanyDividendDistribution(prev => ({
                            ...prev,
                            toTrust: Number(e.target.value),
                            retained: 100 - prev.toPersonal - Number(e.target.value)
                          }))}
                        />
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-sm">
                        <span>Retained: {companyDividendDistribution.retained}% </span>
                        <span className="text-muted-foreground">
                          ({formatCurrency(dividends.company.gross * companyDividendDistribution.retained / 100)})
                        </span>
                      </div>
                      <Button 
                        onClick={handleDistributeCompanyDividends}
                        className="w-full"
                        variant="outline"
                      >
                        Distribute Dividends
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* ATO Compliance Notice */}
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-800">ATO Compliance</p>
                        <p className="text-amber-700 mt-1">
                          Franking credits are calculated at the {(company.taxRate * 100).toFixed(0)}% corporate rate. 
                          Ensure dividend statements match your records for accurate tax returns.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Share Modal */}
        {showAddShare && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddShare(false)}>
            <Card className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Add Share Holding</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowAddShare(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      value={newShare.symbol}
                      onChange={e => setNewShare({...newShare, symbol: e.target.value.toUpperCase()})}
                      placeholder="CBA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ownership</Label>
                    <Select value={newShare.ownership} onValueChange={v => setNewShare({...newShare, ownership: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="joint">Joint</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {newShare.ownership === 'personal' && (
                  <div className="space-y-2">
                    <Label>Owner</Label>
                    <Select value={String(newShare.ownerId)} onValueChange={v => setNewShare({...newShare, ownerId: Number(v)})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {familyMembers.map(m => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={newShare.name}
                    onChange={e => setNewShare({...newShare, name: e.target.value})}
                    placeholder="Commonwealth Bank"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={newShare.quantity}
                      onChange={e => setNewShare({...newShare, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newShare.purchasePrice}
                      onChange={e => setNewShare({...newShare, purchasePrice: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newShare.currentPrice}
                      onChange={e => setNewShare({...newShare, currentPrice: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Dividend Yield %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newShare.dividendYield}
                      onChange={e => setNewShare({...newShare, dividendYield: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Franking %</Label>
                    <Input
                      type="number"
                      value={newShare.frankingPercentage}
                      onChange={e => setNewShare({...newShare, frankingPercentage: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Date</Label>
                    <Input
                      type="date"
                      value={newShare.purchaseDate}
                      onChange={e => setNewShare({...newShare, purchaseDate: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Sector</Label>
                  <Select value={newShare.sector} onValueChange={v => setNewShare({...newShare, sector: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Financials">Financials</SelectItem>
                      <SelectItem value="Materials">Materials</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Consumer Staples">Consumer Staples</SelectItem>
                      <SelectItem value="Consumer Discretionary">Consumer Discretionary</SelectItem>
                      <SelectItem value="Industrials">Industrials</SelectItem>
                      <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Energy">Energy</SelectItem>
                      <SelectItem value="Information Technology">Information Technology</SelectItem>
                      <SelectItem value="ETF">ETF</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleAddShare} className="w-full bg-[#1a2744]">
                  <Plus className="h-4 w-4 mr-2" /> Add Holding
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SharePortfolio;
