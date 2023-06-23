/* global process */
import "dotenv/config";
import { Configuration, OpenAIApi } from "openai";
import {
  chatbotFunctions,
  chatbotFunctionDefinitions,
} from "./chatbotFunctions.js";
import opError from "./error.js";
import getFaq from "./services/getFAQ.js";

const BOT_TEMPERATURE =
  process.env.BOT_TEMPERATURE && parseFloat(process.env.BOT_TEMPERATURE);
const BOT_INSTRUCTIONS = process.env.BOT_INSTRUCTIONS;
const BOT_INSTRUCTIONS_EXTRA = process.env.BOT_INSTRUCTIONS_EXTRA ?? "";
const BOT_NAME = process.env.BOT_NAME;
const TOKEN_LIMIT_4K = 4096;
const TOKEN_LIMIT_16K = TOKEN_LIMIT_4K * 4;
const MODEL_4K = "gpt-3.5-turbo-0613";
const MODEL_16K = "gpt-3.5-turbo-16k";

const getBotInstructions = async (botName) => {
  const beginningInstructions =
    `The assistant's name is ${botName}. \n` + BOT_INSTRUCTIONS ??
    `The assistant is an AI chatbot. It is helpful, friendly, and informative.`;
  const faq = await getFaq();
  // const instructions = `${beginningInstructions} The assistant can get real-time information about upcoming events using the getUpcomingEvents function, which queries the Ticketmaster API. If asked about events relative to the current time (e.g. "Who is performing tonight?", or "What is the next scheduled event?"), the assistant ALWAYS checks the current date and time with the getCurrentDateAndTime function, and uses that information in its call to the getUpcomingEvents function. \nThe following text is from the FAQ section of the website, which the assistant references to find answers to user questions: \n"""\n${faq}\n${
  //   BOT_INSTRUCTIONS_EXTRA ?? ""
  // }\n"""`;
  const instructions = `${beginningInstructions} The assistant can get real-time information about upcoming events using the getUpcomingEvents function, which queries the Ticketmaster API. If asked about events relative to the current time (e.g. "Who is performing tonight?", or "What is the next scheduled event?"), the assistant performs the following actions, in order: 
  1. Use the getCurrentDateAndTime function to get the current date and time.
  2. Determine the appropriate date or date range to search for events.
  3. Call the getUpcomingEvents function, passing the date or date range, if appropriate.
  The following text is from the FAQ section of the website, which the assistant references to find answers to user questions: 
  """
  ${faq}
  ${BOT_INSTRUCTIONS_EXTRA ?? ""}
  """`;
  return instructions;
};

export class ChatBotRequest {
  cancelled = false;
  pending = true;
  response = null;
  error = null;
  constructor({ messages, openai, tokenLimit, model }) {
    this.messages = messages;
    this.openai = openai;
    this.model = model ?? MODEL_4K;
    this.tokenLimit = tokenLimit ?? TOKEN_LIMIT_4K; // Max tokens allowed by the model
    this.completionLimit = Math.round(this.tokenLimit * 0.25); // Max tokens to allow for completion
    this.promptLimit = Math.round(this.tokenLimit * 0.75); // Max tokens to allow for prompt
    this.completionMin = 750; // Min tokens required for completion
  }

  static tokenEstimate(messages) {
    const textContent = JSON.stringify(messages)
      .replace(/[\n\r\t]/g, " ")
      .replace(/[[\]{}"]/g, "");
    const wordCount = textContent.split(/[\s,.-:]/).length;
    return Math.ceil(wordCount * 1.25);
  }

  cancel() {
    this.cancelled = true;
  }

  useLargerModel() {
    console.log("Changing to 16k model...");
    this.model = MODEL_16K;
    this.tokenLimit = TOKEN_LIMIT_16K;
    this.promptLimit = Math.round(this.tokenLimit * 0.75);
    this.completionLimit = Math.round(this.tokenLimit * 0.25);
  }

  resetModel() {
    console.log("Resetting to 4K model...");
    this.model = MODEL_4K;
    this.tokenLimit = TOKEN_LIMIT_4K;
    this.promptLimit = Math.round(this.tokenLimit * 0.75);
    this.completionLimit = Math.round(this.tokenLimit * 0.25);
  }

  async summarizeMessages(messages) {
    console.log("Summarizing messages...");
    const messagesToSummarize = messages.slice(1, -1);
    const systemMessage = `The following is a conversation between a user and an AI chatbot. Using the labels "user" and "assistant" for the two speakers, summarize the conversation: \n"""\n${JSON.stringify(
      messagesToSummarize
    )}\n"""`;
    const [summary] = await this.getCompletion({
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
      ],
      temperature: 0.5,
      // make sure functions cannot be called during summary
      functions: null,
    });
    if (summary?.status === "error") {
      console.log("Error summarizing messages:");
      console.error(summary?.data);
      console.log("Returning original messages...");
      return messages;
    }
    const newMessages = [
      {
        // new system message with summary
        role: "system",
        content: `${messages[0].content} \nThe following is a summary of part of the prior conversation between the user and the assistant (summarized to reduce the number tokens needed): \n"""\n${summary?.data}\n"""`,
      },
      // the last user message
      messages.slice(-1)[0],
    ];
    return newMessages;
  }

  pruneMessages(messages) {
    // trim the messages array to the token limit
    const estimatedFunctionTokens = ChatBotRequest.tokenEstimate(
      chatbotFunctionDefinitions
    );
    while (
      ChatBotRequest.tokenEstimate(messages) + estimatedFunctionTokens >
      this.promptLimit
    ) {
      console.log(
        "Estimated prompt tokens:",
        ChatBotRequest.tokenEstimate(messages) + estimatedFunctionTokens
      );
      if (messages.length < 3) {
        throw opError("invalid_message", "message too long");
      }
      // Remove the oldest user message and the oldest bot response
      console.log("Removing earlier messages to fit token limit...");
      const indexOfOldestUserMessage = messages.findIndex(
        (message) => message.role === "user"
      );
      const indexOfOldestBotMessage = messages.findIndex(
        (message) => message.role === "assistant"
      );
      indexOfOldestUserMessage > -1 &&
        messages.splice(indexOfOldestUserMessage, 1);
      indexOfOldestBotMessage > -1 &&
        messages.splice(indexOfOldestBotMessage, 1);
    }
    return messages;
  }

  async getCompletion({
    messages,
    temperature,
    functions = chatbotFunctionDefinitions,
  }) {
    try {
      messages = messages ?? this.messages;
      console.log("Getting completion from OpenAI API...");
      const estimatedMessageTokens = ChatBotRequest.tokenEstimate(messages);
      const estimatedFunctionTokens = ChatBotRequest.tokenEstimate(
        chatbotFunctionDefinitions
      );
      console.log("Estimated message tokens:", estimatedMessageTokens);
      console.log("Estimated function tokens:", estimatedFunctionTokens);
      const estimatedPromptTokens =
        estimatedFunctionTokens + estimatedMessageTokens;
      console.log("Estimated prompt tokens:", estimatedPromptTokens);
      const difference = Math.max(0, this.tokenLimit - estimatedPromptTokens);
      let tokenMax = Math.min(this.completionLimit, difference);
      console.log("Max completion tokens:", tokenMax);

      if (tokenMax < this.completionMin) {
        // if number of tokens remaining for completion is less than the minimum, try summarizing the messages
        const summarizedMessages = await this.summarizeMessages(messages);
        const estimatedSummarizedTokens =
          ChatBotRequest.tokenEstimate(summarizedMessages);
        const estimatedPromptTokensWithSummary =
          estimatedSummarizedTokens + estimatedFunctionTokens;
        const differenceWithSummary = Math.max(
          0,
          this.tokenLimit - estimatedPromptTokensWithSummary
        );
        if (differenceWithSummary < this.completionMin) {
          // if number of tokens remaining for completion is still less than the minimum, use the larger model
          if (this.model === MODEL_4K) {
            this.useLargerModel();
          } else {
            // if already using the larger model, prune the messages array
            messages = this.pruneMessages(messages);
          }
          return this.getCompletion({ messages, temperature, functions });
        }
        // otherwise, use the summarized messages
        messages = summarizedMessages;
        console.log(
          "Estimated prompt tokens with summary:",
          estimatedPromptTokensWithSummary
        );
        tokenMax = Math.min(this.completionLimit, differenceWithSummary);
        console.log("Max completion tokens with summary:", tokenMax);
      }

      performance.mark("start");
      // get completion from OpenAI API
      const response = await this.openai.createChatCompletion({
        model: this.model,
        messages,
        max_tokens: tokenMax,
        temperature: temperature ?? BOT_TEMPERATURE,
        functions: functions || void 0,
        function_call: (functions && "auto") || void 0,
      });

      console.log("\nGPT model used:", response?.data?.model);
      console.log("Prompt tokens used:", response?.data?.usage?.prompt_tokens);
      console.log(
        "Completion tokens used:",
        response?.data?.usage?.completion_tokens
      );
      console.log("Total tokens used:", response?.data?.usage?.total_tokens);
      const result = response?.data?.choices[0];
      console.log("Finish reason:", result?.finish_reason);

      // if finish_reason is function_call, call the function, add the result to the messages array and call getCompletion again
      if (result?.finish_reason === "function_call") {
        const { name, arguments: args } = result.message.function_call;
        console.log(`Calling function ${name}, with args: ${args}`);
        const functionResult = await chatbotFunctions[name](args);
        return this.getCompletion({
          messages: [
            ...messages,
            {
              role: "function",
              name,
              content: functionResult,
            },
          ],
          temperature,
          functions,
        });
      }
      // otherwise, return an array containing the completion and the updated messages array with the new completion (in case it was summarized or pruned)
      const content = response?.data?.choices?.[0]?.message?.content;
      return [
        {
          data: content,
          status: "success",
        },
        [
          ...messages,
          {
            role: "assistant",
            content,
          },
        ],
      ];
    } catch (error) {
      // do not return error to the user
      this.error = error;
      console.log("Error getting completion from OpenAI API:");
      console.error(error.response?.data?.error ?? error);
      if (error.response?.data?.error?.type === "server_error") {
        return [
          {
            data: `My apologies, but I can't talk right now. Please come back later.`,
            status: "error",
          },
          messages,
        ];
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
      // reset to 4k model if using 16k model
      this.model === MODEL_16K && this.resetModel();
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
    };
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
    if (this.userHasPendingUncancelledRequest(sessionId)) {
      return this.pendingRequestMessage;
    }
    let request;
    try {
      const contentViolation = await this.failsModeration(userInput);
      if (contentViolation) {
        return `Sorry, your message was flagged as violating content policies in the category "${contentViolation}". Please reformulate and try again.`;
      }
      const previousConversation = this.conversations[sessionId] ?? [
        await this.getSystemPrompt(),
      ];
      const newMessage = {
        role: "user",
        content: userInput,
      };
      const messages = [...previousConversation, newMessage];
      request = new ChatBotRequest({ openai: this.openai });
      this.addToPendingRequests(sessionId, request);
      const [completion, updatedMessages] = await request.getCompletion({
        messages,
        temperature: this.temperature,
      });
      if (request.cancelled) {
        return null;
      }
      if (completion?.status === "success") {
        messages.push({
          role: "assistant",
          content: completion.data,
        });
        this.conversations[sessionId] = updatedMessages;
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
