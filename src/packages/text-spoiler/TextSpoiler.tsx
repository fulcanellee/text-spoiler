import {FC, useEffect, useRef} from 'react';
import type {FontSpec, Particle, ParticleSpoilerProps, Point} from './types';
import './TextSpoiler.css';

const GAP = 4;
const MAX_PARTICLES = 4000;

type Ctx2D = CanvasRenderingContext2D & { letterSpacing?: string };

export const TextSpoiler: FC<ParticleSpoilerProps> = (props) => {
    const { text = 'The secret is hidden in the dots' } = props

    const stageRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const stage = stageRef.current;
        const textEl = textRef.current;
        const canvas = canvasRef.current;

        if (!stage || !textEl || !canvas) {
            return;

        }

        let raf = 0;
        let cancelled = false;
        let onClick: (() => void) | null = null;

        const fontsReady: Promise<unknown> = 'fonts' in document ? document.fonts.ready : Promise.resolve();

        fontsReady.then(() => {
            if (cancelled) {
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

            const cs = getComputedStyle(textEl);
            const spec: FontSpec = {
                font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
                lineHeight: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.12,
                letterSpacing: cs.letterSpacing || '0px',
            };

            const wrapLines = (mctx: Ctx2D, str: string): string[] => {
                mctx.font = spec.font;
                mctx.letterSpacing = spec.letterSpacing;
                const words = str.split(/\s+/).filter(Boolean);
                const lines: string[] = [];
                let line = '';
                for (const w of words) {
                    const probe = line ? line + ' ' + w : w;
                    if (line && mctx.measureText(probe).width > W) {
                        lines.push(line);
                        line = w;
                    } else {
                        line = probe;
                    }
                }
                if (line) {
                    lines.push(line);
                }
                return lines;
            };

            const pick = (img: Uint8ClampedArray, w: number, h: number, g: number): Point[] => {
                const pts: Point[] = [];
                const step = Math.max(1, Math.round(g));

                for (let y = 0; y < h; y += step) {
                    for (let x = 0; x < w; x += step) {
                        if (img[(y * w + x) * 4 + 3] > 128) {
                            pts.push({ x, y });
                        }
                    }
                }

                return pts;
            };

            const sampleTargets = (): Point[] => {
                const off = document.createElement('canvas');
                off.width = Math.max(1, Math.round(W));
                off.height = Math.max(1, Math.round(H));
                const octx = off.getContext('2d', { willReadFrequently: true }) as Ctx2D | null;

                if (!octx) {
                    return [];
                }

                const lines = wrapLines(octx, text);
                const blockH = lines.length * spec.lineHeight;
                const y0 = (H - blockH) / 2 + spec.lineHeight / 2;

                octx.font = spec.font;
                octx.letterSpacing = spec.letterSpacing;
                octx.textAlign = 'center';
                octx.textBaseline = 'middle';
                octx.fillStyle = '#fff';
                lines.forEach((ln, i) => octx.fillText(ln, W / 2, y0 + i * spec.lineHeight));

                const img = octx.getImageData(0, 0, off.width, off.height).data;
                let g = GAP;
                let pts = pick(img, off.width, off.height, g);

                while (pts.length > MAX_PARTICLES && g < 8) {
                    g += 0.5;
                    pts = pick(img, off.width, off.height, g);
                }

                return pts;
            };

            const targets = sampleTargets();

            const makeParticle = (i: number): Particle => {
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
                    tx: targets[i].x,
                    ty: targets[i].y,
                };
            };

            const particles: Particle[] = targets.map((_, i) => makeParticle(i));
            let assembled = false;

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

            const tick = (): void => {
                ctx.clearRect(0, 0, W, H);

                for (const p of particles) {
                    if (!assembled) {
                        drift(p);
                    }
                    ctx.fillStyle = `rgba(184, 224, 216, ${p.a})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                raf = requestAnimationFrame(tick);
            };

            raf = requestAnimationFrame(tick);

            onClick = () => {
                assembled = !assembled;
                if (assembled) {
                    for (const p of particles) {
                        p.x = p.tx;
                        p.y = p.ty;
                    }
                }
            };
            stage.addEventListener('click', onClick);
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            if (onClick) {
                stage.removeEventListener('click', onClick);
            }
        };
    }, [text]);

    return (
        <div ref={stageRef} className="text-spoiler-stage" role="button" tabIndex={0}>
            <div ref={textRef} className="text-spoiler-text">{text}</div>
            <canvas ref={canvasRef} className="text-spoiler-canvas" aria-hidden="true" />
        </div>
    );
}