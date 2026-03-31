import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, X, MessageSquare, Volume2, Loader2, Bot, User, AlertCircle, Calculator } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const VoiceAssistant = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "G'day! I'm your Halcyon Wealth financial planning assistant. Ask me anything about superannuation, investments, tax planning, or retirement strategies. How can I help you today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retirementAnalysis, setRetirementAnalysis] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await sendAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Microphone access is needed for voice input. Please allow microphone access in your browser settings, or type your question instead.'
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudio = async (audioBlob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('session_id', sessionId);

    try {
      const res = await fetch(`${API_URL}/api/voice-assistant/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.transcription) {
          setMessages(prev => [...prev, { role: 'user', content: data.transcription }]);
        }
        if (data.response) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I had trouble processing that. Could you try again or type your question?'
        }]);
      }
    } catch (err) {
      console.error('Voice assistant error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection issue. Please check your internet and try again.'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const isRetirementQuery = (text) => {
    const keywords = ['retire', 'retirement', 'age pension', 'super', 'superannuation', 'cgt', 'franking', 'pension', 'wealth', 'assets', 'years to retirement'];
    const lower = text.toLowerCase();
    return keywords.filter(k => lower.includes(k)).length >= 2;
  };

  const sendTextMessage = async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInputText('');
    setIsProcessing(true);
    setRetirementAnalysis(null);

    // Check if retirement-related
    if (isRetirementQuery(text)) {
      try {
        const res = await fetch(`${API_URL}/api/voice-retirement/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, session_id: sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.structured && data.analysis) {
            setRetirementAnalysis(data.analysis);
            const ra = data.analysis.retirement_analysis || {};
            const summary = ra.is_on_track
              ? `Based on my analysis, this client is on track for retirement with a projected surplus of $${(ra.surplus_or_shortfall || 0).toLocaleString()}. See the detailed breakdown below.`
              : `This client has a projected shortfall of $${Math.abs(ra.surplus_or_shortfall || 0).toLocaleString()}. See the detailed analysis and recommendations below.`;
            setMessages(prev => [...prev, { role: 'assistant', content: summary }]);
            setIsProcessing(false);
            return;
          }
        }
      } catch { /* fall through to regular chat */ }
    }

    try {
      const formData = new FormData();
      formData.append('message', text);
      formData.append('session_id', sessionId);

      const res = await fetch(`${API_URL}/api/voice-assistant/chat`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an issue. Please try again.'
        }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection issue. Please check your internet and try again.'
      }]);
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
              <p className="text-xs opacity-80">{t('voice.subtitle')}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20" data-testid="voice-assistant-close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={`item-${idx}`} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-emerald-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-md'
                      : 'bg-muted rounded-bl-md'
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
            {retirementAnalysis && (
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200" data-testid="voice-retirement-result">
                <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1">
                  <Calculator className="h-3 w-3" /> Retirement Analysis
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {retirementAnalysis.retirement_analysis?.annual_income_needed > 0 && (
                    <div><span className="text-muted-foreground">Income needed:</span> <span className="font-bold">${(retirementAnalysis.retirement_analysis.annual_income_needed || 0).toLocaleString()}/yr</span></div>
                  )}
                  {retirementAnalysis.retirement_analysis?.total_retirement_fund_needed > 0 && (
                    <div><span className="text-muted-foreground">Fund needed:</span> <span className="font-bold">${(retirementAnalysis.retirement_analysis.total_retirement_fund_needed || 0).toLocaleString()}</span></div>
                  )}
                  {retirementAnalysis.tax_considerations?.estimated_cgt_liability > 0 && (
                    <div><span className="text-muted-foreground">CGT:</span> <span className="font-bold text-red-600">${(retirementAnalysis.tax_considerations.estimated_cgt_liability || 0).toLocaleString()}</span></div>
                  )}
                  {retirementAnalysis.tax_considerations?.franking_credits_value > 0 && (
                    <div><span className="text-muted-foreground">Franking:</span> <span className="font-bold text-green-600">+${(retirementAnalysis.tax_considerations.franking_credits_value || 0).toLocaleString()}</span></div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Open Retirement Planner for full analysis</p>
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

        {/* Input Area */}
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

export default VoiceAssistant;
