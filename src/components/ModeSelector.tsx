import React from 'react';
import { ScanMode } from '../types';
import { Apple, FileText } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
}) => {
  return (
    <div className="w-full px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-center">
      <div className="relative flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 max-w-md w-full shadow-lg">
        {/* Animated Active Pill Indicator */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 ease-out shadow-md ${
            currentMode === 'VEG_FRUIT'
              ? 'left-1 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : 'left-[calc(50%+2px)] bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
          }`}
        />

        {/* Veg & Fruit Button */}
        <button
          onClick={() => onModeChange('VEG_FRUIT')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            currentMode === 'VEG_FRUIT'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Apple className="w-4 h-4" />
          <span>Veg & Fruit</span>
        </button>

        {/* Packed Food Button */}
        <button
          onClick={() => onModeChange('PACKED_FOOD')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            currentMode === 'PACKED_FOOD'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Packed Food</span>
        </button>
      </div>
    </div>
  );
};
