var GuideGenerator = (function () {
    // Private variables
    var originalGuides = [];
    var originalGuidesStored = false;
    var bbox = null;
    var csInterface = null;

    /**
     * Initialize the module with CSInterface
     */
    function init(cs) {
        csInterface = cs;
    }

    /**
     * Store existing guides in After Effects
     */
    function storeExistingGuides(callback) {
        if (!csInterface) {
            console.error('CSInterface not initialized');
            callback(false);
            return;
        }

        if (originalGuidesStored) {
            callback(true);
            return;
        }

        console.log("Run store existing guides");

        csInterface.evalScript('callModuleFunction("guideGenerator", "storeExistingGuides", [])', function (result) {
            try {
                const response = JSON.parse(result);
                if (response.error) {
                    console.error('Error:', response.error);
                    callback(false);
                    return;
                }

                originalGuidesStored = true;
                originalGuides = response.result || [];
                console.log("Stored original guides:", originalGuides);
                callback(true);
            } catch (e) {
                console.error('Error parsing response:', e);
                callback(false);
            }
        });
    }



    /**
     * Get the bounding box of selected layers in After Effects
     */
    function getSelectedBoundingBox(callback) {
        if (!csInterface) {
            console.error('CSInterface not initialized');
            callback(null);
            return;
        }

        csInterface.evalScript('callModuleFunction("guideGenerator", "getSelectedBoundingBox", [])', function (result) {
            try {
                const response = JSON.parse(result);

                if (response.error) {
                    console.error('Error:', response.error);
                    callback(null);
                    return;
                }

                if (response.result) {
                    bbox = response.result;
                    callback(bbox);
                } else {
                    callback(null);
                }
            } catch (e) {
                console.error('Error parsing response:', e);
                callback(null);
            }
        });
    }

    /**
     * Draw guides based on configuration
     * This will:
     * 1. Restore the original guides
     * 2. Add new guides based on configuration
     */
    function drawGuides(config, callback) {
        if (!csInterface) {
            console.error('CSInterface not initialized');
            callback(false);
            return;
        }

        // Add the bbox to the config
        config.bbox = config.bbox || bbox;

        // Convert config to JSON string to safely pass to ExtendScript
        const configJson = JSON.stringify(config);

        // We'll first restore original guides, then draw new guides
        csInterface.evalScript('callModuleFunction("guideGenerator", "restoreOriginalGuides", [])', function (restoreResult) {
            try {
                // Now draw the new guides on top of the restored guides
                const evalScriptCmd = 'callModuleFunction("guideGenerator", "drawGuides", [' + JSON.stringify(configJson) + '])';

                csInterface.evalScript(evalScriptCmd, function (drawResult) {
                    try {
                        const response = JSON.parse(drawResult);
                        if (response.error) {
                            console.error('Error drawing guides:', response.error);
                            callback(false);
                            return;
                        }

                        callback(true);
                    } catch (e) {
                        console.error('Error parsing drawGuides response:', e);
                        callback(false);
                    }
                });
            } catch (e) {
                console.error('Error in guide drawing process:', e);
                callback(false);
            }
        });
    }

    /**
     * Reset everything to initial state and restore original guides
     */
    function reset(callback) {
        if (!csInterface) {
            console.error('CSInterface not initialized');
            callback(false);
            return;
        }

        // Restore original guides
        csInterface.evalScript('callModuleFunction("guideGenerator", "restoreOriginalGuides", [])', function (result) {
            try {
                // Reset internal state
                originalGuidesStored = false;
                originalGuides = [];
                bbox = null;
                callback(true);

            } catch (e) {
                console.error('Error resetting guide generator:', e);
                callback(false);
            }
        });
    }

    /**
     * Accept the current guide configuration (similar to reset but don't restore guides)
     */
    function accept(callback) {
        if (!csInterface) {
            console.error('CSInterface not initialized');
            callback(false);
            return;
        }


        // Reset internal state without changing guides
        originalGuidesStored = false;
        originalGuides = [];
        bbox = null;
        callback(true);
    }

    // Public API
    return {
        init: init,
        getSelectedBoundingBox: getSelectedBoundingBox,
        storeExistingGuides: storeExistingGuides,
        drawGuides: drawGuides,
        reset: reset,
        accept: accept,

        // Accessor for the current bounding box
        getBbox: function () {
            return bbox;
        },

        // Update bounding box properties
        updateBbox: function (property, value) {
            if (bbox && typeof property === 'string' && typeof value === 'number') {
                // If updating width or height, maintain center position
                if (property === 'width') {
                    const centerX = bbox.left + bbox.width / 2;
                    bbox.width = value;
                    bbox.left = centerX - value / 2;
                } else if (property === 'height') {
                    const centerY = bbox.top + bbox.height / 2;
                    bbox.height = value;
                    bbox.top = centerY - value / 2;
                } else {
                    bbox[property] = value;
                }
            }
        }
    };
})();
