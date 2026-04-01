import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
  Filter,
  Percent,
  Home,
  Building2,
  X,
  ChevronLeft,
  ChevronRight
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
  Legend,
  LineChart,
  Line
} from "recharts";
import axios from "axios";
import { toast } from "sonner";

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

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Financial years for multi-year support
const FINANCIAL_YEARS = [
  { value: "2022-23", label: "FY 2022-23", start: "2022-07-01", end: "2023-06-30" },
  { value: "2023-24", label: "FY 2023-24", start: "2023-07-01", end: "2024-06-30" },
  { value: "2024-25", label: "FY 2024-25", start: "2024-07-01", end: "2025-06-30" },
  { value: "2025-26", label: "FY 2025-26", start: "2025-07-01", end: "2026-06-30" },
  { value: "all", label: "All Years", start: null, end: null }
];

// Demo share parcels (purchases) with multi-year data
const DEMO_PARCELS = [
  { id: 1, symbol: "CBA", name: "Commonwealth Bank", quantity: 200, purchase_price: 98.50, purchase_date: "2022-03-15", brokerage: 19.95, asset_type: "stocks" },
  { id: 2, symbol: "CBA", name: "Commonwealth Bank", quantity: 100, purchase_price: 105.20, purchase_date: "2023-06-20", brokerage: 9.95, asset_type: "stocks" },
  { id: 3, symbol: "BHP", name: "BHP Group", quantity: 500, purchase_price: 48.20, purchase_date: "2023-06-20", brokerage: 19.95, asset_type: "stocks" },
  { id: 4, symbol: "CSL", name: "CSL Limited", quantity: 50, purchase_price: 295.00, purchase_date: "2024-01-10", brokerage: 19.95, asset_type: "stocks" },
  { id: 5, symbol: "VAS", name: "Vanguard Aus Shares ETF", quantity: 300, purchase_price: 92.00, purchase_date: "2022-08-01", brokerage: 9.95, asset_type: "etf" },
  { id: 6, symbol: "WBC", name: "Westpac Banking", quantity: 800, purchase_price: 24.80, purchase_date: "2024-02-15", brokerage: 19.95, asset_type: "stocks" },
  { id: 7, symbol: "VGS", name: "Vanguard Intl Shares ETF", quantity: 150, purchase_price: 108.50, purchase_date: "2023-11-20", brokerage: 9.95, asset_type: "etf" },
  // Bonds
  { id: 8, symbol: "BOND-01", name: "Aus Gov 10Y Bond", quantity: 100, purchase_price: 98.50, purchase_date: "2022-06-15", brokerage: 50, asset_type: "bonds" },
  { id: 9, symbol: "CORP-01", name: "Corporate Bond Fund", quantity: 500, purchase_price: 60.00, purchase_date: "2023-03-10", brokerage: 25, asset_type: "bonds" },
  // Property
  { id: 10, symbol: "PROP-SYD", name: "Investment Unit - Sydney", quantity: 1, purchase_price: 650000, purchase_date: "2019-08-20", brokerage: 15000, asset_type: "property" },
  { id: 11, symbol: "PROP-MEL", name: "Townhouse - Melbourne", quantity: 1, purchase_price: 520000, purchase_date: "2021-02-15", brokerage: 12000, asset_type: "property" },
  // Crypto
  { id: 12, symbol: "BTC", name: "Bitcoin", quantity: 0.5, purchase_price: 42000, purchase_date: "2023-01-15", brokerage: 50, asset_type: "crypto" },
  { id: 13, symbol: "ETH", name: "Ethereum", quantity: 3.2, purchase_price: 2800, purchase_date: "2023-06-20", brokerage: 25, asset_type: "crypto" },
  // Managed Funds
  { id: 14, symbol: "MAG", name: "Magellan Global Fund", quantity: 2000, purchase_price: 32.50, purchase_date: "2022-09-10", brokerage: 0, asset_type: "funds" }
];

// Demo CGT events across multiple years (all asset types)
const DEMO_CGT_EVENTS = [
  // FY 2022-23 - Stocks
  { id: 1, symbol: "ANZ", name: "ANZ Bank", quantity: 150, sale_price: 26.50, sale_date: "2023-02-10", brokerage: 9.95, parcel_id: 0, purchase_price: 22.80, purchase_date: "2021-05-15", purchase_brokerage: 9.95, asset_type: "stocks" },
  // FY 2023-24 - Stocks & Crypto
  { id: 2, symbol: "WOW", name: "Woolworths", quantity: 200, sale_price: 38.50, sale_date: "2023-11-20", brokerage: 9.95, parcel_id: 0, purchase_price: 35.20, purchase_date: "2022-03-10", purchase_brokerage: 9.95, asset_type: "stocks" },
  { id: 3, symbol: "TLS", name: "Telstra", quantity: 500, sale_price: 4.20, sale_date: "2024-03-15", brokerage: 9.95, parcel_id: 0, purchase_price: 3.85, purchase_date: "2023-01-20", purchase_brokerage: 9.95, asset_type: "stocks" },
  { id: 7, symbol: "BTC", name: "Bitcoin", quantity: 0.15, sale_price: 68000, sale_date: "2024-02-28", brokerage: 30, parcel_id: 12, purchase_price: 42000, purchase_date: "2023-01-15", purchase_brokerage: 15, asset_type: "crypto" },
  // FY 2024-25 - Stocks, Bonds, Property
  { id: 4, symbol: "CBA", name: "Commonwealth Bank", quantity: 100, sale_price: 118.50, sale_date: "2024-08-15", brokerage: 9.95, parcel_id: 1, purchase_price: 98.50, purchase_date: "2022-03-15", purchase_brokerage: 9.975, asset_type: "stocks" },
  { id: 5, symbol: "BHP", name: "BHP Group", quantity: 200, sale_price: 45.80, sale_date: "2024-10-20", brokerage: 9.95, parcel_id: 3, purchase_price: 48.20, purchase_date: "2023-06-20", purchase_brokerage: 7.98, asset_type: "stocks" },
  { id: 6, symbol: "VAS", name: "Vanguard Aus Shares ETF", quantity: 100, sale_price: 98.40, sale_date: "2024-12-10", brokerage: 9.95, parcel_id: 5, purchase_price: 92.00, purchase_date: "2022-08-01", purchase_brokerage: 3.32, asset_type: "etf" },
  { id: 8, symbol: "BOND-01", name: "Aus Gov 10Y Bond", quantity: 50, sale_price: 101.20, sale_date: "2024-11-15", brokerage: 25, parcel_id: 8, purchase_price: 98.50, purchase_date: "2022-06-15", purchase_brokerage: 25, asset_type: "bonds" },
  { id: 9, symbol: "PROP-SYD", name: "Investment Unit - Sydney", quantity: 1, sale_price: 780000, sale_date: "2024-09-30", brokerage: 18000, parcel_id: 10, purchase_price: 650000, purchase_date: "2019-08-20", purchase_brokerage: 15000, asset_type: "property" },
  { id: 10, symbol: "ETH", name: "Ethereum", quantity: 1.5, sale_price: 3200, sale_date: "2024-12-20", brokerage: 15, parcel_id: 13, purchase_price: 2800, purchase_date: "2023-06-20", purchase_brokerage: 12, asset_type: "crypto" }
];

// Asset type configuration
const ASSET_TYPES = {
  stocks: { label: "Stocks", color: "#3B82F6", icon: "📈" },
  etf: { label: "ETFs", color: "#10B981", icon: "📊" },
  bonds: { label: "Bonds", color: "#F59E0B", icon: "🏛️" },
  property: { label: "Property", color: "#EF4444", icon: "🏠" },
  crypto: { label: "Crypto", color: "#8B5CF6", icon: "₿" },
  funds: { label: "Managed Funds", color: "#06B6D4", icon: "💼" }
};

const COLORS = ['#10B981', '#EF4444', '#D4A84C', '#3B82F6', '#8B5CF6'];

const CGT = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState("events");
  const [selectedYear, setSelectedYear] = useState("2024-25");
  const [parcels, setParcels] = useState(DEMO_PARCELS);
  const [cgtEvents, setCgtEvents] = useState(DEMO_CGT_EVENTS);
  const [showAddParcel, setShowAddParcel] = useState(false);
  const [showAddSale, setShowAddSale] = useState(false);
  
  // Calculator state
  const [purchasePrice, setPurchasePrice] = useState(500000);
  const [salePrice, setSalePrice] = useState(700000);
  const [holdingPeriod, setHoldingPeriod] = useState(24);
  const [marginalRate, setMarginalRate] = useState(30);
  const [entityType, setEntityType] = useState("individual");
  const [improvementCosts, setImprovementCosts] = useState(0);
  const [sellingCosts, setSellingCosts] = useState(15000);
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  
  // New parcel/sale forms
  const [newParcel, setNewParcel] = useState({ symbol: "", name: "", quantity: 0, purchase_price: 0, purchase_date: "", brokerage: 9.95 });
  const [newSale, setNewSale] = useState({ parcel_id: "", quantity: 0, sale_price: 0, sale_date: "", brokerage: 9.95 });

  // Load from localStorage
  useEffect(() => {
    const savedParcels = localStorage.getItem("cgtParcels");
    const savedEvents = localStorage.getItem("cgtEvents");
    if (savedParcels) setParcels([...DEMO_PARCELS, ...JSON.parse(savedParcels)]);
    if (savedEvents) setCgtEvents([...DEMO_CGT_EVENTS, ...JSON.parse(savedEvents)]);
  }, []);

  // Save to localStorage
  const saveToStorage = (newParcels, newEvents) => {
    const customParcels = newParcels.filter(p => p.id > 100);
    const customEvents = newEvents.filter(e => e.id > 100);
    localStorage.setItem("cgtParcels", JSON.stringify(customParcels));
    localStorage.setItem("cgtEvents", JSON.stringify(customEvents));
  };

  // Get financial year for a date
  const getFinancialYear = (dateStr) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 6) return `${year}-${(year + 1).toString().slice(2)}`;
    return `${year - 1}-${year.toString().slice(2)}`;
  };

  // Filter events by financial year
  const filteredEvents = selectedYear === "all" 
    ? cgtEvents 
    : cgtEvents.filter(e => getFinancialYear(e.sale_date) === selectedYear);

  // Calculate CGT for each event
  const calculateEventCGT = (event) => {
    const daysHeld = Math.floor((new Date(event.sale_date) - new Date(event.purchase_date)) / (1000 * 60 * 60 * 24));
    const isDiscountEligible = daysHeld >= 365;
    const costBase = (event.purchase_price * event.quantity) + event.purchase_brokerage + event.brokerage;
    const proceeds = event.sale_price * event.quantity;
    const grossGain = proceeds - costBase;
    const isGain = grossGain > 0;
    let discountedGain = grossGain;
    if (isGain && isDiscountEligible) discountedGain = grossGain * 0.5;
    return { ...event, days_held: daysHeld, is_discount_eligible: isDiscountEligible, cost_base: costBase, proceeds, gross_gain: grossGain, discounted_gain: discountedGain, is_gain: isGain, financial_year: getFinancialYear(event.sale_date) };
  };

  const processedEvents = filteredEvents.map(calculateEventCGT);
  const totalGains = processedEvents.filter(e => e.is_gain).reduce((sum, e) => sum + e.discounted_gain, 0);
  const totalLosses = processedEvents.filter(e => !e.is_gain).reduce((sum, e) => sum + Math.abs(e.gross_gain), 0);
  const netPosition = totalGains - totalLosses;

  // Multi-year summary data
  const yearSummary = FINANCIAL_YEARS.filter(y => y.value !== "all").map(fy => {
    const yearEvents = cgtEvents.filter(e => getFinancialYear(e.sale_date) === fy.value).map(calculateEventCGT);
    const gains = yearEvents.filter(e => e.is_gain).reduce((sum, e) => sum + e.discounted_gain, 0);
    const losses = yearEvents.filter(e => !e.is_gain).reduce((sum, e) => sum + Math.abs(e.gross_gain), 0);
    return { year: fy.label.replace("FY ", ""), gains, losses, net: gains - losses, events: yearEvents.length };
  });

  // Add parcel
  const handleAddParcel = () => {
    if (!newParcel.symbol || !newParcel.purchase_date || newParcel.quantity <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    const parcel = { ...newParcel, id: Date.now(), quantity: Number(newParcel.quantity), purchase_price: Number(newParcel.purchase_price), brokerage: Number(newParcel.brokerage) };
    const updated = [...parcels, parcel];
    setParcels(updated);
    saveToStorage(updated, cgtEvents);
    setNewParcel({ symbol: "", name: "", quantity: 0, purchase_price: 0, purchase_date: "", brokerage: 9.95 });
    setShowAddParcel(false);
    toast.success("Parcel added");
  };

  // Add sale
  const handleAddSale = () => {
    const parcel = parcels.find(p => p.id === Number(newSale.parcel_id));
    if (!parcel || !newSale.sale_date || newSale.quantity <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    const event = {
      id: Date.now(),
      symbol: parcel.symbol,
      name: parcel.name,
      quantity: Number(newSale.quantity),
      sale_price: Number(newSale.sale_price),
      sale_date: newSale.sale_date,
      brokerage: Number(newSale.brokerage),
      parcel_id: parcel.id,
      purchase_price: parcel.purchase_price,
      purchase_date: parcel.purchase_date,
      purchase_brokerage: (parcel.brokerage / parcel.quantity) * Number(newSale.quantity)
    };
    const updated = [...cgtEvents, event];
    setCgtEvents(updated);
    saveToStorage(parcels, updated);
    setNewSale({ parcel_id: "", quantity: 0, sale_price: 0, sale_date: "", brokerage: 9.95 });
    setShowAddSale(false);
    toast.success("CGT event recorded");
  };

  // Delete event
  const handleDeleteEvent = (eventId) => {
    const updated = cgtEvents.filter(e => e.id !== eventId);
    setCgtEvents(updated);
    saveToStorage(parcels, updated);
    toast.success("Event deleted");
  };

  // Delete parcel
  const handleDeleteParcel = (parcelId) => {
    const updated = parcels.filter(p => p.id !== parcelId);
    setParcels(updated);
    saveToStorage(updated, cgtEvents);
    toast.success("Parcel deleted");
  };

  // Calculator
  const calculateCGT = async () => {
    setCalcLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/cgt`, null, {
        params: { purchase_price: purchasePrice, sale_price: salePrice, holding_period_months: holdingPeriod, marginal_tax_rate: marginalRate / 100, entity_type: entityType, improvement_costs: improvementCosts, selling_costs: sellingCosts }
      });
      setCalcResult(response.data);
      toast.success("CGT calculated");
    } catch (error) {
      console.error("Error calculating CGT:", error);
      toast.error("Failed to calculate CGT");
    } finally {
      setCalcLoading(false);
    }
  };

  const content = (
      <div className="space-y-6" data-testid="cgt-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">Capital Gains Tax</h1>
            <p className="text-muted-foreground mt-1">Track CGT events, calculate tax, and manage holdings</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]" data-testid="year-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_YEARS.map(fy => (
                  <SelectItem key={fy.value} value={fy.value}>{fy.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#10B981]/10 border-[#10B981]/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Gains</p>
              <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(totalGains)}</p>
              <p className="text-xs text-muted-foreground mt-1">After 50% discount</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Losses</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalLosses)}</p>
              <p className="text-xs text-muted-foreground mt-1">Available to offset</p>
            </CardContent>
          </Card>
          <Card className={netPosition >= 0 ? "bg-[#D4A84C]/10 border-[#D4A84C]/20" : "bg-[#3B82F6]/10 border-[#3B82F6]/20"}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Net Position</p>
              <p className={`text-2xl font-bold ${netPosition >= 0 ? 'text-[#D4A84C]' : 'text-[#3B82F6]'}`}>{formatCurrency(netPosition)}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedYear === "all" ? "All years" : `FY ${selectedYear}`}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Events</p>
              <p className="text-2xl font-bold">{processedEvents.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{parcels.length} parcels held</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
          </TabsList>

          {/* CGT Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">CGT Events</h3>
              <Button onClick={() => setShowAddSale(true)} className="bg-[#1a2744]" data-testid="add-sale-btn">
                <Plus className="h-4 w-4 mr-2" /> Record Sale
              </Button>
            </div>
            
            <div className="space-y-3">
              {processedEvents.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground">No CGT events for {selectedYear === "all" ? "any year" : `FY ${selectedYear}`}</CardContent></Card>
              ) : (
                processedEvents.map(event => (
                  <Card key={event.id} className="hover:border-[#1a2744]/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${event.is_gain ? 'bg-[#10B981]/10' : 'bg-destructive/10'}`}>
                            {event.is_gain ? <TrendingUp className="h-6 w-6 text-[#10B981]" /> : <TrendingDown className="h-6 w-6 text-destructive" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{event.symbol}</p>
                              <Badge variant="outline">{event.quantity} shares</Badge>
                              {event.is_discount_eligible && <Badge className="bg-[#D4A84C]/10 text-[#D4A84C] border-[#D4A84C]/20">50% Discount</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{event.name} • Sold {formatDate(event.sale_date)}</p>
                            <p className="text-xs text-muted-foreground">Held {event.days_held} days • FY {event.financial_year}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className={`text-lg font-bold ${event.is_gain ? 'text-[#10B981]' : 'text-destructive'}`}>
                              {event.is_gain ? '+' : ''}{formatCurrency(event.is_gain ? event.discounted_gain : event.gross_gain)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {event.is_gain && event.is_discount_eligible ? `Gross: ${formatCurrency(event.gross_gain)}` : `Proceeds: ${formatCurrency(event.proceeds)}`}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} data-testid={`delete-event-${event.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Holdings Tab */}
          <TabsContent value="holdings" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Share Parcels</h3>
              <Button onClick={() => setShowAddParcel(true)} className="bg-[#1a2744]" data-testid="add-parcel-btn">
                <Plus className="h-4 w-4 mr-2" /> Add Parcel
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parcels.map(parcel => (
                <Card key={parcel.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-lg">{parcel.symbol}</p>
                          <Badge variant="outline">{parcel.quantity} shares</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{parcel.name}</p>
                        <p className="text-sm mt-2">Cost: {formatCurrency(parcel.purchase_price * parcel.quantity + parcel.brokerage)}</p>
                        <p className="text-xs text-muted-foreground">@ {formatCurrency(parcel.purchase_price)}/share • {formatDate(parcel.purchase_date)}</p>
                      </div>
                      {parcel.id > 100 && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteParcel(parcel.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Multi-Year Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <Card data-testid="multi-year-summary">
              <CardHeader>
                <CardTitle className="">Multi-Year CGT Summary</CardTitle>
                <CardDescription>Capital gains and losses across financial years</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer height={300}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={yearSummary}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="gains" name="Gains" fill="#10B981" />
                      <Bar dataKey="losses" name="Losses" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                
                <div className="mt-6 space-y-2">
                  {yearSummary.map(year => (
                    <div key={year.year} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">FY {year.year}</Badge>
                        <span className="text-sm text-muted-foreground">{year.events} events</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-[#10B981]">+{formatCurrency(year.gains)}</span>
                        <span className="text-destructive">-{formatCurrency(year.losses)}</span>
                        <span className={`font-semibold ${year.net >= 0 ? 'text-[#D4A84C]' : 'text-[#3B82F6]'}`}>
                          Net: {formatCurrency(year.net)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Carried Forward Losses */}
            <Card>
              <CardHeader>
                <CardTitle className="">Loss Carry Forward</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Capital losses can be carried forward indefinitely to offset future capital gains.
                </p>
                <div className="p-4 rounded-lg bg-[#3B82F6]/10">
                  <p className="text-sm text-muted-foreground">Available Losses to Carry Forward</p>
                  <p className="text-2xl font-bold text-[#3B82F6]">
                    {formatCurrency(Math.max(0, yearSummary.reduce((sum, y) => sum - y.net, 0)))}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="">CGT Calculator</CardTitle>
                  <CardDescription>Calculate CGT on property, shares, and other assets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Entity Type</Label>
                    <Select value={entityType} onValueChange={setEntityType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual (50% discount)</SelectItem>
                        <SelectItem value="smsf">SMSF (33% discount)</SelectItem>
                        <SelectItem value="company">Company (No discount)</SelectItem>
                        <SelectItem value="trust">Trust (50% discount)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Purchase Price</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Sale Price</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} className="pl-10" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Holding Period: {holdingPeriod} months</Label>
                    <Slider value={[holdingPeriod]} onValueChange={(v) => setHoldingPeriod(v[0])} max={120} step={1} />
                  </div>
                  <div className="space-y-2">
                    <Label>Marginal Tax Rate: {marginalRate}%</Label>
                    <Slider value={[marginalRate]} onValueChange={(v) => setMarginalRate(v[0])} max={47} step={1} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Improvement Costs</Label>
                      <Input type="number" value={improvementCosts} onChange={(e) => setImprovementCosts(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Costs</Label>
                      <Input type="number" value={sellingCosts} onChange={(e) => setSellingCosts(Number(e.target.value))} />
                    </div>
                  </div>
                  <Button onClick={calculateCGT} className="w-full bg-[#1a2744]" disabled={calcLoading}>
                    <Calculator className="h-4 w-4 mr-2" /> Calculate CGT
                  </Button>
                </CardContent>
              </Card>

              {calcResult && (
                <Card className="bg-[#1a2744] text-white">
                  <CardHeader>
                    <CardTitle className=" text-white">CGT Result</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-white/10">
                        <p className="text-sm text-white/70">Capital Gain</p>
                        <p className="text-xl font-bold">{formatCurrency(calcResult.capital_gain)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/10">
                        <p className="text-sm text-white/70">Taxable Gain</p>
                        <p className="text-xl font-bold">{formatCurrency(calcResult.taxable_gain)}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-[#D4A84C]/20">
                      <p className="text-sm text-white/70">Estimated Tax</p>
                      <p className="text-3xl font-bold text-[#D4A84C]">{formatCurrency(calcResult.estimated_tax)}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-white/70">Cost Base</span><span>{formatCurrency(calcResult.cost_base)}</span></div>
                      <div className="flex justify-between"><span className="text-white/70">CGT Discount</span><span>{calcResult.discount_percentage}%</span></div>
                      <div className="flex justify-between"><span className="text-white/70">Effective Rate</span><span>{calcResult.effective_rate.toFixed(1)}%</span></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Parcel Modal */}
        {showAddParcel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddParcel(false)}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Add Share Parcel</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowAddParcel(false)}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Symbol</Label><Input value={newParcel.symbol} onChange={e => setNewParcel({...newParcel, symbol: e.target.value.toUpperCase()})} placeholder="CBA" /></div>
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={newParcel.quantity} onChange={e => setNewParcel({...newParcel, quantity: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>Company Name</Label><Input value={newParcel.name} onChange={e => setNewParcel({...newParcel, name: e.target.value})} placeholder="Commonwealth Bank" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Purchase Price</Label><Input type="number" value={newParcel.purchase_price} onChange={e => setNewParcel({...newParcel, purchase_price: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Purchase Date</Label><Input type="date" value={newParcel.purchase_date} onChange={e => setNewParcel({...newParcel, purchase_date: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>Brokerage</Label><Input type="number" value={newParcel.brokerage} onChange={e => setNewParcel({...newParcel, brokerage: e.target.value})} /></div>
                <Button onClick={handleAddParcel} className="w-full bg-[#1a2744]">Add Parcel</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Sale Modal */}
        {showAddSale && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddSale(false)}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Record Share Sale</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowAddSale(false)}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Parcel</Label>
                  <Select value={newSale.parcel_id} onValueChange={v => setNewSale({...newSale, parcel_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select parcel to sell" /></SelectTrigger>
                    <SelectContent>
                      {parcels.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.symbol} - {p.quantity} @ {formatCurrency(p.purchase_price)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Quantity Sold</Label><Input type="number" value={newSale.quantity} onChange={e => setNewSale({...newSale, quantity: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Sale Price</Label><Input type="number" value={newSale.sale_price} onChange={e => setNewSale({...newSale, sale_price: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Sale Date</Label><Input type="date" value={newSale.sale_date} onChange={e => setNewSale({...newSale, sale_date: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Brokerage</Label><Input type="number" value={newSale.brokerage} onChange={e => setNewSale({...newSale, brokerage: e.target.value})} /></div>
                </div>
                <Button onClick={handleAddSale} className="w-full bg-[#1a2744]">Record Sale</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default CGT;
