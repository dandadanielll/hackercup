import { CompetencyMatch, Subject } from '../types';

export interface CompetencyEntry {
  grade: number;
  subject: Subject;
  quarter: number;
  competencyCode: string;
  competencyText: string;
}

// ─── Hand-curated DepEd MATATAG / MELC competencies for demo scope ─────────
// Scoped to G2–G5, Math/Science/English/Filipino, Q1 only for MVP demo.
// Expand this table before the live demo if more combos are needed.
export const COMPETENCY_LOOKUP: CompetencyEntry[] = [
  // Grade 2 – English – Q1
  {
    grade: 2,
    subject: 'english',
    quarter: 1,
    competencyCode: 'EN2OL-Ia-b-1',
    competencyText:
      'Use words that describe community helpers, places, and transportation in one\'s own community.',
  },
  // Grade 2 – Math – Q1
  {
    grade: 2,
    subject: 'math',
    quarter: 1,
    competencyCode: 'M2NS-Ia-1.1',
    competencyText:
      'Visualizes and represents numbers from 0–1000 with emphasis on numbers 101–1000 using groups of hundreds, tens, and ones.',
  },
  // Grade 3 – Math – Q1
  {
    grade: 3,
    subject: 'math',
    quarter: 1,
    competencyCode: 'M3NS-Ic-15',
    competencyText:
      'Solves routine and non-routine problems involving multiplication and addition of whole numbers including money using appropriate problem-solving strategies and tools.',
  },
  // Grade 3 – Filipino – Q1
  {
    grade: 3,
    subject: 'filipino',
    quarter: 1,
    competencyCode: 'F3PB-Ia-b-1',
    competencyText:
      'Natutukoy ang kahulugan ng mga salitang ginagamit sa araw-araw na pakikipag-usap sa komunidad.',
  },
  // Grade 4 – Science – Q1
  {
    grade: 4,
    subject: 'science',
    quarter: 1,
    competencyCode: 'S4LT-Ia-b-1',
    competencyText:
      'Describes the characteristics of living things found in the local environment and their role in a local ecosystem.',
  },
  // Grade 5 – Science – Q1
  {
    grade: 5,
    subject: 'science',
    quarter: 1,
    competencyCode: 'S5MT-Ia-1',
    competencyText:
      'Identifies the different modes of transportation in the community and explains how local markets distribute farm produce to households.',
  },
  // Grade 5 – Math – Q1
  {
    grade: 5,
    subject: 'math',
    quarter: 1,
    competencyCode: 'M5NS-Ia-1.1',
    competencyText:
      'Solves multi-step problems involving multiplication and division of whole numbers including money using appropriate strategies and tools.',
  },
  // Grade 6 – English – Q1
  {
    grade: 6,
    subject: 'english',
    quarter: 1,
    competencyCode: 'EN6RC-Ia-2.2.2',
    competencyText:
      'Draws conclusions and makes inferences from a variety of texts about community and environment.',
  },
  // Grade 3 – Math – Q2
  {
    grade: 3,
    subject: 'math',
    quarter: 2,
    competencyCode: 'M3NS-IIa-20',
    competencyText:
      'Visualizes and represents fractions that are equal to one and more than one using regions, sets, and the number line.',
  },
  // Grade 4 – Math – Q1
  {
    grade: 4,
    subject: 'math',
    quarter: 1,
    competencyCode: 'M4NS-Ia-1.1',
    competencyText:
      'Visualizes numbers up to 100,000 with emphasis on numbers 10,001–100,000 using place value concepts.',
  },
];

export function getCompetency(
  grade: number,
  subject: string,
  quarter: number
): CompetencyEntry | null {
  return (
    COMPETENCY_LOOKUP.find(
      (c) => c.grade === grade && c.subject === subject && c.quarter === quarter
    ) ?? null
  );
}

export function buildCompetencyMatch(entry: CompetencyEntry | null): CompetencyMatch {
  if (!entry) return { found: false };
  return {
    found: true,
    competencyCode: entry.competencyCode,
    competencyText: entry.competencyText,
  };
}
