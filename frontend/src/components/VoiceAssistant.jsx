import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic, MicOff, Send, X, Loader2, Bot, User, AlertCircle, Calculator,
  TrendingUp, TrendingDown, Shield, CheckCircle, DollarSign, Building2,
  Landmark, Users as UsersIcon, Calendar, BarChart3, Target, Sparkles
} from 'lucide-react';
import { useLanguage } from './LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (val) => {
  if (!val && val !== 0) return '$0';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
};

// Derive page context from pathname
const getPageContext = (pathname) => {
  if (!pathname) return 'default';
  const p = pathname.toLowerCase();
  if (p.includes('retirement') || p.includes('super')) return 'retirement';
  if (p.includes('share') || p.includes('stock') || p.includes('market')) return 'shares';
  if (p.includes('adviceos') || p.includes('advice')) return 'adviceos';
  if (p.includes('strategic') || p.includes('scenario') || p.includes('goal')) return 'strategic';
  if (p.includes('insurance')) return 'insurance';
  if (p.includes('trust') || p.includes('distribution')) return 'trust';
  if (p.includes('client') || p.includes('crm') || p.includes('360')) return 'client';
  if (p.includes('practice') || p.includes('invoice')) return 'practice';
  if (p.includes('compliance') || p.includes('audit')) return 'adviceos';
  if (p.includes('dashboard') || p === '/') return 'dashboard';
  return 'default';
};

const CONTEXT_HINTS = {
  retirement: 'Try: "Client age 55, wealth $2.5M, super $800K, retire at 65" or "What if they add $20K/yr to super?"',
  shares: 'Try: "How is BHP performing?" or "Should I rebalance the tech allocation?"',
  adviceos: 'Try: "Run a compliance check for Wheeler" or "Generate a scenario for conservative rebalancing"',
  strategic: 'Try: "Compare downsizing vs staying" or "Project net worth in 10 years"',
  insurance: 'Try: "Check life cover gap for a 45yo with $1M mortgage"',
  trust: 'Try: "Optimal distribution strategy for family trust with 3 beneficiaries"',
  client: 'Try: "Show me overdue tasks" or "Schedule a review for Smith"',
  dashboard: 'Try: "Portfolio summary" or "Client age 55, super $800K, retire at 65"',
  default: 'Ask anything about financial planning, super, tax, or investments...'
};

const VoiceAssistant = ({ isOpen, onClose, currentPath }) => {
  const { t } = useLanguage();
  const pageContext = getPageContext(currentPath);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "G'day! I'm your Halcyon voice command assistant. I adapt to whatever page you're on — ask about retirement, stocks, compliance, or anything else. Try speaking or typing a command.",
      resultType: null
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId] = useState(() => `cmd_${Date.now()}`);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        await processAudio(blob);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      addMessage('assistant', 'Microphone access is needed for voice input. Please allow access or type your command instead.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const addMessage = (role, content, resultType = null, resultData = null) => {
    setMessages(prev => [...prev, { role, content, resultType, resultData }]);
  };

  const handleResult = (data) => {
    if (data.transcription) addMessage('user', data.transcription);

    if (data.structured && data.result) {
      const r = data.result;
      const rType = r.type || data.result_type || 'general';

      if (rType === 'retirement_analysis') {
        const ra = r.retirement_analysis || {};
        const wif = r.what_if_comparison;
        let summary;
        if (wif && wif.summary) {
          summary = wif.summary;
        } else {
          summary = ra.is_on_track
            ? `On track — projected surplus of ${formatCurrency(ra.surplus_or_shortfall)}.`
            : `Action needed — projected shortfall of ${formatCurrency(Math.abs(ra.surplus_or_shortfall || 0))}.`;
        }
        addMessage('assistant', summary, 'retirement', r);
      } else if (rType === 'stock_insight') {
        addMessage('assistant', r.summary || 'Here are the stock insights:', 'stock', r);
      } else if (rType === 'compliance_check') {
        addMessage('assistant', r.summary || 'Compliance check complete:', 'compliance', r);
      } else if (rType === 'scenario_analysis') {
        addMessage('assistant', r.summary || 'Scenario analysis:', 'scenario', r);
      } else {
        addMessage('assistant', r.response || JSON.stringify(r));
      }
    } else if (data.result?.response) {
      addMessage('assistant', data.result.response);
    } else {
      addMessage('assistant', 'I processed your request but got an unexpected response format.');
    }
  };

  const processAudio = async (blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    formData.append('page_context', pageContext);
    formData.append('session_id', sessionId);

    try {
      const res = await fetch(`${API_URL}/api/voice-command/transcribe-and-process`, {
        method: 'POST', body: formData,
      });
      if (res.ok) handleResult(await res.json());
      else addMessage('assistant', 'Sorry, I had trouble processing that. Try again or type your command.');
    } catch {
      addMessage('assistant', 'Connection issue. Please check your internet and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendTextMessage = async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    addMessage('user', text);
    setInputText('');
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_URL}/api/voice-command/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, page_context: pageContext, session_id: sessionId }),
      });
      if (res.ok) handleResult(await res.json());
      else addMessage('assistant', 'Sorry, I encountered an issue. Please try again.');
    } catch {
      addMessage('assistant', 'Connection issue. Please check your internet and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6" data-testid="voice-assistant-overlay">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md h-[600px] flex flex-col shadow-2xl border-0 bg-background/95 backdrop-blur-xl z-10" data-testid="voice-assistant-panel">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{t('voice.title')}</h3>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px] h-4 bg-white/20 text-white border-0">
                  {pageContext}
                </Badge>
                <span className="text-[10px] opacity-70">context</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20" data-testid="voice-assistant-close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Context hint */}
        <div className="px-4 py-2 bg-muted/50 border-b">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#D4A84C] flex-shrink-0" />
            {CONTEXT_HINTS[pageContext] || CONTEXT_HINTS.default}
          </p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={`msg-${idx}`}>
                <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-emerald-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-md' : 'bg-muted rounded-bl-md'
                    }`}
                    data-testid={`chat-message-${idx}`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                  )}
                </div>
                {/* Structured result cards */}
                {msg.resultType === 'retirement' && msg.resultData && (
                  <RetirementResultCard data={msg.resultData} />
                )}
                {msg.resultType === 'stock' && msg.resultData && (
                  <StockResultCard data={msg.resultData} />
                )}
                {msg.resultType === 'compliance' && msg.resultData && (
                  <ComplianceResultCard data={msg.resultData} />
                )}
                {msg.resultType === 'scenario' && msg.resultData && (
                  <ScenarioResultCard data={msg.resultData} />
                )}
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Disclaimer */}
        <div className="px-4 py-1">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {t('voice.disclaimer')}
          </p>
        </div>

        {/* Input */}
        <div className="p-3 border-t flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            className={`rounded-full flex-shrink-0 ${isRecording ? 'animate-pulse' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            data-testid="voice-mic-button"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
            placeholder={isRecording ? t('voice.recording') : t('voice.placeholder')}
            disabled={isRecording || isProcessing}
            className="flex-1 rounded-full"
            data-testid="voice-text-input"
          />
          <Button
            size="icon"
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
            onClick={sendTextMessage}
            disabled={!inputText.trim() || isProcessing}
            data-testid="voice-send-button"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

/* ─── Structured Result Cards ─── */

const RetirementResultCard = ({ data }) => {
  const ra = data.retirement_analysis || {};
  const tc = data.tax_considerations || {};
  const wif = data.what_if_comparison;

  return (
    <div className="ml-11 mt-2 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 space-y-2" data-testid="voice-retirement-result">
      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
        <Calculator className="h-3 w-3" /> Retirement Analysis
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <MiniField label="Income needed" value={`${formatCurrency(ra.annual_income_needed)}/yr`} />
        <MiniField label="Fund required" value={formatCurrency(ra.total_retirement_fund_needed)} />
        <MiniField label="Projected" value={formatCurrency(ra.current_trajectory_at_retirement)} />
        <MiniField
          label={ra.surplus_or_shortfall >= 0 ? 'Surplus' : 'Shortfall'}
          value={formatCurrency(Math.abs(ra.surplus_or_shortfall || 0))}
          className={ra.surplus_or_shortfall >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>
      {(tc.estimated_cgt_liability > 0 || tc.franking_credits_value > 0) && (
        <div className="flex gap-3 text-xs pt-1 border-t border-emerald-200">
          {tc.estimated_cgt_liability > 0 && (
            <span className="text-red-600">CGT: {formatCurrency(tc.estimated_cgt_liability)}</span>
          )}
          {tc.franking_credits_value > 0 && (
            <span className="text-green-600">Franking: +{formatCurrency(tc.franking_credits_value)}</span>
          )}
        </div>
      )}
      {wif && wif.summary && (
        <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs" data-testid="what-if-comparison">
          <p className="font-semibold text-blue-700 flex items-center gap-1 mb-1">
            <Target className="h-3 w-3" /> What-If Comparison
          </p>
          <p className="text-blue-600">{wif.summary}</p>
          {wif.improvement !== undefined && (
            <p className={`font-bold mt-1 ${wif.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Impact: {wif.improvement >= 0 ? '+' : ''}{formatCurrency(wif.improvement)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const StockResultCard = ({ data }) => (
  <div className="ml-11 mt-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 space-y-2" data-testid="voice-stock-result">
    <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
      <BarChart3 className="h-3 w-3" /> Stock Insight
    </p>
    {data.data_points?.map((dp, i) => (
      <div key={`dp-${i}`} className="flex justify-between text-xs">
        <span className="text-muted-foreground">{dp.label}</span>
        <span className="font-semibold">{dp.value}</span>
      </div>
    ))}
    {data.recommendation && (
      <p className="text-xs text-blue-600 pt-1 border-t border-blue-200">{data.recommendation}</p>
    )}
  </div>
);

const ComplianceResultCard = ({ data }) => (
  <div className="ml-11 mt-2 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 space-y-2" data-testid="voice-compliance-result">
    <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
      <Shield className="h-3 w-3" /> Compliance Check
    </p>
    {data.checklist?.map((item, i) => (
      <div key={`cl-${i}`} className="flex items-center gap-2 text-xs">
        <CheckCircle className={`h-3 w-3 flex-shrink-0 ${item.status === 'complete' || item.status === 'pass' ? 'text-green-600' : 'text-amber-500'}`} />
        <span className="flex-1">{item.item}</span>
        <Badge variant="outline" className="text-[9px] h-4">{item.status}</Badge>
      </div>
    ))}
    {data.regulatory_refs?.length > 0 && (
      <p className="text-[10px] text-muted-foreground pt-1 border-t border-amber-200">
        Refs: {data.regulatory_refs.join(', ')}
      </p>
    )}
  </div>
);

const ScenarioResultCard = ({ data }) => (
  <div className="ml-11 mt-2 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 space-y-2" data-testid="voice-scenario-result">
    <p className="text-xs font-semibold text-purple-700 flex items-center gap-1">
      <Target className="h-3 w-3" /> Scenario Analysis
    </p>
    {data.scenarios?.map((s, i) => (
      <div key={`sc-${i}`} className="p-2 bg-white/60 rounded-lg text-xs">
        <p className="font-semibold">{s.name}</p>
        <p className="text-muted-foreground">{s.outcome}</p>
        {s.probability && <Badge variant="outline" className="text-[9px] h-4 mt-1">{s.probability}</Badge>}
      </div>
    ))}
    {data.recommendations?.length > 0 && (
      <div className="pt-1 border-t border-purple-200">
        {data.recommendations.map((rec, i) => (
          <p key={`rec-${i}`} className="text-xs text-purple-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3 flex-shrink-0" /> {rec}
          </p>
        ))}
      </div>
    )}
  </div>
);

const MiniField = ({ label, value, className = '' }) => (
  <div>
    <span className="text-muted-foreground">{label}: </span>
    <span className={`font-bold ${className}`}>{value}</span>
  </div>
);

export default VoiceAssistant;
