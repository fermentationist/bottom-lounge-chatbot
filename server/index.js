/* global process */
import "dotenv/config";
import app from "./app.js";
import http from "http";
import wakeDyno from "woke-dyno";

const PORT = process.env.SERVER_PORT || 4000;
const WAKE_SERVER_URL = process.env.WAKE_SERVER_URL;
const WAKE_SERVER_INTERVAL = process.env.WAKE_SERVER_INTERVAL || 14 * 60 * 1000;

class Server {
  instance = null;
  constructor() {
    // singleton
    if (this.instance)  {
      return this.instance;
    }
    this.httpServer = http.createServer(app);
    this.instance = this;
    return this;
  }
}

const server = new Server();

if (!server.httpServer.listening) {
  server.httpServer.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
    if (WAKE_SERVER_URL) {
      const offset = 4; // NY
      const getOffsetHours = (hours) =>
        hours + offset > 24 ? Math.abs(24 - (hours + offset)) : hours + offset;
      const napStartHour = getOffsetHours(18);
      const napEndHour = getOffsetHours(8);
      wakeDyno({
        url: WAKE_SERVER_URL,
        interval: WAKE_SERVER_INTERVAL,
        startNap: [napStartHour, 0, 0, 0],
        endNap: [napEndHour, 0, 0, 0],
      }).start();
    }
  });
}

export default server;