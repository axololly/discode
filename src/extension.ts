import { commands, window, workspace } from 'vscode';
import { RPC } from './rpc';
import { registerGitCheck } from './git';
import { checkForLatestVersion } from './versioning';
import { Settings } from './settings';

let editorOpenedAt = Math.floor(Date.now() / 1000);
let rpc = new RPC(editorOpenedAt);

async function startExtension() {
    // Log in to Discord's RPC.
    await rpc.start();

    // If we load into an editor from a previous session,
    // update the RPC, as this is not covered by the
    // listener we register later on.
    if (window.activeTextEditor) {
        rpc.changeEditorCallback(window.activeTextEditor);
        
        // Also set a timeout to mimic what would have happened,
        // had we changed window state like normal.
        rpc.idlingWait = setTimeout(
            () => {
                rpc.updateOnIdle();
            },
            rpc.settings.idleTimeout * 1e3
        );
    }
    
    // Register listeners
    window.onDidChangeActiveTextEditor(rpc.changeEditorCallback, rpc);
    window.onDidChangeWindowState(rpc.changeEditorFocus, rpc);
    
    registerGitCheck(rpc);

    if (rpc.settings.promptOnNewRelease) {
        checkForLatestVersion();
    }

    // When the extension's settings are updated,
    // reflect those changes in code.
    workspace.onDidChangeConfiguration(() => {
        rpc.settings = Settings.load();
    });

    // Let the user know the extension is working.
    window.showInformationMessage("Successfully started the extension.");
}

export async function activate() {
    startExtension();
    
    // Register some simple commands for
    // connecting and disconnecting from RPC.
    commands.registerCommand(
        "discode.connect",
        startExtension
    );

    commands.registerCommand(
        "discode.disconnect",
        rpc.stop, rpc
    );
}

export function deactivate() {
    rpc.stop();
}