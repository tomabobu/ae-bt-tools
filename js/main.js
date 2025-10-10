document.addEventListener('DOMContentLoaded', function () {
    const csInterface = new CSInterface();

    // Get the extension path
    const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);

    // Pass it to the JSX engine
    csInterface.evalScript(`var g_extensionPath = "${extensionPath.replace(/\\/g, '\\\\')}";`);


    // Create tabs and content containers based on module config
    function setupModuleTabs() {
        const tabNav = document.getElementById('tab-nav');
        const tabContent = document.getElementById('tab-content');

        // Create tabs and content containers for each module
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

            // Add click event for tab
            tabButton.addEventListener('click', function () {
                // Remove active class from all buttons and panes
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });

                // Add active class to current button and pane
                this.classList.add('active');
                document.getElementById(moduleId).classList.add('active');
            });
        });
    }

    // Initialize the UI
    setupModuleTabs();

    // Load all modules
    ModuleLoader.loadModules(csInterface).then(() => {
        console.log('All modules loaded successfully');
    }).catch(error => {
        console.error('Error loading modules:', error);
    });
});
