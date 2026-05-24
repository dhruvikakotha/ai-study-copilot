import { useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");

  const generateSummary = async () => {
    const res = await axios.post("http://localhost:5000/api/ai/summarize", {
      text,
    });

    setOutput(res.data.result);
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

      <button onClick={generateSummary}>Generate Summary</button>

      <h2>Output:</h2>
      <p>{output}</p>
    </div>
  );
}

export default App;