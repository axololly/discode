import {
    ExtensionContext,
    commands,
    window
} from 'vscode';
import { RPC } from './rpc';

let rpc = new RPC();

export async function activate(context: ExtensionContext) {
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

    context.subscriptions.push(
        commands.registerCommand(
            'my-own-rpc-thingy.helloWorld',
            () => {
                window.showInformationMessage("This extension is working correctly.");
            }
        )
    );
}

export function deactivate() {
    rpc.stop();
}