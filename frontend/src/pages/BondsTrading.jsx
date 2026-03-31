import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Landmark, 
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
  Info
} from "lucide-react";
import { toast } from "sonner";

// Demo bond data
const DEMO_BONDS = [
  {
    id: 1,
    name: "Australian Government Bond",
    issuer: "Commonwealth of Australia",
    type: "Government",
    couponRate: 3.75,
    yieldToMaturity: 4.12,
    maturityDate: "2028-04-15",
    faceValue: 50000,
    currentValue: 48250,
    purchaseDate: "2023-06-15",
    rating: "AAA"
  },
  {
    id: 2,
    name: "NSW Treasury Bond",
    issuer: "NSW Treasury Corporation",
    type: "Semi-Government",
    couponRate: 4.25,
    yieldToMaturity: 4.45,
    maturityDate: "2030-06-20",
    faceValue: 30000,
    currentValue: 29100,
    purchaseDate: "2024-01-10",
    rating: "AA+"
  },
  {
    id: 3,
    name: "Westpac Floating Rate Note",
    issuer: "Westpac Banking Corporation",
    type: "Corporate",
    couponRate: 5.15,
    yieldToMaturity: 5.35,
    maturityDate: "2026-03-15",
    faceValue: 25000,
    currentValue: 24850,
    purchaseDate: "2024-03-01",
    rating: "AA-"
  },
  {
    id: 4,
    name: "CBA Senior Bond",
    issuer: "Commonwealth Bank of Australia",
    type: "Corporate",
    couponRate: 4.85,
    yieldToMaturity: 5.02,
    maturityDate: "2027-09-30",
    faceValue: 20000,
    currentValue: 19650,
    purchaseDate: "2024-06-15",
    rating: "AA-"
  }
];

const MARKET_RATES = {
  "3m_bbsw": 4.35,
  "10y_govt": 4.28,
  "5y_govt": 4.15,
  "rba_cash": 4.35
};

const BondsTrading = ({ embedded = false }) => {
  const [bonds, setBonds] = useState(DEMO_BONDS);
  const [activeTab, setActiveTab] = useState("portfolio");

  const totalFaceValue = bonds.reduce((sum, b) => sum + b.faceValue, 0);
  const totalCurrentValue = bonds.reduce((sum, b) => sum + b.currentValue, 0);
  const averageYield = bonds.reduce((sum, b) => sum + b.yieldToMaturity, 0) / bonds.length;
  const totalPnL = totalCurrentValue - totalFaceValue;

  const getRatingColor = (rating) => {
    if (rating.startsWith("AAA")) return "bg-emerald-100 text-emerald-800";
    if (rating.startsWith("AA")) return "bg-blue-100 text-blue-800";
    if (rating.startsWith("A")) return "bg-amber-100 text-amber-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const content = (
    <>
      <div className="space-y-6" data-testid="bonds-trading-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <Landmark className="h-7 w-7 text-[#D4A84C]" />
              Bonds & Fixed Income
            </h1>
            <p className="text-muted-foreground mt-1">
              Government, semi-government, and corporate bonds portfolio
            </p>
          </div>
          <Button className="bg-[#1a2744] hover:bg-[#1a2744]/90" data-testid="buy-bond-btn">
            <Plus className="h-4 w-4 mr-2" />
            Buy Bond
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
                  <p className="text-sm text-muted-foreground">Average Yield</p>
                  <p className="text-2xl font-bold">{averageYield.toFixed(2)}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Percent className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                  <p className={`text-2xl font-bold ${totalPnL >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {totalPnL >= 0 ? "+" : ""}{formatCurrency(totalPnL)}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full ${totalPnL >= 0 ? "bg-emerald-100" : "bg-red-100"} flex items-center justify-center`}>
                  {totalPnL >= 0 ? (
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
                  <p className="text-sm text-muted-foreground">Holdings</p>
                  <p className="text-2xl font-bold">{bonds.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Landmark className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Rates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Market Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">RBA Cash Rate</p>
                <p className="text-xl font-bold">{MARKET_RATES.rba_cash}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">3M BBSW</p>
                <p className="text-xl font-bold">{MARKET_RATES["3m_bbsw"]}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">5Y Govt</p>
                <p className="text-xl font-bold">{MARKET_RATES["5y_govt"]}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">10Y Govt</p>
                <p className="text-xl font-bold">{MARKET_RATES["10y_govt"]}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bond Holdings */}
        <Card>
          <CardHeader>
            <CardTitle>Your Bond Holdings</CardTitle>
            <CardDescription>Click on a bond to view details or trade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bonds.map((bond) => (
                <div 
                  key={bond.id}
                  className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                  data-testid={`bond-${bond.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{bond.name}</h4>
                        <Badge className={getRatingColor(bond.rating)}>{bond.rating}</Badge>
                        <Badge variant="outline">{bond.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{bond.issuer}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          Coupon: {bond.couponRate}%
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          YTM: {bond.yieldToMaturity}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Matures: {new Date(bond.maturityDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(bond.currentValue)}</p>
                      <p className={`text-sm ${bond.currentValue >= bond.faceValue ? "text-emerald-600" : "text-red-600"}`}>
                        {bond.currentValue >= bond.faceValue ? "+" : ""}
                        {formatCurrency(bond.currentValue - bond.faceValue)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Face: {formatCurrency(bond.faceValue)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">About Bonds</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Bonds provide steady income through regular coupon payments and are generally lower risk than equities. 
                  Government bonds (AAA rated) offer the highest security, while corporate bonds typically offer higher yields 
                  with slightly more risk.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default BondsTrading;
