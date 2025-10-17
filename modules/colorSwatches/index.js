/**
 * Color Swatches Module Entry Point
 * Updated to support multi-module tabs with render/cleanup methods
 */
var colorSwatches = (function () {
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
            console.log('ColorSwatches already initialized');
            return;
        }

        console.log('Initializing ColorSwatches module...');
        csInterface = cs;

        // Load the module's JavaScript files
        loadScript('modules/colorSwatches/js/colorSwatches.js', function () {
            loadScript('modules/colorSwatches/js/colorSwatchesUI.js', function () {
                // Initialize core module with the CSInterface instance
                if (typeof ColorSwatches !== 'undefined') {
                    ColorSwatches.init(csInterface);
                }

                isInitialized = true;
                console.log('ColorSwatches module initialized');
            });
        });
    }

    /**
     * Render the module into a container
     * This is called when the module needs to be displayed
     */
    function render(container) {
        if (!container) {
            console.error('ColorSwatches render: No container provided');
            return;
        }

        console.log('Rendering ColorSwatches module...');

        // Clear any existing content first
        container.innerHTML = '';
        currentContainer = container;

        // Create the module's UI container
        const modulePane = document.createElement('div');
        modulePane.id = 'colorSwatches';
        modulePane.className = 'module-content';
        container.appendChild(modulePane);

        // Wait for initialization if needed
        if (!isInitialized) {
            console.log('ColorSwatches not yet initialized, waiting...');
            const checkInterval = setInterval(() => {
                if (isInitialized && typeof ColorSwatchesUI !== 'undefined') {
                    console.log("interval color swatches")
                    clearInterval(checkInterval);
                    initializeUI(modulePane);
                }
            }, 50);

            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!isInitialized) {
                    console.error('ColorSwatches initialization timeout');
                    modulePane.innerHTML = `
                        <div style="padding: 20px; color: #ff6b6b; text-align: center;">
                            <h3>Colors Library</h3>
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
        if (typeof ColorSwatchesUI !== 'undefined' && ColorSwatchesUI.init) {
            // If UI has already been initialized before, render instead
            if (typeof ColorSwatchesUI.render === 'function') {
                console.log("rener color swatches");
                ColorSwatchesUI.render(modulePane);
            } else {
                console.log("rener color init")
                ColorSwatchesUI.init(csInterface, modulePane);
            }
        } else {
            console.warn('ColorSwatchesUI not available');
            modulePane.innerHTML = `
                <div style="padding: 20px; color: #a0a0a0; text-align: center;">
                    <h3>Colors Library</h3>
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
            console.error('ColorSwatches cleanup: No container provided');
            return;
        }

        console.log('Cleaning up ColorSwatches UI...');

        // Cleanup UI if it has a cleanup method
        if (typeof ColorSwatchesUI !== 'undefined' && typeof ColorSwatchesUI.cleanup === 'function') {
            ColorSwatchesUI.cleanup();
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
        console.log('Completely unloading ColorSwatches module...');

        // Cleanup UI
        if (currentContainer) {
            cleanup(currentContainer);
        }

        // Cleanup core module if it has a cleanup method
        if (typeof ColorSwatches !== 'undefined' && typeof ColorSwatches.cleanup === 'function') {
            ColorSwatches.cleanup();
        }

        // Remove all dynamically loaded scripts
        loadedScripts.forEach(script => {
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        });
        loadedScripts = [];

        // Clear global references
        if (typeof ColorSwatches !== 'undefined') {
            delete window.ColorSwatches;
        }
        if (typeof ColorSwatchesUI !== 'undefined') {
            delete window.ColorSwatchesUI;
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