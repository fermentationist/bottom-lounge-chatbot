/* global describe, it, expect, afterAll */
import TestAPI from "./TestAPI.js";
import { getCookie } from "./utils.js";
import { writeFileSync } from "fs";
import venueQuestions from "./venueQuestions.js";

const api = new TestAPI();

describe("Bottom Lounge questions", () => {
  let newSessionCookie;

  it("should be aware of the venue it serves", async () => {
    const res = await api.request({
      url: "/api/bot",
      method: "POST",
      data: {
        message: "What venue do you serve?",
      },
      headers: {
        cookie: newSessionCookie,
      },
    });
    expect(res.status).toEqual(200);
    newSessionCookie = getCookie(res);
    const json = await res.json();
    console.log("json:", json);
    expect(json.message.includes("Bottom Lounge")).toEqual(true);
  }, 10000);

  // ask sample questions and save responses to file
  it("should answer questions about the venue", async () => {
    let idx = 1;
    const responses = [];
    for (const question of venueQuestions) {
      const response = await api.request({
        url: "/api/bot",
        method: "POST",
        data: {
          message: question,
        },
        headers: {
          cookie: newSessionCookie,
        },
      });
      expect(response.status).toEqual(200);
      const {message} = await response.json();
      responses.push(`${idx}. ${question}\n${message}\n\n`);
      idx ++;
    }    
    writeFileSync("./test/responses.txt", responses.join(""));
  }, venueQuestions.length * 10000);

  afterAll(() => {
    api.close();
  });
});