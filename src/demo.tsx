import React, { useState } from "react";
import { ColorPicker } from "antd";
import styles from "./demo.module.css";
import { TextSpoiler } from "./text-spoiler/text-spoiler";
import { DEFAULT_PARTICLE_COLOR } from "./text-spoiler/core/constants";

function Demo() {
    const [revealed, setRevealed] = useState(false);
    const [color, setColor] = useState(DEFAULT_PARTICLE_COLOR);

    return (
        <div className={styles.root}>
            <header className={styles.header}>
                <div onClick={() => setRevealed((v) => !v)}>
                    <TextSpoiler in={revealed} color={color}>
                        The secret is hidden in the dots
                    </TextSpoiler>
                </div>
                <div className={styles.controls}>
                    <span className={styles.controlsLabel}>Color</span>
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
