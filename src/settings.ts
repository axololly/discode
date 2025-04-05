import { workspace } from "vscode";
import { setMinLevel, LogLevel } from "./logging"
import { getLogger } from "./logging";

let logger = getLogger("discode-settings");

// Represents the raw values from the settings menu.
// The reason we don't use this is because we need
// to convert some of the data like the logging level
// and ensure idle timeout is not negative.
interface WorkspaceConfiguration {
    minimumLoggingLevel: string;
    idleTimeout: number;
    includeWatermark: boolean;
    promptOnNewRelease: boolean;
    keepFileTimersWhenChanging: boolean;
    startNewTimersAfterIdling: boolean;
    useGitFeatures: boolean;
}

// Represents the converted settings from the settings menu.
export class Settings {
    minLogLevel: LogLevel;
    idleTimeout: number;
    includeWatermark: boolean;
    promptOnNewRelease: boolean;
    keepFileTimersWhenChanging: boolean;
    startNewTimersAfterIdling: boolean;
    useGitFeatures: boolean;

    constructor (options: WorkspaceConfiguration) {
        logger.info("Successfully loaded settings!");
        
        let level = LogLevel[options.minimumLoggingLevel as keyof typeof LogLevel];

        this.minLogLevel = level;
        setMinLevel(level);

        let timeout = options.idleTimeout;

        if (timeout < 0) {
            logger.warning("Negative numbers for timeouts are not permitted. The timeout has been reset to 20 seconds.");
            timeout = 20;
        }

        this.idleTimeout = timeout;
        this.includeWatermark = options.includeWatermark;
        this.promptOnNewRelease = options.promptOnNewRelease;
        this.keepFileTimersWhenChanging = options.keepFileTimersWhenChanging;
        this.startNewTimersAfterIdling = options.startNewTimersAfterIdling;
        this.useGitFeatures = options.useGitFeatures;
    }

    static load(): Settings {
        logger.debug("Loading settings...");

        let config = workspace.getConfiguration('discode') as unknown as WorkspaceConfiguration;

        return new Settings(config);
    }
}