/**
 * Color Swatches UI Module
 */
var ColorSwatchesUI = (function () {
    // Private variables
    let csInterface;
    let statusTimeout;
    let swatchSize = 30;
    let library = null;
    let hideCollapsedGroups = false;

    /**
     * Initialize the UI
     */
    function init(cs) {
        csInterface = cs;
        ColorSwatches.init(cs);

        // Create module UI container
        const container = document.getElementById('colorSwatches');

        // Build the UI
        buildUI(container);
    }

    /**
     * Build the main UI
     */
    function buildUI(container) {
        // Load the library and populate UI
        ColorSwatches.loadLibrary(function (lib) {
            library = lib;
            if (library.swatchSize) {
                swatchSize = library.swatchSize;
            }
            if (Object.hasOwn(library, 'hideCollapsedGroups')) {
                console.log('library:', library.hideCollapsedGroups);
                hideCollapsedGroups = library.hideCollapsedGroups;
            }
            console.log(library.hideCollapsedGroups);
            populateSwatches();
            setupEventListeners();
        });
        container.innerHTML = `
            <div class="color-swatches-container">
                <div class="scroll-container" id="swatch-scroll-container">
                    <div id="swatch-area"></div>
                   
                    <!-- Status message -->
                    <div class="status-text" id="status-message"></div>
                    
                    <!-- Management section -->
                    <div class="management-section">
                    <div class="section-header" id="manage-header">
                    <button class="toggle-btn" id="manage-toggle">▼</button>
                    <h3>Library Management</h3>
                    </div>
                    <div class="section-content" id="manage-content">
                            <!-- Swatch size slider -->
                            <div class="slider-container">
                                <label for="swatch-size-slider">Swatch Size:</label>
                                <input type="range" id="swatch-size-slider" min="3" max="100" value="${swatchSize}">
                            </div>
                            <div class="control-group">
                                <label class="checkbox-container">
                                    <input type="checkbox" id="hideCollapsedGroups" ${hideCollapsedGroups ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Hide Collapsed Groups
                                </label>
                            </div>
                            <button id="btn-import-replace" class="btn-full">Import (Replace)</button>
                            <button id="btn-import-add" class="btn-full">Import (Add)</button>
                            <button id="btn-export" class="btn-full">Export</button>
                            <button id="btn-clear" class="btn-full">Clear</button>
                        </div>
                    </div>
                      
                    
                  
                </div>
            </div>
        `;


    }

    /**
     * Populate the UI with swatches from the library
     */
    function populateSwatches() {
        const swatchArea = document.getElementById('swatch-area');
        swatchArea.innerHTML = '';

        if (!library || !library.groups) {
            showStatus('Error loading library', 'error');
            return;
        }

        // Create groups and swatches
        library.groups.forEach((group, groupIndex) => {
            const groupElement = document.createElement('div');
            groupElement.className = 'swatch-group';
            groupElement.innerHTML = `
                <div class="group-header">
                    <button class="toggle-btn" data-group-index="${groupIndex}">${group.collapsed ? '►' : '▼'}</button>
                    <span>${group.name}</span>
                </div>
                <div class="group-swatches ${group.collapsed ? 'hidden' : ''}" id="group-${groupIndex}">
                </div>
            `;
            if (!(group.collapsed && hideCollapsedGroups)) {
                swatchArea.appendChild(groupElement);
            }

            // Add swatches to group
            const swatchesContainer = groupElement.querySelector(`#group-${groupIndex}`);

            if (!group.collapsed && group.swatches) {
                group.swatches.forEach((swatch, swatchIndex) => {
                    const swatchElement = document.createElement('div');
                    swatchElement.className = 'color-swatch';
                    swatchElement.title = `${swatch.name} ${swatch.hex}`;
                    swatchElement.style.backgroundColor = swatch.hex;
                    swatchElement.style.width = swatchElement.style.height = `${swatchSize}px`;
                    swatchElement.dataset.groupIndex = groupIndex;
                    swatchElement.dataset.swatchIndex = swatchIndex;
                    swatchesContainer.appendChild(swatchElement);
                });
            }
        });

        // Add event listeners to swatches and group toggles
        addSwatchEventListeners();
        addGroupToggleListeners();
        addCheckboxListener();
    }

    /**
     * Add event listeners to swatches
     */
    function addSwatchEventListeners() {
        const swatches = document.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            // Click to copy color
            swatch.addEventListener('click', function () {
                const groupIndex = parseInt(this.dataset.groupIndex);
                const swatchIndex = parseInt(this.dataset.swatchIndex);
                const hex = library.groups[groupIndex].swatches[swatchIndex].hex;

                ColorSwatches.copyToClipboard(hex);
                showStatus(`Copied ${hex} to clipboard`);
            });

            // Context menu
            swatch.addEventListener('contextmenu', function (e) {
                e.preventDefault();

                const groupIndex = parseInt(this.dataset.groupIndex);
                const swatchIndex = parseInt(this.dataset.swatchIndex);
                const swatchData = library.groups[groupIndex].swatches[swatchIndex];

                showSwatchContextMenu(e.clientX, e.clientY, swatchData, groupIndex, swatchIndex);
            });
        });
    }

    /**
     * Add event listeners to group toggle buttons and headers
     */
    function addGroupToggleListeners() {
        // Add listeners to toggle buttons
        const toggleBtns = document.querySelectorAll('.group-header .toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation(); // Prevent event from bubbling to header
                const groupIndex = parseInt(this.dataset.groupIndex);
                toggleGroupState(groupIndex);
            });
        });

        // Add listeners to entire group headers
        const headers = document.querySelectorAll('.group-header');
        headers.forEach(header => {
            header.addEventListener('click', function () {
                // Find the toggle button inside this header and get its group index
                const toggleBtn = this.querySelector('.toggle-btn');
                if (toggleBtn) {
                    const groupIndex = parseInt(toggleBtn.dataset.groupIndex);
                    toggleGroupState(groupIndex);
                }
            });
        });

        // Common function to handle toggling a group
        function toggleGroupState(groupIndex) {
            ColorSwatches.toggleGroup(groupIndex, function () {
                // Reload library after toggling
                ColorSwatches.loadLibrary(function (lib) {
                    library = lib;
                    populateSwatches();
                });
            });
        }
    }


    /**
     * Add event listeners to group checkbox
     */
    function addCheckboxListener() {

        const hideCollapsedCheckbox = document.getElementById('hideCollapsedGroups');

        // Update initial status based on loaded data
        if (hideCollapsedCheckbox) {
            // Set the checkbox state to match the loaded setting
            hideCollapsedCheckbox.checked = hideCollapsedGroups;

            // If using custom checkmark styling, you might need to trigger visual updates
            if (hideCollapsedGroups) {
                hideCollapsedCheckbox.parentElement.classList.add('checked');
            } else {
                hideCollapsedCheckbox.parentElement.classList.remove('checked');
            }
        }


        // Add listener
        if (hideCollapsedCheckbox) {
            hideCollapsedCheckbox.addEventListener('change', function () {
                hideCollapsedGroups = this.checked;

                ColorSwatches.updateHideCollapsedGroups(hideCollapsedGroups, function () {
                    // Reload library after toggling
                    ColorSwatches.loadLibrary(function (lib) {
                        library = lib;
                        populateSwatches();
                    });
                });
            });
        }

    }



    /**
     * Set up event listeners for buttons and controls
     */
    function setupEventListeners() {
        // Management toggle
        const manageToggle = document.getElementById('manage-toggle');
        const manageContent = document.getElementById('manage-content');

        manageToggle.addEventListener('click', function () {
            const isVisible = manageContent.style.display !== 'none';
            manageContent.style.display = isVisible ? 'none' : 'flex';
            this.textContent = isVisible ? '►' : '▼';
        });

        // Import Replace button
        document.getElementById('btn-import-replace').addEventListener('click', function () {
            openFileDialog('.json', function (fileContent) {
                if (fileContent) {
                    ColorSwatches.importLibrary(fileContent, true, function (success) {
                        if (success) {
                            ColorSwatches.loadLibrary(function (lib) {
                                library = lib;
                                populateSwatches();
                                showStatus('Library imported successfully', 'success');
                            });
                        } else {
                            showStatus('Failed to import library', 'error');
                        }
                    });
                }
            });
        });

        // Import Add button
        document.getElementById('btn-import-add').addEventListener('click', function () {
            openFileDialog('.json', function (fileContent) {
                if (fileContent) {
                    ColorSwatches.importLibrary(fileContent, false, function (success) {
                        if (success) {
                            ColorSwatches.loadLibrary(function (lib) {
                                library = lib;
                                populateSwatches();
                                showStatus('Library added successfully', 'success');
                            });
                        } else {
                            showStatus('Failed to add library', 'error');
                        }
                    });
                }
            });
        });

        // Export button
        document.getElementById('btn-export').addEventListener('click', function () {
            var defaultName = 'swatchLibrary.json';
            csInterface.evalScript(`callModuleFunction("colorSwatches", "saveFileFromJSX", ['${defaultName}','${JSON.stringify(library)}'])`, function (success) {
                if (JSON.parse(success).result === "success") {
                    showStatus('Library exported successfully', 'success');
                } else {
                    showStatus('Failed to export library', 'error');
                }
            });
        });


        // Clear button
        document.getElementById('btn-clear').addEventListener('click', function () {
            if (confirm('Clear the library? This cannot be undone.')) {
                ColorSwatches.clearLibrary(function (success) {
                    if (success) {
                        ColorSwatches.loadLibrary(function (lib) {
                            library = lib;
                            populateSwatches();
                            showStatus('Library cleared', 'success');
                        });
                    } else {
                        showStatus('Failed to clear library', 'error');
                    }
                });
            }
        });

        // Swatch size slider
        document.getElementById('swatch-size-slider').addEventListener('input', function () {
            swatchSize = parseInt(this.value);
            ColorSwatches.updateSize(swatchSize, function () {
                // Reload library after toggling
                ColorSwatches.loadLibrary(function (lib) {
                    library = lib;
                    populateSwatches();
                });
            });
        });

        // Click outside to close context menu
        document.addEventListener('click', function (e) {
            const contextMenu = document.getElementById('context-menu');
            if (contextMenu && !contextMenu.contains(e.target)) {
                contextMenu.remove();
            }
        });
    }

    /**
     * Show context menu for a swatch
     */
    function showSwatchContextMenu(x, y, swatch, groupIndex, swatchIndex) {
        // Remove any existing context menu
        const existingMenu = document.getElementById('context-menu');
        if (existingMenu) existingMenu.remove();

        // Create context menu
        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.className = 'context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        menu.innerHTML = `
            <div class="menu-item" data-action="edit">Edit</div>
            <div class="menu-item" data-action="delete">Delete</div>
            <div class="menu-item" data-action="copy">Copy HEX</div>
        `;

        document.body.appendChild(menu);

        // Add event listeners to menu items
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function () {
                const action = this.dataset.action;

                switch (action) {
                    case 'edit':
                        showColorPicker(swatch.hex, function (newHex) {
                            if (newHex) {
                                ColorSwatches.updateSwatch(groupIndex, swatchIndex, { hex: newHex }, function () {
                                    ColorSwatches.loadLibrary(function (lib) {
                                        library = lib;
                                        populateSwatches();
                                    });
                                });
                            }
                        });
                        break;

                    case 'delete':
                        ColorSwatches.deleteSwatch(groupIndex, swatchIndex, function () {
                            ColorSwatches.loadLibrary(function (lib) {
                                library = lib;
                                populateSwatches();
                            });
                        });
                        break;

                    case 'copy':
                        ColorSwatches.copyToClipboard(swatch.hex);
                        showStatus(`Copied ${swatch.hex} to clipboard`);
                        break;
                }

                menu.remove();
            });
        });
    }

    /**
     * Show a color picker dialog
     */
    function showColorPicker(initialColor, callback) {
        // Create color picker input
        const input = document.createElement('input');
        input.type = 'color';
        input.value = initialColor;

        // Add event listener for when color is selected
        input.addEventListener('change', function () {
            callback(this.value.toUpperCase());
        });

        // Click the input to open the color picker
        input.click();
    }

    /**
     * Open a file dialog
     */
    function openFileDialog(fileType, callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = fileType;

        input.onchange = function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    callback(event.target.result);
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }



    /**
     * Show status message
     */
    function showStatus(message, type) {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = 'status-text ' + (type || 'info');

        // Clear previous timeout
        if (statusTimeout) {
            clearTimeout(statusTimeout);
        }

        // Auto hide after 3 seconds
        statusTimeout = setTimeout(function () {
            statusElement.textContent = '';
            statusElement.className = 'status-text';
        }, 3000);
    }

    // Public API
    return {
        init: init
    };
})();
