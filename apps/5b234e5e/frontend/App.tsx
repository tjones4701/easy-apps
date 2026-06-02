import "./App.css";
import { useState, useRef } from "react";

const DICE_FACES: Record<number, string> = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

const DOT_POSITIONS: Record<number, { top: string; left: string }[]> = {
  1: [{ top: "50%", left: "50%" }],
  2: [{ top: "25%", left: "25%" }, { top: "75%", left: "75%" }],
  3: [{ top: "25%", left: "25%" }, { top: "50%", left: "50%" }, { top: "75%", left: "75%" }],
  4: [
    { top: "25%", left: "25%" }, { top: "25%", left: "75%" },
    { top: "75%", left: "25%" }, { top: "75%", left: "75%" },
  ],
  5: [
    { top: "25%", left: "25%" }, { top: "25%", left: "75%" },
    { top: "50%", left: "50%" },
    { top: "75%", left: "25%" }, { top: "75%", left: "75%" },
  ],
  6: [
    { top: "22%", left: "25%" }, { top: "22%", left: "75%" },
    { top: "50%", left: "25%" }, { top: "50%", left: "75%" },
    { top: "78%", left: "25%" }, { top: "78%", left: "75%" },
  ],
};

function DiceFace({ value }: { value: number }) {
  const dots = DOT_POSITIONS[value] || [];
  return (
    <div className="dice-face">
      {dots.map((pos, i) => (
        <span
          key={i}
          className="dot"
          style={{
            top: `calc(${pos.top} - 8px)`,
            left: `calc(${pos.left} - 8px)`,
          }}
        />
      ))}
    </div>
  );
}

function App() {
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [diceCount, setDiceCount] = useState(1);
  const [multiResults, setMultiResults] = useState<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rollDice = () => {
    if (rolling) return;
    setRolling(true);
    setResult(null);
    setMultiResults([]);

    let ticks = 0;
    const maxTicks = 18;
    const interval = setInterval(() => {
      setMultiResults(
        Array.from({ length: diceCount }, () => Math.ceil(Math.random() * 6))
      );
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        const finals = Array.from({ length: diceCount }, () =>
          Math.ceil(Math.random() * 6)
        );
        setMultiResults(finals);
        const total = finals.reduce((a, b) => a + b, 0);
        setResult(total);
        setHistory((prev) => [total, ...prev].slice(0, 10));
        setRolling(false);
      }
    }, 80);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  };

  const totalMax = diceCount * 6;
  const totalMin = diceCount;

  return (
    <div className="app-root">
      <div className="card">
        <h1 className="title">🎲 Random Roller</h1>

        <div className="dice-count-row">
          <button
            className="count-btn"
            onClick={() => setDiceCount((d) => Math.max(1, d - 1))}
            disabled={rolling}
          >
            −
          </button>
          <span className="count-label">
            {diceCount} {diceCount === 1 ? "die" : "dice"}
          </span>
          <button
            className="count-btn"
            onClick={() => setDiceCount((d) => Math.min(6, d + 1))}
            disabled={rolling}
          >
            +
          </button>
        </div>

        <div className={`dice-tray ${rolling ? "rolling" : ""} count-${diceCount}`}>
          {multiResults.length > 0
            ? multiResults.map((v, i) => (
                <div
                  key={i}
                  className={`dice-wrapper ${rolling ? "shake" : "landed"}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <DiceFace value={v} />
                </div>
              ))
            : Array.from({ length: diceCount }).map((_, i) => (
                <div key={i} className="dice-wrapper idle">
                  <DiceFace value={1} />
                </div>
              ))}
        </div>

        {result !== null && !rolling && (
          <div className="result-block">
            <span className="result-label">
              {diceCount > 1 ? "Total" : "Result"}
            </span>
            <span className="result-value">{result}</span>
            {diceCount > 1 && (
              <span className="result-range">
                ({totalMin}–{totalMax})
              </span>
            )}
          </div>
        )}

        <button className="roll-btn" onClick={rollDice} disabled={rolling}>
          {rolling ? "Rolling…" : "Roll!"}
        </button>

        {history.length > 0 && (
          <div className="history">
            <span className="history-label">History: </span>
            {history.map((h, i) => (
              <span key={i} className="history-pip">
                {h}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
