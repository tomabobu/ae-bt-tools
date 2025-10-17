/**
 * Guide Generator Module Entry Point
 * Updated to support multi-module tabs with render/cleanup methods
 */
var guideGenerator = (function () {
    let csInterface;
    let loadedScripts = [];
    let isInitialized = false;
    let currentContainer = null;

    /**
     * Initialize the module
     * This is called once when the module is first loaded
     */
    function init(cs) {
        if (isInitialized) {
            console.log('GuideGenerator already initialized');
            return;
        }

        console.log('Initializing GuideGenerator module...');
        csInterface = cs;

        // Load the module's JavaScript files
        loadScript('modules/guideGenerator/js/guideGenerator.js', function () {
            loadScript('modules/guideGenerator/js/guideGeneratorUI.js', function () {
                // Initialize core module with the CSInterface instance
                if (typeof GuideGenerator !== 'undefined') {
                    GuideGenerator.init(csInterface);
                }

                isInitialized = true;
                console.log('GuideGenerator module initialized');
            });
        });
    }

    /**
     * Render the module into a container
     * This is called when the module needs to be displayed
     */
    function render(container) {
        if (!container) {
            console.error('GuideGenerator render: No container provided');
            return;
        }

        console.log('Rendering GuideGenerator module...');
        container.innerHTML = '';
        currentContainer = container;

        // Create the module's UI container
        const modulePane = document.createElement('div');
        modulePane.id = 'guideGenerator';
        modulePane.className = 'module-content';
        container.appendChild(modulePane);

        // Wait for initialization if needed
        if (!isInitialized) {
            console.log('GuideGenerator not yet initialized, waiting...');
            const checkInterval = setInterval(() => {
                if (isInitialized && typeof GuideGeneratorUI !== 'undefined') {
                    clearInterval(checkInterval);
                    initializeUI(modulePane);
                }
            }, 50);

            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!isInitialized) {
                    console.error('GuideGenerator initialization timeout');
                    modulePane.innerHTML = `
                        <div style="padding: 20px; color: #ff6b6b; text-align: center;">
                            <h3>Guide Generator</h3>
                            <p>Failed to load module</p>
                        </div>
                    `;
                }
            }, 5000);
        } else {
            // Module already initialized, render immediately
            initializeUI(modulePane);
        }
    }

    /**
     * Initialize the UI
     */
    function initializeUI(modulePane) {
        if (typeof GuideGeneratorUI !== 'undefined' && GuideGeneratorUI.init) {
            // If UI has already been initialized before, render instead
            if (typeof GuideGeneratorUI.render === 'function') {
                GuideGeneratorUI.render(modulePane);
            } else {
                GuideGeneratorUI.init(csInterface, modulePane);
            }
        } else {
            console.warn('GuideGeneratorUI not available');
            modulePane.innerHTML = `
                <div style="padding: 20px; color: #a0a0a0; text-align: center;">
                    <h3>Guide Generator</h3>
                    <p>UI not available</p>
                </div>
            `;
        }
    }

    /**
     * Cleanup the module from a container
     * This is called when switching away from a tab
     * Note: This only cleans up the UI, not the module code
     */
    function cleanup(container) {
        if (!container) {
            console.error('GuideGenerator cleanup: No container provided');
            return;
        }

        console.log('Cleaning up GuideGenerator UI...');

        // Cleanup UI if it has a cleanup method
        if (typeof GuideGeneratorUI !== 'undefined' && typeof GuideGeneratorUI.cleanup === 'function') {
            GuideGeneratorUI.cleanup();
        }

        // Clear the container
        container.innerHTML = '';
        currentContainer = null;
    }

    /**
     * Complete module unload (called when truly unloading the module)
     * This is more aggressive than cleanup() and removes everything
     */
    function unload() {
        console.log('Completely unloading GuideGenerator module...');

        // Cleanup UI
        if (currentContainer) {
            cleanup(currentContainer);
        }

        // Cleanup core module if it has a cleanup method
        if (typeof GuideGenerator !== 'undefined' && typeof GuideGenerator.cleanup === 'function') {
            GuideGenerator.cleanup();
        }

        // Remove all dynamically loaded scripts
        loadedScripts.forEach(script => {
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        });
        loadedScripts = [];

        // Clear global references
        if (typeof GuideGenerator !== 'undefined') {
            delete window.GuideGenerator;
        }
        if (typeof GuideGeneratorUI !== 'undefined') {
            delete window.GuideGeneratorUI;
        }

        // Clear references
        csInterface = null;
        isInitialized = false;
        currentContainer = null;
    }

    /**
     * Load a script dynamically and track it for cleanup
     */
    function loadScript(url, callback) {
        // Check if script is already loaded
        const existingScript = loadedScripts.find(s => s.src && s.src.includes(url));
        if (existingScript) {
            console.log('Script already loaded:', url);
            if (callback) callback();
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            console.log('Script loaded:', url);
            if (callback) callback();
        };
        script.onerror = function () {
            console.error('Error loading script:', url);
        };
        document.head.appendChild(script);
        loadedScripts.push(script);
    }

    // Public API
    return {
        init: init,
        render: render,
        cleanup: cleanup,
        unload: unload  // Optional: for complete module removal
    };
})();