/**
 * RankBadge Component
 * Displays a student's current rank with visual styling
 */

'use client';

import { cn } from '@/lib/utils/cn';

interface RankBadgeProps {
  rank: number;
  label: string;
  maxRank?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const rankColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  2: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  3: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  4: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  5: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export function RankBadge({
  rank,
  label,
  maxRank,
  showProgress = false,
  size = 'md',
  className,
}: RankBadgeProps) {
  const colors = rankColors[rank] || rankColors[1];
  
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border',
          colors.bg,
          colors.text,
          colors.border,
          sizeClasses[size]
        )}
      >
        <span className="font-bold">Rang {rank}</span>
        <span className="opacity-75">—</span>
        <span>{label}</span>
      </span>
      
      {showProgress && maxRank && maxRank > 1 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: maxRank }, (_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full',
                i < rank ? 'bg-green-500' : 'bg-gray-300'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact rank indicator for lists
 */
export function RankIndicator({
  rank,
  className,
}: {
  rank: number;
  className?: string;
}) {
  const colors = rankColors[rank] || rankColors[1];
  
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
        colors.bg,
        colors.text,
        className
      )}
    >
      {rank}
    </span>
  );
}

/**
 * Progress bar showing progress to next rank
 */
export function RankProgressBar({
  currentRank,
  maxRank,
  progressPercent = 0,
  nextRankLabel,
  className,
}: {
  currentRank: number;
  maxRank: number;
  progressPercent?: number;
  nextRankLabel?: string;
  className?: string;
}) {
  const isMaxRank = currentRank >= maxRank;
  
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-xs text-gray-600">
        <span>Rang {currentRank}</span>
        {!isMaxRank && nextRankLabel && (
          <span>Prochain: {nextRankLabel}</span>
        )}
        {isMaxRank && (
          <span className="text-green-600 font-medium">Rang maximum atteint!</span>
        )}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isMaxRank ? 'bg-green-500' : 'bg-blue-500'
          )}
          style={{ width: isMaxRank ? '100%' : `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export default RankBadge;
