/* global process */
import PageScraper from "./PageScraper.js";

const URL_TO_SCRAPE = process.env.URL_TO_SCRAPE;
export const FAQ_UPDATE_INTERVAL = 1000 * 60 * 60 * 24; // 24 hours
const faq = {
  data: null,
  expires: null,
};

export default async function getFaq() {
  if (faq.data && faq.expires > Date.now()) {
    // return cached data
    return faq.data;
  }
  try {
    // scrape data
    console.log(`scraping ${URL_TO_SCRAPE} for FAQ data`);
    const data = await PageScraper.scrape(URL_TO_SCRAPE);
    faq.data = data;
    faq.expires = Date.now() + FAQ_UPDATE_INTERVAL;
    console.log("FAQ data updated");
    return data;
  } catch (err) {
    console.error(err);
    // scraping failed, return stale data or empty string
    console.log("scraping failed, returning stale or empty FAQ data");
    return faq.data ?? "";
  }
}

// run once on startup
getFaq();
