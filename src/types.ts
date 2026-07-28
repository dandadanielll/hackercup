export type ChangeCategory = 'place' | 'transportation' | 'store' | 'food' | 'currency' | 'name' | 'cultural' | 'other';

export interface ChangeItem {
  original: string;
  replacement: string;
  category: ChangeCategory;
}

export interface LocalizeRequest {
  text: string;
  region: string;
  targetLanguage: string;
}

export interface TranslationData {
  text: string;
  language: string;
  notes?: string;
}

export interface LocalizeResponse {
  original: string;
  localized: string;
  changes: ChangeItem[];
  translation: TranslationData;
}

export interface FileExtractResponse {
  extractedText: string;
  fileName: string;
  charCount: number;
}

export interface RegionInfo {
  id: string;
  name: string;
  province: string;
  majorCity: string;
  description: string;
  defaultLanguageId: string;
  commonEntities: {
    transport: string;
    market: string;
    food: string;
    landmark: string;
  };
}

export interface LanguageInfo {
  id: string;
  name: string;
  nativeName: string;
  region: string;
}

export interface SampleLesson {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  description: string;
  text: string;
}
