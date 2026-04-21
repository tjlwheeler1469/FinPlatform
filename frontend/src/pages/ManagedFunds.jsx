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
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Globe,
  Building2,
  Briefcase,
  Info,
  Star
} from "lucide-react";
import { toast } from "sonner";

// Demo managed fund data
const DEMO_FUNDS = [
  {
    id: 1,
    name: "Vanguard Diversified High Growth",
    code: "VAN0111AU",
    manager: "Vanguard",
    category: "Multi-Asset",
    riskLevel: "High",
    units: 1250,
    unitPrice: 2.45,
    currentValue: 3062.50,
    purchaseValue: 2800,
    return1y: 12.5,
    return3y: 8.2,
    return5y: 9.8,
    mer: 0.27,
    rating: 5
  },
  {
    id: 2,
    name: "Magellan Global Fund",
    code: "MGE0001AU",
    manager: "Magellan",
    category: "International Equities",
    riskLevel: "High",
    units: 850,
    unitPrice: 1.82,
    currentValue: 1547,
    purchaseValue: 1650,
    return1y: -5.2,
    return3y: 4.8,
    return5y: 7.2,
    mer: 1.35,
    rating: 4
  },
  {
    id: 3,
    name: "PIMCO Australian Bond Fund",
    code: "PIM0001AU",
    manager: "PIMCO",
    category: "Fixed Income",
    riskLevel: "Low",
    units: 3500,
    unitPrice: 1.12,
    currentValue: 3920,
    purchaseValue: 3800,
    return1y: 4.2,
    return3y: 2.8,
    return5y: 3.5,
    mer: 0.65,
    rating: 5
  },
  {
    id: 4,
    name: "Platinum International Fund",
    code: "PLA0001AU",
    manager: "Platinum",
    category: "International Equities",
    riskLevel: "High",
    units: 500,
    unitPrice: 3.25,
    currentValue: 1625,
    purchaseValue: 1500,
    return1y: 8.3,
    return3y: 6.1,
    return5y: 5.8,
    mer: 1.10,
    rating: 4
  },
  {
    id: 5,
    name: "Australian Foundation Investment",
    code: "AFI",
    manager: "AFIC",
    category: "Australian Equities",
    riskLevel: "Medium",
    units: 2000,
    unitPrice: 7.85,
    currentValue: 15700,
    purchaseValue: 14500,
    return1y: 9.8,
    return3y: 7.5,
    return5y: 8.2,
    mer: 0.14,
    rating: 5
  }
];

const FUND_CATEGORIES = [
  { name: "Australian Equities", allocation: 25 },
  { name: "International Equities", allocation: 35 },
  { name: "Fixed Income", allocation: 20 },
  { name: "Multi-Asset", allocation: 15 },
  { name: "Cash", allocation: 5 }
];

const ManagedFunds = ({ embedded = false }) => {
  const [funds, setFunds] = useState(DEMO_FUNDS);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [showInvestDialog, setShowInvestDialog] = useState(false);
  const emptyFund = { name: "", manager: "", category: "Australian Equities", risk: "Medium", mer: "", purchaseValue: "", currentValue: "", rating: 4 };
  const [newFund, setNewFund] = useState(emptyFund);

  const investInFund = () => {
    if (!newFund.name || !newFund.purchaseValue) { toast.error("Name and investment amount required"); return; }
    const purchaseValue = parseFloat(newFund.purchaseValue) || 0;
    setFunds([...funds, {
      id: Math.max(0, ...funds.map((f) => f.id)) + 1,
      ...newFund,
      purchaseValue,
      currentValue: parseFloat(newFund.currentValue) || purchaseValue,
      mer: parseFloat(newFund.mer) || 0,
      purchaseDate: new Date().toISOString().split("T")[0],
      apir: `NEW${String(funds.length + 1).padStart(4, "0")}AU`,
    }]);
    setShowInvestDialog(false);
    setNewFund(emptyFund);
    toast.success("Investment added to portfolio");
  };

  const removeFund = (id) => {
    if (!window.confirm("Redeem/remove this fund?")) return;
    setFunds(funds.filter((f) => f.id !== id));
    toast.success("Fund removed");
  };

  const totalCurrentValue = funds.reduce((sum, f) => sum + f.currentValue, 0);
  const totalPurchaseValue = funds.reduce((sum, f) => sum + f.purchaseValue, 0);
  const totalReturn = totalCurrentValue - totalPurchaseValue;
  const returnPercent = totalPurchaseValue > 0 ? ((totalCurrentValue / totalPurchaseValue) - 1) * 100 : 0;
  const avgMER = funds.length > 0 ? funds.reduce((sum, f) => sum + f.mer, 0) / funds.length : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "Low": return "bg-emerald-100 text-emerald-800";
      case "Medium": return "bg-amber-100 text-amber-800";
      case "High": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Australian Equities": return <Building2 className="h-4 w-4" />;
      case "International Equities": return <Globe className="h-4 w-4" />;
      case "Fixed Income": return <Briefcase className="h-4 w-4" />;
      case "Multi-Asset": return <PieChart className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={`item-${i}`} 
        className={`h-3 w-3 ${i < rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} 
      />
    ));
  };

  const content = (
    <>
      <div className="space-y-6" data-testid="managed-funds-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <PieChart className="h-7 w-7 text-[#D4A84C]" />
              Managed Funds
            </h1>
            <p className="text-muted-foreground mt-1">
              Active and index managed investment funds
            </p>
          </div>
          <Button className="bg-[#1a2744] hover:bg-[#1a2744]/90" data-testid="invest-btn" onClick={() => setShowInvestDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Invest in Fund
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Return</p>
                  <p className={`text-2xl font-bold ${totalReturn >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {totalReturn >= 0 ? "+" : ""}{formatCurrency(totalReturn)}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full ${totalReturn >= 0 ? "bg-emerald-100" : "bg-red-100"} flex items-center justify-center`}>
                  {totalReturn >= 0 ? (
                    <ArrowUpRight className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Return %</p>
                  <p className={`text-2xl font-bold ${returnPercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {returnPercent >= 0 ? "+" : ""}{returnPercent.toFixed(1)}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Percent className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg MER</p>
                  <p className="text-2xl font-bold">{avgMER.toFixed(2)}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="portfolio">Your Funds</TabsTrigger>
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <CardTitle>Fund Holdings</CardTitle>
                <CardDescription>Click on a fund to view details or trade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funds.map((fund) => (
                    <div 
                      key={fund.id}
                      className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                      data-testid={`fund-${fund.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{fund.name}</h4>
                            <Badge variant="outline">{fund.code}</Badge>
                            <Badge className={getRiskColor(fund.riskLevel)}>{fund.riskLevel}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {getCategoryIcon(fund.category)}
                              {fund.category}
                            </span>
                            <span>{fund.manager}</span>
                            <span className="flex items-center gap-0.5">
                              {renderStars(fund.rating)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>
                              <span className="text-muted-foreground">1Y: </span>
                              <span className={fund.return1y >= 0 ? "text-emerald-600" : "text-red-600"}>
                                {fund.return1y >= 0 ? "+" : ""}{fund.return1y}%
                              </span>
                            </span>
                            <span>
                              <span className="text-muted-foreground">3Y: </span>
                              <span className={fund.return3y >= 0 ? "text-emerald-600" : "text-red-600"}>
                                {fund.return3y >= 0 ? "+" : ""}{fund.return3y}%
                              </span>
                            </span>
                            <span>
                              <span className="text-muted-foreground">5Y: </span>
                              <span className={fund.return5y >= 0 ? "text-emerald-600" : "text-red-600"}>
                                {fund.return5y >= 0 ? "+" : ""}{fund.return5y}%
                              </span>
                            </span>
                            <span>
                              <span className="text-muted-foreground">MER: </span>
                              {fund.mer}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(fund.currentValue)}</p>
                          <p className={`text-sm ${fund.currentValue >= fund.purchaseValue ? "text-emerald-600" : "text-red-600"}`}>
                            {fund.currentValue >= fund.purchaseValue ? "+" : ""}
                            {formatCurrency(fund.currentValue - fund.purchaseValue)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {fund.units.toLocaleString()} units @ ${fund.unitPrice}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allocation Tab */}
          <TabsContent value="allocation">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Diversification across fund categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {FUND_CATEGORIES.map((cat, index) => (
                    <div key={`item-${index}`} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {getCategoryIcon(cat.name)}
                          {cat.name}
                        </span>
                        <span className="font-medium">{cat.allocation}%</span>
                      </div>
                      <Progress value={cat.allocation} className="h-3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Returns by fund over different time periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Fund</th>
                        <th className="text-right py-3 px-4">1 Year</th>
                        <th className="text-right py-3 px-4">3 Years (p.a.)</th>
                        <th className="text-right py-3 px-4">5 Years (p.a.)</th>
                        <th className="text-right py-3 px-4">MER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {funds.map((fund) => (
                        <tr key={fund.id} className="border-b">
                          <td className="py-3 px-4">
                            <p className="font-medium">{fund.name}</p>
                            <p className="text-xs text-muted-foreground">{fund.manager}</p>
                          </td>
                          <td className={`text-right py-3 px-4 ${fund.return1y >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {fund.return1y >= 0 ? "+" : ""}{fund.return1y}%
                          </td>
                          <td className={`text-right py-3 px-4 ${fund.return3y >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {fund.return3y >= 0 ? "+" : ""}{fund.return3y}%
                          </td>
                          <td className={`text-right py-3 px-4 ${fund.return5y >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {fund.return5y >= 0 ? "+" : ""}{fund.return5y}%
                          </td>
                          <td className="text-right py-3 px-4">{fund.mer}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">About Managed Funds</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Managed funds pool money from multiple investors to invest in a diversified portfolio managed by professionals. 
                  The Management Expense Ratio (MER) is the annual fee charged. Index funds typically have lower MERs than 
                  actively managed funds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const investDialog = showInvestDialog && (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInvestDialog(false)}>
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Invest in Fund</h2>
        <div className="space-y-3">
          <div><Label>Fund Name *</Label><Input value={newFund.name} onChange={(e) => setNewFund({ ...newFund, name: e.target.value })} data-testid="fund-name" /></div>
          <div><Label>Fund Manager</Label><Input value={newFund.manager} onChange={(e) => setNewFund({ ...newFund, manager: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <select value={newFund.category} onChange={(e) => setNewFund({ ...newFund, category: e.target.value })} className="w-full h-9 border rounded px-2 text-sm">
                <option>Australian Equities</option><option>International Equities</option><option>Fixed Income</option><option>Multi-Asset</option><option>Property</option><option>Infrastructure</option>
              </select>
            </div>
            <div><Label>Risk</Label>
              <select value={newFund.risk} onChange={(e) => setNewFund({ ...newFund, risk: e.target.value })} className="w-full h-9 border rounded px-2 text-sm">
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Purchase Value *</Label><Input type="number" value={newFund.purchaseValue} onChange={(e) => setNewFund({ ...newFund, purchaseValue: e.target.value })} data-testid="fund-purchase" /></div>
            <div><Label>Current Value</Label><Input type="number" value={newFund.currentValue} onChange={(e) => setNewFund({ ...newFund, currentValue: e.target.value })} /></div>
          </div>
          <div><Label>MER %</Label><Input type="number" step="0.01" value={newFund.mer} onChange={(e) => setNewFund({ ...newFund, mer: e.target.value })} /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setShowInvestDialog(false)}>Cancel</Button>
          <Button className="flex-1 bg-[#1a2744]" onClick={investInFund} data-testid="confirm-invest">Add Investment</Button>
        </div>
      </div>
    </div>
  );

  return embedded ? <>{content}{investDialog}</> : <Layout>{content}{investDialog}</Layout>;
};

export default ManagedFunds;
