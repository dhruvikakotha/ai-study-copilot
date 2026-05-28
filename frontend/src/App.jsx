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
  const [finishedCards, setFinishedCards] = useState(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const titles = {
    summarize: "Summary",
    flashcards: "Flashcards",
    quiz: "Quiz",
    explain: "Simplified Explanation",
    essay: "Essay Feedback",
    resume: "Resume Feedback",
  };

  const resetAll = () => {
    setMode("");
    setOutput("");
    setText("");
    setCardIndex(0);
    setFlipped(false);
    setFinishedCards(false);
    setQuizIndex(0);
    setSelectedAnswer("");
    setScore(0);
    setWrong(0);
    setQuizFinished(false);
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

      const slides = Object.keys(zip.files).filter((f) =>
        f.startsWith("ppt/slides/slide")
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

  const generate = async (type) => {
    if (!text.trim()) return;

    try {
      setMode(type);
      setLoading(true);
      setOutput("");
      setCardIndex(0);
      setFlipped(false);
      setFinishedCards(false);

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

  const getFlashcards = () => {
    const cards = output.split(/Flashcard\s*\d*/i).slice(1);

    return cards
      .map((card) => {
        const q = card.split("Q:")[1]?.split("A:")[0];
        const a = card.split("A:")[1];

        return {
          question: q?.replace(/\*\*/g, "").trim(),
          answer: a?.replace(/\*\*/g, "").trim(),
        };
      })
      .filter((c) => c.question && c.answer);
  };

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

    if (option.trim()[0] === currentQuiz.correctAnswer.trim()[0]) {
      setScore((s) => s + 1);
    } else {
      setWrong((w) => w + 1);
    }

    setTimeout(() => {
      if (quizIndex < quiz.length - 1) {
        setQuizIndex((i) => i + 1);
        setSelectedAnswer("");
      } else {
        setQuizFinished(true);
        confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
      }
    }, 1200);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Study Tools</h2>
        <button onClick={resetAll}>Home</button>
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
                placeholder="Paste or upload notes..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              <input
                type="file"
                accept=".txt,.docx,.pdf,.pptx"
                onChange={uploadNotes}
              />

              {/* ✅ ADDED HERE */}
              <div style={{ marginTop: "10px", color: "#124e66", fontWeight: "700" }}>
                Accepted files: .txt, .docx, .pdf, .pptx
              </div>
            </>
          )}

          {loading && (
            <div className="loading-box">
              <div className="spinner"></div>
              <p>Generating...</p>
            </div>
          )}

          {/* rest unchanged */}
        </div>
      </main>
    </div>
  );
}

export default App;
