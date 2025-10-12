/**
 * Color Swatches UI Module
 */
var ColorSwatchesUI = (function () {
    // Private variables
    let csInterface;
    let statusTimeout;
    let defaultSwatchSize = 30;
    let library = null;
    let defaultHideCollapsedGroups = false;
    let defaultHideGroupNames = false;

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
            if (!library.swatchSize) {
                library.swatchSize = defaultSwatchSize;
            }
            if (!Object.hasOwn(library, 'hideCollapsedGroups')) {
                library.hideCollapsedGroups = defaultHideCollapsedGroups;
            }
            if (!Object.hasOwn(library, 'hideGroupNames')) {
                library.hideGroupNames = defaultHideGroupNames;
            }


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
                                    <input type="range" id="swatch-size-slider" min="3" max="100" value="${library.swatchSize}">
                                </div>
                                <div class="control-group">
                                    <label class="checkbox-container">
                                        <input type="checkbox" id="hideGroupNames" >
                                        <span class="checkmark"></span>
                                        Hide Group Names
                                    </label>
                                </div>
                                <div class="control-group">
                                    <label class="checkbox-container">
                                        <input type="checkbox" id="hideCollapsedGroups">
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
            populateSwatches();
            setupEventListeners();
            addCheckboxListener("hideCollapsedGroups", "hideCollapsedGroups");
            addCheckboxListener("hideGroupNames", "hideGroupNames");
        });


    }

    /**
     * Populate the UI with swatches from the library
     */
    function populateSwatches() {
        const swatchArea = document.getElementById('swatch-area');
        swatchArea.innerHTML = '';

        if (!library || !library.groups) {
            NotificationSystem.error('Error loading library');
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
            if (library.hideGroupNames) {
                groupElement.innerHTML = `<div class="group-swatches" id="group-${groupIndex}">`;
            }
            let show = true;

            if (group.collapsed && library.hideCollapsedGroups) {
                show = false;
            }

            if (show) {
                swatchArea.appendChild(groupElement);
            }

            // Add swatches to group
            const swatchesContainer = groupElement.querySelector(`#group-${groupIndex}`);

            if ((!group.collapsed || library.hideGroupNames) && group.swatches) {
                group.swatches.forEach((swatch, swatchIndex) => {
                    const swatchElement = document.createElement('div');
                    swatchElement.className = 'color-swatch';
                    swatchElement.title = `${swatch.name} ${swatch.hex}`;
                    swatchElement.style.backgroundColor = swatch.hex;
                    swatchElement.style.width = swatchElement.style.height = `${library.swatchSize}px`;
                    swatchElement.dataset.groupIndex = groupIndex;
                    swatchElement.dataset.swatchIndex = swatchIndex;
                    swatchesContainer.appendChild(swatchElement);
                });
            }
        });

        // Add event listeners to swatches and group toggles
        addSwatchEventListeners();
        addGroupToggleListeners();

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
                NotificationSystem.success(`Copied ${hex} to clipboard`);
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
    function addCheckboxListener(elementId, propName) {

        const checkbox = document.getElementById(elementId);

        // Update initial status based on loaded data
        if (checkbox) {
            // Set the checkbox state to match the loaded setting
            checkbox.checked = library[propName];

            // If using custom checkmark styling, you might need to trigger visual updates
            if (library[propName]) {
                checkbox.parentElement.classList.add('checked');
            } else {
                checkbox.parentElement.classList.remove('checked');
            }
        }


        // Add listener
        if (checkbox) {
            checkbox.addEventListener('change', function () {
                library[propName] = this.checked;

                ColorSwatches.updateProp(library[propName], propName, function () {
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
                                NotificationSystem.success('Library imported successfully');
                            });
                        } else {
                            NotificationSystem.error('Failed to import library');
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
                                NotificationSystem.success('Library added successfully');
                            });
                        } else {
                            NotificationSystem.error('Failed to add library');
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
                    NotificationSystem.success('Library exported successfully');
                } else {
                    NotificationSystem.error('Failed to export library');
                }
            });
        });


        // Clear button
        document.getElementById('btn-clear').addEventListener('click', function () {
            ModalSystem.confirm('Clear the library? This cannot be undone.', {
                title: 'Clear Library',
                confirmText: 'Clear',
                cancelText: 'Cancel'
            }).then((confirmed) => {
                if (confirmed) {
                    ColorSwatches.clearLibrary(function (success) {
                        if (success) {
                            ColorSwatches.loadLibrary(function (lib) {
                                library = lib;
                                populateSwatches();
                                NotificationSystem.success('Library cleared');
                            });
                        } else {
                            NotificationSystem.error('Failed to clear library');
                        }
                    });
                }
            });
        });

        // Swatch size slider
        document.getElementById('swatch-size-slider').addEventListener('input', function () {
            library.swatchSize = parseInt(this.value);
            ColorSwatches.updateProp(library.swatchSize, "swatchSize", function () {
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
            <div class="menu-item" data-action="editHex">Edit by HEX...</div>
            <div class="menu-item" data-action="delete">Delete</div>
            <div class="menu-item" data-action="copy">Copy HEX</div>
        `;

        document.body.appendChild(menu);

        // Add event listeners to menu items
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function () {
                const action = this.dataset.action;

                switch (action) {
                    case 'editHex':
                        ModalSystem.prompt('Enter HEX color value:', swatch.hex || '#FFFFFF', {
                            title: 'Edit Swatch HEX',
                            placeholder: '#FF0000',
                            helperText: 'Format: #RGB or #RRGGBB',
                            validator: (value) => {
                                const trimmed = value.trim();
                                if (!trimmed) return 'HEX value is required';
                                if (!/^#([0-9A-F]{3}){1,2}$/i.test(trimmed)) {
                                    return 'Invalid HEX format. Use #RGB or #RRGGBB';
                                }
                                return true;
                            }
                        }).then((newHex) => {
                            if (newHex) {
                                ColorSwatches.updateSwatch(groupIndex, swatchIndex, { hex: newHex.toUpperCase() }, function () {
                                    ColorSwatches.loadLibrary(function (lib) {
                                        library = lib;
                                        populateSwatches();
                                    });
                                });
                            }
                        });
                        break;
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
                        NotificationSystem.success(`Copied ${swatch.hex} to clipboard`);
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

    // Public API
    return {
        init: init
    };
})();
