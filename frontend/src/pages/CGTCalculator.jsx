import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Percent,
  Calculator,
  Calendar,
  Home,
  Building2,
  Landmark
} from "lucide-react";
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

const CGTCalculator = () => {
  const [purchasePrice, setPurchasePrice] = useState(500000);
  const [salePrice, setSalePrice] = useState(700000);
  const [holdingPeriod, setHoldingPeriod] = useState(24);
  const [marginalRate, setMarginalRate] = useState(30);
  const [entityType, setEntityType] = useState("individual");
  const [improvementCosts, setImprovementCosts] = useState(0);
  const [sellingCosts, setSellingCosts] = useState(15000);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateCGT = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/cgt`, null, {
        params: {
          purchase_price: purchasePrice,
          sale_price: salePrice,
          holding_period_months: holdingPeriod,
          marginal_tax_rate: marginalRate / 100,
          entity_type: entityType,
          improvement_costs: improvementCosts,
          selling_costs: sellingCosts
        }
      });
      setResult(response.data);
      toast.success("CGT calculated");
    } catch (error) {
      console.error("Error calculating CGT:", error);
      toast.error("Failed to calculate CGT");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8" data-testid="cgt-calculator-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
            Capital Gains Tax Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate CGT on property, shares, and other assets
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Card */}
          <Card className="lg:col-span-1" data-testid="cgt-inputs">
            <CardHeader>
              <CardTitle className="font-['Manrope']">Asset Details</CardTitle>
              <CardDescription>Enter your asset purchase and sale details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Entity Type */}
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger data-testid="entity-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual (50% discount)</SelectItem>
                    <SelectItem value="smsf">SMSF (33.33% discount)</SelectItem>
                    <SelectItem value="company">Company (No discount)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Purchase Price */}
              <div className="space-y-2">
                <Label>Purchase Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="pl-10"
                    data-testid="purchase-price-input"
                  />
                </div>
              </div>

              {/* Sale Price */}
              <div className="space-y-2">
                <Label>Sale Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="pl-10"
                    data-testid="sale-price-input"
                  />
                </div>
              </div>

              {/* Holding Period */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Holding Period</Label>
                  <span className="text-sm font-semibold">{holdingPeriod} months</span>
                </div>
                <Slider
                  value={[holdingPeriod]}
                  onValueChange={(v) => setHoldingPeriod(v[0])}
                  min={1}
                  max={120}
                  step={1}
                  data-testid="holding-period-slider"
                />
                <p className="text-xs text-muted-foreground">
                  {holdingPeriod >= 12 ? "✓ Eligible for CGT discount" : "✗ Hold 12+ months for discount"}
                </p>
              </div>

              {/* Marginal Tax Rate */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Marginal Tax Rate</Label>
                  <span className="text-sm font-semibold">{marginalRate}%</span>
                </div>
                <Slider
                  value={[marginalRate]}
                  onValueChange={(v) => setMarginalRate(v[0])}
                  min={0}
                  max={45}
                  step={1}
                  data-testid="marginal-rate-slider"
                />
              </div>

              {/* Improvement Costs */}
              <div className="space-y-2">
                <Label>Improvement Costs</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={improvementCosts}
                    onChange={(e) => setImprovementCosts(Number(e.target.value))}
                    className="pl-10"
                    placeholder="Renovations, upgrades"
                    data-testid="improvement-costs-input"
                  />
                </div>
              </div>

              {/* Selling Costs */}
              <div className="space-y-2">
                <Label>Selling Costs</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={sellingCosts}
                    onChange={(e) => setSellingCosts(Number(e.target.value))}
                    className="pl-10"
                    placeholder="Agent fees, legal"
                    data-testid="selling-costs-input"
                  />
                </div>
              </div>

              <Button 
                onClick={calculateCGT}
                className="w-full bg-[#0F392B] hover:bg-[#0F392B]/90"
                disabled={loading}
                data-testid="calculate-cgt-btn"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate CGT
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="lg:col-span-2" data-testid="cgt-results">
            <CardHeader>
              <CardTitle className="font-['Manrope']">CGT Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Key Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-lg ${result.is_loss ? 'bg-destructive/10' : 'bg-[#10B981]/10'}`}>
                      <p className="text-sm text-muted-foreground">Capital Gain/Loss</p>
                      <p className={`text-xl font-bold ${result.is_loss ? 'text-destructive' : 'text-[#10B981]'}`}>
                        {result.is_loss ? '-' : ''}{formatCurrency(Math.abs(result.capital_gain))}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Cost Base</p>
                      <p className="text-xl font-bold">{formatCurrency(result.cost_base)}</p>
                    </div>
                    {!result.is_loss && (
                      <>
                        <div className="p-4 rounded-lg bg-[#D4AF37]/10">
                          <p className="text-sm text-muted-foreground">Taxable Gain</p>
                          <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(result.taxable_gain)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                          <p className="text-sm text-white/80">CGT Payable</p>
                          <p className="text-xl font-bold">{formatCurrency(result.cgt_payable)}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Discount Info */}
                  {!result.is_loss && (
                    <div className="p-4 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">CGT Discount</p>
                          <p className="text-sm text-muted-foreground">
                            {result.discount_applied 
                              ? `${result.discount_percentage}% discount applied (held ${result.holding_period_months} months)`
                              : "No discount - hold 12+ months to qualify"
                            }
                          </p>
                        </div>
                        <Badge variant={result.discount_applied ? "default" : "secondary"}>
                          {result.discount_applied ? "Discount Applied" : "No Discount"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Calculation Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 rounded bg-muted/50">
                        <span>Sale Price</span>
                        <span className="font-semibold">{formatCurrency(result.sale_price)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-muted/50">
                        <span>Less: Purchase Price</span>
                        <span className="font-semibold text-destructive">-{formatCurrency(result.purchase_price)}</span>
                      </div>
                      {result.improvement_costs > 0 && (
                        <div className="flex justify-between p-2 rounded bg-muted/50">
                          <span>Less: Improvements</span>
                          <span className="font-semibold text-destructive">-{formatCurrency(result.improvement_costs)}</span>
                        </div>
                      )}
                      <div className="flex justify-between p-2 rounded bg-muted/50">
                        <span>Less: Selling Costs</span>
                        <span className="font-semibold text-destructive">-{formatCurrency(result.selling_costs)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded border-t pt-2">
                        <span className="font-medium">Capital Gain</span>
                        <span className={`font-bold ${result.is_loss ? 'text-destructive' : 'text-[#10B981]'}`}>
                          {formatCurrency(result.capital_gain)}
                        </span>
                      </div>
                      {!result.is_loss && result.discount_applied && (
                        <>
                          <div className="flex justify-between p-2 rounded bg-[#D4AF37]/10">
                            <span>Less: {result.discount_percentage}% Discount</span>
                            <span className="font-semibold text-[#D4AF37]">
                              -{formatCurrency(result.capital_gain - result.taxable_gain)}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 rounded border-t pt-2">
                            <span className="font-medium">Taxable Gain</span>
                            <span className="font-bold">{formatCurrency(result.taxable_gain)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Net Proceeds */}
                  {!result.is_loss && (
                    <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-white/80">Net Proceeds After CGT</p>
                          <p className="text-2xl font-bold">{formatCurrency(result.net_proceeds)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white/80">Effective CGT Rate</p>
                          <p className="text-xl font-bold">{result.effective_cgt_rate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Capital Loss Note */}
                  {result.is_loss && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="font-semibold text-blue-600">Capital Loss</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.note}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Enter asset details to calculate CGT</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CGT Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="cgt-discount-info">
            <CardHeader>
              <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
                <Home className="h-5 w-5 text-[#0F392B]" />
                Individual Discount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0F392B] mb-2">50%</div>
              <p className="text-sm text-muted-foreground">
                Individuals receive a 50% CGT discount on assets held for more than 12 months.
                This effectively halves the taxable gain.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="smsf-discount-info">
            <CardHeader>
              <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
                <Landmark className="h-5 w-5 text-[#D4AF37]" />
                SMSF Discount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#D4AF37] mb-2">33.33%</div>
              <p className="text-sm text-muted-foreground">
                SMSFs receive a 33.33% CGT discount. Combined with the 15% tax rate,
                effective CGT is approximately 10% on discounted gains.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="company-discount-info">
            <CardHeader>
              <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Company Discount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground mb-2">0%</div>
              <p className="text-sm text-muted-foreground">
                Companies do not receive any CGT discount. Full capital gains are
                taxed at the company tax rate (25-30%).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CGTCalculator;
