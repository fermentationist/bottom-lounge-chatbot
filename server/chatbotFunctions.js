import getUpcomingBLEvents from "./services/ticketmaster.js";

export const chatbotFunctions = {
  getUpcomingEvents,
  getCurrentDateAndTime,
};

export const chatbotFunctionDefinitions = [
  {
    name: "getUpcomingEvents",
    description:
      'Get all upcoming events at Bottom Lounge (if called with no arguments), or get upcoming events on a specific date or date range. For each event, returns the name, date, time, price, status, ageRestrictions (either the minimum age or "All ages"), url, genre and any additional notes.',
    parameters: {
      type: "object",
      properties: {
        endDate: {
          type: "string",
          description:
            "An ending datetime in ISO format, like 2023-09-01T00:00:00Z. Be sure to adjust for Chicago time by including the current offset from UTC. For example, if you want to see events for a range ending on September 1, 2023, you would use 2023-09-01T00:00:00-05:00. If endDate is undefined and a startDate was passed, it will search for all events from startDate onward. If startDate is also undefined, it will search for all events from the current datetime onward.",
        },
        keyword: {
          type: "string",
          description: "The name of the artist or event to search for.",
        },
        //   },
        // },
      },
    },
  },
  {
    name: "getCurrentDateAndTime",
    description: "Get the current date and time in Chicago.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
];

async function getUpcomingEvents(args) {
  try {
    const { startDate, endDate, keyword, ageRestrictions } =
      (args && JSON.parse(args)) ?? {};
    const events = await getUpcomingBLEvents(
      startDate,
      endDate,
      keyword
    );
    const filteredEvents = ageRestrictions
      ? events.filter((event) => event.ageRestrictions === ageRestrictions)
      : events;
    const eventList =
      filteredEvents.length &&
      filteredEvents
        .map(
          ({
            name,
            url,
            date,
            time,
            price,
            status,
            notes,
            ageRestrictions,
            classification,
          }) =>
            `${date} at ${time}: ${name} - ${price} - status: ${status} - ${url} - age restrictions: ${ageRestrictions} - genre: ${classification}${
              notes ? ` - please note: ${notes}` : ""
            }`
        )
        .join("\n");
    return eventList
      ? eventList +
          ` \n(All times are in Chicago time. Current time in Chicago: ${getCurrentDateAndTime()})`
      : "No events found matching those criteria.";
  } catch (err) {
    console.error(err);
    return "Something went wrong while contacting the Ticketmaster API. Please try again later.";
  }
}

function getCurrentDateAndTime() {
  const date = new Date();
  const options = {
    timeZone: "America/Chicago",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
  const formattedDate = date.toLocaleDateString("en-US", options);
  console.log("current date and time:", formattedDate);
  return formattedDate;
}
