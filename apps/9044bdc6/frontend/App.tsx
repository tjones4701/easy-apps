import "./App.css";
import { useState, useRef } from "react";

// Dot layouts for each face value
const DOT_COUNTS: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };

// Final rotations that show each face toward the viewer
// Format: [rotateX, rotateY] in degrees
const FACE_ROTATIONS: Record<number, [number, number]> = {
  1: [0, 0],       // front
  2: [0, -90],     // right face = 2
  3: [-90, 0],     // top face = 3
  4: [90, 0],      // bottom face = 4
  5: [0, 90],      // left face = 5
  6: [0, 180],     // back face = 6
};

function DiceFace({ value, className }: { value: number; className: string }) {
  const count = DOT_COUNTS[value];
  return (
    <div className={`dice-face face-${value} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="dot" />
      ))}
    </div>
  );
}

export default function App() {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const diceRef = useRef<HTMLDivElement>(null);

  const roll = () => {
    if (rolling) return;

    const rolled = Math.floor(Math.random() * 6) + 1;
    const [finalX, finalY] = FACE_ROTATIONS[rolled];

    // We add full spins on top of the final position for drama
    const extraSpins = 3;
    const cssX = extraSpins * 360 + finalX;
    const cssY = extraSpins * 360 + finalY;

    if (diceRef.current) {
      diceRef.current.style.setProperty("--final-x", `${cssX}deg`);
      diceRef.current.style.setProperty("--final-y", `${cssY}deg`);
    }

    setRolling(true);
    setResult(null);

    setTimeout(() => {
      setRolling(false);
      setResult(rolled);
      setHistory((prev) => [...prev.slice(-4), rolled]);

      // Lock the dice visually on the landed face
      if (diceRef.current) {
        diceRef.current.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;
      }
    }, 1250);
  };

  return (
    <div className="app">
      <h1 className="title">
        Random <span>Roller</span>
      </h1>

      <div className="dice-scene">
        <div
          ref={diceRef}
          className={`dice-cube ${rolling ? "rolling" : ""}`}
        >
          <DiceFace value={1} className="face-front" />
          <DiceFace value={2} className="face-right" />
          <DiceFace value={3} className="face-top" />
          <DiceFace value={4} className="face-bottom" />
          <DiceFace value={5} className="face-left" />
          <DiceFace value={6} className="face-back" />
        </div>
      </div>

      <div className="result-display">
        {result !== null && !rolling && (
          <>
            <div className="result-number" key={result}>{result}</div>
            <div className="result-label">You rolled a {result}!</div>
          </>
        )}
        {rolling && (
          <div className="result-label">Rolling…</div>
        )}
        {result === null && !rolling && (
          <div className="result-label">Press roll to start</div>
        )}
      </div>

      <button className="roll-button" onClick={roll} disabled={rolling}>
        🎲 Roll the Dice
      </button>

      {history.length > 0 && (
        <div className="history">
          <div className="history-label">Recent rolls</div>
          <div className="history-dots">
            {history.map((n, i) => (
              <div className="history-chip" key={i}>{n}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
