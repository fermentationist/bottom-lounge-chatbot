import { useEffect } from "react";
import { Widget, addResponseMessage, deleteMessages } from "react-chat-widget-react-18";
import "react-chat-widget-react-18/lib/styles.css";
import "./ChatWidget.css";
import error from "../../../server/error";

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
  const toggleEllipsis = (show) => {
    const states = ["...", ".", ".."];
    let i = 0;
    let index = i % states.length;
    if (show) { 
      interval = setInterval(() => {
        i > 0 && deleteMessages(1);
        addResponseMessage(states[index]);
        i++;
        index = i % states.length;
      }
      , 500);
    } else {
      clearInterval(interval);
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
    }).catch(error => {
      console.error(error);
      toggleEllipsis(false);
      error.message && addResponseMessage(error.message);
    });
    const json = response && await response.json();
    const reply = json?.message ?? json?.error ?? "";
    // reply && deleteMessages(1);
    toggleEllipsis(false);
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
