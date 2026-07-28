'use client';

import React, { useState } from 'react';
import { Loader2, Play, CheckCircle, ArrowRight, ArrowLeft, Save, RefreshCw, Edit2, UploadCloud } from 'lucide-react';

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

  // Play Phase State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answerHistory, setAnswerHistory] = useState<boolean[]>([]);

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setIsParsingPDF(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/bayanquest/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse PDF');
      }

      setModuleContent((prev) => prev ? prev + '\n\n' + data.text : data.text);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error uploading PDF.');
    } finally {
      setIsParsingPDF(false);
      e.target.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!moduleContent.trim()) {
      setError('Please paste your learning module content first.');
      return;
    }

    setError('');
    setPhase('generating');

    try {
      const response = await fetch('/api/bayanquest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleContent, questionCount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      setQuiz(data);
      setPhase('edit');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
      setPhase('upload');
    }
  };

  const handlePublish = () => {
    // Mock publishing logic
    alert('Mock Success: Quiz Published to Database!');
    
    // Reset play state
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedChoiceId(null);
    setShowFeedback(false);
    
    // Transition to play phase for demonstration
    setPhase('play');
  };

  const handleAnswerSubmit = (choiceId: string) => {
    setSelectedChoiceId(choiceId);
    setShowFeedback(true);
    const currentQ = quiz!.questions[currentQuestionIndex];
    const isCorrect = currentQ.choices.find((c) => c.id === choiceId)?.isCorrect ?? false;
    if (isCorrect) {
      setScore((s) => s + 1);
    }
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

  // --- Handlers for Editing the Quiz ---
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
      const newChoices = newQuestions[qIndex].choices.map((c, idx) => ({
        ...c,
        isCorrect: idx === cIndex,
      }));
      newQuestions[qIndex].choices = newChoices;
      return { ...prev, questions: newQuestions };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* HEADER */}
        <header className="mb-8 border-b pb-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-indigo-700">BayanQuest</h1>
          <p className="text-slate-500 mt-2">Teacher & Student Demo Portal</p>
        </header>

        {/* ERROR ALERT */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* UPLOAD PHASE */}
        {phase === 'upload' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold mb-4">Step 1: Upload Learning Module</h2>
            <p className="text-slate-600 mb-6">
              Paste your lesson plan or learning material below. BayanQuest will analyze it and transform it into an interactive RPG quiz using relatable local Filipino characters and contexts.
            </p>

            <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-3 flex justify-between items-center">
                <span>Number of Questions</span>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-lg">{questionCount}</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="15" 
                value={questionCount} 
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs font-medium text-slate-400 mt-2 px-1">
                <span>1</span>
                <span>15</span>
              </div>
            </div>

            <textarea
              className="w-full h-64 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none mb-4"
              placeholder="e.g. A module about basic addition, local fruits, or community roles..."
              value={moduleContent}
              onChange={(e) => setModuleContent(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  id="pdf-upload"
                  className="hidden"
                  onChange={handlePDFUpload}
                  disabled={isParsingPDF}
                />
                <label
                  htmlFor="pdf-upload"
                  className={`cursor-pointer inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium ${isParsingPDF ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isParsingPDF ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <UploadCloud className="w-5 h-5 mr-2" />}
                  {isParsingPDF ? 'Extracting text...' : 'Upload PDF Module'}
                </label>
              </div>
              <button
                onClick={handleGenerate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex items-center transition-colors"
              >
                Generate RPG Quiz <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* GENERATING PHASE */}
        {phase === 'generating' && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Summoning Local NPCs...</h2>
            <p className="text-slate-500 text-center max-w-md">
              We're analyzing your module and crafting a positive, community-focused RPG quest!
            </p>
          </div>
        )}

        {/* EDIT PHASE */}
        {phase === 'edit' && quiz && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-start items-center">
                <button
                  onClick={() => setPhase('upload')}
                  className="mr-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
                  title="Back to Upload"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold">Step 2: Review & Edit Quiz</h2>
                  <p className="text-slate-500 text-sm">Make any adjustments before publishing to your students.</p>
                </div>
              </div>
              <button
                onClick={handlePublish}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center transition-colors shadow-sm"
              >
                <Save className="mr-2 w-5 h-5" /> Publish & Play
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Quest Title</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-xl font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={quiz.questTitle}
                    onChange={(e) => updateQuestTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">NPC Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-xl font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={quiz.npcName}
                    onChange={(e) => updateNpcName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {quiz.questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Dialogue (Problem context)</label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-28 resize-none"
                    value={q.dialogue}
                    onChange={(e) => updateQuestion(qIndex, 'dialogue', e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Choices (Select the correct one)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.choices.map((c, cIndex) => (
                      <div key={cIndex} className={`flex items-center p-3 rounded-xl border ${c.isCorrect ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}>
                        <input
                          type="radio"
                          name={`q-${qIndex}-correct`}
                          checked={c.isCorrect}
                          onChange={() => markCorrectChoice(qIndex, cIndex)}
                          className="w-5 h-5 text-green-600 focus:ring-green-500 cursor-pointer mr-3"
                        />
                        <input
                          type="text"
                          className="flex-1 bg-transparent outline-none"
                          value={c.text}
                          onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Explanation (Reinforcement)</label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-sm text-slate-600"
                    value={q.explanation}
                    onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PLAY PHASE — RPG Battle Layout */}
        {phase === 'play' && quiz && (() => {
          const currentQ = quiz.questions[currentQuestionIndex];
          const isCorrectAnswer = currentQ.choices.find(c => c.id === selectedChoiceId)?.isCorrect ?? false;
          const totalQuestions = quiz.questions.length;

          return (
            <div className="flex flex-col min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200 -mx-4 -mt-8 px-4 pt-4">

              {/* Top Bar */}
              <div className="flex justify-between items-center mb-3 px-1">
                <button
                  onClick={() => setPhase('edit')}
                  className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Editor
                </button>
                <div className="bg-white/30 backdrop-blur text-white font-bold px-4 py-1 rounded-full text-sm">
                  {quiz.questTitle}
                </div>
                <div className="bg-white/30 backdrop-blur text-white font-bold px-3 py-1 rounded-full text-sm">
                  {currentQuestionIndex + 1} / {totalQuestions}
                </div>
              </div>

              {/* Battle Arena */}
              <div className="flex-1 flex flex-col">

                {/* Sprite Stage */}
                <div className="relative flex items-end justify-between px-4 pb-2 h-64">

                  {/* Ground */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-emerald-400/60 rounded-t-3xl" />

                  {/* LEFT — Student sprite */}
                  <div className="flex flex-col items-center z-10">
                    {/* Student sprite placeholder */}
                    <div className="w-24 h-32 bg-white/40 backdrop-blur border-2 border-dashed border-white/60 rounded-2xl flex flex-col items-center justify-center text-white/70 text-xs font-medium gap-1 mb-2">
                      <span className="text-2xl">🧑‍🎓</span>
                      <span>Your Sprite</span>
                    </div>
                    <div className="bg-white/80 text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow">
                      Ikaw
                    </div>
                  </div>

                  {/* RIGHT — NPC sprite + dialogue + meter */}
                  <div className="flex flex-col items-center z-10 max-w-[55%]">

                    {/* Fulfillment Meter */}
                    <div className="w-full mb-2">
                      <div className="flex justify-between text-xs font-bold text-white mb-1 px-1">
                        <span>Fulfillment</span>
                        <span>{answerHistory.length}/{totalQuestions}</span>
                      </div>
                      <div className="h-4 bg-white/30 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                        {Array.from({ length: totalQuestions }).map((_, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-500 ${
                              i < answerHistory.length
                                ? answerHistory[i]
                                  ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]'
                                  : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]'
                                : 'bg-white/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Dialogue Bubble */}
                    {!showFeedback && (
                      <div className="relative bg-white rounded-2xl shadow-lg p-3 mb-3 w-full">
                        <p className="text-slate-800 text-sm leading-snug">"{currentQ.dialogue}"</p>
                        {/* Bubble tail pointing down */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-2 bg-white" style={{clipPath: 'polygon(0 0, 100% 0, 50% 100%)'}} />
                      </div>
                    )}

                    {/* NPC sprite placeholder */}
                    <div className="w-24 h-32 bg-white/40 backdrop-blur border-2 border-dashed border-white/60 rounded-2xl flex flex-col items-center justify-center text-white/70 text-xs font-medium gap-1 mb-2">
                      <span className="text-2xl">🧑‍🏫</span>
                      <span>NPC Sprite</span>
                    </div>
                    <div className="bg-white/80 text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow text-center">
                      {quiz.npcName}
                    </div>
                  </div>
                </div>

                {/* Bottom Panel — Choices & Feedback */}
                <div className="bg-white rounded-t-3xl shadow-2xl mt-2 p-5 flex-1">

                  {/* Reinforcement box */}
                  {showFeedback && (
                    <div className={`p-4 rounded-2xl mb-4 flex items-start gap-3 ${
                      isCorrectAnswer
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-orange-50 border border-orange-200'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                        isCorrectAnswer ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {isCorrectAnswer ? '✓' : '!'}
                      </div>
                      <div>
                        <p className={`font-bold text-sm mb-1 ${isCorrectAnswer ? 'text-green-800' : 'text-orange-800'}`}>
                          {isCorrectAnswer ? 'Ayos! Tama ka!' : 'Hmm, hindi tama!'}
                        </p>
                        <p className="text-slate-600 text-sm">{currentQ.explanation}</p>
                      </div>
                    </div>
                  )}

                  {/* Choices Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {currentQ.choices.map((c) => {
                      const isSelected = selectedChoiceId === c.id;
                      let cls = 'w-full p-3 rounded-2xl border-2 text-sm font-semibold text-left transition-all duration-200 ';
                      if (showFeedback) {
                        if (c.isCorrect) cls += 'border-green-400 bg-green-50 text-green-800';
                        else if (isSelected) cls += 'border-red-400 bg-red-50 text-red-800';
                        else cls += 'border-slate-100 bg-slate-50 text-slate-400';
                      } else {
                        cls += 'border-indigo-100 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 text-slate-800 active:scale-95';
                      }
                      return (
                        <button
                          key={c.id}
                          disabled={showFeedback}
                          onClick={() => handleAnswerSubmit(c.id)}
                          className={cls}
                        >
                          <span className="text-xs font-bold text-indigo-400 uppercase mr-1">{c.id}.</span> {c.text}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next button */}
                  {showFeedback && (
                    <button
                      onClick={nextQuestion}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-4 rounded-2xl flex items-center justify-center transition-all"
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? 'Next Challenge' : 'Complete Quest'}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* FINISHED PHASE */}
        {phase === 'finished' && quiz && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg border border-slate-200 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏆</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Quest Completed!</h2>
            <p className="text-slate-600 mb-8">You finished "{quiz.questTitle}"!</p>
            
            <div className="bg-indigo-50 rounded-2xl p-6 mb-8">
              <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider mb-1">Your Score</p>
              <p className="text-5xl font-black text-indigo-700">
                {score} / {quiz.questions.length}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={restartPlay}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-colors"
              >
                <RefreshCw className="mr-2 w-5 h-5" /> Play Again
              </button>
              <button
                onClick={() => setPhase('edit')}
                className="w-full bg-white hover:bg-slate-50 text-indigo-600 font-bold py-4 rounded-xl border-2 border-indigo-100 flex items-center justify-center transition-colors"
              >
                <Edit2 className="mr-2 w-5 h-5" /> Back to Editor
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
