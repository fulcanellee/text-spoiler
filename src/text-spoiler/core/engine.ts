import type { FontSpec, Particle, Point } from "../types";
import {
    ALPHA_EPSILON,
    LINE_HEIGHT_FALLBACK_RATIO,
    MAX_DEVICE_PIXEL_RATIO,
    MIN_STAGE_HEIGHT,
    RESIZE_DEBOUNCE_MS,
    RESIZE_TOLERANCE,
    REVEAL_SETTLED_RATIO,
} from "./constants";
import {
    assignTargets,
    createParticles,
    driftParticle,
    scatterParticles,
    seekTarget,
    snapToTargets,
} from "./particleSystem";
import { createSpoilerStateMachine } from "./stateMachine";
import type { SpoilerEffect } from "./stateMachine";
import { createRenderLoop, renderFrame } from "./renderer";
import { sampleTextTargets } from "./textSampler";

export interface SpoilerEngineOptions {
    text: string;
    gap: number;
    speed: number;
    onReveal(): void;
    onConceal(): void;
}

export interface SpoilerEngine {
    destroy(): void;
}

export const createSpoilerEngine = (
    stage: HTMLDivElement,
    textEl: HTMLDivElement,
    canvas: HTMLCanvasElement,
    { text, gap, speed, onReveal, onConceal }: SpoilerEngineOptions,
): SpoilerEngine => {
    let cancelled = false;
    const cleanups: Array<() => void> = [];

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

        const dpr = Math.min(
            window.devicePixelRatio || 1,
            MAX_DEVICE_PIXEL_RATIO,
        );

        let W = 0;
        let H = 0;
        let ctx: CanvasRenderingContext2D;
        let spec: FontSpec;
        let targets: Point[] = [];
        let particles: Particle[] = [];

        const machine = createSpoilerStateMachine();

        const applyEffects = (effects: SpoilerEffect[]): boolean => {
            let stopLoop = false;
            for (const effect of effects) {
                switch (effect) {
                    case "assign-targets":
                        assignTargets(particles, targets);
                        break;
                    case "snap-to-targets":
                        snapToTargets(particles);
                        break;
                    case "scatter":
                        scatterParticles(particles);
                        break;
                    case "start-loop":
                        loop.start();
                        break;
                    case "stop-loop":
                        stopLoop = true;
                        break;
                    case "reveal":
                        onReveal();
                        break;
                    case "conceal":
                        onConceal();
                        break;
                }
            }
            return stopLoop;
        };

        const onFrame = (): boolean => {
            let settledCount = 0;
            const assembling = machine.getState() === "assembling";

            for (const p of particles) {
                if (assembling) {
                    if (seekTarget(p, speed, machine.isRevealStarted())) {
                        settledCount++;
                    }
                } else {
                    driftParticle(p, W, H);
                }
            }

            renderFrame(ctx, particles, W, H);

            if (assembling) {
                if (settledCount > particles.length * REVEAL_SETTLED_RATIO) {
                    applyEffects(machine.send({ type: "reveal-threshold" }));
                }

                if (
                    machine.isRevealStarted() &&
                    particles.every((p) => p.a <= ALPHA_EPSILON)
                ) {
                    const stopLoop = applyEffects(
                        machine.send({ type: "particles-gone" }),
                    );
                    if (stopLoop) {
                        ctx.clearRect(0, 0, W, H);
                        return false;
                    }
                }
            }

            return true;
        };

        const loop = createRenderLoop(onFrame);
        cleanups.push(() => loop.stop());

        const toggle = (): void => {
            applyEffects(machine.send({ type: "toggle" }));
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
            H = Math.max(rect.height, MIN_STAGE_HEIGHT);

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
                    parseFloat(cs.fontSize) * LINE_HEIGHT_FALLBACK_RATIO,
                letterSpacing: cs.letterSpacing || "0px",
            };

            const wasSettled = machine.getState() === "settled";
            targets = sampleTextTargets(text, spec, W, H, gap);
            particles = createParticles(targets.length, W, H);
            applyEffects(
                machine.send({ type: "reset", settled: wasSettled }),
            );
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
                const h = Math.max(rect.height, MIN_STAGE_HEIGHT);
                if (
                    Math.abs(w - W) > RESIZE_TOLERANCE ||
                    Math.abs(h - H) > RESIZE_TOLERANCE
                ) {
                    setup();
                }
            }, RESIZE_DEBOUNCE_MS);
        });
        observer.observe(stage);
        cleanups.push(() => {
            observer.disconnect();
            window.clearTimeout(resizeTimer);
        });
    };

    void boot();

    return {
        destroy() {
            cancelled = true;
            cleanups.forEach((fn) => fn());
        },
    };
};
