import React, { useState, useRef } from 'react';
import { Upload, FileText, Globe2, MapPin, Sparkles, CheckCircle2, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { RegionInfo, LanguageInfo, SampleLesson } from '../types';
import { PHILIPPINE_REGIONS, TARGET_LANGUAGES, SAMPLE_LESSONS } from '../data/regionsAndLanguages';

interface UploadSectionProps {
  lessonText: string;
  setLessonText: (text: string) => void;
  selectedRegionId: string;
  setSelectedRegionId: (id: string) => void;
  selectedLanguageId: string;
  setSelectedLanguageId: (id: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  fileName: string;
  setFileName: (name: string) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  lessonText,
  setLessonText,
  selectedRegionId,
  setSelectedRegionId,
  selectedLanguageId,
  setSelectedLanguageId,
  onGenerate,
  isGenerating,
  fileName,
  setFileName,
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentRegion = PHILIPPINE_REGIONS.find((r) => r.id === selectedRegionId) || PHILIPPINE_REGIONS[0];

  const handleRegionChange = (newRegionId: string) => {
    setSelectedRegionId(newRegionId);
    const regionObj = PHILIPPINE_REGIONS.find((r) => r.id === newRegionId);
    if (regionObj && regionObj.defaultLanguageId) {
      setSelectedLanguageId(regionObj.defaultLanguageId);
    }
  };

  // Process file upload via /api/extract
  const processFile = async (file: File) => {
    setIsExtracting(true);
    setExtractError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to extract text from file.');
      }

      const data = await res.json();
      setLessonText(data.extractedText);
    } catch (err: any) {
      console.error('File extraction error:', err);
      setExtractError(err.message || 'Error parsing file.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleSelect = (sample: SampleLesson) => {
    setLessonText(sample.text);
    setFileName(`${sample.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`);
    setExtractError(null);
  };

  return (
    <div id="upload-section" className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 mb-8">
      {/* Top Banner: Quick Demo Presets */}
      <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 bg-indigo-600 text-white rounded text-[11px] font-bold uppercase tracking-wider">
              DEMO PRESETS
            </span>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" /> Need a sample lesson plan to test instantly?
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Click any preset to auto-fill:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {SAMPLE_LESSONS.map((sample) => (
            <button
              key={sample.id}
              id={`sample-btn-${sample.id}`}
              onClick={() => handleSampleSelect(sample)}
              className="text-left p-3 rounded-md bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 transition-all shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {sample.gradeLevel}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">{sample.subject}</span>
              </div>
              <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                {sample.title}
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {sample.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Upload & Context Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Dropzone & Text Area */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Lesson Plan Source Document
            </label>
            {fileName && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {fileName}
              </span>
            )}
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-5 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/80 scale-[0.99]'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt"
              className="hidden"
              id="file-input"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  <span className="text-indigo-600 underline underline-offset-2">Click to upload</span> or drag and drop your lesson plan
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Supports PDF, Word (.docx), or plain text (.txt)</p>
              </div>
            </div>
          </div>

          {extractError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              {extractError}
            </div>
          )}

          {/* Extracted / Input Textarea */}
          <div className="relative">
            <textarea
              id="lesson-text-input"
              value={lessonText}
              onChange={(e) => setLessonText(e.target.value)}
              placeholder="Paste or edit your lesson plan text here..."
              rows={9}
              className="w-full p-3.5 text-xs font-mono bg-slate-50/70 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y shadow-inner"
            />
            {isExtracting && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs rounded-lg flex items-center justify-center gap-2 text-xs font-medium text-indigo-900">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Extracting text from document...
              </div>
            )}
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 px-1">
              <span>Characters: {lessonText.length}</span>
              <span>Words: {lessonText.trim() ? lessonText.trim().split(/\s+/).length : 0}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Region & Target Language Settings */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 p-5 rounded-lg border border-slate-200 gap-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-indigo-600" /> 1. Select Target Philippine Region
              </h3>
              <p className="text-xs text-slate-500 mb-2.5">
                Swaps foreign entities for regional transport, stores, markets, food, and names.
              </p>

              <select
                id="region-select"
                value={selectedRegionId}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 text-slate-900 rounded-md text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-2xs cursor-pointer"
              >
                {PHILIPPINE_REGIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    📍 {region.name} ({region.majorCity}, {region.province})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Region Highlight Box */}
            <div className="p-3 bg-white border border-slate-200 rounded-md text-xs space-y-2 shadow-2xs">
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>{currentRegion.name} ({currentRegion.majorCity})</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-100">
                  Preset Profile
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {currentRegion.description}
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200 text-slate-700">
                  <span className="font-semibold text-slate-900">Market:</span> {currentRegion.commonEntities.market}
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200 text-slate-700">
                  <span className="font-semibold text-slate-900">Transit:</span> {currentRegion.commonEntities.transport}
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Globe2 className="w-4 h-4 text-indigo-600" /> 2. Select Target Mother Tongue (MTB-MLE)
              </h3>
              <p className="text-xs text-slate-500 mb-2.5">
                Generates a separate dialect translation pass for regional classroom instruction.
              </p>

              <select
                id="language-select"
                value={selectedLanguageId}
                onChange={(e) => setSelectedLanguageId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 text-slate-900 rounded-md text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-2xs cursor-pointer"
              >
                {TARGET_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    🗣️ {lang.name} ({lang.nativeName}) — {lang.region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              id="lokalswap-submit-btn"
              onClick={onGenerate}
              disabled={isGenerating || !lessonText.trim()}
              className={`w-full py-3.5 px-5 rounded-md text-sm font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                isGenerating || !lessonText.trim()
                  ? 'bg-slate-300 cursor-not-allowed opacity-70'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-600/20 hover:shadow-md'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Contextualizing for {currentRegion.majorCity}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  LokalSwap It!
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2">
              Renders side-by-side diff with green highlights on all cultural substitutions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
