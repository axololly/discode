import { debug, window } from 'vscode';
import { RPC } from './rpc';
import { registerGitCheck } from './git';
import { checkForLatestVersion } from './versioning';

let rpc = new RPC();

export async function activate() {
    await rpc.start();

    if (window.activeTextEditor) {
        rpc.changeEditorCallback(window.activeTextEditor);
    }
    
    window.onDidChangeActiveTextEditor(rpc.changeEditorCallback, rpc);

    window.onDidChangeWindowState(rpc.changeEditorFocus, rpc);

    debug.onDidStartDebugSession(rpc.updateOnDebugSession, rpc);
    
    registerGitCheck(rpc);

    if (rpc.settings.promptOnNewRelease) {
        checkForLatestVersion();
    }
}

export function deactivate() {
    rpc.stop();
}