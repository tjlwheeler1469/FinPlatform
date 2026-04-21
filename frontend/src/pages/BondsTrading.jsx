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
  Pencil,
  Trash2,
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
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [editingBond, setEditingBond] = useState(null);
  const emptyBond = { name: "", issuer: "", type: "Government", couponRate: "", yieldToMaturity: "", maturityDate: "", faceValue: "", currentValue: "", rating: "AAA" };
  const [newBond, setNewBond] = useState(emptyBond);

  const handleBuyBond = () => {
    if (!newBond.name || !newBond.faceValue) { toast.error("Bond name and face value required"); return; }
    setBonds([...bonds, {
      id: Math.max(0, ...bonds.map((b) => b.id)) + 1,
      ...newBond,
      faceValue: parseFloat(newBond.faceValue) || 0,
      currentValue: parseFloat(newBond.currentValue || newBond.faceValue) || 0,
      couponRate: parseFloat(newBond.couponRate) || 0,
      yieldToMaturity: parseFloat(newBond.yieldToMaturity) || 0,
      purchaseDate: new Date().toISOString().split("T")[0],
    }]);
    setShowBuyDialog(false);
    setNewBond(emptyBond);
    toast.success("Bond added to portfolio");
  };

  const handleSaveBondEdit = () => {
    if (!editingBond?.name) { toast.error("Name required"); return; }
    setBonds(bonds.map((b) => (b.id === editingBond.id ? { ...editingBond, faceValue: parseFloat(editingBond.faceValue) || 0, currentValue: parseFloat(editingBond.currentValue) || 0, couponRate: parseFloat(editingBond.couponRate) || 0, yieldToMaturity: parseFloat(editingBond.yieldToMaturity) || 0 } : b)));
    setEditingBond(null);
    toast.success("Bond updated");
  };

  const handleDeleteBond = (id) => {
    if (!window.confirm("Remove this bond?")) return;
    setBonds(bonds.filter((b) => b.id !== id));
    toast.success("Bond removed");
  };

  const totalFaceValue = bonds.reduce((sum, b) => sum + b.faceValue, 0);
  const totalCurrentValue = bonds.reduce((sum, b) => sum + b.currentValue, 0);
  const averageYield = bonds.length > 0 ? bonds.reduce((sum, b) => sum + b.yieldToMaturity, 0) / bonds.length : 0;
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
          <Button className="bg-[#1a2744] hover:bg-[#1a2744]/90" data-testid="buy-bond-btn" onClick={() => setShowBuyDialog(true)}>
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
                      <div className="flex justify-end gap-1 mt-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingBond({ ...bond }); }} data-testid={`edit-bond-${bond.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteBond(bond.id); }} data-testid={`delete-bond-${bond.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Buy Bond Dialog */}
        {showBuyDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBuyDialog(false)}>
            <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">Buy Bond</h2>
              <div className="space-y-3">
                <div><Label>Bond Name *</Label><Input value={newBond.name} onChange={(e) => setNewBond({ ...newBond, name: e.target.value })} data-testid="buy-bond-name" placeholder="e.g. Australian Government Bond" /></div>
                <div><Label>Issuer</Label><Input value={newBond.issuer} onChange={(e) => setNewBond({ ...newBond, issuer: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Type</Label>
                    <select value={newBond.type} onChange={(e) => setNewBond({ ...newBond, type: e.target.value })} className="w-full h-9 border rounded px-2 text-sm">
                      <option>Government</option><option>Semi-Government</option><option>Corporate</option><option>Floating Rate</option>
                    </select>
                  </div>
                  <div><Label>Rating</Label>
                    <select value={newBond.rating} onChange={(e) => setNewBond({ ...newBond, rating: e.target.value })} className="w-full h-9 border rounded px-2 text-sm">
                      <option>AAA</option><option>AA+</option><option>AA</option><option>AA-</option><option>A+</option><option>A</option><option>A-</option><option>BBB</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Face Value *</Label><Input type="number" value={newBond.faceValue} onChange={(e) => setNewBond({ ...newBond, faceValue: e.target.value })} data-testid="buy-bond-face" /></div>
                  <div><Label>Current Value</Label><Input type="number" value={newBond.currentValue} onChange={(e) => setNewBond({ ...newBond, currentValue: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Coupon %</Label><Input type="number" step="0.01" value={newBond.couponRate} onChange={(e) => setNewBond({ ...newBond, couponRate: e.target.value })} /></div>
                  <div><Label>YTM %</Label><Input type="number" step="0.01" value={newBond.yieldToMaturity} onChange={(e) => setNewBond({ ...newBond, yieldToMaturity: e.target.value })} /></div>
                </div>
                <div><Label>Maturity Date</Label><Input type="date" value={newBond.maturityDate} onChange={(e) => setNewBond({ ...newBond, maturityDate: e.target.value })} /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowBuyDialog(false)}>Cancel</Button>
                <Button className="flex-1 bg-[#1a2744]" onClick={handleBuyBond} data-testid="confirm-buy-bond">Add Bond</Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bond Dialog */}
        {editingBond && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingBond(null)}>
            <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">Edit Bond</h2>
              <div className="space-y-3">
                <div><Label>Bond Name *</Label><Input value={editingBond.name} onChange={(e) => setEditingBond({ ...editingBond, name: e.target.value })} /></div>
                <div><Label>Issuer</Label><Input value={editingBond.issuer} onChange={(e) => setEditingBond({ ...editingBond, issuer: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Face Value</Label><Input type="number" value={editingBond.faceValue} onChange={(e) => setEditingBond({ ...editingBond, faceValue: e.target.value })} /></div>
                  <div><Label>Current Value</Label><Input type="number" value={editingBond.currentValue} onChange={(e) => setEditingBond({ ...editingBond, currentValue: e.target.value })} /></div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditingBond(null)}>Cancel</Button>
                <Button className="flex-1 bg-[#1a2744]" onClick={handleSaveBondEdit} data-testid="save-bond-edit">Save</Button>
              </div>
            </div>
          </div>
        )}

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
