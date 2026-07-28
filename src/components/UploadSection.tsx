"use client";

import React, { useState, useRef } from 'react';
import {
  Upload, FileText, Globe2, MapPin, Sparkles, CheckCircle2,
  ArrowRight, BookOpen, AlertCircle, Info, Loader2,
} from 'lucide-react';
import { SAMPLE_LESSONS } from '../data/regionsAndLanguages';
import { REGION_PROFILES } from '../data/regionsAndLanguages';
import { REGION_KEYS, SUPPORTED_SUBJECTS, UploadMetadata, RegionKey, Subject, SampleLesson } from '../types';

// ─── Label Maps ───────────────────────────────────────────────────────────
const REGION_LABELS: Record<RegionKey, string> = {
  ncr:              '📍 National Capital Region (NCR) — Metro Manila',
  bicol:            '📍 Bicol Region — Naga City, Camarines Sur',
  central_visayas:  '📍 Central Visayas (Cebu) — Cebu City',
};

const SUBJECT_LABELS: Record<Subject, string> = {
  math:     'Mathematics',
  science:  'Science',
  english:  'English',
  filipino: 'Filipino',
};

// ─── Header parser (optional pre-fill) ────────────────────────────────────
function parseHeaderMetadata(text: string): Partial<{ grade: number; subject: Subject; quarter: number }> {
  const result: Partial<{ grade: number; subject: Subject; quarter: number }> = {};

  const gradeMatch = text.match(/grade\s*(?:level)?[:\s]+(\d+)/i);
  if (gradeMatch) {
    const g = parseInt(gradeMatch[1], 10);
    if (g >= 1 && g <= 6) result.grade = g;
  }

  const quarterMatch = text.match(/quarter[:\s]+(\d+|[IVX]+)/i);
  if (quarterMatch) {
    const qRaw = quarterMatch[1];
    const romanMap: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
    const q = romanMap[qRaw.toUpperCase()] ?? parseInt(qRaw, 10);
    if (q >= 1 && q <= 4) result.quarter = q;
  }

  const subjectMatch = text.match(/(?:learning area|subject)[:\s]+(\w+)/i);
  if (subjectMatch) {
    const raw = subjectMatch[1].toLowerCase();
    if (['math', 'mathematics'].includes(raw)) result.subject = 'math';
    else if (['science'].includes(raw)) result.subject = 'science';
    else if (['english'].includes(raw)) result.subject = 'english';
    else if (['filipino'].includes(raw)) result.subject = 'filipino';
  }

  return result;
}

// ─── Props ────────────────────────────────────────────────────────────────
interface UploadSectionProps {
  lessonText: string;
  setLessonText: (text: string) => void;
  uploadMetadata: UploadMetadata;
  setUploadMetadata: (m: UploadMetadata) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isRetrying: boolean;
  fileName: string;
  setFileName: (name: string) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  lessonText,
  setLessonText,
  uploadMetadata,
  setUploadMetadata,
  onGenerate,
  isGenerating,
  isRetrying,
  fileName,
  setFileName,
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentRegion = REGION_PROFILES[uploadMetadata.region];

  const updateMeta = (patch: Partial<UploadMetadata>) =>
    setUploadMetadata({ ...uploadMetadata, ...patch });

  const processFile = async (file: File) => {
    setIsExtracting(true);
    setExtractError(null);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/extract', { method: 'POST', body: formData });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to extract text from file.');
      }
      const data = await res.json();
      const extracted: string = data.extractedText;
      setLessonText(extracted);
      // Optional header pre-fill
      const hints = parseHeaderMetadata(extracted);
      if (Object.keys(hints).length > 0) {
        setUploadMetadata({ ...uploadMetadata, ...hints });
      }
    } catch (err: any) {
      setExtractError(err.message || 'Error parsing file.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleSampleSelect = (sample: SampleLesson) => {
    setLessonText(sample.text);
    setFileName(`${sample.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`);
    setExtractError(null);
    const hints = parseHeaderMetadata(sample.text);
    if (Object.keys(hints).length > 0) {
      setUploadMetadata({ ...uploadMetadata, ...hints });
    }
  };

  const canGenerate = lessonText.trim().length > 0 && !isGenerating;

  return (
    <div id="upload-section" className="aralkada-card mb-8">
      <div className="aralkada-card-inner">

        {/* Demo presets */}
        <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 bg-indigo-600 text-white rounded text-[11px] font-bold uppercase tracking-wider">DEMO PRESETS</span>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" /> Quick-fill a sample lesson plan
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Click to auto-fill:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {SAMPLE_LESSONS.map((sample) => (
              <button
                key={sample.id}
                id={`sample-btn-${sample.id}`}
                onClick={() => handleSampleSelect(sample)}
                className="text-left p-3 rounded-xl bg-white border-aralkada-border border-2 hover:bg-aralkada-blue/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{sample.gradeLevel}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{sample.subject}</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 line-clamp-1">{sample.title}</div>
                <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{sample.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: text / file upload */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Lesson Plan Source
              </label>
              {fileName && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {fileName}
                </span>
              )}
            </div>

            {/* Drop zone */}
            <div
              onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-5 text-center transition-all cursor-pointer ${
                dragActive ? 'border-indigo-500 bg-indigo-50/80' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx,.txt" className="hidden" id="file-input" />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    <span className="text-indigo-600 underline underline-offset-2">Click to upload</span> or drag & drop your lesson plan
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">PDF, Word (.docx), or plain text (.txt)</p>
                </div>
              </div>
            </div>

            {extractError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />{extractError}
              </div>
            )}

            <div className="relative">
              <textarea
                id="lesson-text-input"
                value={lessonText}
                onChange={(e) => setLessonText(e.target.value)}
                placeholder="Paste or type your lesson plan here…"
                rows={9}
                className="aralkada-input font-mono resize-y"
              />
              {isExtracting && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs rounded-lg flex items-center justify-center gap-2 text-xs font-medium text-indigo-900">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Extracting text from document…
                </div>
              )}
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 px-1">
                <span>Characters: {lessonText.length}</span>
                <span>Words: {lessonText.trim() ? lessonText.trim().split(/\s+/).length : 0}</span>
              </div>
            </div>
          </div>

          {/* Right: config */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 p-5 rounded-lg border border-slate-200 gap-5">
            <div className="space-y-5">

              {/* Region */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-indigo-600" /> 1. Target Region
                </h3>
                <p className="text-xs text-slate-500 mb-2">Swaps entities for regional equivalents.</p>
                <select
                  id="region-select"
                  value={uploadMetadata.region}
                  onChange={(e) => updateMeta({ region: e.target.value as RegionKey })}
                  className="aralkada-input text-xs cursor-pointer py-3 px-4"
                >
                  {REGION_KEYS.map((key) => (
                    <option key={key} value={key}>{REGION_LABELS[key]}</option>
                  ))}
                </select>
              </div>

              {/* Language (read-only) */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <Globe2 className="w-4 h-4 text-indigo-600" /> MTB-MLE Language
                </h3>
                <div className="flex items-center gap-2 p-3 bg-white border-2 border-aralkada-border rounded-xl text-xs font-semibold text-slate-800">
                  <span className="text-base">🗣️</span>
                  <span>
                    <span className="text-indigo-700">{currentRegion.motherTongueLabel}</span>
                    <span className="text-slate-400 font-normal"> — this region's designated MTB-MLE language</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Automatically derived from selected region
                </p>
              </div>

              {/* Metadata: Grade / Subject / Quarter */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">2. Lesson Metadata</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Grade</label>
                    <select
                      id="grade-select"
                      value={uploadMetadata.grade}
                      onChange={(e) => updateMeta({ grade: parseInt(e.target.value, 10) })}
                      className="aralkada-input text-xs cursor-pointer py-2 px-2"
                    >
                      {[1,2,3,4,5,6].map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Subject</label>
                    <select
                      id="subject-select"
                      value={uploadMetadata.subject}
                      onChange={(e) => updateMeta({ subject: e.target.value as Subject })}
                      className="aralkada-input text-xs cursor-pointer py-2 px-2"
                    >
                      {SUPPORTED_SUBJECTS.map(s => (
                        <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Quarter</label>
                    <select
                      id="quarter-select"
                      value={uploadMetadata.quarter}
                      onChange={(e) => updateMeta({ quarter: parseInt(e.target.value, 10) })}
                      className="aralkada-input text-xs cursor-pointer py-2 px-2"
                    >
                      {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used for MATATAG competency grounding. Pre-filled from lesson headers when detected.
                </p>
              </div>
            </div>

            {/* Generate button */}
            <div className="pt-2">
              <button
                id="lokalswap-submit-btn"
                onClick={onGenerate}
                disabled={!canGenerate}
                className={`aralkada-btn-primary flex items-center justify-center gap-2 w-full py-4 text-base ${
                  !canGenerate ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    {isRetrying
                      ? 'Generation is taking longer than expected — retrying…'
                      : `Contextualizing for ${currentRegion.name}…`}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    LokalSwap It!
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-500 mt-2">
                Generates a side-by-side diff with cultural entity swaps and scenario reframes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
