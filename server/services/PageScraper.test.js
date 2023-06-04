import "dotenv/config";
import PageScraper from "./PageScraper.js";

const URL_TO_SCRAPE = process.env.URL_TO_SCRAPE;

describe("pageScraper", () => {
  it("should return a string", async () => {
    const data = await PageScraper.scrape(URL_TO_SCRAPE);
    expect(typeof data).toEqual("string");
  }, 10000);
});