/**
 * Guide Generator Module Entry Point
 */
var guideGenerator = (function () {
    let csInterface;

    /**
     * Initialize the module
     */
    function init(cs) {
        csInterface = cs;

        // Load the module's JavaScript files
        loadScript('modules/guideGenerator/js/guideGenerator.js', function () {
            loadScript('modules/guideGenerator/js/guideGeneratorUI.js', function () {
                // Initialize modules with the CSInterface instance
                GuideGenerator.init(csInterface); // Initialize the core module
                GuideGeneratorUI.init(csInterface); // Initialize the UI module
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
