import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { 
  Database, 
  Link, 
  Shield, 
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Globe,
  Building,
  FileText,
  Zap,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const DataAggregators = () => {
  const [aggregators, setAggregators] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [cdrRequirements, setCdrRequirements] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUseCase, setSelectedUseCase] = useState('wealth_management');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aggRes, cdrRes, roadmapRes] = await Promise.all([
        fetch(`${API_URL}/api/data-aggregators/options`),
        fetch(`${API_URL}/api/data-aggregators/cdr-requirements`),
        fetch(`${API_URL}/api/data-aggregators/implementation-roadmap`)
      ]);
      
      if (aggRes.ok) {
        const data = await aggRes.json();
        setAggregators(data.aggregators || []);
      }
      if (cdrRes.ok) {
        const data = await cdrRes.json();
        setCdrRequirements(data);
      }
      if (roadmapRes.ok) {
        const data = await roadmapRes.json();
        setRoadmap(data);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendation = async (useCase) => {
    try {
      const res = await fetch(`${API_URL}/api/data-aggregators/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_case: useCase })
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendation(data);
        setSelectedUseCase(useCase);
      }
    } catch (err) {
      toast.error('Failed to get recommendation');
    }
  };

  const getEffortColor = (effort) => {
    switch (effort) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Low-Medium': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-[#1a2744]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="data-aggregators-page">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744]">Australian Data Aggregators</h1>
            <p className="text-muted-foreground">
              CDR-compliant data providers for real portfolio integration
            </p>
          </div>
          <Badge className="bg-[#1a2744]">
            <Shield className="h-3 w-3 mr-1" />
            Research Phase
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Database className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{aggregators.length}</p>
                  <p className="text-xs text-muted-foreground">CDR Providers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">100+</p>
                  <p className="text-xs text-muted-foreground">Banks Supported</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4B+</p>
                  <p className="text-xs text-muted-foreground">CDR Requests (2025)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">8-12</p>
                  <p className="text-xs text-muted-foreground">Weeks to Integrate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
            <TabsTrigger value="cdr">CDR Requirements</TabsTrigger>
            <TabsTrigger value="roadmap">Implementation Roadmap</TabsTrigger>
          </TabsList>

          {/* Providers */}
          <TabsContent value="providers" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {aggregators.map((agg) => (
                <Card key={agg.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{agg.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {agg.description}
                        </CardDescription>
                      </div>
                      {agg.cdr_accredited && (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          CDR
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Supported Banks</span>
                        <span className="font-medium">{agg.supported_banks}+</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Integration Effort</span>
                        <Badge className={getEffortColor(agg.integration_effort)}>
                          {agg.integration_effort}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Sandbox Available</span>
                        {agg.sandbox_available ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => window.open(`${API_URL}/api/data-aggregators/options/${agg.id}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        View Full Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recommendation */}
          <TabsContent value="recommendation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Get Recommendation</CardTitle>
                <CardDescription>
                  Select your primary use case to get a tailored recommendation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['wealth_management', 'financial_planning', 'compliance_verification', 'client_portal'].map((uc) => (
                    <Button
                      key={uc}
                      variant={selectedUseCase === uc ? 'default' : 'outline'}
                      onClick={() => getRecommendation(uc)}
                      className={selectedUseCase === uc ? 'bg-[#1a2744]' : ''}
                    >
                      {uc.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Button>
                  ))}
                </div>

                {recommendation && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Primary */}
                      <Card className="border-2 border-[#1a2744]">
                        <CardHeader className="pb-2">
                          <Badge className="w-fit bg-[#1a2744] mb-2">Primary Recommendation</Badge>
                          <CardTitle>{recommendation.recommendation.primary.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">
                            {recommendation.recommendation.primary.reason}
                          </p>
                          <div className="text-sm">
                            <p className="font-medium mb-1">Key Features:</p>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {recommendation.recommendation.primary.features?.slice(0, 4).map((f, i) => (
                                <li key={`item-${i}`}>{f}</li>
                              ))}
                            </ul>
                          </div>
                          <p className="text-sm mt-3">
                            <span className="font-medium">Time to Integrate:</span>{' '}
                            {recommendation.recommendation.primary.time_to_integrate}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Secondary */}
                      <Card>
                        <CardHeader className="pb-2">
                          <Badge variant="secondary" className="w-fit mb-2">Secondary Option</Badge>
                          <CardTitle>{recommendation.recommendation.secondary.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">
                            {recommendation.recommendation.secondary.reason}
                          </p>
                          <div className="text-sm">
                            <p className="font-medium mb-1">Key Features:</p>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {recommendation.recommendation.secondary.features?.slice(0, 4).map((f, i) => (
                                <li key={`item-${i}`}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Integration Steps */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Integration Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-2">
                          {recommendation.integration_steps?.map((step, i) => (
                            <li key={`item-${i}`} className="flex items-start gap-2 text-sm">
                              <span className="flex-shrink-0 w-6 h-6 bg-[#1a2744] text-white rounded-full flex items-center justify-center text-xs">
                                {i + 1}
                              </span>
                              <span className="text-muted-foreground">{step.replace(/^\d+\.\s*/, '')}</span>
                            </li>
                          ))}
                        </ol>
                        <p className="text-sm mt-4 p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">Estimated Timeline:</span>{' '}
                          {recommendation.estimated_timeline}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CDR Requirements */}
          <TabsContent value="cdr" className="space-y-4">
            {cdrRequirements && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Consumer Data Right (CDR)
                    </CardTitle>
                    <CardDescription>{cdrRequirements.overview}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {cdrRequirements.key_statistics?.data_requests_2025}
                        </p>
                        <p className="text-xs text-muted-foreground">Data Requests (2025)</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {cdrRequirements.key_statistics?.active_users_goal_2030}
                        </p>
                        <p className="text-xs text-muted-foreground">User Goal (2030)</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {cdrRequirements.key_statistics?.projected_productivity_gains}
                        </p>
                        <p className="text-xs text-muted-foreground">Productivity Gains</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Participation Paths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {cdrRequirements.participation_paths?.map((path, i) => (
                        <div key={`item-${i}`} className="p-4 border rounded-lg">
                          <h4 className="font-semibold text-[#1a2744] mb-2">{path.path}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{path.description}</p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-green-600">Pros:</p>
                              <ul className="text-xs text-muted-foreground">
                                {path.pros.map((p, j) => <li key={j}>• {p}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-red-600">Cons:</p>
                              <ul className="text-xs text-muted-foreground">
                                {path.cons.map((c, j) => <li key={j}>• {c}</li>)}
                              </ul>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Cost: {path.cost}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Data Available via CDR</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {cdrRequirements.data_available?.map((item, i) => (
                          <li key={`item-${i}`} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Security Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {cdrRequirements.security_requirements?.map((item, i) => (
                          <li key={`item-${i}`} className="flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4 text-blue-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {cdrRequirements.resources && Object.entries(cdrRequirements.resources).map(([key, url]) => (
                        <Button 
                          key={key}
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <Globe className="h-3 w-3 mr-2" />
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Roadmap */}
          <TabsContent value="roadmap" className="space-y-4">
            {roadmap && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{roadmap.title}</CardTitle>
                    <CardDescription>
                      Current: {roadmap.current_state} → Target: {roadmap.target_state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {roadmap.phases?.map((phase, i) => (
                        <div key={`item-${i}`} className="relative">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#1a2744] text-white rounded-full flex items-center justify-center font-bold">
                              {phase.phase}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-[#1a2744]">{phase.name}</h4>
                                <Badge variant="outline">{phase.duration}</Badge>
                              </div>
                              <ul className="space-y-1 mb-3">
                                {phase.tasks.map((task, j) => (
                                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                    {task}
                                  </li>
                                ))}
                              </ul>
                              {phase.recommendation && (
                                <p className="text-sm p-2 bg-yellow-50 rounded text-yellow-800">
                                  Recommendation: {phase.recommendation}
                                </p>
                              )}
                              {phase.technical && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs font-medium mb-2">Technical Changes:</p>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div>
                                      <p className="font-medium">Backend:</p>
                                      <ul>
                                        {phase.technical.backend_changes?.map((c, k) => (
                                          <li key={k}>• {c}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <p className="font-medium">Frontend:</p>
                                      <ul>
                                        {phase.technical.frontend_changes?.map((c, k) => (
                                          <li key={k}>• {c}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {i < roadmap.phases.length - 1 && (
                            <div className="absolute left-5 top-12 w-0.5 h-full bg-gray-200"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Timeline & Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Time</span>
                          <span className="font-medium">{roadmap.total_estimated_time}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Development Cost</span>
                          <span className="font-medium">{roadmap.budget_estimate?.development}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Provider Fees</span>
                          <span className="font-medium">{roadmap.budget_estimate?.provider_fees}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Compliance</span>
                          <span className="font-medium">{roadmap.budget_estimate?.compliance}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2">
                        {roadmap.next_steps?.map((step, i) => (
                          <li key={`item-${i}`} className="flex items-start gap-2 text-sm">
                            <span className="flex-shrink-0 w-5 h-5 bg-[#1a2744] text-white rounded-full flex items-center justify-center text-xs">
                              {i + 1}
                            </span>
                            <span className="text-muted-foreground">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DataAggregators;
