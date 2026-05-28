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
    summarize: "SUMMARY",
    flashcards: "FLASHCARDS",
    quiz: "QUIZ",
    explain: "SIMPLIFIED EXPLANATION",
    essay: "ESSAY FEEDBACK",
    resume: "RESUME FEEDBACK",
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
        (f) => f.startsWith("ppt/slides/slide") && f.endsWith(".xml")
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

  const resetTools = () => {
    setCardIndex(0);
    setFlipped(false);
    setQuizIndex(0);
    setSelectedAnswer("");
    setShowFeedback(false);
    setScore(0);
    setWrong(0);
    setQuizFinished(false);
  };

  const goHome = () => {
    setMode("");
    setOutput("");
  };

  const generate = async (type) => {
    if (!text.trim()) {
      setMode(type);
      resetTools();
      setOutput("Please paste or upload something first.");
      return;
    }

    try {
      setMode(type);
      setOutput("");
      setLoading(true);
      resetTools();

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

  const getFlashcards = () =>
    output
      .split("Flashcard")
      .slice(1)
      .map((card) => {
        const parts = card.split("A:");
        let question = parts[0]?.replace(/\*\*/g, "").replace("Q:", "").trim();
        question = question.replace(/^\s*\d+\.?\s*/, "");
        const answer = parts[1]?.replace(/\*\*/g, "").trim();
        return { question, answer };
      })
      .filter((card) => card.question && card.answer);

  const getQuiz = () =>
    output
      .split(/\n(?=\d+\.)/)
      .filter((q) => q.includes("Answer:"))
      .map((block) => {
        const lines = block.split("\n").filter(Boolean);

        return {
          question: lines[0].replace(/^\d+\.\s*/, "").trim(),
          options: lines
            .filter((l) => l.trim().startsWith("-"))
            .map((l) => l.replace("-", "").trim()),
          correctAnswer: lines
            .find((l) => l.includes("Answer:"))
            ?.replace("Answer:", "")
            .trim(),
        };
      })
      .filter((q) => q.question && q.options.length && q.correctAnswer);

  const flashcards = getFlashcards();
  const quiz = getQuiz();
  const currentQuiz = quiz[quizIndex];

  const chooseAnswer = (option) => {
    if (selectedAnswer) return;

    setSelectedAnswer(option);
    setShowFeedback(true);

    const correct = currentQuiz.correctAnswer.trim()[0];
    const selected = option.trim()[0];

    if (selected === correct) {
      setScore((s) => s + 1);
    } else {
      setWrong((w) => w + 1);
    }

    setTimeout(() => {
      setSelectedAnswer("");
      setShowFeedback(false);

      if (quizIndex < quiz.length - 1) {
        setQuizIndex((i) => i + 1);
      } else {
        setQuizFinished(true);
        confetti();
      }
    }, 2000);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Study Tools</h2>
        <button onClick={goHome}>Home</button>
        <button onClick={() => generate("summarize")}>Summary</button>
        <button onClick={() => generate("flashcards")}>Flashcards</button>
        <button onClick={() => generate("quiz")}>Quiz</button>
        <button onClick={() => generate("explain")}>Simplified Explanation</button>
        <button onClick={() => generate("essay")}>Essay Feedback</button>
        <button onClick={() => generate("resume")}>Resume Feedback</button>
      </aside>

      <main className="main">
        <div className="content">
          <h1>{mode ? titles[mode] : "AI Study Copilot"}</h1>

          {!mode && (
            <>
              <textarea
                placeholder="Paste or upload notes, essay, or resume..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              <input
                type="file"
                accept=".txt,.docx,.pdf,.pptx"
                onChange={uploadNotes}
              />
            </>
          )}

          {loading && (
            <div className="loading-box">
              <div className="spinner"></div>
              <p>Generating...</p>
            </div>
          )}

          {!loading && output === "Please paste or upload something first." && (
            <div className="output">
              <p>{output}</p>
            </div>
          )}

          {!loading &&
            output &&
            output !== "Please paste or upload something first." &&
            mode !== "flashcards" &&
            mode !== "quiz" && (
              <div className="output formatted-output">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {output}
                </ReactMarkdown>
              </div>
            )}

          {!loading && mode === "flashcards" && flashcards.length > 0 && (
            <div className="output">
              <h3>{flashcards[cardIndex].question}</h3>

              {flipped && <p>{flashcards[cardIndex].answer}</p>}

              <button onClick={() => setFlipped(!flipped)}>
                {flipped ? "Hide Answer" : "Show Answer"}
              </button>

              <button
                onClick={() => {
                  setCardIndex((cardIndex + 1) % flashcards.length);
                  setFlipped(false);
                  confetti();
                }}
              >
                Next
              </button>
            </div>
          )}

          {!loading && mode === "quiz" && currentQuiz && !quizFinished && (
            <div className="output">
              <h3>{currentQuiz.question}</h3>

              {currentQuiz.options.map((o, i) => (
                <button
                  key={i}
                  className={
                    selectedAnswer
                      ? o.trim()[0] === currentQuiz.correctAnswer.trim()[0]
                        ? "quiz-option correct"
                        : o === selectedAnswer
                        ? "quiz-option wrong"
                        : "quiz-option"
                      : "quiz-option"
                  }
                  onClick={() => chooseAnswer(o)}
                >
                  {o}
                </button>
              ))}

              {showFeedback &&
                selectedAnswer.trim()[0] !==
                  currentQuiz.correctAnswer.trim()[0] && (
                  <p className="feedback">
                    Correct answer: {currentQuiz.correctAnswer}
                  </p>
                )}
            </div>
          )}

          {!loading && mode === "quiz" && quizFinished && (
            <div className="output">
              <h2>Final Score: {score} / {quiz.length}</h2>
              <p>Wrong: {wrong}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
