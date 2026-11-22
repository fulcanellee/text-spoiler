import type { Particle } from "../types";
import { ALPHA_EPSILON, INK_RGB } from "./constants";

export const renderFrame = (
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    width: number,
    height: number,
): void => {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
        if (p.a > ALPHA_EPSILON) {
            ctx.fillStyle = `rgba(${INK_RGB}, ${p.a})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

export interface RenderLoop {
    start(): void;
    stop(): void;
}

export const createRenderLoop = (onFrame: () => boolean): RenderLoop => {
    let raf: number | null = null;

    const tick = (): void => {
        const keepRunning = onFrame();
        raf = keepRunning ? requestAnimationFrame(tick) : null;
    };

    return {
        start() {
            if (raf === null) {
                raf = requestAnimationFrame(tick);
            }
        },
        stop() {
            if (raf !== null) {
                cancelAnimationFrame(raf);
                raf = null;
            }
        },
    };
};
