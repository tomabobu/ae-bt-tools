/**
 * Animation Tangent Module Entry Point
 */
var bezierTangents = (function () {
    let csInterface;

    /**
     * Initialize the module
     */
    function init(cs) {
        csInterface = cs;

        // Load the module's JavaScript files
        loadScript('modules/bezierTangents/js/cubic-bezier.js', function () {
            loadScript('modules/bezierTangents/js/bezierTangents.js', function () {
                loadScript('modules/bezierTangents/js/bezierTangentsUI.js', function () {
                    // Initialize UI when all scripts are loaded
                    BezierTangentsUI.init(csInterface);
                });
            });
        });
    }

    /**
     * Load a script dynamically
     */
    function loadScript(url, callback) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        script.onerror = function () {
            console.error('Error loading script:', url);
        };
        document.head.appendChild(script);
    }

    // Public API
    return {
        init: init
    };
})();
