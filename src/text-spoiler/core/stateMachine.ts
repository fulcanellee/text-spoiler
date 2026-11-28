import type { SpoilerState } from "../types";

export type SpoilerEffect =
    | "assign-targets"
    | "scatter"
    | "start-loop"
    | "stop-loop"
    | "reveal"
    | "conceal"
    | "notify-revealed"
    | "notify-hidden";

export type SpoilerEvent =
    | { type: "set-revealed"; revealed: boolean }
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
            case "set-revealed": {
                if (event.revealed) {
                    if (state === "hidden") {
                        state = "assembling";
                        return ["assign-targets", "start-loop"];
                    }
                    return [];
                }
                if (state !== "hidden") {
                    state = "hidden";
                    revealStarted = false;
                    return [
                        "conceal",
                        "scatter",
                        "start-loop",
                        "notify-hidden",
                    ];
                }
                return [];
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
                    return ["stop-loop", "notify-revealed"];
                }
                return [];
            }
            case "reset": {
                if (event.settled) {
                    if (state === "settled") {
                        return [];
                    }
                    state = "settled";
                    revealStarted = false;
                    return ["reveal"];
                }
                state = "hidden";
                revealStarted = false;
                return ["conceal", "start-loop"];
            }
        }
    };

    return {
        getState: () => state,
        isRevealStarted: () => revealStarted,
        send,
    };
};
