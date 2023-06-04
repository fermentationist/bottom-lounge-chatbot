import ChatWidget from "./components/ChatWidget";
import "./App.css";

function App() {
  const chatWindowStyle = {
    position: "absolute",
    bottom: "0",
    right: "0",
    width: "100vw",
    height: "100vh",
    backgroundColor: "transparent",
    zIndex: 99999,
  };
  return (
    <>
      <ChatWidget />
    </>
  );
}

export default App;
