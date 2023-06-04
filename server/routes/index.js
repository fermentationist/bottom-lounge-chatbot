import { Router } from "express";
import * as chatbotService from "../services/chatbot.js";

const router = Router();

router.get("/", (req, res) => {
  return res.json({ message: "Hello world" });
});

router.post("/bot", async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "Message is required" });
  }
  try {
    const chatbotResponse = await chatbotService.getResponse(message, req.sessionId);
    return res.json({ message: chatbotResponse });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;