import { ChangeItem } from '../types';

export interface DiffSegment {
  id: string;
  text: string;
  isChange: boolean;
  changeIndex?: number;
  original?: string;
  replacement?: string;
  category?: string;
}

/**
 * Parses localized text against changes array to create highlightable segments.
 */
export function buildDiffSegments(localizedText: string, changes: ChangeItem[]): DiffSegment[] {
  if (!localizedText) return [];
  if (!changes || changes.length === 0) {
    return [{ id: 'seg-0', text: localizedText, isChange: false }];
  }

  interface MatchOccurrence {
    start: number;
    end: number;
    replacement: string;
    changeIndex: number;
    change: ChangeItem;
  }

  const occurrences: MatchOccurrence[] = [];

  changes.forEach((change, changeIdx) => {
    if (!change.replacement) return;
    const searchTarget = change.replacement.trim();
    if (!searchTarget) return;

    let searchStart = 0;
    while (searchStart < localizedText.length) {
      const foundIdx = localizedText.toLowerCase().indexOf(searchTarget.toLowerCase(), searchStart);
      if (foundIdx === -1) break;

      const endIdx = foundIdx + searchTarget.length;

      const hasOverlap = occurrences.some(
        (occ) => (foundIdx >= occ.start && foundIdx < occ.end) || (endIdx > occ.start && endIdx <= occ.end)
      );

      if (!hasOverlap) {
        occurrences.push({
          start: foundIdx,
          end: endIdx,
          replacement: localizedText.slice(foundIdx, endIdx),
          changeIndex: changeIdx,
          change,
        });
      }

      searchStart = foundIdx + Math.max(1, searchTarget.length);
    }
  });

  occurrences.sort((a, b) => a.start - b.start);

  const segments: DiffSegment[] = [];
  let currentIndex = 0;

  occurrences.forEach((occ, idx) => {
    if (occ.start > currentIndex) {
      segments.push({
        id: `seg-plain-${currentIndex}`,
        text: localizedText.slice(currentIndex, occ.start),
        isChange: false,
      });
    }

    segments.push({
      id: `seg-change-${occ.start}-${idx}`,
      text: occ.replacement,
      isChange: true,
      changeIndex: occ.changeIndex,
      original: occ.change.original,
      replacement: occ.replacement,
      // Use entityType as style key if available, otherwise fall back to category
      category: (occ.change as any).entityType || occ.change.category,
    });

    currentIndex = occ.end;
  });

  if (currentIndex < localizedText.length) {
    segments.push({
      id: `seg-plain-end-${currentIndex}`,
      text: localizedText.slice(currentIndex),
      isChange: false,
    });
  }

  return segments;
}

// Returns the display-key for a change item for CATEGORY_COLORS lookup
export function getChangeColorKey(change: ChangeItem): string {
  if (change.category === 'scenario_reframe') return 'scenario_reframe';
  return (change as any).entityType || change.category || 'other';
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  // entity sub-types (entityType field)
  transport:        { bg: 'bg-emerald-100', text: 'text-emerald-950', border: 'border-emerald-500', label: 'Transport' },
  place:            { bg: 'bg-teal-100',    text: 'text-teal-950',    border: 'border-teal-500',    label: 'Place / Store' },
  store:            { bg: 'bg-teal-100',    text: 'text-teal-950',    border: 'border-teal-500',    label: 'Store' },
  food:             { bg: 'bg-green-100',   text: 'text-green-950',   border: 'border-green-500',   label: 'Food & Produce' },
  currency:         { bg: 'bg-emerald-200', text: 'text-emerald-900', border: 'border-emerald-600', label: 'Currency' },
  character_name:   { bg: 'bg-sky-100',     text: 'text-sky-900',     border: 'border-sky-400',     label: 'Local Name' },
  name:             { bg: 'bg-sky-100',     text: 'text-sky-900',     border: 'border-sky-400',     label: 'Local Name' },
  cultural:         { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-500', label: 'Cultural' },
  other:            { bg: 'bg-emerald-100', text: 'text-emerald-950', border: 'border-emerald-500', label: 'Substituted' },
  entity:           { bg: 'bg-emerald-100', text: 'text-emerald-950', border: 'border-emerald-500', label: 'Entity' },
  // Scenario-level reframe — amber/orange so teachers notice full rewrites prominently
  scenario_reframe: { bg: 'bg-amber-100',   text: 'text-amber-950',   border: 'border-amber-500',   label: '⚡ Scenario Reframe' },
};
