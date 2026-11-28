import { FC, useEffect, useMemo, useRef, useState } from "react";
import type { TextSpoilerProps } from "./types";
import { createSpoilerEngine } from "./core/engine";
import type { SpoilerEngine } from "./core/engine";
import { DEFAULT_PARTICLE_COLOR } from "./core/constants";
import styles from "./text-spoiler.module.css";

export const TextSpoiler: FC<TextSpoilerProps> = (props) => {
    const {
        in: revealed,
        color = DEFAULT_PARTICLE_COLOR,
        children: text,
        onRevealed,
        onHidden,
    } = props;

    const stageRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<SpoilerEngine | null>(null);

    const reducedMotion = useMemo(
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        [],
    );
    const [engineSettled, setEngineSettled] = useState(revealed);
    const settled = reducedMotion ? revealed : engineSettled;

    const revealedRef = useRef(revealed);
    const onRevealedRef = useRef(onRevealed);
    const onHiddenRef = useRef(onHidden);

    useEffect(() => {
        revealedRef.current = revealed;
        engineRef.current?.setRevealed(revealed);
    }, [revealed]);

    useEffect(() => {
        onRevealedRef.current = onRevealed;
        onHiddenRef.current = onHidden;
    }, [onRevealed, onHidden]);

    useEffect(() => {
        const stage = stageRef.current;
        const textEl = textRef.current;
        const canvas = canvasRef.current;

        if (!stage || !textEl || !canvas || reducedMotion) {
            return;
        }

        const engine = createSpoilerEngine(stage, textEl, canvas, {
            text,
            color,
            revealed: revealedRef.current,
            onReveal: () => setEngineSettled(true),
            onConceal: () => setEngineSettled(false),
            onRevealed: () => onRevealedRef.current?.(),
            onHidden: () => onHiddenRef.current?.(),
        });
        engineRef.current = engine;

        return () => {
            engine.destroy();
            engineRef.current = null;
        };
    }, [color, text, reducedMotion]);

    return (
        <div
            ref={stageRef}
            className={settled ? `${styles.stage} ${styles.settled}` : styles.stage}
        >
            <div ref={textRef} className={styles.text} style={{ color }}>
                {text}
            </div>
            <canvas
                ref={canvasRef}
                className={styles.canvas}
                aria-hidden="true"
            />
        </div>
    );
};
