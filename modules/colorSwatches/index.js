/**
 * Color Swatches Module Entry Point
 */
var colorSwatches = (function () {
    let csInterface;

    /**
     * Initialize the module
     */
    function init(cs) {
        csInterface = cs;

        // Load the module's JavaScript files
        loadScript('modules/colorSwatches/js/colorSwatches.js', function () {
            loadScript('modules/colorSwatches/js/colorSwatchesUI.js', function () {
                // Initialize UI when all scripts are loaded
                ColorSwatches.init(csInterface);
                ColorSwatchesUI.init(csInterface);
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
