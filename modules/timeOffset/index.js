/**
 * Time Offset Module - Entry Point
 * Offset/arrange selected layers or keyframes in time with curve-based distribution
 */
var timeOffset = (function () {
    let csInterface;
    let loadedScripts = [];
    let isInitialized = false;
    let currentContainer = null;

    /**
     * Initialize the module (called once on first load)
     */
    function init(cs) {
        if (isInitialized) {
            console.log('TimeOffset already initialized');
            return;
        }

        console.log('Initializing TimeOffset...');
        csInterface = cs;

        // Load dependencies in order
        loadScript('modules/timeOffset/js/cubic-bezier.js', function () {
            loadScript('modules/timeOffset/js/timeOffset.js', function () {
                loadScript('modules/timeOffset/js/timeOffsetUI.js', function () {
                    // Initialize core module
                    if (typeof TimeOffset !== 'undefined') {
                        TimeOffset.init(csInterface);
                    }

                    isInitialized = true;
                    console.log('TimeOffset initialized');
                });
            });
        });
    }

    /**
     * Render the module (called when tab becomes active)
     */
    function render(container) {
        if (!container) {
            console.error('TimeOffset render: No container provided');
            return;
        }

        console.log('Rendering TimeOffset...');

        container.innerHTML = '';
        currentContainer = container;

        const modulePane = document.createElement('div');
        modulePane.id = 'timeOffset';
        modulePane.className = 'module-content';
        container.appendChild(modulePane);

        // Wait for initialization if needed
        if (!isInitialized) {
            const checkInterval = setInterval(() => {
                if (isInitialized && typeof TimeOffsetUI !== 'undefined') {
                    clearInterval(checkInterval);
                    initializeUI(modulePane);
                }
            }, 50);

            setTimeout(() => {
                clearInterval(checkInterval);
                if (!isInitialized) {
                    console.error('TimeOffset initialization timeout');
                    modulePane.innerHTML = `
                        <div style="padding: 20px; color: #ff6b6b;">
                            <h3>Time Offset</h3>
                            <p>Failed to load module</p>
                        </div>
                    `;
                }
            }, 5000);
        } else {
            initializeUI(modulePane);
        }
    }

    /**
     * Initialize the UI
     */
    function initializeUI(modulePane) {
        if (typeof TimeOffsetUI !== 'undefined' && TimeOffsetUI.init) {
            TimeOffsetUI.init(csInterface, modulePane);
        } else {
            console.warn('TimeOffsetUI not available');
        }
    }

    /**
     * Cleanup the module (called when switching away from tab)
     */
    function cleanup(container) {
        if (!container) return;

        console.log('Cleaning up TimeOffset...');

        // Cleanup UI
        if (typeof TimeOffsetUI !== 'undefined' && TimeOffsetUI.cleanup) {
            TimeOffsetUI.cleanup();
        }

        container.innerHTML = '';
        currentContainer = null;
    }

    /**
     * Load a script dynamically
     */
    function loadScript(url, callback) {
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
        script.onerror = () => {
            console.error('Error loading script:', url);
        };
        document.head.appendChild(script);
        loadedScripts.push(script);
    }

    // Public API
    return {
        init: init,
        render: render,
        cleanup: cleanup
    };
})();