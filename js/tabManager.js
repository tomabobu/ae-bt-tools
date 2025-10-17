/**
 * Tab Manager - Handles multi-module tabs with customizable layouts
 */
var TabManager = (function () {
    let csInterface;
    let currentConfig = null;
    let activeTabIndex = 0;
    const CONFIG_FILE_PATH = 'config.json';

    // Default configuration - each module in its own tab
    const DEFAULT_CONFIG = {
        tabs: [
            { modules: [{ id: 'bezierTangents', height: 100 }] },
            { modules: [{ id: 'colorSwatches', height: 100 }] },
            { modules: [{ id: 'guideGenerator', height: 100 }] }
        ]
    };

    /**
     * Initialize the tab manager
     */
    function init(cs) {
        csInterface = cs;
        loadConfiguration().then(() => {
            setupUI();
            setupEventListeners();
        });
    }

    /**
     * Load configuration from file
     */
    function loadConfiguration() {
        return new Promise((resolve) => {
            const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
            const configPath = extensionPath + '/js/' + CONFIG_FILE_PATH;

            csInterface.evalScript(`
                var configFile = new File("${configPath.replace(/\\/g, '\\\\')}");
                if (configFile.exists) {
                    configFile.open('r');
                    var content = configFile.read();
                    configFile.close();
                    content;
                } else {
                    '';
                }
            `, (result) => {
                if (result && result.trim()) {
                    try {
                        currentConfig = JSON.parse(result);
                        console.log('Configuration loaded:', currentConfig);
                    } catch (e) {
                        console.error('Error parsing config:', e);
                        currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
                    }
                } else {
                    console.log('No config file found, using defaults');
                    currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
                    saveConfiguration();
                }
                resolve();
            });
        });
    }

    /**
     * Save configuration to file
     */
    function saveConfiguration() {
        return new Promise((resolve, reject) => {
            const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
            const configPath = extensionPath + '/js/' + CONFIG_FILE_PATH;
            const configJSON = JSON.stringify(currentConfig, null, 2);

            csInterface.evalScript(`
                var configFile = new File("${configPath.replace(/\\/g, '\\\\')}");
                configFile.open('w');
                configFile.write(${JSON.stringify(configJSON)});
                configFile.close();
                'success';
            `, (result) => {
                if (result === 'success') {
                    console.log('Configuration saved');
                    resolve();
                } else {
                    console.error('Error saving configuration');
                    reject();
                }
            });
        });
    }

    /**
     * Setup the UI based on current configuration
     */
    function setupUI() {
        const tabNav = document.getElementById('tab-nav');
        const tabContent = document.getElementById('tab-content');

        // Clear existing content
        tabNav.innerHTML = '';
        tabContent.innerHTML = '';

        // Create tabs
        currentConfig.tabs.forEach((tab, index) => {
            createTab(tab, index);
        });

        // Activate first tab
        if (currentConfig.tabs.length > 0) {
            activateTab(0);
        }
    }

    /**
     * Create a single tab
     */
    function createTab(tab, index) {
        const tabNav = document.getElementById('tab-nav');
        const tabContent = document.getElementById('tab-content');

        // Create tab button
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.setAttribute('data-tab-index', index);

        // Tab label
        const label = getTabLabel(tab);
        tabButton.textContent = label;

        tabNav.appendChild(tabButton);

        // Create tab content container
        const tabPane = document.createElement('div');
        tabPane.className = 'tab-pane';
        tabPane.setAttribute('data-tab-index', index);

        // Create module containers within the tab
        tab.modules.forEach((moduleData, moduleIndex) => {
            const moduleContainer = createModuleContainer(moduleData, index, moduleIndex);
            tabPane.appendChild(moduleContainer);

            // Add divider between modules (except after last module)
            if (moduleIndex < tab.modules.length - 1) {
                const divider = createDivider(index, moduleIndex);
                tabPane.appendChild(divider);
            }
        });

        tabContent.appendChild(tabPane);
    }

    /**
     * Get label for a tab based on its modules
     */
    function getTabLabel(tab) {
        if (tab.modules.length === 1) {
            return ModuleConfig[tab.modules[0].id] || tab.modules[0].id;
        } else {
            return tab.modules.map(m => {
                const name = ModuleConfig[m.id] || m.id;
                return name.split(' ')[0];
            }).join(' + ');
        }
    }

    /**
     * Create a module container
     */
    function createModuleContainer(moduleData, tabIndex, moduleIndex) {
        const container = document.createElement('div');
        container.className = 'module-container';
        container.id = `${moduleData.id}-container-${tabIndex}-${moduleIndex}`;
        container.setAttribute('data-module-id', moduleData.id);
        container.setAttribute('data-tab-index', tabIndex);
        container.setAttribute('data-module-index', moduleIndex);
        container.style.height = moduleData.height + '%';

        return container;
    }

    /**
     * Create a divider between modules
     */
    function createDivider(tabIndex, moduleIndex) {
        const divider = document.createElement('div');
        divider.className = 'module-divider';
        divider.setAttribute('data-tab-index', tabIndex);
        divider.setAttribute('data-module-index', moduleIndex);

        // Create swap button
        const swapButton = document.createElement('button');
        swapButton.className = 'divider-swap-btn';
        swapButton.innerHTML = '⇅';
        swapButton.title = 'Swap modules';
        divider.appendChild(swapButton);

        setupDividerDrag(divider);
        setupSwapButton(swapButton, tabIndex, moduleIndex);

        return divider;
    }

    /**
     * Setup drag functionality for divider
     */
    function setupDividerDrag(divider) {
        let isDragging = false;
        let startY = 0;
        let startHeight1 = 0;
        let startHeight2 = 0;
        let container1, container2;

        divider.addEventListener('mousedown', function (e) {
            if (e.target.classList.contains('divider-swap-btn')) return;

            isDragging = true;
            startY = e.clientY;

            const tabIndex = parseInt(divider.getAttribute('data-tab-index'));
            const moduleIndex = parseInt(divider.getAttribute('data-module-index'));

            const tabPane = document.querySelector(`.tab-pane[data-tab-index="${tabIndex}"]`);
            const containers = tabPane.querySelectorAll('.module-container');
            container1 = containers[moduleIndex];
            container2 = containers[moduleIndex + 1];

            startHeight1 = parseFloat(container1.style.height);
            startHeight2 = parseFloat(container2.style.height);

            document.body.style.cursor = 'ns-resize';
            divider.classList.add('dragging');
            e.preventDefault();
        });

        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;

            const tabPane = container1.parentElement;
            const tabPaneHeight = tabPane.clientHeight;
            const deltaY = e.clientY - startY;
            const deltaPercent = (deltaY / tabPaneHeight) * 100;

            let newHeight1 = startHeight1 + deltaPercent;
            let newHeight2 = startHeight2 - deltaPercent;

            // Clamp heights to reasonable values (10% minimum)
            if (newHeight1 < 10) {
                newHeight1 = 10;
                newHeight2 = startHeight1 + startHeight2 - 10;
            } else if (newHeight2 < 10) {
                newHeight2 = 10;
                newHeight1 = startHeight1 + startHeight2 - 10;
            }

            container1.style.height = newHeight1 + '%';
            container2.style.height = newHeight2 + '%';
        });

        document.addEventListener('mouseup', function () {
            if (!isDragging) return;

            isDragging = false;
            document.body.style.cursor = '';
            divider.classList.remove('dragging');

            // Save the new heights to configuration
            const tabIndex = parseInt(divider.getAttribute('data-tab-index'));
            const moduleIndex = parseInt(divider.getAttribute('data-module-index'));

            currentConfig.tabs[tabIndex].modules[moduleIndex].height = parseFloat(container1.style.height);
            currentConfig.tabs[tabIndex].modules[moduleIndex + 1].height = parseFloat(container2.style.height);

            saveConfiguration();
        });
    }

    /**
     * Setup swap button functionality
     */
    function setupSwapButton(button, tabIndex, moduleIndex) {
        button.addEventListener('click', function (e) {
            e.stopPropagation();

            const tab = currentConfig.tabs[tabIndex];
            const temp = tab.modules[moduleIndex];
            tab.modules[moduleIndex] = tab.modules[moduleIndex + 1];
            tab.modules[moduleIndex + 1] = temp;

            saveConfiguration().then(() => {
                refreshCurrentTab();
                NotificationSystem.success('Modules swapped');
            });
        });
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        const tabNav = document.getElementById('tab-nav');

        // Tab click handler
        tabNav.addEventListener('click', function (e) {
            if (e.target.classList.contains('tab-button')) {
                const index = parseInt(e.target.getAttribute('data-tab-index'));
                activateTab(index);
            }
        });

        // Tab context menu handler
        tabNav.addEventListener('contextmenu', function (e) {
            if (e.target.classList.contains('tab-button')) {
                e.preventDefault();
                const index = parseInt(e.target.getAttribute('data-tab-index'));
                showTabContextMenu(e, index);
            }
        });
    }

    /**
     * Activate a tab
     */
    function activateTab(index) {
        // Cleanup current tab modules
        if (activeTabIndex !== null) {
            cleanupTab(activeTabIndex);
        }

        // Update active states
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        const tabButton = document.querySelector(`.tab-button[data-tab-index="${index}"]`);
        const tabPane = document.querySelector(`.tab-pane[data-tab-index="${index}"]`);

        if (tabButton && tabPane) {
            tabButton.classList.add('active');
            tabPane.classList.add('active');
            activeTabIndex = index;

            // Initialize modules in this tab
            initializeTabModules(index);
        }
    }

    /**
     * Initialize all modules in a tab (with lazy loading)
     */
    function initializeTabModules(tabIndex) {
        const tab = currentConfig.tabs[tabIndex];

        // Load all modules in this tab (lazy loading)
        const loadPromises = tab.modules.map((moduleData, moduleIndex) => {
            return ModuleLoader.loadModule(moduleData.id).then(() => {
                const containerId = `${moduleData.id}-container-${tabIndex}-${moduleIndex}`;
                const container = document.getElementById(containerId);

                if (container) {
                    const module = ModuleLoader.getModule(moduleData.id);
                    if (module && module.render) {
                        module.render(container);
                    }
                }
            }).catch(error => {
                console.error(`Error loading module ${moduleData.id}:`, error);
                NotificationSystem.error(`Failed to load module: ${ModuleConfig[moduleData.id]}`);
            });
        });

        // Wait for all modules to load
        Promise.all(loadPromises).then(() => {
            console.log(`All modules loaded for tab ${tabIndex}`);
        });
    }

    /**
     * Cleanup a tab's modules
     */
    function cleanupTab(tabIndex) {
        const tab = currentConfig.tabs[tabIndex];
        tab.modules.forEach((moduleData, moduleIndex) => {
            const containerId = `${moduleData.id}-container-${tabIndex}-${moduleIndex}`;
            const container = document.getElementById(containerId);

            if (container) {
                const module = ModuleLoader.getModule(moduleData.id);
                if (module && module.cleanup) {
                    module.cleanup(container);
                }
                container.innerHTML = '';
            }
        });
    }

    /**
     * Refresh the current tab
     */
    function refreshCurrentTab() {
        const oldIndex = activeTabIndex;

        // Cleanup all tabs before rebuilding
        for (let i = 0; i < currentConfig.tabs.length; i++) {
            cleanupTab(i);
        }

        // Rebuild entire UI
        setupUI();

        // Reactivate the same tab (or first tab if index is invalid)
        const newIndex = Math.min(oldIndex, currentConfig.tabs.length - 1);
        activateTab(newIndex);
    }

    /**
     * Show context menu for a tab
     */
    function showTabContextMenu(event, tabIndex) {
        const menuItems = [
            { label: 'Add Module', action: () => addModuleToTab(tabIndex) },
            { label: 'Remove Module', action: () => removeModuleFromTab(tabIndex) },
            { label: 'Move Tab ◀', action: () => moveTab(tabIndex, -1), disabled: tabIndex === 0 },
            { label: 'Move Tab ▶', action: () => moveTab(tabIndex, 1), disabled: tabIndex === currentConfig.tabs.length - 1 },
            { label: 'Reset Tabs', action: () => resetTabs() }
        ];

        showContextMenu(event, menuItems);
    }

    /**
     * Show a context menu at cursor position
     */
    function showContextMenu(event, items) {
        // Remove any existing context menu
        const existing = document.querySelector('.context-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';

        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            if (item.disabled) {
                menuItem.classList.add('disabled');
            }
            menuItem.textContent = item.label;

            menuItem.addEventListener('click', function () {
                if (!item.disabled) {
                    item.action();
                    menu.remove();
                }
            });

            menu.appendChild(menuItem);
        });

        document.body.appendChild(menu);

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 0);
    }

    /**
     * Add a module to a tab
     */
    function addModuleToTab(tabIndex) {
        const tab = currentConfig.tabs[tabIndex];
        const usedModules = tab.modules.map(m => m.id);
        const availableModules = Object.keys(ModuleConfig).filter(id => !usedModules.includes(id));

        if (availableModules.length === 0) {
            NotificationSystem.warning('All modules are already in this tab');
            return;
        }

        // Create dropdown content
        const options = availableModules.map(id =>
            `<option value="${id}">${ModuleConfig[id]}</option>`
        ).join('');

        ModalSystem.show({
            type: 'custom',
            content: `
                <div class="modal-header">
                    <h3>Add Module to Tab</h3>
                </div>
                <div class="modal-body">
                    <p>Select a module to add:</p>
                    <select id="module-select" class="modal-select">
                        ${options}
                    </select>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
                    <button class="modal-btn modal-btn-primary" data-action="confirm">Add</button>
                </div>
            `,
            onConfirm: () => {
                const select = document.getElementById('module-select');
                const moduleId = select.value;

                // Calculate height for new module
                const totalModules = tab.modules.length + 1;
                const newHeight = 100 / totalModules;

                // Adjust existing module heights
                tab.modules.forEach(m => {
                    m.height = newHeight;
                });

                // Add new module
                tab.modules.push({ id: moduleId, height: newHeight });

                saveConfiguration().then(() => {
                    refreshCurrentTab();
                    NotificationSystem.success('Module added to tab');
                });
            }
        });
    }

    /**
     * Remove a module from a tab
     */
    function removeModuleFromTab(tabIndex) {
        const tab = currentConfig.tabs[tabIndex];

        if (tab.modules.length === 1) {
            NotificationSystem.warning('Cannot remove the last module from a tab');
            return;
        }

        const options = tab.modules.map((m, i) =>
            `<option value="${i}">${ModuleConfig[m.id]}</option>`
        ).join('');

        ModalSystem.show({
            type: 'custom',
            content: `
                <div class="modal-header">
                    <h3>Remove Module from Tab</h3>
                </div>
                <div class="modal-body">
                    <p>Select a module to remove:</p>
                    <select id="module-select" class="modal-select">
                        ${options}
                    </select>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
                    <button class="modal-btn modal-btn-primary" data-action="confirm">Remove</button>
                </div>
            `,
            onConfirm: () => {
                const select = document.getElementById('module-select');
                const moduleIndex = parseInt(select.value);

                // Remove module
                tab.modules.splice(moduleIndex, 1);

                // Redistribute heights
                const newHeight = 100 / tab.modules.length;
                tab.modules.forEach(m => {
                    m.height = newHeight;
                });

                saveConfiguration().then(() => {
                    refreshCurrentTab();
                    NotificationSystem.success('Module removed from tab');
                });
            }
        });
    }

    /**
     * Move a tab left or right
     */
    function moveTab(tabIndex, direction) {
        const newIndex = tabIndex + direction;

        if (newIndex < 0 || newIndex >= currentConfig.tabs.length) {
            return;
        }

        // Swap tabs
        const temp = currentConfig.tabs[tabIndex];
        currentConfig.tabs[tabIndex] = currentConfig.tabs[newIndex];
        currentConfig.tabs[newIndex] = temp;

        saveConfiguration().then(() => {
            // Update active tab index
            if (activeTabIndex === tabIndex) {
                activeTabIndex = newIndex;
            } else if (activeTabIndex === newIndex) {
                activeTabIndex = tabIndex;
            }

            refreshCurrentTab();
            NotificationSystem.success('Tab moved');
        });
    }

    /**
     * Reset tabs to default configuration
     */
    function resetTabs() {
        ModalSystem.confirm(
            'Are you sure you want to reset all tabs to default? This will remove all customizations.',
            {
                title: 'Reset Tabs',
                confirmText: 'Reset',
                cancelText: 'Cancel'
            }
        ).then((confirmed) => {
            if (confirmed) {
                currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
                saveConfiguration().then(() => {
                    refreshCurrentTab();
                    NotificationSystem.success('Tabs reset to default');
                });
            }
        });
    }

    // Public API
    return {
        init: init,
        getConfig: () => currentConfig
    };
})();