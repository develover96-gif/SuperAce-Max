import React from 'react';
import { SymbolType } from '../types';
import { ART, RANK } from '../utils/cardVisuals';
import { SymbolSprite } from './SymbolSprite';

interface SymbolArtworkProps {
  symbol: SymbolType;
  isGoldenCard?: boolean;
  isWild?: boolean;
  isGoldenJoker?: boolean;
  isExpandedWild?: boolean;
  isWinning?: boolean;
  isConverting?: boolean;
  megaWidth?: number;
  megaHeight?: number;
}

export const SymbolArtwork: React.FC<SymbolArtworkProps> = ({
  symbol,
  isGoldenCard = false,
  isWild = false,
  isGoldenJoker = false,
  isExpandedWild = false,
  isWinning = false,
  isConverting = false,
}) => {
  // Use atlas for the symbols
  let atlasName: string = symbol;
  
  // Mapping logic for atlas
  const atlasMap: Record<string, string> = {
    'A': 'ace', 'K': 'k', 'Q': 'q', 'J': 'j', 'S': 'spades',
    'SC': 'scatter', 'JK': 'jk', 'G': 'jk', 'H': 'hearts', 'D': 'diamonds', 'C': 'clubs'
  };

  const targetName = atlasMap[symbol] || symbol.toLowerCase();

  return (
    <div className={`relative w-full h-full flex items-center justify-center p-0.5 select-none overflow-hidden ${isWinning ? 'animate-winning-pop' : ''}`}>
      <SymbolSprite 
        name={targetName} 
        width={100} 
        height={130} 
        className={isWinning ? 'filter drop-shadow-[0_0_15px_rgba(255,210,94,0.8)]' : ''}
      />
      
      {/* Decorative rank label for cards (original design element) */}
      {['A', 'K', 'Q', 'J'].includes(symbol) && (
        <span className="rank absolute top-1 left-1.5 font-['Arial',sans-serif] font-black text-[17px] text-[#111827] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] z-10 pointer-events-none">
          {symbol}
        </span>
      )}

      {/* Golden Card Overlay Effect */}
      {isGoldenCard && (
        <div className="absolute inset-0 bg-yellow-400/20 mix-blend-overlay pointer-events-none border-2 border-yellow-400/50 rounded-lg animate-pulse" />
      )}
    </div>
  );
};
