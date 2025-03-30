import { getLogger } from './logging';
import packageData from '../package.json';
import { commands, window } from 'vscode';

const logger = getLogger("discode-versioning");

const VERSION_REGEX = /(\d+)\.(\d+)\.(\d+)/;

class Version {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;

    constructor (
        major: number,
        minor: number,
        patch: number
    ) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    static fromString(s: string): Version {
        let m = s.match(VERSION_REGEX)!;

        let [major, minor, patch] = m.slice(1).map(Number.parseInt);

        return new Version(major, minor, patch);
    }

    isAbove(v: Version) {
        if (v.major > this.major) return false;
        if (v.minor > this.minor) return false;
        if (v.patch > this.patch) return false;

        return true;
    }

    toString = () => [this.major, this.minor, this.patch].join('.');
}

export const currentVersion = Version.fromString(packageData.version);

interface VersionData   { version:    string          }
interface ExtensionData { versions:   VersionData[]   }
interface ResponsePage  { extensions: ExtensionData[] }
interface APIResponse   { results:    ResponsePage[]  }

export async function checkForLatestVersion() {
    let reply = await fetch(
        "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery", {
        headers: {
            "Accept": "application/json; api-version=3.0-preview",
            "Content-Type": "application/json",
            "User-Agent": "discode"
        },
        body: JSON.stringify({
            "filters": [{
                "criteria": [{
                    "filterType": 7,
                    "value": "discode"
                }]
            }],
            "flags": 529
        })
    });

    let json = await reply.json() as APIResponse;

    let allVersions: VersionData[] = json.results[0].extensions[0].versions;

    logger.debug(`Located ${allVersions.length} new versions.`);

    if (!allVersions.length) {
        logger.fatal("Could not locate any version on the Extension Marketplace.");
        return;
    }

    let latestVersion = Version.fromString(allVersions[0].version);

    if (latestVersion.isAbove(currentVersion)) {
        window.showInformationMessage(
            "There is a new version of this extension on the Marketplace.\n \
            Would you like to install it?",

            "Yes", "No", "Ignore"
        ).then(
            (choice) => {
                if (choice !== "Yes") return;

                logger.debug(`Attempting to install latest version v${latestVersion} (current: v${currentVersion})`);

                commands.executeCommand(
                    "workbench.extensions.installExtension",
                    packageData.name
                ).then(
                    undefined,
                    (reason: string) => {
                        logger.fatal(`Could not install v${latestVersion} of extension: ${reason}`);
                    }
                );
            }
        );
    }
}