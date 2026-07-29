import { describe, expect, it } from 'vitest';
import {
  validateAndParseSuggestion,
  applySuggestion,
  ActionableSuggestion,
  NoChangeSuggestion,
} from '@/src/lib/bank/suggestion';

describe('validateAndParseSuggestion', () => {
  const canonical = 'Lesson text: Students count 10 piso coins in local market.';

  it('parses a valid no_change response for praise review', () => {
    const raw = {
      outcome: 'no_change',
      feedback_summary: 'The reviewer loved the local market theme.',
      reason_no_change: 'The review expresses praise and requests no revisions.',
      teacher_action: 'Keep the current lesson structure.',
    };

    const parsed = validateAndParseSuggestion(raw, canonical);
    expect(parsed.outcome).toBe('no_change');
    if (parsed.outcome === 'no_change') {
      expect(parsed.reason_no_change).toContain('praise');
    }
  });

  it('parses a valid actionable replace response', () => {
    const raw = {
      outcome: 'actionable',
      feedback_summary: 'Reviewer asked for 20 piso coins instead of 10 piso.',
      issue_identified: 'Activity uses 10 piso coins which are less common.',
      evidence_from_review: 'Use 20 piso coins for Grade 3 math.',
      edit_kind: 'replace',
      target_excerpt: '10 piso coins',
      replacement_text: '20 piso coins',
      teacher_action: 'Verify that 20 piso coins fit the lesson objectives.',
    };

    const parsed = validateAndParseSuggestion(raw, canonical);
    expect(parsed.outcome).toBe('actionable');
    if (parsed.outcome === 'actionable') {
      expect(parsed.target_excerpt).toBe('10 piso coins');
    }
  });

  it('rejects a replace suggestion if target_excerpt is not in the resource text', () => {
    const raw = {
      outcome: 'actionable',
      feedback_summary: 'Add Bicol reming typhoon safety.',
      issue_identified: 'Missing typhoon safety.',
      evidence_from_review: 'Add typhoon safety.',
      edit_kind: 'replace',
      target_excerpt: 'Non-existent text in document',
      replacement_text: 'Safety rules',
      teacher_action: 'Review.',
    };

    expect(() => validateAndParseSuggestion(raw, canonical)).toThrow(/not found/);
  });

  it('rejects a replace suggestion if target_excerpt occurs multiple times', () => {
    const textWithDuplicates = 'piso coins and piso coins';
    const raw = {
      outcome: 'actionable',
      feedback_summary: 'Change coins.',
      issue_identified: 'Coins repeated.',
      evidence_from_review: 'Fix coins.',
      edit_kind: 'replace',
      target_excerpt: 'piso coins',
      replacement_text: 'centavos',
      teacher_action: 'Check.',
    };

    expect(() => validateAndParseSuggestion(raw, textWithDuplicates)).toThrow(/occurs 2 times/);
  });
});

describe('applySuggestion', () => {
  const canonical = 'Grade 3 Math: Lesson on buying items.';

  it('applies a replace suggestion deterministically', () => {
    const sug: ActionableSuggestion = {
      outcome: 'actionable',
      feedback_summary: 'Change buying to selling',
      issue_identified: 'Needs selling context',
      evidence_from_review: 'Add selling',
      edit_kind: 'replace',
      target_excerpt: 'buying items',
      replacement_text: 'buying and selling items at the local palengke',
      teacher_action: 'Verify',
    };

    const updated = applySuggestion(canonical, sug);
    expect(updated).toBe('Grade 3 Math: Lesson on buying and selling items at the local palengke.');
  });

  it('applies an append suggestion deterministically', () => {
    const sug: ActionableSuggestion = {
      outcome: 'actionable',
      feedback_summary: 'Add practice problems',
      issue_identified: 'No practice problems',
      evidence_from_review: 'Add 3 exercises',
      edit_kind: 'append',
      target_excerpt: null,
      replacement_text: 'Practice: 1. If Maria has 50 pesos...',
      teacher_action: 'Check answers',
    };

    const updated = applySuggestion(canonical, sug);
    expect(updated).toContain('Practice: 1. If Maria has 50 pesos...');
  });

  it('throws when attempting to apply a no_change suggestion', () => {
    const sug: NoChangeSuggestion = {
      outcome: 'no_change',
      feedback_summary: 'Great work',
      reason_no_change: 'No changes needed',
      teacher_action: 'None',
    };

    expect(() => applySuggestion(canonical, sug)).toThrow(/Cannot apply a no-change/);
  });
});
