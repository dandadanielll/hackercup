"use client";

import React, { useState } from 'react';
import { Header } from '../components/Header';
import { UploadSection } from '../components/UploadSection';
import { DiffViewer } from '../components/DiffViewer';
import { TranslationCard } from '../components/TranslationCard';
import { ExportSection } from '../components/ExportSection';
import { LocalizeResponse, ChangeItem } from '../types';
import { PHILIPPINE_REGIONS } from '../data/regionsAndLanguages';
import { AlertTriangle, Sparkles, Heart } from 'lucide-react';

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

      // Scroll to diff viewer smoothly
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-indigo-100">
      {/* Navbar */}
      <Header onReset={handleReset} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Error: </span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Output Section */}
        {localizeData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Step 5: Visual Diff Review */}
            <DiffViewer
              data={localizeData}
              onUpdateLocalizedText={handleUpdateLocalizedText}
            />

            {/* Step 6: Dialect Translation Card */}
            <TranslationCard
              translation={localizeData.translation}
              onUpdateTranslationText={handleUpdateTranslationText}
            />

            {/* Step 8: Export Options */}
            <ExportSection
              data={localizeData}
              regionName={currentRegionObj.name}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">LokalSwap</span>
            <span>— Mother Tongue & Regional Contextualizer for Philippine Teachers</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for Philippine Education & DepEd MTB-MLE classrooms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
