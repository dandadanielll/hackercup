import React from 'react';
import { RefreshCw, Sparkles, MapPin, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  onReset?: () => void;
  onSelectSample?: (sampleId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header id="main-header" className="bg-white border-b border-slate-200 shadow-2xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
            LS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                LokalSwap
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                <Sparkles className="w-3 h-3 text-indigo-600" /> DepEd MTB-MLE Contextualizer
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Transform generic lesson plans into relatable regional Philippine classroom scenarios
            </p>
          </div>
        </div>

        {/* Action Controls & Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-md border border-slate-200/80">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" /> 7 Regional Catalogs
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> PDF / DOCX / TXT
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Visual Green Diff
            </span>
          </div>

          {onReset && (
            <button
              id="reset-btn"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300/80 cursor-pointer shadow-2xs"
              title="Reset form and start new document"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Start New
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
