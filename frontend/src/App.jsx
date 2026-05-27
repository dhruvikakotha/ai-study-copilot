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

  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const titles = {
    summarize: "Summary",
    flashcards: "Flashcards",
    quiz: "Quiz",
    explain: "Explain Like I'm 5",
  };

  const uploadNotes = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "text/plain") {
      setText(await file.text());
    } else if (file.name.endsWith(".docx")) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      setText(result.value);
    } else if (file.name.endsWith(".pdf")) {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item) => item.str).join(" ") + "\n";
      }

      setText(fullText);
    } else if (file.name.endsWith(".pptx")) {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      let fullText = "";

      const slides = Object.keys(zip.files).filter(
        (fileName) =>
          fileName.startsWith("ppt/slides/slide") &&
          fileName.endsWith(".xml")
      );

      for (const slide of slides) {
        const xml = await zip.files[slide].async("text");
        const matches = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)];
        fullText += matches.map((m) => m[1]).join(" ") + "\n";
      }

      setText(fullText);
    } else {
      alert("Upload a .txt, .docx, .pdf, or .pptx file.");
    }
  };

  const goHome = () => {
    setMode("");
    setOutput("");
  };

  const generate = async (type) => {
    try {
      setMode(type);
      setOutput("");
      setLoading(true);

      setCardIndex(0);
      setFlipped(false);
      setQuizIndex(0);
      setSelectedAnswer("");
      setShowFeedback(false);
      setScore(0);
      setWrong(0);
      setQuizFinished(false);

      const res = await axios.post(`http://localhost:5000/api/ai/${type}`, {
        text,
      });

      setOutput(res.data.result);
    } catch {
      setOutput("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  const getFlashcards = () => {
    return output.split("Flashcard").slice(1).map((card) => {
      const parts = card.split("A:");

      let question = parts[0]
        ?.replace(/\*\*/g, "")
        .replace("Q:", "")
        .trim();

      question = question.replace(/^\s*\d+\.?\s*/, "");

      const answer = parts[1]?.replace(/\*\*/g, "").trim();

      return { question, answer };
    });
  };

  const getQuiz = () => {
    return output
      .split(/\n(?=\d+\.)/)
      .filter((q) => q.includes("Answer:"))
      .map((block) => {
        const lines = block.split("\n").filter(Boolean);

        const question = lines[0]
          .replace(/\*\*/g, "")
          .replace(/^\d+\.\s*/, "")
          .trim();

        const options = lines
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => line.replace("-", "").trim());

        const correctAnswer = lines
          .find((line) => line.includes("Answer:"))
          ?.replace(/\*\*/g, "")
          .replace("Answer:", "")
          .trim();

        return { question, options, correctAnswer };
      });
  };

  const flashcards = getFlashcards();
  const quiz = getQuiz();
  const currentQuiz = quiz[quizIndex];

  const nextCard = () => {
    if (cardIndex < flashcards.length - 1) {
      setCardIndex((prev) => prev + 1);
    } else {
      confetti({ particleCount: 150, spread: 80 });
    }

    setFlipped(false);
  };

  const prevCard = () => {
    setCardIndex((prev) =>
      prev === 0 ? flashcards.length - 1 : prev - 1
    );
    setFlipped(false);
  };

  const chooseAnswer = (option) => {
    setSelectedAnswer(option);
    setShowFeedback(true);

    const correctLetter = currentQuiz.correctAnswer.trim()[0];
    const selectedLetter = option.trim()[0];

    if (selectedLetter === correctLetter) setScore((prev) => prev + 1);
    else setWrong((prev) => prev + 1);

    setTimeout(() => {
      setSelectedAnswer("");
      setShowFeedback(false);

      if (quizIndex < quiz.length - 1) {
        setQuizIndex((prev) => prev + 1);
      } else {
        setQuizFinished(true);
        confetti({ particleCount: 150, spread: 80 });
      }
    }, 1200);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Study Tools</h2>

        <button onClick={goHome}>Home</button>
        <button onClick={() => generate("summarize")}>Summary</button>
        <button onClick={() => generate("flashcards")}>Flashcards</button>
        <button onClick={() => generate("quiz")}>Quiz</button>
        <button onClick={() => generate("explain")}>
          Explain Like I'm 5
        </button>
      </aside>

      <main className="main">
        <div className="content">
          <h1>{mode ? titles[mode] : "AI Study Copilot"}</h1>

          {!mode && (
            <>
              <textarea
                placeholder="Paste or upload notes..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              <input
                type="file"
                accept=".txt,.docx,.pdf,.pptx"
                onChange={uploadNotes}
              />

              <p className="upload-note">
                Upload a .txt, .docx, .pdf, or .pptx file. For Google Docs,
                download as PDF or Word first.
              </p>
            </>
          )}

          {loading && (
            <div className="loading-box">
              <div className="spinner"></div>
              <p>Generating...</p>
            </div>
          )}

          {!loading && mode === "summarize" && output && (
            <div className="output formatted-output">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {output}
              </ReactMarkdown>
            </div>
          )}

          {!loading && mode === "flashcards" && flashcards.length > 0 && (
            <div className="output">
              <div
                className={`flashcard-container ${flipped ? "flipped" : ""}`}
                onClick={() => setFlipped(!flipped)}
              >
                <div className="flashcard-inner">
                  <div className="flashcard-front">
                    <div className="flashcard-number">{cardIndex + 1}</div>
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
          )}

          {!loading && mode === "quiz" && quiz.length > 0 && currentQuiz && (
            <div className="output">
              {quizFinished ? (
                <div className="quiz-card">
                  <h3>Quiz Complete!</h3>
                  <p>Correct: {score}</p>
                  <p>Wrong: {wrong}</p>
                  <p>Total: {quiz.length}</p>
                </div>
              ) : (
                <div className="quiz-card">
                  <h3>
                    {quizIndex + 1}. {currentQuiz.question}
                  </h3>

                  {currentQuiz.options.map((option, i) => {
                    const correctLetter = currentQuiz.correctAnswer.trim()[0];
                    const optionLetter = option.trim()[0];

                    let className = "quiz-option";

                    if (showFeedback) {
                      if (optionLetter === correctLetter) className += " correct";
                      else if (selectedAnswer === option) className += " wrong";
                    }

                    return (
                      <button
                        key={i}
                        className={className}
                        onClick={() => chooseAnswer(option)}
                        disabled={showFeedback}
                      >
                        {option}
                      </button>
                    );
                  })}

                  {showFeedback && (
                    <p className="feedback">
                      {selectedAnswer.trim()[0] ===
                      currentQuiz.correctAnswer.trim()[0]
                        ? "Correct!"
                        : `Incorrect. Right answer ${currentQuiz.correctAnswer.trim()[0]}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {!loading &&
            mode &&
            mode !== "summarize" &&
            mode !== "flashcards" &&
            mode !== "quiz" &&
            output && (
              <div className="output formatted-output">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {output}
                </ReactMarkdown>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default App;