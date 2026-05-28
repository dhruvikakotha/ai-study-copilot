import { useState } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import mammoth from "mammoth";
import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function App() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("");
  const [loading, setLoading] = useState(false);

  // Flashcards
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Quiz
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const generate = async (type) => {
    if (!text.trim()) return;

    try {
      setMode(type);
      setLoading(true);
      setOutput("");

      setCardIndex(0);
      setFlipped(false);
      setQuizIndex(0);
      setSelectedAnswer("");
      setScore(0);
      setQuizFinished(false);

      const res = await axios.post(
        `https://ai-study-copilot-gdfo.onrender.com/api/ai/${type}`,
        { text }
      );

      setOutput(res.data.result);
    } catch {
      setOutput("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  // FLASHCARDS FIX
  const getFlashcards = () =>
    output.split("Flashcard").slice(1).map((card) => {
      const parts = card.split("A:");
      return {
        question: parts[0]?.replace("Q:", "").trim(),
        answer: parts[1]?.trim(),
      };
    });

  // QUIZ FIX
  const getQuiz = () =>
    output
      .split(/\n(?=\d+\.)/)
      .filter((q) => q.includes("Answer:"))
      .map((block) => {
        const lines = block.split("\n").filter(Boolean);
        return {
          question: lines[0].replace(/^\d+\.\s*/, "").trim(),
          options: lines
            .filter((l) => l.startsWith("-"))
            .map((l) => l.replace("-", "").trim()),
          correctAnswer: lines
            .find((l) => l.includes("Answer:"))
            ?.replace("Answer:", "")
            .trim(),
        };
      });

  const flashcards = getFlashcards();
  const quiz = getQuiz();
  const currentQuiz = quiz[quizIndex];

  const chooseAnswer = (option) => {
    if (selectedAnswer) return;

    setSelectedAnswer(option);

    if (option === currentQuiz.correctAnswer) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (quizIndex < quiz.length - 1) {
        setQuizIndex(quizIndex + 1);
        setSelectedAnswer("");
      } else {
        setQuizFinished(true);
        confetti();
      }
    }, 1200);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Study Tools</h2>
        <button onClick={() => setMode("")}>Home</button>
        <button onClick={() => generate("summarize")}>Summary</button>
        <button onClick={() => generate("flashcards")}>Flashcards</button>
        <button onClick={() => generate("quiz")}>Quiz</button>
        <button onClick={() => generate("explain")}>
          Simplified Explanation
        </button>
      </aside>

      <main className="main">
        <h1>{mode || "AI Study Copilot"}</h1>

        {!mode && (
          <>
            <textarea
              placeholder="Paste notes..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </>
        )}

        {loading && <p>Loading...</p>}

        {/* NORMAL OUTPUT */}
        {!loading &&
          output &&
          mode !== "flashcards" &&
          mode !== "quiz" && (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {output}
            </ReactMarkdown>
          )}

        {/* FLASHCARDS FIX */}
        {mode === "flashcards" && flashcards.length > 0 && (
          <div>
            <h3>{flashcards[cardIndex].question}</h3>
            {flipped && <p>{flashcards[cardIndex].answer}</p>}
            <button onClick={() => setFlipped(!flipped)}>Flip</button>
            <button
              onClick={() => {
                setCardIndex((cardIndex + 1) % flashcards.length);
                setFlipped(false);
              }}
            >
              Next
            </button>
          </div>
        )}

        {/* QUIZ FIX */}
        {mode === "quiz" && currentQuiz && !quizFinished && (
          <div>
            <h3>{currentQuiz.question}</h3>

            {currentQuiz.options.map((o, i) => (
              <button
                key={i}
                className={
                  selectedAnswer
                    ? o === currentQuiz.correctAnswer
                      ? "correct"
                      : o === selectedAnswer
                      ? "wrong"
                      : ""
                    : ""
                }
                onClick={() => chooseAnswer(o)}
              >
                {o}
              </button>
            ))}

            {selectedAnswer &&
              selectedAnswer !== currentQuiz.correctAnswer && (
                <p>
                  Correct answer: {currentQuiz.correctAnswer}
                </p>
              )}
          </div>
        )}

        {/* FINAL SCORE */}
        {quizFinished && (
          <div>
            <h2>Final Score: {score} / {quiz.length}</h2>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
