import Path from 'pathlib-js';
import { fileExts, fileNames, filePaths, folderNames, languageIDs } from './data';
import { getLogger } from './logging';
import { Uri, workspace } from 'vscode';

const baseUrl = "https://raw.githubusercontent.com/axololly/my-own-rpc-thingy/refs/heads/main/";

type FolderType = "open" | "closed";
type IconType = "normal" | "paused";

let logger = getLogger("discode-icons");

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

interface IconCache {
    [key: string]: string;
}

class IconRetriever {
    private cache: IconCache = {};

    async getFileAsset(path: Path, type: IconType = "normal"): Promise<Icon> {
        if (path.path in this.cache) {
            let name = this.cache[path.path];
            let localPath = `assets/files/${type}/${name}.png`;

            return new Icon(
                name,
                localPath,
                `${baseUrl}/${localPath}`
            );
        }

        let filePathIndex = path.parts().slice(-2).join('/').toLowerCase();
        let fileNameIndex = path.basename.toLowerCase();
        let fileExtsIndex = path.suffixes.join('').substring(1).toLowerCase();

        let name: string = filePaths[filePathIndex]
                        ?? fileNames[fileNameIndex]
                        ?? fileExts [fileExtsIndex];

        var languageIDsIndex;

        if (!name) {
            let doc = await workspace.openTextDocument(Uri.file(`${path}`));

            languageIDsIndex = doc.languageId.toLowerCase();

            name = languageIDs[languageIDsIndex] ?? "file";
        }

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