/** Parser-specific type definitions for MedTariff.kz */

export interface RawTariffRecord {
  id?: string;
  clinicId: string;
  clinicName: string;
  city: string;
  address?: string;
  phone?: string;
  workingHours?: string;
  sourceUrl: string;
  serviceId?: string;
  serviceNameRaw: string;
  serviceNameNorm?: string;
  category?: string;
  priceKzt: number;
  currency: string;
  durationDays?: number;
  osmsEligible: boolean;
  parsedAt: string;
  isActive: boolean;
  dataHash: string;
}

export interface SourceConfig {
  id: string;
  name: string;
  providerClass: string;
  url: string;
  city: string;
  cronExpression?: string;
  format: 'html' | 'pdf' | 'json-api' | 'docx' | 'xlsx';
  isActive: boolean;
}

export interface NormalizationResult {
  matched: boolean;
  matchedServiceId?: string;
  matchedServiceName?: string;
  confidence: number;
  method: 'exact' | 'synonym' | 'ai' | 'manual' | 'unmatched';
}

export interface ParserRunResult {
  sourceId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  recordsExtracted: number;
  recordsNew: number;
  recordsNormalized: number;
  recordsUnmatched: number;
  errors: ParserError[];
  isSuccessful: boolean;
}

export interface ParserError {
  sourceId: string;
  errorType: 'network' | 'parse' | 'timeout' | 'unknown';
  message: string;
  timestamp: string;
  retryCount: number;
}

export interface ParserRunLog {
  id?: string;
  sourceId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  recordsExtracted: number;
  recordsNew: number;
  recordsNormalized: number;
  recordsUnmatched: number;
  errorCount: number;
  isSuccessful: boolean;
}
