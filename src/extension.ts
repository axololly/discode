import { extensions, window } from 'vscode';
import { RPC } from './rpc';
import { registerGitCheck } from './git';
import { checkForLatestVersion } from './versioning';
import { Settings } from './settings';

let editorOpenedAt = Math.floor(Date.now() / 1000);
let rpc = new RPC(editorOpenedAt);

export async function activate() {
    await rpc.start();

    if (window.activeTextEditor) {
        rpc.changeEditorCallback(window.activeTextEditor);
        
        rpc.idlingWait = setTimeout(
            () => {
                rpc.updateOnIdle();
            },
            rpc.settings.idleTimeout * 1e3
        );
    }
    
    window.onDidChangeActiveTextEditor(rpc.changeEditorCallback, rpc);

    window.onDidChangeWindowState(rpc.changeEditorFocus, rpc);
    
    registerGitCheck(rpc);

    if (rpc.settings.promptOnNewRelease) {
        checkForLatestVersion();
    }

    extensions.onDidChange(() => {
        rpc.settings = Settings.load();
    });
}

export function deactivate() {
    rpc.stop();
}