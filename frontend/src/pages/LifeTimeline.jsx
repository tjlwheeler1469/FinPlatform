import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock,
  Calendar,
  Home,
  GraduationCap,
  Plane,
  Car,
  Heart,
  Building2,
  TrendingUp,
  DollarSign,
  Plus,
  Trash2,
  RefreshCw,
  Target,
  Milestone,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { usePortfolio } from "@/App";
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
  ReferenceLine,
  ReferenceDot,
  Legend,
  LineChart,
  Line
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

const EVENT_TYPES = [
  { value: "house_purchase", label: "Buy Property", icon: Home, color: "#1a2744" },
  { value: "house_upgrade", label: "Upgrade Home", icon: Building2, color: "#3B82F6" },
  { value: "children_education", label: "Children's Education", icon: GraduationCap, color: "#8B5CF6" },
  { value: "major_travel", label: "Major Travel", icon: Plane, color: "#EC4899" },
  { value: "car_purchase", label: "Buy Car", icon: Car, color: "#F59E0B" },
  { value: "wedding", label: "Wedding", icon: Heart, color: "#EF4444" },
  { value: "retirement", label: "Retirement", icon: Target, color: "#10B981" },
  { value: "other", label: "Other Goal", icon: Milestone, color: "#6366F1" }
];

const getEventIcon = (eventType) => {
  const event = EVENT_TYPES.find(e => e.value === eventType);
  return event ? event.icon : Milestone;
};

const getEventColor = (eventType) => {
  const event = EVENT_TYPES.find(e => e.value === eventType);
  return event ? event.color : "#6366F1";
};

const LifeTimeline = () => {
  const { portfolio, familyMembers, budget } = usePortfolio();
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState(null);
  const [activeTab, setActiveTab] = useState("timeline");
  
  // Editable parameters
  const [currentAge, setCurrentAge] = useState(45);
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [annualSavings, setAnnualSavings] = useState(50000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  
  // Life events
  const [events, setEvents] = useState([
    { event_type: "children_education", target_age: 52, target_amount: 100000, priority: "high", description: "Children's University" },
    { event_type: "house_upgrade", target_age: 55, target_amount: 200000, priority: "medium", description: "Home Renovation" },
    { event_type: "retirement", target_age: 65, target_amount: 0, priority: "high", description: "Retirement" }
  ]);
  
  // New event dialog
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_type: "other",
    target_age: 50,
    target_amount: 50000,
    priority: "medium",
    description: ""
  });

  // Initialize from portfolio
  useEffect(() => {
    if (familyMembers[0]?.age) {
      setCurrentAge(familyMembers[0].age);
    }
  }, [familyMembers]);

  // Fetch timeline data
  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/decision-engine/life-timeline`, {
        current_age: currentAge,
        life_expectancy: lifeExpectancy,
        events: events,
        current_assets: portfolio.summary.totalAssets,
        current_debt: portfolio.summary.totalDebt,
        annual_income: portfolio.personal.taxableIncome,
        annual_savings: annualSavings,
        expected_return: expectedReturn / 100,
        inflation_rate: 0.025
      });
      setTimelineData(response.data);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      toast.error("Failed to calculate timeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [currentAge, lifeExpectancy, events, annualSavings, expectedReturn, portfolio]);

  // Add new event
  const handleAddEvent = () => {
    if (!newEvent.description) {
      toast.error("Please enter a description");
      return;
    }
    setEvents([...events, newEvent]);
    setNewEventOpen(false);
    setNewEvent({
      event_type: "other",
      target_age: 50,
      target_amount: 50000,
      priority: "medium",
      description: ""
    });
    toast.success("Event added");
  };

  // Remove event
  const handleRemoveEvent = (index) => {
    const newEvents = events.filter((_, i) => i !== index);
    setEvents(newEvents);
    toast.success("Event removed");
  };

  // Prepare chart data with milestones highlighted
  const chartData = timelineData?.projections?.filter((_, i) => i % 5 === 0 || 
    timelineData.projections[i]?.is_milestone) || [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-bold">Age {data.age} ({data.year})</p>
          <p className="text-[#1a2744]">Net Worth: {formatCurrency(data.net_worth)}</p>
          <p className="text-muted-foreground">Portfolio: {formatCurrency(data.portfolio_value)}</p>
          {data.debt_remaining > 0 && (
            <p className="text-red-500">Debt: {formatCurrency(data.debt_remaining)}</p>
          )}
          {data.events?.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="font-semibold text-sm">Events:</p>
              {data.events.map((e, i) => (
                <p key={i} className="text-sm text-[#D4A84C]">• {e}</p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="life-timeline-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground flex items-center gap-3">
              <Clock className="h-8 w-8 text-[#D4A84C]" />
              Life Timeline
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan your financial future with interactive milestones
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="add-event-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Life Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Life Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select 
                      value={newEvent.event_type} 
                      onValueChange={(v) => setNewEvent({...newEvent, event_type: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" style={{ color: type.color }} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input 
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      placeholder="e.g., Buy beach house"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Age: {newEvent.target_age}</Label>
                    <Slider
                      value={[newEvent.target_age]}
                      onValueChange={(v) => setNewEvent({...newEvent, target_age: v[0]})}
                      min={currentAge}
                      max={90}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Amount</Label>
                    <Input 
                      type="number"
                      value={newEvent.target_amount}
                      onChange={(e) => setNewEvent({...newEvent, target_amount: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={newEvent.priority} 
                      onValueChange={(v) => setNewEvent({...newEvent, priority: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewEventOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddEvent} className="bg-[#1a2744]">Add Event</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={fetchTimeline} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalculate
            </Button>
          </div>
        </div>

        {/* Parameters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#D4A84C]" />
              Adjust Your Timeline
            </CardTitle>
            <CardDescription>
              Move the sliders to see how changes affect your financial future
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-2">
                <Label>Current Age: {currentAge}</Label>
                <Slider
                  value={[currentAge]}
                  onValueChange={(v) => setCurrentAge(v[0])}
                  min={20}
                  max={70}
                  step={1}
                  data-testid="age-slider"
                />
              </div>
              <div className="space-y-2">
                <Label>Retirement Age: {retirementAge}</Label>
                <Slider
                  value={[retirementAge]}
                  onValueChange={(v) => setRetirementAge(v[0])}
                  min={55}
                  max={75}
                  step={1}
                  data-testid="retirement-slider"
                />
              </div>
              <div className="space-y-2">
                <Label>Life Expectancy: {lifeExpectancy}</Label>
                <Slider
                  value={[lifeExpectancy]}
                  onValueChange={(v) => setLifeExpectancy(v[0])}
                  min={75}
                  max={100}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Annual Savings: {formatCurrency(annualSavings)}</Label>
                <Slider
                  value={[annualSavings]}
                  onValueChange={(v) => setAnnualSavings(v[0])}
                  min={0}
                  max={200000}
                  step={5000}
                  data-testid="savings-slider"
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Return: {expectedReturn}%</Label>
                <Slider
                  value={[expectedReturn]}
                  onValueChange={(v) => setExpectedReturn(v[0])}
                  min={3}
                  max={12}
                  step={0.5}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline Chart</TabsTrigger>
            <TabsTrigger value="milestones" data-testid="tab-milestones">Milestones</TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">Life Events</TabsTrigger>
          </TabsList>

          {/* Timeline Chart Tab */}
          <TabsContent value="timeline" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Current Net Worth</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(timelineData?.summary?.current_net_worth || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">At Retirement (Age {retirementAge})</p>
                  <p className="text-2xl font-bold text-[#1a2744]">
                    {formatCurrency(timelineData?.summary?.projected_retirement_net_worth || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Peak Net Worth</p>
                  <p className="text-2xl font-bold text-[#D4A84C]">
                    {formatCurrency(timelineData?.summary?.peak_net_worth || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">at age {timelineData?.summary?.peak_age}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Years to Retirement</p>
                  <p className="text-2xl font-bold">
                    {timelineData?.summary?.years_until_retirement || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Timeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Net Worth Projection</CardTitle>
                <CardDescription>
                  Your projected wealth over time with life events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-[#1a2744]" />
                  </div>
                ) : (
                  <ChartContainer height={400}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData?.projections || []}>
                        <defs>
                          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1a2744" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#1a2744" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="age" 
                          label={{ value: 'Age', position: 'bottom', offset: -5 }}
                        />
                        <YAxis 
                          tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        
                        {/* Retirement reference line */}
                        <ReferenceLine 
                          x={retirementAge} 
                          stroke="#D4A84C" 
                          strokeDasharray="5 5"
                          label={{ value: 'Retirement', fill: '#D4A84C', fontSize: 12 }}
                        />
                        
                        <Area
                          type="monotone"
                          dataKey="net_worth"
                          name="Net Worth"
                          stroke="#1a2744"
                          fill="url(#netWorthGradient)"
                          strokeWidth={2}
                        />
                        
                        {/* Mark milestones */}
                        {timelineData?.projections?.filter(p => p.is_milestone).map((milestone, idx) => (
                          <ReferenceDot
                            key={idx}
                            x={milestone.age}
                            y={milestone.net_worth}
                            r={8}
                            fill="#D4A84C"
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Milestones</CardTitle>
                <CardDescription>
                  Major financial milestones in your life journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#1a2744] to-[#D4A84C]" />
                  
                  <div className="space-y-6">
                    {timelineData?.milestones?.map((milestone, index) => {
                      const Icon = getEventIcon(milestone.type);
                      return (
                        <div key={index} className="relative flex items-start gap-4 pl-12">
                          <div 
                            className="absolute left-3 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: getEventColor(milestone.type) }}
                          >
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1 bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Badge variant="outline">Age {milestone.age}</Badge>
                                <h4 className="font-semibold mt-1">{milestone.description}</h4>
                                <p className="text-sm text-muted-foreground">Year {milestone.year}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Net Worth</p>
                                <p className="text-xl font-bold text-[#1a2744]">
                                  {formatCurrency(milestone.net_worth_at_milestone)}
                                </p>
                                {milestone.cost > 0 && (
                                  <p className="text-sm text-red-500">-{formatCurrency(milestone.cost)}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Life Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Planned Life Events</CardTitle>
                <CardDescription>
                  Add, edit, or remove events that will impact your finances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event, index) => {
                    const Icon = getEventIcon(event.event_type);
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: getEventColor(event.event_type) }}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{event.description}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <Badge variant="outline">Age {event.target_age}</Badge>
                            <Badge className={
                              event.priority === 'high' ? 'bg-red-500' :
                              event.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }>
                              {event.priority}
                            </Badge>
                            {event.target_amount > 0 && (
                              <span className="text-sm text-muted-foreground">
                                Cost: {formatCurrency(event.target_amount)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveEvent(index)}
                          data-testid={`remove-event-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {events.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No life events planned yet.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setNewEventOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Event
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">About Life Timeline Planning</p>
                <p className="text-sm text-blue-700 mt-1">
                  This projection uses your current financial situation and assumptions about future returns 
                  (default {expectedReturn}% annually) and inflation (2.5%). Actual results will vary based on 
                  market conditions, life changes, and savings behavior. Review and update your timeline 
                  regularly for accurate planning.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default LifeTimeline;
