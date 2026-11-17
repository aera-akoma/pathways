import React from 'react';
import { Target, ArrowLeft, Clock } from 'lucide-react';

export function LearningRoadmap({ student, session, state, setState, notify, navigate }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Target className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Under Development</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Learning Roadmap
        </h1>
        <p className="text-base font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
          Coming Soon
        </p>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
          Personalized curriculum tracks, milestone tracking, and step-by-step career engineering pathways are currently under construction.
        </p>
        {navigate && (
          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default LearningRoadmap;
