import React, { useEffect, useRef } from 'react';

interface BigWinCoinParticleCanvasProps {
  active: boolean;
  tier?: 'big' | 'mega' | 'super';
}

interface CoinParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  flipAngle: number;
  flipSpeed: number;
  type: 'coin' | 'glitter' | 'star';
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
}

export const BigWinCoinParticleCanvas: React.FC<BigWinCoinParticleCanvasProps> = ({
  active,
  tier = 'big',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const countMultiplier = tier === 'super' ? 2.2 : tier === 'mega' ? 1.7 : 1.2;
    const totalParticles = Math.floor(130 * countMultiplier);
    const particles: CoinParticle[] = [];

    const goldColors = ['#fffbe8', '#fef08a', '#fde047', '#f59e0b', '#d97706', '#fbbf24'];

    for (let i = 0; i < totalParticles; i++) {
      const isCoin = Math.random() < 0.45;
      const isStar = !isCoin && Math.random() < 0.4;
      const startX = canvas.width / 2 + (Math.random() - 0.5) * 120;
      const startY = canvas.height * 0.42 + (Math.random() - 0.5) * 80;

      // Burst velocity radiating outward
      const angle = Math.random() * Math.PI * 2;
      const speed = isCoin
        ? Math.random() * 14 + 6
        : Math.random() * 18 + 4;

      const vx = Math.cos(angle) * speed * (0.8 + Math.random() * 0.6);
      const vy = Math.sin(angle) * speed - (Math.random() * 10 + 4);

      particles.push({
        x: startX,
        y: startY,
        vx,
        vy,
        size: isCoin ? Math.random() * 10 + 12 : isStar ? Math.random() * 8 + 6 : Math.random() * 4 + 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        flipAngle: Math.random() * Math.PI,
        flipSpeed: Math.random() * 0.18 + 0.08,
        type: isCoin ? 'coin' : isStar ? 'star' : 'glitter',
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 90 + 90,
      });
    }

    const gravity = 0.42;
    const drag = 0.985;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;
        if (p.life > p.maxLife) {
          // Recycle some particles from top for continuous celebration shower
          if (p.life < p.maxLife + 60) {
            p.x = Math.random() * canvas.width;
            p.y = -20;
            p.vx = (Math.random() - 0.5) * 4;
            p.vy = Math.random() * 6 + 3;
            p.life = 10;
          } else {
            continue;
          }
        }

        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.flipAngle += p.flipSpeed;

        const lifeRatio = p.life / p.maxLife;
        p.opacity = lifeRatio > 0.8 ? (1 - lifeRatio) * 5 : 1;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === 'coin') {
          // 3D Perspective Spinning Gold Coin
          const scaleY = Math.cos(p.flipAngle);
          ctx.scale(1, Math.abs(scaleY));

          // Outer Gold Rim
          const grad = ctx.createLinearGradient(-p.size, -p.size, p.size, p.size);
          grad.addColorStop(0, '#fffbeb');
          grad.addColorStop(0.3, '#fde047');
          grad.addColorStop(0.7, '#d97706');
          grad.addColorStop(1, '#78350f');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#fef08a';
          ctx.stroke();

          // Inner Circle & Embossed Dollar
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.75, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(120, 53, 15, 0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();

          if (Math.abs(scaleY) > 0.3) {
            ctx.fillStyle = '#78350f';
            ctx.font = `bold ${Math.floor(p.size * 0.9)}px Georgia`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('৳', 0, 1);
          }
        } else if (p.type === 'star') {
          // Sparkling 4-point Diamond Star
          const s = p.size;
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#fde047';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.closePath();
          ctx.fill();
        } else {
          // Radiant Glitter Particle
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#fef08a';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [active, tier]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[65] w-full h-full"
    />
  );
};
