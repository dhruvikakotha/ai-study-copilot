import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Summarize:\n${text}`,
        },
      ],
    });

    res.json({
      result: response.choices[0].message.content,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

router.post("/flashcards", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: `Create flashcards from this:\n${text}` }
      ],
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error generating flashcards" });
  }
});

router.post("/quiz", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: `Create a 5 question quiz with answers:\n${text}` }
      ],
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Error generating quiz" });
  }
});

router.post("/explain", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: `Explain this like I'm 5:\n${text}` }
      ],
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Error explaining" });
  }
});

router.post("/teacher", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: `Turn this into a lesson plan:\n${text}` }
      ],
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Error generating lesson plan" });
  }
});

export default router;