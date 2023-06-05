/* global process */
import "dotenv/config";
import { Configuration, OpenAIApi } from "openai";
import opError from "./error.js";
import getFaq from "./services/getFAQ.js";

const BOT_TEMPERATURE = process.env.BOT_TEMPERATURE && parseFloat(process.env.BOT_TEMPERATURE);
const BOT_INSTRUCTIONS = process.env.BOT_INSTRUCTIONS;
const BOT_NAME = process.env.BOT_NAME;
// 85% of the max token limit, to leave room for the bot's response
const MAX_TOKENS = 4096;
const TOKEN_LIMIT = Math.round(MAX_TOKENS * 0.95);
// used as key in ChatBot.messages[hostname], to store messages for the public chatbot (the one that responds to everyone in the room)


const getBotInstructions = async (botName) => {
  const beginningInstructions = `The assistant's name is ${botName}. \n` + BOT_INSTRUCTIONS ?? `The assistant is an AI chatbot. It is helpful, friendly, and informative.`;
  const faq = await getFaq();
  const instructions = `${beginningInstructions} \nThe following text is from the FAQ section of the website, which the assistant references to find answers to user questions: \n${faq}`;
  return instructions;
}

export class ChatBotRequest {
  cancelled = false;
  pending = true;
  response = null;
  error = null;
  constructor({ messages, openai, tokenLimit, model }) {
    this.messages = messages;
    this.openai = openai;
    this.model = model ?? "gpt-3.5-turbo-0301";
    this.promptLimit = Math.round((tokenLimit ?? TOKEN_LIMIT) * 0.75);
    // trim the messages array to the token limit
    while (ChatBotRequest.tokenEstimate(this.messages) > this.promptLimit
    ) {
      // Remove the second and third messages from the array, which are the oldest user message and the oldest bot response
      if (this.messages.length < 3) {
        throw opError("invalid_message", "message too long");
      }
      console.log("Removing earlier messages to fit token limit...");
      this.messages.splice(1, 2);
    }
  }
  static tokenEstimate(messages) {
    const textContent = messages
      .map((message) => `${message.role}: ${message.content}`)
      .join(" ");
    const wordCount = textContent.split(/[\s,.-]/).length;
    return Math.ceil(wordCount * 1.5);
  }
  cancel() {
    this.cancelled = true;
  }
  async getCompletion(messages, temperature) {
    try {
      console.log("Getting completion from OpenAI API...");
      const estimatedPromptTokens = ChatBotRequest.tokenEstimate(messages);
      console.log("Estimated prompt tokens:", estimatedPromptTokens);
      let difference = TOKEN_LIMIT - estimatedPromptTokens;
      performance.mark("start");
      const promise = this.openai.createChatCompletion({
        model: this.model,
        messages,
        max_tokens: difference,
        temperature,
      });
      this.promise = promise;
      const response = await promise;
      this.response = response;
      console.log("\nGPT model used:", response?.data?.model);
      console.log("Total tokens:", response?.data?.usage?.total_tokens);
      return {
        data:
          response?.data?.choices &&
          response.data.choices?.[0]?.message?.content,
        status: "success",
      };
    } catch (error) {
      // do not return error to the user
      this.error = error;
      console.log("Error getting completion from OpenAI API:");
      console.error(error.response?.data?.error ?? error);
      if (error.response?.data?.error?.type === "server_error") {
        return {
          data: `My apologies, but I can't talk right now. Please come back later.`,
          status: "error",
        };
      }
    } finally {
      performance.mark("end");
      const measurement = performance.measure(
        "createCompletion",
        "start",
        "end"
      );
      console.log(
        "Time to run: ",
        parseFloat((measurement.duration / 1000).toFixed(2)),
        "s"
      );
      this.pending = false;
    }
  }
}

class ChatBot {
  defaultPolicedCategories = [
    "hate",
    "hate/threatening",
    "self-harm",
    // "sexual",
    "sexual/minors",
    // "violence",
    "violence/graphic",
  ];
  name = BOT_NAME ?? "Marvin";
  temperature = BOT_TEMPERATURE ?? 0.95;
  model = "gpt-3.5-turbo-0301";
  cancelled = false;
  pendingRequestMessage = `Please wait while I finish responding to your previous message. If you don't want to wait, type "/cancel" to cancel your previous message.`;
  constructor() {
    this.conversations = {};
    this.pendingRequests = {};
    this.configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(this.configuration);
  }

  async getBotInstructions() {
    return await getBotInstructions(this.name);
  }

  async getSystemPrompt() {
    return {
      role: "system",
      content: await this.getBotInstructions(),
    }
  }
  // getModeration returns a promise that resolves to the response from the OpenAI API createModeration endpoint
  async getModeration(input) {
    const response = await this.openai.createModeration({ input });
    const results = response?.data?.results?.[0];
    return results;
  }

  // failsModeration returns the category of violation (a string) if the input fails moderation, or false if it passes
  async failsModeration(
    input,
    policedCategories = this.defaultPolicedCategories
  ) {
    const { categories } = await this.getModeration(input);
    for (const category in categories) {
      const isInViolation =
        categories[category] && policedCategories.includes(category);
      if (isInViolation) {
        return category;
      }
    }
    return false;
  }

  userHasPendingUncancelledRequest(sessionId) {
    const pendingRequests = this.pendingRequests[sessionId];
    if (!pendingRequests || !pendingRequests.length) {
      return false;
    }
    return pendingRequests.some((request) => !request.cancelled);
  }

  async converse(userInput, sessionId) {
    console.log("sessionId:", sessionId);
    if (this.userHasPendingUncancelledRequest(sessionId)) {
      return this.pendingRequestMessage;
    }
    let request;
    try {
      const contentViolation = await this.failsModeration(userInput);
      if (contentViolation) {
        return `Sorry, your message was flagged as violating content policies in the category "${contentViolation}". Please reformulate and try again.`;
      }
      const previousConversation = this.conversations[sessionId] ?? [await this.getSystemPrompt()];
      const newMessage = {
        role: "user",
        content: userInput,
      };
      const messages = [...previousConversation, newMessage];
      request = new ChatBotRequest({
        messages,
        openai: this.openai,
      });
      this.addToPendingRequests(sessionId, request);
      const completion = await request.getCompletion(messages, this.temperature);
      if (request.cancelled) {
        return null;
      }
      if (completion?.status === "success") {
        messages.push({
          role: "assistant",
          content: completion.data,
        });
        this.conversations[sessionId] = messages;
      }
      return completion.data;
    } catch (error) {
      console.log("Error in ChatBot.converse():");
      console.error(error);
      return error?.name === "invalid_message"
        ? `Error: ${error.message}`
        : `Sorry, I'm having trouble understanding you. Please try again.`;
    } finally {
      this.removeFromPendingRequests(sessionId, request);
    }
  }

  addToPendingRequests(sessionId, request) {
    if (this.pendingRequests[sessionId]) {
      this.pendingRequests[sessionId].push(request);
    } else {
      this.pendingRequests[sessionId] = [request];
    }
  }

  removeFromPendingRequests(sessionId, request) {
    const pendingRequests = this.pendingRequests[sessionId];
    if (pendingRequests && pendingRequests.length) {
      const index = pendingRequests.indexOf(request);
      if (index > -1) {
        pendingRequests.splice(index, 1);
      }
    }
  }

  cancelPending(sessionId) {
    const pendingRequest = this.pendingRequests[sessionId]?.shift();
    if (pendingRequest) {
      pendingRequest.cancel();
      return true;
    }
    return false;
  }

}

export default ChatBot;
