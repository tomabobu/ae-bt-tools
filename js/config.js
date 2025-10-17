/**
 * Module Configuration and Loader
 * Handles lazy loading of modules on demand
 */

/**
 * Module configuration
 * Key: Module folder name (must match folder in /modules/)
 * Value: Display name for the module in tabs
 */
const ModuleConfig = {
    "bezierTangents": "Animation Tangent",
    "timeOffset": "Time Offset",
    "colorSwatches": "Colors Library",
    "guideGenerator": "Guides",
};

/**
 * Module Loader
 * Handles dynamic lazy loading of modules
 */
const ModuleLoader = {
    loadedModules: {},
    loadingModules: {},
    csInterface: null,

    /**
     * Initialize the module loader
     * @param {CSInterface} csInterface - The CSInterface instance
     */
    init: function (csInterface) {
        this.csInterface = csInterface;
        console.log('ModuleLoader initialized');
    },

    /**
     * Load a single module (lazy loading)
     * @param {string} moduleId - The module ID (folder name)
     * @returns {Promise} - Resolves when the module is loaded
     */
    loadModule: function (moduleId) {
        // Return existing module if already loaded
        if (this.loadedModules[moduleId]) {
            console.log(`Module ${moduleId} already loaded`);
            return Promise.resolve(this.loadedModules[moduleId]);
        }

        // Return existing promise if currently loading
        if (this.loadingModules[moduleId]) {
            console.log(`Module ${moduleId} is currently loading`);
            return this.loadingModules[moduleId];
        }

        console.log(`Loading module: ${moduleId}`);

        // Create loading promise
        const loadPromise = new Promise((resolve, reject) => {
            // First, load the CSS for the module
            this.loadModuleCSS(moduleId);

            // Then load the main module script (index.js)
            const script = document.createElement('script');
            script.src = `modules/${moduleId}/index.js`;

            script.onload = () => {
                console.log(`Module script loaded: ${moduleId}`);

                // Once loaded, initialize the module if it exports an init function
                if (window[moduleId] && typeof window[moduleId].init === 'function') {
                    this.loadedModules[moduleId] = window[moduleId];

                    // Call the module's init function
                    if (this.csInterface) {
                        window[moduleId].init(this.csInterface);
                    }

                    // Ensure the module has render and cleanup methods
                    this.ensureModuleMethods(moduleId);

                    console.log(`Module initialized: ${moduleId}`);
                    delete this.loadingModules[moduleId];
                    resolve(this.loadedModules[moduleId]);
                } else {
                    console.warn(`Module ${moduleId} does not have an init function`);

                    // Still add default methods even if init is missing
                    this.loadedModules[moduleId] = window[moduleId] || {};
                    this.ensureModuleMethods(moduleId);

                    delete this.loadingModules[moduleId];
                    resolve(this.loadedModules[moduleId]);
                }
            };

            script.onerror = () => {
                console.error(`Failed to load module: ${moduleId}`);
                delete this.loadingModules[moduleId];
                reject(new Error(`Failed to load module: ${moduleId}`));
            };

            document.head.appendChild(script);
        });

        // Store the loading promise
        this.loadingModules[moduleId] = loadPromise;
        return loadPromise;
    },

    /**
     * Unload a module and clean up its resources
     * @param {string} moduleId - The module ID
     */
    unloadModule: function (moduleId) {
        const module = this.loadedModules[moduleId];
        if (module) {
            console.log(`Unloading module: ${moduleId}`);

            // Call cleanup if available
            if (module.cleanup) {
                const container = document.getElementById(moduleId);
                if (container) {
                    module.cleanup(container);
                }
            }

            // Note: We keep the module in loadedModules for quick reloading
            // Just clean up the UI, don't remove the code
        }
    },

    /**
     * Ensure a module has the required render and cleanup methods
     * If they don't exist, add default implementations
     * @param {string} moduleId - The module ID
     */
    ensureModuleMethods: function (moduleId) {
        const module = this.loadedModules[moduleId];

        // Add default render method if it doesn't exist
        if (!module.render) {
            module.render = (container) => {
                console.log(`Rendering module: ${moduleId}`);

                // Create the module's content container
                const modulePane = document.createElement('div');
                modulePane.id = moduleId;
                modulePane.className = 'module-content';
                container.appendChild(modulePane);

                // If the module has a UI initialization function, call it
                // This supports different naming conventions modules might use
                if (module.initUI) {
                    module.initUI(modulePane);
                } else if (module.renderUI) {
                    module.renderUI(modulePane);
                } else if (module.loadUI) {
                    module.loadUI(modulePane);
                } else {
                    // Create a placeholder if no UI method exists
                    modulePane.innerHTML = `
                        <div style="padding: 20px; color: #a0a0a0; text-align: center;">
                            <h3>${ModuleConfig[moduleId]}</h3>
                            <p>Module loaded but no UI available</p>
                        </div>
                    `;
                }
            };
        }

        // Add default cleanup method if it doesn't exist
        if (!module.cleanup) {
            module.cleanup = (container) => {
                console.log(`Cleaning up module: ${moduleId}`);

                // Call module's cleanup method if it exists
                if (module.cleanupUI) {
                    module.cleanupUI();
                } else if (module.destroy) {
                    module.destroy();
                }

                // Clear the container
                if (container) {
                    container.innerHTML = '';
                }
            };
        }
    },

    /**
     * Load CSS files for a module
     * @param {string} moduleId - The module ID
     */
    loadModuleCSS: function (moduleId) {
        // Check if CSS is already loaded
        const existingLink = document.querySelector(`link[href*="${moduleId}.css"]`);
        if (existingLink) {
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `modules/${moduleId}/css/${moduleId}.css`;

        // Handle CSS load errors gracefully
        link.onerror = () => {
            console.warn(`CSS file not found for module: ${moduleId}`);
        };

        document.head.appendChild(link);
    },

    /**
     * Get a loaded module by ID
     * @param {string} moduleId - The module ID
     * @returns {Object|null} - The module object or null if not found
     */
    getModule: function (moduleId) {
        return this.loadedModules[moduleId] || null;
    },

    /**
     * Check if a module is loaded
     * @param {string} moduleId - The module ID
     * @returns {boolean} - True if the module is loaded
     */
    isModuleLoaded: function (moduleId) {
        return !!this.loadedModules[moduleId];
    },

    /**
     * Check if a module is currently loading
     * @param {string} moduleId - The module ID
     * @returns {boolean} - True if the module is loading
     */
    isModuleLoading: function (moduleId) {
        return !!this.loadingModules[moduleId];
    },

    /**
     * Get all loaded module IDs
     * @returns {Array<string>} - Array of loaded module IDs
     */
    getLoadedModuleIds: function () {
        return Object.keys(this.loadedModules);
    }
};