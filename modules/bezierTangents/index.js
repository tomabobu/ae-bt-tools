/**
 * Animation Tangent Module Entry Point
 * Updated to support multi-module tabs with render/cleanup methods
 */
var bezierTangents = (function () {
    let csInterface;
    let currentContainer = null;

    /**
     * Initialize the module
     */
    function init(cs) {
        csInterface = cs;

        // Load the module's JavaScript files
        loadScript('modules/bezierTangents/js/cubic-bezier.js', function () {
            loadScript('modules/bezierTangents/js/bezierTangents.js', function () {
                loadScript('modules/bezierTangents/js/bezierTangentsUI.js', function () {
                    console.log('BezierTangents module loaded');
                });
            });
        });
    }

    /**
     * Render the module into a container
     * This method is called when the module needs to be displayed
     */
    function render(container) {
        if (!container) return;

        container.innerHTML = '';
        currentContainer = container;

        // Create the module's UI container
        const modulePane = document.createElement('div');
        modulePane.id = 'bezierTangents';
        modulePane.className = 'module-content';
        container.appendChild(modulePane);

        // Initialize the module's UI
        if (typeof BezierTangentsUI !== 'undefined' && BezierTangentsUI.init) {
            BezierTangentsUI.init(csInterface, modulePane);
        } else {
            // If UI not loaded yet, wait and retry
            setTimeout(() => {
                if (typeof BezierTangentsUI !== 'undefined' && BezierTangentsUI.init) {
                    BezierTangentsUI.init(csInterface, modulePane);
                }
            }, 100);
        }
    }

    /**
     * Cleanup the module from a container
     * This method is called when switching away from a tab
     */
    function cleanup(container) {
        if (!container) return;

        // Clean up any event listeners or timers
        if (typeof BezierTangentsUI !== 'undefined' && BezierTangentsUI.cleanup) {
            BezierTangentsUI.cleanup();
        }

        // Clear the container
        container.innerHTML = '';
        currentContainer = null;
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
        init: init,
        render: render,
        cleanup: cleanup
    };
})();