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
Summarize these notes clearly:

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

Format EXACTLY like this:

1. Question here?
- A) answer choice
- B) answer choice
- C) answer choice
- D) answer choice
Answer: B

Make 5 questions.

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
Explain this like I'm 5 years old:

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

export default router;