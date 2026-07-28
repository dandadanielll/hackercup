"use client";

import React, { useState } from 'react';
import { UploadSection } from '../components/UploadSection';
import { DiffViewer } from '../components/DiffViewer';
import { TranslationCard } from '../components/TranslationCard';
import { ExportSection } from '../components/ExportSection';
import { LocalizeResponse, ChangeItem, UploadMetadata } from '../types';
import { REGION_PROFILES } from '../data/regionsAndLanguages';
import { AlertTriangle, GraduationCap } from 'lucide-react';

const DEFAULT_METADATA: UploadMetadata = {
  grade: 3,
  subject: 'math',
  quarter: 1,
  region: 'bicol',
};

export default function App() {
  const [lessonText, setLessonText] = useState<string>('');
  const [uploadMetadata, setUploadMetadata] = useState<UploadMetadata>(DEFAULT_METADATA);
  const [fileName, setFileName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [localizeData, setLocalizeData] = useState<LocalizeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentRegion = REGION_PROFILES[uploadMetadata.region];

  const handleReset = () => {
    setLessonText('');
    setFileName('');
    setLocalizeData(null);
    setErrorMsg(null);
    setIsRetrying(false);
  };

  const handleGenerate = async () => {
    if (!lessonText.trim()) return;

    setIsGenerating(true);
    setIsRetrying(false);
    setErrorMsg(null);

    // Show "retrying" message after 5 seconds if still pending
    const retryTimer = setTimeout(() => setIsRetrying(true), 5_000);

    try {
      const res = await fetch('/api/localize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: lessonText,
          region: uploadMetadata.region,
          grade: uploadMetadata.grade,
          subject: uploadMetadata.subject,
          quarter: uploadMetadata.quarter,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to contextualize lesson plan.');
      }

      const data: LocalizeResponse = await res.json();
      setLocalizeData(data);

      setTimeout(() => {
        document.getElementById('diff-viewer')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Localization error:', err);
      setErrorMsg(err.message || 'An error occurred while generating localized content.');
    } finally {
      clearTimeout(retryTimer);
      setIsGenerating(false);
      setIsRetrying(false);
    }
  };

  const handleUpdateLocalizedText = (newLocalizedText: string, newChanges: ChangeItem[]) => {
    if (!localizeData) return;
    setLocalizeData({ ...localizeData, localized: newLocalizedText, changes: newChanges });
  };

  const handleUpdateTranslationText = (newText: string) => {
    if (!localizeData) return;
    setLocalizeData({ ...localizeData, translation: { ...localizeData.translation, text: newText } });
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Edge-to-edge Header */}
      <div className="bg-black/[0.06] border-b border-black/[0.08] pt-5 md:pt-6 pb-8 px-4 md:px-8">
        <div className="max-w-[1200px] mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-1 text-[#362f21]">KonTeksto</h1>
          <p className="text-[#77756e] font-medium text-sm md:text-base">
            Upload any standard lesson plan and instantly translate it to Mother Tongue while swapping foreign cultural concepts for local equivalents.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-8 py-8 max-w-[1200px] w-full mx-auto">

        {/* Step tabs */}
        <div className="flex justify-center border-b-2 border-aralkada-border/20 mb-12 font-extrabold text-sm md:text-base tracking-wide uppercase gap-12 md:gap-24">
          <div 
            onClick={() => document.getElementById('step-1')?.scrollIntoView({ behavior: 'smooth' })}
            className="pb-3 border-b-[3px] border-aralkada-blue text-aralkada-blue cursor-pointer hover:opacity-80 transition-opacity"
          >
            1. Upload & Setup
          </div>
          <div 
            onClick={() => localizeData && document.getElementById('step-2')?.scrollIntoView({ behavior: 'smooth' })}
            className={`pb-3 border-b-[3px] cursor-pointer transition-opacity ${localizeData ? 'border-aralkada-blue text-aralkada-blue hover:opacity-80' : 'border-transparent text-aralkada-muted opacity-50 cursor-not-allowed'}`}
          >
            2. Contextualize & Diff
          </div>
          <div 
            onClick={() => localizeData && document.getElementById('step-3')?.scrollIntoView({ behavior: 'smooth' })}
            className={`pb-3 border-b-[3px] cursor-pointer transition-opacity ${localizeData ? 'border-aralkada-blue text-aralkada-blue hover:opacity-80' : 'border-transparent text-aralkada-muted opacity-50 cursor-not-allowed'}`}
          >
            3. Export
          </div>
        </div>

        <div className="space-y-12">
          <div id="step-1" className="scroll-mt-8">
            <UploadSection
              lessonText={lessonText}
              setLessonText={setLessonText}
              uploadMetadata={uploadMetadata}
              setUploadMetadata={setUploadMetadata}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              isRetrying={isRetrying}
              fileName={fileName}
              setFileName={setFileName}
            />
          </div>

          {errorMsg && (
            <div className="aralkada-card bg-rose-50 border-rose-600 !p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold text-rose-900">Error: </span>
                <span className="font-medium text-rose-800">{errorMsg}</span>
              </div>
            </div>
          )}

          {localizeData && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
              <div id="step-2" className="space-y-12 scroll-mt-8">
                <DiffViewer data={localizeData} onUpdateLocalizedText={handleUpdateLocalizedText} />
                <TranslationCard translation={localizeData.translation} onUpdateTranslationText={handleUpdateTranslationText} />
              </div>
              <div id="step-3" className="scroll-mt-8">
                <ExportSection data={localizeData} regionName={currentRegion.name} uploadMetadata={uploadMetadata} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
