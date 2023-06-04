import ChatBot from "../ChatBot.js";

export const chatbot = new ChatBot();

export const getResponse = async (message, sessionId) => {
  if (message.startsWith("/cancel")) {
    return chatbot.cancelPending(sessionId) ? "Cancelled" : "Nothing to cancel";
  }
  const response = await chatbot.converse(message, sessionId);
  return response;
}
