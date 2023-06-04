import { jest } from "@jest/globals";
import getFaq from "./getFAQ.js";
import PageScraper from "./PageScraper.js";

const mockData = "test";
const createScrapeMock = jest.fn(() => {
  return Promise.resolve(mockData);
});

describe("getFaq", () => {
  const scrapeMock = jest
    .spyOn(PageScraper, "scrape")
    .mockImplementation(createScrapeMock);

  it("should call PageScraper.scrape once and return a string", async () => {
    const faq = await getFaq();
    expect(faq).toEqual(mockData);
    expect(scrapeMock).toHaveBeenCalledTimes(1);
    scrapeMock.mockClear();
  });

  it("should return cached data if called again within FAQ_UPDATE_INTERVAL", async () => {
    const faq = await getFaq();
    expect(faq).toEqual(mockData);
    expect(scrapeMock).toHaveBeenCalledTimes(0);
  });
});
