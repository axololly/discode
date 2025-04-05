import Path from 'pathlib-js';
import { getLogger } from './logging';
import { extensions, window, workspace } from 'vscode';
import { GitExtension, Repository } from './typings/git';
import { RPC } from './rpc';

let logger = getLogger("discode-git");

// Strongly typing the API response.
// 
// This doesn't feature all the items
// in the response - only what we need.
interface GitInfoPayload {
    username: string;
    repository: string;
    branch: string;
}

export class GitInfo {
    username: string;
    repository: string;
    branch: string;

    constructor (payload: GitInfoPayload) {
        this.username = payload.username;
        this.repository = payload.repository;
        this.branch = payload.branch;
    }

    get url() {
        return `https://github.com/${this.username}/${this.repository}/tree/${this.branch}`;
    }

    private static getRepository(): Repository | undefined {
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

    static async load(repository?: Repository): Promise<GitInfo | undefined> {
        // If we aren't already given an existing repository, we have
        // to go and fetch this information ourselves.
        repository ??= this.getRepository();

        if (!repository) return;

        let head = repository.state.HEAD;

        // If there is no current branch set, we probably have outdated info
        // and need to fetch for more recent info,
        if (!head) {
            logger.info("HEAD was undefined in repository state. Fetching for information.");

            await repository.fetch();
            
            head = repository.state.HEAD;

            if (head) {
                logger.info("Successfully retrieved HEAD information.");
                logger.debug(`HEAD name: ${head.name}`);
            }
            else {
                logger.warning("Could not retrieve HEAD information.");
            }
        }

        let branch = head?.name;

        if (!branch) {
            logger.warning("No branch was found through the Git extension.");
            return;
        }

        // Get the URL of the GitHub remote used from `git config`.
        // This contains our target info as: "https://github.com/<username>/<repository>.git"
        let remoteUrl = await repository.getConfig("remote.origin.url");

        let match = remoteUrl.match(/^https:\/\/github.com\/(.+)\/(.+)\.git$/)!;

        if (!match) {
            if (remoteUrl !== "") {
                logger.warning(`Could not interpret origin URL: "${remoteUrl}"`);
            }

            return;
        }

        return new GitInfo({
            branch,
            username: match[1],
            repository: match[2]
        });
    }
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
            
            rpc.gitInfo = await GitInfo.load(repo);

            logger.info(`Git info exists: ${rpc.gitInfo !== undefined}`);

            await rpc.changeEditorCallback(window.activeTextEditor);
        }
    );
}