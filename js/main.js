/**
 * Main Application Entry Point
 * Handles initialization and module management
 */

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

        if (typeof TabManager === 'undefined') {
            console.error('TabManager is not defined. Retrying...');
            setTimeout(initialize, 50);
            return;
        }

        console.log('Initializing BT Tools extension...');

        const csInterface = new CSInterface();

        // Get the extension path and pass it to the JSX engine
        const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
        csInterface.evalScript(`var g_extensionPath = "${extensionPath.replace(/\\/g, '\\\\')}";`, function (result) {
            console.log('Extension path set in JSX');
        });

        // Test JSX connection
        csInterface.evalScript('testConnection()', function (result) {
            try {
                const response = JSON.parse(result);
                if (response.result) {
                    console.log('JSX connection successful:', response.result);
                }
            } catch (e) {
                console.warn('JSX connection test:', e);
            }
        });

        // Initialize the module loader with CSInterface
        ModuleLoader.init(csInterface);

        // Initialize the tab manager
        // TabManager will handle loading modules on demand
        console.log('Initializing tab manager...');
        TabManager.init(csInterface);

        console.log('BT Tools initialized successfully');

        // Show success notification if available
        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.success('BT Tools initialized');
        }
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();