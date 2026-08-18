import React from 'react';
import { SymbolSprite } from './SymbolSprite';

interface MultiplierBadgeProps {
  multiplier: number;
  isActive?: boolean;
  className?: string;
}

/**
 * MultiplierBadge renders the 1x/2x/etc badge using the atlas '1x' frame
 * and overlays the dynamic multiplier text.
 */
export const MultiplierBadge: React.FC<MultiplierBadgeProps> = ({ 
  multiplier, 
  isActive = false, 
  className = '' 
}) => {
  return (
    <div className={`relative flex items-center justify-center transition-all ${isActive ? 'scale-110' : 'opacity-80 scale-95'} ${className}`}>
      {/* The base badge from atlas */}
      <SymbolSprite 
        name="1x" 
        width={60} 
        height={60} 
        className={isActive ? 'filter drop-shadow-[0_0_8px_rgba(255,210,94,0.9)]' : 'filter grayscale-[0.3]'}
      />
      
      {/* Live Text Overlay */}
      <span className={`absolute inset-0 flex items-center justify-center font-['Georgia'] font-black text-xl mb-1 ${
        isActive ? 'text-[#7a1000] drop-shadow-[0_1.5px_0_rgba(255,255,255,0.8)]' : 'text-[#fef08a] opacity-90'
      }`}>
        ×{multiplier}
      </span>
    </div>
  );
};
