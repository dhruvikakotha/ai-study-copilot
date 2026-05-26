import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const generate = async (type) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/ai/${type}`, {
        text,
      });

      setOutput(res.data.result);
      setMode(type);
      setCardIndex(0);
      setFlipped(false);
    } catch (err) {
      console.error(err);
      setOutput("Error connecting to backend");
    }
  };

  const getFlashcards = () => {
    return output
      .split("Flashcard")
      .slice(1)
      .map((card) => {
        const parts = card.split("A:");

        const question = parts[0]
          ?.replace(/\*\*/g, "")
          .replace("Q:", "")
          .trim();

        const answer = parts[1]?.replace(/\*\*/g, "").trim();

        return { question, answer };
      });
  };

  const flashcards = getFlashcards();

  const nextCard = () => {
    setCardIndex((prev) =>
      prev === flashcards.length - 1 ? 0 : prev + 1
    );
    setFlipped(false);
  };

  const prevCard = () => {
    setCardIndex((prev) =>
      prev === 0 ? flashcards.length - 1 : prev - 1
    );
    setFlipped(false);
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
        <div className="content">
          <h1>AI Study Copilot</h1>

          <p className="subtitle">
            Paste notes. Generate study material instantly.
          </p>

          <textarea
            placeholder="Paste your notes here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="output">
            <h2>Output</h2>

            {mode === "flashcards" && flashcards.length > 0 ? (
              <div className="flashcard-area">
                <div
                  className={`flashcard-container ${flipped ? "flipped" : ""}`}
                  onClick={() => setFlipped(!flipped)}
                >
                  <div className="flashcard-inner">
                    <div className="flashcard-front">
                      <h3>{flashcards[cardIndex].question}</h3>
                    </div>

                    <div className="flashcard-back">
                      <p>{flashcards[cardIndex].answer}</p>
                    </div>
                  </div>
                </div>

                <div className="card-controls">
                  <button onClick={prevCard}>Back</button>
                  <span>
                    {cardIndex + 1} / {flashcards.length}
                  </span>
                  <button onClick={nextCard}>Next</button>
                </div>
              </div>
            ) : (
              <p>{output}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;