import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Calendar,
  Target,
  TrendingUp,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Briefcase,
  Heart,
  Home,
  GraduationCap,
  Plane,
  Sunset,
  Gift,
  Car,
  Building2,
  CheckCircle,
  Award,
  Sparkles,
  Trophy,
  Crown,
  Star,
  Zap
} from "lucide-react";
import axios from "axios";
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

const formatCompact = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

// Event type icons and colors
const EVENT_ICONS = {
  career_start: { icon: Briefcase, color: 'bg-blue-500' },
  career_change: { icon: TrendingUp, color: 'bg-blue-500' },
  promotion: { icon: Award, color: 'bg-green-500' },
  marriage: { icon: Heart, color: 'bg-pink-500' },
  child: { icon: Heart, color: 'bg-purple-500' },
  education: { icon: GraduationCap, color: 'bg-indigo-500' },
  house_purchase: { icon: Home, color: 'bg-amber-500' },
  house_upgrade: { icon: Home, color: 'bg-amber-500' },
  mortgage_payoff: { icon: CheckCircle, color: 'bg-green-500' },
  car_purchase: { icon: Car, color: 'bg-slate-500' },
  travel: { icon: Plane, color: 'bg-cyan-500' },
  inheritance: { icon: Gift, color: 'bg-yellow-500' },
  retirement: { icon: Sunset, color: 'bg-orange-500' },
  estate_transfer: { icon: Building2, color: 'bg-purple-500' },
  investment_milestone: { icon: TrendingUp, color: 'bg-emerald-500' },
  business_start: { icon: Building2, color: 'bg-blue-500' },
  current: { icon: Target, color: 'bg-[#D4A84C]' }
};

// Milestone emojis
const MILESTONE_EMOJIS = {
  'Six Figures': '🎯',
  'Quarter Millionaire': '💰',
  'Half Millionaire': '💎',
  'Millionaire': '🏆',
  'Double Millionaire': '👑',
  'High Net Worth': '🌟'
};

const LifeTimelinePlanner = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [projections, setProjections] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retirementAge, setRetirementAge] = useState(60);
  const [isModified, setIsModified] = useState(false);

  // User financial data (would come from context in production)
  const userProfile = {
    currentAge: 45,
    currentNetWorth: 1978000,
    annualIncome: 185000,
    savingsRate: 0.15
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      
      // Get default timeline
      const timelineRes = await axios.get(`${API}/timeline/default`, {
        params: { current_age: userProfile.currentAge }
      });
      
      setEvents(timelineRes.data.events);
      
      // Calculate financial impact
      const impactRes = await axios.post(`${API}/timeline/calculate-impact`, {
        events: timelineRes.data.events,
        current_net_worth: userProfile.currentNetWorth,
        annual_income: userProfile.annualIncome,
        savings_rate: userProfile.savingsRate
      });
      
      setProjections(impactRes.data.projections);
      setMilestones(impactRes.data.milestones || []);
      setSummary(impactRes.data.summary);
      
      if (impactRes.data.summary) {
        setRetirementAge(impactRes.data.summary.retirement_age);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetirementAgeChange = async (newAge) => {
    setRetirementAge(newAge[0]);
    setIsModified(true);
    
    // Update the retirement event locally
    const updatedEvents = events.map(e => 
      e.event_type === 'retirement' 
        ? { ...e, age: newAge[0], year: new Date().getFullYear() + (newAge[0] - userProfile.currentAge) }
        : e
    );
    setEvents(updatedEvents);
    
    // Recalculate impact
    try {
      const impactRes = await axios.post(`${API}/timeline/calculate-impact`, {
        events: updatedEvents,
        current_net_worth: userProfile.currentNetWorth,
        annual_income: userProfile.annualIncome,
        savings_rate: userProfile.savingsRate
      });
      
      setProjections(impactRes.data.projections);
      setMilestones(impactRes.data.milestones || []);
      setSummary(impactRes.data.summary);
    } catch (error) {
      console.error("Error recalculating:", error);
    }
  };

  const resetTimeline = () => {
    setIsModified(false);
    fetchTimeline();
  };

  // Chart data - filter to show key years
  const chartData = useMemo(() => {
    return projections.filter((_, i) => i % 2 === 0 || projections[i]?.events?.length > 0);
  }, [projections]);

  // Get retirement projection point
  const retirementProjection = projections.find(p => p.age === retirementAge);

  return (
    <Layout>
      <div className="space-y-6" data-testid="life-timeline-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Life Timeline Planner
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize your financial journey and see the impact of life decisions
            </p>
          </div>
          <div className="flex gap-2">
            {isModified && (
              <Button variant="outline" onClick={resetTimeline}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
            <Button 
              className="bg-[#1a2744] hover:bg-[#1a2744]/90"
              onClick={() => navigate('/scenarios')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Save Scenario
            </Button>
          </div>
        </div>

        {/* Retirement Age Slider */}
        <Card className="border-[#D4A84C]/30 bg-gradient-to-r from-[#1a2744]/5 to-[#D4A84C]/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sunset className="h-5 w-5 text-[#D4A84C]" />
                    <span className="font-semibold">Retirement Age</span>
                    {isModified && <Badge className="bg-[#D4A84C] text-[#1a2744]">Modified</Badge>}
                  </div>
                  <span className="text-2xl font-bold text-[#D4A84C]">{retirementAge}</span>
                </div>
                <Slider
                  value={[retirementAge]}
                  onValueChange={handleRetirementAgeChange}
                  min={50}
                  max={70}
                  step={1}
                  className="cursor-pointer"
                  data-testid="retirement-age-slider"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Early (50)</span>
                  <span>Standard (65)</span>
                  <span>Late (70)</span>
                </div>
              </div>
              
              {/* Impact Summary */}
              <div className="grid grid-cols-2 gap-4 md:w-96">
                <div className="bg-background rounded-lg p-4 border">
                  <p className="text-xs text-muted-foreground">Retirement Net Worth</p>
                  <p className="text-xl font-bold text-[#1a2744]">
                    {retirementProjection ? formatCompact(retirementProjection.net_worth) : '--'}
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border">
                  <p className="text-xs text-muted-foreground">Years to Retirement</p>
                  <p className="text-xl font-bold text-[#D4A84C]">
                    {retirementAge - userProfile.currentAge} years
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Visual */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-[#D4A84C]" />
              Your Life Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
              
              {/* Events */}
              <div className="space-y-6">
                {events.map((event, index) => {
                  const eventConfig = EVENT_ICONS[event.event_type] || EVENT_ICONS.current;
                  const Icon = eventConfig.icon;
                  const isPast = event.is_past;
                  const isCurrent = event.is_current;
                  
                  return (
                    <div 
                      key={event.id} 
                      className={`relative flex items-start gap-4 ${isPast ? 'opacity-60' : ''}`}
                    >
                      {/* Icon */}
                      <div className={`relative z-10 w-16 h-16 rounded-full ${eventConfig.color} flex items-center justify-center text-white shadow-lg ${isCurrent ? 'ring-4 ring-[#D4A84C]/50' : ''}`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{event.name}</h3>
                          <Badge variant={isPast ? "secondary" : isCurrent ? "default" : "outline"}>
                            Age {event.age}
                          </Badge>
                          {event.event_type === 'retirement' && (
                            <Badge className="bg-orange-500">Adjustable</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description || `Year ${event.year}`}
                        </p>
                        {event.financial_impact !== 0 && (
                          <p className={`text-sm font-medium mt-1 ${event.financial_impact > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {event.financial_impact > 0 ? '+' : ''}{formatCurrency(event.financial_impact)}
                          </p>
                        )}
                      </div>
                      
                      {/* Age marker */}
                      <div className="text-right text-sm text-muted-foreground pt-2">
                        <p className="font-medium">{event.year}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wealth Projection Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-[#D4A84C]" />
                Wealth Projection
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-[#1a2744]" />
                <span>Net Worth</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a2744" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1a2744" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="age" 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Age', position: 'bottom', offset: -5 }}
                  />
                  <YAxis 
                    tickFormatter={(v) => formatCompact(v)}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), "Net Worth"]}
                    labelFormatter={(age) => `Age ${age}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <ReferenceLine 
                    x={retirementAge} 
                    stroke="#D4A84C" 
                    strokeDasharray="5 5"
                    label={{ value: 'Retirement', fill: '#D4A84C', fontSize: 12 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="net_worth" 
                    stroke="#1a2744" 
                    strokeWidth={2}
                    fill="url(#netWorthGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        {milestones.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-[#D4A84C]" />
                Wealth Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {milestones.map((milestone, index) => (
                  <div 
                    key={`item-${index}`}
                    className="bg-gradient-to-br from-[#1a2744]/5 to-[#D4A84C]/10 rounded-lg p-4 text-center border"
                  >
                    <div className="text-3xl mb-2">{MILESTONE_EMOJIS[milestone.label] || '🎯'}</div>
                    <p className="font-semibold text-sm">{milestone.label}</p>
                    <p className="text-xs text-muted-foreground">Age {milestone.age}</p>
                    <p className="text-xs text-[#D4A84C] font-medium">{formatCompact(milestone.threshold)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Peak Net Worth</p>
                <p className="text-2xl font-bold text-[#1a2744]">{formatCompact(summary.peak_net_worth)}</p>
                <p className="text-xs text-muted-foreground">at age {summary.peak_age}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Retirement Balance</p>
                <p className="text-2xl font-bold text-[#D4A84C]">{formatCompact(summary.retirement_net_worth)}</p>
                <p className="text-xs text-muted-foreground">at age {summary.retirement_age}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Years to Retirement</p>
                <p className="text-2xl font-bold">{summary.years_to_retirement}</p>
                <p className="text-xs text-muted-foreground">from today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Planned Events</p>
                <p className="text-2xl font-bold">{summary.total_events}</p>
                <p className="text-xs text-muted-foreground">life milestones</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LifeTimelinePlanner;
