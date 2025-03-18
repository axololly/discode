import { getLogger } from './logging';
import { Client } from 'discord-rpc';
import { Icons } from './icons';
import {
    TextEditor,
    WindowState,
    window
} from 'vscode';
import Path from 'pathlib-js';
import { Settings } from './settings';

let logger = getLogger("discode-rpc");

export class RPC {
    client: Client
    idlingWait: NodeJS.Timeout | undefined;
    settings: Settings;

    constructor() {
        this.client = new Client({ transport: 'ipc' });
        this.settings = Settings.load();
    }

    async start() {
        this.client.on('ready', () => {
            logger.info(`Authenticated for user @${this.client.user!.username!}`);
        });

        await this.client.login({ clientId: '783070621679747123' });
    }

    private getTimestamp(): number {
        return Math.floor(Date.now() / 1000);
    }

    changeEditorCallback(editor: TextEditor | undefined) {
        if (!editor) {
            logger.warning("No editor was found. RPC was not updated. [Location: changeEditorCallback]");
            return;
        }

        if (editor.document.isUntitled) {
            logger.warning("Current editor document is untitled. RPC was not updated. [Location: changeEditorCallback]");
            return;
        }

        let since = this.getTimestamp();

        let file = new Path(editor.document.fileName);
        let fileIcon = Icons.getFromLanguageID(editor.document.languageId)
                    ?? Icons.getFileAsset(file);

        let folder = file.parent();
        let folderIcon = Icons.getFolderAsset(folder, "open");

        let cursor = editor.selection.active;
        let totalLines = editor.document.lineCount;

        this.client.setActivity({
            largeImageKey: fileIcon.url,
            largeImageText: `On line ${cursor.line + 1} of ${totalLines}`,
            
            smallImageKey: folderIcon.url,
            smallImageText: `Working in ${folder.stem}${folder == Path.cwd() ? ` (root)` : ``}`,

            details: `Editing: ${file.basename}`,
            startTimestamp: since
        });

        logger.info("Successfully set RPC activity.");

        logger.debug(
            `Large image: ${fileIcon}\n`
          + `Small image: ${folderIcon}`
        );
    }

    changeEditorFocus(state: WindowState) {
        if (state.focused && !window.activeTextEditor) {
            logger.warning("No active text editor found. RPC was not updated. [Location: changeEditorFocus]");
            return;
        }
        
        if (state.focused) {
            logger.debug("Window became focused again. Updating RPC and clearing timeout.");

            this.changeEditorCallback(window.activeTextEditor);

            clearTimeout(this.idlingWait);

            return;
        }

        logger.debug(`Timeout starting. (Waiting ${this.idlingWait}s)`);

        this.idlingWait = setTimeout(
            () => { this.updateOnIdle(); },
            this.settings.idleTimeout * 1e3
        );
    }

    private updateOnIdle() {
        let editor = window.activeTextEditor!;
        let doc = editor.document;

        let file = new Path(doc.fileName);
        let fileIcon = Icons.getFromLanguageID(doc.languageId, "paused")
                    ?? Icons.getFileAsset(file, "paused");

        let folder = file.parent();
        let folderIcon = Icons.getFolderAsset(folder, "closed");

        let cursor = editor.selection.active;

        let since = this.getTimestamp() - this.settings.idleTimeout;

        this.client.setActivity({
            largeImageKey: fileIcon.url,
            largeImageText: `On line ${cursor.line + 1} of ${doc.lineCount}`,
            
            smallImageKey: folderIcon.url,
            smallImageText: `Idling in ${folder.stem}`,

            details: `Idling on: ${file.basename}`,

            startTimestamp: since
        });

        logger.info("Set idling activity.");
        logger.debug(
            `Large image: ${fileIcon}\n`
          + `Small image: ${folderIcon}`
        );
    }

    stop() {
        logger.info("Destroying client and clearing idling timeout.");

        this.client.destroy();
        clearTimeout(this.idlingWait);
    }
}