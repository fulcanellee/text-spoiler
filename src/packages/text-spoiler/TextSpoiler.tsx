import { FC, useEffect, useRef } from "react";
import type {
    FontSpec,
    Particle,
    ParticleSpoilerProps,
    Point,
    SpoilerState,
} from "./types";
import "./TextSpoiler.css";

const MAX_PARTICLES = 4000;
const INK = "184, 224, 216";

type Ctx2D = CanvasRenderingContext2D & { letterSpacing?: string };

export const TextSpoiler: FC<ParticleSpoilerProps> = (props) => {
    const {
        text = "The secret is hidden in the dots",
        gap = 4,
        speed = 3,
    } = props;

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

        let raf: number | null = null;
        let cancelled = false;
        const cleanups: Array<() => void> = [];

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            stage.classList.add("settled");
            stage.setAttribute("aria-pressed", "true");
            return;
        }

        const boot = async (): Promise<void> => {
            if ("fonts" in document) {
                try {
                    const cs = getComputedStyle(textEl);
                    await document.fonts.load(
                        `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
                        text,
                    );
                    await document.fonts.ready;
                } catch {}
            }

            if (cancelled) {
                return;
            }

            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            let W = 0;
            let H = 0;
            let ctx: CanvasRenderingContext2D;
            let spec: FontSpec;
            let targets: Point[] = [];
            let particles: Particle[] = [];
            let state: SpoilerState = "hidden";
            let revealStarted = false;

            const wrapLines = (mctx: Ctx2D, str: string): string[] => {
                mctx.font = spec.font;
                mctx.letterSpacing = spec.letterSpacing;
                const words = str.split(/\s+/).filter(Boolean);
                const lines: string[] = [];
                let line = "";
                for (const w of words) {
                    const probe = line ? line + " " + w : w;
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

            const pick = (
                img: Uint8ClampedArray,
                w: number,
                h: number,
                g: number,
            ): Point[] => {
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
                const off = document.createElement("canvas");
                off.width = Math.max(1, Math.round(W));
                off.height = Math.max(1, Math.round(H));
                const octx = off.getContext("2d", {
                    willReadFrequently: true,
                }) as Ctx2D | null;

                if (!octx) {
                    return [];
                }

                const lines = wrapLines(octx, text);
                const blockH = lines.length * spec.lineHeight;

                const metrics = octx.measureText(text);
                const ascent =
                    metrics.fontBoundingBoxAscent ?? spec.lineHeight * 0.4;
                const descent =
                    metrics.fontBoundingBoxDescent ?? spec.lineHeight * 0.1;

                const y0 =
                    (H - blockH) / 2 +
                    spec.lineHeight / 2 +
                    (ascent - descent) / 2;

                octx.font = spec.font;
                octx.letterSpacing = spec.letterSpacing;
                octx.textAlign = "center";
                octx.textBaseline = "alphabetic";
                octx.fillStyle = "#fff";
                lines.forEach((ln, i) =>
                    octx.fillText(ln, W / 2, y0 + i * spec.lineHeight),
                );

                const img = octx.getImageData(0, 0, off.width, off.height).data;
                let g = gap;
                let pts = pick(img, off.width, off.height, g);

                while (pts.length > MAX_PARTICLES && g < 8) {
                    g += 0.5;
                    pts = pick(img, off.width, off.height, g);
                }

                return pts;
            };

            const makeParticle = (): Particle => {
                const a = 0.35 + Math.random() * 0.55;

                return {
                    x: Math.random() * W,
                    y: Math.random() * H,
                    angle: Math.random() * Math.PI * 2,
                    speed: 0.15 + Math.random() * 0.35,
                    pace: 0.8 + Math.random() * 0.5,
                    r: 0.6 + Math.random() * 0.9,
                    a,
                    baseA: a,
                    tx: 0,
                    ty: 0,
                };
            };

            const drift = (p: Particle): void => {
                p.angle += (Math.random() - 0.5) * 0.3;
                p.x += Math.cos(p.angle) * p.speed;
                p.y += Math.sin(p.angle) * p.speed;

                if (p.x < 0) {
                    p.x = 0;
                    p.angle = Math.PI - p.angle;
                } else if (p.x > W) {
                    p.x = W;
                    p.angle = Math.PI - p.angle;
                }

                if (p.y < 0) {
                    p.y = 0;
                    p.angle = -p.angle;
                } else if (p.y > H) {
                    p.y = H;
                    p.angle = -p.angle;
                }
            };

            const assignTargets = (): void => {
                const pts = [...particles].sort((a, b) => a.x - b.x);
                const tgs = [...targets].sort((a, b) => a.x - b.x);

                for (let i = 0; i < pts.length; i++) {
                    const t = tgs[i % tgs.length];
                    pts[i].tx = t.x + (Math.random() - 0.5) * 1.5;
                    pts[i].ty = t.y + (Math.random() - 0.5) * 1.5;
                }
            };

            const tick = (): void => {
                ctx.clearRect(0, 0, W, H);
                let settledCount = 0;

                for (const p of particles) {
                    if (state === "assembling") {
                        const dx = p.tx - p.x;
                        const dy = p.ty - p.y;
                        const dist = Math.hypot(dx, dy);
                        const step = speed * p.pace;

                        if (dist <= step) {
                            p.x = p.tx;
                            p.y = p.ty;
                            settledCount++;
                            if (revealStarted) {
                                p.a *= 0.93;
                            }
                        } else {
                            p.x += (dx / dist) * step;
                            p.y += (dy / dist) * step;
                        }
                    } else {
                        drift(p);
                    }

                    if (p.a > 0.01) {
                        ctx.fillStyle = `rgba(${INK}, ${p.a})`;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                if (state === "assembling") {
                    if (
                        !revealStarted &&
                        settledCount > particles.length * 0.55
                    ) {
                        revealStarted = true;
                        stage.classList.add("settled");
                        stage.setAttribute("aria-pressed", "true");
                    }

                    if (revealStarted && particles.every((p) => p.a <= 0.01)) {
                        state = "settled";
                        revealStarted = false;
                        ctx.clearRect(0, 0, W, H);
                        raf = null; // цикл остановлен
                        return;
                    }
                }

                raf = requestAnimationFrame(tick);
            };

            const start = (): void => {
                if (raf === null) {
                    raf = requestAnimationFrame(tick);
                }
            };

            const toggle = (): void => {
                if (state === "hidden") {
                    state = "assembling";
                    assignTargets();
                    start();
                } else if (state === "assembling") {
                    for (const p of particles) {
                        p.x = p.tx;
                        p.y = p.ty;
                    }
                    if (!revealStarted) {
                        revealStarted = true;
                        stage.classList.add("settled");
                        stage.setAttribute("aria-pressed", "true");
                    }
                } else {
                    state = "hidden";
                    stage.classList.remove("settled");
                    stage.setAttribute("aria-pressed", "false");
                    for (const p of particles) {
                        p.a = p.baseA;
                        p.x += (Math.random() - 0.5) * 14;
                        p.y += (Math.random() - 0.5) * 14;
                    }
                    start();
                }
            };

            const onKeyDown = (e: KeyboardEvent): void => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                }
            };

            stage.addEventListener("click", toggle);
            stage.addEventListener("keydown", onKeyDown);
            cleanups.push(() => {
                stage.removeEventListener("click", toggle);
                stage.removeEventListener("keydown", onKeyDown);
            });

            const setup = (): void => {
                const rect = stage.getBoundingClientRect();
                W = rect.width;
                H = Math.max(rect.height, 40);

                canvas.width = Math.round(W * dpr);
                canvas.height = Math.round(H * dpr);

                const context = canvas.getContext("2d");
                if (!context) {
                    return;
                }
                context.setTransform(dpr, 0, 0, dpr, 0, 0);
                ctx = context;

                const cs = getComputedStyle(textEl);
                spec = {
                    font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
                    lineHeight:
                        parseFloat(cs.lineHeight) ||
                        parseFloat(cs.fontSize) * 1.12,
                    letterSpacing: cs.letterSpacing || "0px",
                };

                const wasSettled = state === "settled";
                targets = sampleTargets();
                particles = targets.map(makeParticle);

                if (!wasSettled) {
                    state = "hidden";
                    stage.classList.remove("settled");
                    start();
                }
            };

            setup();

            let resizeTimer = 0;
            const observer = new ResizeObserver(() => {
                window.clearTimeout(resizeTimer);
                resizeTimer = window.setTimeout(() => {
                    if (cancelled) {
                        return;
                    }
                    const rect = stage.getBoundingClientRect();
                    const w = rect.width;
                    const h = Math.max(rect.height, 40);
                    if (Math.abs(w - W) > 0.5 || Math.abs(h - H) > 0.5) {
                        setup();
                    }
                }, 150);
            });
            observer.observe(stage);
            cleanups.push(() => {
                observer.disconnect();
                window.clearTimeout(resizeTimer);
            });
        };

        boot();

        return () => {
            cancelled = true;
            if (raf !== null) {
                cancelAnimationFrame(raf);
            }
            cleanups.forEach((fn) => fn());
        };
    }, [text, gap, speed]);

    return (
        <div
            ref={stageRef}
            className="text-spoiler-stage"
            role="button"
            tabIndex={0}
            aria-pressed="false"
            aria-label="Spoiler: click to show hidden text"
        >
            <div ref={textRef} className="text-spoiler-text">
                {text}
            </div>
            <canvas
                ref={canvasRef}
                className="text-spoiler-canvas"
                aria-hidden="true"
            />
        </div>
    );
};
