import PageScraper from "./PageScraper.js";

const URL_TO_SCRAPE = process.env.URL_TO_SCRAPE;
export const FAQ_UPDATE_INTERVAL = 1000 * 60 * 60 * 1; // 1 hour
const faq = {
  data: null,
  expires: null
}

export default async function getFaq() {
  if (faq.data && faq.expires > Date.now()) {
    return faq.data;
  }
  const data = await PageScraper.scrape(URL_TO_SCRAPE);
  faq.data = data;
  faq.expires = Date.now() + FAQ_UPDATE_INTERVAL;
  return data;
}