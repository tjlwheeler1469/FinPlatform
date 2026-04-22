import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import FloatingActionRail from '@/components/platform/FloatingActionRail';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Gauge, TrendingUp, TrendingDown, Shield, AlertTriangle, Zap, Brain,
  RefreshCw, Target, Clock, DollarSign, Users, Eye, ChevronRight,
  CheckCircle2, XCircle, ArrowUp, ArrowDown, Flame, AlertCircle,
  Lightbulb, Calendar, Bell, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ==================== MOCK DATA FOR DAILY BRIEFING ====================

const mockClients = [
  {
    id: 'client_1',
    name: 'Thompson Family',
    type: 'Family',
    aum: 1608800,
    confidence: 84,
    previousConfidence: 86,
    trend: 'declining',
    risks: ['High spending', 'Early retirement goal'],
    strengths: ['Good diversification', 'Stable income'],
    topAction: 'Delay retirement by 2 years',
    actionImpact: '+13%',
    lastReview: '2025-06-15',
    nextReview: '2026-01-15',
  },
  {
    id: 'client_2',
    name: 'Chen Investment Trust',
    type: 'Trust',
    aum: 5200000,
    confidence: 62,
    previousConfidence: 65,
    trend: 'declining',
    risks: ['Concentration in property', 'Longevity risk'],
    strengths: ['High savings rate'],
    topAction: 'Diversify into bonds',
    actionImpact: '+8%',
    lastReview: '2025-09-01',
    nextReview: '2026-03-01',
  },
  {
    id: 'client_3',
    name: 'Patel Holdings',
    type: 'Company',
    aum: 8100000,
    confidence: 91,
    previousConfidence: 89,
    trend: 'improving',
    risks: [],
    strengths: ['Excellent diversification', 'Low spending ratio', 'Strong income'],
    topAction: 'Consider legacy planning',
    actionImpact: 'N/A',
    lastReview: '2025-11-01',
    nextReview: '2026-05-01',
  },
  {
    id: 'client_4',
    name: 'Thompson',
    type: 'Individual',
    aum: 1200000,
    confidence: 45,
    previousConfidence: 52,
    trend: 'declining',
    risks: ['Insufficient savings', 'High essential spending', 'No pension income'],
    strengths: [],
    topAction: 'Increase contributions by $30k/year',
    actionImpact: '+18%',
    lastReview: '2025-10-15',
    nextReview: '2026-01-15',
  },
  {
    id: 'client_5',
    name: 'Garcia Family',
    type: 'Family',
    aum: 1800000,
    confidence: 71,
    previousConfidence: 70,
    trend: 'stable',
    risks: ['Market volatility exposure'],
    strengths: ['Flexible spending', 'Good runway'],
    topAction: 'Reduce equity allocation by 10%',
    actionImpact: '+5%',
    lastReview: '2025-12-01',
    nextReview: '2026-06-01',
  },
];

// ==================== HELPER FUNCTIONS ====================

const getConfidenceColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};

const getConfidenceLabel = (score) => {
  if (score >= 80) return 'On Track';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'At Risk';
  return 'Critical';
};

const getTrendIcon = (trend) => {
  switch (trend) {
    case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
    default: return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

// ==================== CLIENT CARD COMPONENT ====================

const ClientCard = ({ client, priority }) => {
  const priorityColors = {
    critical: 'border-red-500 bg-red-50',
    warning: 'border-amber-500 bg-amber-50',
    opportunity: 'border-green-500 bg-green-50',
    stable: 'border-gray-200 bg-white',
  };

  return (
    <Card className={`border-l-4 ${priorityColors[priority] || priorityColors.stable}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{client.name}</h4>
              <Badge variant="outline" className="text-xs">{client.type}</Badge>
              {getTrendIcon(client.trend)}
            </div>
            
            <div className="flex items-center gap-4 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-2xl font-bold" style={{ color: getConfidenceColor(client.confidence) }}>
                  {client.confidence}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">AUM</p>
                <p className="text-lg font-semibold">{formatCurrency(client.aum)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Change</p>
                <p className={`text-lg font-semibold ${client.confidence > client.previousConfidence ? 'text-green-600' : client.confidence < client.previousConfidence ? 'text-red-600' : 'text-gray-600'}`}>
                  {client.confidence > client.previousConfidence ? '+' : ''}{client.confidence - client.previousConfidence}%
                </p>
              </div>
            </div>

            {/* Key Risks */}
            {client.risks.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Key Risks:</p>
                <div className="flex flex-wrap gap-1">
                  {client.risks.slice(0, 3).map((risk, i) => (
                    <Badge key={`item-${i}`} variant="destructive" className="text-xs">{risk}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Top Action */}
            {client.topAction && (
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{client.topAction}</span>
                  <Badge className="bg-green-500 text-xs">{client.actionImpact}</Badge>
                </div>
              </div>
            )}
          </div>

          <Link to={`/client-360`} onClick={() => {
            localStorage.setItem('selected_client', JSON.stringify({
              id: client.id,
              name: client.name,
              aum: client.aum
            }));
            window.dispatchEvent(new CustomEvent('client-changed'));
          }}>
            <Button size="sm" variant="outline">
              View <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================

const DailyBriefing = ({ embedded = false }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Categorize clients
  const criticalClients = mockClients.filter(c => c.confidence < 50);
  const atRiskClients = mockClients.filter(c => c.confidence >= 50 && c.confidence < 70 && c.trend === 'declining');
  const opportunityClients = mockClients.filter(c => c.confidence >= 70 && c.confidence < 85);
  const stableClients = mockClients.filter(c => c.confidence >= 85);

  // Calculate summary stats
  const totalAUM = mockClients.reduce((sum, c) => sum + c.aum, 0);
  const avgConfidence = mockClients.reduce((sum, c) => sum + c.confidence, 0) / mockClients.length;
  const decliningCount = mockClients.filter(c => c.trend === 'declining').length;

  // Chart data
  const confidenceDistribution = [
    { name: 'Critical (<50%)', count: criticalClients.length, color: '#ef4444' },
    { name: 'At Risk (50-70%)', count: atRiskClients.length + mockClients.filter(c => c.confidence >= 50 && c.confidence < 70 && c.trend !== 'declining').length, color: '#f59e0b' },
    { name: 'Good (70-85%)', count: opportunityClients.length, color: '#3b82f6' },
    { name: 'On Track (85%+)', count: stableClients.length, color: '#22c55e' },
  ];

  const content = (
      <div className="space-y-6" data-testid="daily-briefing">
        {/* Header - hidden when embedded */}
        {!embedded && (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              Daily Briefing
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{mockClients.length}</p>
              <p className="text-xs text-muted-foreground">Total Clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">${(totalAUM / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">Total AUM</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Gauge className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{avgConfidence.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Avg Confidence</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{criticalClients.length + atRiskClients.length}</p>
              <p className="text-xs text-muted-foreground">Need Attention</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-center">
              <TrendingDown className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600">{decliningCount}</p>
              <p className="text-xs text-muted-foreground">Declining Trend</p>
            </CardContent>
          </Card>
        </div>

        {/* Confidence Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Client Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={confidenceDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {confidenceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different categories */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="critical" className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Critical ({criticalClients.length})
            </TabsTrigger>
            <TabsTrigger value="atrisk" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              At Risk ({atRiskClients.length})
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4 text-green-500" />
              Opportunities ({opportunityClients.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Priority Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Priority Actions Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...criticalClients, ...atRiskClients].slice(0, 4).map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.topAction}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge style={{ backgroundColor: getConfidenceColor(client.confidence), color: 'white' }}>
                            {client.confidence}%
                          </Badge>
                          <Link to="/client-360" onClick={() => {
                            localStorage.setItem('selected_client', JSON.stringify({
                              id: client.id, name: client.name, aum: client.aum
                            }));
                            window.dispatchEvent(new CustomEvent('client-changed'));
                          }}>
                            <Button size="sm" variant="ghost">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Wins */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-green-500" />
                    Quick Wins (High Impact, Easy)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockClients
                      .filter(c => c.actionImpact && c.actionImpact !== 'N/A')
                      .sort((a, b) => parseInt(b.actionImpact) - parseInt(a.actionImpact))
                      .slice(0, 4)
                      .map((client) => (
                        <div key={client.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.topAction}</p>
                          </div>
                          <Badge className="bg-green-500">{client.actionImpact}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* All Clients Summary */}
            <Card>
              <CardHeader>
                <CardTitle>All Clients Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockClients.map((client) => (
                    <ClientCard 
                      key={client.id} 
                      client={client} 
                      priority={
                        client.confidence < 50 ? 'critical' :
                        client.confidence < 70 && client.trend === 'declining' ? 'warning' :
                        client.confidence < 85 ? 'opportunity' : 'stable'
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Critical Tab */}
          <TabsContent value="critical" className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {criticalClients.length} client(s) have confidence below 50% and require immediate attention.
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              {criticalClients.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No critical clients! All clients are above 50% confidence.</p>
                  </CardContent>
                </Card>
              ) : (
                criticalClients.map((client) => (
                  <ClientCard key={client.id} client={client} priority="critical" />
                ))
              )}
            </div>
          </TabsContent>

          {/* At Risk Tab */}
          <TabsContent value="atrisk" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {atRiskClients.length} client(s) are between 50-70% confidence and declining. Monitor closely.
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              {atRiskClients.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No at-risk clients with declining trends!</p>
                  </CardContent>
                </Card>
              ) : (
                atRiskClients.map((client) => (
                  <ClientCard key={client.id} client={client} priority="warning" />
                ))
              )}
            </div>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {opportunityClients.length} client(s) have improvement opportunities that could boost their confidence.
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              {opportunityClients.map((client) => (
                <ClientCard key={client.id} client={client} priority="opportunity" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );

  return embedded ? content : <Layout>{/* FloatingActionRail hidden — user request */}{content}</Layout>;
};

export default DailyBriefing;
