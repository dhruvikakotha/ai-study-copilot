import { useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");

  const generate = async (type) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/ai/${type}`,
        { text }
      );

      setOutput(res.data.result);
    } catch (err) {
      console.error(err);
      setOutput("Error connecting to backend");
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>AI Study Copilot</h1>

      <textarea
        rows="10"
        cols="60"
        placeholder="Paste your notes here..."
        onChange={(e) => setText(e.target.value)}
      />

      <br /><br />

      <button onClick={() => generate("summarize")}>Summary</button>
      <button onClick={() => generate("flashcards")}>Flashcards</button>
      <button onClick={() => generate("quiz")}>Quiz</button>
      <button onClick={() => generate("explain")}>Explain Like I'm 5</button>
      <button onClick={() => generate("teacher")}>Teacher Mode</button>

      <h2>Output:</h2>
      <p>{output}</p>
    </div>
  );
}

export default App;