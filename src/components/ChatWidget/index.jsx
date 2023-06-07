import { useEffect } from "react";
import { Widget, addResponseMessage } from "react-chat-widget-react-18";
import "react-chat-widget-react-18/lib/styles.css";
import "./ChatWidget.css";
import error from "../../../server/error";

const BOT_HOST = import.meta.env.VITE_BOT_HOST_URL;
const URL = `${BOT_HOST}/api/bot/`;
const GREETING = import.meta.env.VITE_BOT_GREETING || "Hello!";
const TITLE = import.meta.env.VITE_CHAT_WIDGET_TITLE ?? "Welcome!";

const ChatWidget = () => {
  let useEffectHasRun = false;
  useEffect(() => {
    if (!useEffectHasRun) {
      addResponseMessage(GREETING);
      useEffectHasRun = true;
    }
  }, []);
  const handleNewUserMessage = async (message) => {
    if (!message) {
      return;
    }
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ message }),
    }).catch(error => {
      console.error(error);
      error.message && addResponseMessage(error.message);
    });
    const json = response && await response.json();
    const reply = json?.message ?? json?.error ?? "";
    reply && addResponseMessage(reply);
  };
  return (
    <Widget
      handleNewUserMessage={handleNewUserMessage}
      title={TITLE}
    />
  );
};

export default ChatWidget;
