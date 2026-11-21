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