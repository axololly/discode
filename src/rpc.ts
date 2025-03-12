import { Client } from 'discord-rpc';
import path = require('node:path');
import {
    TextEditor,
    WindowState,
    window
} from 'vscode';
import * as filenames from './data/filenames.json';
import * as fileExts from './data/file-exts.json';

const baseUrl = "https://raw.githubusercontent.com/axololly/my-own-rpc-thingy/refs/heads/main/assets/";
// const vscodeImage = "https://upload.wikimedia.org/wikipedia/commons/1/1c/Visual_Studio_Code_1.35_icon.png";

export class RPC {
    client: Client
    idlingWait: NodeJS.Timeout | undefined;

    constructor() {
        this.client = new Client({ transport: 'ipc' });
    }

    async start() {
        this.client.on('ready', () => {
            console.log(`Authed for user ${this.client.user!.username!}`);
        });

        this.client.login({ clientId: '783070621679747123' });
    }
    
    private findImageName(file: path.ParsedPath) {
        let imageName: string;

        if (file.base in filenames) {
            // @ts-ignore
            imageName = filenames[file.base];
        }
        else if (file.ext in fileExts) {
            // @ts-ignore
            imageName = fileExts[file.ext]
        }
        else {
            imageName = "default";
        }

        return imageName;
    }

    changeEditorCallback(editor: TextEditor | undefined) {
        if (!editor) return;

        let since = Math.floor(Date.now() / 1000);

        let file = path.parse(editor.document.fileName);    
        let imageName = this.findImageName(file);

        this.client.setActivity({
            largeImageKey: `${baseUrl}/normal/${imageName}.png`,
            details: `Editing: ${file.base}`,
            
            startTimestamp: since,
        });

        console.log(`Updated activity.`);
    }

    changeEditorFocus(state: WindowState) {
        if (state.active) {
            console.log("Clearing timeout.");
            
            clearTimeout(this.idlingWait);
            return;
        }

        if (!window.activeTextEditor) return;

        let file = path.parse(window.activeTextEditor.document.fileName);
        let imageName = this.findImageName(file);

        this.idlingWait = setTimeout(
            () => {
                console.log(`Waiting 10 seconds before announcing idling.`);

                let since = Math.floor(Date.now() / 1000);

                this.client.setActivity({
                    largeImageKey: `${baseUrl}/paused/${imageName}`,
                    details: `Idling on: ${file.base}`,

                    startTimestamp: since
                });
                
                console.log(`Updated activity to idling.`);
            },
            10e3
        );
    }
}