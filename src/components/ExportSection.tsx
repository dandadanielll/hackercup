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
    <div id="export-section" className="aralkada-card mb-12 bg-aralkada-sidebar text-white">
      <div className="aralkada-card-inner">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-aralkada-blue text-white rounded-md">
                <Share2 className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold">
                Export & Share Localized Lesson Plan
              </h3>
            </div>
            <p className="text-xs text-white/70 mt-1">
              Copy or download your finalized materials for printing, DepEd Daily Lesson Logs, or classroom distribution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              id="copy-localized-btn"
              onClick={() => handleCopyText(data.localized, 'localized')}
              className="aralkada-btn-secondary"
            >
              {copiedType === 'localized' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> Copied Plan!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 inline" /> Copy Localized Plan
                </>
              )}
            </button>

            <button
              id="copy-translation-export-btn"
              onClick={() => handleCopyText(data.translation.text, 'translation')}
              className="aralkada-btn-secondary"
            >
              {copiedType === 'translation' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> Copied Dialect!
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 inline" /> Copy Dialect Pass
                </>
              )}
            </button>

            <button
              id="download-txt-btn"
              onClick={handleDownloadTxt}
              className="aralkada-btn-yellow text-aralkada-border"
            >
              <Download className="w-4 h-4 inline" /> Download .txt Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
