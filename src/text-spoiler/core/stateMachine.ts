import type { SpoilerState } from "../types";

export type SpoilerEffect =
    | "assign-targets"
    | "scatter"
    | "start-loop"
    | "stop-loop"
    | "reveal"
    | "conceal";

export type SpoilerEvent =
    | { type: "toggle" }
    | { type: "reveal-threshold" }
    | { type: "particles-gone" }
    | { type: "reset"; settled: boolean };

export interface SpoilerStateMachine {
    getState(): SpoilerState;
    isRevealStarted(): boolean;
    send(event: SpoilerEvent): SpoilerEffect[];
}

export const createSpoilerStateMachine = (): SpoilerStateMachine => {
    let state: SpoilerState = "hidden";
    let revealStarted = false;

    const send = (event: SpoilerEvent): SpoilerEffect[] => {
        switch (event.type) {
            case "toggle": {
                if (state === "hidden") {
                    state = "assembling";
                    return ["assign-targets", "start-loop"];
                }
                state = "hidden";
                revealStarted = false;
                return ["conceal", "scatter", "start-loop"];
            }
            case "reveal-threshold": {
                if (state === "assembling" && !revealStarted) {
                    revealStarted = true;
                    return ["reveal"];
                }
                return [];
            }
            case "particles-gone": {
                if (state === "assembling" && revealStarted) {
                    state = "settled";
                    revealStarted = false;
                    return ["stop-loop"];
                }
                return [];
            }
            case "reset": {
                if (!event.settled) {
                    state = "hidden";
                    return ["conceal", "start-loop"];
                }
                return [];
            }
        }
    };

    return {
        getState: () => state,
        isRevealStarted: () => revealStarted,
        send,
    };
};
