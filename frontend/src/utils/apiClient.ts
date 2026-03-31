/**
 * Typed API client utility for Wealth Command.
 * Provides typed fetch wrappers for all backend endpoints.
 */

// Use window.__REACT_APP_BACKEND_URL for runtime config or fallback to build-time env
declare const process: { env: { REACT_APP_BACKEND_URL?: string } };
const API_URL: string = process.env.REACT_APP_BACKEND_URL || '';

// ===================== Types =====================

export interface MarketIndicator {
  symbol: string;
  name: string;
  value: number;
  change: number;
  change_percent: number;
  last_updated: string;
}

export interface MarketDataResponse {
  indicators: MarketIndicator[];
  source: 'live' | 'fallback';
  cached: boolean;
  timestamp: string;
}

export interface NewsHeadline {
  title: string;
  summary: string;
  source: string;
  source_id: string;
  link: string;
  published: string;
  category: string;
}

export interface NewsResponse {
  headlines: NewsHeadline[];
  sources: string[];
  count: number;
  fetched_at: string;
}

export interface ComplianceMetrics {
  totalFiles: number;
  reviewed: number;
  compliant: number;
  minorIssues: number;
  majorIssues: number;
  pendingReview: number;
  avgScore: number;
  overdue: number;
}

export interface AdviceFile {
  id: string;
  client: string;
  type: string;
  date: string;
  adviser: string;
  status: 'compliant' | 'minor_issues' | 'major_issues' | 'pending_review';
  riskProfile: string;
  investmentAmount: number;
  score: number | null;
  findings: string[];
  nextReview: string;
}

export interface ComplianceDashboardResponse {
  metrics: ComplianceMetrics;
  adviceFiles: AdviceFile[];
  timestamp: string;
}

export interface VoiceChatResponse {
  session_id: string;
  transcription?: string;
  response: string;
  error: boolean;
  detail?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

// ===================== Buffett Engine Types =====================

export interface BuffettIdea {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  pe_current: number | null;
  pe_avg: number;
  pe_low: number;
  pe_high: number;
  dividend_yield: number | null;
  market_cap: number | null;
  action: 'BUY' | 'HOLD' | 'AVOID';
  confidence: number;
  upside: string;
  reason: string;
  catalyst: string;
}

export interface SectorRanking {
  sector: string;
  score: number;
}

export interface BuffettScreenResponse {
  ideas: BuffettIdea[];
  sentiment_score: number;
  sentiment_label: string;
  sector_rankings: SectorRanking[];
  source: 'live' | 'fallback';
  timestamp: string;
}

// ===================== API Client =====================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  private async post<T>(path: string, body: FormData | Record<string, unknown>): Promise<T> {
    const isFormData = body instanceof FormData;
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      body: isFormData ? body : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  // Health
  async getHealth(): Promise<HealthResponse> {
    return this.get('/api/health');
  }

  // Market Data
  async getMarketIndicators(): Promise<MarketDataResponse> {
    return this.get('/api/market-data/indicators');
  }

  // News
  async getNewsHeadlines(): Promise<NewsResponse> {
    return this.get('/api/news/headlines');
  }

  // Compliance
  async getComplianceDashboard(): Promise<ComplianceDashboardResponse> {
    return this.get('/api/compliance-docs/dashboard');
  }

  async seedComplianceDemo(): Promise<{ status: string; count: number }> {
    return this.post('/api/compliance-docs/seed-demo', {});
  }

  // Voice Assistant
  async voiceChat(message: string, sessionId?: string): Promise<VoiceChatResponse> {
    const formData = new FormData();
    formData.append('message', message);
    if (sessionId) formData.append('session_id', sessionId);
    return this.post('/api/voice-assistant/chat', formData);
  }

  async voiceTranscribe(audio: Blob, sessionId?: string): Promise<VoiceChatResponse> {
    const formData = new FormData();
    formData.append('audio', audio, 'recording.webm');
    if (sessionId) formData.append('session_id', sessionId);
    return this.post('/api/voice-assistant/transcribe', formData);
  }

  // Buffett Engine
  async getBuffettScreen(): Promise<BuffettScreenResponse> {
    return this.get('/api/buffett-engine/screen');
  }
}

export const apiClient = new ApiClient(API_URL);
export default apiClient;
