import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  TrendingUp,
  Target,
  Shield,
  PiggyBank,
  Home,
  Calculator,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  DollarSign,
  Building2,
  Briefcase,
  RefreshCw,
  Info
} from "lucide-react";
import { usePortfolio } from "@/App";
import axios from "axios";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
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

const formatCompact = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return formatCurrency(value);
};

// Category icons
const CATEGORY_ICONS = {
  super: PiggyBank,
  debt: Home,
  tax: Calculator,
  savings: Target,
  property: Building2,
  investment: TrendingUp
};

const CATEGORY_COLORS = {
  super: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  debt: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  tax: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  savings: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  property: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  investment: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' }
};

const DIFFICULTY_LABELS = {
  easy: { label: 'Easy', color: 'bg-green-500' },
  medium: { label: 'Medium', color: 'bg-amber-500' },
  complex: { label: 'Complex', color: 'bg-red-500' }
};

const DecisionEngine = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { portfolio } = usePortfolio();
  const [healthScore, setHealthScore] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState(null);

  useEffect(() => {
    fetchDecisionData();
  }, [portfolio]);

  const fetchDecisionData = async () => {
    try {
      setLoading(true);
      
      const requestData = {
        age: 45,
        retirement_age: 60,
        current_income: portfolio.personal.taxableIncome,
        annual_expenses: 120000,
        total_assets: portfolio.summary.totalAssets,
        total_debt: portfolio.summary.totalDebt,
        super_balance: portfolio.investments.smsf_balance,
        emergency_fund: 75000,
        investment_portfolio: portfolio.investments.shares_value + portfolio.investments.etf_value,
        property_value: portfolio.investments.properties.reduce((sum, p) => sum + p.value, 0),
        savings_rate: 0.15,
        mortgage_rate: 6.5,
        mortgage_balance: portfolio.summary.totalDebt
      };

      const [healthRes, recsRes] = await Promise.all([
        axios.post(`${API}/decision-engine/health-score-v2`, requestData),
        axios.post(`${API}/decision-engine/recommendations-v2`, requestData)
      ]);
      
      setHealthScore(healthRes.data);
      setRecommendations(recsRes.data.recommendations);
    } catch (error) {
      console.error("Error fetching decision data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPotentialImpact = recommendations.reduce((sum, r) => sum + r.impact_primary, 0);

  const content = (
      <div className="space-y-6" data-testid="decision-engine-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Financial Decision Engine
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered recommendations to optimize your wealth
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchDecisionData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              className="bg-[#1a2744] hover:bg-[#1a2744]/90"
              onClick={() => navigate('/ai-advisor')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Deep Dive
            </Button>
          </div>
        </div>

        {/* Health Score + Total Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Health Score */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-[#D4A84C]" />
                Financial Health Score
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="70%"
                      outerRadius="100%"
                      barSize={15}
                      data={[{ value: healthScore?.score || 0, fill: '#D4A84C' }]}
                      startAngle={180}
                      endAngle={0}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold">{healthScore?.score || '--'}</span>
                    <span className="text-lg text-muted-foreground">/100</span>
                    <Badge className="mt-2 bg-[#D4A84C] text-[#1a2744]">
                      {healthScore?.grade || '--'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              {healthScore?.components && (
                <div className="space-y-3 mt-4">
                  {Object.entries(healthScore.components).map(([key, data]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={data.score * 5} className="w-20 h-2" />
                        <span className={`text-sm font-medium ${
                          data.status === 'excellent' || data.status === 'good' ? 'text-green-600' :
                          data.status === 'fair' ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          {data.status === 'excellent' || data.status === 'good' ? '✓' : 
                           data.status === 'fair' ? '⚠' : '✗'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Potential Impact */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-[#1a2744] to-[#1a2744]/80 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/70">Total Potential Impact</p>
                  <p className="text-4xl font-bold mt-2">
                    {formatCompact(totalPotentialImpact)}
                  </p>
                  <p className="text-white/70 mt-1">
                    from {recommendations.length} optimizations
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-[#D4A84C]/20 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-[#D4A84C]" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs">Retirement Boost</p>
                  <p className="text-xl font-bold text-[#D4A84C]">
                    {formatCompact(recommendations.filter(r => r.category === 'super').reduce((s, r) => s + r.impact_primary, 0))}
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs">Annual Tax Savings</p>
                  <p className="text-xl font-bold text-green-400">
                    {formatCompact(recommendations.filter(r => r.category === 'tax').reduce((s, r) => s + r.impact_primary, 0))}
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs">Debt Reduction</p>
                  <p className="text-xl font-bold text-blue-400">
                    {formatCompact(recommendations.filter(r => r.category === 'debt').reduce((s, r) => s + r.impact_primary, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Recommendations */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-[#D4A84C]" />
                Recommended Actions
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                Click to expand details
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => {
                const Icon = CATEGORY_ICONS[rec.category] || Target;
                const colors = CATEGORY_COLORS[rec.category] || CATEGORY_COLORS.investment;
                const difficulty = DIFFICULTY_LABELS[rec.difficulty] || DIFFICULTY_LABELS.medium;
                const isExpanded = selectedRec === rec.id;

                return (
                  <div 
                    key={rec.id}
                    className={`border rounded-lg overflow-hidden transition-all cursor-pointer ${colors.border} ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}
                    onClick={() => setSelectedRec(isExpanded ? null : rec.id)}
                  >
                    {/* Main Row */}
                    <div className="p-4 flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-8 h-8 rounded-full bg-[#1a2744] text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>

                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${colors.text}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{rec.title}</h3>
                          {rec.priority === 'high' && (
                            <Badge className="bg-red-500 text-white">HIGH IMPACT</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{rec.description}</p>
                      </div>

                      {/* Impact */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          +{formatCompact(rec.impact_primary)}
                        </p>
                        <p className="text-xs text-muted-foreground">{rec.impact_label}</p>
                      </div>

                      {/* Chevron */}
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                          {/* Action */}
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              What To Do
                            </h4>
                            <p className="text-sm bg-background p-3 rounded-lg border">
                              {rec.action}
                            </p>
                            
                            <div className="flex items-center gap-4 mt-4">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{rec.timeframe}</span>
                              </div>
                              <Badge className={difficulty.color}>{difficulty.label}</Badge>
                            </div>
                          </div>

                          {/* Additional Impact */}
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Additional Benefits</h4>
                            <div className="space-y-2">
                              <div className="bg-background p-3 rounded-lg border">
                                <p className="text-xs text-muted-foreground">{rec.impact_secondary_label}</p>
                                <p className="text-lg font-bold text-[#1a2744]">
                                  {formatCompact(rec.impact_secondary)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                          <Button variant="outline" size="sm">
                            Learn More
                          </Button>
                          <Button size="sm" className="bg-[#1a2744] hover:bg-[#1a2744]/90">
                            Take Action
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <Card className="bg-gradient-to-r from-[#1a2744]/5 to-[#D4A84C]/10 border-[#D4A84C]/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#D4A84C]/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-[#D4A84C]" />
                </div>
                <div>
                  <h3 className="font-semibold">Want personalized advice?</h3>
                  <p className="text-sm text-muted-foreground">
                    Get AI-powered analysis tailored to your specific situation
                  </p>
                </div>
              </div>
              <Button 
                className="bg-[#D4A84C] hover:bg-[#D4A84C]/90 text-[#1a2744]"
                onClick={() => navigate('/ai-advisor')}
              >
                Talk to AI Advisor
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default DecisionEngine;
