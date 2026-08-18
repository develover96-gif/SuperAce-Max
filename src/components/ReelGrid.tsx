import React, { useRef, useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { GameMode, GridCell, WaysHit } from '../types';
import { SymbolArtwork } from './SymbolArtwork';
import { WinningWaysLinePath } from './WinningWaysLinePath';
import { FireflyParticleCanvas } from './FireflyParticleCanvas';
import { WinMultiplierOverlay } from './WinMultiplierOverlay';
import { GridEnergyRipple } from './GridEnergyRipple';
import { WaysToWinOverlay } from './WaysToWinOverlay';
import { PreviousWinFloatOverlay } from './PreviousWinFloatOverlay';

// Lazy load Phaser component for code splitting
const PhaserReelStage = lazy(() => import('./PhaserReelStage').then(m => ({ default: m.PhaserReelStage })));

interface ReelGridProps {
  grid: GridCell[][];
  spinningColumns: boolean[];
  waysHits?: WaysHit[];
  isSpinning?: boolean;
  spinCount?: number;
  cascadeDepth?: number;
  comboMultiplier?: number;
  isFreeSpinsActive?: boolean;
  activeRippleColumns?: number[];
  activeRippleCells?: { col: number; row: number }[];
  rippleTriggerKey?: number;
  lastSpinWin?: number;
  gameMode?: GameMode;
  onQuickStop?: () => void;
}

export const ReelGrid: React.FC<ReelGridProps> = ({
  grid,
  spinningColumns,
  waysHits = [],
  isSpinning = false,
  spinCount = 0,
  cascadeDepth = 0,
  comboMultiplier = 1,
  isFreeSpinsActive = false,
  activeRippleColumns = [],
  activeRippleCells = [],
  rippleTriggerKey = 0,
  lastSpinWin = 0,
  gameMode = 'classic',
  onQuickStop,
}) => {
  const isAnyColSpinning = spinningColumns.some(Boolean) || isSpinning;
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!gridContainerRef.current) return;
    
    const updateSize = () => {
      if (gridContainerRef.current) {
        const { clientWidth, clientHeight } = gridContainerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(gridContainerRef.current);
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  const handleGridClick = () => {
    if (isAnyColSpinning && onQuickStop) {
      onQuickStop();
    }
  };

  return (
    <div
      id="grid"
      className={`relative w-full flex-1 min-h-[280px] max-h-[480px] sm:max-h-[540px] flex flex-col items-center justify-center px-1 py-0 select-none ${
        isAnyColSpinning ? 'cursor-pointer' : ''
      }`}
      onClick={handleGridClick}
    >
      <PreviousWinFloatOverlay lastWin={lastSpinWin} isSpinning={isSpinning} />

      <div className="relative w-full h-full max-w-[420px] min-h-[300px] max-h-[480px] sm:max-h-[520px] bg-[#071019]/70 rounded-lg p-1 sm:p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.95),inset_0_0_16px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden">
        <FireflyParticleCanvas
          comboMultiplier={comboMultiplier}
          isFreeSpinsActive={isFreeSpinsActive}
        />

        <GridEnergyRipple
          activeColumns={activeRippleColumns}
          activeCells={activeRippleCells}
          triggerKey={rippleTriggerKey}
          cascadeDepth={cascadeDepth}
          isFreeSpinsActive={isFreeSpinsActive}
        />

        <WinMultiplierOverlay
          comboMultiplier={comboMultiplier}
          cascadeDepth={cascadeDepth}
          isFreeSpinsActive={isFreeSpinsActive}
        />

        <WaysToWinOverlay
          waysHits={waysHits}
          cascadeDepth={cascadeDepth}
          comboMultiplier={comboMultiplier}
          isFreeSpinsActive={isFreeSpinsActive}
        />

        {!isAnyColSpinning && waysHits && waysHits.length > 0 && (
          <WinningWaysLinePath
            grid={grid}
            waysHits={waysHits}
            cascadeDepth={cascadeDepth}
          />
        )}

        {/* High-Performance Phaser Canvas Layer */}
        <div 
          ref={gridContainerRef}
          className="relative w-full h-full bg-[#060a12]/60 rounded p-1 z-10 overflow-hidden"
        >
          {dimensions.width > 0 && (
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white/20">Loading Reel...</div>}>
              <PhaserReelStage 
                grid={grid}
                spinningColumns={spinningColumns}
                width={dimensions.width - 8} // Account for padding
                height={dimensions.height - 8}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
};

