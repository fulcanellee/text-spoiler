import React, { useState } from 'react';
import './App.css';
import {TextSpoiler} from "./text-spoiler/TextSpoiler";

function App() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
          <div onClick={() => setRevealed((v) => !v)}>
              <TextSpoiler in={revealed}>The secret is hidden in the dots</TextSpoiler>
          </div>
      </header>
    </div>
  );
}

export default App;
