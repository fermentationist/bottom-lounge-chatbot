/* global process */
import "dotenv/config";

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_DISCOVERY_API_URL =
  "https://app.ticketmaster.com/discovery/v2";
const TICKETMASTER_DISCOVERY_API_EVENTS_URL = `${TICKETMASTER_DISCOVERY_API_URL}/events.json`;
const BOTTOM_LOUNGE_VENUE_ID = "KovZpaoyCe";

const getUpcomingEvents = async (startDate, endDate, keyword) => {
  startDate = startDate === "now" ? new Date().toISOString() : startDate;
  const baseURL = `${TICKETMASTER_DISCOVERY_API_EVENTS_URL}?apikey=${TICKETMASTER_API_KEY}&venueId=${BOTTOM_LOUNGE_VENUE_ID}&sort=date,asc${
    startDate ? `&startDateTime=${startDate}` : ""
  }${endDate ? `&endDateTime=${endDate}` : ""}${
    keyword ? `&keyword=${encodeURIComponent(keyword)}` : ""
  }&size=200`;

  const getPage = async (pageNum) => {
    const url = `${baseURL}&page=${pageNum}`;
    console.log("TM url:", url);
    const response = await fetch(url, {
      method: "GET",
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return Promise.reject(res.statusText);
      })
      .catch((err) => {
        console.error(err);
        return Promise.reject(err);
      });
    const { totalPages } = response?.page ?? {};
    const events = response?._embedded?.events ?? [];
    // filter out test events
    const realEvents = events.filter((event) => !event.test);
    const eventData = realEvents.map((event) => {
      const {
        name,
        url,
        dates,
        priceRanges,
        ageRestrictions,
        pleaseNote: notes,
      } = event;
      const { start } = dates;
      const { localDate, localTime } = start;
      const { min, max } = (priceRanges && priceRanges[0]) ?? {};
      const price = min
        ? min === max || !max
          ? `$${min}`
          : `$${min} - $${max}`
        : `? (see ${url} for details)`;
      const status = dates?.status?.code;
      const result = {
        name,
        url,
        date: localDate,
        time: localTime,
        price,
        status,
        ageRestrictions: "All ages",
      };
      if (ageRestrictions) {
        const { legalAgeEnforced, age } = ageRestrictions;
        result.ageRestrictions = legalAgeEnforced ? `${age}+` : `All ages`;
      }
      if (notes) {
        result.notes = notes;
        const ageRestrictionMatch = notes.match(/(15|16|17|18|21)/);
        if (ageRestrictionMatch) {
          result.ageRestrictions = `${ageRestrictionMatch[0]}+`;
        }
      }
      return result;
    });
    console.log("eventData:", eventData);
    return {
      data: eventData,
      totalPages,
    };
  };

  const pages = [];
  let pageNum = 0;
  let totalPages = 0;
  // get all pages of results
  while (pageNum <= totalPages) {
    const page = await getPage(pageNum);
    if (page) {
      if (page.totalPages) {
        // last page is always empty
        totalPages = page.totalPages - 1;
      }
      pages.push(page.data);
    } else {
      break;
    }
    pageNum++;
  }
  return pages.flat();
};

export default getUpcomingEvents;
