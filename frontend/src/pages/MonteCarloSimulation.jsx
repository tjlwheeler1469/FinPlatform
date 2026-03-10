import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Percent,
  Calculator,
  Target,
  AlertTriangle
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
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

const MonteCarloSimulation = () => {
  const [initialValue, setInitialValue] = useState(100000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [volatility, setVolatility] = useState(15);
  const [years, setYears] = useState(10);
  const [simulations, setSimulations] = useState(1000);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/monte-carlo`, null, {
        params: {
          initial_value: initialValue,
          expected_return: expectedReturn / 100,
          volatility: volatility / 100,
          years: years,
          simulations: simulations
        }
      });
      setResult(response.data);
      toast.success("Simulation completed");
    } catch (error) {
      console.error("Error running simulation:", error);
      toast.error("Failed to run simulation");
    } finally {
      setLoading(false);
    }
  };

  const chartData = result?.percentile_projections 
    ? result.percentile_projections.years.map((year, i) => ({
        year: `Year ${year}`,
        yearNum: year,
        p10: result.percentile_projections.p10[i],
        p25: result.percentile_projections.p25[i],
        p50: result.percentile_projections.p50[i],
        p75: result.percentile_projections.p75[i],
        p90: result.percentile_projections.p90[i]
      }))
    : [];

  const presets = [
    { name: "Conservative", return: 5, volatility: 8 },
    { name: "Balanced", return: 7, volatility: 12 },
    { name: "Growth", return: 9, volatility: 18 },
    { name: "Aggressive", return: 12, volatility: 25 }
  ];

  return (
    <Layout>
      <div className="space-y-8" data-testid="monte-carlo-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
            Monte Carlo Simulation
          </h1>
          <p className="text-muted-foreground mt-1">
            Project your investment outcomes with probability distributions
          </p>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1" data-testid="simulation-inputs">
            <CardHeader>
              <CardTitle className="font-['Manrope']">Simulation Parameters</CardTitle>
              <CardDescription>
                Configure your investment scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Initial Value */}
              <div className="space-y-2">
                <Label htmlFor="initial-value">Initial Investment</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="initial-value"
                    type="number"
                    value={initialValue}
                    onChange={(e) => setInitialValue(Number(e.target.value))}
                    className="pl-10"
                    data-testid="initial-value-input"
                  />
                </div>
              </div>

              {/* Expected Return */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Expected Annual Return</Label>
                  <span className="text-sm font-semibold text-[#10B981]">{expectedReturn}%</span>
                </div>
                <Slider
                  value={[expectedReturn]}
                  onValueChange={(v) => setExpectedReturn(v[0])}
                  min={0}
                  max={20}
                  step={0.5}
                  className="py-2"
                  data-testid="expected-return-slider"
                />
              </div>

              {/* Volatility */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Volatility (Risk)</Label>
                  <span className="text-sm font-semibold text-[#D4AF37]">{volatility}%</span>
                </div>
                <Slider
                  value={[volatility]}
                  onValueChange={(v) => setVolatility(v[0])}
                  min={5}
                  max={40}
                  step={1}
                  className="py-2"
                  data-testid="volatility-slider"
                />
              </div>

              {/* Time Horizon */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Time Horizon</Label>
                  <span className="text-sm font-semibold">{years} years</span>
                </div>
                <Slider
                  value={[years]}
                  onValueChange={(v) => setYears(v[0])}
                  min={1}
                  max={30}
                  step={1}
                  className="py-2"
                  data-testid="years-slider"
                />
              </div>

              {/* Simulations */}
              <div className="space-y-2">
                <Label htmlFor="simulations">Number of Simulations</Label>
                <Input
                  id="simulations"
                  type="number"
                  value={simulations}
                  onChange={(e) => setSimulations(Number(e.target.value))}
                  max={5000}
                  data-testid="simulations-input"
                />
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExpectedReturn(preset.return);
                        setVolatility(preset.volatility);
                      }}
                      data-testid={`preset-${preset.name.toLowerCase()}`}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={runSimulation}
                className="w-full bg-[#0F392B] hover:bg-[#0F392B]/90"
                disabled={loading}
                data-testid="run-simulation-btn"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {loading ? "Running..." : "Run Simulation"}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="lg:col-span-2" data-testid="simulation-results">
            <CardHeader>
              <CardTitle className="font-['Manrope']">Projection Results</CardTitle>
              <CardDescription>
                {result ? `${result.num_simulations} simulations over ${result.simulation_years} years` : "Run a simulation to see results"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                      <p className="text-sm text-white/80">Median Outcome</p>
                      <p className="text-xl font-bold">{formatCurrency(result.final_value_median)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Mean Outcome</p>
                      <p className="text-xl font-bold">{formatCurrency(result.final_value_mean)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#10B981]/10">
                      <p className="text-sm text-muted-foreground">Best Case</p>
                      <p className="text-xl font-bold text-[#10B981]">{formatCurrency(result.best_case)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-destructive/10">
                      <p className="text-sm text-muted-foreground">Worst Case</p>
                      <p className="text-xl font-bold text-destructive">{formatCurrency(result.worst_case)}</p>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorP90" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0F392B" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#0F392B" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value) => [formatCurrency(value), '']}
                        />
                        <ReferenceLine y={initialValue} stroke="#D4AF37" strokeDasharray="5 5" />
                        <Area
                          type="monotone"
                          dataKey="p90"
                          stroke="#10B981"
                          fill="url(#colorP90)"
                          name="90th Percentile"
                        />
                        <Area
                          type="monotone"
                          dataKey="p75"
                          stroke="#10B981"
                          strokeOpacity={0.5}
                          fill="transparent"
                          name="75th Percentile"
                        />
                        <Area
                          type="monotone"
                          dataKey="p50"
                          stroke="#0F392B"
                          strokeWidth={2}
                          fill="url(#colorP50)"
                          name="Median"
                        />
                        <Area
                          type="monotone"
                          dataKey="p25"
                          stroke="#D4AF37"
                          strokeOpacity={0.5}
                          fill="transparent"
                          name="25th Percentile"
                        />
                        <Area
                          type="monotone"
                          dataKey="p10"
                          stroke="#EF4444"
                          fill="transparent"
                          name="10th Percentile"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                      <span>90th Percentile (Optimistic)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#0F392B]" />
                      <span>50th Percentile (Median)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                      <span>10th Percentile (Conservative)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-[#D4AF37]" />
                      <span>Initial Investment</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Configure parameters and run a simulation
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Risk Analysis */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="loss-probability-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    result.probability_of_loss > 20 ? 'bg-destructive/10' : 'bg-[#10B981]/10'
                  }`}>
                    {result.probability_of_loss > 20 
                      ? <AlertTriangle className="h-6 w-6 text-destructive" />
                      : <Target className="h-6 w-6 text-[#10B981]" />
                    }
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Probability of Loss</p>
                    <p className={`text-2xl font-bold ${
                      result.probability_of_loss > 20 ? 'text-destructive' : 'text-[#10B981]'
                    }`}>
                      {result.probability_of_loss.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="double-probability-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Probability to Double</p>
                    <p className="text-2xl font-bold text-[#D4AF37]">
                      {result.probability_double.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="volatility-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Percent className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Standard Deviation</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(result.final_value_std)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Explanation */}
        <Card data-testid="explanation-card">
          <CardHeader>
            <CardTitle className="font-['Manrope']">Understanding Monte Carlo Simulations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">What is Monte Carlo?</h4>
                <p>
                  Monte Carlo simulation uses random sampling to model the probability of different 
                  outcomes. By running thousands of scenarios with varying market returns, we can 
                  understand the range of possible investment outcomes.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">How to Interpret Results</h4>
                <p>
                  The median (50th percentile) represents the most likely outcome. The 10th-90th 
                  percentile range shows where 80% of outcomes fall. A wider spread indicates 
                  higher volatility and risk.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MonteCarloSimulation;
