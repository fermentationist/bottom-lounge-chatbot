import getUpcomingBLEvents from "./services/ticketmaster.js";

export const chatbotFunctions = {
  getUpcomingEvents,
  getCurrentDateAndTime,
};

export const chatbotFunctionDefinitions = [
  {
    name: "getUpcomingEvents",
    description:
      "Get all upcoming events at Bottom Lounge (if called with no arguments), or get upcoming events on a specific date or date range. For each event, returns the name, date, time, price, status, ageRestrictions (either the minimum age or \"All ages\"), url and any additional notes.",
    parameters: {
      type: "object",
      properties: {
        dateTimeOrDateTimeRange: {
          type: "string",
          description:
            "A start datetime or datetime range in ISO format, like 2023-09-01T00:00:00Z or 2023-09-01T00:00:00Z..2023-09-02T00:00:00Z. Be sure to adjust for Chicago time by including the current offset from UTC. For example, if you want to see events on September 1, 2023, you would use 2023-09-01T00:00:00-05:00..2023-09-01T23:59:59-05:00. If passed only a start datetime, will search for all events from that datetime onward. If passed no arguments, will search for all events from the current datetime onward.",
        },
        keyword: {
          type: "string",
          description: "The name of the artist or event to search for.",
        },
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
  const { dateTimeOrDateTimeRange, keyword } = (args && JSON.parse(args)) ?? {};
  const [startDate, endDate] = (dateTimeOrDateTimeRange ?? "").split("..");
  const events = await getUpcomingBLEvents(startDate || void 0, endDate, keyword);
  const eventList = events.length && events
    .map(
      ({ name, url, date, time, price, status, notes, ageRestrictions }) =>
        `${date} at ${time}: ${name} - ${price} - status: ${status} - ${url} - age restrictions: ${ageRestrictions}${
          notes ? ` - please note: ${notes}` : ""
        }`
    )
    .join("\n");
  return eventList ? (
    eventList +
    ` \n(All times are in Chicago time. Current time in Chicago: ${getCurrentDateAndTime()})`
  ) : "No events found matching those criteria.";
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
