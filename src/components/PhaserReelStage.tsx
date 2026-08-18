import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GridCell } from '../types';

interface PhaserReelStageProps {
  grid: GridCell[][];
  spinningColumns: boolean[];
  width: number;
  height: number;
  isFreeSpinsActive?: boolean;
}

export const PhaserReelStage: React.FC<PhaserReelStageProps> = ({ 
  grid, 
  spinningColumns,
  width,
  height,
  isFreeSpinsActive = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ReelScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: width,
      height: height,
      transparent: true,
      scene: ReelScene,
      fps: { target: 60, forceSetTimeOut: true }
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once('ready', () => {
      const scene = game.scene.getScene('ReelScene') as ReelScene;
      sceneRef.current = scene;
      scene.updateGrid(grid, spinningColumns, isFreeSpinsActive);
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateGrid(grid, spinningColumns, isFreeSpinsActive);
    }
  }, [grid, spinningColumns, isFreeSpinsActive]);

  return <div ref={containerRef} style={{ width, height }} />;
};

class ReelScene extends Phaser.Scene {
  private symbols: Phaser.GameObjects.Sprite[][] = [];
  private blurSymbols: Phaser.GameObjects.TileSprite[] = [];
  private megaSymbols: Map<string, Phaser.GameObjects.Container> = new Map();
  private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private processedNewCells: Set<string> = new Set();
  
  constructor() {
    super('ReelScene');
  }

  preload() {
    // 1. Load optimized sprite sheet (1 texture + 1 JSON)
    this.load.atlas('symbols_atlas', '/assets/symbols.png', '/assets/symbols.json');

    // Create a card background texture (Procedural UI optimization)
    const cardGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    cardGraphics.fillStyle(0xffffff, 1);
    cardGraphics.fillRoundedRect(0, 0, 128, 128, 12);
    cardGraphics.lineStyle(2, 0xd0d0d0, 1);
    cardGraphics.strokeRoundedRect(1, 1, 126, 126, 12);
    cardGraphics.generateTexture('card_bg', 128, 128);

    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('spark', 8, 8);
  }

  // Helper to set texture correctly from atlas
  private setSymbolTexture(sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.TileSprite, key: string) {
    if (this.textures.exists('symbols_atlas') && this.textures.get('symbols_atlas').has(key)) {
      sprite.setTexture('symbols_atlas', key);
    } else {
      // Fallback to ace if frame missing
      sprite.setTexture('symbols_atlas', 'ace');
    }
  }

  create() {
    this.setupGrid();
    this.sparkEmitter = this.add.particles(0, 0, 'spark', {
      speed: { min: 100, max: 250 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      gravityY: 300,
      emitting: false,
      blendMode: 'ADD'
    });
    this.sparkEmitter.setDepth(100);
  }

  private setupGrid() {
    const cellWidth = this.scale.width / 5;
    const cellHeight = this.scale.height / 4;

    for (let col = 0; col < 5; col++) {
      this.symbols[col] = [];
      const blur = this.add.tileSprite(
        col * cellWidth + cellWidth / 2,
        this.scale.height / 2,
        cellWidth,
        this.scale.height,
        'symbols_atlas',
        'blur'
      );
      blur.setAlpha(0);
      blur.setDepth(5);
      this.blurSymbols[col] = blur;

      for (let row = 0; row < 4; row++) {
        const cx = col * cellWidth + cellWidth / 2;
        const cy = row * cellHeight + cellHeight / 2;

        // Card background
        const bg = this.add.image(cx, cy, 'card_bg');
        bg.setDisplaySize(cellWidth * 0.9, cellHeight * 0.9);
        bg.setDepth(1);

        const sprite = this.add.sprite(cx, cy, 'symbols_atlas', 'ace');
        sprite.setDisplaySize(cellWidth * 0.75, cellHeight * 0.75);
        sprite.setDepth(2);
        this.symbols[col][row] = sprite;
      }
    }
  }

  public updateGrid(grid: GridCell[][], spinning: boolean[], isFreeSpins: boolean) {
    if (!this.symbols.length) return;

    const cellWidth = this.scale.width / 5;
    const cellHeight = this.scale.height / 4;
    const atlasNameMap: Record<string, string> = {
      'A': 'ace', 'K': 'k', 'Q': 'q', 'J': 'j', 'S': 'spades',
      'SC': 'scatter', 'JK': 'jk', 'G': 'jk', 'H': 'hearts', 'D': 'diamonds', 'C': 'clubs'
    };

    const megaOccupied = new Set<string>();
    grid.forEach((column, colIdx) => {
      column.forEach((cell, rowIdx) => {
        if (cell.megaSymbolId && !cell.isMegaOrigin) megaOccupied.add(`${colIdx}_${rowIdx}`);
      });
    });

    grid.forEach((column, colIdx) => {
      const isColSpinning = spinning[colIdx];
      column.forEach((cell, rowIdx) => {
        const sprite = this.symbols[colIdx][rowIdx];
        if (!sprite) return;

        if (megaOccupied.has(`${colIdx}_${rowIdx}`)) {
          sprite.setVisible(false);
          return;
        }

        sprite.setVisible(true);
        const textureName = atlasNameMap[cell.symbol] || cell.symbol.toLowerCase();
        this.setSymbolTexture(sprite, textureName);

        sprite.setAlpha(isColSpinning ? 0 : 1);
        if (cell.isGoldenCard) sprite.setTint(0xffd700); else sprite.clearTint();

        if (cell.isWinning) {
          if (!this.tweens.isTweening(sprite)) {
            this.tweens.add({
              targets: sprite,
              scale: sprite.scale * 1.1,
              duration: 300,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
          }
        } else {
          this.tweens.killTweensOf(sprite);
          sprite.setDisplaySize(cellWidth * 0.85, cellHeight * 0.85);
        }

        // Trigger Ripple on new cells if needed
        if (cell.isNew && !isColSpinning && !this.processedNewCells.has(cell.id)) {
          this.triggerRipple(colIdx, rowIdx, isFreeSpins);
          this.processedNewCells.add(cell.id);
        }
      });

      const blur = this.blurSymbols[colIdx];
      if (blur) blur.setAlpha(isColSpinning ? 1 : 0);
    });

    this.updateMegaSymbols(grid, cellWidth, cellHeight, atlasNameMap);
  }

  private triggerRipple(col: number, row: number, isFreeSpins: boolean) {
    const cellWidth = this.scale.width / 5;
    const cellHeight = this.scale.height / 4;
    const cx = col * cellWidth + cellWidth / 2;
    const cy = row * cellHeight + cellHeight / 2;
    const mainColor = isFreeSpins ? 0xffd700 : 0x00f0ff;

    const beam = this.add.graphics();
    beam.setDepth(50);
    beam.fillStyle(mainColor, 0.4);
    beam.fillRect(col * cellWidth, 0, cellWidth, this.scale.height);
    this.tweens.add({ targets: beam, alpha: 0, duration: 400, onComplete: () => beam.destroy() });

    for (let i = 0; i < 2; i++) {
      const ring = this.add.ellipse(cx, cy, 40, 30, 0, 0);
      ring.setStrokeStyle(3, mainColor);
      ring.setDepth(60);
      this.tweens.add({
        targets: ring,
        width: 300 + i * 50,
        height: 250 + i * 40,
        alpha: 0,
        duration: 600,
        delay: i * 100,
        onComplete: () => ring.destroy()
      });
    }

    if (this.sparkEmitter) this.sparkEmitter.emitParticleAt(cx, cy, 5);
  }

  private updateMegaSymbols(grid: GridCell[][], cellWidth: number, cellHeight: number, nameMap: any) {
    const currentMegaIds = new Set<string>();
    grid.forEach((column, colIdx) => {
      column.forEach((cell, rowIdx) => {
        if (cell.isMegaOrigin) {
          currentMegaIds.add(cell.id);
          const width = cell.megaWidth || 1;
          const height = cell.megaHeight || 1;
          let container = this.megaSymbols.get(cell.id);
          if (!container) {
            container = this.add.container(colIdx * cellWidth + (cellWidth * width) / 2, rowIdx * cellHeight + (cellHeight * height) / 2);
            container.setDepth(10);
            
            // Mega Card Background
            const bg = this.add.image(0, 0, 'card_bg');
            bg.setDisplaySize(cellWidth * width * 0.95, cellHeight * height * 0.95);
            container.add(bg);

            const sprite = this.add.sprite(0, 0, nameMap[cell.symbol] || 'ace');
            this.setSymbolTexture(sprite, nameMap[cell.symbol] || 'ace');
            sprite.setDisplaySize(cellWidth * width * 0.85, cellHeight * height * 0.85);
            container.add(sprite);
            this.megaSymbols.set(cell.id, container);
          }
          container.setPosition(colIdx * cellWidth + (cellWidth * width) / 2, rowIdx * cellHeight + (cellHeight * height) / 2);
          if (cell.isWinning && !this.tweens.isTweening(container)) {
            this.tweens.add({ targets: container, scale: 1.05, duration: 400, yoyo: true, repeat: -1 });
          }
        }
      });
    });
    this.megaSymbols.forEach((container, id) => {
      if (!currentMegaIds.has(id)) { container.destroy(); this.megaSymbols.delete(id); }
    });
  }

  update(time: number, delta: number) {
    this.blurSymbols.forEach((blur) => {
      if (blur.alpha > 0) blur.tilePositionY -= delta * 1.5;
    });
  }
}
