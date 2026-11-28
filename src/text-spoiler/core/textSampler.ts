import type { Canvas2DContext, FontSpec, Point } from "../types";
import {
    ALPHA_THRESHOLD,
    ASCENT_FALLBACK_RATIO,
    DESCENT_FALLBACK_RATIO,
    GAP_STEP,
    MAX_GAP,
    MAX_PARTICLES,
} from "./constants";

const wrapLines = (
    ctx: Canvas2DContext,
    text: string,
    spec: FontSpec,
    maxWidth: number,
): string[] => {
    ctx.font = spec.font;
    ctx.letterSpacing = spec.letterSpacing;
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
        const probe = line ? line + " " + word : word;
        if (line && ctx.measureText(probe).width > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = probe;
        }
    }
    if (line) {
        lines.push(line);
    }
    return lines;
};

const pickPoints = (
    img: Uint8ClampedArray,
    width: number,
    height: number,
    gap: number,
): Point[] => {
    const points: Point[] = [];
    const step = Math.max(1, Math.round(gap));

    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            if (img[(y * width + x) * 4 + 3] > ALPHA_THRESHOLD) {
                points.push({ x, y });
            }
        }
    }
    return points;
};

export const sampleTextTargets = (
    text: string,
    spec: FontSpec,
    width: number,
    height: number,
    gap: number,
): Point[] => {
    const offscreen = document.createElement("canvas");
    offscreen.width = Math.max(1, Math.round(width));
    offscreen.height = Math.max(1, Math.round(height));
    const ctx = offscreen.getContext("2d", {
        willReadFrequently: true,
    }) as Canvas2DContext | null;

    if (!ctx) {
        return [];
    }

    const lines = wrapLines(ctx, text, spec, width);
    const blockHeight = lines.length * spec.lineHeight;

    const metrics = ctx.measureText(text);
    const ascent =
        metrics.fontBoundingBoxAscent ??
        spec.lineHeight * ASCENT_FALLBACK_RATIO;
    const descent =
        metrics.fontBoundingBoxDescent ??
        spec.lineHeight * DESCENT_FALLBACK_RATIO;

    const y0 =
        (height - blockHeight) / 2 +
        spec.lineHeight / 2 +
        (ascent - descent) / 2;

    ctx.font = spec.font;
    ctx.letterSpacing = spec.letterSpacing;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#fff";
    lines.forEach((line, i) =>
        ctx.fillText(line, width / 2, y0 + i * spec.lineHeight),
    );

    const img = ctx.getImageData(0, 0, offscreen.width, offscreen.height).data;
    let currentGap = gap;
    let points = pickPoints(img, offscreen.width, offscreen.height, currentGap);

    while (points.length > MAX_PARTICLES && currentGap < MAX_GAP) {
        currentGap += GAP_STEP;
        points = pickPoints(img, offscreen.width, offscreen.height, currentGap);
    }

    return points;
};
