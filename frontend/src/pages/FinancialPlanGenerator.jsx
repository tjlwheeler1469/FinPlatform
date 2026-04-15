import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Download,
  Sparkles,
  CheckCircle,
  Target,
  Shield,
  TrendingUp,
  DollarSign,
  Calculator,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Printer,
  Clock,
  Building,
  PiggyBank,
  Briefcase,
  Heart
} from "lucide-react";
import { usePortfolio } from "@/App";
import axios from "axios";

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
  return `$${value}`;
};

const FinancialPlanGenerator = () => {
  const { portfolio } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [plan, setPlan] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [formData, setFormData] = useState({
    client_name: "Thompson Family",
    age: 45,
    retirement_age: 60,
    risk_tolerance: "moderate"
  });

  const generatePlan = async () => {
    setLoading(true);
    try {
      const requestData = {
        client_name: formData.client_name,
        age: formData.age,
        retirement_age: formData.retirement_age,
        net_worth: portfolio.summary.netWorth,
        annual_income: portfolio.personal.taxableIncome,
        annual_expenses: 120000,
        total_assets: portfolio.summary.totalAssets,
        total_debt: portfolio.summary.totalDebt,
        super_balance: portfolio.investments.smsf_balance,
        investment_portfolio: portfolio.investments.shares_value + portfolio.investments.etf_value,
        savings_rate: 0.15,
        risk_tolerance: formData.risk_tolerance,
        monte_carlo_probability: 50
      };

      const response = await axios.post(`${API}/ai/generate-financial-plan`, requestData);
      setPlan(response.data);
    } catch (error) {
      console.error("Error generating plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!plan) return;
    
    setExporting(true);
    try {
      // Prepare plan data for PDF export
      const planData = {
        client_name: formData.client_name,
        plan_id: `FP-${Date.now()}`,
        executive_summary: {
          headline: plan.executive_summary || "Your comprehensive financial plan",
          key_metrics: [
            { name: "Net Worth", current: formatCurrency(portfolio.summary.netWorth), target: formatCurrency(portfolio.summary.netWorth * 1.5) },
            { name: "Retirement Income", current: formatCurrency(80000), target: formatCurrency(120000) },
            { name: "Super Balance", current: formatCurrency(portfolio.investments.smsf_balance), target: formatCurrency(2000000) }
          ]
        },
        retirement_plan: {
          target_age: formData.retirement_age,
          success_probability: plan.retirement_success || 85,
          annual_income: 120000,
          recommendations: plan.recommendations?.slice(0, 3) || []
        },
        investment_strategy: {
          risk_profile: formData.risk_tolerance,
          time_horizon: `${formData.retirement_age - formData.age} years`,
          target_allocation: {
            australian_shares: { current: 30, target: 35, action: "Increase" },
            international_shares: { current: 25, target: 30, action: "Increase" },
            property: { current: 35, target: 25, action: "Reduce" },
            fixed_income: { current: 10, target: 10, action: "Hold" }
          }
        },
        tax_strategy: {
          effective_rate: 32,
          potential_savings: 15000,
          strategies: plan.tax_strategies || [
            { name: "Super Contributions", description: "Maximize concessional contributions to reduce taxable income" },
            { name: "Negative Gearing", description: "Review property expenses for tax deduction opportunities" }
          ]
        },
        action_items: plan.action_items || [
          { priority: "High", action: "Review superannuation contributions", timeline: "This month", impact: "Tax savings" },
          { priority: "Medium", action: "Consolidate super accounts", timeline: "Next quarter", impact: "Fee reduction" },
          { priority: "Low", action: "Update estate planning documents", timeline: "Within 6 months", impact: "Legacy protection" }
        ]
      };

      const response = await axios.post(`${API}/export/financial-plan`, planData);
      
      if (response.data.success && response.data.data) {
        // Convert base64 to blob and download
        const byteCharacters = atob(response.data.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.data.filename || 'financial_plan.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      // Fallback to print
      window.print();
    } finally {
      setExporting(false);
    }
  };

  const PriorityBadge = ({ priority }) => {
    const colors = {
      High: "bg-red-100 text-red-700",
      Medium: "bg-amber-100 text-amber-700",
      Low: "bg-green-100 text-green-700"
    };
    return <Badge variant="secondary" className={colors[priority] || colors.Medium}>{priority}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="financial-plan-generator">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">AI Financial Plan Generator</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate comprehensive financial plans in seconds, not hours
            </p>
          </div>
          {plan && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button variant="outline" onClick={exportPDF} disabled={exporting} data-testid="export-pdf-btn">
                {exporting ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" /> Export PDF</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Input Form */}
        {!plan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generate Financial Plan
              </CardTitle>
              <CardDescription>
                Enter client details to generate a comprehensive AI-powered financial plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label>Client Name</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Current Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Retirement Age</Label>
                  <Input
                    type="number"
                    value={formData.retirement_age}
                    onChange={(e) => setFormData({ ...formData, retirement_age: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Risk Tolerance</Label>
                  <Select
                    value={formData.risk_tolerance}
                    onValueChange={(v) => setFormData({ ...formData, risk_tolerance: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Current Data Summary */}
              <div className="p-4 bg-muted/50 rounded-lg mb-6">
                <p className="text-sm font-medium mb-3">Using Current Financial Data:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Net Worth</p>
                    <p className="font-semibold">{formatCurrency(portfolio.summary.netWorth)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Annual Income</p>
                    <p className="font-semibold">{formatCurrency(portfolio.personal.taxableIncome)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Assets</p>
                    <p className="font-semibold">{formatCurrency(portfolio.summary.totalAssets)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Debt</p>
                    <p className="font-semibold">{formatCurrency(portfolio.summary.totalDebt)}</p>
                  </div>
                </div>
              </div>

              <Button onClick={generatePlan} disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Comprehensive Financial Plan
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                This would typically take an advisor 5-10 hours to prepare manually
              </p>
            </CardContent>
          </Card>
        )}

        {/* Generated Plan */}
        {plan && (
          <>
            {/* Executive Summary Header */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-white/60">COMPREHENSIVE FINANCIAL PLAN</p>
                    <h2 className="text-2xl font-bold mt-1">{plan.executive_summary.headline}</h2>
                    <p className="text-sm text-white/60 mt-1">Plan ID: {plan.plan_id}</p>
                  </div>
                  <Badge className="bg-amber-500 text-slate-900">
                    {plan.executive_summary.retirement_probability}% Success Rate
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="text-center p-3 bg-white/10 rounded-lg">
                    <p className="text-3xl font-bold">{plan.executive_summary.years_to_retirement}</p>
                    <p className="text-xs text-white/60">Years to Retirement</p>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded-lg">
                    <p className="text-3xl font-bold">{formatCompact(plan.executive_summary.projected_retirement_balance)}</p>
                    <p className="text-xs text-white/60">Projected Balance</p>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded-lg">
                    <p className="text-3xl font-bold">{formatCompact(plan.executive_summary.safe_annual_income)}</p>
                    <p className="text-xs text-white/60">Annual Income</p>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded-lg">
                    <p className="text-3xl font-bold text-amber-400">{plan.executive_summary.potential_improvement}</p>
                    <p className="text-xs text-white/60">Potential Impact</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <p className="text-white/90">{plan.executive_summary.key_finding}</p>
                </div>
              </CardContent>
            </Card>

            {/* Plan Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="retirement">Retirement</TabsTrigger>
                <TabsTrigger value="investment">Investments</TabsTrigger>
                <TabsTrigger value="tax">Tax Strategy</TabsTrigger>
                <TabsTrigger value="insurance">Insurance</TabsTrigger>
                <TabsTrigger value="actions">Action Plan</TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Current Financial Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Net Worth</p>
                        <p className="text-2xl font-bold">{formatCurrency(plan.current_position.net_worth)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Income</p>
                        <p className="text-2xl font-bold">{formatCurrency(plan.current_position.annual_income)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Savings Rate</p>
                        <p className="text-2xl font-bold">{plan.current_position.savings_rate.toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Debt-to-Asset</p>
                        <p className="text-2xl font-bold">{plan.current_position.debt_to_asset_ratio.toFixed(0)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Plan Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-3xl font-bold text-primary">{plan.plan_metrics.total_recommendations}</p>
                        <p className="text-sm text-muted-foreground">Recommendations</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-3xl font-bold text-red-600">{plan.plan_metrics.high_priority_actions}</p>
                        <p className="text-sm text-muted-foreground">High Priority</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-3xl font-bold text-green-600">{formatCompact(plan.plan_metrics.potential_wealth_impact)}</p>
                        <p className="text-sm text-muted-foreground">Wealth Impact</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-3xl font-bold text-amber-600">+{plan.plan_metrics.probability_improvement}%</p>
                        <p className="text-sm text-muted-foreground">Probability Boost</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Retirement Tab */}
              <TabsContent value="retirement" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Retirement Projections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Projected Balance</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(plan.retirement_plan.projected_balance)}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Annual Income (4% rule)</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(plan.retirement_plan.projected_annual_income)}</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Gap to Target</p>
                        <p className="text-2xl font-bold text-amber-600">{formatCurrency(plan.retirement_plan.gap_to_target)}</p>
                      </div>
                    </div>

                    <h4 className="font-semibold mb-3">Recommendations</h4>
                    <div className="space-y-3">
                      {plan.retirement_plan.recommendations.map((rec, i) => (
                        <div key={`item-${i}`} className="flex items-center gap-4 p-3 border rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">{rec.action}</p>
                            <p className="text-sm text-muted-foreground">{rec.detail}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{rec.impact}</p>
                            <PriorityBadge priority={rec.priority} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Investment Tab */}
              <TabsContent value="investment" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Investment Strategy: {plan.investment_strategy.strategy_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Risk Profile</p>
                        <p className="text-xl font-bold">{plan.investment_strategy.risk_profile}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Target Growth</p>
                        <p className="text-xl font-bold">{plan.investment_strategy.target_allocation.growth}%</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Expected Return</p>
                        <p className="text-xl font-bold">{plan.investment_strategy.expected_return}%</p>
                      </div>
                    </div>

                    {plan.investment_strategy.rebalancing_required && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                          <p className="font-medium text-amber-800">Portfolio Rebalancing Required</p>
                        </div>
                        <p className="text-sm text-amber-700 mt-1">
                          Current growth allocation ({plan.investment_strategy.current_growth_percentage.toFixed(0)}%) differs from target ({plan.investment_strategy.target_allocation.growth}%)
                        </p>
                      </div>
                    )}

                    <h4 className="font-semibold mb-3">Recommendations</h4>
                    <div className="space-y-3">
                      {plan.investment_strategy.recommendations.map((rec, i) => (
                        <div key={`item-${i}`} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{rec.action}</p>
                            <p className="text-sm text-muted-foreground">{rec.detail}</p>
                          </div>
                          <PriorityBadge priority={rec.priority} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tax Tab */}
              <TabsContent value="tax" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Tax Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Marginal Rate</p>
                        <p className="text-2xl font-bold">{plan.tax_strategy.marginal_tax_rate}%</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Concessional Cap</p>
                        <p className="text-2xl font-bold">{formatCurrency(plan.tax_strategy.concessional_super_cap)}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Available Space</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(plan.tax_strategy.available_concessional_space)}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Potential Tax Savings</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(plan.tax_strategy.potential_tax_savings)}/yr</p>
                      </div>
                    </div>

                    <h4 className="font-semibold mb-3">Tax Recommendations</h4>
                    <div className="space-y-3">
                      {plan.tax_strategy.recommendations.map((rec, i) => (
                        <div key={`item-${i}`} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{rec.action}</p>
                            <p className="text-sm text-muted-foreground">{rec.detail}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{rec.impact}</p>
                            <PriorityBadge priority={rec.priority} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insurance Tab */}
              <TabsContent value="insurance" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Insurance Gap Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className={`p-4 rounded-lg ${plan.insurance_gaps.income_protection_needed ? 'bg-amber-50' : 'bg-green-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-5 w-5" />
                          <p className="font-medium">Income Protection</p>
                        </div>
                        {plan.insurance_gaps.income_protection_needed ? (
                          <p className="text-sm">Recommended: {formatCurrency(plan.insurance_gaps.income_protection_amount)}/yr</p>
                        ) : (
                          <p className="text-sm text-green-600">Adequate coverage</p>
                        )}
                      </div>
                      <div className={`p-4 rounded-lg ${plan.insurance_gaps.life_insurance_gap > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-5 w-5" />
                          <p className="font-medium">Life Insurance</p>
                        </div>
                        {plan.insurance_gaps.life_insurance_gap > 0 ? (
                          <p className="text-sm">Gap: {formatCurrency(plan.insurance_gaps.life_insurance_gap)}</p>
                        ) : (
                          <p className="text-sm text-green-600">Adequate coverage</p>
                        )}
                      </div>
                      <div className={`p-4 rounded-lg ${plan.insurance_gaps.tpd_coverage_needed ? 'bg-amber-50' : 'bg-green-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-5 w-5" />
                          <p className="font-medium">TPD Coverage</p>
                        </div>
                        {plan.insurance_gaps.tpd_coverage_needed ? (
                          <p className="text-sm">Minimum: {formatCurrency(plan.insurance_gaps.tpd_amount)}</p>
                        ) : (
                          <p className="text-sm text-green-600">Adequate coverage</p>
                        )}
                      </div>
                    </div>

                    <h4 className="font-semibold mb-3">Insurance Recommendations</h4>
                    <div className="space-y-3">
                      {plan.insurance_gaps.recommendations.map((rec, i) => (
                        <div key={`item-${i}`} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{rec.action}</p>
                            <p className="text-sm text-muted-foreground">{rec.detail}</p>
                          </div>
                          <PriorityBadge priority={rec.priority} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Action Plan Tab */}
              <TabsContent value="actions" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-500" />
                        Immediate Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {plan.action_plan.immediate_actions.map((action, i) => (
                          <div key={`item-${i}`} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                            <CheckCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-sm">{action}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        Short-Term Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {plan.action_plan.short_term_actions.map((action, i) => (
                          <div key={`item-${i}`} className="flex items-start gap-2 p-2 bg-amber-50 rounded">
                            <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-sm">{action}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        Long-Term Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {plan.action_plan.long_term_actions.map((action, i) => (
                          <div key={`item-${i}`} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <p className="text-sm">{action}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Plan Generated</p>
                        <p className="font-medium">{new Date(plan.generated_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setPlan(null)}>
                          <RefreshCw className="h-4 w-4 mr-2" /> Regenerate Plan
                        </Button>
                        <Button onClick={exportPDF}>
                          <Download className="h-4 w-4 mr-2" /> Export Full Plan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
};

export default FinancialPlanGenerator;
