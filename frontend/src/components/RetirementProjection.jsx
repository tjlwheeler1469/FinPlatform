import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, TrendingUp, DollarSign, Percent, Clock, 
  AlertTriangle, CheckCircle, Info, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fmt = (v) => {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

const RetirementProjection = ({ clientId }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const [inputs, setInputs] = useState({
    client_id: clientId,
    total_portfolio: 1500000, super_balance: 400000, property_value: 850000,
    cash_savings: 50000, other_assets: 0,
    annual_income: 180000, annual_expenses: 90000, annual_savings: 50000,
    current_age: 45, retirement_age: 65, life_expectancy: 90,
    inflation_rate: 3.0, expected_yield: 7.0, super_return: 8.0,
    marginal_tax_rate: 37.0, cgt_rate: 23.5, annual_cgt_liability: 5000,
    annual_tax_deductions: 15000,
    drawdown_strategy: "constant", simulations: 1000, volatility: 12.0,
  });

  const update = (field, value) => setInputs(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (clientId) loadExisting();
  }, [clientId]);

  const loadExisting = async () => {
    try {
      const res = await axios.get(`${API}/retirement-projection/${clientId}`);
      if (res.data.has_projection) {
        setResult(res.data);
        if (res.data.inputs) setInputs(prev => ({ ...prev, ...res.data.inputs }));
      }
    } catch { /* no existing */ }
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/retirement-projection/calculate`, { ...inputs, client_id: clientId });
      setResult(res.data);
      toast.success("Projection calculated");
    } catch { toast.error("Calculation failed"); }
    setLoading(false);
  };

  const totalAssets = inputs.total_portfolio + inputs.super_balance + inputs.property_value + inputs.cash_savings + inputs.other_assets;

  const InputGroup = ({ label, icon: Icon, children }) => (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </h4>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">{children}</div>
    </div>
  );

  const NumInput = ({ label, field, prefix = "$", step = 1000 }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step={step}
        value={inputs[field]}
        onChange={e => update(field, parseFloat(e.target.value) || 0)}
        className="text-sm"
        data-testid={`proj-${field}`}
      />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="retirement-projection">
      {/* Consolidated Portfolio Summary */}
      <Card className="bg-gradient-to-r from-[#1a2744] to-[#2a3d5e] text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70">Consolidated Portfolio</p>
              <p className="text-2xl font-bold">{fmt(totalAssets)}</p>
            </div>
            <div className="grid grid-cols-5 gap-3 text-center">
              {[
                { label: "Portfolio", value: inputs.total_portfolio },
                { label: "Super", value: inputs.super_balance },
                { label: "Property", value: inputs.property_value },
                { label: "Cash", value: inputs.cash_savings },
                { label: "Other", value: inputs.other_assets },
              ].map(a => (
                <div key={a.label}>
                  <p className="text-xs text-white/60">{a.label}</p>
                  <p className="text-sm font-semibold">{fmt(a.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Parameters */}
      <Card>
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Projection Inputs
            </CardTitle>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expanded && (
          <CardContent className="space-y-4">
            <InputGroup label="Assets" icon={DollarSign}>
              <NumInput label="Investment Portfolio" field="total_portfolio" />
              <NumInput label="Super Balance" field="super_balance" />
              <NumInput label="Property Value" field="property_value" />
              <NumInput label="Cash Savings" field="cash_savings" />
              <NumInput label="Other Assets" field="other_assets" />
            </InputGroup>

            <InputGroup label="Income & Expenses" icon={TrendingUp}>
              <NumInput label="Annual Income" field="annual_income" />
              <NumInput label="Annual Expenses" field="annual_expenses" />
              <NumInput label="Annual Savings" field="annual_savings" />
            </InputGroup>

            <InputGroup label="Timeline" icon={Clock}>
              <NumInput label="Current Age" field="current_age" step={1} />
              <NumInput label="Retirement Age" field="retirement_age" step={1} />
              <NumInput label="Life Expectancy" field="life_expectancy" step={1} />
            </InputGroup>

            <InputGroup label="Rates & Returns" icon={Percent}>
              <NumInput label="Inflation (%)" field="inflation_rate" step={0.5} />
              <NumInput label="Expected Yield (%)" field="expected_yield" step={0.5} />
              <NumInput label="Super Return (%)" field="super_return" step={0.5} />
              <NumInput label="Volatility (%)" field="volatility" step={1} />
            </InputGroup>

            <InputGroup label="Tax" icon={Calculator}>
              <NumInput label="Marginal Tax Rate (%)" field="marginal_tax_rate" step={1} />
              <NumInput label="CGT Rate (%)" field="cgt_rate" step={0.5} />
              <NumInput label="Annual CGT Liability" field="annual_cgt_liability" />
              <NumInput label="Tax Deductions" field="annual_tax_deductions" />
            </InputGroup>
          </CardContent>
        )}
      </Card>

      {/* Calculate Button */}
      <Button onClick={calculate} disabled={loading} className="w-full bg-[#1a2744]" data-testid="calculate-projection-btn">
        {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
        Calculate Retirement Projection
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className={result.monte_carlo.success_rate >= 80 ? "border-green-200" : result.monte_carlo.success_rate >= 60 ? "border-amber-200" : "border-red-200"}>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Success Rate</p>
                <p className={`text-2xl font-bold ${result.monte_carlo.success_rate >= 80 ? "text-green-600" : result.monte_carlo.success_rate >= 60 ? "text-amber-600" : "text-red-600"}`}>
                  {result.monte_carlo.success_rate}%
                </p>
                <p className="text-xs text-muted-foreground">{result.monte_carlo.simulations} simulations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Median Outcome</p>
                <p className="text-2xl font-bold text-blue-600">{fmt(result.monte_carlo.percentiles.p50_median)}</p>
                <p className="text-xs text-muted-foreground">at age {inputs.life_expectancy}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Depletion Risk</p>
                <p className={`text-2xl font-bold ${result.monte_carlo.depletion_risk > 30 ? "text-red-600" : "text-green-600"}`}>
                  {result.monte_carlo.depletion_risk}%
                </p>
                <p className="text-xs text-muted-foreground">{result.monte_carlo.avg_depletion_age ? `avg age ${result.monte_carlo.avg_depletion_age}` : "none"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Net Tax Impact</p>
                <p className={`text-2xl font-bold ${result.tax_summary.net_tax_impact >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {result.tax_summary.net_tax_impact >= 0 ? "+" : ""}{fmt(Math.abs(result.tax_summary.net_tax_impact))}
                </p>
                <p className="text-xs text-muted-foreground">lifetime savings - CGT</p>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Timeline Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Portfolio Projection Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={0}>
                <AreaChart data={result.deterministic.timeline.filter((_, i) => i % 1 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(v)} labelFormatter={(l) => `Age ${l}`} />
                  <Area type="monotone" dataKey="portfolio" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Portfolio" />
                  <Area type="monotone" dataKey="super" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Super" />
                  <Area type="monotone" dataKey="property" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Property" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monte Carlo Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Outcome Distribution (Monte Carlo)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 text-center">
                {[
                  { label: "Pessimistic (10th)", value: result.monte_carlo.percentiles.p10, color: "#ef4444" },
                  { label: "Conservative (25th)", value: result.monte_carlo.percentiles.p25, color: "#f59e0b" },
                  { label: "Median (50th)", value: result.monte_carlo.percentiles.p50_median, color: "#3b82f6" },
                  { label: "Optimistic (75th)", value: result.monte_carlo.percentiles.p75, color: "#22c55e" },
                  { label: "Best Case (90th)", value: result.monte_carlo.percentiles.p90, color: "#10b981" },
                ].map(p => (
                  <div key={p.label} className="p-2 rounded-lg border">
                    <p className="text-[10px] text-muted-foreground">{p.label}</p>
                    <p className="text-sm font-bold" style={{ color: p.color }}>{fmt(p.value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                    rec.type === "warning" ? "bg-red-50 text-red-700" :
                    rec.type === "positive" ? "bg-green-50 text-green-700" :
                    "bg-blue-50 text-blue-700"
                  }`}>
                    {rec.type === "warning" ? <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" /> :
                     rec.type === "positive" ? <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> :
                     <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <span>{rec.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tax Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lifetime Tax Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="p-2 bg-green-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Tax Savings</p>
                  <p className="font-bold text-green-600">{fmt(result.tax_summary.total_tax_savings)}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">CGT Liability</p>
                  <p className="font-bold text-red-600">{fmt(result.tax_summary.total_cgt_lifetime)}</p>
                </div>
                <div className={`p-2 rounded-lg ${result.tax_summary.net_tax_impact >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                  <p className="text-xs text-muted-foreground">Net Impact</p>
                  <p className={`font-bold ${result.tax_summary.net_tax_impact >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {result.tax_summary.net_tax_impact >= 0 ? "+" : ""}{fmt(Math.abs(result.tax_summary.net_tax_impact))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RetirementProjection;
