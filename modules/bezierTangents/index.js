/**
 * Animation Tangent Module Entry Point
 */
var bezierTangents = (function () {
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
        loadScript('modules/bezierTangents/js/cubic-bezier.js', function () {
            loadScript('modules/bezierTangents/js/bezierTangents.js', function () {
                loadScript('modules/bezierTangents/js/bezierTangentsUI.js', function () {
                    // Initialize UI when all scripts are loaded
                    if (typeof BezierTangentsUI !== 'undefined') {
                        BezierTangentsUI.init(csInterface);
                        isInitialized = true;
                    }
                });
            });
        });
    }

    /**
     * Cleanup the module
     */
    function cleanup() {
        // Cleanup UI if it has a cleanup method
        if (typeof BezierTangentsUI !== 'undefined' && typeof BezierTangentsUI.cleanup === 'function') {
            BezierTangentsUI.cleanup();
        }

        // Remove all dynamically loaded scripts
        loadedScripts.forEach(script => {
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        });
        loadedScripts = [];

        // Clear global references
        if (typeof BezierTangentsUI !== 'undefined') {
            delete window.BezierTangentsUI;
        }
        if (typeof CubicBezier !== 'undefined') {
            delete window.CubicBezier;
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