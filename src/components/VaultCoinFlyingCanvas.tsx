import React, { useEffect, useRef } from 'react';

interface VaultCoinFlyingCanvasProps {
  triggerKey: number;
  startX?: number;
  startY?: number;
}

interface FlyingCoin {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  radius: number;
  angle: number;
  rotationSpeed: number;
  controlX: number;
  controlY: number;
  alpha: number;
}

export const VaultCoinFlyingCanvas: React.FC<VaultCoinFlyingCanvasProps> = ({
  triggerKey,
  startX,
  startY,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coinsRef = useRef<FlyingCoin[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!triggerKey) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    const originX = startX ?? width / 2;
    const originY = startY ?? height / 2;
    const targetX = width > 500 ? width / 2 + 120 : width - 60;
    const targetY = 30;

    const newCoins: FlyingCoin[] = [];
    const count = 12;

    for (let i = 0; i < count; i++) {
      const spreadX = (Math.random() - 0.5) * 160;
      const spreadY = (Math.random() - 0.5) * 80;
      const controlX = (originX + targetX) / 2 + (Math.random() - 0.5) * 200;
      const controlY = Math.min(originY, targetY) - 80 - Math.random() * 100;

      newCoins.push({
        x: originX + spreadX,
        y: originY + spreadY,
        targetX,
        targetY,
        progress: -i * 0.05,
        speed: 0.02 + Math.random() * 0.015,
        radius: 8 + Math.random() * 4,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: 0.15 + Math.random() * 0.2,
        controlX,
        controlY,
        alpha: 1,
      });
    }

    coinsRef.current = newCoins;

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      let activeCount = 0;
      for (const coin of coinsRef.current) {
        coin.progress += coin.speed;
        if (coin.progress < 0) continue;
        if (coin.progress > 1) {
          coin.alpha -= 0.08;
          if (coin.alpha <= 0) continue;
        }

        activeCount++;
        const t = Math.min(1, Math.max(0, coin.progress));
        // Quadratic bezier curve trajectory
        const invT = 1 - t;
        coin.x = invT * invT * originX + 2 * invT * t * coin.controlX + t * t * targetX;
        coin.y = invT * invT * originY + 2 * invT * t * coin.controlY + t * t * targetY;
        coin.angle += coin.rotationSpeed;

        ctx.save();
        ctx.translate(coin.x, coin.y);
        ctx.scale(Math.cos(coin.angle), 1);
        ctx.globalAlpha = Math.max(0, coin.alpha);

        // Gold coin body
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, coin.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#fde047');
        grad.addColorStop(0.7, '#eab308');
        grad.addColorStop(1, '#854d0e');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Taka sign relief
        ctx.fillStyle = '#713f12';
        ctx.font = `bold ${Math.round(coin.radius * 1.1)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('৳', 0, 1);

        ctx.restore();
      }

      if (activeCount > 0) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [triggerKey, startX, startY]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-45 w-full h-full"
    />
  );
};
