import type { Particle } from "../types";
import { ALPHA_EPSILON, INK_RGB } from "./constants";

const COLOR_SENTINEL = "#010203";

export const resolveColorChannels = (color: string): string => {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) {
        return INK_RGB;
    }

    ctx.fillStyle = COLOR_SENTINEL;
    ctx.fillStyle = color;
    const normalized = ctx.fillStyle;

    if (
        normalized === COLOR_SENTINEL &&
        color.trim().toLowerCase() !== COLOR_SENTINEL
    ) {
        return INK_RGB;
    }

    if (normalized.startsWith("#")) {
        const r = parseInt(normalized.slice(1, 3), 16);
        const g = parseInt(normalized.slice(3, 5), 16);
        const b = parseInt(normalized.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    }

    const match = normalized.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        return `${match[1]}, ${match[2]}, ${match[3]}`;
    }

    return INK_RGB;
};

export const renderFrame = (
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    width: number,
    height: number,
    ink: string,
): void => {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
        if (p.a > ALPHA_EPSILON) {
            ctx.fillStyle = `rgba(${ink}, ${p.a})`;
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
