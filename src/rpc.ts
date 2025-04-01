import { getLogger } from './logging';
import { Client } from 'discord-rpc';
import { Icons } from './icons';
import { DebugSession, TextEditor, WindowState, debug, window, workspace } from 'vscode';
import Path from 'pathlib-js';
import { Settings } from './settings';
import { GitInfo } from './git';

let logger = getLogger("discode-rpc");

interface Button {
    label: string;
    url: string;
}

interface FocusedFile {
    path: Path;
    since: number;
}

export class RPC {
    client: Client;
    focusedFile: FocusedFile | undefined;
    gitInfo: GitInfo | undefined;
    openedSince: number;
    idlingWait: NodeJS.Timeout | undefined;
    settings: Settings;

    constructor (openedSince: number) {
        this.client = new Client({ transport: 'ipc' });
        this.settings = Settings.load();

        this.openedSince = openedSince;
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

    private isSamePath(p1: Path, p2: Path) {
        return p1.path === p2.path;
    }

    async changeEditorCallback(editor: TextEditor | undefined) {
        if (!editor) {
            logger.notice("No editor was found. RPC was not updated.");
            return;
        }

        if (editor.document.isUntitled) {
            logger.notice("Current editor document is untitled. RPC was not updated.");
            return;
        }

        let doc = editor.document;

        let file = new Path(doc.fileName);
        let fileIcon = await Icons.getFileAsset(file);

        if (!this.focusedFile || !this.isSamePath(this.focusedFile.path, file)) {
            // When a new file is changed to
            this.focusedFile = {
                path: file,
                since: this.getTimestamp()
            };
        }

        let debugSession = debug.activeDebugSession;

        let folder = file.parent();
        let folderIcon = Icons.getFolderAsset(debugSession ? new Path("debug") : folder, "open");

        let cursor = editor.selection.active;
        let totalLines = doc.lineCount;

        let buttons: Button[] = [];

        if (this.gitInfo) {
            buttons.push({
                label: "View Repository",
                url: this.gitInfo.url
            });
        }

        if (this.settings.includeWatermark) {
            buttons.push({
                label: "Try me out!",
                url: "https://github.com/axololly/my-own-rpc-thingy/tree/main"
            });
        }

        let wsFolder = workspace.getWorkspaceFolder(doc.uri)!;
        let wsFolderPath = new Path(wsFolder.uri.fsPath);

        let since = this.settings.keepFileTimersWhenChanging
                  ? this.openedSince
                  : this.focusedFile.since;

        this.client.setActivity({
            largeImageKey:  fileIcon.url,
            largeImageText: `On line ${cursor.line + 1} of ${totalLines}`,

            smallImageKey:  folderIcon.url,
            smallImageText: folder == wsFolderPath ? `${folder.basename} (root)` : `~/${wsFolderPath.relative(folder)}`,

            details: `Editing: ${file.basename}`,
            state:   `${debugSession ? "Debugging" : "Working"} in: ${workspace.name ?? folder.stem}`,

            startTimestamp: since,
            buttons: buttons.length ? buttons : undefined
        });

        logger.info("Successfully set RPC activity.");
        logger.debug([
            `Large image: ${fileIcon}`,
            `Small image: ${folderIcon}`,
            `Buttons: ${buttons.length}`,
            `Workspace name: ${workspace.name}`,
            `In debug session? ${debugSession !== undefined}`
        ].join('\n'));
    }

    changeEditorFocus(state: WindowState) {
        if (state.focused) {
            if (!window.activeTextEditor) {
                logger.info("No active text editor found. RPC was not updated. [Location: changeEditorFocus]");
                this.updateOnIdle();
                return;
            }

            logger.debug("Window became focused again. Updating RPC and clearing timeout.");

            this.changeEditorCallback(window.activeTextEditor);

            clearTimeout(this.idlingWait);

            return;
        }

        logger.debug(`Timeout starting: ${this.settings.idleTimeout}s`);

        this.idlingWait = setTimeout(
            () => {
                this.updateOnIdle();
            },
            this.settings.idleTimeout * 1e3
        );
    }

    async updateOnIdle() {
        let editor = window.activeTextEditor;

        if (!editor) {
            logger.info("Could not locate an active text editor. RPC was not updated for idling.");
            return;
        }

        let doc = editor.document;

        let file = new Path(doc.fileName);
        let fileIcon = await Icons.getFileAsset(file, "paused");

        let debugSession = debug.activeDebugSession;

        let folder = file.parent();
        let folderIcon = Icons.getFolderAsset(debugSession ? new Path("debug") : folder, "closed");

        let cursor = editor.selection.active;

        let since = this.getTimestamp() - this.settings.idleTimeout;

        // If we're preserving times
        if (!this.settings.startNewTimersAfterIdling) {
            since = this.openedSince;
        }

        let buttons: Button[] = [];

        if (this.gitInfo) {
            buttons.push({
                label: "View Repository",
                url: this.gitInfo.url
            });
        }

        if (this.settings.includeWatermark) {
            buttons.push({
                label: "Try me out!",
                url: "https://github.com/axololly/my-own-rpc-thingy/tree/main"
            });
        }

        let wsFolder = workspace.getWorkspaceFolder(doc.uri)!;
        let wsFolderPath = new Path(wsFolder.uri.fsPath);

        this.client.setActivity({
            largeImageKey:  fileIcon.url,
            largeImageText: `On line ${cursor.line + 1} of ${doc.lineCount}`,

            smallImageKey:  folderIcon.url,
            smallImageText: folder == wsFolderPath ? `${folder.basename} (root)` : `~/${wsFolderPath.relative(folder)}`,

            details: `Idling on: ${file.basename}`,
            state:   `${debugSession ? "Debugging" : "Working"} in: ${workspace.name ?? folder.stem}`,

            startTimestamp: since,
            buttons: buttons.length > 0 ? buttons : undefined
        });

        logger.info("Set idling activity.");
        logger.debug([
            `Large image: ${fileIcon}`,
            `Small image: ${folderIcon}`,
            `Buttons: ${buttons.length}`,
            `Workspace name: ${workspace.name}`,
            `In debug session? ${debugSession !== undefined}`
        ].join('\n'));
    }

    stop() {
        logger.info("Destroying client and clearing idling timeout.");

        this.client.destroy();
        clearTimeout(this.idlingWait);
    }
}