import Path from 'pathlib-js';
import { window } from 'vscode';

export enum LogLevel {
    Trace,
    Debug,
    Info,
    Warning,
    Error,
    Fatal
}

const LOG_LEVEL_NAMES = Array.from(
    Object.keys(LogLevel).filter((v) => !/\d+/.test(v))
);

function getLoggingColour(level: LogLevel): string {
    let colour;
    
    switch (level) {
        case LogLevel.Debug:
            colour = '\x1b[40;1m';
            break;
        
        case LogLevel.Info:
            colour = '\x1b[34;1m';
            break;
        
        case LogLevel.Warning:
            colour = '\x1b[33;1m';
            break;
        
        case LogLevel.Error:
            colour = '\x1b[31m';
            break;
        
        case LogLevel.Fatal:
            colour = '\x1b[31;1m';
            break;
        
        default:
            colour = getLoggingColour(LogLevel.Debug);
            break;
    }

    return colour;
}

const GREY  = '\x1b[30;1m';
const PURPLE = '\x1b[35m';
const RESET = '\x1b[0m';

let MINIMUM_LOG_LEVEL = LogLevel.Debug;

export function setMinLevel(level: LogLevel) {
    MINIMUM_LOG_LEVEL = level;
}

const LEVEL_NAME_LENGTH = Math.max(
    ...Object.keys(LogLevel).map((v, _, __) => v.length)
);

function log(message: string, level: LogLevel, location: string) {
    if (level < MINIMUM_LOG_LEVEL) return;

    if (level == LogLevel.Warning) {
        window.showWarningMessage(`${message} (${location})`);
    }
    else if (level > LogLevel.Warning) {
        window.showErrorMessage(`${LOG_LEVEL_NAMES[level]}: ${message} (${location})`);
    }

    let strLevel = LOG_LEVEL_NAMES[level].toUpperCase().padEnd(LEVEL_NAME_LENGTH);
    strLevel = `${getLoggingColour(level)}${strLevel}${RESET}`;

    let now = new Date();
    
    let day = now.getDate();
    let month = now.getMonth();
    let year = now.getFullYear();

    let date = [day, month, year].map((v) => `${v}`.padStart(2, '0')).join('/');
    
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();

    let time = [hour, minute, second].map((v) => `${v}`.padStart(2, '0')).join(':');

    let datetime = `${GREY}[${date} ${time}]${RESET}`;

    location = `${PURPLE}${location}${RESET}`;

    message.split('\n').forEach((line) => {
        console.log(`${datetime} ${strLevel} ${location}  ${line}`);
    });
}

class Logger {
    location: string;

    constructor (location: string) {
        this.location = location;
    }

    trace   = (message: string) => log(message, LogLevel.Trace,   this.location);
    debug   = (message: string) => log(message, LogLevel.Debug,   this.location);
    info    = (message: string) => log(message, LogLevel.Info,    this.location);
    warning = (message: string) => log(message, LogLevel.Warning, this.location);
    error   = (message: string) => log(message, LogLevel.Error,   this.location);
    fatal   = (message: string) => log(message, LogLevel.Fatal,   this.location);
}

export function getLogger(location: string) {
    return location == "root" ? root : new Logger(location);
}

let root = new Logger("root");

export const trace   = root.trace;
export const debug   = root.debug;
export const info    = root.info;
export const warning = root.warning;
export const error   = root.error;
export const fatal   = root.fatal;