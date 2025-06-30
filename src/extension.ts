import { commands, Disposable, window, workspace } from 'vscode';
import { RPC } from './rpc';
import { registerGitCheck } from './git';
import { checkForLatestVersion } from './versioning';

async function startExtension(): Promise<Disposable[]> {
    let disposables: Disposable[] = [];

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
    window.onDidChangeActiveTextEditor(rpc.changeEditorCallback, rpc, disposables);
    window.onDidChangeWindowState(rpc.changeEditorFocus, rpc, disposables);
    
    registerGitCheck(rpc);

    if (rpc.settings.promptOnNewRelease) {
        checkForLatestVersion();
    }

    // When the extension's settings are updated,
    // reflect those changes in code.
    workspace.onDidChangeConfiguration(rpc.onSettingsChange, rpc, disposables); // Check here

    // Let the user know the extension is working.
    window.showInformationMessage("Successfully started the extension.");

    return disposables;
}

let editorOpenedAt = Math.floor(Date.now() / 1000);
let rpc = new RPC(editorOpenedAt, startExtension);

export async function activate() {
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

    if (rpc.settings.disableThisWorkspace) return;

    rpc.start();
}

export function deactivate() {
    rpc.stop();
}