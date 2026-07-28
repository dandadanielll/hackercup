import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Sparkles, Share2, Library, Loader2, CheckCircle2 } from 'lucide-react';
import { LocalizeResponse, UploadMetadata } from '../types';

interface ExportSectionProps {
  data: LocalizeResponse;
  regionName: string;
  uploadMetadata: UploadMetadata;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ data, regionName, uploadMetadata }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [publishState, setPublishState] = useState<'idle' | 'confirming' | 'publishing' | 'done'>('idle');

  const handleCopyText = async (text: string, typeKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(typeKey);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      // Dynamic import to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageW - margin * 2;
      let y = margin;

      const addPage = () => {
        doc.addPage();
        y = margin;
      };

      const checkPageBreak = (needed = 8) => {
        if (y + needed > pageH - margin) addPage();
      };

      const addSectionHeader = (title: string, color: [number, number, number] = [63, 81, 181]) => {
        checkPageBreak(14);
        doc.setFillColor(...color);
        doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), margin + 4, y + 5.5);
        doc.setTextColor(30, 30, 30);
        y += 11;
      };

      const addBodyText = (text: string, fontSize = 8.5, color: [number, number, number] = [40, 40, 40]) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          checkPageBreak(6);
          doc.text(line, margin, y);
          y += 5;
        }
        y += 2;
      };

      // ── Cover Header ──────────────────────────────────────────────────────
      doc.setFillColor(45, 55, 72);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('LokalSwap', margin, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 200, 220);
      doc.text('Localized Lesson Plan — MTB-MLE Ready', margin, 20);

      // Meta badge strip
      doc.setFillColor(237, 242, 255);
      doc.rect(0, 28, pageW, 12, 'F');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 120);
      doc.setFont('helvetica', 'bold');
      const metaText = [
        `Region: ${regionName}`,
        `Language: ${data.translation.language}`,
        `Grade ${uploadMetadata.grade}`,
        `${uploadMetadata.subject.charAt(0).toUpperCase() + uploadMetadata.subject.slice(1)}`,
        `Q${uploadMetadata.quarter}`,
      ].join('   •   ');
      doc.text(metaText, margin, 36);

      y = 46;

      // Competency grounding badge
      if (data.competencyMatch?.found) {
        doc.setFillColor(236, 253, 245);
        doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
        doc.setDrawColor(52, 211, 153);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'S');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 95, 70);
        doc.text(`MATATAG Competency: ${data.competencyMatch.competencyCode}`, margin + 3, y + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(20, 83, 45);
        const compText = doc.splitTextToSize(data.competencyMatch.competencyText || '', contentWidth - 6);
        if (compText[0]) doc.text(compText[0], margin + 3, y + 8);
        y += 14;
      }

      y += 2;

      // ── Section 1: Localized Plan ─────────────────────────────────────────
      addSectionHeader(`1. Contextualized Lesson Plan — ${regionName}`, [63, 81, 181]);
      addBodyText(data.localized);

      // ── Section 2: Substitutions ──────────────────────────────────────────
      addSectionHeader('2. Cultural Substitutions Applied', [30, 130, 100]);
      const entityChanges = data.changes.filter(c => c.category === 'entity');
      const scenarioChanges = data.changes.filter(c => c.category === 'scenario_reframe');

      if (entityChanges.length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        checkPageBreak(6);
        doc.text('Entity Swaps:', margin, y);
        y += 5;
        for (const c of entityChanges) {
          checkPageBreak(5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          doc.text(`  • "${c.original}"  →  "${c.replacement}"${c.entityType ? ` (${c.entityType})` : ''}`, margin, y);
          y += 4.5;
        }
        y += 2;
      }

      if (scenarioChanges.length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 100, 0);
        checkPageBreak(6);
        doc.text('⚡ Scenario Reframes (teacher review recommended):', margin, y);
        y += 5;
        for (const c of scenarioChanges) {
          checkPageBreak(5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 70, 0);
          const lines = doc.splitTextToSize(`  • "${c.original}"  →  "${c.replacement}"`, contentWidth - 4);
          for (const line of lines) {
            checkPageBreak(5);
            doc.text(line, margin, y);
            y += 4.5;
          }
        }
        y += 2;
      }

      // ── Section 3: Mother-tongue Translation ──────────────────────────────
      addSectionHeader(`3. Mother Tongue Translation — ${data.translation.language}`, [100, 60, 180]);
      addBodyText(data.translation.text);
      if (data.translation.notes) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 120);
        checkPageBreak(6);
        doc.text(`Teacher Note: ${data.translation.notes}`, margin, y);
        y += 8;
      }

      // ── Section 4: Original ───────────────────────────────────────────────
      addSectionHeader('4. Original Lesson Plan (Reference)', [100, 100, 110]);
      addBodyText(data.original, 8, [80, 80, 80]);

      // ── Footer on every page ──────────────────────────────────────────────
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `LokalSwap  •  ${regionName}  •  ${data.translation.language}  •  Page ${i} of ${totalPages}`,
          margin,
          pageH - 8
        );
      }

      const safeRegion = regionName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`LokalSwap_${safeRegion}_G${uploadMetadata.grade}_${uploadMetadata.subject}_Q${uploadMetadata.quarter}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePublishToLokalBank = async () => {
    if (publishState === 'idle') {
      setPublishState('confirming');
      return;
    }
    if (publishState === 'confirming') {
      setPublishState('publishing');
      // Simulate publish (wire up real API when LokalBank backend is ready)
      await new Promise(r => setTimeout(r, 1500));
      setPublishState('done');
      setTimeout(() => setPublishState('idle'), 4000);
    }
  };

  return (
    <div id="export-section" className="space-y-4 mb-12">

      {/* ── Publish to LokalBank ────────────────────────────────────────── */}
      <div className="aralkada-card border-2 border-aralkada-yellow bg-aralkada-sidebar text-white">
        <div className="aralkada-card-inner">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-aralkada-yellow rounded-md">
                  <Library className="w-4 h-4 text-aralkada-border" />
                </span>
                <h3 className="text-base font-bold">Publish to LokalBank</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-aralkada-yellow text-aralkada-border uppercase tracking-wider">
                  Teacher Verified
                </span>
              </div>
              <p className="text-xs text-white/70 max-w-lg">
                Share your verified, localized lesson with other teachers in your region. Published lessons appear in LokalBank for free reuse.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {publishState === 'done' ? (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 rounded-lg text-sm font-bold text-white">
                  <CheckCircle2 className="w-4 h-4" /> Published to LokalBank!
                </div>
              ) : publishState === 'confirming' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/80 font-medium">Publish for all teachers to see?</span>
                  <button
                    onClick={() => setPublishState('idle')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-publish-btn"
                    onClick={handlePublishToLokalBank}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-aralkada-yellow text-aralkada-border hover:brightness-110 transition-all cursor-pointer"
                  >
                    Yes, Publish
                  </button>
                </div>
              ) : (
                <button
                  id="publish-lokalbank-btn"
                  onClick={handlePublishToLokalBank}
                  disabled={publishState === 'publishing'}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aralkada-yellow text-aralkada-border font-bold text-sm border-b-4 border-yellow-600 hover:brightness-110 active:border-b-0 active:mt-1 transition-all cursor-pointer disabled:opacity-60"
                >
                  {publishState === 'publishing' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                  ) : (
                    <><Library className="w-4 h-4" /> Publish to LokalBank</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Export & Copy ───────────────────────────────────────────────── */}
      <div className="aralkada-card bg-aralkada-sidebar text-white">
        <div className="aralkada-card-inner">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-aralkada-blue text-white rounded-md">
                  <Share2 className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold">Export & Share</h3>
              </div>
              <p className="text-xs text-white/70 mt-1">
                Download or copy for DepEd DLL, printing, or classroom distribution.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                id="copy-localized-btn"
                onClick={() => handleCopyText(data.localized, 'localized')}
                className="aralkada-btn-secondary"
              >
                {copiedType === 'localized' ? (
                  <><Check className="w-3.5 h-3.5 text-emerald-600 inline" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5 inline" /> Copy Localized Plan</>
                )}
              </button>

              <button
                id="copy-translation-export-btn"
                onClick={() => handleCopyText(data.translation.text, 'translation')}
                className="aralkada-btn-secondary"
              >
                {copiedType === 'translation' ? (
                  <><Check className="w-3.5 h-3.5 text-emerald-600 inline" /> Copied!</>
                ) : (
                  <><FileText className="w-3.5 h-3.5 inline" /> Copy Dialect Pass</>
                )}
              </button>

              <button
                id="download-pdf-btn"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-aralkada-yellow text-aralkada-border font-bold text-sm border-b-4 border-yellow-600 hover:brightness-110 active:border-b-0 active:mt-1 transition-all cursor-pointer disabled:opacity-60"
              >
                {isExportingPdf ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
                ) : (
                  <><Download className="w-4 h-4" /> Download PDF</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
