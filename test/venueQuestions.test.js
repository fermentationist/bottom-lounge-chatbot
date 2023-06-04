import TestAPI from "./TestAPI.js";
import { getCookie } from "./utils.js";
import { writeFileSync } from "fs";

const venueQuestions = [
  "What is the name of this venue?",
  "What is the address of this venue?",
  "What is the phone number of this venue?",
  "What is the email address of this venue?",
  "What is the website of this venue?",
  "Is Bottom Lounge an all-ages venue?",
  "How old do I have to be to attend a show at Bottom Lounge?",
  "My nephew is underage for the concert in question, but I am old enough. Can I bring him?",
  "What is the capacity of this venue?",
  "What is the parking situation at this venue?",
  "What is the public transportation situation at this venue?",
  "What is the food and drink situation at this venue?",
  "What is the smoking situation at this venue?",
  "What is the coat check situation at this venue?",
  "What is the bathroom situation at this venue?",
  "What is the accessibility situation at this venue?",
  "Is the space available for private events?",
  "How do I get my band booked at this venue?",
  "The show is sold out. Can I still get tickets?",
];

const api = new TestAPI();

describe("Bottom Lounge questions", () => {
  let newSessionCookie;

  it("should be aware of the venue it serves", async () => {
    const res = await api.request({
      url: "/bot",
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
        url: "/bot",
        method: "POST",
        data: {
          message: question,
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