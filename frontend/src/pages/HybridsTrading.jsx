import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeftRight,
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Shield,
  Percent,
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  AlertTriangle,
  Building2,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

// Demo hybrid securities data (Australian focus)
const DEMO_HYBRIDS = [
  {
    id: 1,
    name: "CBAPD",
    fullName: "Commonwealth Bank PERLS XI",
    issuer: "Commonwealth Bank of Australia",
    type: "Additional Tier 1 Capital",
    marginOverBbsw: 3.00,
    currentYield: 7.35,
    tradingPrice: 98.50,
    faceValue: 100,
    unitsHeld: 500,
    callDate: "2026-10-15",
    maturityDate: "2031-10-15",
    franking: 100,
    lastDividend: 3.67,
    frequency: "Quarterly",
    rating: "BBB+"
  },
  {
    id: 2,
    name: "WBCPI",
    fullName: "Westpac Capital Notes 8",
    issuer: "Westpac Banking Corporation",
    type: "Additional Tier 1 Capital",
    marginOverBbsw: 2.90,
    currentYield: 7.25,
    tradingPrice: 101.20,
    faceValue: 100,
    unitsHeld: 300,
    callDate: "2027-03-22",
    maturityDate: "2032-03-22",
    franking: 100,
    lastDividend: 3.62,
    frequency: "Quarterly",
    rating: "BBB+"
  },
  {
    id: 3,
    name: "ANZPJ",
    fullName: "ANZ Capital Notes 7",
    issuer: "Australia and New Zealand Banking Group",
    type: "Additional Tier 1 Capital",
    marginOverBbsw: 3.10,
    currentYield: 7.45,
    tradingPrice: 97.80,
    faceValue: 100,
    unitsHeld: 400,
    callDate: "2028-09-20",
    maturityDate: "2033-09-20",
    franking: 100,
    lastDividend: 3.72,
    frequency: "Quarterly",
    rating: "BBB+"
  },
  {
    id: 4,
    name: "MQGPD",
    fullName: "Macquarie Group Capital Notes 4",
    issuer: "Macquarie Group Limited",
    type: "Additional Tier 1 Capital",
    marginOverBbsw: 3.70,
    currentYield: 8.05,
    tradingPrice: 96.30,
    faceValue: 100,
    unitsHeld: 200,
    callDate: "2027-06-14",
    maturityDate: "2032-06-14",
    franking: 45,
    lastDividend: 4.02,
    frequency: "Quarterly",
    rating: "BBB"
  },
  {
    id: 5,
    name: "NABPH",
    fullName: "NAB Capital Notes 5",
    issuer: "National Australia Bank",
    type: "Additional Tier 1 Capital",
    marginOverBbsw: 2.95,
    currentYield: 7.30,
    tradingPrice: 99.50,
    faceValue: 100,
    unitsHeld: 350,
    callDate: "2028-06-17",
    maturityDate: "2033-06-17",
    franking: 100,
    lastDividend: 3.65,
    frequency: "Quarterly",
    rating: "BBB+"
  }
];

const MARKET_RATES = {
  "3m_bbsw": 4.35,
  "rba_cash": 4.35,
  "90d_bank_bill": 4.32
};

const HybridsTrading = () => {
  const [hybrids, setHybrids] = useState(DEMO_HYBRIDS);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [loading, setLoading] = useState(false);

  const totalFaceValue = hybrids.reduce((sum, h) => sum + (h.faceValue * h.unitsHeld), 0);
  const totalMarketValue = hybrids.reduce((sum, h) => sum + (h.tradingPrice * h.unitsHeld), 0);
  const averageYield = hybrids.reduce((sum, h) => sum + h.currentYield, 0) / hybrids.length;
  const totalPnL = totalMarketValue - totalFaceValue;
  const annualIncome = hybrids.reduce((sum, h) => sum + (h.lastDividend * 4 * h.unitsHeld), 0);

  const getRatingColor = (rating) => {
    if (rating.startsWith("A")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (rating.startsWith("BBB")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (rating.startsWith("BB")) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  };

  const getYearsToCall = (callDate) => {
    const years = (new Date(callDate) - new Date()) / (365.25 * 24 * 60 * 60 * 1000);
    return years.toFixed(1);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Prices updated");
    }, 1000);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="hybrids-trading-page">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hybrid Securities</h1>
            <p className="text-muted-foreground">Manage your bank hybrid and convertible note portfolio</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black">
              <Plus className="h-4 w-4 mr-2" />
              Add Hybrid
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Market Value</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalMarketValue)}</p>
              <p className={`text-sm ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)} ({((totalPnL/totalFaceValue)*100).toFixed(2)}%)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Average Yield</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{averageYield.toFixed(2)}%</p>
              <p className="text-sm text-muted-foreground">Running yield</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Annual Income</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(annualIncome)}</p>
              <p className="text-sm text-muted-foreground">Before franking</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Holdings</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{hybrids.length}</p>
              <p className="text-sm text-muted-foreground">Hybrid securities</p>
            </CardContent>
          </Card>
        </div>

        {/* Market Rates */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Key Benchmark Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 flex-wrap">
              <div>
                <span className="text-xs text-muted-foreground">3M BBSW</span>
                <p className="font-semibold text-foreground">{MARKET_RATES["3m_bbsw"]}%</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">RBA Cash Rate</span>
                <p className="font-semibold text-foreground">{MARKET_RATES["rba_cash"]}%</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">90D Bank Bill</span>
                <p className="font-semibold text-foreground">{MARKET_RATES["90d_bank_bill"]}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">Hybrid Securities Risk Notice</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Hybrid securities carry additional risks including conversion to equity, non-payment of distributions, 
                  and potential capital loss. They rank below bonds and deposits in the capital structure. 
                  Always read the Product Disclosure Statement before investing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted">
            <TabsTrigger value="portfolio" data-testid="hybrids-portfolio-tab">Portfolio</TabsTrigger>
            <TabsTrigger value="market" data-testid="hybrids-market-tab">Market</TabsTrigger>
            <TabsTrigger value="analysis" data-testid="hybrids-analysis-tab">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-4">
            {hybrids.map((hybrid) => (
              <Card key={hybrid.id} className="bg-card border-border" data-testid={`hybrid-card-${hybrid.name}`}>
                <CardContent className="pt-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-foreground">{hybrid.name}</h3>
                        <Badge className={getRatingColor(hybrid.rating)}>{hybrid.rating}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {hybrid.franking}% Franked
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{hybrid.fullName}</p>
                      <p className="text-xs text-muted-foreground">{hybrid.issuer}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Trading Price</p>
                        <p className="font-semibold text-foreground">${hybrid.tradingPrice.toFixed(2)}</p>
                        <p className={`text-xs ${hybrid.tradingPrice >= 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {hybrid.tradingPrice >= 100 ? '+' : ''}{(hybrid.tradingPrice - 100).toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Running Yield</p>
                        <p className="font-semibold text-[#D4A84C]">{hybrid.currentYield.toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">BBSW + {hybrid.marginOverBbsw}%</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Units Held</p>
                        <p className="font-semibold text-foreground">{hybrid.unitsHeld}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(hybrid.tradingPrice * hybrid.unitsHeld)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Call Date</p>
                        <p className="font-semibold text-foreground">{new Date(hybrid.callDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</p>
                        <p className="text-xs text-muted-foreground">{getYearsToCall(hybrid.callDate)} years</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Last Distribution</p>
                        <p className="font-semibold text-foreground">${hybrid.lastDividend.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{hybrid.frequency}</p>
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
            ))}
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Hybrid Market Overview</CardTitle>
                <CardDescription>Current market conditions for Australian hybrid securities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 text-foreground">Major Bank Hybrids</h4>
                    <div className="space-y-2">
                      {['CBA', 'WBC', 'ANZ', 'NAB'].map((bank) => (
                        <div key={bank} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-foreground">{bank}</span>
                          <div className="text-right">
                            <span className="font-semibold text-foreground">BBSW + 2.9-3.1%</span>
                            <p className="text-xs text-muted-foreground">Multiple issues trading</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 text-foreground">Upcoming Events</h4>
                    <div className="space-y-2">
                      <div className="p-2 bg-muted rounded">
                        <p className="font-medium text-foreground">CBAPD Distribution</p>
                        <p className="text-sm text-muted-foreground">Ex-date: Next quarter</p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="font-medium text-foreground">WBCPI Call Date</p>
                        <p className="text-sm text-muted-foreground">March 2027</p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="font-medium text-foreground">New Issues</p>
                        <p className="text-sm text-muted-foreground">Monitor for opportunities</p>
                      </div>
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
                  <CardTitle className="text-foreground">Portfolio Breakdown by Issuer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['CBA', 'Westpac', 'ANZ', 'NAB', 'Macquarie'].map((issuer, idx) => {
                      const value = [49250, 30360, 39120, 34825, 19260][idx];
                      const pct = (value / totalMarketValue) * 100;
                      return (
                        <div key={issuer}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground">{issuer}</span>
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
                  <CardTitle className="text-foreground">Yield Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded">
                      <span className="text-foreground">Weighted Avg Running Yield</span>
                      <span className="font-bold text-xl text-[#D4A84C]">{averageYield.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded">
                      <span className="text-foreground">Grossed-up Yield (100% franking)</span>
                      <span className="font-bold text-xl text-emerald-500">{(averageYield / 0.7).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded">
                      <span className="text-foreground">Avg Margin over BBSW</span>
                      <span className="font-bold text-xl text-foreground">3.13%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      * Grossed-up yield assumes investor in top marginal tax rate
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Call Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {hybrids.sort((a, b) => new Date(a.callDate) - new Date(b.callDate)).map((h) => (
                      <div key={h.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="font-medium text-foreground">{h.name}</span>
                        <div className="text-right">
                          <p className="text-sm text-foreground">{new Date(h.callDate).toLocaleDateString('en-AU')}</p>
                          <p className="text-xs text-muted-foreground">{getYearsToCall(h.callDate)} years</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Income Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded text-center">
                        <p className="text-sm text-muted-foreground">Annual Gross</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(annualIncome)}</p>
                      </div>
                      <div className="p-3 bg-muted rounded text-center">
                        <p className="text-sm text-muted-foreground">Quarterly Avg</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(annualIncome / 4)}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                      <p className="text-sm text-emerald-800 dark:text-emerald-400">
                        <strong>Franking Credits:</strong> ~{formatCurrency(annualIncome * 0.428)} p.a. (avg 90% franked)
                      </p>
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

export default HybridsTrading;
