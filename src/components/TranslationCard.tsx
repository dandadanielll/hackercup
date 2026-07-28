import React, { useState } from 'react';
import { Globe2, Sparkles, Copy, Check, Info, Edit2 } from 'lucide-react';
import { TranslationData } from '../types';

interface TranslationCardProps {
  translation: TranslationData;
  onUpdateTranslationText: (newText: string) => void;
}

export const TranslationCard: React.FC<TranslationCardProps> = ({
  translation,
  onUpdateTranslationText,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translation.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div id="translation-card" className="aralkada-card mb-8">
      <div className="aralkada-card-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                <Globe2 className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Mother Tongue Dialect Translation Pass
              </h2>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {translation.language}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Separate translation layer for MTB-MLE classroom instruction. Teachers can edit dialect terms as needed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              AI-translated into {translation.language} — teacher review recommended
            </span>

            <button
              id="copy-translation-btn"
              onClick={handleCopy}
              className="aralkada-btn-secondary py-1.5 px-3"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 inline" /> Copy Translation
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Edit2 className="w-3 h-3 text-indigo-600" />
              Editable Dialect Output:
            </span>
            <span className="text-[11px] text-slate-400">
              You can type directly into the box to adjust spelling or dialect vocabulary
            </span>
          </div>

          <textarea
            id="translation-text-area"
            value={translation.text}
            onChange={(e) => onUpdateTranslationText(e.target.value)}
            rows={6}
            className="aralkada-input font-mono resize-y"
            placeholder="Translation output..."
          />

          {translation.notes && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-indigo-950 flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Translation Notes: </span>
                <span>{translation.notes}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
