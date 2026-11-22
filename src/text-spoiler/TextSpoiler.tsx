import { FC, useEffect, useRef, useState } from "react";
import type { ParticleSpoilerProps } from "./types";
import { createSpoilerEngine } from "./core/engine";
import "./TextSpoiler.css";

export const TextSpoiler: FC<ParticleSpoilerProps> = (props) => {
    const {
        text = "The secret is hidden in the dots",
        gap = 4,
        speed = 3,
    } = props;

    const stageRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [settled, setSettled] = useState(false);

    useEffect(() => {
        const stage = stageRef.current;
        const textEl = textRef.current;
        const canvas = canvasRef.current;

        if (!stage || !textEl || !canvas) {
            return;
        }

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setSettled(true);
            return;
        }

        const engine = createSpoilerEngine(stage, textEl, canvas, {
            text,
            gap,
            speed,
            onReveal: () => setSettled(true),
            onConceal: () => setSettled(false),
        });

        return () => engine.destroy();
    }, [text, gap, speed]);

    return (
        <div
            ref={stageRef}
            className={
                settled ? "text-spoiler-stage settled" : "text-spoiler-stage"
            }
            role="button"
            tabIndex={0}
            aria-pressed={settled}
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
