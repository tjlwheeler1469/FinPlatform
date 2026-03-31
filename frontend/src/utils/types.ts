/**
 * Shared TypeScript types for the Wealth Command Centre app.
 */

export type SupportedLanguage = 'en' | 'zh' | 'vi' | 'el';

export interface LanguageContextType {
  language: SupportedLanguage;
  changeLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  availableLanguages: SupportedLanguage[];
}

export interface ClientInfo {
  id: string;
  name: string;
}

export interface DashboardSummary {
  compliance_score: number;
  scenarios: { total: number; last_30_days: number };
  compliance_checks: { total: number; passed: number; warnings: number; blocked: number };
  breaches: { open: number; resolved: number };
  decisions: { total: number; approved: number; overrides: number };
  audit_logs?: number;
}

export interface AuditLog {
  id?: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_role: string;
  timestamp: string;
  hash?: string;
}

export interface Breach {
  id?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'resolved';
  breach_type: string;
  description: string;
}

export interface ScenarioSet {
  id: string;
  client_id: string;
  compliance_result?: string;
  decision?: string;
  scenarios?: unknown[];
  created_at: string;
}
