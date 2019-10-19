// define([
//     "module",
//     "require",
//     "vs/platform/instantiation/common/instantiationService",
//     "vs/code/electron-main/app",
//     "vs/code/electron-main/window",
//     "vs/base/common/platform",
//     "vs/platform/configuration/common/configuration",
//     "swipe-to-navigate/utils"
// ], function (module, require, insantiationService, app, win, platform, configuration, utils) {

define([
    "vs/code/electron-main/app",
    "vs/code/electron-main/window",
    "vs/base/common/platform",
    "swipe-to-navigate/utils"
], function (app, win, platform, utils) {
    'use strict';


    function logger(mainWindow, s) {
        // if (_debug === true) {
        console.log(s);
        // let b = s;
        // mainWindow._win.webContents.executeJavaScript(`console.dir("${Object.keys(s)}")`);
        mainWindow._win.webContents.executeJavaScript(`console.log("${s}")`);
        // mainWindow._win.webContents.executeJavaScript(`console.dir("${Object.keys(s)}")`);
        // mainWindow._win.webContents.executeJavaScript(`console.dir("${JSON.parse(JSON.stringify(s))}")`);
        // }
        // }
    }

    let availableActions = {
        'tabs': ['previousEditor', 'nextEditor'],
        'grouped-tabs': ['previousEditorInGroup', 'nextEditorInGroup'],
        'recent-code': ['navigateBack', 'navigateForward'],
        'recent-files': ['openPreviousRecentlyUsedEditor', 'openNextRecentlyUsedEditor'],

    }
    let defaultConfig = { 'action': 'tabs' };

    function registerSwipe(command, config, window) {

        let action = availableActions[config.action]
            .map(function (action) { return 'workbench.action.' + action; })
            .map(function (action) { return { id: action } })
            .reduce(function (_pv, _cv, _idx, actions) { return { back: actions[0], forward: actions[1] }; });

        window._win.addListener(command.event, function (_event, commandType) {
            switch (commandType) {
                case command.back:
                    window.sendWhenReady('vscode:runAction', action.back);
                    break;
                case command.forward:
                    window.sendWhenReady('vscode:runAction', action.forward);
                    break;
            }
        });
    }



    // 'description': nls.localize('swipeToNavigate', "Control what a three finger swipe will navigate between."),

    let isMacOS = platform.isMacintosh;


    utils.override(app.CodeApplication, "openFirstWindow", function (openFirstWindow) {
        let resultOpenFirstWindow = openFirstWindow();

        utils.override(win.CodeWindow, "onConfigurationUpdated", function (onConfigurationUpdated) {
            let resultOnConfigurationUpdated = onConfigurationUpdated();

            let window = this;

            let config = window.configurationService.getValue("swipeToNavigate");

            let command = { event: null, back: null, forward: null };

            if (isMacOS) {
                command.event = "swipe";
                command.back = "left";
                command.forward = "right";
            }
            else {
                command.event = "app-command";
                command.back = "browser-backward";
                command.forward = "browser-forward";
            }

            window._win.removeAllListeners(command.event);

            if (config == null) { config = defaultConfig; }
            if (config.action !== 'disabled') { registerSwipe(command, config, window); }


            return resultOnConfigurationUpdated;
        });

        return resultOpenFirstWindow;

    });

});
