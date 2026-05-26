import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");

  const generate = async (type) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/ai/${type}`, {
        text,
      });
      setOutput(res.data.result);
    } catch (err) {
      console.error(err);
      setOutput("Error connecting to backend");
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Study Tools</h2>

        <button onClick={() => generate("summarize")}>Summary</button>
        <button onClick={() => generate("flashcards")}>Flashcards</button>
        <button onClick={() => generate("quiz")}>Quiz</button>
        <button onClick={() => generate("explain")}>Explain Like I'm 5</button>
        <button onClick={() => generate("teacher")}>Teacher Mode</button>
      </aside>

      <main className="main">
        <h1>AI Study Copilot</h1>
        <p className="subtitle">Paste notes. Generate study material instantly.</p>

        <textarea
          placeholder="Paste your notes here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="output">
          <h2>Output</h2>
          <p>{output}</p>
        </div>
      </main>
    </div>
  );
}

export default App;