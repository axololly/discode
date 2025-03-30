import { workspace } from "vscode";
import { setMinLevel, LogLevel } from "./logging"
import { getLogger } from "./logging";

let logger = getLogger("discode-settings");

interface WorkspaceConfiguration {
    minimumLoggingLevel: string;
    idleTimeout: number;
    includeWatermark: boolean;
    promptOnNewRelease: boolean;
}

export class Settings {
    minLogLevel: LogLevel;
    idleTimeout: number;
    includeWatermark: boolean;
    promptOnNewRelease: boolean;

    constructor (options: WorkspaceConfiguration) {
        let level = LogLevel[options.minimumLoggingLevel as keyof typeof LogLevel];

        this.minLogLevel = level;
        setMinLevel(level);

        let timeout = options.idleTimeout;

        if (timeout < 0) {
            logger.error("Negative numbers for timeouts are not permitted. The timeout has been reset to 20 seconds.");

            timeout = 20;
        }

        this.idleTimeout = timeout;
        this.includeWatermark = options.includeWatermark;
        this.promptOnNewRelease = options.promptOnNewRelease;
    }

    static load(): Settings {
        let config = workspace.getConfiguration('discode') as unknown as WorkspaceConfiguration;

        return new Settings(config);
    }
}