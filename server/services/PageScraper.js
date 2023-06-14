import puppeteer from "puppeteer";
import { stripHtml } from "string-strip-html";

export default class PageScraper {
  static async withBrowser (callback) {
    let browser;
    try {
      browser = await puppeteer.launch({headless: "new"});
      const result = await callback(browser);
      return result;
    } catch (err) {
      console.log("error in withBrowser")
      console.error(err);
    } finally {
      await browser.close();
    }
  }

  static async withPage (browser, callback) {
    let page;
    try {
      page = await browser.newPage();
      return await callback(page);
    } catch (err) {
      console.log("error in withPage")
      console.error(err);
    } finally {
      await page.close();
    }
  }

  static async scrape (url) {
    return await PageScraper.withBrowser(async (browser) => {
      return await PageScraper.withPage(browser, async (page) => {
        await page.goto(url);
        const bodyHandle = await page.$("body");
        const data = await bodyHandle.evaluate(body => body.innerHTML);
        const {result} = stripHtml(data);
        return result;
      });
    });
  }

}