import { Client } from 'discord-rpc';
import {
    TextEditor,
    WindowState,
    window
} from 'vscode';
import { Icons } from './icons';
import Path from 'pathlib-js';

export class RPC {
    client: Client
    idlingWait: NodeJS.Timeout | undefined;
    idleTimeout: number;

    constructor(idleTimeout: number = 20) {
        this.client = new Client({ transport: 'ipc' });
        this.idleTimeout = idleTimeout;
    }

    async start() {
        this.client.on('ready', () => {
            console.log(`Authed for user ${this.client.user!.username!}`);
        });

        await this.client.login({ clientId: '783070621679747123' });
    }

    private getTimestamp(): number {
        return Math.floor(Date.now() / 1000);
    }

    changeEditorCallback(editor: TextEditor | undefined) {
        if (!editor) return;
        if (editor.document.isUntitled) return;

        let since = this.getTimestamp();

        let file = new Path(editor.document.fileName);
        let fileIconUrl = Icons.getFileAsset(file).url;

        let folder = file.parent();
        let folderIconUrl = Icons.getFolderAsset(folder, "open").url;

        let cursor = editor.selection.active;
        let totalLines = editor.document.lineCount;

        this.client.setActivity({
            largeImageKey: fileIconUrl,
            largeImageText: `On line ${cursor.line} of ${totalLines}`,
            
            smallImageKey: folderIconUrl,
            smallImageText: `Working in ${folder.relative(Path.cwd())}`,

            details: `Editing: ${file.basename}`,
            
            startTimestamp: since,
        });
    }

    changeEditorFocus(state: WindowState) {
        if (!window.activeTextEditor) return;
        
        if (state.focused) {
            this.changeEditorCallback(window.activeTextEditor);

            clearTimeout(this.idlingWait);
            return;
        }

        this.idlingWait = setTimeout(
            () => { this.updateOnIdle(); },
            this.idleTimeout * 1e3
        );
    }

    private updateOnIdle() {
        let editor = window.activeTextEditor!;

        let file = new Path(editor.document.fileName);
        let fileIconUrl = Icons.getFileAsset(file, "paused").url;

        let folder = file.parent();
        let folderIconUrl = Icons.getFolderAsset(folder, "closed").url;

        let cursor = editor.selection.active;
        let totalLines = editor.document.lineCount;

        let since = this.getTimestamp() + this.idleTimeout;

        this.client.setActivity({
            largeImageKey: fileIconUrl,
            largeImageText: `On line ${cursor.line} of ${totalLines}`,
            
            smallImageKey: folderIconUrl,
            smallImageText: `Idling in ${folder.relative(Path.cwd())}`,

            details: `Idling on: ${file.basename}`,

            startTimestamp: since
        });
    }

    stop() {
        this.client.destroy();
        clearTimeout(this.idlingWait);
    }
}