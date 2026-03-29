import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  TrendingUp, TrendingDown, Target, BarChart3, LineChart, PieChart,
  Brain, Lightbulb, AlertTriangle, CheckCircle, Clock, Calendar,
  ArrowUp, ArrowDown, RefreshCw, Search, Filter, Download, Star,
  Zap, Shield, DollarSign, Activity, History, ArrowRight, Gauge,
  ChevronRight, Building2, Landmark, Globe, BookOpen, PlayCircle
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart as RechartsLine, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, AreaChart, Area, BarChart, Bar,
  ComposedChart, ScatterChart, Scatter, Cell
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ===================== MOCK DATA FOR BUFFETT-STYLE ENGINE =====================

// Historical PE bands for major stocks (10-year data)
const mockHistoricalPE = {
  'CBA.AX': { current: 18.2, avg10Y: 15.5, low10Y: 11.2, high10Y: 22.5, sector: 'Banks' },
  'BHP.AX': { current: 11.5, avg10Y: 14.2, low10Y: 8.1, high10Y: 21.3, sector: 'Mining' },
  'CSL.AX': { current: 42.1, avg10Y: 38.5, low10Y: 28.4, high10Y: 55.2, sector: 'Healthcare' },
  'WBC.AX': { current: 12.8, avg10Y: 13.9, low10Y: 9.5, high10Y: 18.2, sector: 'Banks' },
  'NAB.AX': { current: 14.1, avg10Y: 13.2, low10Y: 9.8, high10Y: 17.6, sector: 'Banks' },
  'ANZ.AX': { current: 11.9, avg10Y: 12.5, low10Y: 8.9, high10Y: 16.4, sector: 'Banks' },
  'RIO.AX': { current: 9.8, avg10Y: 12.8, low10Y: 6.5, high10Y: 19.8, sector: 'Mining' },
  'FMG.AX': { current: 7.2, avg10Y: 8.5, low10Y: 4.2, high10Y: 14.5, sector: 'Mining' },
  'WES.AX': { current: 26.5, avg10Y: 22.8, low10Y: 16.5, high10Y: 32.1, sector: 'Retail' },
  'WOW.AX': { current: 24.8, avg10Y: 21.5, low10Y: 15.2, high10Y: 28.9, sector: 'Retail' },
  'TLS.AX': { current: 22.5, avg10Y: 18.2, low10Y: 12.8, high10Y: 25.5, sector: 'Telco' },
  'MQG.AX': { current: 16.8, avg10Y: 14.5, low10Y: 10.2, high10Y: 21.5, sector: 'Financials' },
};

// Sector-relative scoring
const sectorScores = {
  Banks: { momentum: 72, value: 85, quality: 78, overall: 78 },
  Mining: { momentum: 58, value: 92, quality: 65, overall: 72 },
  Healthcare: { momentum: 45, value: 35, quality: 95, overall: 58 },
  Retail: { momentum: 62, value: 45, quality: 72, overall: 60 },
  Telco: { momentum: 55, value: 52, quality: 68, overall: 58 },
  Financials: { momentum: 68, value: 75, quality: 82, overall: 75 },
};

// Macro overlay indicators
const macroIndicators = {
  rba_rate: { current: 4.35, direction: 'stable', impact: 'Banks benefit from stable rates' },
  aud_usd: { current: 0.672, direction: 'down', impact: 'Export miners benefit from weak AUD' },
  iron_ore: { current: 118.5, direction: 'up', impact: 'Positive for BHP, RIO, FMG' },
  yield_curve: { current: 0.45, direction: 'steepening', impact: 'Banks margin expansion expected' },
  liquidity: { current: 'adequate', direction: 'tightening', impact: 'Favor quality over growth' },
  cycle_phase: { current: 'late_expansion', direction: 'stable', impact: 'Defensive tilt recommended' },
};

// Daily idea generator - top opportunities
const dailyIdeas = [
  {
    symbol: 'FMG.AX',
    name: 'Fortescue Metals',
    action: 'BUY',
    reason: 'Trading 15% below 10Y avg PE with iron ore prices rising. Strong dividend yield of 8.2%.',
    pe_current: 7.2,
    pe_avg: 8.5,
    upside: '+18%',
    confidence: 85,
    sector: 'Mining',
    catalyst: 'Iron ore supply disruption in Brazil'
  },
  {
    symbol: 'NAB.AX',
    name: 'National Australia Bank',
    action: 'BUY',
    reason: 'Best positioned major bank for NIM expansion. PE near 10Y average with 6.1% yield.',
    pe_current: 14.1,
    pe_avg: 13.2,
    upside: '+12%',
    confidence: 78,
    sector: 'Banks',
    catalyst: 'RBA rate stability supporting margins'
  },
  {
    symbol: 'CSL.AX',
    name: 'CSL Limited',
    action: 'HOLD',
    reason: 'Quality compounder but trading above historical average. Wait for better entry.',
    pe_current: 42.1,
    pe_avg: 38.5,
    upside: '+5%',
    confidence: 55,
    sector: 'Healthcare',
    catalyst: 'Plasma collection recovery'
  },
  {
    symbol: 'WES.AX',
    name: 'Wesfarmers',
    action: 'REDUCE',
    reason: 'Elevated PE vs history. Bunnings growth slowing. Consider trimming for valuation reset.',
    pe_current: 26.5,
    pe_avg: 22.8,
    upside: '-8%',
    confidence: 72,
    sector: 'Retail',
    catalyst: 'Consumer spending slowdown'
  },
];

// Backtest performance data
const backtestResults = {
  strategy: 'Buffett Value + Momentum',
  period: '10 Years (2016-2026)',
  returns: {
    strategy: 14.2,
    benchmark: 9.8,
    alpha: 4.4,
  },
  metrics: {
    sharpe_ratio: 1.25,
    max_drawdown: -18.5,
    win_rate: 68,
    avg_holding: '14 months',
  },
  yearly_returns: [
    { year: '2016', strategy: 12.5, benchmark: 8.2 },
    { year: '2017', strategy: 18.2, benchmark: 11.5 },
    { year: '2018', strategy: -2.5, benchmark: -6.9 },
    { year: '2019', strategy: 22.1, benchmark: 18.4 },
    { year: '2020', strategy: 8.5, benchmark: 1.4 },
    { year: '2021', strategy: 25.8, benchmark: 17.2 },
    { year: '2022', strategy: -5.2, benchmark: -10.1 },
    { year: '2023', strategy: 15.2, benchmark: 12.1 },
    { year: '2024', strategy: 18.5, benchmark: 11.8 },
    { year: '2025', strategy: 14.8, benchmark: 8.5 },
  ]
};

// Format helpers
const formatCurrency = (val) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val || 0);
const formatPercent = (val) => `${val >= 0 ? '+' : ''}${val?.toFixed(1)}%`;

// PE Band visualization component
const PEBandChart = ({ symbol, data }) => {
  const chartData = [
    { name: '10Y Low', value: data.low10Y, fill: '#22c55e' },
    { name: '10Y Avg', value: data.avg10Y, fill: '#3b82f6' },
    { name: 'Current', value: data.current, fill: data.current <= data.avg10Y ? '#22c55e' : '#ef4444' },
    { name: '10Y High', value: data.high10Y, fill: '#ef4444' },
  ];
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold">{symbol}</span>
        <Badge className={data.current <= data.avg10Y ? 'bg-green-500' : 'bg-amber-500'}>
          PE: {data.current}
        </Badge>
      </div>
      <div className="h-4 bg-slate-100 rounded-full relative overflow-hidden">
        <div 
          className="absolute h-full bg-gradient-to-r from-green-500 via-blue-500 to-red-500 opacity-30"
          style={{ width: '100%' }}
        />
        <div 
          className="absolute h-full w-1 bg-slate-800"
          style={{ left: `${((data.current - data.low10Y) / (data.high10Y - data.low10Y)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{data.low10Y}</span>
        <span className="text-blue-600">{data.avg10Y} avg</span>
        <span>{data.high10Y}</span>
      </div>
    </div>
  );
};

// ===================== MAIN COMPONENT =====================

const BuffettTradingEngine = () => {
  const [activeTab, setActiveTab] = useState('ideas');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedStock, setSelectedStock] = useState(null);
  const [portfolioMode, setPortfolioMode] = useState(false);

  // Filter stocks by sector
  const filteredStocks = useMemo(() => {
    const stocks = Object.entries(mockHistoricalPE).map(([symbol, data]) => ({
      symbol,
      ...data,
      valuation: data.current <= data.avg10Y ? 'Undervalued' : data.current <= data.avg10Y * 1.1 ? 'Fair' : 'Overvalued',
      opportunity: Math.round(((data.avg10Y - data.current) / data.avg10Y) * 100)
    }));
    
    if (selectedSector === 'all') return stocks;
    return stocks.filter(s => s.sector === selectedSector);
  }, [selectedSector]);

  const sectors = ['all', ...new Set(Object.values(mockHistoricalPE).map(d => d.sector))];

  return (
    <Layout>
      <div className="space-y-6" data-testid="buffett-trading-engine">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-amber-600" />
              Buffett-Style Investment Engine
            </h1>
            <p className="text-muted-foreground">
              Value investing meets quantitative analysis • Daily opportunities for Australian equities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Activity className="h-3 w-3 mr-1" /> Last updated: {new Date().toLocaleTimeString()}
            </Badge>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Macro Overlay Banner */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-amber-400" />
                <span className="font-semibold">Macro Overlay</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-slate-400">RBA Rate:</span>
                  <span className="ml-2 font-semibold">{macroIndicators.rba_rate.current}%</span>
                </div>
                <div>
                  <span className="text-slate-400">AUD/USD:</span>
                  <span className="ml-2 font-semibold">{macroIndicators.aud_usd.current}</span>
                </div>
                <div>
                  <span className="text-slate-400">Iron Ore:</span>
                  <span className="ml-2 font-semibold">${macroIndicators.iron_ore.current}</span>
                </div>
                <div>
                  <span className="text-slate-400">Cycle:</span>
                  <Badge className="ml-2 bg-amber-500">{macroIndicators.cycle_phase.current.replace('_', ' ')}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="ideas" className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4" />
              Daily Ideas
            </TabsTrigger>
            <TabsTrigger value="valuations" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Valuations
            </TabsTrigger>
            <TabsTrigger value="sectors" className="flex items-center gap-1">
              <PieChart className="h-4 w-4" />
              Sectors
            </TabsTrigger>
            <TabsTrigger value="backtest" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              Backtest
            </TabsTrigger>
            <TabsTrigger value="optimizer" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Optimizer
            </TabsTrigger>
          </TabsList>

          {/* ========== DAILY IDEAS TAB ========== */}
          <TabsContent value="ideas" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Ideas List */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Today's Top Opportunities
                    </CardTitle>
                    <CardDescription>
                      Buffett-style value picks with momentum confirmation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dailyIdeas.map((idea, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          idea.action === 'BUY' ? 'border-green-200 bg-green-50 hover:border-green-400' :
                          idea.action === 'HOLD' ? 'border-blue-200 bg-blue-50 hover:border-blue-400' :
                          'border-red-200 bg-red-50 hover:border-red-400'
                        }`}
                        onClick={() => setSelectedStock(idea)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-lg">{idea.symbol}</span>
                              <span className="text-muted-foreground">{idea.name}</span>
                              <Badge className={
                                idea.action === 'BUY' ? 'bg-green-500' :
                                idea.action === 'HOLD' ? 'bg-blue-500' :
                                'bg-red-500'
                              }>
                                {idea.action}
                              </Badge>
                              <Badge variant="outline">{idea.sector}</Badge>
                            </div>
                            <p className="text-sm mb-3">{idea.reason}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span>PE: <strong>{idea.pe_current}</strong> vs avg <strong>{idea.pe_avg}</strong></span>
                              <span className={idea.upside.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                                Upside: <strong>{idea.upside}</strong>
                              </span>
                              <span>Confidence: <strong>{idea.confidence}%</strong></span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="w-16 h-16 relative">
                              <svg className="w-16 h-16 transform -rotate-90">
                                <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                <circle 
                                  cx="32" cy="32" r="28" fill="none" 
                                  stroke={idea.confidence >= 75 ? '#22c55e' : idea.confidence >= 50 ? '#f59e0b' : '#ef4444'}
                                  strokeWidth="4" 
                                  strokeDasharray={`${idea.confidence * 1.76} 176`}
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                                {idea.confidence}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 p-2 bg-white/50 rounded text-sm">
                          <strong>Catalyst:</strong> {idea.catalyst}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Quick Stats */}
              <div className="space-y-4">
                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Market Sentiment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Gauge className="h-16 w-16 mx-auto text-amber-600" />
                      <p className="text-3xl font-bold mt-2">68</p>
                      <p className="text-sm text-muted-foreground">Moderately Bullish</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Fear & Greed</span>
                        <Badge>Neutral</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>VIX</span>
                        <span className="font-medium">14.2</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Put/Call Ratio</span>
                        <span className="font-medium">0.85</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sector Rankings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(sectorScores)
                      .sort((a, b) => b[1].overall - a[1].overall)
                      .map(([sector, scores], idx) => (
                        <div key={sector} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-sm">{sector}</span>
                          </div>
                          <Badge variant={scores.overall >= 70 ? 'default' : 'secondary'}>
                            {scores.overall}
                          </Badge>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Client Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Ideas PDF
                    </Button>
                    <Button className="w-full" variant="outline">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Present to Client
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========== VALUATIONS TAB ========== */}
          <TabsContent value="valuations" className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectors.filter(s => s !== 'all').map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline">{filteredStocks.length} stocks</Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStocks.map((stock) => (
                <Card key={stock.symbol} className={`${
                  stock.valuation === 'Undervalued' ? 'border-green-200' :
                  stock.valuation === 'Fair' ? 'border-blue-200' :
                  'border-red-200'
                }`}>
                  <CardContent className="p-4">
                    <PEBandChart symbol={stock.symbol} data={stock} />
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <Badge className={
                        stock.valuation === 'Undervalued' ? 'bg-green-500' :
                        stock.valuation === 'Fair' ? 'bg-blue-500' :
                        'bg-red-500'
                      }>
                        {stock.valuation}
                      </Badge>
                      <span className={`text-sm font-medium ${
                        stock.opportunity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.opportunity > 0 ? '+' : ''}{stock.opportunity}% vs avg
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ========== SECTORS TAB ========== */}
          <TabsContent value="sectors" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {Object.entries(sectorScores).map(([sector, scores]) => (
                <Card key={sector}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{sector}</span>
                      <Badge className={scores.overall >= 70 ? 'bg-green-500' : scores.overall >= 50 ? 'bg-amber-500' : 'bg-red-500'}>
                        Score: {scores.overall}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Value</span>
                        <span className="font-medium">{scores.value}</span>
                      </div>
                      <Progress value={scores.value} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Momentum</span>
                        <span className="font-medium">{scores.momentum}</span>
                      </div>
                      <Progress value={scores.momentum} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Quality</span>
                        <span className="font-medium">{scores.quality}</span>
                      </div>
                      <Progress value={scores.quality} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ========== BACKTEST TAB ========== */}
          <TabsContent value="backtest" className="space-y-6">
            <div className="grid lg:grid-cols-4 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Strategy Return (CAGR)</p>
                  <p className="text-3xl font-bold text-green-600">{backtestResults.returns.strategy}%</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Benchmark (ASX 200)</p>
                  <p className="text-3xl font-bold text-blue-600">{backtestResults.returns.benchmark}%</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Alpha Generated</p>
                  <p className="text-3xl font-bold text-amber-600">+{backtestResults.returns.alpha}%</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-3xl font-bold text-purple-600">{backtestResults.metrics.sharpe_ratio}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance vs Benchmark (10 Years)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={backtestResults.yearly_returns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Legend />
                      <Bar dataKey="strategy" name="Buffett Strategy" fill="#22c55e" />
                      <Bar dataKey="benchmark" name="ASX 200" fill="#3b82f6" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">{backtestResults.metrics.win_rate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-600">{backtestResults.metrics.max_drawdown}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Avg Holding Period</p>
                  <p className="text-2xl font-bold">{backtestResults.metrics.avg_holding}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Test Period</p>
                  <p className="text-2xl font-bold">10 Years</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========== OPTIMIZER TAB ========== */}
          <TabsContent value="optimizer" className="space-y-6">
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                Portfolio optimization uses Modern Portfolio Theory combined with Buffett-style value screening.
                Enter your constraints to generate an optimized allocation.
              </AlertDescription>
            </Alert>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Constraints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Max Position Size</label>
                      <Input type="number" defaultValue={10} placeholder="%" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Sector Weight</label>
                      <Input type="number" defaultValue={30} placeholder="%" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Min PE Discount</label>
                      <Input type="number" defaultValue={10} placeholder="% below avg" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Min Dividend Yield</label>
                      <Input type="number" defaultValue={3} placeholder="%" />
                    </div>
                  </div>
                  <Button className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Run Optimization
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Suggested Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { symbol: 'FMG.AX', weight: 12, sector: 'Mining' },
                      { symbol: 'NAB.AX', weight: 10, sector: 'Banks' },
                      { symbol: 'ANZ.AX', weight: 8, sector: 'Banks' },
                      { symbol: 'RIO.AX', weight: 10, sector: 'Mining' },
                      { symbol: 'WOW.AX', weight: 8, sector: 'Retail' },
                      { symbol: 'TLS.AX', weight: 7, sector: 'Telco' },
                      { symbol: 'Cash', weight: 45, sector: 'Cash' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.symbol}</span>
                          <Badge variant="outline" className="text-xs">{item.sector}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={item.weight} className="w-20 h-2" />
                          <span className="text-sm font-medium w-10 text-right">{item.weight}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default BuffettTradingEngine;
