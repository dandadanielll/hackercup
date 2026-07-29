'use client';

import React, { useState } from 'react';
import { Loader2, Play, CheckCircle, ArrowRight, ArrowLeft, Save, RefreshCw, Edit2, UploadCloud, Upload, Sparkles } from 'lucide-react';
import { REGION_KEYS, RegionKey } from '../../types';

const REGION_LABELS: Record<RegionKey, string> = {
  ncr:              '📍 National Capital Region (NCR) — Metro Manila',
  bicol:            '📍 Bicol Region — Naga City, Camarines Sur',
  central_visayas:  '📍 Central Visayas (Cebu) — Cebu City',
};

import BicolBg from '../../utils/Bicol.jpg';
import BicolNpc from '../../utils/Bicol1.png';
import CebuBg from '../../utils/Cebu.jpg';
import CebuNpc from '../../utils/Cebu1.png';
import ManilaBg from '../../utils/Manila.jpg';
import ManilaNpc from '../../utils/Manila1.png';
import PlayerSprite from '../../utils/Ikaw.png';
import KonLogo from '../../utils/Kon.png';

const REGION_ASSETS: Record<RegionKey, { bg: string; npc: string; bgPos?: string }> = {
  ncr: {
    bg: ManilaBg.src,
    npc: ManilaNpc.src,
    bgPos: 'center 75%',
  },
  bicol: {
    bg: BicolBg.src,
    npc: BicolNpc.src,
    bgPos: 'center bottom',
  },
  central_visayas: {
    bg: CebuBg.src,
    npc: CebuNpc.src,
    bgPos: 'center 75%',
  },
};

interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  dialogue: string;
  choices: Choice[];
  explanation: string;
}

interface QuizData {
  questTitle: string;
  npcName: string;
  questions: Question[];
}

type Phase = 'upload' | 'generating' | 'edit' | 'play' | 'finished';

export default function BayanQuest() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [moduleContent, setModuleContent] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [error, setError] = useState('');
  const [isParsingPDF, setIsParsingPDF] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('ncr');

  // Play Phase State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answerHistory, setAnswerHistory] = useState<boolean[]>([]);

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    setIsParsingPDF(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/bayanquest/parse-pdf', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to parse PDF');
      setModuleContent((prev) => prev ? prev + '\n\n' + data.text : data.text);
    } catch (err: any) {
      setError(err.message || 'Error uploading PDF.');
    } finally {
      setIsParsingPDF(false);
    }
  };

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleGenerate = async () => {
    if (!moduleContent.trim()) { setError('Please paste your learning module content first.'); return; }
    setError('');
    setIsGenerating(true);
    try {
      const response = await fetch('/api/bayanquest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleContent, questionCount, region: selectedRegion }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate quiz');
      setQuiz(data);
      setPhase('edit');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = () => {
    setShowPublishModal(true);
  };

  const startPlayPhase = () => {
    setShowPublishModal(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswerHistory([]);
    setSelectedChoiceId(null);
    setShowFeedback(false);
    setPhase('play');
  };

  const handleAnswerSubmit = (choiceId: string) => {
    setSelectedChoiceId(choiceId);
    setShowFeedback(true);
    const currentQ = quiz!.questions[currentQuestionIndex];
    const isCorrect = currentQ.choices.find((c) => c.id === choiceId)?.isCorrect ?? false;
    if (isCorrect) setScore((s) => s + 1);
    setAnswerHistory((prev) => [...prev, isCorrect]);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
      setSelectedChoiceId(null);
      setShowFeedback(false);
    } else {
      setPhase('finished');
    }
  };

  const restartPlay = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedChoiceId(null);
    setShowFeedback(false);
    setAnswerHistory([]);
    setPhase('play');
  };

  const updateQuestTitle = (title: string) => setQuiz((prev) => prev ? { ...prev, questTitle: title } : null);
  const updateNpcName = (name: string) => setQuiz((prev) => prev ? { ...prev, npcName: name } : null);
  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    setQuiz((prev) => {
      if (!prev) return prev;
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };
  const updateChoice = (qIndex: number, cIndex: number, newText: string) => {
    setQuiz((prev) => {
      if (!prev) return prev;
      const newQuestions = [...prev.questions];
      const newChoices = [...newQuestions[qIndex].choices];
      newChoices[cIndex].text = newText;
      newQuestions[qIndex].choices = newChoices;
      return { ...prev, questions: newQuestions };
    });
  };
  const markCorrectChoice = (qIndex: number, cIndex: number) => {
    setQuiz((prev) => {
      if (!prev) return prev;
      const newQuestions = [...prev.questions];
      const newChoices = newQuestions[qIndex].choices.map((c, idx) => ({ ...c, isCorrect: idx === cIndex }));
      newQuestions[qIndex].choices = newChoices;
      return { ...prev, questions: newQuestions };
    });
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Edge-to-edge Header */}
      <div className="bg-black/[0.06] border-b border-black/[0.08] pt-5 md:pt-6 pb-8 px-4 md:px-8">
          <div className="max-w-[1200px] mx-auto flex items-center gap-5">
            <img src={KonLogo.src} alt="Kon Mascot" className="hidden md:block w-24 h-24 object-contain drop-shadow-md" />
            <div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-1 text-[#362f21]">Tuklas</h1>
              <p className="text-[#77756e] font-medium text-sm md:text-base">Empower students to master learning concepts through interactive, community-focused story quests.</p>
            </div>
          </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-8 ${phase === 'play' ? 'flex flex-col' : 'py-8 pb-20'}`}>

        {/* ERROR ALERT */}
        {error && (
          <div className="bg-aralkada-yellow/40 border-2 border-aralkada-border text-aralkada-border p-4 mb-6 rounded-2xl flex items-start gap-3" role="alert">
            <span className="text-lg">⚠️</span>
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}

        {/* ── UPLOAD PHASE ── */}
        {phase === 'upload' && (
          <div className="aralkada-card">
            <div className="aralkada-card-inner">
              <div className="flex items-center gap-4 mb-4">
                <img src={KonLogo.src} alt="Kon" className="w-16 h-16 object-contain drop-shadow shrink-0" />
                <div>
                  <h2 className="text-2xl font-extrabold text-aralkada-border mb-1">Step 1: Upload Learning Module</h2>
                  <p className="text-aralkada-muted font-medium text-sm">
                    Paste your lesson plan or learning material below. BayanQuest will analyze it and transform it into an interactive RPG quiz using relatable local Filipino characters and contexts.
                  </p>
                </div>
              </div>

              {/* Question count slider */}
              <div className="mb-4 bg-aralkada-cream-pill px-5 py-4 rounded-[1.25rem] border-2 border-aralkada-border">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-aralkada-border uppercase tracking-wide">Number of Questions</label>
                  <span className="bg-aralkada-blue text-white font-extrabold px-4 py-1 rounded-full border-2 border-aralkada-border text-base shadow-[2px_2px_0_0_#463E2C]">
                    {questionCount}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-aralkada-border/20 rounded-full appearance-none cursor-pointer accent-[#463E2C]"
                />
                <div className="flex justify-between text-xs font-bold text-aralkada-muted mt-2 px-1 uppercase tracking-wide">
                  <span>1</span>
                  <span>15</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-4 items-stretch">
                <textarea
                  className="aralkada-input font-mono min-h-[160px] resize-none flex-1"
                  placeholder="e.g. A module about basic addition, local fruits, or community roles..."
                  value={moduleContent}
                  onChange={(e) => setModuleContent(e.target.value)}
                />

                <div
                  className={`relative border-2 border-dashed rounded-[1.25rem] p-4 text-center transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden w-full md:w-64 shrink-0 ${isDragActive ? 'border-aralkada-blue bg-aralkada-blue/5 scale-[1.02]' : 'border-aralkada-border/40 bg-aralkada-cream-pill hover:border-aralkada-border'
                    }`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                >
                  <input type="file" accept=".pdf" id="pdf-upload" className="hidden" onChange={handlePDFUpload} disabled={isParsingPDF} />

                  {isParsingPDF ? (
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-aralkada-blue animate-spin" />
                      <p className="text-sm font-bold text-aralkada-border">Extracting...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white text-aralkada-border flex items-center justify-center border-2 border-aralkada-border shadow-[2px_2px_0_0_#463E2C]">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-aralkada-border">
                          <span className="text-aralkada-blue underline decoration-aralkada-blue/40 underline-offset-4 hover:decoration-aralkada-blue transition-colors">Click to upload</span> or drag & drop
                        </p>
                        <p className="text-xs text-aralkada-muted mt-1 font-medium">PDF files only</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col md:flex-row gap-3">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value as RegionKey)}
                  className="aralkada-input text-sm cursor-pointer py-4 px-4 w-full md:w-auto shrink-0 font-bold"
                >
                  {REGION_KEYS.map((key) => (
                    <option key={key} value={key}>{REGION_LABELS[key]}</option>
                  ))}
                </select>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !moduleContent.trim()}
                  className={`aralkada-btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base ${isGenerating || !moduleContent.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isGenerating ? (
                    <>
                      <img src={KonLogo.src} alt="Kon" className="w-5 h-5 object-contain animate-bounce" />
                      Weaving Local Story...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      Generate Tuklas Quest <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}



        {/* ── EDIT PHASE ── */}
        {phase === 'edit' && quiz && (
          <div className="space-y-6">
            {/* Sticky header */}
            <div className="bg-aralkada-cream-pill border-2 border-aralkada-border rounded-[2rem] p-5 flex justify-between items-center sticky top-6 z-10 shadow-[4px_4px_0_0_#463E2C]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPhase('upload')}
                  className="p-2 text-aralkada-muted hover:text-aralkada-border hover:bg-aralkada-main rounded-xl border-2 border-transparent hover:border-aralkada-border transition-all"
                  title="Back to Upload"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-extrabold text-aralkada-border">Step 2: Review &amp; Edit Quiz</h2>
                  <p className="text-aralkada-muted text-sm font-medium">Make any adjustments before publishing to your students.</p>
                </div>
              </div>
              <button
                onClick={handlePublish}
                className="aralkada-btn-yellow flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Publish &amp; Play
              </button>
            </div>

            {/* Quest + NPC name fields */}
            <div className="aralkada-card">
              <div className="aralkada-card-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-aralkada-muted uppercase tracking-wide mb-1.5">Quest Title</label>
                    <input
                      type="text"
                      className="aralkada-input font-bold text-base"
                      value={quiz.questTitle}
                      onChange={(e) => updateQuestTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-aralkada-muted uppercase tracking-wide mb-1.5">NPC Name</label>
                    <input
                      type="text"
                      className="aralkada-input font-bold text-base"
                      value={quiz.npcName}
                      onChange={(e) => updateNpcName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Questions */}
            {quiz.questions.map((q, qIndex) => (
              <div key={qIndex} className="aralkada-card">
                <div className="aralkada-card-inner space-y-5">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="bg-aralkada-blue text-white font-extrabold px-3 py-1 rounded-full border-2 border-aralkada-border text-sm shadow-[2px_2px_0_0_#463E2C]">
                      Q{qIndex + 1}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-aralkada-muted uppercase tracking-wide mb-1.5">Dialogue (Problem context)</label>
                    <textarea
                      className="aralkada-input resize-none h-28"
                      value={q.dialogue}
                      onChange={(e) => updateQuestion(qIndex, 'dialogue', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-aralkada-muted uppercase tracking-wide mb-1.5">Choices (select the correct one)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.choices.map((c, cIndex) => (
                        <div key={cIndex} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${c.isCorrect ? 'border-aralkada-border bg-aralkada-green/30 shadow-[2px_2px_0_0_#463E2C]' : 'border-aralkada-border/40 bg-aralkada-cream-pill hover:border-aralkada-border'}`}>
                          <input
                            type="radio"
                            name={`q-${qIndex}-correct`}
                            checked={c.isCorrect}
                            onChange={() => markCorrectChoice(qIndex, cIndex)}
                            className="w-5 h-5 accent-[#463E2C] cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            className="flex-1 bg-transparent outline-none font-medium text-aralkada-border placeholder:text-aralkada-muted"
                            value={c.text}
                            onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-aralkada-muted uppercase tracking-wide mb-1.5">Explanation (Reinforcement)</label>
                    <textarea
                      className="aralkada-input resize-none h-20 text-sm"
                      value={q.explanation}
                      onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PLAY PHASE ── */}
        {phase === 'play' && quiz && (() => {
          const currentQ = quiz.questions[currentQuestionIndex];
          const isCorrectAnswer = currentQ.choices.find(c => c.id === selectedChoiceId)?.isCorrect ?? false;
          const totalQuestions = quiz.questions.length;

          return (
            <div 
              className="flex flex-col -mx-4 mt-2 flex-1 rounded-t-[3rem] overflow-hidden relative border-2 border-aralkada-border"
              style={{
                backgroundImage: `url(${REGION_ASSETS[selectedRegion].bg})`,
                backgroundSize: 'cover',
                backgroundPosition: REGION_ASSETS[selectedRegion].bgPos || 'center',
              }}
            >
              {/* Dark semi-transparent overlay to ensure contrast */}
              <div className="absolute inset-0 bg-[#362f21]/70 z-0" />

              {/* Top Bar */}
              <div className="flex justify-between items-center px-5 pt-5 pb-3 flex-shrink-0 relative z-10">
                <button
                  onClick={() => setPhase('edit')}
                  className="text-aralkada-cream-pill/70 hover:text-aralkada-cream-pill text-sm font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Editor
                </button>
                <div className="bg-aralkada-cream-pill text-aralkada-border font-extrabold px-4 py-1.5 rounded-full border-2 border-aralkada-border text-sm shadow-[2px_2px_0_0_#463E2C] max-w-[50%] truncate text-center">
                  {quiz.questTitle}
                </div>
                <div className="bg-aralkada-yellow text-aralkada-border font-extrabold px-3 py-1.5 rounded-full border-2 border-aralkada-border text-sm shadow-[2px_2px_0_0_#463E2C] shrink-0">
                  {currentQuestionIndex + 1} / {totalQuestions}
                </div>
              </div>

              {/* Fulfillment Bar */}
              <div className="px-5 pb-3 flex-shrink-0 relative z-10">
                <div className="flex justify-between text-xs font-extrabold text-aralkada-yellow mb-1.5 px-0.5">
                  <span>Fulfillment</span>
                  <span>{answerHistory.length}/{totalQuestions}</span>
                </div>
                <div className="h-3 bg-aralkada-border/30 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                  {Array.from({ length: totalQuestions }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-500 ${i < answerHistory.length
                        ? answerHistory[i]
                          ? 'bg-aralkada-green shadow-[0_0_6px_rgba(74,222,128,0.8)]'
                          : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]'
                        : 'bg-aralkada-cream-pill/20'
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* Dialogue Bubble — aligned right, above sprites */}
              {!showFeedback && (
                <div className="px-5 pb-3 flex-shrink-0 relative z-10 flex justify-end">
                  <div className="relative bg-aralkada-cream-pill border-2 border-aralkada-border rounded-2xl shadow-[3px_3px_0_0_#463E2C] p-4 max-w-[80%] md:max-w-[70%]">
                    <p className="text-aralkada-border text-sm leading-relaxed font-medium">"{currentQ.dialogue}"</p>
                    {/* Tail pointing down-right toward NPC */}
                    <div className="absolute -bottom-2 right-16 w-4 h-2 bg-aralkada-cream-pill border-b-2 border-r-2 border-aralkada-border" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                  </div>
                </div>
              )}

              {/* Sprite Row */}
              <div className="flex items-end justify-between px-10 pb-6 flex-shrink-0 relative z-10">
                {/* LEFT — Student sprite */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-44 h-56 flex items-center justify-center">
                    <img 
                      src={PlayerSprite.src} 
                      alt="Student Sprite" 
                      className="h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="bg-aralkada-cream-pill text-aralkada-border text-xs font-extrabold px-3 py-1 rounded-full border-2 border-aralkada-border shadow-[2px_2px_0_0_#463E2C]">
                    Ikaw
                  </div>
                </div>

                {/* RIGHT — NPC sprite */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-44 h-56 flex items-center justify-center">
                    <img 
                      src={REGION_ASSETS[selectedRegion].npc} 
                      alt="NPC Sprite" 
                      className="h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="bg-aralkada-cream-pill text-aralkada-border text-xs font-extrabold px-3 py-1 rounded-full border-2 border-aralkada-border shadow-[2px_2px_0_0_#463E2C] text-center max-w-[160px] truncate">
                    {quiz.npcName}
                  </div>
                </div>
              </div>

              {/* Bottom Answer Panel */}
              <div className="bg-aralkada-main rounded-t-[2rem] border-t-2 border-aralkada-border shadow-2xl flex-1 p-5 flex flex-col gap-4 relative z-10">

                {/* Reinforcement feedback */}
                {showFeedback && (
                  <div className={`p-4 rounded-2xl flex items-start gap-3 border-2 border-aralkada-border shadow-[3px_3px_0_0_#463E2C] ${isCorrectAnswer ? 'bg-aralkada-green/30' : 'bg-aralkada-yellow/30'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-extrabold text-sm border-2 border-aralkada-border shadow-[2px_2px_0_0_#463E2C] ${isCorrectAnswer ? 'bg-aralkada-green text-aralkada-border' : 'bg-aralkada-yellow text-aralkada-border'}`}>
                      {isCorrectAnswer ? '✓' : '!'}
                    </div>
                    <div>
                      <p className="font-extrabold text-sm mb-1 text-aralkada-border">
                        {isCorrectAnswer ? 'Ayos! Tama ka!' : 'Hmm, hindi tama!'}
                      </p>
                      <p className="text-aralkada-muted text-sm font-medium">{currentQ.explanation}</p>
                    </div>
                  </div>
                )}

                {/* Choices Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {currentQ.choices.map((c) => {
                    const isSelected = selectedChoiceId === c.id;
                    let cls = 'w-full p-4 rounded-2xl border-2 text-sm font-bold text-left transition-all duration-200 cursor-pointer ';
                    if (showFeedback) {
                      if (c.isCorrect) cls += 'border-aralkada-border bg-aralkada-green/40 text-aralkada-border shadow-[2px_2px_0_0_#463E2C]';
                      else if (isSelected) cls += 'border-aralkada-border bg-red-200/60 text-aralkada-border';
                      else cls += 'border-aralkada-border/20 bg-aralkada-cream-pill/40 text-aralkada-muted opacity-60 cursor-not-allowed';
                    } else {
                      cls += 'border-aralkada-border bg-aralkada-cream-pill hover:bg-aralkada-main hover:shadow-[3px_3px_0_0_#463E2C] hover:-translate-y-0.5 text-aralkada-border active:scale-95';
                    }
                    return (
                      <button key={c.id} disabled={showFeedback} onClick={() => handleAnswerSubmit(c.id)} className={cls}>
                        <span className="text-xs font-extrabold text-aralkada-blue uppercase mr-1.5">{c.id}.</span>
                        {c.text}
                      </button>
                    );
                  })}
                </div>

                {/* Next button — always visible, disabled until an answer is chosen */}
                <button
                  onClick={nextQuestion}
                  disabled={!showFeedback}
                  className={`aralkada-btn-primary w-full flex items-center justify-center gap-2 py-4 text-base transition-all duration-200 ${!showFeedback ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                >
                  {currentQuestionIndex < totalQuestions - 1 ? 'Next Challenge' : 'Complete Quest'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── FINISHED PHASE ── */}
        {phase === 'finished' && quiz && (
          <div className="max-w-md mx-auto aralkada-card text-center">
            <div className="aralkada-card-inner">
              <div className="flex justify-center mb-4">
                <img src={KonLogo.src} alt="Kon Mascot" className="w-32 h-32 object-contain drop-shadow-lg" />
              </div>
              <h2 className="text-3xl font-extrabold text-aralkada-border mb-2">Quest Completed!</h2>
              <p className="text-aralkada-muted font-medium mb-8">You finished "{quiz.questTitle}"!</p>

              <div className="bg-aralkada-cream-pill border-2 border-aralkada-border rounded-[2rem] p-6 mb-8 shadow-[4px_4px_0_0_#463E2C]">
                <p className="text-[11px] text-aralkada-muted font-bold uppercase tracking-wider mb-2">Your Score</p>
                <p className="text-5xl font-black text-aralkada-border">
                  {score} <span className="text-aralkada-muted font-bold text-3xl">/ {quiz.questions.length}</span>
                </p>
              </div>

              <button
                onClick={() => setPhase('edit')}
                className="aralkada-btn-secondary w-full flex items-center justify-center gap-2 py-4"
              >
                <Edit2 className="w-4 h-4" /> Back to Editor
              </button>
            </div>
          </div>
        )}

        {/* ── PUBLISH MODAL ── */}
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aralkada-main/80 backdrop-blur-sm">
            <div className="bg-aralkada-cream-pill border-2 border-aralkada-border p-8 rounded-[2rem] max-w-sm w-full text-center shadow-[8px_8px_0_0_#463E2C] animate-in fade-in zoom-in duration-200">
              <div className="flex justify-center mb-4">
                <img src={KonLogo.src} alt="Kon Mascot" className="w-24 h-24 object-contain drop-shadow-lg" />
              </div>
              <h3 className="text-2xl font-extrabold text-aralkada-border mb-2">Success!</h3>
              <p className="text-aralkada-muted font-medium mb-6">
                Quiz has been successfully published to your classroom database.
              </p>
              <button
                onClick={startPlayPhase}
                className="aralkada-btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
              >
                Start Playing <Play className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
