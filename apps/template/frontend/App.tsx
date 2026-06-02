import "./App.css";

import { useState } from "react";

import Header from "./components/header/header";
import Button from "./components/button/button";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <Header level={1}>Here i am</Header>
      <Button onClick={() => setCount((c) => c + 1)}>
        Count: {count}
      </Button>
    </div>
  );
}

export default App;
