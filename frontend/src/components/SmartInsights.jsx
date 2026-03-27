import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Brain, Sparkles, Lightbulb, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Plus, Edit2, Trash2, RefreshCw, Target, Shield,
  DollarSign, PieChart, Calendar, ArrowRight, Zap
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Priority colors
const priorityColors = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500', text: 'text-red-700' },
  high: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', text: 'text-amber-700' },
  medium: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500', text: 'text-blue-700' },
  low: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-500', text: 'text-green-700' },
};

// Category icons
const categoryIcons = {
  portfolio: PieChart,
  retirement: Target,
  tax: DollarSign,
  risk: Shield,
  opportunity: TrendingUp,
  action: Zap,
  general: Lightbulb,
};

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

// Single Insight Card
const InsightCard = ({ insight, onEdit, onDelete, isAdvisor }) => {
  const colors = priorityColors[insight.priority] || priorityColors.medium;
  const IconComponent = categoryIcons[insight.category] || Lightbulb;
  
  return (
    <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.bg} border ${colors.border}`}>
              <IconComponent className={`h-4 w-4 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm truncate">{insight.title}</h4>
                {insight.source === 'ai' && (
                  <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                )}
                {insight.source === 'manual' && (
                  <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-700">
                    Manual
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground capitalize">{insight.category}</p>
            </div>
          </div>
          
          <p className="text-sm mb-3">{insight.description}</p>
          
          {insight.impact && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Impact:</span>
              <Badge className={colors.badge}>{insight.impact}</Badge>
            </div>
          )}
          
          {insight.action && (
            <div className="flex items-center gap-2 text-sm bg-white/50 p-2 rounded border">
              <ArrowRight className="h-4 w-4 text-primary" />
              <span>{insight.action}</span>
            </div>
          )}
        </div>
        
        {isAdvisor && (
          <div className="flex flex-col gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7"
              onClick={() => onEdit?.(insight)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 text-red-500 hover:text-red-700"
              onClick={() => onDelete?.(insight.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Add/Edit Insight Dialog
const InsightDialog = ({ open, onOpenChange, insight, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    impact: '',
    action: '',
  });
  
  useEffect(() => {
    if (insight) {
      setFormData({
        title: insight.title || '',
        description: insight.description || '',
        category: insight.category || 'general',
        priority: insight.priority || 'medium',
        impact: insight.impact || '',
        action: insight.action || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        impact: '',
        action: '',
      });
    }
  }, [insight, open]);
  
  const handleSave = () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in title and description');
      return;
    }
    onSave({
      ...formData,
      id: insight?.id || `manual_${Date.now()}`,
      source: 'manual',
      created_at: insight?.created_at || new Date().toISOString(),
    });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{insight ? 'Edit Insight' : 'Add Manual Insight'}</DialogTitle>
          <DialogDescription>
            Add observations or recommendations for this portfolio.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input 
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Rebalancing Opportunity"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the insight..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select 
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="general">General</option>
                <option value="portfolio">Portfolio</option>
                <option value="retirement">Retirement</option>
                <option value="tax">Tax</option>
                <option value="risk">Risk</option>
                <option value="opportunity">Opportunity</option>
                <option value="action">Action Required</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select 
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Impact (optional)</label>
            <Input 
              value={formData.impact}
              onChange={(e) => setFormData(prev => ({ ...prev, impact: e.target.value }))}
              placeholder="e.g., +$5,000/year or +8% confidence"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Recommended Action (optional)</label>
            <Input 
              value={formData.action}
              onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
              placeholder="e.g., Review asset allocation"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            {insight ? 'Update' : 'Add'} Insight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main SmartInsights Component
const SmartInsights = ({ 
  clientId = 'default',
  portfolioData = null,
  retirementData = null,
  isAdvisor = false,
  compact = false,
  maxInsights = 5
}) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInsight, setEditingInsight] = useState(null);
  
  // Generate AI insights based on portfolio and retirement data
  const generateAIInsights = () => {
    const aiInsights = [];
    
    // Portfolio-based insights
    if (portfolioData) {
      const totalValue = portfolioData.totalValue || portfolioData.net_worth || 0;
      
      // Check asset concentration
      if (portfolioData.byType) {
        const entries = Object.entries(portfolioData.byType);
        const maxAllocation = Math.max(...entries.map(([_, v]) => v / totalValue * 100));
        if (maxAllocation > 40) {
          const topAsset = entries.find(([_, v]) => v / totalValue * 100 === maxAllocation);
          aiInsights.push({
            id: 'ai_concentration',
            title: 'Portfolio Concentration Alert',
            description: `${topAsset?.[0] || 'One asset class'} represents ${maxAllocation.toFixed(0)}% of your portfolio. Consider diversifying to reduce risk.`,
            category: 'risk',
            priority: maxAllocation > 60 ? 'high' : 'medium',
            impact: 'Reduced volatility',
            action: 'Review asset allocation',
            source: 'ai',
            created_at: new Date().toISOString()
          });
        }
      }
      
      // Check cash allocation
      const cashPercent = (portfolioData.byType?.Cash || 0) / totalValue * 100;
      if (cashPercent > 20) {
        aiInsights.push({
          id: 'ai_cash_drag',
          title: 'High Cash Allocation',
          description: `You have ${cashPercent.toFixed(0)}% in cash. Consider investing some in growth assets to beat inflation.`,
          category: 'opportunity',
          priority: 'medium',
          impact: `+${formatCurrency(totalValue * 0.03 * (cashPercent - 10) / 100)}/year potential`,
          action: 'Review investment strategy',
          source: 'ai',
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Retirement-based insights
    if (retirementData) {
      const confidence = retirementData.confidence_score || 0;
      const successRate = retirementData.monte_carlo?.success_rate_percent || 0;
      
      // Low confidence insight
      if (confidence < 60) {
        aiInsights.push({
          id: 'ai_low_confidence',
          title: 'Retirement Confidence Below Target',
          description: `Your retirement confidence is ${confidence.toFixed(0)}%. Small changes now can make a big difference.`,
          category: 'retirement',
          priority: confidence < 40 ? 'critical' : 'high',
          impact: 'Improved retirement security',
          action: 'Consider delaying retirement or increasing savings',
          source: 'ai',
          created_at: new Date().toISOString()
        });
      }
      
      // Good confidence insight
      if (confidence >= 80) {
        aiInsights.push({
          id: 'ai_on_track',
          title: 'On Track for Retirement',
          description: `Great news! Your ${confidence.toFixed(0)}% confidence score shows you're well-prepared. Consider estate planning.`,
          category: 'retirement',
          priority: 'low',
          impact: 'Peace of mind',
          action: 'Review estate planning',
          source: 'ai',
          created_at: new Date().toISOString()
        });
      }
      
      // Spending flexibility insight
      const factors = retirementData.confidence_breakdown?.raw_factors || {};
      if ((factors.spending_flexibility || 0) < 0.4) {
        aiInsights.push({
          id: 'ai_spending',
          title: 'Limited Spending Flexibility',
          description: 'Your essential spending is high relative to income. Building a buffer would provide more security.',
          category: 'risk',
          priority: 'high',
          impact: '+10% confidence potential',
          action: 'Review monthly expenses',
          source: 'ai',
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Tax optimization insight (general)
    aiInsights.push({
      id: 'ai_tax',
      title: 'Tax Season Reminder',
      description: 'Review your concessional super contributions before June 30 to maximize tax benefits.',
      category: 'tax',
      priority: 'medium',
      impact: 'Up to $5,625 tax savings',
      action: 'Check super contribution caps',
      source: 'ai',
      created_at: new Date().toISOString()
    });
    
    return aiInsights;
  };
  
  // Load insights
  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      try {
        // Generate AI insights
        const aiInsights = generateAIInsights();
        
        // Try to load saved manual insights from localStorage
        const savedInsights = localStorage.getItem(`smart_insights_${clientId}`);
        const manualInsights = savedInsights ? JSON.parse(savedInsights) : [];
        
        // Combine and sort by priority
        const allInsights = [...aiInsights, ...manualInsights];
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        allInsights.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
        
        setInsights(allInsights);
      } catch (error) {
        console.error('Error loading insights:', error);
      }
      setLoading(false);
    };
    
    loadInsights();
  }, [clientId, portfolioData, retirementData]);
  
  // Save manual insight
  const handleSaveInsight = (insightData) => {
    let updatedInsights;
    
    if (editingInsight) {
      // Update existing
      updatedInsights = insights.map(i => 
        i.id === insightData.id ? insightData : i
      );
    } else {
      // Add new
      updatedInsights = [...insights, insightData];
    }
    
    // Save manual insights to localStorage
    const manualOnly = updatedInsights.filter(i => i.source === 'manual');
    localStorage.setItem(`smart_insights_${clientId}`, JSON.stringify(manualOnly));
    
    setInsights(updatedInsights);
    setEditingInsight(null);
    toast.success(editingInsight ? 'Insight updated' : 'Insight added');
  };
  
  // Delete insight
  const handleDeleteInsight = (insightId) => {
    const updatedInsights = insights.filter(i => i.id !== insightId);
    const manualOnly = updatedInsights.filter(i => i.source === 'manual');
    localStorage.setItem(`smart_insights_${clientId}`, JSON.stringify(manualOnly));
    setInsights(updatedInsights);
    toast.success('Insight removed');
  };
  
  // Edit insight
  const handleEditInsight = (insight) => {
    setEditingInsight(insight);
    setDialogOpen(true);
  };
  
  // Refresh AI insights
  const handleRefresh = () => {
    const aiInsights = generateAIInsights();
    const manualInsights = insights.filter(i => i.source === 'manual');
    const allInsights = [...aiInsights, ...manualInsights];
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    allInsights.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
    setInsights(allInsights);
    toast.success('Insights refreshed');
  };
  
  const displayedInsights = compact ? insights.slice(0, maxInsights) : insights;
  
  return (
    <Card className="border-2 border-purple-100" data-testid="smart-insights">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Smart Insights
                <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI + Manual
                </Badge>
              </CardTitle>
              <CardDescription>Personalized observations and recommendations</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {isAdvisor && (
              <Button 
                size="sm" 
                onClick={() => { setEditingInsight(null); setDialogOpen(true); }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : displayedInsights.length === 0 ? (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              No insights available yet. {isAdvisor && 'Add manual observations or wait for AI analysis.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {displayedInsights.map((insight) => (
              <InsightCard 
                key={insight.id} 
                insight={insight} 
                onEdit={handleEditInsight}
                onDelete={handleDeleteInsight}
                isAdvisor={isAdvisor}
              />
            ))}
            
            {compact && insights.length > maxInsights && (
              <Button variant="outline" className="w-full" onClick={() => {}}>
                View all {insights.length} insights
              </Button>
            )}
          </div>
        )}
        
        <InsightDialog 
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          insight={editingInsight}
          onSave={handleSaveInsight}
        />
      </CardContent>
    </Card>
  );
};

export default SmartInsights;
