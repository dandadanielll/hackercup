export type NoChangeSuggestion = {
  outcome: 'no_change';
  feedback_summary: string;
  reason_no_change: string;
  teacher_action: string;
};

export type ActionableSuggestion = {
  outcome: 'actionable';
  feedback_summary: string;
  issue_identified: string;
  evidence_from_review: string;
  edit_kind: 'replace' | 'append';
  target_excerpt: string | null;
  replacement_text: string;
  teacher_action: string;
};

export type GroundedSuggestion = NoChangeSuggestion | ActionableSuggestion;

/**
 * Validates a raw JSON payload from Groq against the GroundedSuggestion contract and canonical resource text.
 * Throws a specific Error if the model output is malformed or invalid for the resource.
 */
export function validateAndParseSuggestion(
  rawJson: any,
  canonicalText: string
): GroundedSuggestion {
  if (!rawJson || typeof rawJson !== 'object') {
    throw new Error('Groq output was not a valid JSON object.');
  }

  const outcome = rawJson.outcome;
  if (outcome !== 'no_change' && outcome !== 'actionable') {
    throw new Error(`Invalid outcome: expected 'no_change' or 'actionable', got '${outcome}'.`);
  }

  const feedback_summary = String(rawJson.feedback_summary || '').trim();
  if (!feedback_summary) {
    throw new Error('Groq output missing feedback_summary.');
  }

  const teacher_action = String(rawJson.teacher_action || '').trim();
  if (!teacher_action) {
    throw new Error('Groq output missing teacher_action.');
  }

  if (outcome === 'no_change') {
    const reason_no_change = String(rawJson.reason_no_change || '').trim();
    if (!reason_no_change) {
      throw new Error('No-change suggestion missing reason_no_change.');
    }
    return {
      outcome: 'no_change',
      feedback_summary,
      reason_no_change,
      teacher_action,
    };
  }

  // Outcome is 'actionable'
  const issue_identified = String(rawJson.issue_identified || '').trim();
  const evidence_from_review = String(rawJson.evidence_from_review || '').trim();
  const edit_kind = rawJson.edit_kind;
  const replacement_text = String(rawJson.replacement_text || '').trim();

  if (!issue_identified) throw new Error('Actionable suggestion missing issue_identified.');
  if (!evidence_from_review) throw new Error('Actionable suggestion missing evidence_from_review.');
  if (edit_kind !== 'replace' && edit_kind !== 'append') {
    throw new Error(`Invalid edit_kind: expected 'replace' or 'append', got '${edit_kind}'.`);
  }
  if (!replacement_text) throw new Error('Actionable suggestion missing replacement_text.');

  let target_excerpt: string | null = null;

  if (edit_kind === 'replace') {
    target_excerpt = String(rawJson.target_excerpt || '').trim();
    if (!target_excerpt) {
      throw new Error('Replace edit_kind requires a non-empty target_excerpt.');
    }

    // Ensure target_excerpt occurs EXACTLY ONCE in canonical content to prevent ambiguous replacements
    const count = occurrences(canonicalText, target_excerpt);
    if (count === 0) {
      throw new Error(`Target excerpt "${target_excerpt}" was not found in the resource content.`);
    }
    if (count > 1) {
      throw new Error(`Target excerpt "${target_excerpt}" occurs ${count} times in the resource content. Must occur exactly once.`);
    }
  }

  return {
    outcome: 'actionable',
    feedback_summary,
    issue_identified,
    evidence_from_review,
    edit_kind,
    target_excerpt,
    replacement_text,
    teacher_action,
  };
}

/**
 * Deterministically applies an actionable suggestion to canonical content text.
 * Throws if applied to a no-change suggestion or if target_excerpt constraint fails.
 */
export function applySuggestion(
  canonicalText: string,
  suggestion: GroundedSuggestion
): string {
  if (suggestion.outcome === 'no_change') {
    throw new Error('Cannot apply a no-change suggestion.');
  }

  if (suggestion.edit_kind === 'append') {
    return `${canonicalText.trim()}\n\n${suggestion.replacement_text.trim()}`;
  }

  const target = suggestion.target_excerpt;
  if (!target) {
    throw new Error('Replace edit_kind requires a target excerpt.');
  }

  const count = occurrences(canonicalText, target);
  if (count !== 1) {
    throw new Error(`Target excerpt must occur exactly once in resource text (found ${count}).`);
  }

  return canonicalText.replace(target, suggestion.replacement_text);
}

function occurrences(string: string, subString: string): number {
  if (subString.length <= 0) return 0;
  let n = 0;
  let pos = 0;
  const step = subString.length;
  while (true) {
    pos = string.indexOf(subString, pos);
    if (pos >= 0) {
      ++n;
      pos += step;
    } else break;
  }
  return n;
}
