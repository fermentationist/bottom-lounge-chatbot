import puppeteer from "puppeteer";
import { stripHtml } from "string-strip-html";

export default class PageScraper {
  static async scrape (url) {
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    await page.goto(url);
    const bodyHandle = await page.$("body");
    const data = await bodyHandle.evaluate(body => body.innerHTML);
    await browser.close();
    const {result} = stripHtml(data);
    return result;
  }

}