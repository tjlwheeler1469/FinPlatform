import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import {
  DollarSign, Clock, TrendingDown, Calculator, PiggyBank, Users,
  FileCheck, Shield, BarChart3, ArrowDown, CheckCircle2, Zap, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CostReductionDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [roiResult, setRoiResult] = useState(null);
  
  // ROI Calculator inputs
  const [roiInputs, setRoiInputs] = useState({
    num_advisers: 10,
    files_per_month: 50,
    compliance_checks_per_month: 200,
    audits_per_year: 2,
    current_breach_rate_percent: 5
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboard, live] = await Promise.all([
        fetch(`${API_URL}/api/cost-reduction/dashboard`).then(r => r.json()),
        fetch(`${API_URL}/api/cost-reduction/metrics/live`).then(r => r.json())
      ]);
      setDashboardData(dashboard);
      setLiveMetrics(live);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const calculateROI = async () => {
    try {
      const result = await fetch(`${API_URL}/api/cost-reduction/roi-calculator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roiInputs)
      }).then(r => r.json());
      setRoiResult(result);
      setActiveTab('roi');
    } catch (error) {
      console.error('ROI calculation failed:', error);
    }
  };

  const seedDemoData = async () => {
    try {
      await fetch(`${API_URL}/api/cost-reduction/demo/seed-data`, { method: 'POST' });
      loadData();
    } catch (error) {
      console.error('Failed to seed data:', error);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const breakdownChartData = dashboardData?.breakdown_by_type ? 
    Object.entries(dashboardData.breakdown_by_type).map(([key, value]) => ({
      name: key.replace('_', ' '),
      cost_saved: value.cost_saved,
      time_saved: value.time_saved,
      count: value.count
    })) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="cost-reduction-dashboard">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingDown className="h-7 w-7 text-green-600" />
              Cost Reduction Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Track ROI, efficiency gains, and cost savings from AdviceOS implementation
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={seedDemoData} data-testid="seed-data-btn">
              <RefreshCw className="h-4 w-4 mr-2" />
              Seed Demo Data
            </Button>
            <Button onClick={() => setActiveTab('calculator')} data-testid="calculator-btn">
              <Calculator className="h-4 w-4 mr-2" />
              ROI Calculator
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-700">
                    AUD ${Math.round(dashboardData.summary.yearly_cost_saved_aud).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">Annual Cost Savings</div>
                </div>
                <DollarSign className="h-10 w-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-700">
                    {Math.round(dashboardData.summary.yearly_time_saved_hours)}h
                  </div>
                  <div className="text-sm text-blue-600">Hours Saved Annually</div>
                </div>
                <Clock className="h-10 w-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-700">
                    {dashboardData.summary.equivalent_fte_saved}
                  </div>
                  <div className="text-sm text-purple-600">FTE Equivalent Saved</div>
                </div>
                <Users className="h-10 w-10 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-orange-700">
                    {dashboardData.compliance_efficiency.compliance_check_time_reduction_percent}%
                  </div>
                  <div className="text-sm text-orange-600">Compliance Time Reduction</div>
                </div>
                <Zap className="h-10 w-10 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Metrics Banner */}
      {liveMetrics && (
        <Alert className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <Zap className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800">Live Efficiency Metrics</AlertTitle>
          <AlertDescription className="text-emerald-700">
            <div className="flex gap-8 mt-2">
              <span><strong>Today:</strong> {liveMetrics.today.time_saved_hours}h saved | AUD ${liveMetrics.today.cost_saved_aud.toLocaleString()} saved</span>
              <span><strong>This Week:</strong> {liveMetrics.this_week.time_saved_hours}h saved | AUD ${liveMetrics.this_week.cost_saved_aud.toLocaleString()} saved</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview" data-testid="overview-tab">Overview</TabsTrigger>
          <TabsTrigger value="breakdown" data-testid="breakdown-tab">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="calculator" data-testid="calculator-tab">ROI Calculator</TabsTrigger>
          <TabsTrigger value="roi" data-testid="roi-tab">ROI Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Efficiency Gains */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-green-600" />
                  Compliance Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium">Files Auto-Approved (Monthly)</div>
                      <div className="text-sm text-gray-500">Automated compliance checks</div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData?.compliance_efficiency.files_auto_approved_monthly || 0}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium">Breaches Prevented (Yearly)</div>
                      <div className="text-sm text-gray-500">Early detection & prevention</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardData?.compliance_efficiency.breaches_prevented_yearly || 0}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <div className="font-medium">Breach Cost Avoided</div>
                      <div className="text-sm text-gray-500">Remediation costs saved</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      AUD ${(dashboardData?.compliance_efficiency.breach_cost_avoided_aud || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Readiness */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Audit Readiness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                    <div>
                      <div className="font-medium">Audit Prep Time Reduction</div>
                      <div className="text-sm text-gray-500">From 40 hours to 8 hours</div>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {dashboardData?.audit_readiness.audit_prep_time_reduction_percent || 0}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div>
                      <div className="font-medium">Instant Evidence Export</div>
                      <div className="text-sm text-gray-500">ASIC-ready documentation</div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                    <div>
                      <div className="font-medium">Documentation Score</div>
                      <div className="text-sm text-gray-500">Compliance documentation quality</div>
                    </div>
                    <div className="text-2xl font-bold text-teal-600">
                      {dashboardData?.audit_readiness.compliance_documentation_score || 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adviser Productivity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Adviser Productivity Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                    <div className="text-4xl font-bold text-purple-600">
                      {dashboardData?.adviser_productivity.time_saved_per_adviser_monthly_hours || 0}h
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Hours Saved Per Adviser Monthly</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-600">
                      +{dashboardData?.adviser_productivity.additional_client_capacity_percent || 0}%
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Additional Client Capacity</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-4xl font-bold text-green-600">
                      AUD ${Math.round((dashboardData?.summary.monthly_cost_saved_aud || 0)).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Monthly Cost Savings</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Savings by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={breakdownChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="cost_saved" fill="#10b981" name="Cost Saved" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Savings by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={breakdownChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value} hours`} />
                    <Bar dataKey="time_saved" fill="#3b82f6" name="Hours Saved" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                ROI Calculator
              </CardTitle>
              <CardDescription>
                Calculate your potential return on investment with AdviceOS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <Label>Number of Advisers: {roiInputs.num_advisers}</Label>
                    <Slider
                      value={[roiInputs.num_advisers]}
                      onValueChange={([v]) => setRoiInputs({ ...roiInputs, num_advisers: v })}
                      max={100}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Files Reviewed Per Month: {roiInputs.files_per_month}</Label>
                    <Slider
                      value={[roiInputs.files_per_month]}
                      onValueChange={([v]) => setRoiInputs({ ...roiInputs, files_per_month: v })}
                      max={500}
                      min={10}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Compliance Checks Per Month: {roiInputs.compliance_checks_per_month}</Label>
                    <Slider
                      value={[roiInputs.compliance_checks_per_month]}
                      onValueChange={([v]) => setRoiInputs({ ...roiInputs, compliance_checks_per_month: v })}
                      max={1000}
                      min={50}
                      step={50}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Audits Per Year: {roiInputs.audits_per_year}</Label>
                    <Slider
                      value={[roiInputs.audits_per_year]}
                      onValueChange={([v]) => setRoiInputs({ ...roiInputs, audits_per_year: v })}
                      max={12}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Current Breach Rate: {roiInputs.current_breach_rate_percent}%</Label>
                    <Slider
                      value={[roiInputs.current_breach_rate_percent]}
                      onValueChange={([v]) => setRoiInputs({ ...roiInputs, current_breach_rate_percent: v })}
                      max={20}
                      min={0}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Your Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Advisers:</span>
                      <span className="font-medium">{roiInputs.num_advisers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Files:</span>
                      <span className="font-medium">{roiInputs.files_per_month}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Compliance Checks:</span>
                      <span className="font-medium">{roiInputs.compliance_checks_per_month}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Audits:</span>
                      <span className="font-medium">{roiInputs.audits_per_year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Breach Rate:</span>
                      <span className="font-medium">{roiInputs.current_breach_rate_percent}%</span>
                    </div>
                  </div>
                  <Button className="w-full mt-6" onClick={calculateROI} data-testid="calculate-roi-btn">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate ROI
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi">
          {roiResult ? (
            <div className="space-y-6">
              {/* Headline Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold">{roiResult.savings.headline}</div>
                    <div className="text-green-100 mt-2">Annual Cost Savings</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold">{roiResult.savings.time_headline}</div>
                    <div className="text-blue-100 mt-2">Time Savings</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold">{roiResult.savings.breach_headline}</div>
                    <div className="text-purple-100 mt-2">Breaches Prevented</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Current Costs (Manual)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span>File Review</span>
                        <span className="font-medium">AUD ${roiResult.current_costs_annual.file_review.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span>Compliance Checks</span>
                        <span className="font-medium">AUD ${roiResult.current_costs_annual.compliance_checks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span>Audit Preparation</span>
                        <span className="font-medium">AUD ${roiResult.current_costs_annual.audit_preparation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span>Breach Remediation</span>
                        <span className="font-medium">AUD ${roiResult.current_costs_annual.breach_remediation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-red-100 rounded font-bold text-red-700">
                        <span>Total Annual Cost</span>
                        <span>AUD ${roiResult.current_costs_annual.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">With AdviceOS (Automated)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>File Review</span>
                        <span className="font-medium">AUD ${roiResult.with_adviceos_annual.file_review.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Compliance Checks</span>
                        <span className="font-medium">AUD ${roiResult.with_adviceos_annual.compliance_checks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Audit Preparation</span>
                        <span className="font-medium">AUD ${roiResult.with_adviceos_annual.audit_preparation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Breach Remediation (70% reduced)</span>
                        <span className="font-medium">AUD ${roiResult.with_adviceos_annual.breach_remediation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-green-100 rounded font-bold text-green-700">
                        <span>Total Annual Cost</span>
                        <span>AUD ${roiResult.with_adviceos_annual.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ROI Summary */}
              <Card className="border-2 border-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-6 w-6 text-green-600" />
                    ROI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        AUD ${roiResult.savings.annual_cost_savings_aud.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Annual Savings</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {roiResult.savings.annual_time_savings_hours}h
                      </div>
                      <div className="text-sm text-gray-600">Hours Saved</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">
                        {roiResult.savings.fte_equivalent_saved}
                      </div>
                      <div className="text-sm text-gray-600">FTE Equivalent</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">
                        {roiResult.savings.roi_percent}%
                      </div>
                      <div className="text-sm text-gray-600">ROI</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Use the ROI Calculator to generate results
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
