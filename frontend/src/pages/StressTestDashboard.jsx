import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Slider } from '../components/ui/slider';
import { toast } from 'sonner';
import {
  Activity, Zap, Play, Pause, Square, RefreshCw, BarChart3,
  Server, Cpu, HardDrive, Wifi, Clock, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, XCircle, Timer, Users, Database
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function StressTestDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Test configuration
  const [testConfig, setTestConfig] = useState({
    concurrent_users: 1000,
    duration_seconds: 60,
    ramp_up_seconds: 10,
    include_writes: false,
    include_notifications: true,
    include_websocket: true
  });
  
  // Test state
  const [activeTest, setActiveTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  
  // System metrics
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [capacityEstimate, setCapacityEstimate] = useState(null);
  
  // Polling interval for active test
  const [pollInterval, setPollInterval] = useState(null);

  // Load test history
  const loadTestHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stress-test/history?limit=20`);
      const data = await response.json();
      setTestHistory(data.tests || []);
    } catch (error) {
      console.error('Failed to load test history:', error);
    }
  };

  // Load system metrics
  const loadSystemMetrics = async () => {
    try {
      const [metricsRes, capacityRes] = await Promise.all([
        fetch(`${API_URL}/api/stress-test/system/metrics`),
        fetch(`${API_URL}/api/stress-test/system/capacity-estimate`)
      ]);
      
      const metrics = await metricsRes.json();
      const capacity = await capacityRes.json();
      
      setSystemMetrics(metrics);
      setCapacityEstimate(capacity);
    } catch (error) {
      console.error('Failed to load system metrics:', error);
    }
  };

  // Start stress test
  const startTest = async (preset = null) => {
    setLoading(true);
    
    try {
      let endpoint = '/api/stress-test/start';
      let config = testConfig;
      
      if (preset) {
        endpoint = `/api/stress-test/quick/${preset}`;
        config = null;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: config ? JSON.stringify(config) : undefined
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Stress test started: ${data.test_id}`);
        setActiveTest(data);
        
        // Start polling for updates
        const interval = setInterval(() => pollTestStatus(data.test_id), 2000);
        setPollInterval(interval);
      } else {
        toast.error('Failed to start test');
      }
    } catch (error) {
      toast.error('Failed to start stress test');
      console.error(error);
    }
    
    setLoading(false);
  };

  // Poll test status
  const pollTestStatus = async (testId) => {
    try {
      const response = await fetch(`${API_URL}/api/stress-test/status/${testId}`);
      const data = await response.json();
      
      setActiveTest(data);
      
      if (data.status === 'completed' || data.status === 'failed') {
        // Stop polling
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
        
        // Load full results
        const resultsRes = await fetch(`${API_URL}/api/stress-test/results/${testId}`);
        const results = await resultsRes.json();
        setTestResults(results);
        
        toast.success(`Test completed: ${testId}`);
        loadTestHistory();
      }
    } catch (error) {
      console.error('Failed to poll test status:', error);
    }
  };

  // Cancel test
  const cancelTest = async () => {
    if (!activeTest?.test_id) return;
    
    try {
      await fetch(`${API_URL}/api/stress-test/cancel/${activeTest.test_id}`, {
        method: 'DELETE'
      });
      toast.info('Test cancelled');
      
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      setActiveTest(null);
    } catch (error) {
      toast.error('Failed to cancel test');
    }
  };

  // Run notification flood test
  const runNotificationFlood = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/stress-test/notifications/flood?user_count=1000&notifications_per_user=10`,
        { method: 'POST' }
      );
      const data = await response.json();
      toast.success(`Notification flood complete: ${data.notifications_created} created at ${Math.round(data.throughput_per_second)}/sec`);
      setTestResults(data);
    } catch (error) {
      toast.error('Failed to run notification flood');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTestHistory();
    loadSystemMetrics();
    
    // Refresh metrics every 10 seconds
    const metricsInterval = setInterval(loadSystemMetrics, 10000);
    
    return () => {
      clearInterval(metricsInterval);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const formatDuration = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  return (
    <Layout>
      <div className="space-y-6 p-6" data-testid="stress-test-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              Stress Test Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Load testing for 20,000+ concurrent users
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadSystemMetrics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Metrics
            </Button>
          </div>
        </div>

        {/* System Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Cpu className="h-4 w-4" /> CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{systemMetrics?.cpu_percent || 0}%</span>
                <Progress value={systemMetrics?.cpu_percent || 0} className="w-24" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Server className="h-4 w-4" /> Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{systemMetrics?.memory?.percent || 0}%</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(systemMetrics?.memory?.used_mb || 0)} MB
                </span>
              </div>
              <Progress value={systemMetrics?.memory?.percent || 0} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HardDrive className="h-4 w-4" /> Disk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{systemMetrics?.disk?.percent || 0}%</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(systemMetrics?.disk?.used_gb || 0)} GB
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Est. Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatNumber(capacityEstimate?.estimated_max_concurrent_users || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Limited by: {capacityEstimate?.limiting_factor || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <Activity className="h-4 w-4 mr-2" /> Run Test
            </TabsTrigger>
            <TabsTrigger value="results">
              <BarChart3 className="h-4 w-4 mr-2" /> Results
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" /> History
            </TabsTrigger>
            <TabsTrigger value="presets">
              <Zap className="h-4 w-4 mr-2" /> Quick Tests
            </TabsTrigger>
          </TabsList>

          {/* Run Test Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Test Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Configuration</CardTitle>
                  <CardDescription>Configure your stress test parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Concurrent Users: {testConfig.concurrent_users.toLocaleString()}</Label>
                    <Slider
                      value={[testConfig.concurrent_users]}
                      onValueChange={([val]) => setTestConfig({...testConfig, concurrent_users: val})}
                      min={10}
                      max={20000}
                      step={10}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10</span>
                      <span>5,000</span>
                      <span>10,000</span>
                      <span>20,000</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Duration: {testConfig.duration_seconds} seconds</Label>
                    <Slider
                      value={[testConfig.duration_seconds]}
                      onValueChange={([val]) => setTestConfig({...testConfig, duration_seconds: val})}
                      min={10}
                      max={300}
                      step={10}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ramp-up Time: {testConfig.ramp_up_seconds} seconds</Label>
                    <Slider
                      value={[testConfig.ramp_up_seconds]}
                      onValueChange={([val]) => setTestConfig({...testConfig, ramp_up_seconds: val})}
                      min={1}
                      max={60}
                      step={1}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                    {activeTest && activeTest.status === 'running' ? (
                      <Button variant="destructive" onClick={cancelTest}>
                        <Square className="h-4 w-4 mr-2" /> Stop Test
                      </Button>
                    ) : (
                      <Button onClick={() => startTest()} disabled={loading}>
                        <Play className="h-4 w-4 mr-2" /> Start Test
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Active Test Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Test Status
                    {activeTest?.status === 'running' && (
                      <Badge className="bg-blue-500 animate-pulse">Running</Badge>
                    )}
                    {activeTest?.status === 'completed' && (
                      <Badge className="bg-green-500">Completed</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeTest ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Test ID</p>
                          <p className="font-mono text-sm">{activeTest.test_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="font-semibold capitalize">{activeTest.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Users Active</p>
                          <p className="text-2xl font-bold">{formatNumber(activeTest.users_active || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Target Users</p>
                          <p className="text-2xl font-bold">{formatNumber(activeTest.config?.concurrent_users || 0)}</p>
                        </div>
                      </div>
                      
                      {activeTest.status === 'running' && (
                        <Progress 
                          value={(activeTest.users_active / (activeTest.config?.concurrent_users || 1)) * 100}
                          className="h-2"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No active test</p>
                      <p className="text-sm">Configure and start a test above</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notification Flood Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" /> Notification System Stress Test
                </CardTitle>
                <CardDescription>Test notification throughput capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button onClick={runNotificationFlood} disabled={loading}>
                    <Zap className="h-4 w-4 mr-2" /> Run Flood Test (10,000 notifications)
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Creates 1,000 users × 10 notifications each
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {testResults ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatNumber(testResults.total_requests)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${
                        (testResults.successful_requests / testResults.total_requests * 100) > 95 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {((testResults.successful_requests / testResults.total_requests) * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Requests/Second</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{Math.round(testResults.requests_per_second)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Avg Latency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatDuration(testResults.avg_latency_ms)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Latency Percentiles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Latency Percentiles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Min</p>
                        <p className="text-xl font-bold">{formatDuration(testResults.min_latency_ms)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">P50</p>
                        <p className="text-xl font-bold">{formatDuration(testResults.p50_latency_ms)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">P95</p>
                        <p className="text-xl font-bold">{formatDuration(testResults.p95_latency_ms)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">P99</p>
                        <p className="text-xl font-bold">{formatDuration(testResults.p99_latency_ms)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Max</p>
                        <p className="text-xl font-bold">{formatDuration(testResults.max_latency_ms)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="text-xl font-bold">{formatDuration(testResults.duration_ms)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Endpoint Results */}
                {testResults.endpoint_results && Object.keys(testResults.endpoint_results).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Results by Endpoint</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Endpoint</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Success</TableHead>
                            <TableHead className="text-right">Failed</TableHead>
                            <TableHead className="text-right">Success Rate</TableHead>
                            <TableHead className="text-right">Avg Latency</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(testResults.endpoint_results).map(([endpoint, data]) => (
                            <TableRow key={endpoint}>
                              <TableCell className="font-mono text-sm">{endpoint}</TableCell>
                              <TableCell className="text-right">{formatNumber(data.total)}</TableCell>
                              <TableCell className="text-right text-green-600">{formatNumber(data.success)}</TableCell>
                              <TableCell className="text-right text-red-600">{formatNumber(data.fail)}</TableCell>
                              <TableCell className="text-right">
                                <Badge className={data.success_rate > 95 ? 'bg-green-500' : 'bg-red-500'}>
                                  {data.success_rate?.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{formatDuration(data.avg_latency_ms)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Errors */}
                {testResults.error_types && Object.keys(testResults.error_types).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-500">Errors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(testResults.error_types).map(([error, count]) => (
                          <div key={error} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <span className="font-mono text-sm">{error}</span>
                            <Badge variant="destructive">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No test results available</p>
                  <p className="text-sm">Run a test to see results here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test History</CardTitle>
                <CardDescription>Previous stress test results</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Requests</TableHead>
                      <TableHead className="text-right">RPS</TableHead>
                      <TableHead className="text-right">Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testHistory.map((test) => (
                      <TableRow key={test.test_id}>
                        <TableCell className="font-mono text-sm">{test.test_id}</TableCell>
                        <TableCell>
                          <Badge className={
                            test.status === 'completed' ? 'bg-green-500' :
                            test.status === 'running' ? 'bg-blue-500' :
                            test.status === 'failed' ? 'bg-red-500' :
                            'bg-gray-500'
                          }>
                            {test.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(test.config?.concurrent_users)}</TableCell>
                        <TableCell className="text-right">{formatNumber(test.total_requests)}</TableCell>
                        <TableCell className="text-right">{Math.round(test.requests_per_second || 0)}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {test.started_at ? new Date(test.started_at).toLocaleString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {testHistory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No test history available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Tests Tab */}
          <TabsContent value="presets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer"
                onClick={() => startTest('light')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" /> Light Load
                  </CardTitle>
                  <CardDescription>100 users for 30 seconds</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 100 concurrent users</li>
                    <li>• 30 second duration</li>
                    <li>• 5 second ramp-up</li>
                    <li>• Basic health checks</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer"
                onClick={() => startTest('medium')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-yellow-500" /> Medium Load
                  </CardTitle>
                  <CardDescription>1,000 users for 60 seconds</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 1,000 concurrent users</li>
                    <li>• 60 second duration</li>
                    <li>• 15 second ramp-up</li>
                    <li>• All API endpoints</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer"
                onClick={() => startTest('heavy')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" /> Heavy Load
                  </CardTitle>
                  <CardDescription>5,000 users for 120 seconds</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 5,000 concurrent users</li>
                    <li>• 120 second duration</li>
                    <li>• 30 second ramp-up</li>
                    <li>• Full system stress</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-dashed border-red-200 hover:border-red-500 transition-colors cursor-pointer"
                onClick={() => startTest('extreme')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-500">
                    <AlertTriangle className="h-5 w-5" /> Extreme Load
                  </CardTitle>
                  <CardDescription>20,000 users for 180 seconds</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 20,000 concurrent users</li>
                    <li>• 180 second duration</li>
                    <li>• 60 second ramp-up</li>
                    <li>• Maximum stress test</li>
                  </ul>
                  <Alert className="mt-3" variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      This will push the system to its limits
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Capacity Planning</AlertTitle>
              <AlertDescription>
                For production deployment supporting 20,000+ concurrent users, consider:
                <ul className="mt-2 text-sm space-y-1">
                  <li>• Horizontal scaling with load balancer (e.g., nginx, AWS ALB)</li>
                  <li>• Database connection pooling (e.g., PgBouncer for PostgreSQL, MongoDB connection limits)</li>
                  <li>• Redis caching for session management and hot data</li>
                  <li>• WebSocket server clustering (e.g., Socket.IO with Redis adapter)</li>
                  <li>• CDN for static assets (e.g., CloudFlare, AWS CloudFront)</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Add missing Info component import
const Info = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
