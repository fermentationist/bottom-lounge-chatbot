/* global process */
import "dotenv/config";
import app from "./app.js";
import http from "http";

const PORT = process.env.SERVER_PORT || 4000;

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
  });
}

export default server;