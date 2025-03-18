import { window } from 'vscode';
import { RPC } from './rpc';

let rpc = new RPC();

export async function activate() {
    await rpc.start();

    if (window.activeTextEditor) {
        rpc.changeEditorCallback(window.activeTextEditor);
    }

    window.onDidChangeActiveTextEditor((editor) => {
        rpc.changeEditorCallback(editor);
    });

    window.onDidChangeWindowState((state) => {
        rpc.changeEditorFocus(state);
    });
}

export function deactivate() {
    rpc.stop();
}