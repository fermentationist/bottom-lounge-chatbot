/* global process */
// start the server
import server from "../server/index.js"; // eslint-disable-line
const PORT = process.env.SERVER_PORT || 4000;
const defaultBaseUrl = `http://localhost:${PORT}`;

export default class TestAPI {
  constructor({ method, url, data, headers, baseUrl = defaultBaseUrl } = {}) {
    if (this.instance) {
      return this.instance;
    }
    this.method = method;
    this.url = url;
    this.data = data;
    this.headers = headers;
    this.baseUrl = baseUrl;
    this.instance = this;
    return this;
  }
  request({ method, url: passedUrl, data, headers } = {}) {
    
    try {
      let url = passedUrl || this.url;
      url = url.startsWith("http") ? url : `${this.baseUrl}${url}`;
      return fetch(url, {
        method: method || this.method,
        body: (data || this.data) && JSON.stringify(data || this.data),
        headers: {
            "Content-Type": "application/json",
            ...(headers || this.headers)
          }
      });
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  }

  close() {
    server.httpServer.close();
  }

}
