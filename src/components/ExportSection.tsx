import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Sparkles, Share2 } from 'lucide-react';
import { LocalizeResponse } from '../types';

interface ExportSectionProps {
  data: LocalizeResponse;
  regionName: string;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ data, regionName }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopyText = async (text: string, typeKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(typeKey);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadTxt = () => {
    const fullContent = `================================================
LOKALSWAP LOCALIZED LESSON PLAN
Region: ${regionName}
Target Language: ${data.translation.language}
================================================

1. CONTEXTUALIZED LESSON PLAN (${regionName})
------------------------------------------------
${data.localized}

================================================
2. MOTHER TONGUE DIALECT TRANSLATION (${data.translation.language})
------------------------------------------------
${data.translation.text}

Note: ${data.translation.notes || 'Reviewed via LokalSwap.'}

================================================
3. CULTURAL SUBSTITUTIONS APPLIED
------------------------------------------------
${data.changes.map((c) => `- ${c.original} -> ${c.replacement} (${c.category})`).join('\n')}

================================================
4. ORIGINAL LESSON PLAN
------------------------------------------------
${data.original}
`;

    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LokalSwap_LessonPlan_${regionName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="export-section" className="bg-slate-900 text-white rounded-xl shadow-xs p-6 border border-slate-800 mb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600 text-white rounded-md">
              <Share2 className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold">
              Export & Share Localized Lesson Plan
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Copy or download your finalized materials for printing, DepEd Daily Lesson Logs, or classroom distribution.
          </p>
        </div>

        {/* Buttons Grid */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            id="copy-localized-btn"
            onClick={() => handleCopyText(data.localized, 'localized')}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-md border border-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            {copiedType === 'localized' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Plan!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Localized Plan
              </>
            )}
          </button>

          <button
            id="copy-translation-export-btn"
            onClick={() => handleCopyText(data.translation.text, 'translation')}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-md border border-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            {copiedType === 'translation' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Dialect!
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" /> Copy Dialect Pass
              </>
            )}
          </button>

          <button
            id="download-txt-btn"
            onClick={handleDownloadTxt}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download .txt Package
          </button>
        </div>
      </div>
    </div>
  );
};
