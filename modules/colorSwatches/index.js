/**
 * Color Swatches Module Entry Point
 */
var colorSwatches = (function () {
    let csInterface;
    let loadedScripts = [];
    let isInitialized = false;

    /**
     * Initialize the module
     */
    function init(cs) {
        if (isInitialized) {
            return;
        }

        csInterface = cs;

        // Load the module's JavaScript files
        loadScript('modules/colorSwatches/js/colorSwatches.js', function () {
            loadScript('modules/colorSwatches/js/colorSwatchesUI.js', function () {
                // Initialize when all scripts are loaded
                if (typeof ColorSwatches !== 'undefined') {
                    ColorSwatches.init(csInterface);
                }
                if (typeof ColorSwatchesUI !== 'undefined') {
                    ColorSwatchesUI.init(csInterface);
                }
                isInitialized = true;
            });
        });
    }

    /**
     * Cleanup the module
     */
    function cleanup() {
        // Cleanup UI if it has a cleanup method
        if (typeof ColorSwatchesUI !== 'undefined' && typeof ColorSwatchesUI.cleanup === 'function') {
            ColorSwatchesUI.cleanup();
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
    }

    /**
     * Load a script dynamically and track it for cleanup
     */
    function loadScript(url, callback) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        script.onerror = function () {
            console.error('Error loading script:', url);
        };
        document.head.appendChild(script);
        loadedScripts.push(script);
    }

    // Public API
    return {
        init: init,
        cleanup: cleanup
    };
})();