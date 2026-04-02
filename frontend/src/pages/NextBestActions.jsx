import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Home,
  PiggyBank,
  Briefcase,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Calculator,
  Clock,
  ChevronRight,
  Play,
  Pause,
  Settings2,
  BarChart3,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

// Mock recommendations data
const MOCK_RECOMMENDATIONS = [
  {
    id: 1,
    type: "investment",
    title: "Increase Super Contributions",
    description: "Based on your income and age, increasing super contributions could save $12,500 in tax this year.",
    icon: PiggyBank,
    priority: "high",
    impact: "high",
    category: "tax_optimization",
    defaults: { amount: 27500, timeframe: 10, return_rate: 7 },
    ranges: { amount: [5000, 50000], timeframe: [1, 30], return_rate: [4, 12] },
    projected_benefit: 125000,
    confidence: 92
  },
  {
    id: 2,
    type: "investment",
    title: "Diversify into ETFs",
    description: "Your portfolio is heavily weighted in bank stocks. Consider diversifying with broad market ETFs.",
    icon: TrendingUp,
    priority: "medium",
    impact: "medium",
    category: "diversification",
    defaults: { amount: 50000, timeframe: 5, return_rate: 8 },
    ranges: { amount: [10000, 200000], timeframe: [1, 20], return_rate: [5, 15] },
    projected_benefit: 21700,
    confidence: 85
  },
  {
    id: 3,
    type: "property",
    title: "Investment Property Opportunity",
    description: "With your borrowing capacity and cash reserves, an investment property could generate passive income.",
    icon: Home,
    priority: "medium",
    impact: "high",
    category: "wealth_building",
    defaults: { amount: 850000, timeframe: 10, return_rate: 5, rental_yield: 4 },
    ranges: { amount: [500000, 1500000], timeframe: [5, 30], return_rate: [3, 8], rental_yield: [2, 6] },
    projected_benefit: 350000,
    confidence: 78
  },
  {
    id: 4,
    type: "debt",
    title: "Accelerate Mortgage Payoff",
    description: "Increasing mortgage payments by $500/month would save $85,000 in interest over the loan term.",
    icon: Briefcase,
    priority: "low",
    impact: "medium",
    category: "debt_reduction",
    defaults: { amount: 500, timeframe: 20, return_rate: 6.5 },
    ranges: { amount: [100, 2000], timeframe: [5, 30], return_rate: [4, 10] },
    projected_benefit: 85000,
    confidence: 95
  },
  {
    id: 5,
    type: "protection",
    title: "Review Insurance Coverage",
    description: "Your life insurance may be underinsured based on your family's needs. Consider increasing coverage.",
    icon: Shield,
    priority: "medium",
    impact: "high",
    category: "risk_management",
    defaults: { amount: 1000000, timeframe: 20, return_rate: 0 },
    ranges: { amount: [500000, 3000000], timeframe: [10, 30], return_rate: [0, 0] },
    projected_benefit: 0,
    confidence: 88
  }
];

// Recommendation Card with Adjustable Controls
const RecommendationCard = ({ rec, onExecute, onModel }) => {
  const [expanded, setExpanded] = useState(false);
  const [params, setParams] = useState(rec.defaults);
  const [projectedValue, setProjectedValue] = useState(rec.projected_benefit);

  const Icon = rec.icon;

  // Recalculate projection when params change
  useEffect(() => {
    const calculateProjection = () => {
      const { amount, timeframe, return_rate } = params;
      // Simple compound growth calculation
      const futureValue = amount * Math.pow(1 + return_rate / 100, timeframe);
      const benefit = futureValue - amount;
      setProjectedValue(Math.round(benefit));
    };
    calculateProjection();
  }, [params]);

  const priorityColors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-blue-100 text-blue-800 border-blue-200"
  };

  return (
    <Card className={`transition-all ${expanded ? "ring-2 ring-[#D4A84C]" : ""}`}>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#1a2744] rounded-lg">
              <Icon className="h-5 w-5 text-[#D4A84C]" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {rec.title}
                <Badge variant="outline" className={priorityColors[rec.priority]}>
                  {rec.priority}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">{rec.description}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Projected Benefit</p>
            <p className="text-xl font-bold text-emerald-600">+{formatCurrency(projectedValue)}</p>
            <p className="text-xs text-muted-foreground">{rec.confidence}% confidence</p>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="border-t pt-4">
          <div className="space-y-6">
            {/* Amount Slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">
                  {rec.type === "debt" ? "Monthly Extra Payment" : "Investment Amount"}
                </label>
                <span className="text-sm font-bold text-[#1a2744]">{formatCurrency(params.amount)}</span>
              </div>
              <Slider
                value={[params.amount]}
                onValueChange={([v]) => setParams({ ...params, amount: v })}
                min={rec.ranges.amount[0]}
                max={rec.ranges.amount[1]}
                step={rec.ranges.amount[1] > 100000 ? 10000 : 500}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatCurrency(rec.ranges.amount[0])}</span>
                <span>{formatCurrency(rec.ranges.amount[1])}</span>
              </div>
            </div>

            {/* Timeframe Slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Time Horizon</label>
                <span className="text-sm font-bold text-[#1a2744]">{params.timeframe} years</span>
              </div>
              <Slider
                value={[params.timeframe]}
                onValueChange={([v]) => setParams({ ...params, timeframe: v })}
                min={rec.ranges.timeframe[0]}
                max={rec.ranges.timeframe[1]}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{rec.ranges.timeframe[0]} yr</span>
                <span>{rec.ranges.timeframe[1]} yrs</span>
              </div>
            </div>

            {/* Return Rate Slider (if applicable) */}
            {rec.ranges.return_rate[1] > 0 && (
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Expected Return Rate</label>
                  <span className="text-sm font-bold text-[#1a2744]">{params.return_rate}% p.a.</span>
                </div>
                <Slider
                  value={[params.return_rate]}
                  onValueChange={([v]) => setParams({ ...params, return_rate: v })}
                  min={rec.ranges.return_rate[0]}
                  max={rec.ranges.return_rate[1]}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{rec.ranges.return_rate[0]}%</span>
                  <span>{rec.ranges.return_rate[1]}%</span>
                </div>
              </div>
            )}

            {/* Rental Yield Slider (for property) */}
            {rec.ranges.rental_yield && (
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Rental Yield</label>
                  <span className="text-sm font-bold text-[#1a2744]">{params.rental_yield}% p.a.</span>
                </div>
                <Slider
                  value={[params.rental_yield]}
                  onValueChange={([v]) => setParams({ ...params, rental_yield: v })}
                  min={rec.ranges.rental_yield[0]}
                  max={rec.ranges.rental_yield[1]}
                  step={0.25}
                  className="w-full"
                />
              </div>
            )}

            <Separator />

            {/* Updated Projection */}
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700">Adjusted Projected Benefit</p>
                  <p className="text-2xl font-bold text-emerald-800">+{formatCurrency(projectedValue)}</p>
                  <p className="text-xs text-emerald-600">Over {params.timeframe} years at {params.return_rate}% p.a.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-emerald-700">Total Future Value</p>
                  <p className="text-xl font-bold text-emerald-800">
                    {formatCurrency(params.amount + projectedValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => onModel(rec, params)}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Model in Detail
              </Button>
              <Button 
                className="flex-1 bg-[#1a2744] hover:bg-[#1a2744]/90"
                onClick={() => onExecute(rec, params)}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute Action
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const NextBestActions = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client") || "client_1";
  
  const [recommendations, setRecommendations] = useState(MOCK_RECOMMENDATIONS);
  const [filter, setFilter] = useState("all");

  const selectedClient = JSON.parse(localStorage.getItem("selected_client") || "{}");
  const clientName = selectedClient.name || "Client";

  const filteredRecs = filter === "all" 
    ? recommendations 
    : recommendations.filter(r => r.priority === filter);

  const handleExecute = (rec, params) => {
    toast.success(`Action "${rec.title}" queued for execution with adjusted parameters`);
    // In production, this would create a task or initiate a workflow
  };

  const handleModel = (rec, params) => {
    // Navigate to transaction modeler with pre-filled params
    localStorage.setItem("modeler_prefill", JSON.stringify({ type: rec.type, ...params }));
    navigate(`/transaction-modeler?client=${clientId}`);
  };

  const content = (
      <div className="space-y-6" data-testid="next-best-actions">
        {/* Header */}
        {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Lightbulb className="h-7 w-7 text-[#D4A84C]" />
              Next Best Actions
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered recommendations for {clientName} - adjust parameters to see impact
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "high" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("high")}
              className={filter === "high" ? "bg-red-600" : ""}
            >
              High Priority
            </Button>
            <Button
              variant={filter === "medium" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("medium")}
              className={filter === "medium" ? "bg-amber-600" : ""}
            >
              Medium
            </Button>
            <Button
              variant={filter === "low" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("low")}
              className={filter === "low" ? "bg-blue-600" : ""}
            >
              Low
            </Button>
          </div>
        </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Recommendations</p>
                  <p className="text-2xl font-bold">{recommendations.length}</p>
                </div>
                <Zap className="h-8 w-8 text-[#D4A84C]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">
                    {recommendations.filter(r => r.priority === "high").length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Potential Benefit</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(recommendations.reduce((sum, r) => sum + r.projected_benefit, 0))}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Confidence</p>
                  <p className="text-2xl font-bold">
                    {Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recommendations</h2>
          <p className="text-sm text-muted-foreground">
            Click on a recommendation to expand and adjust parameters. Use the sliders to see how different 
            amounts, timeframes, and return rates affect the projected outcome.
          </p>
          
          {filteredRecs.map(rec => (
            <RecommendationCard 
              key={rec.id} 
              rec={rec} 
              onExecute={handleExecute}
              onModel={handleModel}
            />
          ))}
        </div>
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default NextBestActions;
