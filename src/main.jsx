import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

const chatWidgetDiv = document.createElement("div");
chatWidgetDiv.id = "chat-widget";
document.body.appendChild(chatWidgetDiv);
ReactDOM.createRoot(chatWidgetDiv).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
