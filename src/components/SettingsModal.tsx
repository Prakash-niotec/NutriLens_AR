import React from 'react';
import { UserDietarySettings } from '../types';
import { X, Sliders, Shield, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserDietarySettings;
  onUpdateSettings: (newSettings: UserDietarySettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const toggleAllergy = (key: keyof UserDietarySettings['allergies']) => {
    onUpdateSettings({
      ...settings,
      allergies: {
        ...settings.allergies,
        [key]: !settings.allergies[key],
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dietary & Safety Settings</h2>
              <p className="text-xs text-slate-400">Customize health flags & allergen alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh] text-xs">
          
          {/* Allergies Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Allergen Warning Flags
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(settings.allergies).map(([allergen, enabled]) => (
                <button
                  key={allergen}
                  onClick={() => toggleAllergy(allergen as keyof UserDietarySettings['allergies'])}
                  className={`p-3 rounded-xl border font-bold capitalize text-left flex items-center justify-between transition-all ${
                    enabled
                      ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span>{allergen}</span>
                  <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Health Preferences */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Safety Criteria Filters
            </h3>

            <div className="space-y-2">
              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer">
                <span className="font-medium text-slate-200">Flag Synthetic E-Number Additives</span>
                <input
                  type="checkbox"
                  checked={settings.avoidPreservatives}
                  onChange={(e) => onUpdateSettings({ ...settings, avoidPreservatives: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer">
                <span className="font-medium text-slate-200">Strict Low-Sugar Filter (&lt;5g sugar)</span>
                <input
                  type="checkbox"
                  checked={settings.avoidHighSugar}
                  onChange={(e) => onUpdateSettings({ ...settings, avoidHighSugar: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer">
                <span className="font-medium text-slate-200">Strict Organic Preference</span>
                <input
                  type="checkbox"
                  checked={settings.preferOrganic}
                  onChange={(e) => onUpdateSettings({ ...settings, preferOrganic: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
          >
            Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
};
