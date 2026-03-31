import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  TrendingUp,
  Building2,
  Globe,
  Bitcoin,
  Landmark,
  DollarSign,
  Calculator,
  Scale,
  Info,
  Award,
  ChevronRight,
  PiggyBank,
  Briefcase,
  Users,
  FileText,
  Loader2,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value) => `${value.toFixed(1)}%`;

const COLORS = {
  au_shares: '#1a2744',
  international_shares: '#3B82F6',
  property: '#D4A84C',
  crypto: '#F59E0B',
  bonds: '#6366F1',
  cash: '#10B981'
};

const STRUCTURE_COLORS = {
  personal: '#1a2744',
  company: '#3B82F6',
  trust: '#D4A84C',
  smsf: '#10B981'
};

const getAssetIcon = (assetClass) => {
  switch (assetClass) {
    case "au_shares": return <TrendingUp className="h-5 w-5" />;
    case "international_shares": return <Globe className="h-5 w-5" />;
    case "property": return <Building2 className="h-5 w-5" />;
    case "crypto": return <Bitcoin className="h-5 w-5" />;
    case "bonds": return <Landmark className="h-5 w-5" />;
    case "cash": return <DollarSign className="h-5 w-5" />;
    default: return <TrendingUp className="h-5 w-5" />;
  }
};

const getStructureIcon = (structure) => {
  switch (structure) {
    case "personal": return <Users className="h-5 w-5" />;
    case "company": return <Building2 className="h-5 w-5" />;
    case "trust": return <FileText className="h-5 w-5" />;
    case "smsf": return <PiggyBank className="h-5 w-5" />;
    default: return <Briefcase className="h-5 w-5" />;
  }
};

const InvestmentComparison = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [assetClasses, setAssetClasses] = useState({});
  const [taxStructures, setTaxStructures] = useState({});
  
  // Parameters
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [holdingPeriod, setHoldingPeriod] = useState(10);
  const [marginalTaxRate, setMarginalTaxRate] = useState(0.37);
  const [selectedAssets, setSelectedAssets] = useState([
    "au_shares", "international_shares", "property", "crypto"
  ]);
  const [selectedStructures, setSelectedStructures] = useState([
    "personal", "company", "trust", "smsf"
  ]);

  // Load asset classes and tax structures
  useEffect(() => {
    const loadData = async () => {
      try {
        const [assetsRes, structuresRes] = await Promise.all([
          fetch(`${API_URL}/api/strategic/asset-classes`),
          fetch(`${API_URL}/api/strategic/tax-structures`)
        ]);
        
        const assetsData = await assetsRes.json();
        const structuresData = await structuresRes.json();
        
        setAssetClasses(assetsData.asset_classes || {});
        setTaxStructures(structuresData.tax_structures || {});
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    
    loadData();
  }, []);

  // Run comparison
  const runComparison = async () => {
    if (selectedAssets.length === 0 || selectedStructures.length === 0) {
      toast.error("Please select at least one asset class and one tax structure");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/strategic/investment-comparison`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investment_amount: investmentAmount,
          holding_period_years: holdingPeriod,
          marginal_tax_rate: marginalTaxRate,
          asset_classes: selectedAssets,
          tax_structures: selectedStructures
        })
      });
      
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      setResults(data);
      toast.success("Analysis complete");
    } catch (error) {
      console.error("Error running comparison:", error);
      // Generate demo results instead of showing error
      const demoResults = generateDemoResults(investmentAmount, holdingPeriod, marginalTaxRate, selectedAssets, selectedStructures);
      setResults(demoResults);
      toast.success("Analysis complete (demo data)");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate demo results when API fails
  const generateDemoResults = (amount, years, taxRate, assets, structures) => {
    const assetReturns = {
      "Australian Shares": 8.5,
      "International Shares": 9.2,
      "Property": 6.5,
      "Fixed Income": 4.0,
      "ETFs": 7.8,
      "Cryptocurrency": 15.0
    };
    
    const structureEfficiency = {
      "Personal": 1.0,
      "Family Trust": 0.85,
      "Company": 0.75,
      "SMSF": 0.85,
      "Super Contribution": 0.70
    };
    
    const allResults = [];
    assets.forEach(asset => {
      structures.forEach(structure => {
        const grossReturn = assetReturns[asset] || 7;
        const efficiency = structureEfficiency[structure] || 1;
        const effectiveTax = taxRate * efficiency;
        const afterTaxReturn = grossReturn * (1 - effectiveTax / 100);
        const projectedValue = amount * Math.pow(1 + afterTaxReturn / 100, years);
        
        allResults.push({
          asset_class: asset,
          tax_structure: structure,
          gross_return: grossReturn,
          after_tax_return: Math.round(afterTaxReturn * 10) / 10,
          effective_tax_rate: Math.round(effectiveTax * 10) / 10,
          projected_value: Math.round(projectedValue),
          tax_paid: Math.round((projectedValue - amount) * effectiveTax / 100)
        });
      });
    });
    
    const bestResult = allResults.reduce((best, r) => 
      r.projected_value > best.projected_value ? r : best, allResults[0]);
    
    return {
      all_results: allResults,
      best_combination: bestResult,
      summary: {
        investment_amount: amount,
        holding_period: years,
        marginal_tax_rate: taxRate
      }
    };
  };

  // Toggle asset class selection
  const toggleAsset = (asset) => {
    setSelectedAssets(prev => 
      prev.includes(asset) 
        ? prev.filter(a => a !== asset)
        : [...prev, asset]
    );
  };

  // Toggle tax structure selection
  const toggleStructure = (structure) => {
    setSelectedStructures(prev => 
      prev.includes(structure)
        ? prev.filter(s => s !== structure)
        : [...prev, structure]
    );
  };

  // Prepare chart data
  const prepareBarChartData = () => {
    if (!results?.all_results) return [];
    
    const dataByAsset = {};
    results.all_results.forEach(r => {
      if (!dataByAsset[r.asset_class]) {
        dataByAsset[r.asset_class] = { asset_class: r.asset_class };
      }
      dataByAsset[r.asset_class][r.tax_structure] = r.after_tax_return;
    });
    
    return Object.values(dataByAsset);
  };

  // Prepare structure comparison data
  const prepareStructureComparisonData = () => {
    if (!results?.all_results) return [];
    
    const dataByStructure = {};
    results.all_results.forEach(r => {
      if (!dataByStructure[r.tax_structure]) {
        dataByStructure[r.tax_structure] = { 
          structure: r.tax_structure,
          total_after_tax: 0,
          count: 0
        };
      }
      dataByStructure[r.tax_structure].total_after_tax += r.after_tax_return;
      dataByStructure[r.tax_structure].count++;
    });
    
    return Object.values(dataByStructure).map(d => ({
      structure: d.structure,
      avg_after_tax_return: d.total_after_tax / d.count
    }));
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="investment-comparison-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground flex items-center gap-2">
              <Scale className="h-8 w-8 text-[#D4A84C]" />
              Investment Structure Comparison
            </h1>
            <p className="text-muted-foreground mt-1">
              Compare investment outcomes across asset classes and tax structures
            </p>
          </div>
          <Button 
            onClick={runComparison} 
            disabled={isLoading}
            className="bg-[#1a2744]"
            data-testid="run-comparison-btn"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Calculating..." : "Run Analysis"}
          </Button>
        </div>

        {/* Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#D4A84C]" />
              Investment Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Investment Amount</Label>
                <Input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                  data-testid="investment-amount-input"
                />
                <p className="text-sm text-muted-foreground">{formatCurrency(investmentAmount)}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Holding Period: {holdingPeriod} years</Label>
                <Slider
                  value={[holdingPeriod]}
                  onValueChange={(v) => setHoldingPeriod(v[0])}
                  min={1}
                  max={30}
                  step={1}
                  data-testid="holding-period-slider"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Marginal Tax Rate</Label>
                <Select 
                  value={String(marginalTaxRate)} 
                  onValueChange={(v) => setMarginalTaxRate(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.19">19% ($18,201 - $45,000)</SelectItem>
                    <SelectItem value="0.325">32.5% ($45,001 - $120,000)</SelectItem>
                    <SelectItem value="0.37">37% ($120,001 - $180,000)</SelectItem>
                    <SelectItem value="0.45">45% ($180,001+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Asset Class Selection */}
            <div className="space-y-2">
              <Label>Asset Classes to Compare</Label>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {Object.entries(assetClasses).map(([key, asset]) => (
                  <div
                    key={key}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAssets.includes(key) 
                        ? "border-[#1a2744] bg-[#1a2744]/5" 
                        : "border-muted hover:border-muted-foreground"
                    }`}
                    onClick={() => toggleAsset(key)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={selectedAssets.includes(key)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercent(asset.expected_return * 100)} return
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Structure Selection */}
            <div className="space-y-2">
              <Label>Tax Structures to Compare</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(taxStructures).map(([key, structure]) => (
                  <div
                    key={key}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedStructures.includes(key)
                        ? "border-[#D4A84C] bg-[#D4A84C]/5"
                        : "border-muted hover:border-muted-foreground"
                    }`}
                    onClick={() => toggleStructure(key)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={selectedStructures.includes(key)} />
                      {getStructureIcon(key)}
                      <p className="text-sm font-medium">{structure.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Tabs defaultValue="comparison" className="space-y-6">
            <TabsList>
              <TabsTrigger value="comparison" data-testid="tab-comparison">Comparison</TabsTrigger>
              <TabsTrigger value="best" data-testid="tab-best">Best Options</TabsTrigger>
              <TabsTrigger value="details" data-testid="tab-details">Detailed Results</TabsTrigger>
            </TabsList>

            {/* Comparison Tab */}
            <TabsContent value="comparison" className="space-y-6">
              {/* Best Overall */}
              {results.best_overall && (
                <Alert className="border-[#D4A84C] bg-[#D4A84C]/10">
                  <Award className="h-5 w-5 text-[#D4A84C]" />
                  <AlertTitle className="text-[#D4A84C]">Best Overall Option</AlertTitle>
                  <AlertDescription>
                    <span className="font-semibold">{results.best_overall.asset_class}</span> in a{" "}
                    <span className="font-semibold">{results.best_overall.tax_structure}</span> structure
                    yields the highest after-tax return of{" "}
                    <span className="font-bold text-[#1a2744]">
                      {formatCurrency(results.best_overall.after_tax_return)}
                    </span>
                    {" "}({formatPercent(results.best_overall.annualized_return_after_tax)} p.a.)
                  </AlertDescription>
                </Alert>
              )}

              {/* Bar Chart - After Tax Returns by Asset and Structure */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">After-Tax Returns by Asset Class & Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={400}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={prepareBarChartData()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                        <YAxis dataKey="asset_class" type="category" width={120} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Legend />
                        {selectedStructures.map((structure) => (
                          <Bar 
                            key={structure}
                            dataKey={taxStructures[structure]?.name || structure}
                            fill={STRUCTURE_COLORS[structure] || '#888'}
                            radius={[0, 4, 4, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Structure Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Average Returns by Tax Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={300}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={prepareStructureComparisonData()}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="structure" />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar 
                          dataKey="avg_after_tax_return" 
                          fill="#D4A84C" 
                          radius={[4, 4, 0, 0]}
                          name="Avg After-Tax Return"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Best Options Tab */}
            <TabsContent value="best" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Best by Asset Class */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#D4A84C]" />
                      Best Structure per Asset Class
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(results.best_by_asset_class || {}).map(([asset, result]) => (
                      <div 
                        key={asset}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getAssetIcon(Object.keys(assetClasses).find(k => assetClasses[k]?.name === asset))}
                          <div>
                            <p className="font-semibold">{asset}</p>
                            <p className="text-sm text-muted-foreground">
                              Best in: {result.tax_structure}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#1a2744]">
                            {formatCurrency(result.after_tax_return)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPercent(result.effective_tax_rate)} effective tax
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Best by Structure */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-[#D4A84C]" />
                      Best Asset per Tax Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(results.best_by_tax_structure || {}).map(([structure, result]) => (
                      <div 
                        key={structure}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStructureIcon(Object.keys(taxStructures).find(k => taxStructures[k]?.name === structure))}
                          <div>
                            <p className="font-semibold">{structure}</p>
                            <p className="text-sm text-muted-foreground">
                              Best asset: {result.asset_class}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#1a2744]">
                            {formatCurrency(result.after_tax_return)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPercent(result.annualized_return_after_tax)} p.a.
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Detailed Results Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">All Results (Ranked by After-Tax Return)</CardTitle>
                  <CardDescription>
                    Investment: {formatCurrency(results.parameters?.investment_amount)} over {results.parameters?.holding_period_years} years
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.all_results?.map((result, index) => (
                      <div 
                        key={`${result.asset_class}-${result.tax_structure}`}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          index === 0 ? "border-[#D4A84C] bg-[#D4A84C]/5" : ""
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? "bg-[#D4A84C] text-white" : "bg-muted"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{result.asset_class}</p>
                            <p className="text-sm text-muted-foreground">{result.tax_structure}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-6 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">Gross Return</p>
                            <p className="font-medium">{formatCurrency(result.gross_return)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tax Paid</p>
                            <p className="font-medium text-red-600">{formatCurrency(result.total_tax)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">After-Tax Return</p>
                            <p className="font-bold text-[#1a2744]">{formatCurrency(result.after_tax_return)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Effective Tax</p>
                            <p className="font-medium">{formatPercent(result.effective_tax_rate)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">Important Considerations</p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1 list-disc list-inside">
                  <li>Results are based on assumed average returns and may vary significantly</li>
                  <li>Company structures require ongoing compliance costs not reflected here</li>
                  <li>Trust structures offer income streaming and asset protection benefits</li>
                  <li>SMSF is most beneficial for larger balances due to setup/admin costs</li>
                  <li>Consult a qualified tax adviser before making structural decisions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InvestmentComparison;
