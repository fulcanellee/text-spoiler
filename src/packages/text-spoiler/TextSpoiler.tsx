import {FC, useEffect, useRef} from 'react';
import type {Particle, ParticleSpoilerProps} from './types';
import './TextSpoiler.css';

export const TextSpoiler: FC<ParticleSpoilerProps> = (props) => {
    const { text = 'The secret is hidden in the dots' } = props

    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const stage = stageRef.current;
        const canvas = canvasRef.current;

        if (!stage || !canvas) {
            return;

        }

        const rect = stage.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const W = rect.width;
        const H = Math.max(rect.height, 40);

        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const makeParticle = (): Particle => {
            // particle alpha 0.35...0.90
            const a = 0.35 + Math.random() * 0.55;

            return {
                x: Math.random() * W,
                y: Math.random() * H,
                angle: Math.random() * Math.PI * 2,
                speed: 0.15 + Math.random() * 0.35, // 0.15...0.50
                pace: 1,
                r: 0.6 + Math.random() * 0.9,
                a,
                baseA: a,
                tx: 0,
                ty: 0,
            };
        };

        const count = Math.floor((W * H) / 60);

        const particles: Particle[] = Array.from({ length: count }, makeParticle);

        const drift = (p: Particle): void => {
            p.angle += (Math.random() - 0.5) * 0.3; // course correction -0.15..0.15
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;

            // rebound off the walls
            if (p.x < 0) {
                p.x = 0;
                p.angle = Math.PI - p.angle; // mirroring the angle
            } else if (p.x > W) {
                p.x = W;
                p.angle = Math.PI - p.angle; // mirroring the angle
            }

            // rebound off the walls
            if (p.y < 0) {
                p.y = 0;
                p.angle = -p.angle; // mirroring the angle
            } else if (p.y > H) {
                p.y = H;
                p.angle = -p.angle; // mirroring the angle
            }
        };

        let raf = 0;
        const tick = (): void => {
            ctx.clearRect(0, 0, W, H);

            for (const p of particles) {
                drift(p);
                ctx.fillStyle = `rgba(184, 224, 216, ${p.a})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(raf);
    }, [text]);

    return (
        <div ref={stageRef} className="text-spoiler-stage">
            <div className="text-spoiler-text">{text}</div>
            <canvas ref={canvasRef} className="text-spoiler-canvas" aria-hidden="true" />
        </div>
    );
}