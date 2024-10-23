const { faker } = require("@faker-js/faker");
const moment = require("moment");
const { getRandomString, getVocabulary } = require("./vocabulary");
const { config } = require("./config");
const { showProgress } = require("./progress");

function generateCases(numCases) {
  const cases = [];
  let vocabulary = getVocabulary();

  for (let i = 1; i <= numCases; i++) {
    const caseRecord = {};

    vocabulary.schema.cases.columns.forEach((field) => {
      if (field.primary_key) {
        caseRecord._id = i;
        caseRecord[field.display_name] = i;
      } else {
        caseRecord[field.display_name] = getRandomString(field.name);
      }
    });

    cases.push(caseRecord);
    if (config.SHOW_PROGRESS && i % config.PROGRESS_INTERVAL == 0) {
      showProgress((i / numCases) * 100, (text = "Generating cases"));
    }
  }

  if (config.SHOW_PROGRESS) {
    showProgress(100, (text = "Generating cases"));
    process.stdout.write("\n");
  }
  return cases;
}

function generateEvents(cases) {
  const transitions = [];
  const numCases = cases.length;

  let caseNumber = 0,
    eventId = 1;
  for (const caseRecord of cases) {
    const numTransitions = faker.number.int({
      min: config.MIN_EVENTS,
      max: config.MAX_EVENTS,
    });
    caseNumber++;

    const vocabulary = getVocabulary();
    const startDate = faker.date.past({ years: config.TIMEFRAME_IN_YEARS });
    let currentDate = moment(startDate);

    const initialEvent = getRandomString("__initial_event__");

    let eventName,
      previousEvent;

    for (let i = 0; i < numTransitions; i++) {
      const event = {};
      if (i === 0) {
        eventName = initialEvent;
      } else if (i === numTransitions - 1) {
        eventName = getRandomString(previousEvent, Object.keys(vocabulary.finalEvents));
      } else {
        eventName = getRandomString(previousEvent);
      }

      previousEvent = eventName;

      vocabulary.schema.events.columns.forEach((field) => {
        if (field.primary_key) {
          event[field.display_name] = event._id = eventId++;
        } else if (field.is_case_id) {
          event[field.display_name] = caseRecord._id;
        } else if (field.event_action) {
          event[field.display_name] = field.foreign_key ? valueToForeignKey(eventName, field.name) : eventName;
        } else if (field.event_date) {
          event[field.display_name] = currentDate.format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          );
        } else if (field.foreign_key) {
          event[field.display_name] = valueToForeignKey(getRandomString(field.name), field.name);
        } else {
          event[field.display_name] = getRandomString(field.name);
        }
      });

      transitions.push(event);

      if (eventName in vocabulary.finalEvents) break;

      currentDate.add({
        days: faker.number.int({
          min: config.MIN_DAYS_BETWEEN_EVENTS,
          max: config.MAX_DAYS_BETWEEN_EVENTS,
        }),
        hours: faker.number.int({
          min: config.MIN_HOURS_BETWEEN_EVENTS,
          max: config.MAX_HOURS_BETWEEN_EVENTS,
        }),
        minutes: faker.number.int({
          min: config.MIN_MINUTES_BETWEEN_EVENTS,
          max: config.MAX_MINUTES_BETWEEN_EVENTS,
        }),
      });
    }
    if (config.SHOW_PROGRESS && caseNumber % config.PROGRESS_INTERVAL == 0) {
      showProgress(
        (caseNumber / numCases) * 100,
        (text = "Generating events")
      );
    }
  }
  if (config.SHOW_PROGRESS) {
    showProgress(1 * 100, (text = "Generating events"));
    process.stdout.write("\n");
  }
  return transitions;
}

function valueToForeignKey(value, table) {
  const vocabulary = getVocabulary();
  return vocabulary.data[table][value];
}

module.exports = { generateCases, generateEvents };
