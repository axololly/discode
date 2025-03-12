import { getIconForFile } from 'vscode-icons-js';
import {
    TextEditor,
    ExtensionContext,
    commands,
    window
} from 'vscode';
import { start } from './rpc';

function changeEditorCallback(editor: TextEditor | undefined) {
    if (!editor) return;

    let filename = editor.document.fileName;

    let currentTimestamp = Math.floor(Date.now() / 1000);

    console.log(`Opened: ${filename} (Timestamp: ${currentTimestamp})`);

    let something = getIconForFile(filename);

    console.log(`Something: ${something}`);
}

export function activate(context: ExtensionContext) {
    console.log(`I am alive!`);

    start();

    window.onDidChangeActiveTextEditor(changeEditorCallback);

    const disposable = commands.registerCommand(
        'my-own-rpc-thingy.helloWorld',
        () => {
            window.showInformationMessage("This extension is working correctly.");
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}