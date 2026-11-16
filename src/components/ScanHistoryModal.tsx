import React, { useState } from 'react';
import { ScanHistoryItem, SafetyStatus } from '../types';
import { SafetyBadge } from './SafetyBadge';
import { X, Search, Trash2, History, CheckCircle2, AlertOctagon } from 'lucide-react';

interface ScanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: ScanHistoryItem[];
  onClearHistory: () => void;
  onSelectItem: (item: ScanHistoryItem) => void;
}

export const ScanHistoryModal: React.FC<ScanHistoryModalProps> = ({
  isOpen,
  onClose,
  historyItems,
  onClearHistory,
  onSelectItem,
}) => {
  const [filter, setFilter] = useState<'ALL' | SafetyStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredItems = historyItems.filter((item) => {
    const matchesFilter = filter === 'ALL' || item.result.safetyStatus === filter;
    const matchesSearch = item.result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.result.brand && item.result.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Scan History & Log</h2>
              <p className="text-xs text-slate-400">Total Scanned: {historyItems.length} items</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {historyItems.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-2 rounded-xl bg-slate-800 text-rose-400 hover:bg-rose-950/50 border border-slate-700 transition-all text-xs font-semibold flex items-center gap-1"
                title="Clear Log History"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800/60 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search history by produce or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filter === 'ALL'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All Scans
            </button>

            <button
              onClick={() => setFilter('SAFE')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                filter === 'SAFE'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Safe Only
            </button>

            <button
              onClick={() => setFilter('UNSAFE')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                filter === 'UNSAFE'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Unsafe Only
            </button>
          </div>
        </div>

        {/* History Items List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No history items found matching filter</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <SafetyBadge status={item.result.safetyStatus} size="sm" showLabel={false} />
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {item.result.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {item.mode === 'VEG_FRUIT' ? 'Produce Scan' : 'Packed Label'} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                      item.result.safetyStatus === 'SAFE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {item.result.safetyScore}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
