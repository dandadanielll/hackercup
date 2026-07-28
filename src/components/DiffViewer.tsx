import React, { useState } from 'react';
import { Layers, Edit3, RotateCcw, Check, X, Info, Tag, ArrowRight } from 'lucide-react';
import { LocalizeResponse, ChangeItem } from '../types';
import { buildDiffSegments, DiffSegment, CATEGORY_COLORS } from '../utils/diffUtils';

interface DiffViewerProps {
  data: LocalizeResponse;
  onUpdateLocalizedText: (newLocalizedText: string, newChanges: ChangeItem[]) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ data, onUpdateLocalizedText }) => {
  const [editingSegment, setEditingSegment] = useState<DiffSegment | null>(null);
  const [editInputValue, setEditInputValue] = useState('');

  const segments = buildDiffSegments(data.localized, data.changes);

  const handleSegmentClick = (segment: DiffSegment) => {
    if (!segment.isChange) return;
    setEditingSegment(segment);
    setEditInputValue(segment.text);
  };

  const handleSaveEdit = () => {
    if (!editingSegment || !editingSegment.text) return;

    const oldText = editingSegment.text;
    const newText = editInputValue.trim();

    if (!newText || oldText === newText) {
      setEditingSegment(null);
      return;
    }

    const newLocalizedText = data.localized.replace(oldText, newText);

    const updatedChanges = data.changes.map((c) => {
      if (c.replacement.toLowerCase() === oldText.toLowerCase()) {
        return { ...c, replacement: newText };
      }
      return c;
    });

    onUpdateLocalizedText(newLocalizedText, updatedChanges);
    setEditingSegment(null);
  };

  const handleRestoreOriginal = () => {
    if (!editingSegment || !editingSegment.original) return;

    const oldText = editingSegment.text;
    const originalText = editingSegment.original;

    const newLocalizedText = data.localized.replace(oldText, originalText);

    const updatedChanges = data.changes.filter(
      (c) => c.replacement.toLowerCase() !== oldText.toLowerCase()
    );

    onUpdateLocalizedText(newLocalizedText, updatedChanges);
    setEditingSegment(null);
  };

  return (
    <div id="diff-viewer" className="aralkada-card mb-8">
      <div className="aralkada-card-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Cultural Context Diff Review
              </h2>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {data.changes.length} {data.changes.length === 1 ? 'Substitution' : 'Substitutions'} Applied
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Green highlights mark every replaced cultural entity. Click any green item to edit or customize!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 font-semibold mr-1">Legend:</span>
            {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([cat, style]) => (
              <span
                key={cat}
                className={`px-2 py-0.5 rounded-md font-semibold border ${style.bg} ${style.text} ${style.border}`}
              >
                {style.label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col bg-white rounded-xl border-2 border-aralkada-border overflow-hidden">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Original Lesson Plan
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {data.original.trim().split(/\s+/).length} words
              </span>
            </div>
            <div className="p-4 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto selection:bg-slate-200">
              {data.original}
            </div>
          </div>

          <div className="flex flex-col bg-white rounded-xl border-2 border-aralkada-border overflow-hidden relative">
            <div className="bg-emerald-100/60 px-4 py-2.5 border-b border-emerald-200 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Contextualized Regional Version
              </span>
              <span className="text-[11px] text-emerald-800 font-medium">
                Click green tags to edit
              </span>
            </div>

            <div className="p-4 text-xs font-mono text-slate-900 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto selection:bg-emerald-200">
              {segments.map((seg) => {
                if (!seg.isChange) {
                  return <span key={seg.id}>{seg.text}</span>;
                }

                const catStyle =
                  CATEGORY_COLORS[seg.category || 'other'] || CATEGORY_COLORS['other'];

                return (
                  <span
                    key={seg.id}
                    onClick={() => handleSegmentClick(seg)}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 my-0.5 mx-0.5 rounded font-semibold cursor-pointer transition-all border-b-2 ${catStyle.bg} ${catStyle.text} ${catStyle.border} hover:brightness-95 hover:scale-[1.02] shadow-2xs group relative`}
                    title={`Original: "${seg.original}" → Click to edit`}
                  >
                    <span>{seg.text}</span>
                    <Edit3 className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-indigo-600" /> Key Substitutions:
          </span>
          {data.changes.map((item, idx) => (
            <div
              key={idx}
              className="text-[11px] bg-slate-50 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1"
            >
              <span className="text-slate-500 line-through">{item.original}</span>
              <ArrowRight className="w-2.5 h-2.5 text-emerald-600" />
              <span className="font-bold text-emerald-900">{item.replacement}</span>
            </div>
          ))}
        </div>

        {editingSegment && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" /> Edit Substitution
                </h3>
                <button
                  onClick={() => setEditingSegment(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Original Term in Lesson Plan:
                  </label>
                  <div className="p-2 bg-slate-100 text-slate-700 text-xs font-mono rounded-md border border-slate-200 line-through">
                    {editingSegment.original}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Regional Substitution (Customizable):
                  </label>
                  <input
                    type="text"
                    value={editInputValue}
                    onChange={(e) => setEditInputValue(e.target.value)}
                    className="aralkada-input"
                    placeholder="Type new replacement..."
                    autoFocus
                  />
                </div>

                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  Updating this will reflect live in both the diff viewer and translation card.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                <button
                  onClick={handleRestoreOriginal}
                  className="px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-md transition-colors border border-rose-200 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Revert to Original
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingSegment(null)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Apply Change
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
