import React, { useEffect, useRef } from 'react';

interface ConfettiCanvasProps {
  active: boolean;
  power?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  isCoin: boolean;
  angle: number;
  spinSpeed: number;
  opacity: number;
  life: number;
}

export const ConfettiCanvas: React.FC<ConfettiCanvasProps> = ({ active, power = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.clientWidth || 460;
    canvas.height = canvas.clientHeight || 700;

    const colors = ['#f6d478', '#f2b83c', '#fff6d8', '#e0503a', '#5b7cf0', '#2ea05a'];
    const particleCount = Math.floor(55 * power);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isCoin = Math.random() < 0.28;
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: canvas.height * 0.45 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 14 * power,
        vy: (Math.random() * -12 - 4) * power,
        size: isCoin ? Math.random() * 8 + 8 : Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        isCoin,
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
        life: 1,
      });
    }

    let animId: number;
    const gravity = 0.35;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;
      for (const p of particles) {
        if (p.life <= 0) continue;
        aliveCount++;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        p.angle += p.spinSpeed;
        p.life -= 0.015;
        p.opacity = Math.max(0, p.life);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (p.isCoin) {
          // Spinning gold coin
          ctx.fillStyle = '#f4cf6d';
          ctx.strokeStyle = '#8a5a12';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#7a4d12';
          ctx.font = 'bold 8px Georgia';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);
        } else {
          // Rectangular confetti
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
        }

        ctx.restore();
      }

      if (aliveCount > 0) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [active, power]);

  if (!active) return null;

  return (
    <canvas
      id="confetti"
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[55]"
    />
  );
};
