import { useEffect } from "react";
import {
  Widget,
  addResponseMessage,
  deleteMessages,
} from "react-chat-widget-react-18";
import "react-chat-widget-react-18/lib/styles.css";
import "./ChatWidget.css";
import error from "../../../server/error.js";

const BOT_HOST = import.meta.env.VITE_BOT_HOST_URL;
const URL = `${BOT_HOST}/api/bot/`;
const GREETING = import.meta.env.VITE_BOT_GREETING || "Hello!";
const TITLE = import.meta.env.VITE_CHAT_WIDGET_TITLE ?? "Welcome!";

const ChatWidget = () => {
  let useEffectHasRun = false;
  let interval;
  useEffect(() => {
    if (!useEffectHasRun) {
      addResponseMessage(GREETING);
      useEffectHasRun = true;
    }
  }, []);
  const toggleEllipsis = async (show) => {
    if (show) {
      // await is necessary to wait for the message to be added to the DOM
      await addResponseMessage(".");
      const responses = document.querySelectorAll(".rcw-message-text p");
      const lastMessage = responses[responses.length - 1];
      // add class with ellipsis animation to last message
      lastMessage.classList.add("rcw-loading");
    } else {
      deleteMessages(1);
    }
  };

  const handleNewUserMessage = async (message) => {
    if (!message) {
      return;
    }
    toggleEllipsis(true);
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ message }),
    })
      .then((response) => {
        toggleEllipsis(false);
        return response;
      })
      .catch((error) => {
        console.error(error);
        toggleEllipsis(false);
        error.message && addResponseMessage(error.message);
      });
    const json = response && (await response.json());
    const reply = json?.message ?? json?.error ?? "";
    reply && addResponseMessage(reply);
  };
  return <Widget handleNewUserMessage={handleNewUserMessage} title={TITLE} />;
};

export default ChatWidget;
