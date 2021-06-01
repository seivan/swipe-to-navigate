define([
    "vs/platform/windows/electron-main/window",
    "vs/base/common/platform",
    "swipe-to-navigate/utils"
], function (win, platform, utils) {
    'use strict';


    function logger(mainWindow, s) {
        console.log(s);
        mainWindow._win.webContents.executeJavaScript(`console.log("${s}")`);
    }

    let availableActions = {
        'tabs': ['previousEditor', 'nextEditor'],
        'grouped-tabs': ['previousEditorInGroup', 'nextEditorInGroup'],
        'recent-code': ['navigateBack', 'navigateForward'],
        'recent-files': ['openPreviousRecentlyUsedEditor', 'openNextRecentlyUsedEditor'],

    };

    let defaultConfig = { 'action': 'tabs' };

    function registerSwipe(event, config, window) {
        logger(window, "Registered Swipe Listener!");

        // when reverse = true: swipe from left to right to go back;
        let direction = config.directionReverse ? 1 : 0;

        // change to avoid unnecessary loop
        let actions = availableActions[config.action]
            .map(function (action) { return { id: 'workbench.action.' + action } })
        let action = { back: actions[direction], forward: actions[1 - direction] }

        let commandMappedAction = {
            left: action.back,
            right: action.forward,
            'browser-backward': action.back,
            'browser-forward': action.forward

        };
        window._win.addListener(event, function (_, command) {
            let selectedAction = commandMappedAction[command];
            if (selectedAction != null) {
                window.sendWhenReady('vscode:runAction', null, selectedAction);
            }

        });
    }





    let isMacOS = platform.isMacintosh;


    utils.override(win.CodeWindow, 'onConfigurationUpdated', function (onConfigurationUpdated) {

        let resultOnConfigurationUpdated = onConfigurationUpdated();

        let window = this;

        let config = window.configurationService.getValue('swipeToNavigate');

        let event = null;

        if (isMacOS) { event = 'swipe'; }
        else { event = 'app-command'; }

        window._win.removeAllListeners(event);

        if (config == null) { config = defaultConfig; }
        if (config.action !== 'disabled') { registerSwipe(event, config, window); }


        return resultOnConfigurationUpdated;
    });



});
