import React, { useState } from "react";
import { ColorPicker } from "antd";
import "./Demo.css";
import { TextSpoiler } from "./text-spoiler/TextSpoiler";
import { DEFAULT_PARTICLE_COLOR } from "./text-spoiler/core/constants";

function Demo() {
    const [revealed, setRevealed] = useState(false);
    const [color, setColor] = useState(DEFAULT_PARTICLE_COLOR);

    return (
        <div className="Demo">
            <header className="Demo-header">
                <div onClick={() => setRevealed((v) => !v)}>
                    <TextSpoiler in={revealed} color={color}>
                        The secret is hidden in the dots
                    </TextSpoiler>
                </div>
                <div className="Demo-controls">
                    <span className="Demo-controls-label">Color</span>
                    <ColorPicker
                        value={color}
                        onChange={(value) => setColor(value.toHexString())}
                    />
                </div>
            </header>
        </div>
    );
}

export default Demo;
