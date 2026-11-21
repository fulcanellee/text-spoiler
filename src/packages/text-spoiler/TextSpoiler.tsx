import {FC, useEffect, useRef} from 'react';
import type { ParticleSpoilerProps } from './types';
import './TextSpoiler.css';

export const TextSpoiler: FC<ParticleSpoilerProps> = (props) => {
    const { text = 'The secret is hidden in the dots' } = props

    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const stage = stageRef.current;
        const canvas = canvasRef.current;

        if (!stage || !canvas) {
            return;

        }

        const rect = stage.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const W = rect.width;
        const H = Math.max(rect.height, 40);

        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // TODO: For debug
        ctx.strokeStyle = 'rgba(184,224,216,0.6)';
        ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    }, [text]);

    return (
        <div ref={stageRef} className="text-spoiler-stage">
            <div className="text-spoiler-text">{text}</div>
            <canvas ref={canvasRef} className="text-spoiler-canvas" aria-hidden="true" />
        </div>
    );
}