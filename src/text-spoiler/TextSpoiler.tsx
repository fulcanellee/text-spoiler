import { FC, useEffect, useRef, useState } from "react";
import type { TextSpoilerProps } from "./types";
import { createSpoilerEngine } from "./core/engine";
import { DEFAULT_PARTICLE_COLOR } from "./core/constants";
import "./TextSpoiler.css";

const TEXT = "The secret is hidden in the dots";

export const TextSpoiler: FC<TextSpoilerProps> = (props) => {
    const { color = DEFAULT_PARTICLE_COLOR } = props;

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
            text: TEXT,
            color,
            onReveal: () => setSettled(true),
            onConceal: () => setSettled(false),
        });

        return () => engine.destroy();
    }, [color]);

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
                {TEXT}
            </div>
            <canvas
                ref={canvasRef}
                className="text-spoiler-canvas"
                aria-hidden="true"
            />
        </div>
    );
};
