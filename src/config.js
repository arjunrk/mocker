// Configurable using parameters. Use "-help" when running app to see list of options
const config = {
  NUMBER_OF_CASES: 100,
  TIMEFRAME_IN_YEARS: 2,
  OUTPUT_FORMAT: "csv",
  BATCH_SIZE_INSERT_SQL: 1000,
  MIN_EVENTS: 3,
  MAX_EVENTS: 10,
  MIN_DAYS_BETWEEN_EVENTS: 1,
  MAX_DAYS_BETWEEN_EVENTS: 3,
  MIN_HOURS_BETWEEN_EVENTS: 1,
  MAX_HOURS_BETWEEN_EVENTS: 3,
  MIN_MINUTES_BETWEEN_EVENTS: 1,
  MAX_MINUTES_BETWEEN_EVENTS: 3,
  RECENT_EVENT_FREQUENCY: 0,
  SHOW_PROGRESS: true,
  PROGRESS_INTERVAL: 1100,
  FILE_NAME_PREFIX: "Cases",
  INCLUDE_RECORD_COUNT_IN_FILE_NAME: true,
  DYNAMIC_ATTRS: 0,
  UNIQUE_VALUES_FOR_DYNAMIC_ATTRS: 10,
  MAX_VARIANTS: -1,
  MAX_SEQUENCES: -1,
  SHOW_SUMMARY: true,
  ENABLE_EASTER_EGGS: true
};

const ArgumentTypes = {
  FLOAT: "float",
  STRING: "string",
  BOOLEAN: "boolean",
  LCSTRING: "lowercasestring"
}

class ConfigDefinition {
  constructor(configName, argumentName, type, help) {
    this.configName = configName;
    this.argumentName = argumentName;
    this.type = type;
    this.help = help;
  }

  printHelpMessage() {
    console.log(
      `${this.argumentName}: ${this.help} (Default: ${config[this.configName] < 0 ? "None" : config[this.configName]})\n`
    );
  }

  parse(value) {
    if (this.type == ArgumentTypes.FLOAT) {
      return parseFloat(value);
    } else if (this.type == ArgumentTypes.BOOLEAN) {
      return value.toLowerCase() == "true";
    } else if (this.type == ArgumentTypes.STRING) {
      return value;
    } else if (this.type == ArgumentTypes.LCSTRING) {
      return value.toLowerCase();
    }
  }
}

const configDefinitions = [
  new ConfigDefinition("NUMBER_OF_CASES", "-cases", ArgumentTypes.FLOAT, "The number of cases to generate."),
  new ConfigDefinition("TIMEFRAME_IN_YEARS", "-timeframe", ArgumentTypes.FLOAT, "The amount of years to use as the timeframe of event dates."),
  new ConfigDefinition("OUTPUT_FORMAT", "-format", ArgumentTypes.LCSTRING, "The format to use for the output (csv or sql)."),
  new ConfigDefinition("BATCH_SIZE_INSERT_SQL", "-sqlbatchsize", ArgumentTypes.FLOAT, "The number rows to include with each SQL INSERT statement."),
  new ConfigDefinition("MIN_EVENTS", "-minevents", ArgumentTypes.FLOAT, "The minimum number of events to create for each case."),
  new ConfigDefinition("MAX_EVENTS", "-maxevents", ArgumentTypes.FLOAT, "The maximum number of events to create for each case."),
  new ConfigDefinition("MIN_DAYS_BETWEEN_EVENTS", "-mindays", ArgumentTypes.FLOAT, "The minimum number of days between events."),
  new ConfigDefinition("MAX_DAYS_BETWEEN_EVENTS", "-maxdays", ArgumentTypes.FLOAT, "The maximum number of days between events."),
  new ConfigDefinition("MIN_HOURS_BETWEEN_EVENTS", "-minhours", ArgumentTypes.FLOAT, "The minimum number of hours between events."),
  new ConfigDefinition("MAX_HOURS_BETWEEN_EVENTS", "-maxhours", ArgumentTypes.FLOAT, "The maximum number of hours between events."),
  new ConfigDefinition("MIN_MINUTES_BETWEEN_EVENTS", "-minminutes", ArgumentTypes.FLOAT, "The minimum number of minutes between events."),
  new ConfigDefinition("MAX_MINUTES_BETWEEN_EVENTS", "-maxminutes", ArgumentTypes.FLOAT, "The maximum number of minutes between events."),
  new ConfigDefinition("RECENT_EVENT_FREQUENCY", "-recentfrequency", ArgumentTypes.FLOAT, "The percentage [0,100] of events to generate within at least the past day. Should usually be accompanied by -mindays: 0."),
  new ConfigDefinition("SHOW_PROGRESS", "-progress", ArgumentTypes.BOOLEAN, "Enable/Disable a progress indicator."),
  new ConfigDefinition("PROGRESS_INTERVAL", "-progressinterval", ArgumentTypes.FLOAT, "How often to update the progress indicator. A value of 100 means that every 100 cases it updates the progress indicator."),
  new ConfigDefinition("FILE_NAME_PREFIX", "-prefix", ArgumentTypes.STRING, "The prefix for the name of the generated files."),
  new ConfigDefinition("INCLUDE_RECORD_COUNT_IN_FILE_NAME", "-verbosename", ArgumentTypes.BOOLEAN, "Whether to include the record count in the '-all' file name."),
  new ConfigDefinition("DYNAMIC_ATTRS", "-dynamicattrs", ArgumentTypes.FLOAT, "Number of dynamically generated case attributes."),
  new ConfigDefinition("UNIQUE_VALUES_FOR_DYNAMIC_ATTRS", "-uniquevalues", ArgumentTypes.FLOAT, "Number of unique values for each dynamically generated case attribute."),
  new ConfigDefinition("MAX_VARIANTS", "-maxvariants", ArgumentTypes.FLOAT, "Maximum number of unique variants."),
  new ConfigDefinition("MAX_SEQUENCES", "-maxsequences", ArgumentTypes.FLOAT, "Maximum number of unique event sequences."),
  new ConfigDefinition("SHOW_SUMMARY", "-summary", ArgumentTypes.BOOLEAN, "Display data summary on the console."),
  new ConfigDefinition("ENABLE_EASTER_EGGS", "-eastereggs", ArgumentTypes.BOOLEAN, "Enable/Disable easter egg patterns for process mining testing."),
]

function loadAndSetUserConfigurations() {
  const args = process.argv.slice(2);

  if (args.includes("-help")) {
    printHelp();
    return;
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (i + 1 < args.length) {
      for (let ci = 0; ci < configDefinitions.length; ci++) {
        let defn = configDefinitions[ci];
        if (arg === defn.argumentName) {
          config[defn.configName] = defn.parse(nextArg);
        }
      }
    }
  }
}

function printHelp() {
  console.log("\nUsage:");
  console.log(
    `node src/mocker.js ${configDefinitions.reduce((accstr, defn) => { return accstr + defn.argumentName + " [value] " }, "")}\n`
  );
  configDefinitions.forEach(defn => { defn.printHelpMessage() });
  console.log("\n");
}

module.exports = { config, loadAndSetUserConfigurations, printHelp };
