import {
    ExtensionContext,
    commands,
    window
} from 'vscode';
import { RPC } from './rpc';

export function activate(context: ExtensionContext) {
    console.log(`I am alive!`);

    let rpc = new RPC();

    rpc.start();

    window.onDidChangeActiveTextEditor(rpc.changeEditorCallback);
    window.onDidChangeWindowState(rpc.changeEditorFocus);

    const disposable = commands.registerCommand(
        'my-own-rpc-thingy.helloWorld',
        () => {
            window.showInformationMessage("This extension is working correctly.");
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}