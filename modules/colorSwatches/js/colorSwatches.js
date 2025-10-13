/**
 * Color Swatches Core Logic
 */
var ColorSwatches = (function () {
    // Private variables
    var library = null;
    var csInterface = null;

    /**
     * Initialize the module with CSInterface
     */
    function init(cs) {
        csInterface = cs;
        loadLibraryFromModule();
    }

    /**
     * Get the extension path safely
     */
    function getExtensionPath(callback) {
        csInterface.evalScript('g_extensionPath', function (result) {
            if (result && result !== 'undefined') {
                callback(result);
            } else {
                callback(csInterface.getSystemPath(SystemPath.EXTENSION));
            }
        });
    }

    /**
     * Load library directly from the module assets folder
     */
    function loadLibraryFromModule(callback) {
        getExtensionPath(function (extensionPath) {
            var modulePath = extensionPath + '/modules/colorSwatches/assets/colorSwatches.json';

            var readScript = `
                (function() {
                    var file = new File("${modulePath.replace(/\\/g, '\\\\')}");
                    if (file.exists) {
                        file.open("r");
                        var content = file.read();
                        file.close();
                        return content;
                    } else {
                        return "FILE_NOT_FOUND";
                    }
                })();
            `;

            csInterface.evalScript(readScript, function (result) {
                if (result === "FILE_NOT_FOUND") {
                    console.log("File not found, creating default library");
                    library = getDefaultLibrary();
                    saveLibraryToModule();
                } else {
                    try {
                        library = JSON.parse(result);
                    } catch (e) {
                        console.error("Error parsing library JSON:", e);
                        library = getDefaultLibrary();
                        saveLibraryToModule();
                    }
                }

                if (callback) callback(library);
            });
        });
    }

    /**
     * Get the default library
     */
    function getDefaultLibrary() {
        return {
            groups: [{
                name: "Primary Colors",
                collapsed: false,
                swatches: [{
                    name: "Red",
                    hex: "#FF0000"
                },
                {
                    name: "Green",
                    hex: "#00FF00"
                },
                {
                    name: "Blue",
                    hex: "#0000FF"
                }]
            }]
        };
    }

    /**
     * Load library from current source
     */
    function loadLibrary(callback) {
        if (library) {
            if (callback) callback(library);
            return;
        }
        loadLibraryFromModule(callback);
    }

    /**
     * Save library to the module assets folder
     */
    function saveLibraryToModule(callback) {
        getExtensionPath(function (extensionPath) {
            var modulePath = extensionPath + '/modules/colorSwatches/assets/colorSwatches.json';
            var dirPath = modulePath.substring(0, modulePath.lastIndexOf('/'));

            var saveScript = `
                (function() {
                    var folder = new Folder("${dirPath.replace(/\\/g, '\\\\')}");
                    if (!folder.exists) {
                        folder.create();
                    }
                    
                    var file = new File("${modulePath.replace(/\\/g, '\\\\')}");
                    var success = false;
                    
                    try {
                        file.open("w");
                        file.write(${JSON.stringify(JSON.stringify(library, null, 2))});
                        file.close();
                        success = true;
                    } catch(e) {
                        success = false;
                    }
                    
                    return success;
                })();
            `;

            csInterface.evalScript(saveScript, function (result) {
                var success = (result === "true");
                if (callback) callback(success);
            });
        });
    }

    /**
     * Copy a hex value to clipboard
     */
    function copyToClipboard(text) {
        const tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
    }

    /**
     * Convert hex to RGB array (0-1)
     */
    function hexToRGBArray(hex) {
        var bigint = parseInt(hex.replace("#", ""), 16);
        return [
            ((bigint >> 16) & 255) / 255,
            ((bigint >> 8) & 255) / 255,
            (bigint & 255) / 255
        ];
    }

    /**
     * Import a library JSON file
     */
    function importLibrary(jsonData, replace, callback) {
        try {
            const imported = JSON.parse(jsonData);

            if (imported && imported.groups && imported.groups.length > 0) {
                if (replace) {
                    // When replacing, preserve UI settings from current library
                    const preservedSettings = {
                        swatchSize: library ? library.swatchSize : undefined,
                        hideCollapsedGroups: library ? library.hideCollapsedGroups : undefined,
                        hideGroupNames: library ? library.hideGroupNames : undefined
                    };

                    library = imported;

                    // Apply preserved settings
                    if (preservedSettings.swatchSize !== undefined) {
                        library.swatchSize = preservedSettings.swatchSize;
                    }
                    if (preservedSettings.hideCollapsedGroups !== undefined) {
                        library.hideCollapsedGroups = preservedSettings.hideCollapsedGroups;
                    }
                    if (preservedSettings.hideGroupNames !== undefined) {
                        library.hideGroupNames = preservedSettings.hideGroupNames;
                    }
                } else {
                    // Merge groups into existing library
                    for (var i = 0; i < imported.groups.length; i++) {
                        library.groups.push(imported.groups[i]);
                    }
                }

                saveLibraryToModule(callback);
            } else {
                if (callback) callback(false);
            }
        } catch (e) {
            console.error('Error importing library:', e);
            if (callback) callback(false);
        }
    }

    /**
     * Clear the library
     */
    function clearLibrary(callback) {
        library = { groups: [] };
        saveLibraryToModule(callback);
    }

    /**
     * Add a new group
     */
    function addGroup(groupName, callback) {
        if (library) {
            library.groups.push({
                name: groupName,
                collapsed: false,
                swatches: []
            });
            saveLibraryToModule(callback);
            return true;
        }
        if (callback) callback(false);
        return false;
    }

    /**
     * Rename a group
     */
    function renameGroup(groupIndex, newName, callback) {
        if (library && library.groups && library.groups[groupIndex]) {
            library.groups[groupIndex].name = newName;
            saveLibraryToModule(callback);
            return true;
        }
        if (callback) callback(false);
        return false;
    }

    /**
     * Delete a group
     */
    function deleteGroup(groupIndex, callback) {
        if (library && library.groups && library.groups[groupIndex]) {
            library.groups.splice(groupIndex, 1);
            saveLibraryToModule(callback);
            return true;
        }
        if (callback) callback(false);
        return false;
    }

    /**
     * Duplicate a group
     */
    function duplicateGroup(sourceIndex, targetIndex, callback) {
        if (library && library.groups && library.groups[sourceIndex]) {
            const duplicatedGroup = JSON.parse(JSON.stringify(library.groups[sourceIndex]));
            duplicatedGroup.name = duplicatedGroup.name + ' Copy';
            library.groups.splice(targetIndex, 0, duplicatedGroup);
            saveLibraryToModule(callback);
            return true;
        }
        if (callback) callback(false);
        return false;
    }

    /**
     * Move a group to a new position
     */
    function moveGroup(sourceIndex, targetIndex, callback) {
        if (library && library.groups && library.groups[sourceIndex] && sourceIndex !== targetIndex) {
            const group = library.groups.splice(sourceIndex, 1)[0];
            const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
            library.groups.splice(insertIndex, 0, group);
            saveLibraryToModule(callback);
            return true;
        }
        if (callback) callback(false);
        return false;
    }

    /**
     * Add a swatch to a group
     */
    function addSwatchToGroup(groupIndex, hex, callback) {
        if (library && library.groups && library.groups[groupIndex]) {
            library.groups[groupIndex].swatches.push({
                name: hex,
                hex: hex
            });
            saveLibraryToModule(callback);
            return true;
        }
        if (callback) callback(false);
        return false;
    }

    /**
     * Update a swatch
     */
    function updateSwatch(groupIndex, swatchIndex, newData, callback) {
        if (library &&
            library.groups &&
            library.groups[groupIndex] &&
            library.groups[groupIndex].swatches &&
            library.groups[groupIndex].swatches[swatchIndex]) {

            Object.assign(library.groups[groupIndex].swatches[swatchIndex], newData);
            saveLibraryToModule(callback);
            return true;
        }

        if (callback) callback(false);
        return false;
    }

    /**
     * Delete a swatch
     */
    function deleteSwatch(groupIndex, swatchIndex, callback) {
        if (library &&
            library.groups &&
            library.groups[groupIndex] &&
            library.groups[groupIndex].swatches &&
            library.groups[groupIndex].swatches[swatchIndex]) {

            library.groups[groupIndex].swatches.splice(swatchIndex, 1);
            saveLibraryToModule(callback);
            return true;
        }

        if (callback) callback(false);
        return false;
    }

    /**
     * Move a swatch within or between groups
     */
    function moveSwatch(sourceGroupIndex, sourceSwatchIndex, targetGroupIndex, targetSwatchIndex, callback) {
        if (library &&
            library.groups &&
            library.groups[sourceGroupIndex] &&
            library.groups[sourceGroupIndex].swatches &&
            library.groups[sourceGroupIndex].swatches[sourceSwatchIndex] &&
            library.groups[targetGroupIndex]) {

            const swatch = library.groups[sourceGroupIndex].swatches.splice(sourceSwatchIndex, 1)[0];

            // Adjust target index if moving within same group
            let insertIndex = targetSwatchIndex;
            if (sourceGroupIndex === targetGroupIndex && sourceSwatchIndex < targetSwatchIndex) {
                insertIndex = targetSwatchIndex - 1;
            }

            library.groups[targetGroupIndex].swatches.splice(insertIndex, 0, swatch);
            saveLibraryToModule(callback);
            return true;
        }

        if (callback) callback(false);
        return false;
    }

    /**
     * Duplicate a swatch within or to another group
     */
    function duplicateSwatch(sourceGroupIndex, sourceSwatchIndex, targetGroupIndex, targetSwatchIndex, callback) {
        if (library &&
            library.groups &&
            library.groups[sourceGroupIndex] &&
            library.groups[sourceGroupIndex].swatches &&
            library.groups[sourceGroupIndex].swatches[sourceSwatchIndex] &&
            library.groups[targetGroupIndex]) {

            const swatchCopy = JSON.parse(JSON.stringify(library.groups[sourceGroupIndex].swatches[sourceSwatchIndex]));
            library.groups[targetGroupIndex].swatches.splice(targetSwatchIndex, 0, swatchCopy);
            saveLibraryToModule(callback);
            return true;
        }

        if (callback) callback(false);
        return false;
    }

    /**
     * Toggle group collapse state
     */
    function toggleGroup(groupIndex, callback) {
        if (library && library.groups && library.groups[groupIndex]) {
            library.groups[groupIndex].collapsed = !library.groups[groupIndex].collapsed;
            saveLibraryToModule(callback);
            return true;
        }

        if (callback) callback(false);
        return false;
    }

    /**
     * Update a property in the library
     */
    function updateProp(newValue, propName, callback) {
        if (library) {
            library[propName] = newValue;
            saveLibraryToModule(callback);
            return true;
        }
        if (callback) callback(false);
        return false;
    }

    /**
     * Get the current library
     */
    function getLibrary() {
        return library || { groups: [] };
    }

    // Public API
    return {
        init: init,
        loadLibrary: loadLibrary,
        saveLibrary: saveLibraryToModule,
        getLibrary: getLibrary,
        copyToClipboard: copyToClipboard,
        hexToRGBArray: hexToRGBArray,
        importLibrary: importLibrary,
        clearLibrary: clearLibrary,
        addGroup: addGroup,
        renameGroup: renameGroup,
        deleteGroup: deleteGroup,
        duplicateGroup: duplicateGroup,
        moveGroup: moveGroup,
        addSwatchToGroup: addSwatchToGroup,
        updateSwatch: updateSwatch,
        deleteSwatch: deleteSwatch,
        moveSwatch: moveSwatch,
        duplicateSwatch: duplicateSwatch,
        toggleGroup: toggleGroup,
        updateProp: updateProp
    };
})();