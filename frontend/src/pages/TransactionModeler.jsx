import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  TrendingUp,
  LineChart,
  DollarSign,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  PiggyBank,
  Target,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Info,
  Wallet,
  BarChart3,
  ArrowLeft,
  Bitcoin,
  Coins,
  Plus,
  Trash2,
  List,
  Landmark,
  ArrowLeftRight
} from "lucide-react";
import { toast } from "sonner";

import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = API_URL;

const formatCurrency = (value) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Projection Chart Component with Timeline Scale
const ProjectionChart = ({ projections, initialValue, timeframe, scenarios = null }) => {
  if (!projections && !scenarios) return null;

  const data = scenarios ? scenarios : { main: projections };
  const scenarioKeys = Object.keys(data);
  const maxYears = timeframe;
  
  // Find max value for scaling
  let maxValue = initialValue;
  scenarioKeys.forEach(key => {
    data[key]?.forEach(p => {
      if (p.year <= maxYears && p.value > maxValue) {
        maxValue = p.value;
      }
    });
  });

  const chartHeight = 200;
  const chartWidth = 100; // percentage
  const padding = 40;

  const getY = (value) => {
    return chartHeight - ((value / maxValue) * (chartHeight - padding));
  };

  const getX = (year) => {
    return (year / maxYears) * 100;
  };

  const scenarioColors = {
    main: "#D4A84C",
    conservative: "#6B7280",
    moderate: "#3B82F6",
    aggressive: "#10B981"
  };

  const scenarioLabels = {
    main: "Projected",
    conservative: "Conservative (5%)",
    moderate: "Moderate (8%)",
    aggressive: "Aggressive (12%)"
  };

  // Generate year markers
  const yearMarkers = [];
  const step = maxYears <= 5 ? 1 : maxYears <= 10 ? 2 : 5;
  for (let y = 0; y <= maxYears; y += step) {
    yearMarkers.push(y);
  }

  return (
    <div className="relative w-full" style={{ height: chartHeight + 60 }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground pr-2" style={{ width: 60 }}>
        <span>{formatCurrency(maxValue)}</span>
        <span>{formatCurrency(maxValue * 0.5)}</span>
        <span>{formatCurrency(0)}</span>
      </div>

      {/* Chart area */}
      <div className="absolute left-16 right-4 top-0" style={{ height: chartHeight }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={`item-${i}`} className="border-t border-dashed border-muted-foreground/20 w-full" />
          ))}
        </div>

        {/* SVG for lines */}
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          {scenarioKeys.map(key => {
            const points = data[key]?.filter(p => p.year <= maxYears) || [];
            if (points.length < 2) return null;

            const pathData = points.map((p, i) => {
              const x = getX(p.year);
              const y = getY(p.value);
              return `${i === 0 ? 'M' : 'L'} ${x}% ${y}`;
            }).join(' ');

            return (
              <path
                key={key}
                d={pathData}
                fill="none"
                stroke={scenarioColors[key] || "#D4A84C"}
                strokeWidth={key === "main" ? 3 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={key !== "main" ? "opacity-70" : ""}
              />
            );
          })}
          
          {/* Data points */}
          {scenarioKeys.map(key => {
            const points = data[key]?.filter(p => p.year <= maxYears) || [];
            return points.map((p, i) => (
              <circle
                key={`${key}-${i}`}
                cx={`${getX(p.year)}%`}
                cy={getY(p.value)}
                r={key === "main" ? 5 : 4}
                fill={scenarioColors[key] || "#D4A84C"}
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>{`Year ${p.year}: ${formatCurrency(p.value)}`}</title>
              </circle>
            ));
          })}
        </svg>

        {/* Initial value marker */}
        <div 
          className="absolute left-0 w-2 h-2 bg-white border-2 border-[#1a2744] rounded-full transform -translate-x-1/2"
          style={{ top: getY(initialValue) - 4 }}
        />
      </div>

      {/* X-axis labels */}
      <div className="absolute left-16 right-4 flex justify-between text-xs text-muted-foreground" style={{ top: chartHeight + 10 }}>
        {yearMarkers.map(year => (
          <span key={year} style={{ marginLeft: year === 0 ? 0 : 'auto' }}>
            {year === 0 ? "Now" : `${year}yr`}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute left-16 right-4 flex flex-wrap gap-4 text-xs" style={{ top: chartHeight + 35 }}>
        {scenarioKeys.map(key => (
          <div key={key} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: scenarioColors[key] || "#D4A84C" }}
            />
            <span className="text-muted-foreground">{scenarioLabels[key] || key}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Value Summary Cards
const ValueSummaryCards = ({ projections, timeframe, initialValue }) => {
  if (!projections) return null;
  
  const targetYear = projections.find(p => p.year === timeframe);
  if (!targetYear) return null;

  const totalReturn = targetYear.value - initialValue;
  const percentReturn = ((totalReturn / initialValue) * 100).toFixed(1);
  const annualizedReturn = (Math.pow(targetYear.value / initialValue, 1 / timeframe) - 1) * 100;

  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <p className="text-xs text-muted-foreground">Value at Year {timeframe}</p>
        <p className="text-lg font-bold text-[#1a2744]">{formatCurrency(targetYear.value)}</p>
      </div>
      <div className="bg-emerald-50 rounded-lg p-3 text-center">
        <p className="text-xs text-emerald-700">Total Return</p>
        <p className="text-lg font-bold text-emerald-700">+{formatCurrency(totalReturn)}</p>
      </div>
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <p className="text-xs text-blue-700">Annualized Return</p>
        <p className="text-lg font-bold text-blue-700">{annualizedReturn.toFixed(1)}% p.a.</p>
      </div>
    </div>
  );
};

const TransactionModeler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client") || "client_1";
  
  const [activeTab, setActiveTab] = useState("fund");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [timeframe, setTimeframe] = useState(10);
  
  // Multi-transaction state
  const [transactions, setTransactions] = useState([]);
  const [showTransactionList, setShowTransactionList] = useState(false);
  
  // Property form state
  const [propertyForm, setPropertyForm] = useState({
    transaction_type: "buy",
    property_value: 850000,
    deposit_percent: 20,
    loan_interest_rate: 6.5,
    loan_term_years: 30,
    expected_rental_yield: 4.0,
    expected_capital_growth: 5.0
  });
  
  // Fund/ETF form state
  const [fundForm, setFundForm] = useState({
    transaction_type: "buy",
    fund_name: "Vanguard Australian Shares Index ETF (VAS)",
    amount: 100000,
    expected_return: 7.0,
    management_fee: 0.10,
    distribution_yield: 3.5
  });
  
  // Stock form state
  const [stockForm, setStockForm] = useState({
    transaction_type: "buy",
    symbol: "CBA",
    shares: 100,
    price_per_share: 120,
    expected_return: 8.0,
    dividend_yield: 4.5,
    purchase_date: "2023-01-01",
    purchase_price: 95
  });

  // Crypto form state
  const [cryptoForm, setCryptoForm] = useState({
    transaction_type: "buy",
    asset: "BTC",
    amount: 50000,
    expected_return_conservative: 5,
    expected_return_moderate: 15,
    expected_return_aggressive: 30
  });

  // ETF form state
  const [etfForm, setEtfForm] = useState({
    transaction_type: "buy",
    etf_name: "iShares Core S&P 500 ETF (IVV)",
    amount: 75000,
    expected_return: 9.0,
    management_fee: 0.03,
    distribution_yield: 1.5
  });

  // Bond form state
  const [bondForm, setBondForm] = useState({
    transaction_type: "buy",
    bond_type: "corporate",
    bond_name: "Corporate Bond Fund",
    amount: 50000,
    yield_to_maturity: 5.5,
    coupon_rate: 5.0,
    maturity_years: 5,
    credit_rating: "BBB+"
  });

  // Hybrid form state
  const [hybridForm, setHybridForm] = useState({
    transaction_type: "buy",
    hybrid_name: "CBA PERLS XI (CBAPD)",
    amount: 25000,
    margin_over_bbsw: 3.0,
    bbsw_rate: 4.35,
    franking_percentage: 100,
    call_date: "2026-10-15"
  });

  const selectedClient = JSON.parse(localStorage.getItem("selected_client") || "{}");
  const clientName = selectedClient.name || "Thompson Family";

  // Generate projections locally for visualization
  const generateProjections = (initial, rate, years) => {
    const projections = [];
    let value = initial;
    for (let year = 0; year <= years; year++) {
      projections.push({ year, value: Math.round(value) });
      value *= (1 + rate / 100);
    }
    return projections;
  };

  const modelProperty = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${API_URL}/api/transaction-modeling/property?client_id=${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propertyForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult({ type: "property", data });
        toast.success("Property scenario modeled successfully");
      } else {
        toast.error("Failed to model property scenario");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const modelFund = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${API_URL}/api/transaction-modeling/fund?client_id=${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...fundForm, projection_years: timeframe})
      });
      
      if (response.ok) {
        const data = await response.json();
        // Add extended projections for chart
        const extendedProjections = generateProjections(
          fundForm.amount, 
          fundForm.expected_return - fundForm.management_fee, 
          Math.max(timeframe, 20)
        );
        data.analysis.extended_projections = extendedProjections;
        setResult({ type: "fund", data });
        toast.success("Fund/ETF investment modeled successfully");
      } else {
        toast.error("Failed to model fund investment");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const modelStock = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${API_URL}/api/transaction-modeling/stock?client_id=${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        // Generate extended projections with scenarios
        const initial = stockForm.shares * stockForm.price_per_share;
        data.analysis.scenarios = {
          conservative: generateProjections(initial, 5, Math.max(timeframe, 20)),
          moderate: generateProjections(initial, stockForm.expected_return, Math.max(timeframe, 20)),
          aggressive: generateProjections(initial, 12, Math.max(timeframe, 20))
        };
        data.analysis.initial_value = initial;
        setResult({ type: "stock", data });
        toast.success("Stock trade modeled successfully");
      } else {
        toast.error("Failed to model stock trade");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const modelCrypto = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Generate crypto projections with high volatility scenarios
      const scenarios = {
        conservative: generateProjections(cryptoForm.amount, cryptoForm.expected_return_conservative, Math.max(timeframe, 20)),
        moderate: generateProjections(cryptoForm.amount, cryptoForm.expected_return_moderate, Math.max(timeframe, 20)),
        aggressive: generateProjections(cryptoForm.amount, cryptoForm.expected_return_aggressive, Math.max(timeframe, 20))
      };

      setResult({ 
        type: "crypto", 
        data: {
          analysis: {
            investment_details: {
              asset: cryptoForm.asset,
              amount: cryptoForm.amount,
              scenarios: {
                conservative: `${cryptoForm.expected_return_conservative}% p.a.`,
                moderate: `${cryptoForm.expected_return_moderate}% p.a.`,
                aggressive: `${cryptoForm.expected_return_aggressive}% p.a.`
              }
            },
            scenarios,
            initial_value: cryptoForm.amount,
            summary: {
              [`${timeframe}_year_conservative`]: scenarios.conservative.find(p => p.year === timeframe),
              [`${timeframe}_year_moderate`]: scenarios.moderate.find(p => p.year === timeframe),
              [`${timeframe}_year_aggressive`]: scenarios.aggressive.find(p => p.year === timeframe)
            }
          }
        }
      });
      toast.success("Crypto scenario modeled successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to model crypto scenario");
    } finally {
      setLoading(false);
    }
  };

  const modelETF = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Generate ETF projections with scenarios
      const netReturn = etfForm.expected_return - etfForm.management_fee;
      const scenarios = {
        conservative: generateProjections(etfForm.amount, netReturn - 3, Math.max(timeframe, 20)),
        moderate: generateProjections(etfForm.amount, netReturn, Math.max(timeframe, 20)),
        aggressive: generateProjections(etfForm.amount, netReturn + 3, Math.max(timeframe, 20))
      };

      setResult({ 
        type: "etf", 
        data: {
          analysis: {
            investment_details: {
              etf_name: etfForm.etf_name,
              amount: etfForm.amount,
              expected_return: etfForm.expected_return,
              management_fee: etfForm.management_fee,
              distribution_yield: etfForm.distribution_yield,
              net_return: netReturn
            },
            scenarios,
            initial_value: etfForm.amount,
            extended_projections: scenarios.moderate,
            summary: {
              [`${timeframe}_year_conservative`]: scenarios.conservative.find(p => p.year === timeframe),
              [`${timeframe}_year_moderate`]: scenarios.moderate.find(p => p.year === timeframe),
              [`${timeframe}_year_aggressive`]: scenarios.aggressive.find(p => p.year === timeframe)
            }
          }
        }
      });
      toast.success("ETF scenario modeled successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to model ETF scenario");
    } finally {
      setLoading(false);
    }
  };

  const handleModel = () => {
    switch (activeTab) {
      case "property": modelProperty(); break;
      case "fund": modelFund(); break;
      case "stock": modelStock(); break;
      case "crypto": modelCrypto(); break;
      case "etf": modelETF(); break;
      case "bonds": modelBonds(); break;
      case "hybrids": modelHybrids(); break;
      default: break;
    }
  };

  // Model bonds
  const modelBonds = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const scenarios = {
        conservative: generateProjections(bondForm.amount, bondForm.yield_to_maturity - 1, Math.max(timeframe, 20)),
        moderate: generateProjections(bondForm.amount, bondForm.yield_to_maturity, Math.max(timeframe, 20)),
        aggressive: generateProjections(bondForm.amount, bondForm.yield_to_maturity + 0.5, Math.max(timeframe, 20))
      };

      setResult({ 
        type: "bonds", 
        data: {
          analysis: {
            investment_details: {
              bond_name: bondForm.bond_name,
              amount: bondForm.amount,
              yield_to_maturity: bondForm.yield_to_maturity,
              maturity_years: bondForm.maturity_years,
              credit_rating: bondForm.credit_rating
            },
            scenarios,
            initial_value: bondForm.amount,
            summary: {
              [`${timeframe}_year_conservative`]: scenarios.conservative.find(p => p.year === timeframe),
              [`${timeframe}_year_moderate`]: scenarios.moderate.find(p => p.year === timeframe),
              [`${timeframe}_year_aggressive`]: scenarios.aggressive.find(p => p.year === timeframe)
            }
          }
        }
      });
      toast.success("Bond scenario modeled successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to model bond scenario");
    } finally {
      setLoading(false);
    }
  };

  // Model hybrids
  const modelHybrids = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const runningYield = hybridForm.bbsw_rate + hybridForm.margin_over_bbsw;
      const scenarios = {
        conservative: generateProjections(hybridForm.amount, runningYield - 1, Math.max(timeframe, 20)),
        moderate: generateProjections(hybridForm.amount, runningYield, Math.max(timeframe, 20)),
        aggressive: generateProjections(hybridForm.amount, runningYield + 1, Math.max(timeframe, 20))
      };

      setResult({ 
        type: "hybrids", 
        data: {
          analysis: {
            investment_details: {
              hybrid_name: hybridForm.hybrid_name,
              amount: hybridForm.amount,
              running_yield: runningYield,
              margin_over_bbsw: hybridForm.margin_over_bbsw,
              franking: hybridForm.franking_percentage
            },
            scenarios,
            initial_value: hybridForm.amount,
            summary: {
              [`${timeframe}_year_conservative`]: scenarios.conservative.find(p => p.year === timeframe),
              [`${timeframe}_year_moderate`]: scenarios.moderate.find(p => p.year === timeframe),
              [`${timeframe}_year_aggressive`]: scenarios.aggressive.find(p => p.year === timeframe)
            }
          }
        }
      });
      toast.success("Hybrid scenario modeled successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to model hybrid scenario");
    } finally {
      setLoading(false);
    }
  };

  // Add transaction to list
  const addToTransactionList = () => {
    let newTransaction = null;
    const id = Date.now();
    
    switch (activeTab) {
      case "property":
        newTransaction = {
          id, type: "property", 
          name: `Property $${(propertyForm.property_value / 1000).toFixed(0)}K`,
          amount: propertyForm.property_value,
          details: { ...propertyForm }
        };
        break;
      case "fund":
        newTransaction = {
          id, type: "fund",
          name: fundForm.fund_name.split('(')[0].trim(),
          amount: fundForm.amount,
          details: { ...fundForm }
        };
        break;
      case "stock":
        newTransaction = {
          id, type: "stock",
          name: `${stockForm.symbol} x${stockForm.shares}`,
          amount: stockForm.shares * stockForm.price_per_share,
          details: { ...stockForm }
        };
        break;
      case "etf":
        newTransaction = {
          id, type: "etf",
          name: etfForm.etf_name.split('(')[0].trim(),
          amount: etfForm.amount,
          details: { ...etfForm }
        };
        break;
      case "bonds":
        newTransaction = {
          id, type: "bonds",
          name: bondForm.bond_name,
          amount: bondForm.amount,
          details: { ...bondForm }
        };
        break;
      case "hybrids":
        newTransaction = {
          id, type: "hybrids",
          name: hybridForm.hybrid_name.split('(')[0].trim(),
          amount: hybridForm.amount,
          details: { ...hybridForm }
        };
        break;
      case "crypto":
        newTransaction = {
          id, type: "crypto",
          name: cryptoForm.asset,
          amount: cryptoForm.amount,
          details: { ...cryptoForm }
        };
        break;
    }
    
    if (newTransaction) {
      setTransactions([...transactions, newTransaction]);
      toast.success(`Added ${newTransaction.name} to scenario list`);
    }
  };

  // Remove transaction from list
  const removeTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
    toast.success("Transaction removed");
  };

  // Calculate total for all transactions
  const totalTransactionValue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  const getTypeIcon = (type) => {
    switch (type) {
      case "property": return Building2;
      case "fund": return PiggyBank;
      case "stock": return TrendingUp;
      case "etf": return LineChart;
      case "bonds": return Landmark;
      case "hybrids": return ArrowLeftRight;
      case "crypto": return Bitcoin;
      default: return DollarSign;
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="transaction-modeler">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/client-360")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Calculator className="h-7 w-7 text-[#D4A84C]" />
              Transaction Modeler
            </h1>
            <p className="text-muted-foreground mt-1">
              Model "What If" scenarios for {clientName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <span className="text-sm text-muted-foreground px-2">Timeframe:</span>
              {[1, 3, 5, 10, 20].map(years => (
                <Button
                  key={years}
                  variant={timeframe === years ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe(years)}
                  className={timeframe === years ? "bg-[#1a2744]" : ""}
                  data-testid={`timeframe-${years}yr`}
                >
                  {years}yr
                </Button>
              ))}
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2 text-[#D4A84C]" />
              Scenario Builder
            </Badge>
          </div>
        </div>

        {/* Transaction List Panel */}
        {transactions.length > 0 && (
          <Card className="bg-gradient-to-r from-[#1a2744]/5 to-[#D4A84C]/5 border-[#D4A84C]/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <List className="h-5 w-5 text-[#D4A84C]" />
                  Scenario Transactions ({transactions.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#1a2744]">
                    Total: {formatCurrency(totalTransactionValue)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {transactions.map(txn => {
                  const Icon = getTypeIcon(txn.type);
                  return (
                    <div 
                      key={txn.id}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border shadow-sm"
                      data-testid={`transaction-item-${txn.id}`}
                    >
                      <Icon className="h-4 w-4 text-[#1a2744]" />
                      <span className="font-medium text-sm">{txn.name}</span>
                      <span className="text-sm text-muted-foreground">{formatCurrency(txn.amount)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 ml-1 hover:bg-red-100 hover:text-red-600"
                        onClick={() => removeTransaction(txn.id)}
                        data-testid={`delete-transaction-${txn.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              {/* Save and Generate Plan Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    const scenarioData = {
                      id: Date.now(),
                      name: `Scenario ${new Date().toLocaleDateString()}`,
                      client: clientName,
                      transactions: transactions,
                      total: totalTransactionValue,
                      timeframe: timeframe,
                      createdAt: new Date().toISOString()
                    };
                    const saved = JSON.parse(localStorage.getItem("saved_scenarios") || "[]");
                    saved.push(scenarioData);
                    localStorage.setItem("saved_scenarios", JSON.stringify(saved));
                    toast.success("Scenario saved successfully!");
                  }}
                  data-testid="save-scenario-btn"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
                <Button
                  className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                  onClick={async () => {
                    if (transactions.length === 0) {
                      toast.error("Add at least one transaction to generate a plan");
                      return;
                    }
                    
                    toast.loading("Generating financial plan...", { id: "plan-gen" });
                    
                    try {
                      const response = await axios.post(`${API}/api/financial-plan/generate`, {
                        scenario: {
                          client_id: "client_demo",
                          client_name: clientName || "Demo Client",
                          transactions: transactions.map((t, idx) => ({
                            id: idx + 1,
                            type: t.type,
                            name: t.name,
                            amount: t.amount,
                            details: t.details || {}
                          })),
                          total_value: totalTransactionValue,
                          timeframe: timeframe,
                          goals: [],
                          risk_profile: "moderate"
                        },
                        include_tax_analysis: true,
                        include_risk_assessment: true,
                        include_projections: true
                      });
                      
                      toast.dismiss("plan-gen");
                      
                      if (response.data.success) {
                        const plan = response.data.plan;
                        toast.success(
                          <div className="space-y-2">
                            <p className="font-semibold">Financial Plan Generated!</p>
                            <p className="text-sm">Plan ID: {plan.plan_id}</p>
                            <p className="text-sm">Projected Value: {formatCurrency(plan.projections?.projected_final_value || 0)}</p>
                            <p className="text-sm">Annualized Return: {plan.projections?.annualized_return || 0}%</p>
                          </div>,
                          { duration: 8000 }
                        );
                        
                        // Store plan for reference
                        localStorage.setItem(`plan_${plan.plan_id}`, JSON.stringify(plan));
                      }
                    } catch (error) {
                      toast.dismiss("plan-gen");
                      console.error("Error generating plan:", error);
                      toast.error("Failed to generate plan. Please try again.");
                    }
                  }}
                  data-testid="generate-plan-btn"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Model a Transaction</CardTitle>
              <CardDescription>
                Choose an asset type and configure the parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setResult(null); }}>
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="property" className="flex items-center gap-1 text-xs">
                    <Building2 className="h-4 w-4" />
                    Property
                  </TabsTrigger>
                  <TabsTrigger value="fund" className="flex items-center gap-1 text-xs">
                    <PiggyBank className="h-4 w-4" />
                    Fund
                  </TabsTrigger>
                  <TabsTrigger value="stock" className="flex items-center gap-1 text-xs">
                    <TrendingUp className="h-4 w-4" />
                    Stock
                  </TabsTrigger>
                  <TabsTrigger value="etf" className="flex items-center gap-1 text-xs">
                    <LineChart className="h-4 w-4" />
                    ETF
                  </TabsTrigger>
                  <TabsTrigger value="bonds" className="flex items-center gap-1 text-xs">
                    <Landmark className="h-4 w-4" />
                    Bonds
                  </TabsTrigger>
                  <TabsTrigger value="hybrids" className="flex items-center gap-1 text-xs">
                    <ArrowLeftRight className="h-4 w-4" />
                    Hybrids
                  </TabsTrigger>
                  <TabsTrigger value="crypto" className="flex items-center gap-1 text-xs">
                    <Bitcoin className="h-4 w-4" />
                    Crypto
                  </TabsTrigger>
                </TabsList>

                {/* Property Tab */}
                <TabsContent value="property" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Transaction Type</Label>
                      <Select 
                        value={propertyForm.transaction_type}
                        onValueChange={(v) => setPropertyForm({...propertyForm, transaction_type: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy Property</SelectItem>
                          <SelectItem value="sell">Sell Property</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Property Value</Label>
                      <Input
                        type="number"
                        value={propertyForm.property_value}
                        onChange={(e) => setPropertyForm({...propertyForm, property_value: Number(e.target.value)})}
                        data-testid="property-value-input"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Deposit: {propertyForm.deposit_percent}%</Label>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(propertyForm.property_value * propertyForm.deposit_percent / 100)}
                        </span>
                      </div>
                      <Slider
                        value={[propertyForm.deposit_percent]}
                        onValueChange={([v]) => setPropertyForm({...propertyForm, deposit_percent: v})}
                        min={5} max={50} step={5}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Interest Rate: {propertyForm.loan_interest_rate}%</Label>
                      </div>
                      <Slider
                        value={[propertyForm.loan_interest_rate]}
                        onValueChange={([v]) => setPropertyForm({...propertyForm, loan_interest_rate: v})}
                        min={4} max={10} step={0.25}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Expected Capital Growth: {propertyForm.expected_capital_growth}%</Label>
                      </div>
                      <Slider
                        value={[propertyForm.expected_capital_growth]}
                        onValueChange={([v]) => setPropertyForm({...propertyForm, expected_capital_growth: v})}
                        min={0} max={10} step={0.5}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Fund Tab */}
                <TabsContent value="fund" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Transaction Type</Label>
                      <Select 
                        value={fundForm.transaction_type}
                        onValueChange={(v) => setFundForm({...fundForm, transaction_type: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy/Invest</SelectItem>
                          <SelectItem value="sell">Sell/Redeem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Investment Amount</Label>
                      <Input
                        type="number"
                        value={fundForm.amount}
                        onChange={(e) => setFundForm({...fundForm, amount: Number(e.target.value)})}
                        data-testid="fund-amount-input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Fund Name</Label>
                    <Select value={fundForm.fund_name} onValueChange={(v) => setFundForm({...fundForm, fund_name: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vanguard Australian Shares Index ETF (VAS)">VAS - Vanguard Australian Shares</SelectItem>
                        <SelectItem value="Vanguard International Shares ETF (VGS)">VGS - Vanguard International</SelectItem>
                        <SelectItem value="Magellan Global Fund">Magellan Global Fund</SelectItem>
                        <SelectItem value="Platinum International Fund">Platinum International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Expected Return: {fundForm.expected_return}% p.a.</Label>
                      </div>
                      <Slider
                        value={[fundForm.expected_return]}
                        onValueChange={([v]) => setFundForm({...fundForm, expected_return: v})}
                        min={3} max={15} step={0.5}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Management Fee: {fundForm.management_fee}%</Label>
                      </div>
                      <Slider
                        value={[fundForm.management_fee]}
                        onValueChange={([v]) => setFundForm({...fundForm, management_fee: v})}
                        min={0.05} max={2} step={0.05}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Stock Tab */}
                <TabsContent value="stock" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Transaction Type</Label>
                      <Select 
                        value={stockForm.transaction_type}
                        onValueChange={(v) => setStockForm({...stockForm, transaction_type: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy Shares</SelectItem>
                          <SelectItem value="sell">Sell Shares</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Stock Symbol</Label>
                      <Select value={stockForm.symbol} onValueChange={(v) => setStockForm({...stockForm, symbol: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CBA">CBA - Commonwealth Bank</SelectItem>
                          <SelectItem value="BHP">BHP - BHP Group</SelectItem>
                          <SelectItem value="CSL">CSL - CSL Limited</SelectItem>
                          <SelectItem value="WBC">WBC - Westpac</SelectItem>
                          <SelectItem value="NAB">NAB - National Australia Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Number of Shares</Label>
                      <Input
                        type="number"
                        value={stockForm.shares}
                        onChange={(e) => setStockForm({...stockForm, shares: Number(e.target.value)})}
                        data-testid="stock-shares-input"
                      />
                    </div>
                    <div>
                      <Label>Price per Share</Label>
                      <Input
                        type="number"
                        value={stockForm.price_per_share}
                        onChange={(e) => setStockForm({...stockForm, price_per_share: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Expected Return: {stockForm.expected_return}% p.a.</Label>
                      </div>
                      <Slider
                        value={[stockForm.expected_return]}
                        onValueChange={([v]) => setStockForm({...stockForm, expected_return: v})}
                        min={3} max={15} step={0.5}
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Trade Value: {formatCurrency(stockForm.shares * stockForm.price_per_share)}
                    </p>
                  </div>
                </TabsContent>

                {/* ETF Tab */}
                <TabsContent value="etf" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Transaction Type</Label>
                      <Select 
                        value={etfForm.transaction_type}
                        onValueChange={(v) => setEtfForm({...etfForm, transaction_type: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy ETF</SelectItem>
                          <SelectItem value="sell">Sell ETF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Investment Amount</Label>
                      <Input
                        type="number"
                        value={etfForm.amount}
                        onChange={(e) => setEtfForm({...etfForm, amount: Number(e.target.value)})}
                        data-testid="etf-amount-input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>ETF Selection</Label>
                    <Select value={etfForm.etf_name} onValueChange={(v) => setEtfForm({...etfForm, etf_name: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iShares Core S&P 500 ETF (IVV)">IVV - iShares S&P 500</SelectItem>
                        <SelectItem value="Vanguard Total Stock Market ETF (VTI)">VTI - Vanguard Total Market</SelectItem>
                        <SelectItem value="SPDR S&P/ASX 200 Fund (STW)">STW - SPDR ASX 200</SelectItem>
                        <SelectItem value="BetaShares NASDAQ 100 ETF (NDQ)">NDQ - BetaShares NASDAQ 100</SelectItem>
                        <SelectItem value="VanEck MSCI World ex-Australia Quality ETF (QUAL)">QUAL - VanEck World Quality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Expected Return: {etfForm.expected_return}% p.a.</Label>
                      </div>
                      <Slider
                        value={[etfForm.expected_return]}
                        onValueChange={([v]) => setEtfForm({...etfForm, expected_return: v})}
                        min={4} max={15} step={0.5}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Management Fee: {etfForm.management_fee}%</Label>
                      </div>
                      <Slider
                        value={[etfForm.management_fee]}
                        onValueChange={([v]) => setEtfForm({...etfForm, management_fee: v})}
                        min={0.03} max={1} step={0.01}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Bonds Tab */}
                <TabsContent value="bonds" className="space-y-4 mt-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Fixed income investments provide stable returns. Consider credit risk and interest rate risk.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bond Type</Label>
                      <Select value={bondForm.bond_type} onValueChange={(v) => setBondForm({...bondForm, bond_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="government">Government Bond</SelectItem>
                          <SelectItem value="corporate">Corporate Bond</SelectItem>
                          <SelectItem value="bond_fund">Bond Fund/ETF</SelectItem>
                          <SelectItem value="term_deposit">Term Deposit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Investment Amount</Label>
                      <Input
                        type="number"
                        value={bondForm.amount}
                        onChange={(e) => setBondForm({...bondForm, amount: Number(e.target.value)})}
                        data-testid="bond-amount-input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Bond Selection</Label>
                    <Select value={bondForm.bond_name} onValueChange={(v) => setBondForm({...bondForm, bond_name: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Australian Govt 10Y Bond">Australian Govt 10Y Bond (4.2%)</SelectItem>
                        <SelectItem value="Corporate Bond Fund">Corporate Bond Fund (5.1%)</SelectItem>
                        <SelectItem value="NSW Treasury Bond">NSW Treasury Bond (4.5%)</SelectItem>
                        <SelectItem value="Vanguard Australian Fixed Interest (VAF)">VAF - Vanguard Aus Fixed Interest</SelectItem>
                        <SelectItem value="iShares Core Composite Bond (IAF)">IAF - iShares Composite Bond</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Yield to Maturity: {bondForm.yield_to_maturity}% p.a.</Label>
                      </div>
                      <Slider
                        value={[bondForm.yield_to_maturity]}
                        onValueChange={([v]) => setBondForm({...bondForm, yield_to_maturity: v})}
                        min={2} max={8} step={0.1}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Maturity: {bondForm.maturity_years} years</Label>
                      </div>
                      <Slider
                        value={[bondForm.maturity_years]}
                        onValueChange={([v]) => setBondForm({...bondForm, maturity_years: v})}
                        min={1} max={10} step={1}
                      />
                    </div>

                    <div>
                      <Label>Credit Rating</Label>
                      <Select value={bondForm.credit_rating} onValueChange={(v) => setBondForm({...bondForm, credit_rating: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AAA">AAA (Highest Quality)</SelectItem>
                          <SelectItem value="AA">AA (Very High Quality)</SelectItem>
                          <SelectItem value="A">A (High Quality)</SelectItem>
                          <SelectItem value="BBB+">BBB+ (Investment Grade)</SelectItem>
                          <SelectItem value="BBB">BBB (Investment Grade)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Hybrids Tab */}
                <TabsContent value="hybrids" className="space-y-4 mt-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Hybrid securities have equity-like risks including conversion and non-payment of distributions.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Hybrid Security</Label>
                      <Select value={hybridForm.hybrid_name} onValueChange={(v) => setHybridForm({...hybridForm, hybrid_name: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CBA PERLS XI (CBAPD)">CBAPD - CBA PERLS XI</SelectItem>
                          <SelectItem value="Westpac Capital Notes 8 (WBCPI)">WBCPI - Westpac Cap Notes 8</SelectItem>
                          <SelectItem value="ANZ Capital Notes 7 (ANZPJ)">ANZPJ - ANZ Cap Notes 7</SelectItem>
                          <SelectItem value="NAB Capital Notes 5 (NABPH)">NABPH - NAB Cap Notes 5</SelectItem>
                          <SelectItem value="Macquarie Cap Notes 4 (MQGPD)">MQGPD - Macquarie Cap Notes 4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Investment Amount</Label>
                      <Input
                        type="number"
                        value={hybridForm.amount}
                        onChange={(e) => setHybridForm({...hybridForm, amount: Number(e.target.value)})}
                        data-testid="hybrid-amount-input"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Margin over BBSW: {hybridForm.margin_over_bbsw}%</Label>
                      </div>
                      <Slider
                        value={[hybridForm.margin_over_bbsw]}
                        onValueChange={([v]) => setHybridForm({...hybridForm, margin_over_bbsw: v})}
                        min={2} max={5} step={0.1}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Current BBSW Rate: {hybridForm.bbsw_rate}%</Label>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Running Yield: <span className="font-semibold text-[#D4A84C]">{(hybridForm.bbsw_rate + hybridForm.margin_over_bbsw).toFixed(2)}%</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Franking: {hybridForm.franking_percentage}%</Label>
                      </div>
                      <Slider
                        value={[hybridForm.franking_percentage]}
                        onValueChange={([v]) => setHybridForm({...hybridForm, franking_percentage: v})}
                        min={0} max={100} step={5}
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Grossed-up Yield: <span className="font-semibold text-emerald-600">{((hybridForm.bbsw_rate + hybridForm.margin_over_bbsw) / (1 - 0.30 * hybridForm.franking_percentage / 100)).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Crypto Tab */}
                <TabsContent value="crypto" className="space-y-4 mt-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Crypto assets are highly volatile. Projections show a wide range of outcomes.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cryptocurrency</Label>
                      <Select value={cryptoForm.asset} onValueChange={(v) => setCryptoForm({...cryptoForm, asset: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BTC">BTC - Bitcoin</SelectItem>
                          <SelectItem value="ETH">ETH - Ethereum</SelectItem>
                          <SelectItem value="SOL">SOL - Solana</SelectItem>
                          <SelectItem value="XRP">XRP - Ripple</SelectItem>
                          <SelectItem value="ADA">ADA - Cardano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Investment Amount</Label>
                      <Input
                        type="number"
                        value={cryptoForm.amount}
                        onChange={(e) => setCryptoForm({...cryptoForm, amount: Number(e.target.value)})}
                        data-testid="crypto-amount-input"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Conservative Scenario: {cryptoForm.expected_return_conservative}% p.a.</Label>
                      </div>
                      <Slider
                        value={[cryptoForm.expected_return_conservative]}
                        onValueChange={([v]) => setCryptoForm({...cryptoForm, expected_return_conservative: v})}
                        min={-10} max={20} step={1}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Moderate Scenario: {cryptoForm.expected_return_moderate}% p.a.</Label>
                      </div>
                      <Slider
                        value={[cryptoForm.expected_return_moderate]}
                        onValueChange={([v]) => setCryptoForm({...cryptoForm, expected_return_moderate: v})}
                        min={0} max={40} step={1}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Aggressive Scenario: {cryptoForm.expected_return_aggressive}% p.a.</Label>
                      </div>
                      <Slider
                        value={[cryptoForm.expected_return_aggressive]}
                        onValueChange={([v]) => setCryptoForm({...cryptoForm, expected_return_aggressive: v})}
                        min={10} max={100} step={5}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              <div className="flex gap-2">
                <Button 
                  onClick={handleModel} 
                  className="flex-1 bg-[#1a2744] hover:bg-[#1a2744]/90"
                  disabled={loading}
                  data-testid="model-btn"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Modeling...</>
                  ) : (
                    <><Calculator className="h-4 w-4 mr-2" />Model Scenario</>
                  )}
                </Button>
                <Button 
                  onClick={addToTransactionList} 
                  variant="outline"
                  className="border-[#D4A84C] text-[#D4A84C] hover:bg-[#D4A84C]/10"
                  data-testid="add-to-list-btn"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to List
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#D4A84C]" />
                Projected Outcomes
              </CardTitle>
              <CardDescription>
                {timeframe}-year projection with scenario analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure a transaction and click "Model Scenario" to see projections</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-[#D4A84C]" />
                  <p className="text-muted-foreground">Calculating projections...</p>
                </div>
              )}

              {/* Fund Result with Chart */}
              {result && result.type === "fund" && result.data.analysis && (
                <div className="space-y-6" data-testid="fund-result">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <PiggyBank className="h-4 w-4 text-[#D4A84C]" />
                      {result.data.analysis.investment_details?.fund_name || fundForm.fund_name}
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Initial:</span> <span className="font-medium">{formatCurrency(fundForm.amount)}</span></div>
                      <div><span className="text-muted-foreground">Return:</span> <span className="font-medium">{fundForm.expected_return}% p.a.</span></div>
                      <div><span className="text-muted-foreground">Fee:</span> <span className="font-medium">{fundForm.management_fee}%</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Projected Growth ({timeframe} Years)</h4>
                    <ProjectionChart 
                      projections={result.data.analysis.extended_projections} 
                      initialValue={fundForm.amount}
                      timeframe={timeframe}
                    />
                    <ValueSummaryCards 
                      projections={result.data.analysis.extended_projections}
                      timeframe={timeframe}
                      initialValue={fundForm.amount}
                    />
                  </div>
                </div>
              )}

              {/* Stock Result with Scenarios */}
              {result && result.type === "stock" && result.data.analysis && (
                <div className="space-y-6" data-testid="stock-result">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#D4A84C]" />
                      {stockForm.symbol} - {stockForm.shares} shares @ ${stockForm.price_per_share}
                    </h4>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Trade Value:</span> 
                      <span className="font-medium ml-2">{formatCurrency(result.data.analysis.initial_value)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Scenario Analysis ({timeframe} Years)</h4>
                    <ProjectionChart 
                      scenarios={result.data.analysis.scenarios} 
                      initialValue={result.data.analysis.initial_value}
                      timeframe={timeframe}
                    />
                    
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {["conservative", "moderate", "aggressive"].map(scenario => {
                        const data = result.data.analysis.scenarios[scenario]?.find(p => p.year === timeframe);
                        return (
                          <div key={scenario} className={`rounded-lg p-3 text-center ${
                            scenario === "conservative" ? "bg-gray-50" :
                            scenario === "moderate" ? "bg-blue-50" : "bg-emerald-50"
                          }`}>
                            <p className="text-xs text-muted-foreground capitalize">{scenario}</p>
                            <p className="text-lg font-bold">{data ? formatCurrency(data.value) : "-"}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ETF Result with Scenarios */}
              {result && result.type === "etf" && result.data.analysis && (
                <div className="space-y-6" data-testid="etf-result">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-[#D4A84C]" />
                      {result.data.analysis.investment_details?.etf_name}
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Initial:</span> <span className="font-medium">{formatCurrency(etfForm.amount)}</span></div>
                      <div><span className="text-muted-foreground">Return:</span> <span className="font-medium">{etfForm.expected_return}% p.a.</span></div>
                      <div><span className="text-muted-foreground">Fee:</span> <span className="font-medium">{etfForm.management_fee}%</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Scenario Analysis ({timeframe} Years)</h4>
                    <ProjectionChart 
                      scenarios={result.data.analysis.scenarios} 
                      initialValue={etfForm.amount}
                      timeframe={timeframe}
                    />
                    
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {["conservative", "moderate", "aggressive"].map(scenario => {
                        const data = result.data.analysis.scenarios[scenario]?.find(p => p.year === timeframe);
                        return (
                          <div key={scenario} className={`rounded-lg p-3 text-center ${
                            scenario === "conservative" ? "bg-gray-50" :
                            scenario === "moderate" ? "bg-blue-50" : "bg-emerald-50"
                          }`}>
                            <p className="text-xs text-muted-foreground capitalize">{scenario}</p>
                            <p className="text-lg font-bold">{data ? formatCurrency(data.value) : "-"}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Crypto Result with High Volatility Scenarios */}
              {result && result.type === "crypto" && result.data.analysis && (
                <div className="space-y-6" data-testid="crypto-result">
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Bitcoin className="h-4 w-4 text-orange-500" />
                      {result.data.analysis.investment_details?.asset} Investment
                    </h4>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Initial Investment:</span> 
                      <span className="font-medium ml-2">{formatCurrency(result.data.analysis.initial_value)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Volatility Scenarios ({timeframe} Years)</h4>
                    <ProjectionChart 
                      scenarios={result.data.analysis.scenarios} 
                      initialValue={result.data.analysis.initial_value}
                      timeframe={timeframe}
                    />
                    
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {["conservative", "moderate", "aggressive"].map(scenario => {
                        const data = result.data.analysis.scenarios[scenario]?.find(p => p.year === timeframe);
                        const rate = scenario === "conservative" ? cryptoForm.expected_return_conservative :
                                    scenario === "moderate" ? cryptoForm.expected_return_moderate : 
                                    cryptoForm.expected_return_aggressive;
                        return (
                          <div key={scenario} className={`rounded-lg p-3 text-center ${
                            scenario === "conservative" ? "bg-gray-50" :
                            scenario === "moderate" ? "bg-blue-50" : "bg-emerald-50"
                          }`}>
                            <p className="text-xs text-muted-foreground capitalize">{scenario} ({rate}% p.a.)</p>
                            <p className="text-lg font-bold">{data ? formatCurrency(data.value) : "-"}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Property Result */}
              {result && result.type === "property" && result.data.analysis && (
                <div className="space-y-6" data-testid="property-result">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#D4A84C]" />
                      Upfront Costs
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>Deposit ({result.data.analysis.purchase_costs.deposit_percent}%)</span>
                      <span className="text-right font-medium">{formatCurrency(result.data.analysis.purchase_costs.deposit)}</span>
                      <span>Stamp Duty</span>
                      <span className="text-right font-medium">{formatCurrency(result.data.analysis.purchase_costs.stamp_duty)}</span>
                      <span>Legal & Other</span>
                      <span className="text-right font-medium">{formatCurrency(result.data.analysis.purchase_costs.legal_fees + result.data.analysis.purchase_costs.other_costs)}</span>
                      <Separator className="col-span-2 my-1" />
                      <span className="font-semibold">Total Cash Required</span>
                      <span className="text-right font-bold text-[#1a2744]">{formatCurrency(result.data.analysis.purchase_costs.total_upfront_cost)}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-[#D4A84C]" />
                      Annual Cash Flow
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>Rental Income</span>
                      <span className="text-right font-medium text-emerald-600">+{formatCurrency(result.data.analysis.cash_flow.annual_rental_income)}</span>
                      <span>Loan Repayments</span>
                      <span className="text-right font-medium text-red-600">-{formatCurrency(result.data.analysis.cash_flow.annual_loan_payment)}</span>
                      <Separator className="col-span-2 my-1" />
                      <span className="font-semibold">Net Cash Flow</span>
                      <span className={`text-right font-bold ${result.data.analysis.cash_flow.net_annual_cashflow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatCurrency(result.data.analysis.cash_flow.net_annual_cashflow)}
                      </span>
                    </div>
                    <Badge 
                      variant={result.data.analysis.cash_flow.is_positively_geared ? "default" : "secondary"}
                      className="mt-3"
                    >
                      {result.data.analysis.cash_flow.is_positively_geared ? "Positively Geared" : "Negatively Geared"}
                    </Badge>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-800">
                      <Target className="h-4 w-4" />
                      {timeframe}-Year Projection
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-emerald-700">Capital Growth</span>
                      <span className="text-right font-medium text-emerald-800">{formatCurrency(result.data.analysis.summary["10_year_capital_growth"] * (timeframe / 10))}</span>
                      <span className="text-emerald-700">Rental Income</span>
                      <span className="text-right font-medium text-emerald-800">{formatCurrency(result.data.analysis.summary["10_year_rental_income"] * (timeframe / 10))}</span>
                      <Separator className="col-span-2 my-1" />
                      <span className="font-semibold text-emerald-700">Total Return</span>
                      <span className="text-right font-bold text-emerald-800">{formatCurrency(result.data.analysis.summary["10_year_total_return"] * (timeframe / 10))}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TransactionModeler;
