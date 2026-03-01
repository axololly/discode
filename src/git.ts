import Path from 'pathlib-js';
import { getLogger } from './logging';
import { extensions, window, workspace } from 'vscode';
import { GitExtension, Repository } from './typings/git';
import { RPC } from './rpc';
import gitUrlParse from 'git-url-parse';

let logger = getLogger("discode-git");

function getRepository(): Repository | undefined {
    let gitExt = extensions.getExtension<GitExtension>('vscode.git');

    if (!gitExt) {
        logger.warning("Git extension was not found in Visual Studio Code, which this extension relies on. To remove this warning, disable this feature in the Discode settings.");
        return;
    }

    let api = gitExt.exports.getAPI(1);

    let wsFolders = workspace.workspaceFolders;

    if (!wsFolders) {
        logger.notice("No workspace folders were found. Git information could not be fetched.");
        return;
    }

    let rootPath = new Path(wsFolders[0].uri.fsPath);
    
    logger.debug(`Repositories: ${api.repositories.length}`);

    // Check for a repository in the current workspace by iterating
    // through all the registered repositories and finding out which
    // are inside the current workspace folder.
    let repository = api.repositories.filter(
        (repo) => {
            let repoRoot = new Path(repo.rootUri.fsPath);
            let rel = rootPath.relative(repoRoot);

            return !rel.includes("..");
        }
    )[0];

    if (!repository) {
        logger.notice("No repository was found in the current workspace.");
        return;
    }

    return repository;
}

export async function getGitUrl(repository?: Repository): Promise<string | undefined> {
    // If we aren't already given an existing repository, we have
    // to go and fetch this information ourselves.
    repository ??= getRepository();

    if (!repository) return;

    let remoteUrl = await repository.getConfig("remote.origin.url");

    let url = gitUrlParse(remoteUrl).toString("https");

    let isReachable = (await fetch(url)).ok;

    if (!isReachable) {
        console.debug(`Attempted to make request to: ${url} - was unsuccessful`);
        return;
    }

    return url;
}

export function registerGitCheck(rpc: RPC) {
    let gitExt = extensions.getExtension<GitExtension>('vscode.git');

    if (!gitExt) {
        logger.warning("Git extension was not found in Visual Studio Code.");
        return;
    }

    let api = gitExt.exports.getAPI(1);

    // When we do open a repository, update the RPC so it displays
    // the correct buttons linking to it, if possible.
    api.onDidOpenRepository(
        async (repo) => {
            if (!rpc.settings.useGitFeatures) return;

            let path = new Path(repo.rootUri.fsPath);

            logger.info(`Repository opened: ${path.basename}`);
            
            rpc.gitUrl = await getGitUrl(repo);

            logger.info(`Git URL exists: ${rpc.gitUrl !== undefined}`);

            await rpc.changeEditorCallback(window.activeTextEditor);
        }
    );
}
