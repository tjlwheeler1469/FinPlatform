import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic, MicOff, Send, X, Loader2, Bot, User, AlertCircle, Calculator,
  TrendingUp, TrendingDown, Shield, CheckCircle, DollarSign, Building2,
  Landmark, Users as UsersIcon, Calendar, BarChart3, Target, Sparkles,
  FileText, Scale, Heart, Briefcase, PieChart, BookOpen, XCircle
} from 'lucide-react';
import { useLanguage } from './LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const fmt = (val) => {
  if (!val && val !== 0) return '$0';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
};

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
  return 'default';
};

const VoiceAssistant = ({ isOpen, onClose, currentPath }) => {
  const { t } = useLanguage();
  const pageContext = getPageContext(currentPath);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "G'day! I'm your Halcyon command engine. I can handle retirement projections, CGT calculations, Buffett-style stock analysis, SOA/ROA drafting, compliance checks, insurance gap analysis, trust strategies, and any financial calculation. Ask me anything — voice or text.",
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
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        await processAudio(blob);
      };
      mr.start();
      setIsRecording(true);
    } catch {
      addMsg('assistant', 'Microphone access is needed. Please allow or type your command.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const addMsg = (role, content, resultType = null, resultData = null) => {
    setMessages(prev => [...prev, { role, content, resultType, resultData }]);
  };

  const handleResult = (data) => {
    if (data.transcription) addMsg('user', data.transcription);
    if (!data.success) {
      addMsg('assistant', data.error || 'Something went wrong. Please try again.');
      return;
    }

    const r = data.result || {};
    const rType = r.type || data.result_type || 'general';

    // Generate summary text based on type
    const summaries = {
      retirement_analysis: () => {
        const ra = r.retirement_analysis || {};
        const wif = r.what_if_comparison;
        if (wif?.summary) return wif.summary;
        return ra.is_on_track
          ? `On track — projected surplus of ${fmt(ra.surplus_or_shortfall)}.`
          : `Action needed — projected shortfall of ${fmt(Math.abs(ra.surplus_or_shortfall || 0))}.`;
      },
      buffett_analysis: () => `${r.stock?.name || 'Stock'}: ${r.overall_rating || 'Analysis complete'}. ${r.summary || ''}`.slice(0, 200),
      investment_comparison: () => r.title || 'Investment comparison complete.',
      compliance_check: () => `${r.category || 'Compliance'} check: ${r.summary || 'Review complete.'}`.slice(0, 200),
      soa_draft: () => `${r.document_type || 'SOA'} draft prepared for ${r.client_name || 'client'}.`,
      tax_calculation: () => `${r.calculation_type || 'Tax'}: ${r.result?.explanation || 'Calculation complete.'}`.slice(0, 200),
      insurance_analysis: () => `Insurance gap analysis: Total gap of ${fmt(r.total_gap || 0)}.`,
      trust_strategy: () => `${r.trust_type || 'Trust'} strategy: ${r.summary || 'Analysis complete.'}`.slice(0, 200),
      scenario_analysis: () => r.summary || 'Scenario analysis complete.',
      stock_insight: () => r.summary || 'Market insight generated.',
      general: () => r.response || JSON.stringify(r)
    };

    const summary = (summaries[rType] || summaries.general)();
    addMsg('assistant', summary, rType, r);
  };

  const processAudio = async (blob) => {
    setIsProcessing(true);
    const fd = new FormData();
    fd.append('audio', blob, 'recording.webm');
    fd.append('page_context', pageContext);
    fd.append('session_id', sessionId);
    try {
      const res = await fetch(`${API_URL}/api/voice-command/transcribe-and-process`, { method: 'POST', body: fd });
      if (res.ok) handleResult(await res.json());
      else addMsg('assistant', 'Processing failed. Try again or type your command.');
    } catch {
      addMsg('assistant', 'Connection issue. Please check your internet.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendText = async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    addMsg('user', text);
    setInputText('');
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/voice-command/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, page_context: pageContext, session_id: sessionId }),
      });
      if (res.ok) handleResult(await res.json());
      else addMsg('assistant', 'Something went wrong. Please try again.');
    } catch {
      addMsg('assistant', 'Connection issue. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6" data-testid="voice-assistant-overlay">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md h-[620px] flex flex-col shadow-2xl border-0 bg-background/95 backdrop-blur-xl z-10" data-testid="voice-assistant-panel">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#1a2744] to-[#2a3f6f] text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4A84C]/30 flex items-center justify-center">
              <Bot className="h-5 w-5 text-[#D4A84C]" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Halcyon Command Engine</h3>
              <div className="flex items-center gap-1 flex-wrap">
                <Badge variant="secondary" className="text-[9px] h-4 bg-[#D4A84C]/20 text-[#D4A84C] border-0">{pageContext}</Badge>
                <span className="text-[10px] opacity-60">AFSL-grade analysis</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20" data-testid="voice-assistant-close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Hint */}
        <div className="px-4 py-2 bg-muted/50 border-b">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#D4A84C] flex-shrink-0" />
            Retirement, CGT, Buffett analysis, SOA/ROA drafts, compliance, insurance, trust strategies — ask anything
          </p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={`msg-${idx}`}>
                <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-[#1a2744]/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-[#1a2744]" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-[#1a2744] text-white rounded-br-md' : 'bg-muted rounded-bl-md'
                  }`} data-testid={`chat-message-${idx}`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-slate-600" />
                    </div>
                  )}
                </div>
                {msg.resultData && <ResultCard type={msg.resultType} data={msg.resultData} />}
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-[#1a2744]/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 text-[#1a2744]" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#D4A84C]" />
                  <span className="text-xs text-muted-foreground">Calculating...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Disclaimer */}
        <div className="px-4 py-1">
          <p className="text-[9px] text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-2.5 w-2.5 flex-shrink-0" />
            General advice only per ASIC RG 175. Not personal financial advice.
          </p>
        </div>

        {/* Input */}
        <div className="p-3 border-t flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            className={`rounded-full flex-shrink-0 h-9 w-9 ${isRecording ? 'animate-pulse' : ''}`}
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
            onKeyDown={(e) => e.key === 'Enter' && sendText()}
            placeholder={isRecording ? 'Listening...' : 'Ask anything financial...'}
            disabled={isRecording || isProcessing}
            className="flex-1 rounded-full h-9"
            data-testid="voice-text-input"
          />
          <Button
            size="icon"
            className="rounded-full bg-[#1a2744] hover:bg-[#1a2744]/90 flex-shrink-0 h-9 w-9"
            onClick={sendText}
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

/* ═══════════════════════════════════════════════════════════════
   RESULT CARD ROUTER — dispatches to the right card component
   ═══════════════════════════════════════════════════════════════ */

const ResultCard = ({ type, data }) => {
  const cards = {
    retirement_analysis: RetirementCard,
    buffett_analysis: BuffettCard,
    investment_comparison: InvestmentCompCard,
    compliance_check: ComplianceCard,
    soa_draft: SOACard,
    tax_calculation: TaxCard,
    insurance_analysis: InsuranceCard,
    trust_strategy: TrustCard,
    scenario_analysis: ScenarioCard,
    stock_insight: StockCard,
    general: GeneralCard,
  };
  const Comp = cards[type] || GeneralCard;
  return <div className="ml-10 mt-2"><Comp data={data} /></div>;
};

/* ─── Retirement ─── */
const RetirementCard = ({ data }) => {
  const ra = data.retirement_analysis || {};
  const tc = data.tax_considerations || {};
  const wif = data.what_if_comparison;
  return (
    <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 space-y-2" data-testid="voice-retirement-result">
      <CardLabel icon={<Calculator className="h-3 w-3" />} text="Retirement Analysis" color="emerald" />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <MF label="Income needed" value={`${fmt(ra.annual_income_needed)}/yr`} />
        <MF label="Fund required" value={fmt(ra.total_retirement_fund_needed)} />
        <MF label="Projected" value={fmt(ra.current_trajectory_at_retirement)} />
        <MF label={ra.surplus_or_shortfall >= 0 ? 'Surplus' : 'Shortfall'}
          value={fmt(Math.abs(ra.surplus_or_shortfall || 0))}
          cn={ra.surplus_or_shortfall >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>
      {(tc.estimated_cgt_liability > 0 || tc.franking_credits_value > 0) && (
        <div className="flex gap-3 text-xs pt-1 border-t border-emerald-200">
          {tc.estimated_cgt_liability > 0 && <span className="text-red-600">CGT: {fmt(tc.estimated_cgt_liability)}</span>}
          {tc.franking_credits_value > 0 && <span className="text-green-600">Franking: +{fmt(tc.franking_credits_value)}</span>}
        </div>
      )}
      {wif?.summary && <WhatIfBox wif={wif} />}
      <Recs items={data.recommendations} />
    </div>
  );
};

/* ─── Buffett Analysis ─── */
const BuffettCard = ({ data }) => {
  const ratingColors = {
    'Strong Buy': 'bg-green-100 text-green-800',
    'Buy': 'bg-green-50 text-green-700',
    'Hold': 'bg-amber-50 text-amber-700',
    'Avoid': 'bg-red-50 text-red-700',
    'Strong Avoid': 'bg-red-100 text-red-800',
  };
  return (
    <div className="p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 space-y-2" data-testid="voice-buffett-result">
      <div className="flex items-center justify-between">
        <CardLabel icon={<TrendingUp className="h-3 w-3" />} text={`Buffett Analysis: ${data.stock?.ticker || ''}`} color="amber" />
        {data.overall_rating && (
          <Badge className={`text-[10px] ${ratingColors[data.overall_rating] || 'bg-gray-100'}`}>{data.overall_rating}</Badge>
        )}
      </div>
      {data.stock?.name && <p className="text-xs text-muted-foreground">{data.stock.name} — {data.stock.sector}</p>}
      <div className="space-y-1">
        {data.buffett_criteria?.map((c, i) => (
          <div key={`bc-${i}`} className="flex items-center gap-2 text-xs">
            <CriterionIcon score={c.score} />
            <span className="flex-1 font-medium">{c.criterion}</span>
            <Badge variant="outline" className="text-[9px] h-4">{c.score}</Badge>
          </div>
        ))}
      </div>
      {data.intrinsic_value_estimate && (
        <div className="text-xs pt-1 border-t border-amber-200">
          <span className="text-muted-foreground">Intrinsic value est: </span>
          <span className="font-bold">{data.intrinsic_value_estimate}</span>
        </div>
      )}
      {data.risks?.length > 0 && (
        <div className="text-xs space-y-1 pt-1 border-t border-amber-200">
          {data.risks.map((r, i) => (
            <p key={`risk-${i}`} className="flex items-start gap-1 text-red-600">
              <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />{r}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Investment Comparison ─── */
const InvestmentCompCard = ({ data }) => (
  <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 space-y-2" data-testid="voice-investment-result">
    <CardLabel icon={<PieChart className="h-3 w-3" />} text={data.title || 'Investment Comparison'} color="indigo" />
    <div className="space-y-2">
      {data.asset_classes?.map((ac, i) => (
        <div key={`ac-${i}`} className="p-2 bg-white/60 rounded-lg text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{ac.name}</span>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-[9px] h-4">{ac.risk_level}</Badge>
              <Badge variant="outline" className="text-[9px] h-4">{ac.expected_return}</Badge>
            </div>
          </div>
          <div className="flex gap-3 text-muted-foreground">
            <span>Yield: {ac.income_yield}</span>
            <span>Liquidity: {ac.liquidity}</span>
          </div>
          {ac.suitability && <p className="text-muted-foreground">{ac.suitability}</p>}
        </div>
      ))}
    </div>
    {data.portfolio_suggestion && (
      <div className="text-xs pt-1 border-t border-indigo-200 space-y-1">
        <p className="font-semibold text-indigo-700">Suggested Allocations:</p>
        {Object.entries(data.portfolio_suggestion).map(([k, v]) => (
          <div key={k} className="flex justify-between"><span className="capitalize text-muted-foreground">{k}:</span><span>{v}</span></div>
        ))}
      </div>
    )}
  </div>
);

/* ─── Compliance ─── */
const ComplianceCard = ({ data }) => (
  <div className="p-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 space-y-2" data-testid="voice-compliance-result">
    <div className="flex items-center justify-between">
      <CardLabel icon={<Shield className="h-3 w-3" />} text={`${data.category || 'Compliance'} Check`} color="red" />
      {data.risk_rating && <Badge variant={data.risk_rating === 'High' ? 'destructive' : 'outline'} className="text-[9px] h-4">{data.risk_rating} Risk</Badge>}
    </div>
    {data.checklist?.map((item, i) => (
      <div key={`cl-${i}`} className="flex items-start gap-2 text-xs p-1.5 bg-white/60 rounded">
        <StatusIcon status={item.status} />
        <div className="flex-1">
          <p className="font-medium">{item.item}</p>
          {item.action_needed && <p className="text-muted-foreground">{item.action_needed}</p>}
          {item.regulatory_ref && <p className="text-[10px] text-blue-600">{item.regulatory_ref}</p>}
        </div>
        <Badge variant="outline" className="text-[9px] h-4 flex-shrink-0">{item.status}</Badge>
      </div>
    ))}
    {data.regulatory_framework?.length > 0 && (
      <div className="text-xs pt-1 border-t border-red-200">
        {data.regulatory_framework.map((rf, i) => (
          <p key={`rf-${i}`} className="text-muted-foreground"><strong>{rf.regulation}:</strong> {rf.requirement}</p>
        ))}
      </div>
    )}
    <Recs items={data.recommendations} />
  </div>
);

/* ─── SOA/ROA Draft ─── */
const SOACard = ({ data }) => (
  <div className="p-3 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200 space-y-2" data-testid="voice-soa-result">
    <CardLabel icon={<FileText className="h-3 w-3" />} text={`${data.document_type || 'SOA'} Draft — ${data.client_name || 'Client'}`} color="violet" />
    {data.scope_of_advice && <div className="text-xs"><span className="font-semibold">Scope:</span> {data.scope_of_advice}</div>}
    {data.strategies_recommended?.map((s, i) => (
      <div key={`st-${i}`} className="p-2 bg-white/60 rounded-lg text-xs space-y-1">
        <p className="font-semibold">{s.strategy}</p>
        <p className="text-muted-foreground">{s.rationale}</p>
        {s.risks && <p className="text-red-600 text-[10px]">Risks: {s.risks}</p>}
        {s.alternatives_considered && <p className="text-blue-600 text-[10px]">Alternatives: {s.alternatives_considered}</p>}
      </div>
    ))}
    {data.best_interest_duty_statement && (
      <div className="text-xs p-2 bg-violet-100 rounded">
        <p className="font-semibold text-violet-700">Best Interest Duty (s961B):</p>
        <p className="text-violet-600">{data.best_interest_duty_statement}</p>
      </div>
    )}
    {data.sections?.map((sec, i) => (
      <div key={`sec-${i}`} className="text-xs">
        <p className="font-semibold">{sec.heading}</p>
        <p className="text-muted-foreground">{sec.content}</p>
      </div>
    ))}
  </div>
);

/* ─── Tax Calculation ─── */
const TaxCard = ({ data }) => (
  <div className="p-3 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-300 space-y-2" data-testid="voice-tax-result">
    <CardLabel icon={<DollarSign className="h-3 w-3" />} text={`${data.calculation_type || 'Tax'} Calculation`} color="slate" />
    {data.result && (
      <div className="text-center py-2">
        <p className="text-2xl font-bold text-[#1a2744]">{fmt(data.result.amount)}</p>
        <p className="text-xs text-muted-foreground">{data.result.explanation}</p>
      </div>
    )}
    {data.breakdown?.map((b, i) => (
      <div key={`tb-${i}`} className="flex justify-between text-xs">
        <span className="text-muted-foreground">{b.item}</span>
        <div className="text-right">
          <span className="font-semibold">{fmt(b.amount)}</span>
          {b.note && <p className="text-[10px] text-muted-foreground">{b.note}</p>}
        </div>
      </div>
    ))}
    {data.effective_rate && <div className="text-xs pt-1 border-t"><span className="text-muted-foreground">Effective rate: </span><span className="font-bold">{data.effective_rate}</span></div>}
    {data.tax_tips?.length > 0 && (
      <div className="text-xs pt-1 border-t space-y-1">
        {data.tax_tips.map((tip, i) => (
          <p key={`tip-${i}`} className="flex items-start gap-1 text-green-700"><CheckCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />{tip}</p>
        ))}
      </div>
    )}
  </div>
);

/* ─── Insurance ─── */
const InsuranceCard = ({ data }) => (
  <div className="p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200 space-y-2" data-testid="voice-insurance-result">
    <div className="flex items-center justify-between">
      <CardLabel icon={<Heart className="h-3 w-3" />} text="Insurance Needs Analysis" color="pink" />
      {data.total_gap > 0 && <Badge variant="destructive" className="text-[9px] h-4">Gap: {fmt(data.total_gap)}</Badge>}
    </div>
    {data.needs_analysis?.map((n, i) => (
      <div key={`ins-${i}`} className="p-2 bg-white/60 rounded-lg text-xs space-y-1">
        <div className="flex justify-between font-semibold">
          <span>{n.cover_type}</span>
          {n.gap > 0 && <span className="text-red-600">Gap: {fmt(n.gap)}</span>}
        </div>
        <div className="flex gap-3 text-muted-foreground">
          <span>Need: {fmt(n.recommended_amount)}</span>
          <span>Have: {fmt(n.current_cover)}</span>
        </div>
        {n.premium_estimate && <p className="text-muted-foreground">Est. premium: {n.premium_estimate}</p>}
      </div>
    ))}
    {data.holding_structure_advice && <p className="text-xs text-muted-foreground">{data.holding_structure_advice}</p>}
  </div>
);

/* ─── Trust Strategy ─── */
const TrustCard = ({ data }) => (
  <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 space-y-2" data-testid="voice-trust-result">
    <CardLabel icon={<Building2 className="h-3 w-3" />} text={`${data.trust_type || 'Trust'} Strategy`} color="green" />
    {data.distribution_strategy?.map((d, i) => (
      <div key={`ds-${i}`} className="flex items-center justify-between text-xs p-1.5 bg-white/60 rounded">
        <div>
          <p className="font-semibold">{d.beneficiary}</p>
          <p className="text-muted-foreground">{d.rationale}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">{fmt(d.amount)}</p>
          <p className="text-[10px] text-muted-foreground">@ {d.tax_rate}</p>
        </div>
      </div>
    ))}
    {data.tax_savings > 0 && <div className="text-xs text-green-700 font-bold pt-1 border-t border-green-200">Tax savings: {fmt(data.tax_savings)}</div>}
    {data.compliance_notes?.length > 0 && (
      <div className="text-xs space-y-1 pt-1 border-t border-green-200">
        {data.compliance_notes.map((n, i) => <p key={`cn-${i}`} className="text-muted-foreground">{n}</p>)}
      </div>
    )}
  </div>
);

/* ─── Scenario Analysis ─── */
const ScenarioCard = ({ data }) => (
  <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 space-y-2" data-testid="voice-scenario-result">
    <CardLabel icon={<Target className="h-3 w-3" />} text="Scenario Analysis" color="purple" />
    {data.scenarios?.map((s, i) => (
      <div key={`sc-${i}`} className="p-2 bg-white/60 rounded-lg text-xs">
        <div className="flex justify-between"><span className="font-semibold">{s.name}</span>
          {s.probability && <Badge variant="outline" className="text-[9px] h-4">{s.probability}</Badge>}
        </div>
        <p className="text-muted-foreground">{s.outcome}</p>
        {s.financial_impact && <p className="font-bold">{fmt(s.financial_impact)}</p>}
      </div>
    ))}
    {data.comparison_table?.length > 0 && (
      <div className="text-xs pt-1 border-t border-purple-200">
        {data.comparison_table.map((row, i) => (
          <div key={`ct-${i}`} className="grid grid-cols-3 gap-1 py-0.5">
            <span className="text-muted-foreground">{row.metric}</span>
            <span className="font-medium">{row.scenario_a}</span>
            <span className="font-medium">{row.scenario_b}</span>
          </div>
        ))}
      </div>
    )}
    <Recs items={data.recommendations} />
  </div>
);

/* ─── Stock Insight ─── */
const StockCard = ({ data }) => (
  <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 space-y-2" data-testid="voice-stock-result">
    <CardLabel icon={<BarChart3 className="h-3 w-3" />} text="Market Insight" color="blue" />
    {data.data_points?.map((dp, i) => (
      <div key={`dp-${i}`} className="flex justify-between text-xs"><span className="text-muted-foreground">{dp.label}</span><span className="font-semibold">{dp.value}</span></div>
    ))}
    {data.recommendation && <p className="text-xs text-blue-600 pt-1 border-t border-blue-200">{data.recommendation}</p>}
  </div>
);

/* ─── General ─── */
const GeneralCard = ({ data }) => {
  if (!data.key_points?.length && !data.references?.length) return null;
  return (
    <div className="p-3 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 space-y-2" data-testid="voice-general-result">
      <CardLabel icon={<BookOpen className="h-3 w-3" />} text="Details" color="gray" />
      {data.key_points?.map((kp, i) => (
        <p key={`kp-${i}`} className="text-xs flex items-start gap-1"><CheckCircle className="h-3 w-3 text-[#D4A84C] flex-shrink-0 mt-0.5" />{kp}</p>
      ))}
      {data.references?.length > 0 && (
        <div className="text-[10px] text-muted-foreground pt-1 border-t">Refs: {data.references.join(', ')}</div>
      )}
    </div>
  );
};

/* ─── Shared Helpers ─── */
const CardLabel = ({ icon, text, color }) => (
  <p className={`text-xs font-semibold text-${color}-700 flex items-center gap-1`}>{icon} {text}</p>
);

const MF = ({ label, value, cn = '' }) => (
  <div><span className="text-muted-foreground">{label}: </span><span className={`font-bold ${cn}`}>{value}</span></div>
);

const WhatIfBox = ({ wif }) => (
  <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs" data-testid="what-if-comparison">
    <p className="font-semibold text-blue-700 flex items-center gap-1 mb-1"><Target className="h-3 w-3" /> What-If Comparison</p>
    <p className="text-blue-600">{wif.summary}</p>
    {wif.improvement !== undefined && (
      <p className={`font-bold mt-1 ${wif.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        Impact: {wif.improvement >= 0 ? '+' : ''}{fmt(wif.improvement)}
      </p>
    )}
  </div>
);

const Recs = ({ items }) => {
  if (!items?.length) return null;
  return (
    <div className="text-xs space-y-1 pt-1 border-t border-current/10">
      {items.slice(0, 3).map((rec, i) => (
        <p key={`r-${i}`} className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-[#D4A84C] flex-shrink-0 mt-0.5" />{rec}</p>
      ))}
    </div>
  );
};

const CriterionIcon = ({ score }) => {
  const s = (score || '').toLowerCase();
  if (s.includes('strong') || s === 'pass') return <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />;
  if (s.includes('moderate') || s.includes('marginal')) return <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />;
  return <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />;
};

const StatusIcon = ({ status }) => {
  const s = (status || '').toLowerCase();
  if (s === 'complete' || s === 'pass') return <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />;
  if (s === 'overdue') return <XCircle className="h-3 w-3 text-red-600 flex-shrink-0 mt-0.5" />;
  return <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />;
};

export default VoiceAssistant;
