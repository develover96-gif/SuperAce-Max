import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Flame } from 'lucide-react';
import {
  MULTIPLIER_BASE,
  MULTIPLIER_BASE_DELUXE,
  MULTIPLIER_FREE,
  MULTIPLIER_FREE_DELUXE,
} from '../utils/symbols';
import { GameMode } from '../types';
import { MultiplierBadge } from './MultiplierBadge';

interface MultiplierBarProps {
  currentMultiplier: number;
  isFreeSpinsActive: boolean;
  freeSpinsRemaining: number;
  scattersCount: number;
  gameMode?: GameMode;
  isOverdriveActive?: boolean;
}

export const MultiplierBar: React.FC<MultiplierBarProps> = ({
  currentMultiplier,
  isFreeSpinsActive,
  freeSpinsRemaining,
  scattersCount,
  gameMode = 'classic',
  isOverdriveActive = false,
}) => {
  const ladder =
    gameMode === 'deluxe'
      ? isFreeSpinsActive
        ? MULTIPLIER_FREE_DELUXE
        : MULTIPLIER_BASE_DELUXE
      : isFreeSpinsActive
      ? MULTIPLIER_FREE
      : MULTIPLIER_BASE;

  const isOverdriveTier =
    (gameMode === 'deluxe' && currentMultiplier >= (isFreeSpinsActive ? 25 : 15)) ||
    isOverdriveActive;

  return (
    <div className="relative w-full z-20 px-3 py-1 flex flex-col items-center select-none">
      {/* 1. Multiplier Pill Track with Deluxe Badges */}
      <div
        className={`w-full max-w-[480px] h-14 bg-[#070e1a]/90 rounded-full flex items-center justify-around overflow-visible shadow-[0_4px_16px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all px-2 ${
          isOverdriveTier
            ? 'border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse'
            : gameMode === 'deluxe'
            ? 'border-2 border-[#ec4899] shadow-[0_0_12px_rgba(236,72,153,0.3)]'
            : 'border-2 border-[#a07830]'
        }`}
      >
        {ladder.map((mult, idx) => {
          const isSelected = currentMultiplier === mult;
          return (
            <div key={`mult_${mult}_${idx}`} className="relative h-full flex items-center justify-center">
              {isSelected && (
                <motion.div
                  layoutId="activeMultiplierGlow"
                  className="absolute -inset-1 bg-yellow-400/20 blur-md rounded-full animate-pulse z-0"
                />
              )}
              <MultiplierBadge 
                multiplier={mult} 
                isActive={isSelected} 
                className="z-10"
              />
            </div>
          );
        })}
      </div>


      {/* 2. Scatter Line / Free Pill Hint Row / Overdrive Status */}
      <div className="w-full flex items-center justify-center mt-1.5 min-h-[22px]">
        {isOverdriveTier ? (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
            className="px-3.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 border border-yellow-200 shadow-[0_0_10px_rgba(239,68,68,0.7)] flex items-center gap-1.5"
          >
            <Zap className="w-3 h-3 text-yellow-200 animate-bounce" />
            <span className="font-['Arial'] font-black text-xs text-white uppercase tracking-wider">
              OVERDRIVE FRENZY ×{currentMultiplier}!
            </span>
          </motion.div>
        ) : isFreeSpinsActive ? (
          /* Gold Free Round Pill */
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            id="freePill"
            className="px-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#ffe9a8] via-[#f6b01a] to-[#d07810] border border-[#fffbe8] shadow-[0_0_8px_rgba(246,176,26,0.6)] flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-[#7a1000] animate-spin" />
            <span className="font-['Arial'] font-black text-xs text-[#7a1000] uppercase tracking-wider">
              FREE ROUNDS: {freeSpinsRemaining} REMAINING
            </span>
          </motion.div>
        ) : scattersCount > 0 ? (
          /* Scatter collection feedback */
          <div className="flex items-center gap-1.5 text-xs text-[#f6d478] font-medium">
            <div className="w-4 h-4 rounded-full bg-red-800 border border-yellow-300 flex items-center justify-center text-[9px] font-bold text-yellow-100 shadow-[0_0_6px_#ef4444]">
              ৳
            </div>
            <span className="text-[#ffd25e] font-bold">
              {scattersCount}/3 Scatters Landed!
            </span>
          </div>
        ) : (
          /* Default SuperAce scatter hint */
          <div className="flex items-center gap-1.5 text-xs text-[#f6d478] font-medium tracking-tight">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border border-yellow-100 flex items-center justify-center text-[8px] font-black text-stone-950 shadow-[0_0_6px_rgba(245,158,11,0.8)]">
              ৳
            </div>
            <span>
              {gameMode === 'deluxe'
                ? 'Deluxe VIP Mode: Golden Jokers & Overdrive Multipliers Active'
                : 'Collect 3 ৳ to receive 10 rounds'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
