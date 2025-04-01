import Path from 'pathlib-js';
import { getLogger } from './logging';
import { extensions, window, workspace } from 'vscode';
import { GitExtension, Repository } from './typings/git';
import { RPC } from './rpc';

let logger = getLogger("discode-git");

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
            logger.warning("Git extension was not found in Visual Studio Code.");
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
        repository ??= this.getRepository();

        if (!repository) return;

        let head = repository.state.HEAD;

        if (!head) {
            logger.info("HEAD was undefined in repository state. Fetching for information.");

            await repository.fetch();
            
            head = repository.state.HEAD!;

            if (head) {
                logger.info("Successfully retrieved HEAD information.");
                logger.debug(`HEAD name: ${head.name}`);
            }
            else {
                logger.warning("Could not retrieve HEAD information.");
            }
        }

        let branch = head.name;

        if (!branch) {
            logger.warning("No branch was found through the Git extension.");
            return;
        }

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

    api.onDidOpenRepository(
        async (repo) => {
            let path = new Path(repo.rootUri.fsPath);

            logger.info(`Repository opened: ${path.basename}`);
            
            rpc.gitInfo = await GitInfo.load(repo);

            logger.info(`Git info exists: ${rpc.gitInfo !== undefined}`);

            await rpc.changeEditorCallback(window.activeTextEditor);
        }
    );
}