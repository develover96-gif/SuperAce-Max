import React, { useEffect, useRef } from 'react';

interface AztecEnergyParticlesProps {
  triggerKey: number; // Increments on every spin start
  isSpinning: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  shape: 'rune' | 'spark' | 'ring' | 'star' | 'orb';
  glow: number;
}

export const AztecEnergyParticles: React.FC<AztecEnergyParticlesProps> = ({
  triggerKey,
  isSpinning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const shockwaveRadiusRef = useRef<number>(0);
  const shockwaveAlphaRef = useRef<number>(0);

  // Spawn Aztec energy explosion when triggerKey changes
  useEffect(() => {
    if (triggerKey === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const goldColors = [
      '#fef08a', // bright yellow
      '#f59e0b', // amber
      '#fbbf24', // golden yellow
      '#d97706', // deep gold
      '#ffedd5', // brilliant white-gold
      '#10b981', // jade emerald accent
      '#ef4444', // solar ruby accent
    ];

    const shapes: Particle['shape'][] = ['rune', 'spark', 'ring', 'star', 'orb'];
    const newParticles: Particle[] = [];

    // 1. Core radial burst of Aztec solar sparks (45 particles)
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6.5 + 2.0;
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = goldColors[Math.floor(Math.random() * goldColors.length)];

      newParticles.push({
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 7 + 3,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.022 + 0.015,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.15,
        shape,
        glow: Math.random() * 12 + 6,
      });
    }

    // 2. Rising Mesoamerican temple embers from bottom to top (25 particles)
    for (let i = 0; i < 25; i++) {
      newParticles.push({
        x: Math.random() * width,
        y: height - Math.random() * 20,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -(Math.random() * 5.0 + 3.0),
        size: Math.random() * 5 + 2,
        color: Math.random() > 0.3 ? '#f59e0b' : '#fbbf24',
        alpha: 0.95,
        decay: Math.random() * 0.02 + 0.012,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.1,
        shape: 'orb',
        glow: 8,
      });
    }

    // 3. Shockwave explosion initiation
    shockwaveRadiusRef.current = 10;
    shockwaveAlphaRef.current = 0.9;

    particlesRef.current = newParticles;
  }, [triggerKey]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI scaling
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    updateCanvasSize();

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw Aztec Solar Shockwave Ring
      if (shockwaveAlphaRef.current > 0.01) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, shockwaveRadiusRef.current, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1, (1 - shockwaveRadiusRef.current / (canvas.width * 0.8)) * 6);
        ctx.strokeStyle = `rgba(251, 191, 36, ${shockwaveAlphaRef.current})`;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.stroke();

        // Secondary inner ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(0, shockwaveRadiusRef.current - 15), 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(254, 240, 138, ${shockwaveAlphaRef.current * 0.7})`;
        ctx.stroke();
        ctx.restore();

        shockwaveRadiusRef.current += 9;
        shockwaveAlphaRef.current *= 0.93;
      }

      // Draw and update active particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha -= p.decay;
        p.vx *= 0.96; // drag
        p.vy *= 0.96;

        if (p.alpha <= 0.02) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.glow;

        if (p.shape === 'orb') {
          // Glowing soft energy sphere
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.4, p.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          // 4-pointed radiant flare star
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.5);
          ctx.lineTo(p.size * 0.3, -p.size * 0.3);
          ctx.lineTo(p.size * 1.5, 0);
          ctx.lineTo(p.size * 0.3, p.size * 0.3);
          ctx.lineTo(0, p.size * 1.5);
          ctx.lineTo(-p.size * 0.3, p.size * 0.3);
          ctx.lineTo(-p.size * 1.5, 0);
          ctx.lineTo(-p.size * 0.3, -p.size * 0.3);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'rune') {
          // Aztec stepped diamond rune
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size, 0);
          ctx.closePath();
          ctx.stroke();
          // Inner dot
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-1, -1, 2, 2);
        } else if (p.shape === 'ring') {
          // Expanding micro ring
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Spark diamond streak
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.2);
          ctx.lineTo(p.size * 0.4, 0);
          ctx.lineTo(0, p.size * 1.2);
          ctx.lineTo(-p.size * 0.4, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-40"
    />
  );
};
