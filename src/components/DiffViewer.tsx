import React, { useState } from 'react';
import { Layers, Edit3, RotateCcw, Check, X, Info, Tag, ArrowRight, BookOpen, AlertTriangle } from 'lucide-react';
import { LocalizeResponse, ChangeItem } from '../types';
import { buildDiffSegments, DiffSegment, CATEGORY_COLORS, getChangeColorKey } from '../utils/diffUtils';

interface DiffViewerProps {
  data: LocalizeResponse;
  onUpdateLocalizedText: (newLocalizedText: string, newChanges: ChangeItem[]) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ data, onUpdateLocalizedText }) => {
  const [editingSegment, setEditingSegment] = useState<DiffSegment | null>(null);
  const [editInputValue, setEditInputValue] = useState('');

  const segments = buildDiffSegments(data.localized, data.changes);

  const entityCount = data.changes.filter(c => c.category === 'entity').length;
  const scenarioCount = data.changes.filter(c => c.category === 'scenario_reframe').length;

  const handleSegmentClick = (segment: DiffSegment) => {
    if (!segment.isChange) return;
    setEditingSegment(segment);
    setEditInputValue(segment.text);
  };

  const handleSaveEdit = () => {
    if (!editingSegment || !editingSegment.text) return;
    const oldText = editingSegment.text;
    const newText = editInputValue.trim();
    if (!newText || oldText === newText) { setEditingSegment(null); return; }

    const newLocalizedText = data.localized.replace(oldText, newText);
    const updatedChanges = data.changes.map((c) =>
      c.replacement.toLowerCase() === oldText.toLowerCase() ? { ...c, replacement: newText } : c
    );
    onUpdateLocalizedText(newLocalizedText, updatedChanges);
    setEditingSegment(null);
  };

  const handleRestoreOriginal = () => {
    if (!editingSegment || !editingSegment.original) return;
    const newLocalizedText = data.localized.replace(editingSegment.text, editingSegment.original);
    const updatedChanges = data.changes.filter(
      (c) => c.replacement.toLowerCase() !== editingSegment.text.toLowerCase()
    );
    onUpdateLocalizedText(newLocalizedText, updatedChanges);
    setEditingSegment(null);
  };

  return (
    <div id="diff-viewer" className="aralkada-card mb-8">
      <div className="aralkada-card-inner">

        {/* ── Competency Badge ── */}
        {data.competencyMatch?.found && (
          <div className="mb-6 flex flex-col gap-3">
            <div className="inline-flex items-center gap-3 px-4 py-3 bg-aralkada-cream-pill border-2 border-aralkada-border rounded-2xl shadow-[3px_3px_0_0_#463E2C]">
              <BookOpen className="w-5 h-5 text-aralkada-border shrink-0" />
              <span className="text-sm font-bold text-aralkada-border">Grounded against MATATAG competency</span>
              <span className="font-mono font-extrabold text-aralkada-border bg-aralkada-green px-3 py-1 rounded-full border-2 border-aralkada-border text-xs">
                {data.competencyMatch.competencyCode}
              </span>
              <span className="hidden sm:inline text-sm text-aralkada-muted font-medium">
                — {data.competencyMatch.competencyText}
              </span>
            </div>
            {data.competencyMatch.alignmentNote && (
              <div className="flex items-start gap-3 px-4 py-3 bg-aralkada-yellow/30 border-2 border-aralkada-border rounded-2xl text-sm text-aralkada-border">
                <AlertTriangle className="w-4 h-4 text-aralkada-border shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Alignment Note: </span>
                  <span className="font-medium">{data.competencyMatch.alignmentNote}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b-2 border-aralkada-border/20">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2 bg-aralkada-cream-pill text-aralkada-border rounded-xl border-2 border-aralkada-border">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-aralkada-border">Cultural Context Diff Review</h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-aralkada-green text-aralkada-border border-2 border-aralkada-border">
                {entityCount} {entityCount === 1 ? 'Entity Swap' : 'Entity Swaps'}
              </span>
              {scenarioCount > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-aralkada-yellow text-aralkada-border border-2 border-aralkada-border">
                  {scenarioCount} Scenario Reframe{scenarioCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm text-aralkada-muted font-medium mt-2">
              Green = entity swaps · Amber = full scenario rewrites. Click any highlight to edit.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
            <span className="text-aralkada-muted font-bold uppercase tracking-wide mr-1">Legend:</span>
            <span className="px-3 py-1 rounded-full font-bold border-2 bg-aralkada-green text-aralkada-border border-aralkada-border">Entity Swap</span>
            <span className="px-3 py-1 rounded-full font-bold border-2 bg-aralkada-yellow text-aralkada-border border-aralkada-border">⚡ Scenario Reframe</span>
          </div>
        </div>

        {/* ── Side-by-Side ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original */}
          <div className="flex flex-col bg-aralkada-main rounded-[2rem] border-2 border-aralkada-border overflow-hidden">
            <div className="bg-aralkada-cream-pill px-5 py-3.5 border-b-2 border-aralkada-border flex items-center justify-between">
              <span className="text-sm font-bold text-aralkada-border flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-aralkada-muted" />
                Original Lesson Plan
              </span>
              <span className="text-xs text-aralkada-muted font-bold">
                {data.original.trim().split(/\s+/).length} words
              </span>
            </div>
            <div className="p-5 text-sm font-mono text-aralkada-border leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {data.original || <span className="text-aralkada-muted italic">No original text.</span>}
            </div>
          </div>

          {/* Localized */}
          <div className="flex flex-col bg-aralkada-main rounded-[2rem] border-2 border-aralkada-border overflow-hidden relative">
            <div className="bg-aralkada-green/40 px-5 py-3.5 border-b-2 border-aralkada-border flex items-center justify-between">
              <span className="text-sm font-bold text-aralkada-border flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-aralkada-green border-2 border-aralkada-border animate-pulse" />
                Contextualized Regional Version
              </span>
              <span className="text-xs text-aralkada-border font-bold">Click highlights to edit</span>
            </div>

            <div className="p-5 text-sm font-mono text-aralkada-border leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {segments.length === 0 ? (
                <span className="text-aralkada-muted italic">No localized output yet.</span>
              ) : (
                segments.map((seg) => {
                  if (!seg.isChange) return <span key={seg.id}>{seg.text}</span>;
                  const colorKey = getChangeColorKey(data.changes[seg.changeIndex ?? 0]);
                  const catStyle = CATEGORY_COLORS[colorKey] || CATEGORY_COLORS['other'];
                  const isScenario = data.changes[seg.changeIndex ?? 0]?.category === 'scenario_reframe';

                  return (
                    <span
                      key={seg.id}
                      onClick={() => handleSegmentClick(seg)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 my-0.5 mx-0.5 rounded-lg font-bold cursor-pointer transition-all border-2 border-aralkada-border hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_#463E2C] group relative ${isScenario ? 'bg-aralkada-yellow/60' : 'bg-aralkada-green/50'}`}
                      title={`Original: "${seg.original}" → Click to edit`}
                    >
                      {isScenario && <span className="text-[10px]">⚡</span>}
                      <span>{seg.text}</span>
                      <Edit3 className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Substitution pill list ── */}
        <div className="mt-6 pt-5 border-t-2 border-aralkada-border/20 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-aralkada-border flex items-center gap-1.5 mr-1">
            <Tag className="w-4 h-4 text-aralkada-border" /> Substitutions:
          </span>
          {data.changes.map((item, idx) => {
            const isScenario = item.category === 'scenario_reframe';
            return (
              <div
                key={idx}
                className={`text-xs px-3 py-1.5 rounded-full border-2 border-aralkada-border flex items-center gap-1.5 font-bold shadow-[2px_2px_0_0_#463E2C] ${
                  isScenario ? 'bg-aralkada-yellow/60 text-aralkada-border' : 'bg-aralkada-cream-pill text-aralkada-border'
                }`}
              >
                {isScenario && <span className="text-[10px]">⚡</span>}
                <span className="text-aralkada-muted line-through truncate max-w-[80px] font-medium">{item.original}</span>
                <ArrowRight className="w-3 h-3 text-aralkada-border shrink-0" />
                <span className="truncate max-w-[80px]">{item.replacement}</span>
              </div>
            );
          })}
        </div>

        {/* ── Edit Modal ── */}
        {editingSegment && (
          <div className="fixed inset-0 z-50 bg-aralkada-border/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-aralkada-main rounded-[2rem] shadow-xl border-2 border-aralkada-border max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b-2 border-aralkada-border/20">
                <h3 className="text-base font-extrabold text-aralkada-border flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-aralkada-border" /> Edit Substitution
                </h3>
                <button onClick={() => setEditingSegment(null)} className="text-aralkada-muted hover:text-aralkada-border p-1.5 rounded-xl hover:bg-aralkada-cream-pill cursor-pointer border-2 border-transparent hover:border-aralkada-border transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="py-5 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-aralkada-muted uppercase tracking-wide block mb-1.5">Original:</label>
                  <div className="p-3 bg-aralkada-cream-pill text-aralkada-muted text-sm font-mono rounded-2xl border-2 border-aralkada-border line-through">{editingSegment.original}</div>
                </div>
                <div>
                  <label className="text-sm font-bold text-aralkada-border block mb-1.5">Regional Substitution:</label>
                  <input
                    type="text"
                    value={editInputValue}
                    onChange={(e) => setEditInputValue(e.target.value)}
                    className="aralkada-input"
                    placeholder="Type new replacement..."
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  />
                </div>
                <p className="text-xs font-medium text-aralkada-muted flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-aralkada-border shrink-0" />
                  Updating this will reflect live in both the diff viewer and translation card.
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t-2 border-aralkada-border/20 gap-2">
                <button onClick={handleRestoreOriginal} className="px-4 py-2 text-sm font-bold text-aralkada-border hover:bg-aralkada-cream-pill rounded-2xl transition-colors border-2 border-aralkada-border flex items-center gap-1.5 cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" /> Revert
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingSegment(null)} className="px-4 py-2 text-sm font-bold text-aralkada-muted hover:bg-aralkada-cream-pill rounded-2xl transition-colors border-2 border-transparent hover:border-aralkada-border cursor-pointer">Cancel</button>
                  <button onClick={handleSaveEdit} className="aralkada-btn-primary flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
