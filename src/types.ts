// ─── Substitution Category ────────────────────────────────────────────────
export type SubstitutionCategory = 'entity' | 'scenario_reframe';
export type EntityType = 'transport' | 'place' | 'food' | 'currency' | 'character_name' | 'other';

// ─── Change Item ──────────────────────────────────────────────────────────
export interface ChangeItem {
  original: string;
  replacement: string;
  category: SubstitutionCategory;
  entityType?: EntityType; // only for category === 'entity'
}

// ─── Region ───────────────────────────────────────────────────────────────
export const REGION_KEYS = ['ncr', 'bicol', 'central_visayas'] as const;
export type RegionKey = typeof REGION_KEYS[number];

export interface RegionProfile {
  name: string;
  motherTongue: string;
  motherTongueLabel: string;
  environment: string;
  environmentDescriptor: string;
  knownEntities: {
    transport: string[];
    places: string[];
    food: string[];
  };
}

// ─── Subject ──────────────────────────────────────────────────────────────
export const SUPPORTED_SUBJECTS = ['math', 'science', 'english', 'filipino'] as const;
export type Subject = typeof SUPPORTED_SUBJECTS[number];

// ─── Upload Metadata ──────────────────────────────────────────────────────
export interface UploadMetadata {
  grade: number;   // 1-6
  subject: Subject;
  quarter: number; // 1-4
  region: RegionKey;
}

// ─── API Request ──────────────────────────────────────────────────────────
export interface LocalizeRequest {
  text: string;
  region: RegionKey;
  grade: number;
  subject: Subject;
  quarter: number;
}

// ─── Competency ───────────────────────────────────────────────────────────
export interface CompetencyMatch {
  found: boolean;
  competencyCode?: string;
  competencyText?: string;
  alignmentNote?: string;
}

// ─── Translation ──────────────────────────────────────────────────────────
export interface TranslationData {
  text: string;
  language: string;
  notes?: string;
}

// ─── API Response ─────────────────────────────────────────────────────────
export interface LocalizeResponse {
  original: string;
  localized: string;
  changes: ChangeItem[];
  translation: TranslationData;
  competencyMatch: CompetencyMatch;
}

// ─── File Extract ─────────────────────────────────────────────────────────
export interface FileExtractResponse {
  extractedText: string;
  fileName: string;
  charCount: number;
}

// ─── Legacy types (kept for backward compat with sample data) ─────────────
export interface SampleLesson {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  description: string;
  text: string;
}
