import Path from 'pathlib-js';
import { fileExts, fileNames, filePaths, folderNames, languageIDs } from './data';
import { getLogger } from './logging';

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

    toString = () => `Icon(name = ${this.name}, localPath = ${this.localPath})`;
}

export class Icons {
    static getFromLanguageID(languageID: string, type: IconType = "normal"): Icon | undefined {
        let name = languageIDs[languageID.toLowerCase()];

        logger.debug(`Attempted to get language ID: ${languageID} => ${name} (type: ${type})`);

        if (!name) return undefined;

        let local = `assets/files/${type}/${name}.png`;

        return new Icon(
            name,
            local,
            `${baseUrl}/${local}`
        );
    }

    static getFileAsset(path: Path, type: IconType = "normal"): Icon {
        let name: string = filePaths[Path.cwd().relative(path).toLowerCase()]
                        ?? fileNames[path.basename.toLowerCase()]
                        ?? fileExts[path.suffixes.join('').toLowerCase()]
                        ?? "file";
        
        logger.debug(
            `Attempted to get file asset: ${path} => ${name}\n`
          + `    filePaths index:   "${Path.cwd().relative(path).toLowerCase()}"\n`
          + `    fileNames index:   "${path.basename.toLowerCase()}"\n`
          + `    fileExts index:    "${path.suffixes.join('').toLowerCase()}"`
        );
        
        let local = `assets/files/${type}/${name}.png`;

        return new Icon(
            name,
            local,
            `${baseUrl}/${local}`
        );
    }

    static getFolderAsset(path: Path, type: FolderType = "closed"): Icon {
        let name: string = folderNames[path.basename.toLowerCase()]
                        ?? "folder";

        logger.debug(`Attempted to get folder asset: ${path} => ${name}`);

        let local = `assets/folders/${type}/${name}.png`;

        return new Icon(
            name,
            local,
            `${baseUrl}/${local}`
        );
    }
}