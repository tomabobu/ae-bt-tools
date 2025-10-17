/**
 * Time Offset - Core Logic
 * Handles state management and communication with After Effects
 */
var TimeOffset = (function () {
    let csInterface;
    let moduleState = {
        order: 'ascending',
        alignment: 'start',
        timeOffset: 0,
        bezierPoints: [0.42, 0, 0.58, 1],
        randomMin: 0,
        randomMax: 0,
        randomSeed: 0,
        isInteractive: false,
        savedSelection: null
    };

    /**
     * Initialize the core module
     */
    function init(cs) {
        csInterface = cs;
        console.log('TimeOffset core initialized');
        loadState();
    }

    /**
     * Apply time offset to selection
     */
    function applyOffset(params, callback) {
        console.log('Applying offset with params:', params);

        Object.assign(moduleState, params);

        callJSXFunction('applyTimeOffset', [params], function (result) {
            if (callback) callback(result);
        });
    }

    /**
     * Start interactive mode
     */
    function startInteractive(params, callback) {
        console.log('Starting interactive mode with params:', params);

        moduleState.isInteractive = true;
        Object.assign(moduleState, params);

        // Save current selection with complete keyframe data
        callJSXFunction('saveSelection', [], function (result) {
            console.log('Save selection result:', result);

            if (result.error) {
                console.error('Failed to save selection:', result.error);
                moduleState.isInteractive = false;
                if (callback) callback(result);
            } else {
                moduleState.savedSelection = result.result;
                console.log('Saved selection type:', moduleState.savedSelection.type);
                console.log('Saved items count:', moduleState.savedSelection.items.length);

                // Apply initial offset
                console.log('Applying initial offset...');
                applyWithSavedSelection(params, function (applyResult) {
                    console.log('Initial apply result:', applyResult);

                    if (applyResult.error) {
                        console.error('Failed to apply initial offset:', applyResult.error);
                        moduleState.isInteractive = false;
                        moduleState.savedSelection = null;
                        if (callback) callback(applyResult);
                    } else {
                        console.log('Interactive mode started successfully');
                        if (callback) callback({ success: true, result: applyResult.result });
                    }
                });
            }
        });
    }

    /**
     * Update interactive preview
     */
    function updateInteractive(params, callback) {
        if (!moduleState.isInteractive) {
            if (callback) callback({ error: 'Not in interactive mode' });
            return;
        }

        console.log('Updating interactive with params:', params);
        Object.assign(moduleState, params);

        // Always work from the original saved selection
        applyWithSavedSelection(params, callback);
    }

    /**
     * Apply offset using saved selection state
     */
    function applyWithSavedSelection(params, callback) {
        var paramsWithSelection = Object.assign({}, params, {
            savedSelection: moduleState.savedSelection
        });

        console.log('Applying with saved selection');

        callJSXFunction('applyTimeOffset', [paramsWithSelection], function (applyResult) {
            console.log('Apply result:', applyResult);
            if (callback) callback(applyResult);
        });
    }

    /**
     * Apply interactive changes
     */
    function applyInteractive(callback) {
        console.log('Applying interactive changes');

        moduleState.isInteractive = false;
        moduleState.savedSelection = null;

        if (callback) callback({ success: true });
    }

    /**
     * Cancel interactive mode and restore
     */
    function cancelInteractive(callback) {
        console.log('Cancelling interactive mode - restoring original keyframes');

        if (!moduleState.savedSelection) {
            moduleState.isInteractive = false;
            if (callback) callback({ success: true });
            return;
        }

        // Restore from saved keyframe data
        callJSXFunction('restoreKeyframesFromData', [moduleState.savedSelection], function (result) {
            console.log('Restore result:', result);
            moduleState.isInteractive = false;
            moduleState.savedSelection = null;
            if (callback) callback(result);
        });
    }

    /**
     * Call a JSX function
     */
    function callJSXFunction(functionName, args, callback) {
        csInterface.evalScript(`loadModuleScript('timeOffset')`, function (loaded) {
            if (loaded === 'true') {
                const argsJSON = JSON.stringify(args);
                csInterface.evalScript(
                    `callModuleFunction('timeOffset', '${functionName}', ${argsJSON})`,
                    function (result) {
                        try {
                            const parsed = JSON.parse(result);

                            // Check if result.result is a string (double-encoded)
                            if (parsed.result && typeof parsed.result === 'string') {
                                try {
                                    const innerParsed = JSON.parse(parsed.result);
                                    callback(innerParsed);
                                } catch (e) {
                                    callback(parsed);
                                }
                            } else {
                                callback(parsed);
                            }
                        } catch (e) {
                            callback({ error: 'Failed to parse JSX response: ' + e.message });
                        }
                    }
                );
            } else {
                callback({ error: 'Failed to load JSX module' });
            }
        });
    }

    /**
     * Save state to localStorage
     */
    function saveState() {
        const stateToSave = Object.assign({}, moduleState);
        delete stateToSave.savedSelection;
        delete stateToSave.isInteractive;
        localStorage.setItem('timeOffset_state', JSON.stringify(stateToSave));
    }

    /**
     * Load state from localStorage
     */
    function loadState() {
        const saved = localStorage.getItem('timeOffset_state');
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                Object.assign(moduleState, loaded);
                moduleState.isInteractive = false;
                moduleState.savedSelection = null;
            } catch (e) {
                console.error('Failed to load state:', e);
            }
        }
    }

    /**
     * Get current state
     */
    function getState() {
        return moduleState;
    }

    /**
     * Update state
     */
    function updateState(newState) {
        Object.assign(moduleState, newState);
        saveState();
    }

    /**
     * Cleanup
     */
    function cleanup() {
        if (moduleState.isInteractive) {
            cancelInteractive(function () { });
        }
        saveState();
    }

    return {
        init: init,
        applyOffset: applyOffset,
        startInteractive: startInteractive,
        updateInteractive: updateInteractive,
        applyInteractive: applyInteractive,
        cancelInteractive: cancelInteractive,
        getState: getState,
        updateState: updateState,
        cleanup: cleanup
    };
})();