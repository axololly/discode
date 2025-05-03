import { getLogger } from './logging';
import { Client } from 'discord-rpc';
import { Icons } from './icons';
import { DebugSession, TextEditor, WindowState, debug, window, workspace } from 'vscode';
import Path from 'pathlib-js';
import { Settings } from './settings';
import { GitInfo } from './git';

let logger = getLogger("discode-rpc");

// Represents an RPC button.
interface Button {
    label: string;
    url: string;
}

// Represents the file being
// looked at in the editor.
interface FocusedFile {
    path: Path;
    since: number;
}

// Where the magic happens.
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

        // Store a timestamp of when the editor was first
        // booted up, that can be displayed in the RPC.
        this.openedSince = openedSince;
    }

    async start() {
        this.client.on('ready', () => {
            logger.info(`Authenticated for user @${this.client.user!.username!}`);
        });

        await this.client.login({ clientId: '1362081737169174628' });
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

        // Update the cache when a new file is changed to
        if (!this.focusedFile || !this.isSamePath(this.focusedFile.path, file)) {
            this.focusedFile = {
                path: file,
                since: this.getTimestamp()
            };
        }

        let debugSession = debug.activeDebugSession;

        let folder = file.parent();
        
        // The fake debug path is there because the method extracts the basename for lookup.
        // This means if we are debugging, we will always get a debug folder icon in the RPC.
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

        // If the setting is enabled, use the timestamp of when
        // the editor was first opened. If not, use the timestamp
        // of when *this file* was opened.
        let since = this.settings.keepFileTimersWhenChanging
                  ? this.openedSince
                  : this.focusedFile.since;

        this.client.setActivity({
            largeImageKey:  fileIcon.url,
            largeImageText: `On line ${cursor.line + 1} of ${totalLines}`,

            smallImageKey:  folderIcon.url,
            smallImageText: `~/${wsFolderPath.relative(folder)}`,

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
                
                // We switched to another tab that isn't editing text.
                // This means we have "idled" on our previous file.
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
            smallImageText: `~/${wsFolderPath.relative(folder)}`,

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