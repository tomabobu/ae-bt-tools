/**
 * Module configuration
 * Key: Module folder name
 * Value: Display name for the tab
 */
const ModuleConfig = {
    "colorSwatches": "Colors Library",
    "guideGenerator": "Guides",
    "bezierTangents": "Animation Tangent",
};

/**
 * Module loader
 */
const ModuleLoader = {
    loadedModules: {},

    /**
     * Dynamically load all modules specified in the config
     */
    loadModules: function (csInterface) {
        const modulePromises = [];

        // Loop through each module in the config
        Object.keys(ModuleConfig).forEach(moduleId => {
            const promise = this.loadModule(moduleId, csInterface);
            modulePromises.push(promise);
        });

        return Promise.all(modulePromises);
    },

    /**
     * Load a single module
     */
    loadModule: function (moduleId, csInterface) {
        return new Promise((resolve, reject) => {
            // First, load the CSS for the module
            this.loadModuleCSS(moduleId);

            // Then load the main module script
            const script = document.createElement('script');
            script.src = `modules/${moduleId}/index.js`;
            script.onload = () => {
                // Once loaded, initialize the module if it exports an init function
                if (window[moduleId] && typeof window[moduleId].init === 'function') {
                    this.loadedModules[moduleId] = window[moduleId];
                    window[moduleId].init(csInterface);
                    resolve(moduleId);
                } else {
                    console.warn(`Module ${moduleId} does not have an init function`);
                    resolve(moduleId);
                }
            };
            script.onerror = () => {
                console.error(`Failed to load module: ${moduleId}`);
                reject(new Error(`Failed to load module: ${moduleId}`));
            };

            document.head.appendChild(script);
        });
    },

    /**
     * Load CSS files for a module
     */
    loadModuleCSS: function (moduleId) {
        // Check if the module has a CSS directory
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `modules/${moduleId}/css/${moduleId}.css`;
        document.head.appendChild(link);
    },

    /**
     * Get a loaded module by ID
     */
    getModule: function (moduleId) {
        return this.loadedModules[moduleId];
    }
};
