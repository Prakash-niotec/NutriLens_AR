import React from 'react';
import { SafetyStatus } from '../types';

interface SafetyBadgeProps {
  status: SafetyStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  score?: number;
}

export const SafetyBadge: React.FC<SafetyBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
  score,
}) => {
  const isSafe = status === 'SAFE';

  const dimensions = {
    sm: { circle: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-xs', badge: 'px-2.5 py-1' },
    md: { circle: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-sm', badge: 'px-3 py-1.5' },
    lg: { circle: 'w-14 h-14', icon: 'w-8 h-8', text: 'text-base', badge: 'px-4 py-2' },
    xl: { circle: 'w-20 h-20', icon: 'w-12 h-12', text: 'text-xl', badge: 'px-6 py-3' },
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full backdrop-blur-md border ${
        isSafe
          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
          : 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
      } ${dimensions.badge}`}
    >
      {/* Visual Badge Icon */}
      <div
        className={`flex items-center justify-center rounded-full transition-transform transform hover:scale-105 ${dimensions.circle} ${
          isSafe
            ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_#10b981]'
            : 'bg-rose-600 text-white shadow-[0_0_12px_#ef4444]'
        }`}
      >
        {isSafe ? (
          /* GREEN CHECKMARK ICON (Correct ✓) */
          <svg
            className={`${dimensions.icon} stroke-[3.5]`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        ) : (
          /* RED CROSS ARROW / X-MARK ICON */
          <svg
            className={`${dimensions.icon} stroke-[3.5]`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {/* Bold Red Cross X Mark */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </div>

      {/* Label and Score */}
      {showLabel && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-bold tracking-wider uppercase ${dimensions.text}`}>
              {isSafe ? 'SAFE PRODUCT' : 'UNSAFE WARNING'}
            </span>
            {score !== undefined && (
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  isSafe ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {score}%
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-300 font-medium leading-none mt-0.5">
            {isSafe ? 'Verified Safe to Consume' : 'Health Risk / Hazard Detected'}
          </span>
        </div>
      )}
    </div>
  );
};
