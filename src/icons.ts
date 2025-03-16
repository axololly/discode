import Path from 'pathlib-js';
import * as fileNames from './data/fileNames.json';
import * as fileExts from './data/fileExts.json';
import * as folderIcons from './data/folderIcons.json';

const baseUrl = "https://raw.githubusercontent.com/axololly/my-own-rpc-thingy/refs/heads/main/assets";

type FolderType = "open" | "closed";
type IconType = "normal" | "paused";

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
}

export class Icons {
    static getFileAsset(path: Path, type: IconType = "normal"): Icon {
        // @ts-ignore
        let name: string = fileNames[path.name] ?? fileExts[path.ext] ?? "default";
        
        let local = `assets/files/${type}/${name}.png`;

        return new Icon(
            name,
            local,
            `${baseUrl}/${local}`
        );
    }

    static getFolderAsset(path: Path, type: FolderType = "closed"): Icon {
        // @ts-ignore
        let name: string = folderIcons[path.name] ?? "default";

        let local = `assets/folders/${type}/${name}.png`;

        return new Icon(
            name,
            local,
            `${baseUrl}/${local}`
        );
    }
}