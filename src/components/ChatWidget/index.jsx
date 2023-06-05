import { useEffect } from "react";
import { Widget, addResponseMessage } from "react-chat-widget-react-18";
import "react-chat-widget-react-18/lib/styles.css";
import "./ChatWidget.css";


const URL = `${import.meta.env.VITE_BOT_HOST_URL}/api/bot/`;
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
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        cookie: document.cookie,
      },
      credentials: "include",
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    addResponseMessage(data.message);
  };
  return (
    <Widget
      handleNewUserMessage={handleNewUserMessage}
      title={TITLE}
      subtitle="Ask me anything!"
    />
  );
};

export default ChatWidget;
