import { getLogger } from './logging';
import packageData from '../package.json';
import { commands, window } from 'vscode';

const logger = getLogger("discode-version");

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

// Strongly typing the API response
interface VersionData   { version:     string          }
interface ExtensionData { versions:    VersionData[]   }
interface ResponsePage  { extensions?: ExtensionData[] }
interface APIResponse   { results:     ResponsePage[]  }

export async function checkForLatestVersion() {
    // Fuck you, Microsoft, for making the API private.
    // I had to get this from their C++ Tools extension.
    let reply = await fetch(
        "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery", {
        method: 'POST',
        headers: {
            "Accept": "application/json; api-version=3.0-preview",
            "Content-Type": "application/json",
            "User-Agent": "axololly.discode"
        },
        body: JSON.stringify({
            "filters": [{
                "criteria": [{
                    "filterType": 7,
                    "value": "axololly.discode"
                }]
            }],
            "flags": 529
        })
    });

    let json = await reply.json() as APIResponse;
    let extensionResults = json.results[0].extensions;

    logger.debug(`Extension results: ${extensionResults?.length}`);

    if (!extensionResults || extensionResults.length === 0) {
        logger.error("Could not fetch latest version of this extension on the Marketplace.");
        return;
    }

    let allVersions: VersionData[] = extensionResults[0].versions;

    logger.debug(`Located ${allVersions.length} new versions.`);

    let latestVersion = Version.fromString(allVersions[0].version);

    if (!latestVersion) {
        logger.error("Could not locate any version on the Marketplace.");
        return;
    }

    // If the user is using an outdated version, prompt them to install the new one.
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
                        logger.error(`Could not install v${latestVersion} of extension: ${reason}`);
                    }
                );
            }
        );
    }
}