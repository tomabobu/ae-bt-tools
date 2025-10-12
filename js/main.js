(function () {
    'use strict';

    function initialize() {
        // Check if dependencies are available
        if (typeof ModuleConfig === 'undefined') {
            console.error('ModuleConfig is not defined. Retrying...');
            setTimeout(initialize, 50);
            return;
        }

        if (typeof ModuleLoader === 'undefined') {
            console.error('ModuleLoader is not defined. Retrying...');
            setTimeout(initialize, 50);
            return;
        }

        // console.log('Initializing extension...');

        const csInterface = new CSInterface();
        const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
        csInterface.evalScript(`var g_extensionPath = "${extensionPath.replace(/\\/g, '\\\\')}";`);

        let currentModule = null;

        /**
         * Setup module tabs
         */
        function setupModuleTabs() {
            const tabNav = document.getElementById('tab-nav');
            const tabContent = document.getElementById('tab-content');

            if (!tabNav || !tabContent) {
                console.error('Tab navigation or content container not found');
                return;
            }

            Object.keys(ModuleConfig).forEach((moduleId, index) => {
                const displayName = ModuleConfig[moduleId];

                // Create tab button
                const tabButton = document.createElement('button');
                tabButton.className = 'tab-button' + (index === 0 ? ' active' : '');
                tabButton.setAttribute('data-tab', moduleId);
                tabButton.textContent = displayName;
                tabNav.appendChild(tabButton);

                // Create tab content container
                const tabPane = document.createElement('div');
                tabPane.id = moduleId;
                tabPane.className = 'tab-pane' + (index === 0 ? ' active' : '');
                tabContent.appendChild(tabPane);

                // Add click event for tab with lazy loading
                tabButton.addEventListener('click', function () {
                    switchToModule(moduleId);
                });
            });

            // console.log('Module tabs created');
        }

        /**
         * Switch to a specific module, loading it if necessary
         */
        function switchToModule(moduleId) {
            // console.log('Switching to module:', moduleId);

            // Update tab UI
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });

            const activeButton = document.querySelector(`[data-tab="${moduleId}"]`);
            const activePane = document.getElementById(moduleId);

            if (activeButton) activeButton.classList.add('active');
            if (activePane) activePane.classList.add('active');

            // Unload previous module
            if (currentModule && currentModule !== moduleId) {
                // console.log('Unloading previous module:', currentModule);
                ModuleLoader.unloadModule(currentModule);
            }

            // Load new module if not already loaded
            if (!ModuleLoader.getModule(moduleId)) {
                // console.log('Loading module:', moduleId);
                ModuleLoader.loadModule(moduleId, csInterface)
                    .then(() => {
                        // console.log(`Module ${moduleId} loaded successfully`);
                        currentModule = moduleId;
                    })
                    .catch(error => {
                        console.error(`Error loading module ${moduleId}:`, error);
                    });
            } else {
                // console.log('Module already loaded:', moduleId);
                currentModule = moduleId;
            }
        }

        // Setup the UI
        setupModuleTabs();

        // Load only the first module initially
        const firstModule = Object.keys(ModuleConfig)[0];
        if (firstModule) {
            // console.log('Loading first module:', firstModule);
            switchToModule(firstModule);
        }
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();