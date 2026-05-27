import { useState } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import "./App.css";

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
    teacher: "Teacher Mode",
  };

  const goHome = () => {
    setMode("");
    setOutput("");
    setText("");
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
    } catch (err) {
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

        const answerLine = lines.find((line) => line.includes("Answer:"));

        const correctAnswer = answerLine
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
    }, 1000);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Study Tools</h2>

        <button onClick={goHome}>Home</button>
        <button onClick={() => generate("summarize")}>Summary</button>
        <button onClick={() => generate("flashcards")}>Flashcards</button>
        <button onClick={() => generate("quiz")}>Quiz</button>
        <button onClick={() => generate("explain")}>Explain Like I'm 5</button>
        <button onClick={() => generate("teacher")}>Teacher Mode</button>
      </aside>

      <main className="main">
        <div className="content">
          <h1>{mode ? titles[mode] : "AI Study Copilot"}</h1>

          {!mode && (
            <textarea
              placeholder="Paste your notes..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}

          {loading && (
            <div className="loading-box">
              <div className="spinner"></div>
              <p>Generating...</p>
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
                <span>{cardIndex + 1} / {flashcards.length}</span>
                <button onClick={nextCard}>Next</button>
              </div>
            </div>
          )}

          {!loading && mode === "quiz" && quiz.length > 0 && (
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
                  <h3>{quizIndex + 1}. {currentQuiz.question}</h3>

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
                </div>
              )}
            </div>
          )}

          {!loading &&
            mode &&
            mode !== "flashcards" &&
            mode !== "quiz" &&
            output && (
              <div className="output">
                <p>{output}</p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default App;