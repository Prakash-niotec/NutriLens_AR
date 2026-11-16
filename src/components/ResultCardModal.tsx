import React from 'react';
import { FoodDetectionResult } from '../types';
import { SafetyBadge } from './SafetyBadge';
import { X, ShieldCheck, AlertTriangle, Info, Heart, Save, Share2, Award, Zap } from 'lucide-react';

interface ResultCardModalProps {
  result: FoodDetectionResult | null;
  onClose: () => void;
  onSaveToHistory: (result: FoodDetectionResult) => void;
  isSaved?: boolean;
}

export const ResultCardModal: React.FC<ResultCardModalProps> = ({
  result,
  onClose,
  onSaveToHistory,
  isSaved = false,
}) => {
  if (!result) return null;

  const isSafe = result.safetyStatus === 'SAFE';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Top Header Banner */}
        <div
          className={`p-5 flex items-center justify-between border-b ${
            isSafe
              ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border-emerald-500/30'
              : 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-900 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <SafetyBadge status={result.safetyStatus} size="sm" showLabel={false} />
            <div>
              <h2 className="text-lg font-bold text-white leading-snug">{result.name}</h2>
              {result.brand && <p className="text-xs text-slate-400 font-medium">Brand: {result.brand}</p>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200">
          
          {/* Main Large Safety Status Indicator Card */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isSafe
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
            }`}
          >
            <SafetyBadge status={result.safetyStatus} score={result.safetyScore} size="lg" />
            
            <div className="text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Confidence</span>
              <p className="text-lg font-black text-white">{Math.round(result.confidence * 100)}% Match</p>
            </div>
          </div>

          {/* Direct Action Recommendation */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            {isSafe ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Analysis Verdict</h4>
              <p className="text-sm font-medium text-slate-200 mt-0.5">{result.recommendation}</p>
            </div>
          </div>

          {/* Freshness / Risk Metrics Breakdown */}
          {result.category === 'FRUIT' || result.category === 'VEGETABLE' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Freshness Status</span>
                <p className="text-xs font-bold text-slate-200 mt-1">{result.freshnessLevel}</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Pesticide Exposure</span>
                <p className={`text-xs font-bold mt-1 ${result.pesticideRisk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {result.pesticideRisk} Risk
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Preservatives</span>
                <p className={`text-xs font-bold mt-1 ${result.preservativesRisk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {result.preservativesRisk}
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Sugar Level</span>
                <p className={`text-xs font-bold mt-1 ${result.sugarLevel === 'CRITICAL' || result.sugarLevel === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {result.sugarLevel}
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Sodium Level</span>
                <p className={`text-xs font-bold mt-1 ${result.sodiumLevel === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {result.sodiumLevel}
                </p>
              </div>
            </div>
          )}

          {/* Warnings Section if any */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Detected Health Hazards & Warnings
              </h4>
              <ul className="space-y-1.5">
                {result.warnings.map((warn, i) => (
                  <li key={i} className="text-xs bg-rose-950/30 border border-rose-800/40 text-rose-300 p-2.5 rounded-xl flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Harmful E-Number Additives Section */}
          {result.harmfulAdditives && result.harmfulAdditives.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Harmful E-Numbers & Artificial Additives
              </h4>
              <div className="space-y-2">
                {result.harmfulAdditives.map((add, i) => (
                  <div key={i} className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-xs rounded-md">
                        {add.code}
                      </span>
                      <span className="text-xs font-bold text-amber-200">{add.name}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{add.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Text Lines if available */}
          {result.extractedText && result.extractedText.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Extracted Label Text
              </h4>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 space-y-1 max-h-32 overflow-y-auto">
                {result.extractedText.map((line, i) => (
                  <p key={i} className="border-b border-slate-900 pb-1">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Nutritional Highlights */}
          {result.nutritionalHighlights && result.nutritionalHighlights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Nutritional Highlights
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.nutritionalHighlights.map((item, i) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg font-medium">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={() => onSaveToHistory(result)}
            disabled={isSaved}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isSaved
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}
          >
            <Save className="w-4 h-4" />
            {isSaved ? 'Saved to Log' : 'Save Safety Report'}
          </button>

          <button
            onClick={onClose}
            className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
