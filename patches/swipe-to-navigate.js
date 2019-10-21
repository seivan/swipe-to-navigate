define([
    "vs/code/electron-main/window",
    "vs/base/common/platform",
    "swipe-to-navigate/utils"
], function (win, platform, utils) {
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

    function registerSwipe(event, config, window) {
        logger(window, "Registered Swipe Listener!");
        let action = availableActions[config.action]
            .map(function (action) { return 'workbench.action.' + action; })
            .map(function (action) { return { id: action } })
            .reduce(function (_pv, _cv, _idx, actions) { return { back: actions[0], forward: actions[1] }; });

        let commandMappedAction = {
            left: action.back,
            right: action.forward,
            'browser-backward': action.back,
            'browser-forward': action.forward

        };
        window._win.addListener(event, function (_, command) {
            let selectedAction = commandMappedAction[command];
            if (selectedAction != null) {
                window.sendWhenReady('vscode:runAction', selectedAction);
            }

        });
    }





    let isMacOS = platform.isMacintosh;


    utils.override(win.CodeWindow, "onConfigurationUpdated", function (onConfigurationUpdated) {

        let resultOnConfigurationUpdated = onConfigurationUpdated();

        let window = this;

        let config = window.configurationService.getValue("swipeToNavigate");

        let event = null;

        if (isMacOS) { event = "swipe"; }
        else { event = "app-command"; }

        window._win.removeAllListeners(event);

        if (config == null) { config = defaultConfig; }
        if (config.action !== 'disabled') { registerSwipe(event, config, window); }


        return resultOnConfigurationUpdated;
    });



});

