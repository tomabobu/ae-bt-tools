/**
 * Module configuration
 * Key: Module folder name
 * Value: Display name for the tab
 */
const ModuleConfig = {
    "bezierTangents": "Animation Tangent",
    "colorSwatches": "Colors Library",
    "guideGenerator": "Guides"
};

/**
 * Module loader
 */
const ModuleLoader = {
    loadedModules: {},
    loadedScripts: {}, // Track loaded script elements
    loadedStyles: {},  // Track loaded style elements

    /**
     * Load a single module on-demand
     */
    loadModule: function (moduleId, csInterface) {
        // If already loaded, just return resolved promise
        if (this.loadedModules[moduleId]) {
            return Promise.resolve(moduleId);
        }

        return new Promise((resolve, reject) => {
            // Load CSS
            this.loadModuleCSS(moduleId);

            // Load JS
            const script = document.createElement('script');
            script.src = `modules/${moduleId}/index.js`;
            script.onload = () => {
                if (window[moduleId] && typeof window[moduleId].init === 'function') {
                    this.loadedModules[moduleId] = window[moduleId];
                    this.loadedScripts[moduleId] = script;
                    window[moduleId].init(csInterface);
                    resolve(moduleId);
                } else {
                    console.warn(`Module ${moduleId} does not have an init function`);
                    resolve(moduleId);
                }
            };
            script.onerror = () => {
                reject(new Error(`Failed to load module: ${moduleId}`));
            };
            document.head.appendChild(script);
        });
    },

    /**
     * Unload a module and clean up resources
     */
    unloadModule: function (moduleId) {
        const module = this.loadedModules[moduleId];

        // Call cleanup function if module has one
        if (module && typeof module.cleanup === 'function') {
            module.cleanup();
        }

        // Remove script element
        if (this.loadedScripts[moduleId]) {
            this.loadedScripts[moduleId].remove();
            delete this.loadedScripts[moduleId];
        }

        // Remove style element
        if (this.loadedStyles[moduleId]) {
            this.loadedStyles[moduleId].remove();
            delete this.loadedStyles[moduleId];
        }

        // Clear module from window
        if (window[moduleId]) {
            delete window[moduleId];
        }

        // Clear DOM content
        const tabPane = document.getElementById(moduleId);
        if (tabPane) {
            tabPane.innerHTML = '';
        }

        delete this.loadedModules[moduleId];
    },

    /**
     * Load CSS files for a module
     */
    loadModuleCSS: function (moduleId) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `modules/${moduleId}/css/${moduleId}.css`;
        document.head.appendChild(link);
        this.loadedStyles[moduleId] = link;
    },

    /**
     * Get a loaded module by ID
     */
    getModule: function (moduleId) {
        return this.loadedModules[moduleId];
    }
};

// Verify the config loaded
// console.log('ModuleConfig loaded:', ModuleConfig);
// console.log('ModuleLoader loaded:', ModuleLoader);