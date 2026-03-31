import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Home, Building2, Bitcoin, 
  PiggyBank, BarChart3, PieChart, RefreshCw, ArrowUpRight, ArrowDownRight,
  Banknote, LineChart, Landmark, Plus, Minus, Edit, Trash2, Link2, CheckCircle,
  AlertCircle, Eye, EyeOff, Settings, Clock, ExternalLink, CreditCard
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', { 
    style: 'currency', 
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Transaction Dialog for Buy/Sell
const TransactionDialog = ({ isOpen, onClose, holding, type, onSubmit }) => {
  const [units, setUnits] = useState("");
  const [price, setPrice] = useState(holding?.current_price || holding?.price || "");

  const handleSubmit = () => {
    if (!units || !price) {
      toast.error("Please enter units and price");
      return;
    }
    onSubmit({
      ticker: holding?.ticker || holding?.symbol,
      type,
      units: parseFloat(units),
      price: parseFloat(price),
      total: parseFloat(units) * parseFloat(price)
    });
    setUnits("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "buy" ? <Plus className="h-5 w-5 text-green-600" /> : <Minus className="h-5 w-5 text-red-600" />}
            {type === "buy" ? "Buy" : "Sell"} {holding?.ticker || holding?.symbol || holding?.name}
          </DialogTitle>
          <DialogDescription>
            {type === "buy" ? "Add to your position" : "Reduce your position"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="units">Units</Label>
            <Input 
              id="units" 
              type="number" 
              value={units} 
              onChange={(e) => setUnits(e.target.value)}
              placeholder="Enter number of units"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Price per unit ($)</Label>
            <Input 
              id="price" 
              type="number" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
            />
          </div>
          {units && price && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-semibold">{formatCurrency(parseFloat(units) * parseFloat(price))}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            className={type === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {type === "buy" ? "Confirm Buy" : "Confirm Sell"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Add New Holding Dialog
const AddHoldingDialog = ({ isOpen, onClose, assetType, onSubmit }) => {
  const [formData, setFormData] = useState({
    ticker: "",
    name: "",
    units: "",
    price: "",
    type: assetType
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.units || !formData.price) {
      toast.error("Please fill in all fields");
      return;
    }
    onSubmit({
      ...formData,
      units: parseFloat(formData.units),
      price: parseFloat(formData.price),
      value: parseFloat(formData.units) * parseFloat(formData.price)
    });
    setFormData({ ticker: "", name: "", units: "", price: "", type: assetType });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#D4A84C]" />
            Add New {assetType === "shares" ? "Share" : assetType === "crypto" ? "Cryptocurrency" : "Holding"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {(assetType === "shares" || assetType === "crypto") && (
            <div className="grid gap-2">
              <Label htmlFor="ticker">Ticker/Symbol</Label>
              <Input 
                id="ticker" 
                value={formData.ticker} 
                onChange={(e) => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
                placeholder="e.g. BHP, BTC"
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="units">Units/Quantity</Label>
            <Input 
              id="units" 
              type="number"
              value={formData.units} 
              onChange={(e) => setFormData({...formData, units: e.target.value})}
              placeholder="Enter quantity"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Price per unit ($)</Label>
            <Input 
              id="price" 
              type="number"
              value={formData.price} 
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="Enter current price"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-[#1a2744]">Add Holding</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ClientWealth() {
  const navigate = useNavigate();
  const [wealthData, setWealthData] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [transactionDialog, setTransactionDialog] = useState({ open: false, holding: null, type: "buy" });
  const [addHoldingDialog, setAddHoldingDialog] = useState({ open: false, type: "shares" });
  const clientId = localStorage.getItem("active_client_id") || "client_1";

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wealthRes, accountsRes] = await Promise.all([
        axios.get(`${API}/wealth/overview/${clientId}`),
        axios.get(`${API}/aggregation/accounts`)
      ]);
      setWealthData(wealthRes.data);
      setConnectedAccounts(accountsRes.data.accounts || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = (transaction) => {
    toast.success(`${transaction.type === "buy" ? "Bought" : "Sold"} ${transaction.units} units of ${transaction.ticker} at ${formatCurrency(transaction.price)}`);
    // In real app, this would update backend
    fetchData();
  };

  const handleAddHolding = (holding) => {
    toast.success(`Added ${holding.name} to your portfolio`);
    // In real app, this would update backend
    fetchData();
  };

  const getAssetIcon = (assetClass) => {
    const icons = {
      cash: <Banknote className="w-5 h-5" />,
      shares: <LineChart className="w-5 h-5" />,
      etfs: <BarChart3 className="w-5 h-5" />,
      managed_funds: <PieChart className="w-5 h-5" />,
      property: <Home className="w-5 h-5" />,
      super: <Landmark className="w-5 h-5" />,
      crypto: <Bitcoin className="w-5 h-5" />,
      other: <Wallet className="w-5 h-5" />
    };
    return icons[assetClass] || <Wallet className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="client-wealth-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wallet className="h-8 w-8 text-[#D4A84C]" />
              Wealth Overview
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete view of all assets and connected accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => navigate("/connected-accounts")} className="bg-[#1a2744]">
              <Link2 className="h-4 w-4 mr-2" />
              Manage Accounts
            </Button>
          </div>
        </div>

        {/* Net Worth Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2 bg-gradient-to-br from-[#1a2744] to-[#2d3a5c] text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Net Worth</p>
                  <p className="text-4xl font-bold mt-1">
                    {formatCurrency(wealthData?.summary?.net_worth || 0)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-white/20 text-white border-0">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +{wealthData?.summary?.net_worth_change_percent_ytd || 0}% YTD
                    </Badge>
                    <span className="text-blue-200 text-sm">
                      +{formatCurrency(wealthData?.summary?.net_worth_change_ytd || 0)}
                    </span>
                  </div>
                </div>
                <Wallet className="w-16 h-16 text-white/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(wealthData?.summary?.total_assets || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Liabilities</p>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(wealthData?.summary?.total_liabilities || 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Connected Accounts Summary */}
        {connectedAccounts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="h-5 w-5 text-[#D4A84C]" />
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {connectedAccounts.slice(0, 5).map((account, idx) => (
                  <div key={`item-${idx}`} className="flex-shrink-0 bg-muted rounded-lg p-3 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-sm">{account.institution}</span>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(account.balance)}</p>
                    <p className="text-xs text-muted-foreground">{account.type}</p>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="flex-shrink-0 h-auto min-w-[120px]"
                  onClick={() => navigate("/connected-accounts")}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add More
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Asset Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#D4A84C]" />
              Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {wealthData?.asset_allocation && Object.entries(wealthData.asset_allocation).map(([key, data]) => (
                <div key={key} className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1a2744] flex items-center justify-center text-white">
                      {getAssetIcon(key)}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{key.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(data.value)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-medium">{data.percent}%</span>
                    </div>
                    <Progress value={data.percent} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Target: {data.target}%</span>
                      <span className={data.percent > data.target ? 'text-amber-600' : data.percent < data.target - 2 ? 'text-blue-600' : 'text-green-600'}>
                        {data.percent > data.target ? 'Overweight' : data.percent < data.target - 2 ? 'Underweight' : 'On Target'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="shares">Shares</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="super">Super</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            <TabsTrigger value="cash">Cash</TabsTrigger>
          </TabsList>

          <TabsContent value="shares" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-[#D4A84C]" />
                    Share Portfolio
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-green-600">
                      +{formatCurrency(wealthData?.shares?.unrealized_gain || 0)} unrealized
                    </Badge>
                    <Button size="sm" onClick={() => setAddHoldingDialog({ open: true, type: "shares" })}>
                      <Plus className="h-4 w-4 mr-1" /> Add Share
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-3 text-muted-foreground font-medium">Stock</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Units</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Avg Cost</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Current</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Value</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Gain</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wealthData?.shares?.holdings?.map((holding) => (
                        <tr key={holding.ticker} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <p className="font-semibold">{holding.ticker}</p>
                            <p className="text-sm text-muted-foreground">{holding.name}</p>
                          </td>
                          <td className="p-3 text-right">{holding.units.toLocaleString()}</td>
                          <td className="p-3 text-right text-muted-foreground">${holding.avg_cost.toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">${holding.current_price.toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(holding.value)}</td>
                          <td className="p-3 text-right">
                            <span className={holding.gain_percent >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {holding.gain_percent >= 0 ? '+' : ''}{holding.gain_percent.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => setTransactionDialog({ open: true, holding, type: "buy" })}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Buy
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setTransactionDialog({ open: true, holding, type: "sell" })}
                              >
                                <Minus className="h-3 w-3 mr-1" /> Sell
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="property" className="mt-4">
            <div className="grid gap-4">
              {wealthData?.property?.properties?.map((property, idx) => (
                <Card key={`item-${idx}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                          property.type === 'ppor' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <Home className={`w-7 h-7 ${property.type === 'ppor' ? 'text-green-600' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{property.address}</p>
                          <Badge className={property.type === 'ppor' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                            {property.type === 'ppor' ? 'Primary Residence' : 'Investment Property'}
                          </Badge>
                          <p className="text-muted-foreground text-sm mt-2">Purchased: {property.purchase_date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-sm">Current Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(property.value)}</p>
                        <Button size="sm" variant="outline" className="mt-2">
                          <Edit className="h-3 w-3 mr-1" /> Update
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t">
                      <div>
                        <p className="text-muted-foreground text-sm">Purchase Price</p>
                        <p className="font-medium">{formatCurrency(property.purchase_price)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Mortgage Balance</p>
                        <p className="font-medium">{formatCurrency(property.mortgage_balance)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Equity</p>
                        <p className="font-medium text-green-600">{formatCurrency(property.equity)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">{property.type === 'investment' ? 'Rental Income' : 'Interest Rate'}</p>
                        <p className="font-medium">
                          {property.type === 'investment' ? `$${property.rental_income}/wk` : `${property.mortgage_rate}%`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" className="w-full py-8 border-dashed">
                <Plus className="h-5 w-5 mr-2" /> Add Property
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="super" className="mt-4">
            <div className="grid gap-4">
              {wealthData?.super?.funds?.map((fund, idx) => (
                <Card key={`item-${idx}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-lg bg-cyan-100 flex items-center justify-center">
                          <Landmark className="w-7 h-7 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{fund.fund_name}</p>
                          <Badge className="bg-purple-100 text-purple-700">{fund.investment_option}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-sm">Balance</p>
                        <p className="text-2xl font-bold">{formatCurrency(fund.balance)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-muted-foreground text-sm">1 Year Return</p>
                        <p className="text-green-600 font-bold text-lg">+{fund.return_1y}%</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-muted-foreground text-sm">5 Year Return</p>
                        <p className="text-green-600 font-bold text-lg">+{fund.return_5y}% p.a.</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-muted-foreground text-sm">Annual Fees</p>
                        <p className="font-bold text-lg">{formatCurrency(fund.fees_pa)}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-muted-foreground text-sm">Insurance</p>
                        <p className="font-bold text-lg">{fund.insurance ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Contribution Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Contribution Summary (YTD)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">Employer</p>
                      <p className="text-xl font-bold">{formatCurrency(wealthData?.super?.contributions_ytd?.employer || 0)}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">Personal</p>
                      <p className="text-xl font-bold">{formatCurrency(wealthData?.super?.contributions_ytd?.personal || 0)}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">Concessional Cap Left</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(wealthData?.super?.caps?.concessional_remaining || 0)}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">Non-Concessional Left</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(wealthData?.super?.caps?.non_concessional_remaining || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="crypto" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bitcoin className="h-5 w-5 text-[#D4A84C]" />
                    Cryptocurrency Holdings
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-green-600">
                      +{formatCurrency(wealthData?.crypto?.unrealized_gain || 0)} unrealized
                    </Badge>
                    <Button size="sm" onClick={() => setAddHoldingDialog({ open: true, type: "crypto" })}>
                      <Plus className="h-4 w-4 mr-1" /> Add Crypto
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {wealthData?.crypto?.holdings?.map((holding) => (
                    <div key={holding.symbol} className="bg-muted rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          holding.symbol === 'BTC' ? 'bg-orange-100' : 
                          holding.symbol === 'ETH' ? 'bg-purple-100' : 'bg-cyan-100'
                        }`}>
                          <span className={`font-bold ${
                            holding.symbol === 'BTC' ? 'text-orange-600' : 
                            holding.symbol === 'ETH' ? 'text-purple-600' : 'text-cyan-600'
                          }`}>{holding.symbol}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{holding.name}</p>
                          <p className="text-muted-foreground text-sm">{holding.units} {holding.symbol}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-muted-foreground text-sm">Price</p>
                          <p className="font-medium">${holding.current_price.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-sm">Value</p>
                          <p className="font-medium">{formatCurrency(holding.value)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-sm">Gain</p>
                          <p className={`font-medium ${(holding.value - holding.cost_base) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(holding.value - holding.cost_base) >= 0 ? '+' : ''}{formatCurrency(holding.value - holding.cost_base)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 px-2 text-green-600"
                            onClick={() => setTransactionDialog({ open: true, holding, type: "buy" })}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 px-2 text-red-600"
                            onClick={() => setTransactionDialog({ open: true, holding, type: "sell" })}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-sm mt-4">Exchange: {wealthData?.crypto?.exchange}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cash" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-[#D4A84C]" />
                    Cash & Bank Accounts
                  </CardTitle>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">Total Cash</p>
                    <p className="font-bold text-xl">{formatCurrency(wealthData?.cash?.total || 0)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {wealthData?.cash?.accounts?.map((account, idx) => (
                    <div key={`item-${idx}`} className="bg-muted rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          account.type === 'term_deposit' ? 'bg-purple-100' : 
                          account.type === 'savings' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <PiggyBank className={`w-6 h-6 ${
                            account.type === 'term_deposit' ? 'text-purple-600' : 
                            account.type === 'savings' ? 'text-green-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold">{account.name}</p>
                          <Badge variant="outline" className="capitalize">{account.type.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-muted-foreground text-sm">Interest Rate</p>
                          <p className="text-green-600 font-medium">{account.interest_rate}%</p>
                        </div>
                        {account.maturity && (
                          <div className="text-right">
                            <p className="text-muted-foreground text-sm">Maturity</p>
                            <p className="font-medium">{account.maturity}</p>
                          </div>
                        )}
                        <div className="text-right min-w-[120px]">
                          <p className="text-muted-foreground text-sm">Balance</p>
                          <p className="font-bold text-lg">{formatCurrency(account.balance)}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-muted-foreground">
                    Interest Earned YTD: <span className="text-green-600 font-medium">{formatCurrency(wealthData?.cash?.total_interest_earned_ytd || 0)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Transaction Dialog */}
        <TransactionDialog 
          isOpen={transactionDialog.open}
          onClose={() => setTransactionDialog({ open: false, holding: null, type: "buy" })}
          holding={transactionDialog.holding}
          type={transactionDialog.type}
          onSubmit={handleTransaction}
        />

        {/* Add Holding Dialog */}
        <AddHoldingDialog
          isOpen={addHoldingDialog.open}
          onClose={() => setAddHoldingDialog({ open: false, type: "shares" })}
          assetType={addHoldingDialog.type}
          onSubmit={handleAddHolding}
        />
      </div>
    </Layout>
  );
}
