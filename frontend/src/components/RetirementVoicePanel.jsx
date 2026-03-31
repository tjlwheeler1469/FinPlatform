import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Mic, MicOff, Send, Loader2, Calculator, DollarSign, Calendar, TrendingUp,
  Shield, AlertTriangle, CheckCircle, Users, Building2, Landmark, Info, Target, Download
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (val) => {
  if (val === null || val === undefined) return '$0';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
};

const RetirementVoicePanel = () => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [textResponse, setTextResponse] = useState('');
  const [whatIfHistory, setWhatIfHistory] = useState([]);
  const [sessionId] = useState(() => `ret_${Date.now()}`);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await analyzeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Listening... Describe the client's details");
    } catch {
      toast.error('Microphone access needed. Please allow access or type instead.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processResponse = (data) => {
    if (data.transcription) setTranscription(data.transcription);

    const result = data.result || data.analysis;
    if (!result) {
      setTextResponse(data.response || 'Could not process. Try again.');
      return;
    }

    // Handle unified command response
    if (result.type === 'retirement_analysis' || result.retirement_analysis) {
      const analysisData = result.type ? result : data.analysis;
      if (analysis && result.what_if_comparison) {
        setWhatIfHistory(prev => [...prev, { input: data.raw_input || transcription, comparison: result.what_if_comparison }]);
      }
      setAnalysis(analysisData);
    } else if (result.response) {
      setTextResponse(result.response);
    }
  };

  const analyzeAudio = async (audioBlob) => {
    setIsProcessing(true);
    setTextResponse('');
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('page_context', 'retirement');
    formData.append('session_id', sessionId);

    try {
      const res = await fetch(`${API_URL}/api/voice-command/transcribe-and-process`, {
        method: 'POST', body: formData,
      });
      if (res.ok) processResponse(await res.json());
      else toast.error('Analysis failed. Please try again.');
    } catch {
      toast.error('Connection issue. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeText = async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;

    setIsProcessing(true);
    setTextResponse('');
    setTranscription(text);

    try {
      const res = await fetch(`${API_URL}/api/voice-command/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, page_context: 'retirement', session_id: sessionId }),
      });
      if (res.ok) processResponse(await res.json());
      else toast.error('Analysis failed. Please try again.');
    } catch {
      toast.error('Connection issue. Please try again.');
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  };

  return (
    <Card className="border-[#D4A84C]/30" data-testid="retirement-voice-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Mic className="h-5 w-5 text-[#D4A84C]" />
              Voice Retirement Analyser
            </CardTitle>
            <CardDescription>
              Speak or type client details for instant retirement analysis with CGT & franking credits. Supports what-if follow-ups.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">AI-Powered</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Area */}
        <div className="flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            className={`rounded-full flex-shrink-0 ${isRecording ? 'animate-pulse' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            data-testid="retirement-voice-mic"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyzeText()}
            placeholder={
              isRecording ? 'Listening...'
              : analysis ? 'Try: "What if they add $20K/yr to super?" or "What if they sell the property?"'
              : 'e.g. "Client age 55, wealth $2.5M, super $800K in SMSF, wants to retire at 65"'
            }
            disabled={isRecording || isProcessing}
            className="flex-1"
            data-testid="retirement-voice-input"
          />
          <Button
            size="icon"
            className="rounded-full bg-[#1a2744] hover:bg-[#1a2744]/90 flex-shrink-0"
            onClick={analyzeText}
            disabled={!inputText.trim() || isProcessing}
            data-testid="retirement-voice-send"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Recording... Click stop when finished
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center gap-3 py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" />
            <span className="text-sm text-muted-foreground">Analysing retirement position...</span>
          </div>
        )}

        {transcription && !isProcessing && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Input received:</p>
            <p className="text-sm italic">"{transcription}"</p>
          </div>
        )}

        {textResponse && !analysis && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{textResponse}</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/api/pdf-report/generate`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ analysis_data: analysis }),
                    });
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Halcyon_retirement_analysis.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success('PDF downloaded');
                    }
                  } catch { toast.error('PDF generation failed'); }
                }}
                data-testid="retirement-download-pdf"
              >
                <Download className="h-3 w-3" /> Download PDF Report
              </Button>
            </div>
            <AnalysisResults analysis={analysis} whatIfHistory={whatIfHistory} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AnalysisResults = ({ analysis, whatIfHistory = [] }) => {
  const cs = analysis.client_summary || {};
  const cp = analysis.current_position || {};
  const ra = analysis.retirement_analysis || {};
  const tc = analysis.tax_considerations || {};
  const ap = analysis.age_pension || {};
  const entities = analysis.entities || [];
  const recs = analysis.recommendations || [];
  const assumptions = analysis.assumptions || [];
  const wif = analysis.what_if_comparison;

  return (
    <ScrollArea className="max-h-[500px]" data-testid="retirement-analysis-results">
      <div className="space-y-4">
        {/* What-If Comparison (if present) */}
        {wif && wif.summary && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <p className="font-semibold text-sm text-blue-700">What-If Comparison</p>
              </div>
              <p className="text-sm text-blue-600">{wif.summary}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {wif.original_shortfall !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Original</p>
                    <p className="font-bold">{formatCurrency(wif.original_shortfall)}</p>
                  </div>
                )}
                {wif.new_shortfall !== undefined && (
                  <div>
                    <p className="text-muted-foreground">After Change</p>
                    <p className="font-bold">{formatCurrency(wif.new_shortfall)}</p>
                  </div>
                )}
                {wif.improvement !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Improvement</p>
                    <p className={`font-bold ${wif.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {wif.improvement >= 0 ? '+' : ''}{formatCurrency(wif.improvement)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* What-If History */}
        {whatIfHistory.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scenario History</p>
            {whatIfHistory.map((wh, i) => (
              <div key={`wh-${i}`} className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded">
                <Badge variant="outline" className="text-[9px] h-4">#{i + 1}</Badge>
                <span className="flex-1 text-muted-foreground">{wh.input}</span>
                {wh.comparison?.improvement !== undefined && (
                  <span className={`font-bold ${wh.comparison.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {wh.comparison.improvement >= 0 ? '+' : ''}{formatCurrency(wh.comparison.improvement)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Client Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat icon={<Users className="h-4 w-4" />} label="Age" value={cs.age || '-'} />
          <MiniStat icon={<Calendar className="h-4 w-4" />} label="Retire at" value={cs.retirement_age || '-'} />
          <MiniStat icon={<Calculator className="h-4 w-4" />} label="Years to go" value={cs.years_to_retirement || '-'} />
          <MiniStat icon={<DollarSign className="h-4 w-4" />} label="Total Wealth" value={formatCurrency(cp.total_wealth)} />
        </div>

        {/* Current Position */}
        {cp.total_wealth > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Position</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {cp.super_balance > 0 && <PositionRow label="Super" value={cp.super_balance} />}
                {cp.investment_assets > 0 && <PositionRow label="Investments" value={cp.investment_assets} />}
                {cp.property_value > 0 && <PositionRow label="Property" value={cp.property_value} />}
                {cp.cash_savings > 0 && <PositionRow label="Cash" value={cp.cash_savings} />}
                {cp.other_assets > 0 && <PositionRow label="Other" value={cp.other_assets} />}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entity Breakdown */}
        {entities.length > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entity Structure</p>
              {entities.map((ent, i) => (
                <div key={`entity-${i}`} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <EntityIcon type={ent.type} />
                    <span>{ent.name}</span>
                    <Badge variant="outline" className="text-[10px]">{ent.type}</Badge>
                  </div>
                  <span className="font-semibold">{formatCurrency(ent.value)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Retirement Analysis */}
        <Card className={ra.is_on_track ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              {ra.is_on_track
                ? <CheckCircle className="h-5 w-5 text-green-600" />
                : <AlertTriangle className="h-5 w-5 text-amber-600" />
              }
              <p className="font-semibold text-sm">
                {ra.is_on_track ? 'On Track for Retirement' : 'Action Required'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Annual Income Needed</p>
                <p className="font-bold text-base">{formatCurrency(ra.annual_income_needed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Fund Required</p>
                <p className="font-bold text-base">{formatCurrency(ra.total_retirement_fund_needed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projected at Retirement</p>
                <p className="font-bold text-base">{formatCurrency(ra.current_trajectory_at_retirement)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ra.surplus_or_shortfall >= 0 ? 'Surplus' : 'Shortfall'}</p>
                <p className={`font-bold text-base ${ra.surplus_or_shortfall >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {ra.surplus_or_shortfall >= 0 ? '+' : ''}{formatCurrency(ra.surplus_or_shortfall)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Considerations */}
        <Card className="bg-muted/30">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Shield className="h-3 w-3" /> Tax Considerations
            </p>
            <div className="space-y-2 text-sm">
              {tc.estimated_cgt_liability > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. CGT Liability</span>
                  <span className="font-semibold text-red-600">{formatCurrency(tc.estimated_cgt_liability)}</span>
                </div>
              )}
              {tc.cgt_discount_available && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGT Discount</span>
                  <span className="text-sm">{tc.cgt_discount_available}</span>
                </div>
              )}
              {tc.franking_credits_value > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Franking Credits</span>
                  <span className="font-semibold text-green-600">+{formatCurrency(tc.franking_credits_value)}</span>
                </div>
              )}
              {tc.franking_credits_explanation && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">{tc.franking_credits_explanation}</p>
              )}
              {tc.super_tax_rate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Super Tax Rate</span>
                  <span>{tc.super_tax_rate}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Age Pension */}
        <Card className="bg-muted/30">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Landmark className="h-3 w-3" /> Age Pension Estimate
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Eligible</span>
                <Badge variant={ap.eligible ? 'default' : 'outline'}>{ap.eligible ? 'Yes' : 'No'}</Badge>
              </div>
              {ap.estimated_fortnightly > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Fortnightly</span>
                  <span className="font-semibold">{formatCurrency(ap.estimated_fortnightly)}</span>
                </div>
              )}
              {ap.assets_test_impact && (
                <p className="text-xs text-muted-foreground">{ap.assets_test_impact}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {recs.length > 0 && (
          <Card className="border-[#D4A84C]/30">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Recommendations
              </p>
              <ul className="space-y-2">
                {recs.map((rec, i) => (
                  <li key={`rec-${i}`} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-[#D4A84C] mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Assumptions */}
        {assumptions.length > 0 && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <Info className="h-3 w-3" /> Assumptions
            </p>
            <ul className="space-y-1">
              {assumptions.map((a, i) => (
                <li key={`asm-${i}`} className="text-xs text-muted-foreground">{a}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.disclaimer && (
          <p className="text-[10px] text-muted-foreground flex items-start gap-1 p-2 bg-amber-50 rounded">
            <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5 text-amber-500" />
            {analysis.disclaimer}
          </p>
        )}
      </div>
    </ScrollArea>
  );
};

const MiniStat = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
    <div className="text-[#D4A84C]">{icon}</div>
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-bold text-sm">{value}</p>
    </div>
  </div>
);

const PositionRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold">{formatCurrency(value)}</span>
  </div>
);

const EntityIcon = ({ type }) => {
  switch (type?.toLowerCase()) {
    case 'trust': return <Building2 className="h-3 w-3 text-green-600" />;
    case 'company': return <Building2 className="h-3 w-3 text-amber-600" />;
    case 'smsf': return <Landmark className="h-3 w-3 text-pink-600" />;
    default: return <Users className="h-3 w-3 text-blue-600" />;
  }
};

export default RetirementVoicePanel;
