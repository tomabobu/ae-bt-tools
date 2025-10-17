/**
 * Host script that loads and executes scripts for specific modules
 * Uses g_extensionPath global variable set from the HTML/JavaScript side
 */

// Map to store loaded jsx scripts
var loadedScripts = {};

/**
 * Check if an object exists and has functions
 * @param {Object} obj - The object to check
 * @return {Boolean} - True if the object exists and has at least one function
 */
function objectHasFunctions(obj) {
    if (obj === null || typeof obj !== 'object') {
        return false;
    }

    for (var prop in obj) {
        if (typeof obj[prop] === 'function') {
            return true;
        }
    }

    return false;
}

/**
 * Loads and evaluates a JSX file
 * @param {string} moduleName - The name of the module
 * @return {boolean} - Whether the load was successful
 */
function loadModuleScript(moduleName) {
    if (loadedScripts[moduleName]) {
        return true;
    }

    try {
        // Use the global extension path that was set from JavaScript
        if (typeof g_extensionPath === 'undefined') {
            throw new Error("Extension path not defined. Make sure it's passed from the HTML side.");
        }

        // Construct path to the module's JSX file
        var scriptPath = g_extensionPath + "/modules/" + moduleName + "/jsx/" + moduleName + ".jsx";

        // Create a file object to check if the file exists
        var scriptFile = new File(scriptPath);
        if (!scriptFile.exists) {
            throw new Error("Module script file not found at path: " + scriptPath);
        }

        // Create a global object for this module if it doesn't exist
        if (typeof this[moduleName] === 'undefined') {
            this[moduleName] = {};
        }

        // Evaluate the file
        $.evalFile(scriptFile);

        // Verify that the module has been loaded properly
        if (typeof this[moduleName] !== 'object') {
            throw new Error("Module object not found: " + moduleName);
        }

        // Check if the module has any functions
        if (!objectHasFunctions(this[moduleName])) {
            throw new Error("Module did not export any functions. Check if the module script creates a global object named: " + moduleName);
        }

        loadedScripts[moduleName] = true;
        return true;
    } catch (e) {
        alert('Error loading module script: ' + moduleName + '\n' + e.toString());
        return false;
    }
}

/**
 * Executes a function in a module with proper serialization
 * @param {string} moduleName - The name of the module
 * @param {string} functionName - The function to call
 * @param {Array} args - Arguments to pass to the function
 * @return {string} - JSON stringified result of the function call
 */
function callModuleFunction(moduleName, functionName, args) {
    if (!loadedScripts[moduleName]) {
        if (!loadModuleScript(moduleName)) {
            return JSON.stringify({
                error: 'Failed to load module script: ' + moduleName
            });
        }
    }

    try {
        // Parse args if they are provided as a JSON string
        if (typeof args === 'string') {
            try {
                args = JSON.parse(args);
            } catch (e) {
                // If not valid JSON, keep as is
            }
        }

        // Ensure args is an array
        if (!args || !(args instanceof Array)) {
            args = [];
        }

        // Check if the function exists on the module object
        if (typeof this[moduleName] === 'object' && typeof this[moduleName][functionName] === 'function') {
            var result = this[moduleName][functionName].apply(this[moduleName], args);

            // Return the result as a JSON string
            return JSON.stringify({
                result: result
            });
        } else {
            // Debug what functions are available
            var availableFunctions = [];
            if (typeof this[moduleName] === 'object') {
                for (var prop in this[moduleName]) {
                    if (typeof this[moduleName][prop] === 'function') {
                        availableFunctions.push(prop);
                    }
                }
            }
            return JSON.stringify({
                error: 'Function ' + functionName + ' not found in module ' + moduleName,
                availableFunctions: availableFunctions
            });
        }
    } catch (e) {
        return JSON.stringify({
            error: 'Error calling ' + moduleName + '.' + functionName + ': ' + e.toString()
        });
    }
}


/**
 * Gets information about the host environment
 * @return {Object} - Information about the environment
 */
function getEnvironmentInfo() {
    var loadedModuleNames = [];
    for (var key in loadedScripts) {
        if (loadedScripts.hasOwnProperty(key) && loadedScripts[key]) {
            loadedModuleNames.push(key);
        }
    }

    return {
        result: {
            os: $.os,
            version: app.version,
            extensionPath: g_extensionPath || "Not set",
            scriptPath: $.fileName,
            loadedModules: loadedModuleNames,
            guideGeneratorExists: (typeof this.guideGenerator === 'object'),
            bezierTangentsExists: (typeof this.bezierTangents === 'object')
        }
    };
}

/**
 * Simple test function to verify JSX execution is working
 * @return {string} - Test message
 */
function testConnection() {
    return JSON.stringify({
        result: "JSX connection working. Extension path: " + (g_extensionPath || "Not set")
    });
}

/**
 * Unload a module script from memory
 */
function unloadModuleScript(moduleName) {
    if (loadedScripts[moduleName]) {
        // Clear the module object
        if (typeof this[moduleName] === 'object') {
            delete this[moduleName];
        }
        delete loadedScripts[moduleName];
        return true;
    }
    return false;
}