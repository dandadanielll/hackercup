"use client";

import React, { useState } from 'react';
import { UploadSection } from '../components/UploadSection';
import { DiffViewer } from '../components/DiffViewer';
import { TranslationCard } from '../components/TranslationCard';
import { ExportSection } from '../components/ExportSection';
import { LocalizeResponse, ChangeItem } from '../types';
import { PHILIPPINE_REGIONS } from '../data/regionsAndLanguages';
import { AlertTriangle, GraduationCap } from 'lucide-react';

export default function App() {
  const [lessonText, setLessonText] = useState<string>('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('bicol_naga');
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('central_bikol');
  const [fileName, setFileName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [localizeData, setLocalizeData] = useState<LocalizeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentRegionObj = PHILIPPINE_REGIONS.find((r) => r.id === selectedRegionId) || PHILIPPINE_REGIONS[0];

  const handleReset = () => {
    setLessonText('');
    setFileName('');
    setLocalizeData(null);
    setErrorMsg(null);
  };

  const handleGenerate = async () => {
    if (!lessonText.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/localize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: lessonText,
          region: selectedRegionId,
          targetLanguage: selectedLanguageId,
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
      setIsGenerating(false);
    }
  };

  const handleUpdateLocalizedText = (newLocalizedText: string, newChanges: ChangeItem[]) => {
    if (!localizeData) return;
    setLocalizeData({
      ...localizeData,
      localized: newLocalizedText,
      changes: newChanges,
    });
  };

  const handleUpdateTranslationText = (newText: string) => {
    if (!localizeData) return;
    setLocalizeData({
      ...localizeData,
      translation: {
        ...localizeData.translation,
        text: newText,
      },
    });
  };

  return (
    <div className="min-h-full px-8 py-10 max-w-[1200px] mx-auto">
      {/* Page Header matching ARALKADA style */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-aralkada-cream-pill px-4 py-1.5 rounded-full border-2 border-aralkada-border font-extrabold text-[10px] tracking-widest text-aralkada-sidebar mb-4 uppercase">
          <GraduationCap className="w-3.5 h-3.5" />
          Lesson Contextualizer
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">LokalSwap</h1>
        <p className="text-aralkada-muted font-medium text-lg">
          Upload any standard lesson plan and instantly translate it to Mother Tongue while swapping foreign cultural concepts for local equivalents.
        </p>
      </div>

      {/* TABS (Visual only for now, showing steps) */}
      <div className="flex border-b-2 border-aralkada-border/20 mb-8 font-extrabold text-sm tracking-wide uppercase gap-8">
        <div className="pb-3 border-b-[3px] border-aralkada-blue text-aralkada-blue cursor-pointer">
          1. Upload & Setup
        </div>
        <div className={`pb-3 border-b-[3px] cursor-pointer ${localizeData ? 'border-aralkada-blue text-aralkada-blue' : 'border-transparent text-aralkada-muted'}`}>
          2. Contextualize & Diff
        </div>
        <div className={`pb-3 border-b-[3px] cursor-pointer ${localizeData ? 'border-aralkada-blue text-aralkada-blue' : 'border-transparent text-aralkada-muted'}`}>
          3. Export
        </div>
      </div>

      <div className="space-y-8">
        {/* Upload & Setup Section */}
        <UploadSection
          lessonText={lessonText}
          setLessonText={setLessonText}
          selectedRegionId={selectedRegionId}
          setSelectedRegionId={setSelectedRegionId}
          selectedLanguageId={selectedLanguageId}
          setSelectedLanguageId={setSelectedLanguageId}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          fileName={fileName}
          setFileName={setFileName}
        />

        {/* Error Alert */}
        {errorMsg && (
          <div className="aralkada-card bg-rose-50 border-rose-600 !p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold text-rose-900">Error: </span>
              <span className="font-medium text-rose-800">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Output Section */}
        {localizeData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
            <DiffViewer
              data={localizeData}
              onUpdateLocalizedText={handleUpdateLocalizedText}
            />

            <TranslationCard
              translation={localizeData.translation}
              onUpdateTranslationText={handleUpdateTranslationText}
            />

            <ExportSection
              data={localizeData}
              regionName={currentRegionObj.name}
            />
          </div>
        )}
      </div>
    </div>
  );
}
