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
  let ellipsis = false;
  useEffect(() => {
    if (!useEffectHasRun) {
      addResponseMessage(GREETING);
      useEffectHasRun = true;
    }
  }, []);
  const showEllipsis = async (show) => {
    if (show) {
      ellipsis = true;
      // it is necessary to wait for the message to be added to the DOM
      await addResponseMessage(".", "ellipsis");
      const responses = document.querySelectorAll(".rcw-message-text p");
      const lastMessage = responses[responses.length - 1];
      // add class with ellipsis animation to last message
      lastMessage.classList.add("rcw-loading");
    } else {
      ellipsis = false;
      deleteMessages(1, "ellipsis");
    }
  };

  const handleNewUserMessage = async (message) => {
    if (!message) {
      return;
    }
    if (ellipsis) {
      // if the user sends a message while the ellipsis animation is running, remove the ellipsis
      showEllipsis(false);
    }
    // show ellipsis animation while waiting for response
    showEllipsis(true);
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // must include credentials to send cookies. Won't be automatically sent otherwise because of CORS
      credentials: "include",
      body: JSON.stringify({ message }),
    })
      .then((response) => {
        // remove ellipsis animation
        showEllipsis(false);
        return response;
      })
      .catch((error) => {
        console.error(error);
        // remove ellipsis animation
        showEllipsis(false);
        error.message && addResponseMessage(error.message);
      });
    const json = response && (await response.json());
    const reply = json?.message ?? json?.error ?? "";
    reply && addResponseMessage(reply);
  };
  return <Widget handleNewUserMessage={handleNewUserMessage} title={TITLE} />;
};

export default ChatWidget;
