export interface ParticleSpoilerProps {
    text?: string;
    gap?: number;
    speed?: number;
}

export interface Particle {
    x: number;
    y: number;
    angle: number;
    speed: number;
    pace: number;
    r: number;
    a: number;
    baseA: number;
    tx: number;
    ty: number;
}

export interface FontSpec {
    font: string;
    lineHeight: number;
    letterSpacing: string;
}

export interface Point {
    x: number;
    y: number;
}

export type SpoilerState = "hidden" | "assembling" | "settled";

export type Canvas2DContext = CanvasRenderingContext2D & {
    letterSpacing?: string;
};
