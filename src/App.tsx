import React from "react";
import "./App.css";
import { TextSpoiler } from "./text-spoiler/TextSpoiler";

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <TextSpoiler>The secret is hidden in the dots</TextSpoiler>
            </header>
        </div>
    );
}

export default App;
