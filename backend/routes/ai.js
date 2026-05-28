import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateAI = async (prompt) => {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
};

router.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    const result = await generateAI(`
Summarize these notes clearly with headings and bullet points:
${text}
`);

    res.json({ result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/flashcards", async (req, res) => {
  try {
    const { text } = req.body;

    const result = await generateAI(`
Create flashcards from these notes.

Make the number of flashcards depend on the note length:
- short notes: 5 flashcards
- medium notes: 8-10 flashcards
- long notes: 12-20 flashcards

Format EXACTLY like this:

Flashcard 1
Q: question here
A: answer here

Flashcard 2
Q: question here
A: answer here

Notes:
${text}
`);

    res.json({ result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/quiz", async (req, res) => {
  try {
    const { text } = req.body;

    const result = await generateAI(`
Create a multiple choice quiz from these notes.

Make the number of questions depend on the note length:
- short notes: 5 questions
- medium notes: 8-10 questions
- long notes: 12-15 questions

Format EXACTLY like this:

1. Question here?
- A) answer choice
- B) answer choice
- C) answer choice
- D) answer choice
Answer: B

2. Question here?
- A) answer choice
- B) answer choice
- C) answer choice
- D) answer choice
Answer: C

Notes:
${text}
`);

    res.json({ result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/explain", async (req, res) => {
  try {
    const { text } = req.body;

    const result = await generateAI(`
Explain this like I'm 5 years old using simple words and examples:
${text}
`);

    res.json({ result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/teacher", async (req, res) => {
  try {
    const { text } = req.body;

    const result = await generateAI(`
Teach this topic step-by-step like a helpful teacher:
${text}
`);

    res.json({ result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/essay", async (req, res) => {
  try {
    const { text } = req.body;

    const result = await generateAI(`
You are an English teacher grading a student essay.
Grade the essay out of 10 and give helpful feedback.

Format your response like this:

# Essay Feedback

## Score
X/10

## Strengths
- strength 1
- strength 2
- strength 3

## Improvements
- improvement 1
- improvement 2
- improvement 3

## Final Feedback
Write a short paragraph explaining how the student can improve.

Essay:
${text}
`);

    res.json({ result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/resume", async (req, res) => {
  try {
    const { text } = req.body;

    const result = await generateAI(`
You are a professional resume reviewer.
Review this resume and give helpful feedback.

Format your response like this:

# Resume Feedback

## Score
X/10

## Strengths
- strength 1
- strength 2
- strength 3

## Improvements
- improvement 1
- improvement 2
- improvement 3

## Resume Tips
- tip 1
- tip 2
- tip 3

## Final Feedback
Write a short paragraph explaining how to improve the resume.

Resume:
${text}
`);

    res.json({ result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
