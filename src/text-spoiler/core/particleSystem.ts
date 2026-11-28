import type { Particle, Point } from "../types";
import {
    DRIFT_ANGLE_JITTER,
    FADE_FACTOR,
    HIDE_SCATTER_DISTANCE,
    PARTICLE_ALPHA_MIN,
    PARTICLE_ALPHA_RANGE,
    PARTICLE_PACE_MIN,
    PARTICLE_PACE_RANGE,
    PARTICLE_RADIUS_MIN,
    PARTICLE_RADIUS_RANGE,
    PARTICLE_SPEED_MIN,
    PARTICLE_SPEED_RANGE,
    TARGET_JITTER,
} from "./constants";

export const createParticle = (width: number, height: number): Particle => {
    const a = PARTICLE_ALPHA_MIN + Math.random() * PARTICLE_ALPHA_RANGE;

    return {
        x: Math.random() * width,
        y: Math.random() * height,
        angle: Math.random() * Math.PI * 2,
        speed: PARTICLE_SPEED_MIN + Math.random() * PARTICLE_SPEED_RANGE,
        pace: PARTICLE_PACE_MIN + Math.random() * PARTICLE_PACE_RANGE,
        r: PARTICLE_RADIUS_MIN + Math.random() * PARTICLE_RADIUS_RANGE,
        a,
        baseA: a,
        tx: 0,
        ty: 0,
    };
};

export const createParticles = (
    count: number,
    width: number,
    height: number,
): Particle[] => Array.from({ length: count }, () => createParticle(width, height));

export const driftParticle = (
    p: Particle,
    width: number,
    height: number,
): void => {
    p.angle += (Math.random() - 0.5) * DRIFT_ANGLE_JITTER;
    p.x += Math.cos(p.angle) * p.speed;
    p.y += Math.sin(p.angle) * p.speed;

    if (p.x < 0) {
        p.x = 0;
        p.angle = Math.PI - p.angle;
    } else if (p.x > width) {
        p.x = width;
        p.angle = Math.PI - p.angle;
    }

    if (p.y < 0) {
        p.y = 0;
        p.angle = -p.angle;
    } else if (p.y > height) {
        p.y = height;
        p.angle = -p.angle;
    }
};

export const seekTarget = (
    p: Particle,
    speed: number,
    fading: boolean,
): boolean => {
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const dist = Math.hypot(dx, dy);
    const step = speed * p.pace;

    if (dist <= step) {
        p.x = p.tx;
        p.y = p.ty;
        if (fading) {
            p.a *= FADE_FACTOR;
        }
        return true;
    }

    p.x += (dx / dist) * step;
    p.y += (dy / dist) * step;
    return false;
};

export const assignTargets = (
    particles: Particle[],
    targets: Point[],
): void => {
    const sortedParticles = [...particles].sort((a, b) => a.x - b.x);
    const sortedTargets = [...targets].sort((a, b) => a.x - b.x);

    for (let i = 0; i < sortedParticles.length; i++) {
        const t = sortedTargets[i % sortedTargets.length];
        sortedParticles[i].tx = t.x + (Math.random() - 0.5) * TARGET_JITTER;
        sortedParticles[i].ty = t.y + (Math.random() - 0.5) * TARGET_JITTER;
    }
};

export const scatterParticles = (particles: Particle[]): void => {
    for (const p of particles) {
        p.a = p.baseA;
        p.x += (Math.random() - 0.5) * HIDE_SCATTER_DISTANCE;
        p.y += (Math.random() - 0.5) * HIDE_SCATTER_DISTANCE;
    }
};
