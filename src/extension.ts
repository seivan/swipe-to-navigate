import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface FolderMap { [key: string]: string; }

interface Contribution {
    folderMap: FolderMap;
    browserModules: Array<string>;
    mainProcessModules: Array<string>;
}

interface API {
    contribute(sourceExtensionId: string, contribution: Contribution): void;
    active(): boolean;
}

function mkdirRecursive(p: string) {
    if (!fs.existsSync(p)) {
        if (path.parse(p).root !== p) {
            let parent = path.join(p, "..");
            mkdirRecursive(parent);
        }
        fs.mkdirSync(p);
    }
}

class Extension {

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        //Not really needed, but keep the code around. 
        // context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        //     if (e.affectsConfiguration('swipeToNavigate.')) {
        //         this.configurationChanged(e);
        //     }
        // }));
    }

    get sourcePath() {
        return path.join(this.context.extensionPath, "patches");
    }

    get modulesPath() {
        return path.join(this.context.globalStoragePath, "patches");
    }

    private copyModule(name: string) {

        let src = path.join(this.sourcePath, name);
        let dst = path.join(this.modulesPath, name);
        let data = fs.readFileSync(src);

        if (fs.existsSync(dst)) {
            let current = fs.readFileSync(dst);
            if (current.compare(data) === 0) {
                return false;
            }
        }
        fs.writeFileSync(dst, data);
        return true;
    }

    async start() {


        let isFreshStart = fs.existsSync(this.modulesPath) === false;
        mkdirRecursive(this.modulesPath);


        let authorName = "seivan";
        let extensionName = "swipe-to-navigate";
        let mainProcessFileName = extensionName + ".js";
        let mainProcess = [
            this.copyModule(mainProcessFileName),
            this.copyModule("utils.js"),
        ];
        let hasUpdatedMainProcess = mainProcess.includes(true);

        if (isFreshStart || hasUpdatedMainProcess) {
            let res = await vscode.window.showInformationMessage("Swipe To Navigate extension was updated. Please restart VSCode.", "Restart");
            if (res === "Restart") {
                //this.promptRestart(); FIXME: Add a way to restart programatically. 
                //Perhaps monkey patch could make `promptRestart` public. 
            }
        }


        let monkeyPatch = vscode.extensions.getExtension("iocave.monkey-patch");

        let folderMap = { [extensionName]: this.modulesPath };

        let mainProcessModules = [`${extensionName}/${extensionName}`];

        if (monkeyPatch !== undefined) {

            await monkeyPatch.activate();
            let exports: API = monkeyPatch.exports;
            exports.contribute(`${authorName}.${extensionName}`,
                {
                    folderMap: folderMap,
                    browserModules: [],
                    mainProcessModules: mainProcessModules
                }
            );
        } else {
            vscode.window.showWarningMessage("Monkey Patch extension is not installed. Swipe To Navigate will not work.");
        }
    }




    async configurationChanged(e: vscode.ConfigurationChangeEvent) {
        //Not really needed, but keep the code around. 
        //Getting extension a second time fails for some reason. 
        let monkeyPatch = vscode.extensions.getExtension("iocave.monkey-patch");
        if (monkeyPatch !== undefined) {
            await monkeyPatch.activate();
            let exports: API = monkeyPatch.exports;
            if (!exports.active()) {
                let res = await vscode.window.showWarningMessage("Monkey Patch extension is not enabled. Please enable Monkey Patch in order to use Swipe To Navigate.", "Enable");
                if (res === "Enable") {
                    vscode.commands.executeCommand("iocave.monkey-patch.enable");
                }
            } else {
                vscode.window.showWarningMessage("Monkey Patch extension is not installed. CustomizeUI will not work.");

            }
        }
    }

    context: vscode.ExtensionContext;
}


export function activate(context: vscode.ExtensionContext) {
    new Extension(context).start();
}

// this method is called when your extension is deactivated
export function deactivate() { }
