/* global describe, it, afterAll, expect */
import TestAPI from "../../test/TestAPI.js";
import { chatbot } from "../services/chatbot.js";
import { getCookie } from "../../test/utils.js";

const api = new TestAPI();

// TESTS
describe("routes", () => {
  let sessionCookie, newSessionCookie;
  describe("GET /", () => {
    it("should return a 200 response", async () => {
      const res = await api.request({ url: "/" });
      sessionCookie = getCookie(res);
      expect(typeof sessionCookie).toEqual("string");
      expect(sessionCookie.includes("sessionId")).toEqual(true);
      expect(res.status).toEqual(200);
    });
    it("should return html", async () => {
      const res = await api.request({ url: "/" });
      const text = await res.text();
      expect(text.includes("<!DOCTYPE html>")).toEqual(true);
    });
  });

  describe("POST /api/bot", () => {
    const firstMessage = "hello, this is my first message";
    const slowQuery = "Please explain all of the rules of Chess.";
    it("should return a 200 response", async () => {
      const res = await api.request({
        url: "/api/bot",
        method: "POST",
        data: {
          message: firstMessage,
        },
        headers: {
          cookie: sessionCookie,
        },
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(typeof json.message).toEqual("string");
    }, 10000);

    it("should continue to use the same session", async () => {
      // to test if bot is aware of previous message
      const secondMessage = "What was the last thing I said?";
      const res = await api.request({
        url: "/api/bot",
        method: "POST",
        data: {
          message: secondMessage,
        },
        headers: {
          cookie: sessionCookie,
        },
      });
      // should be same sessionId as before
      expect(getCookie(res)).toEqual(sessionCookie);
      const json = await res.json();
      // bot should be aware of previous message
      expect(json.message.includes(firstMessage)).toEqual(true);
    }, 10000);

    it("should return a 400 response if no message is provided", async () => {
      const res = await api.request({
        url: "/api/bot",
        method: "POST",
        headers: {
          cookie: sessionCookie,
        },
      });
      expect(res.status).toEqual(400);
    });

    it("should return a 400 response if message is empty", async () => {
      const res = await api.request({
        url: "/api/bot",
        method: "POST",
        data: {
          message: "",
        },
        headers: {
          cookie: sessionCookie,
        },
      });
      expect(res.status).toEqual(400);
    });

    it("should return a 400 response if message is not a string", async () => {
      const res = await api.request({
        url: "/api/bot",
        method: "POST",
        data: {
          message: 123,
        },
        headers: {
          cookie: sessionCookie,
        },
      });
      expect(res.status).toEqual(400);
    });

    // this test is coupled with the next test by the message
    it("should start a new session if no cookie is provided", async () => {
      const res = await api.request({
        url: "/api/bot",
        method: "POST",
        data: {
          // the next test will check if the bot is aware of the previous (this) message
          message: firstMessage,
        },
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(typeof json.message).toEqual("string");
      newSessionCookie = getCookie(res);
      expect(newSessionCookie).not.toEqual(sessionCookie);
    }, 10000);

    // this test is coupled with the previous test by the message
    it("should start a new session if cookie is invalid", async () => {
      // to test if bot is aware of previous message
      const message = "What was the last thing I said?";
      const res = await api.request({
        url: "/api/bot",
        method: "POST",
        data: {
          message,
        },
        headers: {
          cookie: "invalidCookie",
        },
      });
      expect(res.status).toEqual(200);
      const thirdSessionCookie = getCookie(res);
      expect(thirdSessionCookie).not.toEqual(newSessionCookie);
      expect(thirdSessionCookie).not.toEqual(sessionCookie);
      const json = await res.json();
      expect(typeof json.message).toEqual("string");
      // bot should not be aware of previous message
      expect(json.message.includes(firstMessage)).toEqual(false);
    }, 10000);

    it("should return a warning and reject message if sending a second message while a previous response is still pending", (done) => {
      const firstRequest = api
        .request({
          url: "/api/bot",
          method: "POST",
          data: {
            message: "hello",
          },
          headers: {
            cookie: newSessionCookie,
          },
        })
        .then(() => {
          return api
            .request({
              url: "/api/bot",
              method: "POST",
              data: {
                message: "hello",
              },
              headers: {
                cookie: newSessionCookie,
              },
            })
            .then(async (res) => {
              expect(res.status).toEqual(200);
              const json = await res.json();
              expect(json.message).toEqual(chatbot.pendingRequestMessage);
              done();
            });
        });
      // will be cancelled in the next test
      const requestToCancel = api.request({
        url: "/api/bot",
        method: "POST",
        data: {
          message: "How are you today?",
        },
        headers: {
          cookie: newSessionCookie,
        },
      });
    }, 10000);

    it("should return 'Cancelled' if message starts with '/cancel' and there is a pending message", async () => {
      const [_, sessionId] = newSessionCookie.split("=");
      const [cancelledRequest] = chatbot.pendingRequests[sessionId];
      const cancelRes = await api.request({
        url: "/api/bot",
        method: "POST",
        data: {
          message: "/cancel",
        },
        headers: {
          cookie: newSessionCookie,
        },
      });
      expect(cancelRes.status).toEqual(200);
      const json = await cancelRes.json();
      expect(json.message).toEqual("Cancelled");
      await cancelledRequest.promise;
    }, 30000);

    it("should return 'Nothing to cancel' if message starts with '/cancel' and there is no pending message", async () => {
      const res = await api.request({
        url: "/api/bot",
        method: "POST",
        data: {
          message: "/cancel",
        },
        headers: {
          cookie: newSessionCookie,
        },
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.message).toEqual("Nothing to cancel");
    }, 10000);
  });

  afterAll(() => {
    api.close();
  });
});
