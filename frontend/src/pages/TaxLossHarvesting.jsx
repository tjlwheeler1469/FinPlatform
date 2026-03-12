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
  TrendingDown,
  TrendingUp,
  DollarSign,
  Calculator,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Scissors
} from "lucide-react";
import { usePortfolio } from "@/App";
import axios from "axios";
import { toast } from "sonner";
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
  Cell
} from "recharts";

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

// Demo holdings based on portfolio
const DEMO_HOLDINGS = [
  { symbol: "CBA", name: "Commonwealth Bank", purchase_price: 98.50, current_price: 115.20, quantity: 200, purchase_date: "2023-03-15", asset_type: "shares" },
  { symbol: "BHP", name: "BHP Group", purchase_price: 48.20, current_price: 42.80, quantity: 500, purchase_date: "2023-06-20", asset_type: "shares" },
  { symbol: "CSL", name: "CSL Limited", purchase_price: 295.00, current_price: 278.50, quantity: 50, purchase_date: "2024-01-10", asset_type: "shares" },
  { symbol: "VAS", name: "Vanguard Aus Shares ETF", purchase_price: 92.00, current_price: 98.40, quantity: 300, purchase_date: "2022-08-01", asset_type: "etf" },
  { symbol: "WBC", name: "Westpac Banking", purchase_price: 24.80, current_price: 21.50, quantity: 800, purchase_date: "2024-02-15", asset_type: "shares" },
  { symbol: "VGS", name: "Vanguard Intl Shares ETF", purchase_price: 108.50, current_price: 102.30, quantity: 150, purchase_date: "2023-11-20", asset_type: "etf" }
];

const COLORS = ['#EF4444', '#10B981', '#D4A84C', '#3B82F6'];

const TaxLossHarvesting = () => {
  const { portfolio } = usePortfolio();
  const [activeTab, setActiveTab] = useState("portfolio");
  const [holdings, setHoldings] = useState(DEMO_HOLDINGS);
  const [manualHoldings, setManualHoldings] = useState([]);
  const [realizedGains, setRealizedGains] = useState(15000);
  const [marginalRate, setMarginalRate] = useState(37);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Tax Loss Harvesting | WealthOptimizer AU";
  }, []);

  const addManualHolding = () => {
    setManualHoldings([
      ...manualHoldings,
      {
        symbol: "",
        name: "",
        purchase_price: 0,
        current_price: 0,
        quantity: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        asset_type: "shares"
      }
    ]);
  };

  const removeManualHolding = (index) => {
    setManualHoldings(manualHoldings.filter((_, i) => i !== index));
  };

  const updateManualHolding = (index, field, value) => {
    const updated = [...manualHoldings];
    updated[index] = { ...updated[index], [field]: value };
    setManualHoldings(updated);
  };

  const analyzeHarvesting = async () => {
    setLoading(true);
    const holdingsToAnalyze = activeTab === "portfolio" ? holdings : manualHoldings;
    
    if (holdingsToAnalyze.length === 0) {
      toast.error("Please add holdings to analyze");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API}/analyze/tax-loss-harvesting`, {
        holdings: holdingsToAnalyze,
        realized_gains: realizedGains,
        marginal_tax_rate: marginalRate / 100
      });
      setResult(response.data);
      toast.success("Analysis complete");
    } catch (error) {
      console.error("Error analyzing:", error);
      toast.error("Failed to analyze holdings");
    } finally {
      setLoading(false);
    }
  };

  const pieData = result ? [
    { name: "Unrealized Gains", value: result.summary.total_unrealized_gains, color: "#10B981" },
    { name: "Unrealized Losses", value: result.summary.total_unrealized_losses, color: "#EF4444" }
  ].filter(d => d.value > 0) : [];

  return (
    <Layout>
      <div className="space-y-8" data-testid="tax-loss-harvesting-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold  text-foreground">
            Tax Loss Harvesting
          </h1>
          <p className="text-muted-foreground mt-1">
            Identify opportunities to offset capital gains by harvesting losses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <Card className="lg:col-span-1" data-testid="harvesting-inputs">
            <CardHeader>
              <CardTitle className="">Analysis Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Realized Gains */}
              <div className="space-y-2">
                <Label>Realized Gains (This FY)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={realizedGains}
                    onChange={(e) => setRealizedGains(Number(e.target.value))}
                    className="pl-10"
                    data-testid="realized-gains-input"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Capital gains already realized this financial year</p>
              </div>

              {/* Marginal Rate */}
              <div className="space-y-2">
                <Label>Marginal Tax Rate</Label>
                <Select value={marginalRate.toString()} onValueChange={(v) => setMarginalRate(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16">16% ($18,201 - $45,000)</SelectItem>
                    <SelectItem value="30">30% ($45,001 - $135,000)</SelectItem>
                    <SelectItem value="37">37% ($135,001 - $190,000)</SelectItem>
                    <SelectItem value="45">45% ($190,001+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Source Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="portfolio">Demo Portfolio</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>

                <TabsContent value="portfolio" className="mt-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">{holdings.length} holdings loaded</p>
                    <ul className="space-y-1">
                      {holdings.slice(0, 4).map(h => (
                        <li key={h.symbol} className="flex justify-between">
                          <span>{h.symbol}</span>
                          <span className={h.current_price > h.purchase_price ? 'text-[#10B981]' : 'text-destructive'}>
                            {((h.current_price - h.purchase_price) / h.purchase_price * 100).toFixed(1)}%
                          </span>
                        </li>
                      ))}
                      {holdings.length > 4 && <li>+{holdings.length - 4} more...</li>}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="mt-4 space-y-3">
                  <Button variant="outline" size="sm" onClick={addManualHolding} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Holding
                  </Button>
                  
                  {manualHoldings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No holdings added yet
                    </p>
                  )}
                  
                  {manualHoldings.map((h, idx) => (
                    <div key={idx} className="p-3 rounded-lg border space-y-2">
                      <div className="flex justify-between items-center">
                        <Input
                          placeholder="Symbol"
                          value={h.symbol}
                          onChange={(e) => updateManualHolding(idx, 'symbol', e.target.value)}
                          className="w-20"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeManualHolding(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Company Name"
                        value={h.name}
                        onChange={(e) => updateManualHolding(idx, 'name', e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Buy Price"
                          value={h.purchase_price || ''}
                          onChange={(e) => updateManualHolding(idx, 'purchase_price', Number(e.target.value))}
                        />
                        <Input
                          type="number"
                          placeholder="Current Price"
                          value={h.current_price || ''}
                          onChange={(e) => updateManualHolding(idx, 'current_price', Number(e.target.value))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Quantity"
                          value={h.quantity || ''}
                          onChange={(e) => updateManualHolding(idx, 'quantity', Number(e.target.value))}
                        />
                        <Input
                          type="date"
                          value={h.purchase_date}
                          onChange={(e) => updateManualHolding(idx, 'purchase_date', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              <Button 
                onClick={analyzeHarvesting}
                className="w-full bg-[#1a2744] hover:bg-[#1a2744]/90"
                disabled={loading}
                data-testid="analyze-btn"
              >
                <Scissors className="h-4 w-4 mr-2" />
                Analyze Opportunities
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-[#1a2744] text-white">
                    <CardContent className="p-4">
                      <p className="text-sm text-white/80">Potential Tax Savings</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(result.summary.potential_tax_savings)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Harvestable Losses</p>
                      <p className="text-xl font-bold text-destructive">
                        {formatCurrency(result.summary.total_unrealized_losses)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Unrealized Gains</p>
                      <p className="text-xl font-bold text-[#10B981]">
                        {formatCurrency(result.summary.total_unrealized_gains)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Realized Gains YTD</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(result.summary.realized_gains_ytd)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gains vs Losses Pie */}
                  <Card data-testid="gains-losses-chart">
                    <CardHeader>
                      <CardTitle className="">Unrealized Position</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-4 mt-2">
                        {pieData.map(item => (
                          <div key={item.name} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tax Impact */}
                  <Card data-testid="tax-impact">
                    <CardHeader>
                      <CardTitle className="">Tax Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">Before Harvesting</p>
                          <p className="text-lg font-bold">
                            Tax on {formatCurrency(result.summary.realized_gains_ytd)} gains
                          </p>
                          <p className="text-destructive font-semibold">
                            ~{formatCurrency(result.summary.realized_gains_ytd * 0.5 * (marginalRate/100))} (with CGT discount)
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#10B981]/10">
                          <p className="text-sm text-muted-foreground">After Harvesting</p>
                          <p className="text-lg font-bold">
                            Tax on {formatCurrency(result.summary.net_gains_after_harvest)} net gains
                          </p>
                          <p className="text-[#10B981] font-semibold">
                            ~{formatCurrency(result.summary.tax_on_net_gains)} (with CGT discount)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Opportunities Table */}
                {result.opportunities.length > 0 && (
                  <Card data-testid="opportunities-table">
                    <CardHeader>
                      <CardTitle className=" flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-[#D4A84C]" />
                        Harvesting Opportunities
                      </CardTitle>
                      <CardDescription>Holdings with unrealized losses to consider selling</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-semibold">Holding</th>
                              <th className="text-right p-3 font-semibold">Cost Basis</th>
                              <th className="text-right p-3 font-semibold">Current Value</th>
                              <th className="text-right p-3 font-semibold">Loss</th>
                              <th className="text-right p-3 font-semibold">Tax Benefit</th>
                              <th className="text-center p-3 font-semibold">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.opportunities.map((opp, i) => (
                              <tr key={i} className="border-b">
                                <td className="p-3">
                                  <div className="font-medium">{opp.symbol}</div>
                                  <div className="text-xs text-muted-foreground">{opp.name}</div>
                                </td>
                                <td className="text-right p-3">{formatCurrency(opp.cost_basis)}</td>
                                <td className="text-right p-3">{formatCurrency(opp.current_value)}</td>
                                <td className="text-right p-3">
                                  <span className="text-destructive font-medium">
                                    -{formatCurrency(opp.unrealized_loss)}
                                  </span>
                                  <div className="text-xs text-muted-foreground">{opp.gain_loss_pct}%</div>
                                </td>
                                <td className="text-right p-3 text-[#10B981] font-medium">
                                  {formatCurrency(opp.tax_benefit)}
                                </td>
                                <td className="text-center p-3">
                                  <Badge className="bg-[#D4A84C]/10 text-[#D4A84C]">
                                    Harvest
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Wash Sale Warning */}
                <Card className="border-[#D4A84C]">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-[#D4A84C] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[#D4A84C]">Wash Sale Rule</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          If you sell a security at a loss and buy the same or a "substantially identical" 
                          security within 30 days before or after the sale, the ATO may disallow the loss for 
                          tax purposes. Wait at least 30 days before repurchasing.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card data-testid="recommendations">
                  <CardHeader>
                    <CardTitle className=" flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-[#D4A84C]" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-[400px]">
                <CardContent className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Scissors className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Analyze Your Holdings</p>
                    <p className="text-muted-foreground">
                      Select holdings and click analyze to find tax loss harvesting opportunities
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TaxLossHarvesting;
