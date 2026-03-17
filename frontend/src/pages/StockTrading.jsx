import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Calculator,
  Receipt,
  Clock,
  Calendar,
  Percent,
  Building,
  ShoppingCart,
  Minus,
  Plus,
  ChevronRight,
  Eye,
  FileText,
  Zap
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercent = (value) => {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
};

const StockTrading = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get('client');
  
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(clientIdFromUrl || "client_1");
  const [holdings, setHoldings] = useState(null);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [cgtSummary, setCgtSummary] = useState(null);
  const [orderPreview, setOrderPreview] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderForm, setOrderForm] = useState({
    side: "sell",
    units: 0,
    price: 0
  });

  const clients = [
    { id: "client_1", name: "Wheeler Family" },
    { id: "client_2", name: "Chen Investment Trust" },
    { id: "client_3", name: "Thompson SMSF" },
    { id: "client_4", name: "Patel Holdings" }
  ];

  const fetchHoldings = useCallback(async () => {
    setLoading(true);
    try {
      const [holdingsRes, cgtRes] = await Promise.all([
        fetch(`${API_URL}/api/trading/holdings/${selectedClient}`),
        fetch(`${API_URL}/api/trading/cgt-summary/${selectedClient}`)
      ]);
      
      if (holdingsRes.ok) {
        const data = await holdingsRes.json();
        setHoldings(data);
      }
      if (cgtRes.ok) {
        const data = await cgtRes.json();
        setCgtSummary(data);
      }
    } catch (err) {
      console.error("Error fetching holdings:", err);
      toast.error("Failed to load holdings");
    } finally {
      setLoading(false);
    }
  }, [selectedClient]);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const calculateCGTPreview = async (symbol, units) => {
    try {
      const res = await fetch(`${API_URL}/api/trading/calculate-cgt?client_id=${selectedClient}&symbol=${symbol}&units_to_sell=${units}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("Error calculating CGT:", err);
    }
    return null;
  };

  const openOrderDialog = async (holding, side) => {
    setSelectedHolding(holding);
    setOrderForm({
      side,
      units: side === "sell" ? Math.floor(holding.units * 0.5) : 100,
      price: holding.current_price
    });
    setShowOrderDialog(true);
    
    // Calculate CGT preview for sell orders
    if (side === "sell") {
      const preview = await calculateCGTPreview(holding.symbol, Math.floor(holding.units * 0.5));
      setOrderPreview(preview);
    } else {
      setOrderPreview(null);
    }
  };

  const updateOrderUnits = async (units) => {
    setOrderForm(prev => ({ ...prev, units }));
    if (orderForm.side === "sell" && selectedHolding) {
      const preview = await calculateCGTPreview(selectedHolding.symbol, units);
      setOrderPreview(preview);
    }
  };

  const executeOrder = async () => {
    try {
      const endpoint = orderForm.side === "sell" ? "decrease-holding" : "increase-holding";
      const params = new URLSearchParams({
        client_id: selectedClient,
        symbol: selectedHolding.symbol,
        ...(orderForm.side === "sell" 
          ? { units_to_sell: orderForm.units, sale_price: orderForm.price }
          : { additional_units: orderForm.units, purchase_price: orderForm.price }
        )
      });
      
      const res = await fetch(`${API_URL}/api/trading/${endpoint}?${params}`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(`Order executed: ${orderForm.side === "sell" ? "Sold" : "Bought"} ${orderForm.units} units of ${selectedHolding.symbol}`);
        setShowOrderDialog(false);
        fetchHoldings();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Order failed");
      }
    } catch (err) {
      toast.error("Order execution failed");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-[#1a2744]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="stock-trading-page">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-[#D4A84C]" />
              Stock Trading
            </h1>
            <p className="text-muted-foreground">Buy and sell holdings with CGT calculations</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={fetchHoldings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Demo Mode Alert */}
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Demo Mode:</strong> All trades are simulated. No real money is used. Connect broker API for live trading.
          </AlertDescription>
        </Alert>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Portfolio Value</p>
              <p className="text-2xl font-bold text-[#1a2744]">
                {formatCurrency(holdings?.summary?.total_value || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Cost Base</p>
              <p className="text-2xl font-bold text-[#1a2744]">
                {formatCurrency(holdings?.summary?.total_cost_base || 0)}
              </p>
            </CardContent>
          </Card>
          <Card className={holdings?.summary?.total_unrealized_gain >= 0 ? "bg-green-50" : "bg-red-50"}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Unrealized Gain/Loss</p>
              <p className={`text-2xl font-bold ${holdings?.summary?.total_unrealized_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(holdings?.summary?.total_unrealized_gain || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Gains (Holdings)</p>
              <p className="text-2xl font-bold text-green-600">
                {holdings?.summary?.gains_count || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Losses (Holdings)</p>
              <p className="text-2xl font-bold text-red-600">
                {holdings?.summary?.losses_count || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Holdings List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Holdings - {holdings?.client_name}
                </CardTitle>
                <CardDescription>Click on a holding to trade</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {holdings?.holdings?.map((holding) => (
                      <div 
                        key={holding.symbol}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-[#1a2744]">{holding.symbol}</h4>
                              <Badge variant="outline" className="text-xs">{holding.sector}</Badge>
                              {holding.eligible_for_cgt_discount && (
                                <Badge className="bg-green-500 text-xs">CGT Discount</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{holding.name}</p>
                          </div>
                          <div className={`flex items-center gap-1 ${holding.unrealized_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {holding.unrealized_gain >= 0 ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                            <span className="font-bold">{formatPercent(holding.unrealized_gain_pct)}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-muted-foreground text-xs">Units</p>
                            <p className="font-medium">{holding.units.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Avg Cost</p>
                            <p className="font-medium">${holding.avg_cost.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Current Price</p>
                            <p className="font-medium">${holding.current_price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Value</p>
                            <p className="font-medium">{formatCurrency(holding.current_value)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Held {holding.days_held} days
                            {!holding.eligible_for_cgt_discount && holding.unrealized_gain > 0 && (
                              <Badge variant="outline" className="text-xs text-yellow-600">
                                {365 - holding.days_held} days to CGT discount
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openOrderDialog(holding, "buy")}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Buy More
                            </Button>
                            <Button 
                              size="sm" 
                              variant={holding.is_loss ? "default" : "outline"}
                              className={holding.is_loss ? "bg-green-600 hover:bg-green-700" : ""}
                              onClick={() => openOrderDialog(holding, "sell")}
                            >
                              <Minus className="h-3 w-3 mr-1" />
                              {holding.is_loss ? "Harvest Loss" : "Sell"}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Unrealized Gain/Loss Bar */}
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Unrealized {holding.unrealized_gain >= 0 ? 'Gain' : 'Loss'}</span>
                            <span className={holding.unrealized_gain >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {formatCurrency(Math.abs(holding.unrealized_gain))}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* CGT Summary Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="h-5 w-5" />
                  CGT Summary FY24-25
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Entity Type</p>
                  <Badge variant="outline">{cgtSummary?.entity_type?.replace(/_/g, ' ').toUpperCase()}</Badge>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-semibold mb-2">Unrealized Position</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Gains</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(cgtSummary?.unrealized?.total_gains || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Losses</span>
                      <span className="text-red-600 font-medium">
                        {formatCurrency(cgtSummary?.unrealized?.total_losses || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Net Position</span>
                      <span className={`font-bold ${cgtSummary?.unrealized?.net_position >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(cgtSummary?.unrealized?.net_position || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-semibold mb-2">Tax Planning Opportunities</h4>
                  {cgtSummary?.tax_planning_opportunities?.map((opp, i) => (
                    <div key={i} className="p-3 bg-blue-50 rounded-lg mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium capitalize">{opp.type.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{opp.description}</p>
                      <p className="text-sm font-bold text-blue-600 mt-1">
                        {formatCurrency(opp.type === 'tax_loss_harvesting' ? opp.available_losses : opp.discount_value)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-5 w-5" />
                  Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p><strong>CGT Discount:</strong> 50% discount for holdings &gt;12 months (individuals/trusts)</p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p><strong>SMSF Rate:</strong> 15% in accumulation, 0% in pension phase</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <p><strong>EOFY:</strong> Consider harvesting losses before June 30</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {orderForm.side === "sell" ? (
                  <Minus className="h-5 w-5 text-red-500" />
                ) : (
                  <Plus className="h-5 w-5 text-green-500" />
                )}
                {orderForm.side === "sell" ? "Sell" : "Buy"} {selectedHolding?.symbol}
              </DialogTitle>
              <DialogDescription>{selectedHolding?.name}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Order Type Toggle */}
              <div className="flex gap-2">
                <Button 
                  variant={orderForm.side === "buy" ? "default" : "outline"}
                  className={orderForm.side === "buy" ? "bg-green-600" : ""}
                  onClick={() => setOrderForm(prev => ({ ...prev, side: "buy" }))}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Buy
                </Button>
                <Button 
                  variant={orderForm.side === "sell" ? "default" : "outline"}
                  className={orderForm.side === "sell" ? "bg-red-600" : ""}
                  onClick={() => setOrderForm(prev => ({ ...prev, side: "sell" }))}
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Sell
                </Button>
              </div>

              {/* Units Input */}
              <div>
                <Label>Units to {orderForm.side}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    type="number"
                    value={orderForm.units}
                    onChange={(e) => updateOrderUnits(parseInt(e.target.value) || 0)}
                    min={1}
                    max={orderForm.side === "sell" ? selectedHolding?.units : undefined}
                  />
                  {orderForm.side === "sell" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateOrderUnits(selectedHolding?.units || 0)}
                    >
                      Max
                    </Button>
                  )}
                </div>
                {orderForm.side === "sell" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {selectedHolding?.units?.toLocaleString()} units
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <Label>Price per unit</Label>
                <Input 
                  type="number"
                  value={orderForm.price}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  step={0.01}
                />
              </div>

              {/* Order Summary */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {orderForm.units} × ${orderForm.price.toFixed(2)}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(orderForm.units * orderForm.price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brokerage (est.)</span>
                    <span>$9.50</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>{orderForm.side === "sell" ? "Net Proceeds" : "Total Cost"}</span>
                    <span>{formatCurrency(orderForm.units * orderForm.price + (orderForm.side === "buy" ? 9.50 : -9.50))}</span>
                  </div>
                </div>
              </div>

              {/* CGT Preview for Sells */}
              {orderForm.side === "sell" && orderPreview?.cgt_calculation && (
                <div className={`p-3 rounded-lg border ${orderPreview.cgt_calculation.is_capital_loss ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    CGT Impact
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross {orderPreview.cgt_calculation.is_capital_loss ? 'Loss' : 'Gain'}</span>
                      <span className={orderPreview.cgt_calculation.is_capital_loss ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                        {formatCurrency(Math.abs(orderPreview.cgt_calculation.gross_capital_gain))}
                      </span>
                    </div>
                    {orderPreview.cgt_calculation.eligible_for_discount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">50% CGT Discount</span>
                        <span className="text-green-600">-{formatCurrency(orderPreview.cgt_calculation.discount_applied)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Capital {orderPreview.cgt_calculation.is_capital_loss ? 'Loss' : 'Gain'}</span>
                      <span className="font-medium">{formatCurrency(orderPreview.cgt_calculation.net_capital_gain)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Estimated Tax</span>
                      <span className={orderPreview.cgt_calculation.is_capital_loss ? 'text-green-600' : 'text-red-600'}>
                        {orderPreview.cgt_calculation.is_capital_loss ? 'Tax Deduction' : formatCurrency(orderPreview.cgt_calculation.estimated_cgt_liability)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Recommendation */}
                  {orderPreview.recommendation?.recommendations?.map((rec, i) => (
                    <Alert key={i} className="mt-3">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>{rec.type.replace(/_/g, ' ')}:</strong> {rec.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={executeOrder}
                className={orderForm.side === "sell" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Execute {orderForm.side === "sell" ? "Sell" : "Buy"} Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default StockTrading;
