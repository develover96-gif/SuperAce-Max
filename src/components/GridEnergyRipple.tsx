import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface RippleTarget {
  id: string;
  col: number;
  row?: number;
  color?: string;
  timestamp: number;
}

interface GridEnergyRippleProps {
  activeColumns: number[];
  activeCells?: { col: number; row: number }[];
  triggerKey: number;
  cascadeDepth?: number;
  isFreeSpinsActive?: boolean;
}

interface SparkParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export const GridEnergyRipple: React.FC<GridEnergyRippleProps> = ({
  activeColumns,
  triggerKey,
  isFreeSpinsActive = false,
}) => {
  if (triggerKey === 0 || activeColumns.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden rounded-lg select-none">
      <motion.div
        key={`ambient_flash_${triggerKey}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute inset-0 bg-radial from-amber-400/20 via-cyan-500/10 to-transparent mix-blend-screen"
      />
    </div>
  );
};
