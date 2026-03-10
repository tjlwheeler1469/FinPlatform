import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Calculator,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Download,
  Filter
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Demo share parcels (purchases)
const DEMO_PARCELS = [
  { id: 1, symbol: "CBA", name: "Commonwealth Bank", quantity: 200, purchase_price: 98.50, purchase_date: "2022-03-15", brokerage: 19.95 },
  { id: 2, symbol: "CBA", name: "Commonwealth Bank", quantity: 100, purchase_price: 105.20, purchase_date: "2023-06-20", brokerage: 9.95 },
  { id: 3, symbol: "BHP", name: "BHP Group", quantity: 500, purchase_price: 48.20, purchase_date: "2023-06-20", brokerage: 19.95 },
  { id: 4, symbol: "CSL", name: "CSL Limited", quantity: 50, purchase_price: 295.00, purchase_date: "2024-01-10", brokerage: 19.95 },
  { id: 5, symbol: "VAS", name: "Vanguard Aus Shares ETF", quantity: 300, purchase_price: 92.00, purchase_date: "2022-08-01", brokerage: 9.95 },
  { id: 6, symbol: "WBC", name: "Westpac Banking", quantity: 800, purchase_price: 24.80, purchase_date: "2024-02-15", brokerage: 19.95 },
  { id: 7, symbol: "VGS", name: "Vanguard Intl Shares ETF", quantity: 150, purchase_price: 108.50, purchase_date: "2023-11-20", brokerage: 9.95 }
];

// Demo CGT events (sales)
const DEMO_CGT_EVENTS = [
  { 
    id: 1, 
    symbol: "CBA", 
    name: "Commonwealth Bank",
    quantity: 100, 
    sale_price: 118.50, 
    sale_date: "2024-06-15", 
    brokerage: 9.95,
    parcel_id: 1, // Sold from first parcel
    purchase_price: 98.50,
    purchase_date: "2022-03-15",
    purchase_brokerage: 9.975 // Proportional
  },
  { 
    id: 2, 
    symbol: "BHP", 
    name: "BHP Group",
    quantity: 200, 
    sale_price: 45.80, 
    sale_date: "2024-08-20", 
    brokerage: 9.95,
    parcel_id: 3,
    purchase_price: 48.20,
    purchase_date: "2023-06-20",
    purchase_brokerage: 7.98
  },
  { 
    id: 3, 
    symbol: "VAS", 
    name: "Vanguard Aus Shares ETF",
    quantity: 100, 
    sale_price: 98.40, 
    sale_date: "2024-09-10", 
    brokerage: 9.95,
    parcel_id: 5,
    purchase_price: 92.00,
    purchase_date: "2022-08-01",
    purchase_brokerage: 3.32
  }
];

const COLORS = ['#10B981', '#EF4444', '#D4AF37', '#3B82F6', '#8B5CF6'];

const CGTEventTracker = () => {
  const [parcels, setParcels] = useState(DEMO_PARCELS);
  const [cgtEvents, setCgtEvents] = useState(DEMO_CGT_EVENTS);
  const [activeTab, setActiveTab] = useState("events");
  const [filterYear, setFilterYear] = useState("2024-25");
  const [showAddParcel, setShowAddParcel] = useState(false);
  const [showAddSale, setShowAddSale] = useState(false);
  
  // New parcel form
  const [newParcel, setNewParcel] = useState({
    symbol: "", name: "", quantity: 0, purchase_price: 0, purchase_date: "", brokerage: 9.95
  });
  
  // New sale form
  const [newSale, setNewSale] = useState({
    parcel_id: "", quantity: 0, sale_price: 0, sale_date: "", brokerage: 9.95
  });

  // Calculate CGT for each event
  const calculateCGT = (event) => {
    const daysHeld = Math.floor((new Date(event.sale_date) - new Date(event.purchase_date)) / (1000 * 60 * 60 * 24));
    const isDiscountEligible = daysHeld >= 365;
    
    const costBase = (event.purchase_price * event.quantity) + event.purchase_brokerage + event.brokerage;
    const proceeds = event.sale_price * event.quantity;
    const grossGain = proceeds - costBase;
    const isGain = grossGain > 0;
    
    let discountedGain = grossGain;
    if (isGain && isDiscountEligible) {
      discountedGain = grossGain * 0.5; // 50% CGT discount
    }
    
    return {
      ...event,
      days_held: daysHeld,
      is_discount_eligible: isDiscountEligible,
      cost_base: costBase,
      proceeds: proceeds,
      gross_gain: grossGain,
      discounted_gain: discountedGain,
      is_gain: isGain
    };
  };

  // Process all CGT events
  const processedEvents = cgtEvents.map(calculateCGT);
  
  // Filter by financial year
  const getFinancialYear = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth();
    const year = date.getFullYear();
    if (month >= 6) { // July onwards
      return `${year}-${(year + 1).toString().slice(-2)}`;
    }
    return `${year - 1}-${year.toString().slice(-2)}`;
  };
  
  const filteredEvents = processedEvents.filter(e => getFinancialYear(e.sale_date) === filterYear);
  
  // Summary calculations
  const totalGrossGains = filteredEvents.filter(e => e.is_gain).reduce((sum, e) => sum + e.gross_gain, 0);
  const totalGrossLosses = Math.abs(filteredEvents.filter(e => !e.is_gain).reduce((sum, e) => sum + e.gross_gain, 0));
  const totalDiscountedGains = filteredEvents.filter(e => e.is_gain).reduce((sum, e) => sum + e.discounted_gain, 0);
  const netCapitalGain = totalDiscountedGains - totalGrossLosses;
  const discountAmount = totalGrossGains - totalDiscountedGains;

  // Available years
  const availableYears = [...new Set(cgtEvents.map(e => getFinancialYear(e.sale_date)))].sort().reverse();
  if (!availableYears.includes(filterYear)) {
    availableYears.unshift(filterYear);
  }

  // Add new parcel
  const addParcel = () => {
    if (newParcel.symbol && newParcel.quantity > 0) {
      setParcels([...parcels, { ...newParcel, id: Date.now() }]);
      setNewParcel({ symbol: "", name: "", quantity: 0, purchase_price: 0, purchase_date: "", brokerage: 9.95 });
      setShowAddParcel(false);
    }
  };

  // Add new sale
  const addSale = () => {
    const parcel = parcels.find(p => p.id === Number(newSale.parcel_id));
    if (parcel && newSale.quantity > 0) {
      const proportionalBrokerage = (parcel.brokerage / parcel.quantity) * newSale.quantity;
      setCgtEvents([...cgtEvents, {
        id: Date.now(),
        symbol: parcel.symbol,
        name: parcel.name,
        quantity: newSale.quantity,
        sale_price: newSale.sale_price,
        sale_date: newSale.sale_date,
        brokerage: newSale.brokerage,
        parcel_id: parcel.id,
        purchase_price: parcel.purchase_price,
        purchase_date: parcel.purchase_date,
        purchase_brokerage: proportionalBrokerage
      }]);
      setNewSale({ parcel_id: "", quantity: 0, sale_price: 0, sale_date: "", brokerage: 9.95 });
      setShowAddSale(false);
    }
  };

  // Delete event
  const deleteEvent = (id) => {
    setCgtEvents(cgtEvents.filter(e => e.id !== id));
  };

  // Chart data
  const gainLossData = [
    { name: "Capital Gains", value: totalGrossGains, color: "#10B981" },
    { name: "Capital Losses", value: totalGrossLosses, color: "#EF4444" }
  ].filter(d => d.value > 0);

  const bySymbolData = Object.entries(
    filteredEvents.reduce((acc, e) => {
      if (!acc[e.symbol]) acc[e.symbol] = { gains: 0, losses: 0 };
      if (e.is_gain) acc[e.symbol].gains += e.discounted_gain;
      else acc[e.symbol].losses += Math.abs(e.gross_gain);
      return acc;
    }, {})
  ).map(([symbol, data]) => ({
    symbol,
    gains: Math.round(data.gains),
    losses: Math.round(data.losses)
  }));

  return (
    <Layout>
      <div className="space-y-6" data-testid="cgt-tracker-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              CGT Event Tracker
            </h1>
            <p className="text-muted-foreground mt-1">
              Track share sales and calculate capital gains for tax reporting
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>FY {year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowAddSale(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-[#10B981]/10 border-[#10B981]/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Gross Gains</p>
              <p className="text-xl font-bold text-[#10B981]">{formatCurrency(totalGrossGains)}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Capital Losses</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totalGrossLosses)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#D4AF37]/10 border-[#D4AF37]/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">CGT Discount</p>
              <p className="text-xl font-bold text-[#D4AF37]">-{formatCurrency(discountAmount)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0F392B] text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/80">Net Capital Gain</p>
              <p className="text-xl font-bold">{formatCurrency(Math.max(0, netCapitalGain))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">CGT Events</p>
              <p className="text-xl font-bold">{filteredEvents.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="events">CGT Events</TabsTrigger>
            <TabsTrigger value="parcels">Share Parcels</TabsTrigger>
            <TabsTrigger value="summary">Tax Summary</TabsTrigger>
          </TabsList>

          {/* CGT Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card data-testid="cgt-events-table">
              <CardHeader>
                <CardTitle className="font-['Manrope']">CGT Events - FY {filterYear}</CardTitle>
                <CardDescription>
                  {filteredEvents.length} sale{filteredEvents.length !== 1 ? 's' : ''} recorded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No CGT events recorded for FY {filterYear}</p>
                    <Button variant="outline" className="mt-3" onClick={() => setShowAddSale(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Your First Sale
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Stock</th>
                          <th className="text-right p-3 font-semibold">Qty</th>
                          <th className="text-right p-3 font-semibold">Buy Price</th>
                          <th className="text-right p-3 font-semibold">Sell Price</th>
                          <th className="text-right p-3 font-semibold">Cost Base</th>
                          <th className="text-right p-3 font-semibold">Proceeds</th>
                          <th className="text-right p-3 font-semibold">Gain/Loss</th>
                          <th className="text-center p-3 font-semibold">Discount</th>
                          <th className="text-right p-3 font-semibold">Taxable</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEvents.map((event) => (
                          <tr key={event.id} className="border-b hover:bg-muted/30">
                            <td className="p-3">
                              <div className="font-medium">{event.symbol}</div>
                              <div className="text-xs text-muted-foreground">{formatDate(event.sale_date)}</div>
                            </td>
                            <td className="text-right p-3">{event.quantity}</td>
                            <td className="text-right p-3">${event.purchase_price.toFixed(2)}</td>
                            <td className="text-right p-3">${event.sale_price.toFixed(2)}</td>
                            <td className="text-right p-3">{formatCurrency(event.cost_base)}</td>
                            <td className="text-right p-3">{formatCurrency(event.proceeds)}</td>
                            <td className={`text-right p-3 font-medium ${event.is_gain ? 'text-[#10B981]' : 'text-destructive'}`}>
                              {event.is_gain ? '+' : ''}{formatCurrency(event.gross_gain)}
                            </td>
                            <td className="text-center p-3">
                              {event.is_discount_eligible ? (
                                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37]">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  50%
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {event.days_held}d
                                </Badge>
                              )}
                            </td>
                            <td className={`text-right p-3 font-bold ${event.is_gain ? 'text-[#0F392B]' : 'text-destructive'}`}>
                              {formatCurrency(event.discounted_gain)}
                            </td>
                            <td className="p-3">
                              <Button variant="ghost" size="icon" onClick={() => deleteEvent(event.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/30 font-semibold">
                          <td className="p-3" colSpan={6}>Total</td>
                          <td className="text-right p-3">
                            {formatCurrency(totalGrossGains - totalGrossLosses)}
                          </td>
                          <td className="text-center p-3 text-[#D4AF37]">
                            -{formatCurrency(discountAmount)}
                          </td>
                          <td className="text-right p-3 text-[#0F392B]">
                            {formatCurrency(Math.max(0, netCapitalGain))}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Charts */}
            {filteredEvents.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="gain-loss-pie">
                  <CardHeader>
                    <CardTitle className="font-['Manrope']">Gains vs Losses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                        <PieChart>
                          <Pie
                            data={gainLossData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                          >
                            {gainLossData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="by-symbol-chart">
                  <CardHeader>
                    <CardTitle className="font-['Manrope']">By Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                        <BarChart data={bySymbolData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="symbol" stroke="hsl(var(--muted-foreground))" />
                          <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Legend />
                          <Bar dataKey="gains" name="Gains" fill="#10B981" />
                          <Bar dataKey="losses" name="Losses" fill="#EF4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Share Parcels Tab */}
          <TabsContent value="parcels" className="space-y-6">
            <Card data-testid="share-parcels">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-['Manrope']">Share Parcels</CardTitle>
                    <CardDescription>Track your share purchases for CGT cost base calculations</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setShowAddParcel(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Parcel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Stock</th>
                        <th className="text-right p-3 font-semibold">Quantity</th>
                        <th className="text-right p-3 font-semibold">Purchase Price</th>
                        <th className="text-right p-3 font-semibold">Purchase Date</th>
                        <th className="text-right p-3 font-semibold">Brokerage</th>
                        <th className="text-right p-3 font-semibold">Cost Base</th>
                        <th className="text-center p-3 font-semibold">CGT Discount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcels.map((parcel) => {
                        const daysHeld = Math.floor((new Date() - new Date(parcel.purchase_date)) / (1000 * 60 * 60 * 24));
                        const costBase = (parcel.purchase_price * parcel.quantity) + parcel.brokerage;
                        const isEligible = daysHeld >= 365;
                        
                        return (
                          <tr key={parcel.id} className="border-b">
                            <td className="p-3">
                              <div className="font-medium">{parcel.symbol}</div>
                              <div className="text-xs text-muted-foreground">{parcel.name}</div>
                            </td>
                            <td className="text-right p-3">{parcel.quantity}</td>
                            <td className="text-right p-3">${parcel.purchase_price.toFixed(2)}</td>
                            <td className="text-right p-3">{formatDate(parcel.purchase_date)}</td>
                            <td className="text-right p-3">${parcel.brokerage.toFixed(2)}</td>
                            <td className="text-right p-3 font-medium">{formatCurrency(costBase)}</td>
                            <td className="text-center p-3">
                              {isEligible ? (
                                <Badge className="bg-[#10B981]/10 text-[#10B981]">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Eligible
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {365 - daysHeld}d to go
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <Card data-testid="tax-summary">
              <CardHeader>
                <CardTitle className="font-['Manrope']">CGT Tax Summary - FY {filterYear}</CardTitle>
                <CardDescription>Summary for your tax return</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Calculations */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Capital Gains Calculation</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 rounded-lg bg-[#10B981]/10">
                        <span>Total Capital Gains (Gross)</span>
                        <span className="font-bold text-[#10B981]">{formatCurrency(totalGrossGains)}</span>
                      </div>
                      
                      <div className="flex justify-between p-3 rounded-lg bg-destructive/10">
                        <span>Less: Capital Losses</span>
                        <span className="font-bold text-destructive">-{formatCurrency(totalGrossLosses)}</span>
                      </div>
                      
                      <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                        <span>Net Capital Gains (before discount)</span>
                        <span className="font-bold">{formatCurrency(totalGrossGains - totalGrossLosses)}</span>
                      </div>
                      
                      <div className="flex justify-between p-3 rounded-lg bg-[#D4AF37]/10">
                        <span>Less: CGT Discount (50%)</span>
                        <span className="font-bold text-[#D4AF37]">-{formatCurrency(discountAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between p-3 rounded-lg bg-[#0F392B] text-white">
                        <span>Net Capital Gain (Taxable)</span>
                        <span className="font-bold text-xl">{formatCurrency(Math.max(0, netCapitalGain))}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Tax Labels */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Tax Return Labels</h4>
                    
                    <div className="p-4 rounded-lg border space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">18 - Total current year capital gains</span>
                        <span className="font-mono font-bold">{formatCurrency(totalGrossGains)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">19 - Net capital gain</span>
                        <span className="font-mono font-bold">{formatCurrency(Math.max(0, netCapitalGain))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">A - Total CGT discount applied</span>
                        <span className="font-mono font-bold">{formatCurrency(discountAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">H - Total capital losses</span>
                        <span className="font-mono font-bold">{formatCurrency(totalGrossLosses)}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Capital losses can be carried forward to offset future capital gains. 
                        They cannot be offset against other income.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Events Summary */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Event Details for Schedule</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-2 border">Asset</th>
                          <th className="text-left p-2 border">Date Acquired</th>
                          <th className="text-left p-2 border">Date Sold</th>
                          <th className="text-right p-2 border">Cost Base</th>
                          <th className="text-right p-2 border">Capital Proceeds</th>
                          <th className="text-right p-2 border">Capital Gain/Loss</th>
                          <th className="text-center p-2 border">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEvents.map((event) => (
                          <tr key={event.id}>
                            <td className="p-2 border">{event.symbol} - {event.quantity} shares</td>
                            <td className="p-2 border">{formatDate(event.purchase_date)}</td>
                            <td className="p-2 border">{formatDate(event.sale_date)}</td>
                            <td className="text-right p-2 border">{formatCurrency(event.cost_base)}</td>
                            <td className="text-right p-2 border">{formatCurrency(event.proceeds)}</td>
                            <td className={`text-right p-2 border ${event.is_gain ? 'text-[#10B981]' : 'text-destructive'}`}>
                              {formatCurrency(event.gross_gain)}
                            </td>
                            <td className="text-center p-2 border">
                              {event.is_discount_eligible ? "Discount" : "Other"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Parcel Modal */}
        {showAddParcel && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add Share Parcel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input 
                      value={newParcel.symbol}
                      onChange={(e) => setNewParcel({...newParcel, symbol: e.target.value.toUpperCase()})}
                      placeholder="CBA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input 
                      value={newParcel.name}
                      onChange={(e) => setNewParcel({...newParcel, name: e.target.value})}
                      placeholder="Commonwealth Bank"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input 
                      type="number"
                      value={newParcel.quantity || ""}
                      onChange={(e) => setNewParcel({...newParcel, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Price</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={newParcel.purchase_price || ""}
                      onChange={(e) => setNewParcel({...newParcel, purchase_price: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Purchase Date</Label>
                    <Input 
                      type="date"
                      value={newParcel.purchase_date}
                      onChange={(e) => setNewParcel({...newParcel, purchase_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Brokerage</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={newParcel.brokerage}
                      onChange={(e) => setNewParcel({...newParcel, brokerage: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddParcel(false)}>Cancel</Button>
                  <Button onClick={addParcel} className="bg-[#0F392B]">Add Parcel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Sale Modal */}
        {showAddSale && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Record Share Sale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Parcel to Sell</Label>
                  <Select 
                    value={newSale.parcel_id.toString()} 
                    onValueChange={(v) => setNewSale({...newSale, parcel_id: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parcel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {parcels.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.symbol} - {p.quantity} @ ${p.purchase_price} ({formatDate(p.purchase_date)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity Sold</Label>
                    <Input 
                      type="number"
                      value={newSale.quantity || ""}
                      onChange={(e) => setNewSale({...newSale, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Price</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={newSale.sale_price || ""}
                      onChange={(e) => setNewSale({...newSale, sale_price: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sale Date</Label>
                    <Input 
                      type="date"
                      value={newSale.sale_date}
                      onChange={(e) => setNewSale({...newSale, sale_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Brokerage</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={newSale.brokerage}
                      onChange={(e) => setNewSale({...newSale, brokerage: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddSale(false)}>Cancel</Button>
                  <Button onClick={addSale} className="bg-[#0F392B]">Record Sale</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CGTEventTracker;
