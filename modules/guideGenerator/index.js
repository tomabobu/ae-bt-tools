/**
 * Guide Generator Module Entry Point
 */
var guideGenerator = (function () {
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
        loadScript('modules/guideGenerator/js/guideGenerator.js', function () {
            loadScript('modules/guideGenerator/js/guideGeneratorUI.js', function () {
                // Initialize modules with the CSInterface instance
                if (typeof GuideGenerator !== 'undefined') {
                    GuideGenerator.init(csInterface);
                }
                if (typeof GuideGeneratorUI !== 'undefined') {
                    GuideGeneratorUI.init(csInterface);
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
        if (typeof GuideGeneratorUI !== 'undefined' && typeof GuideGeneratorUI.cleanup === 'function') {
            GuideGeneratorUI.cleanup();
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