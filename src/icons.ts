import Path from 'pathlib-js';
import { fileExts, fileNames, filePaths, folderNames, languageIDs } from './data';
import { getLogger } from './logging';
import { Uri, workspace } from 'vscode';

const baseUrl = "https://raw.githubusercontent.com/axololly/discode/refs/heads/main/";

type FolderType = "open" | "closed";
type IconType = "normal" | "paused";

let logger = getLogger("discode-icons");

/**
 * Represents an icon that will be displayed through Discord's RPC.
 * 
 * This wraps a name, a local path and a nonlocal GitHub URL that can
 * be used to display the image using a link.
 */
export class Icon {
    name: string;
    localPath: string;
    url: string;

    constructor(
        name: string,
        localPath: string,
        url: string
    ) {
        this.name = name;
        this.localPath = localPath;
        this.url = url
    }

    toString = () => this.name;
}

// We don't bother caching folders because they're not
// as expensive as files to lookup.
// 
// We have to search through 4 hashmaps for a file,
// including grabbing a language ID, but only 1 hashmap
// for a folder. 
interface FileIconCache {
    [key: string]: string;
}

class IconRetriever {
    private cache: FileIconCache = {};

    async getFileAsset(path: Path, type: IconType = "normal"): Promise<Icon> {
        // If we've already found it before.
        if (path.path in this.cache) {
            let name = this.cache[path.path];
            let localPath = `assets/files/${type}/${name}.png`;

            return new Icon(
                name,
                localPath,
                `${baseUrl}/${localPath}`
            );
        }

        // Store the indexes as variables so they're easier to log.
        let filePathIndex = path.parts().slice(-2).join('/').toLowerCase();
        let fileNameIndex = path.basename.toLowerCase();
        let fileExtsIndex = path.suffixes.join('').substring(1).toLowerCase();

        // Look for the name in the first three hashmaps.
        let name: string = filePaths[filePathIndex]
                        ?? fileNames[fileNameIndex]
                        ?? fileExts [fileExtsIndex];

        var languageIDsIndex;

        // If the name is still undefined, try searching for the name as a language ID.
        if (!name) {
            // The file we want is already open in the editor, so no visual bugs here.
            let doc = await workspace.openTextDocument(Uri.file(`${path}`));

            languageIDsIndex = doc.languageId.toLowerCase();

            // Check one last time for a name, and if not, show the default.
            name = languageIDs[languageIDsIndex] ?? "file";
        }

        // Cache the path so we can exit early
        // if we encounter it again.
        this.cache[path.path] = name;

        logger.debug([
            `Attempted to get file asset: ${path} => ${name}`,
            `    filePaths index:   "${filePathIndex}"`,
            `    fileNames index:   "${fileNameIndex}"`,
            `    fileExts index:    "${fileExtsIndex}"`,
            `    lang IDs index:    "${languageIDsIndex}"`
        ].join('\n'));

        let local = `assets/files/${type}/${name}.png`;

        return new Icon(
            name,
            local,
            `${baseUrl}/${local}`
        );
    }

    getFolderAsset(path: Path, type: FolderType = "closed"): Icon {
        let name: string = folderNames[path.basename.toLowerCase()] ?? "folder";

        logger.debug(`Attempted to get folder asset: ${path} => ${name}`);

        let local = `assets/folders/${type}/${name}.png`;

        return new Icon(
            name,
            local,
            `${baseUrl}/${local}`
        );
    }
}

export const Icons = new IconRetriever();