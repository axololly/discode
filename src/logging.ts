import { window } from 'vscode';

/**
 * Logging levels are used as follows:
 * 
 * - **Debug:**     general debugging that can be used to track the execution
 *                  of a function or certain method. Often contains info about
 *                  fetching and presenting data that the extension requires.
 *
 * - **Info:**      generic information that abstracts from the details found
 *                  in the content at a debug level. This level is for information
 *                  the user can see and act on.
 * 
 * - **Notice:**    hidden logging level reserved for ignorable and common warnings.
 *                  This is for warnings that will be logged, but not displayed as
 *                  messages to the user in the editor.
 * 
 * - **Warning:**   information pertaining to _unignorable_ failures during execution
 *                  that may prevent certain features from working correctly. This is
 *                  used for informing the user of something they wouldn't already know.
 * 
 * - **Error:**     errors in the code that will prevent certain features from working.
 *                  The extension as a whole will likely still continue to work just fine.
 */
export enum LogLevel {
    Debug,
    Info,
    Notice,
    Warning,
    Error
}

const LOG_LEVEL_NAMES = Array.from(
    Object.keys(LogLevel).filter((v) => !/\d+/.test(v))
);

const MAX_LEVEL_NAME_LENGTH = Math.max(
    ...Object.keys(LogLevel).map((v) => v.length)
);

function getLoggingColour(level: LogLevel): string {
    let colour;

    switch (level) {
        case LogLevel.Debug:
            colour = '\x1b[37;1m';
            break;

        case LogLevel.Info:
            colour = '\x1b[34;1m';
            break;

        case LogLevel.Warning:
            colour = '\x1b[33;1m';
            break;

        case LogLevel.Notice:
            colour = '\x1b[36;1m';
            break;

        case LogLevel.Error:
            colour = '\x1b[31;1m';
            break;

        default:
            colour = getLoggingColour(LogLevel.Debug);
            break;
    }

    return colour;
}

const DIM = '\x1b[2m';
const GREY  = '\x1b[30;1m';
const PURPLE = '\x1b[35m';
const RESET = '\x1b[0m';
const WHITE = '\x1b[37m';

let MINIMUM_LOG_LEVEL = LogLevel.Info;

export function setMinLevel(level: LogLevel) {
    MINIMUM_LOG_LEVEL = level;
}

const OUTPUT_CHANNEL = window.createOutputChannel("discode");

// VSCode's output tab does not support logging.
// Thanks, VSCode.
const ENABLE_COLORS = false;

function handleFormatting(text: string): string {
    if (ENABLE_COLORS) return text;

    let ansiRegex = /\u001b\[(\d;?)+m/g;

    return text.replace(ansiRegex, "");
}


let LOGGER_NAME_LENGTH = 0;

// Blank function that does nothing with our log message.
const none = (_: string) => {};

function log(message: string, level: LogLevel, loggerName: string) {
    if (level < MINIMUM_LOG_LEVEL) return;

    // If the message is an error, we want to show an error message.
    // If the message is a warning, we want to show a warning message.
    // If neither, we don't want to show anything.
    let displayInEditor = level == LogLevel.Error
                        ? window.showErrorMessage
                        : level == LogLevel.Warning
                            ? window.showWarningMessage
                            : none;
    
    // Display any important logging messages as messages in the editor, if possible.
    displayInEditor(`${message} (${loggerName})`);

    let strLevel = LOG_LEVEL_NAMES[level].toUpperCase().padEnd(MAX_LEVEL_NAME_LENGTH);
    strLevel = `${getLoggingColour(level)}${strLevel}${RESET}`;

    let now = new Date();

    let day = now.getDate();
    let month = now.getMonth();
    let year = now.getFullYear();

    // Format the date as DD/MM/YYYY
    let date = [day, month, year].map((v) => `${v}`.padStart(2, '0')).join('/');

    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();

    // Format the time as HH:MM:SS
    let time = [hour, minute, second].map((v) => `${v}`.padStart(2, '0')).join(':');

    let datetime = `${DIM}${GREY}[${date} ${time}]${RESET}`;

    // Include which logger made the log
    loggerName = `${PURPLE}${loggerName.toString().padEnd(LOGGER_NAME_LENGTH + 2)}${RESET}`;

    // Log each line with formatting.
    message.split('\n').forEach((line) => {
        let raw = `${datetime} ${strLevel} ${loggerName}${WHITE}${line}${RESET}`;
        let fmt = handleFormatting(raw);

        // Log to the devtools console that DOES support ANSI.
        console.log(raw);

        // Log to the standard output tab that DOES NOT support ANSI.
        OUTPUT_CHANNEL.appendLine(fmt);
    });
}

class Logger {
    loggerName: string;

    constructor (loggerName: string) {
        this.loggerName = loggerName;
    }

    debug   = (message: string) => log(message, LogLevel.Debug,   this.loggerName);
    info    = (message: string) => log(message, LogLevel.Info,    this.loggerName);
    notice  = (message: string) => log(message, LogLevel.Notice,  this.loggerName);
    warning = (message: string) => log(message, LogLevel.Warning, this.loggerName);
    error   = (message: string) => log(message, LogLevel.Error,   this.loggerName);
}

export const getLogger = (name: string): Logger => {
    // Ensure we have enough padding for every name introduced.
    LOGGER_NAME_LENGTH = Math.max(name.length, LOGGER_NAME_LENGTH);

    return new Logger(name);
}