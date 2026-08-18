import React, { useMemo } from 'react';
import symbolsAtlas from '../../public/assets/symbols.json';

interface SymbolSpriteProps {
  name: string;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * SymbolSprite renders a symbol from the texture atlas.
 * Uses CSS background-position for efficient rendering in React.
 */
export const SymbolSprite: React.FC<SymbolSpriteProps> = ({ 
  name, 
  className = '', 
  width = 100, 
  height = 130 
}) => {
  const frameData = useMemo(() => {
    // Map internal names to atlas names if they differ
    const atlasNameMap: Record<string, string> = {
      'A': 'ace',
      'K': 'k',
      'Q': 'q',
      'J': 'j',
      'S': 'spades',
      'G': 'jk', // Gold card mapped to JK or specific golden suit? 
      'SC': 'scatter',
      'JK': 'jk',
      'hearts': 'hearts',
      'diamonds': 'diamonds',
      'clubs': 'clubs',
      'spades': 'spades',
      '1x': '1x'
    };

    const targetName = atlasNameMap[name] || name;
    return symbolsAtlas.frames[targetName as keyof typeof symbolsAtlas.frames];
  }, [name]);

  if (!frameData) {
    console.warn(`Symbol ${name} not found in atlas`);
    return <div className={`bg-gray-800 ${className}`} style={{ width, height }} />;
  }

  const { frame, sourceSize } = frameData;
  const atlasSize = symbolsAtlas.meta.size;

  // Calculate scale to fit requested dimensions
  const scaleX = width / sourceSize.w;
  const scaleY = height / sourceSize.h;
  const scale = Math.min(scaleX, scaleY);

  const style: React.CSSProperties = {
    width: sourceSize.w * scale,
    height: sourceSize.h * scale,
    backgroundImage: `url(/assets/symbols.png)`,
    backgroundPosition: `-${frame.x * scale}px -${frame.y * scale}px`,
    backgroundSize: `${atlasSize.w * scale}px ${atlasSize.h * scale}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'auto'
  };

  return <div className={`inline-block ${className}`} style={style} />;
};
